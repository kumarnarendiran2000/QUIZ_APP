/**
 * Import function triggers from their respective submodules:
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {onCall} = require("firebase-functions/v2/https");
      // Construct the HTML body for the email.
      const testType = isPostTest ? "Post-Test" : "Pre-Test";
      let html = '';
      html += '<!DOCTYPE html>';
      html += '<html>';
      html += '<head>';
      html += '<meta charset="UTF-8">';
      html += '<meta name="viewport" content="width=device-width, initial-scale=1.0">';
      html += '<title>Quiz Results</title>';
      html += '<style>';
      html += '@media screen and (max-width: 600px) {';
      html += '  .two-column-table { display: block !important; }';
      html += '  .two-column-cell { display: block !important; width: 100% !important; }';
      html += '  .badge { display: block !important; margin: 5px 0 !important; }';
      html += '  .question-item { padding: 10px !important; }';
      html += '}';
      html += '</style>';
      html += '</head>';
      html += '<body>';
      html += `<div style="background:#f0f3fa;padding:32px 0;font-family:'Segoe UI',Arial,sans-serif;">`;


// Initialize Firebase Admin SDK.
admin.initializeApp();

// Set SendGrid API key from environment variables.
if (!process.env.SENDGRID_API_KEY) {
  console.error("FATAL ERROR: SENDGRID_API_KEY is not set.");
}
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/**
 * Sends a quiz result email to a user.
 * This function is triggered by an HTTPS call from the client.
 */
exports.sendQuizResultEmail = onCall(
    {
      region: "us-central1",
      memory: "256MiB",
      maxInstances: 10,
      timeoutSeconds: 60,
      cors: /.*/, // Allow requests from any domain.
    },
    async (request) => {
      // Ensure the user is authenticated.
      if (!request.auth) {
        throw new functions.https.HttpsError(
            "unauthenticated",
            "The function must be called while authenticated.",
        );
      }

      // Extract any frontend data passed to the function
      const frontendData = request.data || {};
      const {
        answers: frontendAnswers, 
        detailedResults: frontendDetailedResults,
        correctAnswers: frontendCorrectAnswers,
        allQuestions: frontendQuestions,
        quizDurationFromFrontend,
        testModeFromFrontend
      } = frontendData;

      console.log("Received frontend data:", JSON.stringify({
        hasAnswers: Array.isArray(frontendAnswers),
        hasDetailedResults: Array.isArray(frontendDetailedResults),
        hasCorrectAnswers: Array.isArray(frontendCorrectAnswers),
        hasAllQuestions: Array.isArray(frontendQuestions),
        answersLength: frontendAnswers?.length || 0,
        detailedResultsLength: frontendDetailedResults?.length || 0
      }));

      // Always fetch quiz response from Firestore for reliability
      let email = "", name = "", regno = "", mobile = "", quizDuration = "", isPostTest = false, score = 0, correct = 0, wrong = 0, total = 0, details = [];
      try {
        const userDoc = await admin.firestore().collection("quiz_responses").doc(request.auth.uid).get();
        if (userDoc.exists) {
          const data = userDoc.data();
          email = data.email || "";
          name = data.name || "";
          regno = data.regno || "";
          mobile = data.mobile || "";
          quizDuration = quizDurationFromFrontend || data.quizDuration || "";
          isPostTest = testModeFromFrontend === "post" || (testModeFromFrontend === undefined && (data.isPostTest !== undefined ? data.isPostTest : true));
          score = data.score !== undefined ? data.score : (data.correctCount !== undefined ? data.correctCount : 0);
          correct = data.correct !== undefined ? data.correct : (data.correctCount !== undefined ? data.correctCount : 0);
          wrong = data.wrong !== undefined ? data.wrong : (data.wrongCount !== undefined ? data.wrongCount : 0);
          total = data.total !== undefined ? data.total : (Array.isArray(data.answers) ? data.answers.length : 0);
          details = data.detailedResults || data.details || [];
        } else {
          throw new functions.https.HttpsError("not-found", "Quiz response not found in Firestore.");
        }
      } catch (e) {
        console.error("Failed to fetch quiz response from Firestore:", e);
        throw new functions.https.HttpsError("internal", "Failed to fetch quiz response from Firestore.");
      }

      // Calculate answered and unanswered counts
      // Ensure details is a full array of question objects in order, with question text, correct answer, user answer, etc.
      // If details is missing question text, fetch from questions.js
      let questionsList = [];
      try {
        // First try to use questions from frontend
        if (Array.isArray(frontendQuestions) && frontendQuestions.length > 0) {
          questionsList = frontendQuestions;
          console.log("Using questions from frontend data");
        } else {
          // Fallback to loading from questions.js
          questionsList = require("../src/data/questions.js").questions;
          console.log("Using questions from local questions.js file");
        }
      } catch (e) {
        console.error("Could not load questions for email details:", e);
      }

      // Build a normalized details array in order, with question text, correct answer, user answer, isCorrect, wasAnswered
      // Map user answers to questions by question index, so all questions (answered or not) are included in order
      let normalizedDetails = [];
      
      // Prefer frontend answers over Firestore answers if provided
      let userAnswers = [];
      if (Array.isArray(frontendAnswers) && frontendAnswers.length > 0) {
        userAnswers = frontendAnswers;
        console.log(`Using ${frontendAnswers.length} answers from frontend data`);
      } else {
        // Fetch user answers from Firestore as fallback
        try {
          const userData = await admin.firestore().collection("quiz_responses").doc(request.auth.uid).get();
          if (userData.exists) {
            userAnswers = userData.data().answers || [];
            console.log(`Using ${userAnswers.length} answers from Firestore`);
          }
        } catch (e) {
          console.error("Failed to fetch user answers from Firestore:", e);
        }
      }
      
      // Prefer frontend correct answers over Firestore if provided
      let correctAnswers = [];
      if (Array.isArray(frontendCorrectAnswers) && frontendCorrectAnswers.length > 0) {
        correctAnswers = frontendCorrectAnswers;
        console.log(`Using ${frontendCorrectAnswers.length} correct answers from frontend data`);
      } else {
        // Try to get correctAnswers from metadata as fallback
        try {
          const metaDoc = await admin.firestore().collection("quiz_metadata").doc("default").get();
          if (metaDoc.exists) {
            correctAnswers = metaDoc.data().correctAnswers || [];
            console.log(`Using ${correctAnswers.length} correct answers from Firestore`);
          }
        } catch (e) {
          console.error("Failed to fetch correct answers from Firestore:", e);
        }
      }
      
      if (Array.isArray(frontendDetailedResults) && frontendDetailedResults.length > 0) {
        // Use detailed results from frontend if provided
        console.log(`Using ${frontendDetailedResults.length} detailed results from frontend data`);
        normalizedDetails = frontendDetailedResults.map(q => ({
          question: q.question || '-',
          userAnswer: q.userAnswer || null,
          correctAnswer: q.correctAnswer || null,
          isCorrect: q.isCorrect === true,
          wasAnswered: q.wasAnswered === true,
          topic: q.topic || 'Other'
        }));
      } else if (questionsList.length > 0) {
        // Process all questions in order, whether answered or not
        console.log(`Building normalized details from ${questionsList.length} questions and ${userAnswers.length} answers`);
        for (let i = 0; i < questionsList.length; i++) {
          const qObj = questionsList[i];
          const userAnswerIdx = i < userAnswers.length ? userAnswers[i] : null;
          const correctAnswerIdx = i < correctAnswers.length ? correctAnswers[i] : (typeof qObj.correctAnswer === 'number' ? qObj.correctAnswer : null);
          
          const userAnswerText = (userAnswerIdx !== null && Array.isArray(qObj.options)) ? qObj.options[userAnswerIdx] : null;
          const correctAnswerText = (correctAnswerIdx !== null && Array.isArray(qObj.options)) ? qObj.options[correctAnswerIdx] : null;
          
          let isCorrect = false;
          if (userAnswerIdx !== null && correctAnswerIdx !== null) {
            isCorrect = userAnswerIdx === correctAnswerIdx;
          }
          
          normalizedDetails.push({
            question: qObj.question || '-',
            userAnswer: userAnswerText,
            correctAnswer: correctAnswerText,
            isCorrect,
            wasAnswered: userAnswerIdx !== null,
            topic: qObj.topic || 'Other'
          });
        }
      } else if (Array.isArray(details)) {
        // Fallback: use details as-is, but ensure we include indicators for unanswered questions
        console.log(`Using ${details.length} details from Firestore as fallback`);
        normalizedDetails = details.map(q => ({
          question: q.question || '-',
          userAnswer: q.userAnswer || null,
          correctAnswer: q.correctAnswer || null,
          isCorrect: q.isCorrect === true,
          wasAnswered: q.userAnswer !== null && q.userAnswer !== undefined,
          topic: q.topic || 'Other'
        }));
      }
      
      const answeredCount = normalizedDetails.filter(q => q.wasAnswered).length;
      const unansweredCount = normalizedDetails.length - answeredCount;

      // Use frontend provided score counts if available
      if (frontendData.correct !== undefined) {
        correct = frontendData.correct;
      }
      if (frontendData.wrong !== undefined) {
        wrong = frontendData.wrong;
      }
      if (frontendData.total !== undefined) {
        total = frontendData.total;
      } else if (normalizedDetails.length > 0) {
        // Use normalized details length as total if not provided
        total = normalizedDetails.length;
      }
      if (frontendData.score !== undefined) {
        score = frontendData.score;
      } else {
        // Update score based on normalizedDetails
        score = normalizedDetails.filter(q => q.isCorrect).length;
      }
      
      // Log important variables for debugging
      console.log("Email generation data:", {
        testModeFromFrontend,
        isPostTest,
        questionCount: normalizedDetails.length,
        answeredCount,
        unansweredCount
      });

      // Construct the HTML body for the email.
      const testType = isPostTest ? "Post-Test" : "Pre-Test";
      let html = '';
      html += `<div style="background:#f0f3fa;padding:32px 0;font-family:'Segoe UI',Arial,sans-serif;">
        <div style="max-width:650px;margin:0 auto;background:#fff;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.15);padding:36px 28px;">
          <div style="text-align:center;margin-bottom:28px;padding-bottom:20px;border-bottom:2px solid #e8eaf6;background:#f8f9ff;border-radius:10px;padding:20px;">
            <img src='https://dr-nk-bhat-skill-lab-test-app.pro/NET-Medical-College.png' alt='NET Medical College Logo' style='height:75px;margin-bottom:12px;' />
            <h2 style="margin:8px 0 0 0;color:#1a237e;font-size:1.8em;font-weight:700;">Dr. NK Bhat Skill Lab Quiz Team</h2>
            <p style="margin-top:10px;color:#555;font-style:italic;font-size:1.1em;">${testType} Quiz Results</p>
          </div>
          <div style="font-size:1.25em;margin-bottom:22px;line-height:1.4;text-align:center;">
            <span style="font-size:1.2em;">Dear <b>${name || "Participant"}</b>,</span><br>
            <span style="display:block;margin:12px 0 0 0;color:#444;font-style:italic;">Please find your quiz details below:</span>
          </div>
          
          <!-- Two-column container for user info and scores -->
          <div style="margin-bottom:28px;border-radius:12px;box-shadow:0 3px 10px rgba(0,0,0,0.1);overflow:hidden;">
            <!-- Header for the results panel -->
            <div style="background:#f0f4fa;text-align:center;padding:12px;border-bottom:2px solid #e8eaf6;">
              <span style="font-size:1.3em;font-weight:600;color:#1a237e;">Quiz Results - ${testType}</span>
            </div>
            
            <!-- Two-column layout with mobile responsiveness -->
            <div style="display:table;width:100%;table-layout:fixed;background:#fff;" class="two-column-table">
              <!-- Left column: Personal details -->
              <div style="display:table-cell;width:50%;padding:20px;vertical-align:top;font-size:1.15em;line-height:1.7;border-right:1px solid #e8eaf6;" class="two-column-cell">
                <div style="margin-bottom:8px;">
                  <span style="color:#303f9f;font-weight:600;">Name:</span> 
                  <span>${name || "-"}</span>
                </div>
                <div style="margin-bottom:8px;">
                  <span style="color:#303f9f;font-weight:600;">Registration Number:</span> 
                  <span>${regno || "-"}</span>
                </div>
                <div style="margin-bottom:8px;">
                  <span style="color:#303f9f;font-weight:600;">Mobile:</span> 
                  <span>${mobile || "-"}</span>
                </div>
                <div style="margin-bottom:8px;">
                  <span style="color:#303f9f;font-weight:600;">Email:</span> 
                  <span style="word-break:break-word;">${email || "-"}</span>
                </div>
              </div>
              
              <!-- Right column: Scores -->
              <div style="display:table-cell;width:50%;padding:20px;vertical-align:top;font-size:1.15em;line-height:1.7;background:#fafbff;" class="two-column-cell">
                <div style="margin-bottom:10px;">
                  <span style="color:#1a237e;font-weight:600;">Score:</span> 
                  <span style="font-size:1.2em;font-weight:700;color:#2e7d32;">${score} / ${total}</span>
                </div>
                
                <div style="margin-bottom:10px;">
                  <span style="display:inline-block;background:#e8f5e9;padding:4px 10px;border-radius:15px;margin-right:5px;margin-bottom:5px;" class="badge">
                    <span style="color:#2e7d32;font-weight:600;">✅ Correct:</span> ${correct}
                  </span>
                  
                  <span style="display:inline-block;background:#ffebee;padding:4px 10px;border-radius:15px;margin-bottom:5px;" class="badge">
                    <span style="color:#c62828;font-weight:600;">❌ Wrong:</span> ${wrong}
                  </span>
                </div>
                
                <div style="margin-bottom:10px;">
                  <span style="display:inline-block;background:#e3f2fd;padding:4px 10px;border-radius:15px;margin-right:5px;margin-bottom:5px;" class="badge">
                    <span style="color:#0d47a1;font-weight:600;">🟦 Answered:</span> ${answeredCount}
                  </span>
                  
                  <span style="display:inline-block;background:#f5f5f5;padding:4px 10px;border-radius:15px;margin-bottom:5px;" class="badge">
                    <span style="color:#424242;font-weight:600;">⬜ Unanswered:</span> ${unansweredCount}
                  </span>
                </div>
                
                <div>
                  <span style="color:#1a237e;font-weight:600;">⏱️ Time Taken:</span> 
                  <span style="color:#0d47a1;">${quizDuration || "-"}</span>
                </div>
              </div>
            </div>
            
            <!-- Mobile-friendly fallback for email clients that don't support display:table -->
            <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">
              <div style="padding:15px;border-top:1px solid #e8eaf6;margin-top:10px;">
                <div style="margin-bottom:8px;"><span style="color:#303f9f;font-weight:600;">Name:</span> ${name || "-"}</div>
                <div style="margin-bottom:8px;"><span style="color:#303f9f;font-weight:600;">Registration Number:</span> ${regno || "-"}</div>
                <div style="margin-bottom:8px;"><span style="color:#303f9f;font-weight:600;">Mobile:</span> ${mobile || "-"}</div>
                <div style="margin-bottom:15px;"><span style="color:#303f9f;font-weight:600;">Email:</span> ${email || "-"}</div>
                
                <div style="margin-bottom:10px;"><span style="color:#1a237e;font-weight:600;">Score:</span> <span style="font-weight:700;color:#2e7d32;">${score} / ${total}</span></div>
                <div style="margin-bottom:5px;"><span style="background:#e8f5e9;padding:4px 10px;border-radius:15px;color:#2e7d32;font-weight:600;">✅ Correct: ${correct}</span></div>
                <div style="margin-bottom:5px;"><span style="background:#ffebee;padding:4px 10px;border-radius:15px;color:#c62828;font-weight:600;">❌ Wrong: ${wrong}</span></div>
                <div style="margin-bottom:5px;"><span style="background:#e3f2fd;padding:4px 10px;border-radius:15px;color:#0d47a1;font-weight:600;">🟦 Answered: ${answeredCount}</span></div>
                <div style="margin-bottom:5px;"><span style="background:#f5f5f5;padding:4px 10px;border-radius:15px;color:#424242;font-weight:600;">⬜ Unanswered: ${unansweredCount}</span></div>
                <div><span style="color:#1a237e;font-weight:600;">⏱️ Time Taken:</span> <span style="color:#0d47a1;">${quizDuration || "-"}</span></div>
              </div>
            </div>
          </div>`;

      if (isPostTest && normalizedDetails.length > 0) {
        // Add a thank you message before the question details, similar to frontend (with mobile-friendly font sizes)
        html += `<div style="margin:28px 0;padding:20px;text-align:center;background:#e8f5e9;border-radius:10px;box-shadow:0 2px 8px rgba(0,0,0,0.05);border:1px solid #c8e6c9;">
          <h3 style="font-size:1.6em;color:#2e7d32;margin-bottom:10px;font-weight:bold;">Thank You!</h3>
          <p style="font-size:1.2em;color:#33691e;margin-bottom:8px;">Thank you for attending the post-test quiz. Your responses have been recorded.</p>
          <p style="font-size:1.1em;color:#558b2f;font-style:italic;">Please find the question-wise details of your quiz below for reference.</p>
        </div>`;
        
        html += '<h3 style="color:#1a237e;margin-bottom:16px;font-size:1.4em;text-align:center;border-bottom:2px dashed #c5cae9;padding-bottom:10px;">Question-wise Details</h3><ol style="padding-left:20px;">';
        
        // Group questions by topic for better organization
        const questionsByTopic = {};
        for (let i = 0; i < normalizedDetails.length; i++) {
          const q = normalizedDetails[i];
          const topic = q.topic || 'Other';
          if (!questionsByTopic[topic]) {
            questionsByTopic[topic] = [];
          }
          questionsByTopic[topic].push({...q, index: i});
        }
        
        // Output questions by topic
        Object.keys(questionsByTopic).forEach(topic => {
          html += `<div style="margin:20px 0 12px 0;background:linear-gradient(to right, #e8eaf6, #c5cae9);padding:12px 16px;border-radius:8px;font-weight:bold;color:#283593;font-size:1.2em;text-transform:uppercase;letter-spacing:1px;">${topic}</div>`;
          
          questionsByTopic[topic].forEach(q => {
            const i = q.index;
            
            // Set background color based on answer status (matches ResultPage.jsx)
            let rowBg = '#ffffff';
            if (!q.wasAnswered) {
              rowBg = '#fff9c4'; // Yellow background for unanswered (similar to yellow-50)
            } else if (q.isCorrect) {
              rowBg = '#e8f5e9'; // Green background for correct (green-50)
            } else {
              rowBg = '#ffebee'; // Red background for wrong answers (red-50)
            }
            
            html += '<li style="margin-bottom:22px;line-height:1.7;background:' + rowBg + ';padding:16px 14px;border-radius:10px;box-shadow:0 2px 6px rgba(0,0,0,0.08);font-size:1.1em;word-break:break-word;" class="question-item">';
            html += '<div style="font-weight:bold;color:#283593;font-size:1.1em;margin-bottom:8px;border-bottom:1px solid #e0e0e0;padding-bottom:6px;">Q' + (i + 1) + ': ' + (q.question || '-') + '</div>';
            
            if (!q.wasAnswered) {
              html += '<div style="margin-top:10px;"><b style="color:#424242;">Status:</b> <span style="color:#ff8f00;font-weight:bold;">⚪ Unanswered</span></div>';
              html += '<div><b style="color:#424242;">Your Answer:</b> <span style="color:#757575;font-style:italic;">Unanswered</span></div>';
              html += '<div><b style="color:#424242;">Correct Answer:</b> <span style="color:#0d47a1;font-weight:500;">' + (q.correctAnswer || '-') + '</span></div>';
            } else if (q.isCorrect) {
              html += '<div style="margin-top:10px;"><b style="color:#424242;">Status:</b> <span style="color:#2e7d32;font-weight:bold;">🟢 Answered</span></div>';
              html += '<div><b style="color:#424242;">Your Answer:</b> <span style="color:#2e7d32;font-weight:500;">' + (q.userAnswer || '-') + '</span></div>';
              html += '<div style="color:#2e7d32;font-weight:bold;background:#e8f5e9;display:inline-block;padding:4px 10px;margin-top:6px;border-radius:4px;" class="answer-status">✅ Correct</div>';
            } else {
              html += '<div style="margin-top:10px;"><b style="color:#424242;">Status:</b> <span style="color:#c62828;font-weight:bold;">🟠 Answered</span></div>';
              html += '<div><b style="color:#424242;">Your Answer:</b> <span style="color:#c62828;font-weight:500;">' + (q.userAnswer || '-') + '</span></div>';
              html += '<div><b style="color:#424242;">Correct Answer:</b> <span style="color:#0d47a1;font-weight:500;">' + (q.correctAnswer || '-') + '</span></div>';
              html += '<div style="color:#c62828;font-weight:bold;background:#ffebee;display:inline-block;padding:4px 10px;margin-top:6px;border-radius:4px;" class="answer-status">❌ Wrong</div>';
            }
            html += '</li>';
          });
        });
        
        html += '</ol>';
        html += '<div style="margin-top:28px;font-size:1.2em;color:#333;text-align:center;font-style:italic;background:#f5f5f5;padding:16px;border-radius:8px;">Thank you for attending the quiz!</div>';
      } else {
        // This is a pre-test
        html += `<div style="margin:28px 0;padding:24px;text-align:center;background:#e3f2fd;border-radius:10px;box-shadow:0 2px 8px rgba(0,0,0,0.08);border:1px solid #bbdefb;">
          <h3 style="font-size:1.6em;color:#0d47a1;margin-bottom:12px;font-weight:bold;">Thank You!</h3>
          <p style="font-size:1.2em;color:#1565c0;margin-bottom:10px;">Thank you for attending the pre-test quiz. Your responses have been recorded successfully.</p>
          <p style="font-size:1.1em;color:#1976d2;margin-bottom:10px;">Please stay in touch with your instructor for further details.</p>
          <p style="font-size:1.2em;color:#0d47a1;font-weight:500;font-style:italic;margin-top:12px;">We look forward to seeing you in the post-test!</p>
        </div>`;
      }

      html += '<div style="margin-top:36px;border-top:1px solid #e0e0e0;padding-top:20px;text-align:center;">';
      html += '<p style="font-size:1.2em;color:#333;margin-bottom:5px;">Best regards,</p>';
      html += '<p style="font-size:1.3em;font-weight:bold;color:#1a237e;margin-top:5px;">Dr. NK Bhat Skill Lab Quiz Team</p>';
      html += '</div>';
      html += '<div style="margin-top:16px;font-size:0.95em;color:#777;text-align:center;font-style:italic;">[final v8 mobile-optimized]</div>';
      html += '</div>';
      html += '</div>';
      html += '</body>';
      html += '</html>';

      // Create a plain-text version of the email for better deliverability.
      let text = '';
      text += 'Dear ' + (name || 'Participant') + ',\n\n';
      text += 'Please find your quiz details below:\n\n';
      text += 'Name: ' + (name || '-') + '\n';
      text += 'Registration Number: ' + (regno || '-') + '\n';
      text += 'Mobile: ' + (mobile || '-') + '\n';
      text += 'Email: ' + (email || '-') + '\n';
      text += 'Test Type: ' + testType + '\n';
      text += 'Your Score: ' + score + ' / ' + total + '\n';
      text += 'Correct: ' + correct + ' | Wrong: ' + wrong + '\n';
      text += 'Answered: ' + answeredCount + ' | Unanswered: ' + unansweredCount + '\n';
      text += 'Time Taken: ' + (quizDuration || '-') + '\n\n';
      text += 'Best regards,\nDr. NK Bhat Skill Lab Quiz Team\n';

      // Format the date in IST (Asia/Kolkata)
      const istDate = new Date().toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });

      const msg = {
        to: email,
        from: {
          name: "Dr. NK Bhat Skill Lab Quiz Team",
          email: "noreply@dr-nk-bhat-skill-lab-test-app.pro",
        },
        subject: 'Your ' + testType + ' Quiz Results (' + istDate + ' IST)',
        html: html,
        text: text, // Add the plain-text version.
      };

      try {
        // Log normalized details count for debugging
        console.log(`Sending email with ${normalizedDetails.length} questions (${answeredCount} answered, ${unansweredCount} unanswered)`);
        
        // Send the email
        await sgMail.send(msg);
        
        // Update Firestore to mark that email has been sent for this attempt
        await admin.firestore().collection("quiz_responses").doc(request.auth.uid).update({
          emailSent: true,
          emailSentAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        console.log('Email sent successfully to ' + email);
        return {
          success: true, 
          details: {
            totalQuestions: normalizedDetails.length,
            answeredCount,
            unansweredCount,
            emailVersion: "final v8 mobile-optimized",
            dataSource: frontendDetailedResults?.length > 0 ? "frontend" : "firestore",
            emailSent: true
          }
        };
      } catch (error) {
        console.error('Failed to send email to ' + email + ':', error.toString());
        // For more detailed error logging, you can inspect error.response.body
        if (error.response) {
          console.error(error.response.body);
        }
        throw new functions.https.HttpsError(
            "internal",
            "An error occurred while trying to send the email.",
            {
              originalError: error.message,
              details: {
                totalQuestions: normalizedDetails.length,
                answeredCount,
                unansweredCount
              }
            },
        );
      }
    },
);
