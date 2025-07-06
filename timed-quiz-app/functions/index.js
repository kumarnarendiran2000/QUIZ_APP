/**
 * Import function triggers from their respective submodules:
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {onCall} = require("firebase-functions/v2/https");
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const sgMail = require("@sendgrid/mail");

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
          quizDuration = data.quizDuration || "";
          isPostTest = data.isPostTest !== undefined ? data.isPostTest : true;
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
        // Dynamically import questions.js (Node.js require)
        questionsList = require("../src/data/questions.js").questions;
      } catch (e) {
        console.error("Could not load questions.js for email details:", e);
      }

      // Build a normalized details array in order, with question text, correct answer, user answer, isCorrect, wasAnswered
      // Map user answers to questions by question index, so all questions (answered or not) are included in order
      let normalizedDetails = [];
      
      // Fetch user answers directly from Firestore document - critical for including unanswered questions
      let userAnswers = [];
      try {
        const userData = await admin.firestore().collection("quiz_responses").doc(request.auth.uid).get();
        if (userData.exists) {
          userAnswers = userData.data().answers || [];
        }
      } catch (e) {
        console.error("Failed to fetch user answers from Firestore:", e);
      }
      
      // Try to get correctAnswers from metadata
      let correctAnswers = [];
      try {
        const metaDoc = await admin.firestore().collection("quiz_metadata").doc("default").get();
        if (metaDoc.exists) {
          correctAnswers = metaDoc.data().correctAnswers || [];
        }
      } catch (e) {
        console.error("Failed to fetch correct answers from Firestore:", e);
      }
      
      if (questionsList.length > 0) {
        // Process all questions in order, whether answered or not
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
            wasAnswered: userAnswerIdx !== null
          });
        }
      } else if (Array.isArray(details)) {
        // Fallback: use details as-is, but ensure we include indicators for unanswered questions
        normalizedDetails = details.map(q => ({
          question: q.question || '-',
          userAnswer: q.userAnswer || null,
          correctAnswer: q.correctAnswer || null,
          isCorrect: q.isCorrect === true,
          wasAnswered: q.userAnswer !== null && q.userAnswer !== undefined
        }));
      }
      const answeredCount = normalizedDetails.filter(q => q.wasAnswered).length;
      const unansweredCount = normalizedDetails.length - answeredCount;



      // Construct the HTML body for the email.
      const testType = isPostTest ? "Post-Test" : "Pre-Test";
      let html = '';
      html += `<div style="background:#f6f8fa;padding:32px 0;font-family:Arial,sans-serif;">
        <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:10px;box-shadow:0 2px 8px #e0e0e0;padding:32px 24px;">
          <div style="text-align:center;margin-bottom:24px;">
            <img src='https://dr-nk-bhat-skill-lab-test-app.pro/NET-Medical-College.png' alt='NET Medical College Logo' style='height:60px;margin-bottom:8px;' />
            <h2 style="margin:8px 0 0 0;color:#1a237e;font-size:1.6em;">Dr. NK Bhat Skill Lab Quiz Team</h2>
          </div>
          <div style="font-size:1.1em;margin-bottom:18px;">
            <span style="font-size:1.1em;">Dear <b>${name || "Participant"}</b>,</span><br>
            <span style="display:block;margin:10px 0 0 0;">Please find your quiz details below:</span>
          </div>
          <div style="font-size:1.1em;margin-bottom:18px;">
            <b>Name:</b> ${name || "-"}<br>
            <b>Registration Number:</b> ${regno || "-"}<br>
            <b>Mobile:</b> ${mobile || "-"}<br>
            <b>Email:</b> ${email || "-"}<br>
          </div>
          <div style="background:#f0f4c3;padding:16px 20px;border-radius:8px;margin:18px 0 24px 0;">
            <b>Test Type:</b> <span style="color:#1565c0;">${testType}</span><br>
            <b>Your Score:</b> <span style="color:#388e3c;">${score} / ${total}</span><br>
            <b>Correct:</b> <span style="color:#388e3c;">${correct}</span> &nbsp; <b>Wrong:</b> <span style="color:#d32f2f;">${wrong}</span><br>
            <b>Answered:</b> <span style="color:#1976d2;">${answeredCount}</span> &nbsp; <b>Unanswered:</b> <span style="color:#757575;">${unansweredCount}</span><br>
            <b>Time Taken:</b> <span style="color:#1976d2;">${quizDuration || "-"}</span>
          </div>`;

      if (isPostTest && normalizedDetails.length > 0) {
        html += '<h3 style="color:#1a237e;margin-bottom:10px;">Question-wise Details:</h3><ol style="padding-left:20px;">';
        
        // Group questions by topic for better organization
        const questionsByTopic = {};
        for (let i = 0; i < normalizedDetails.length; i++) {
          const q = normalizedDetails[i];
          const topic = (questionsList[i] && questionsList[i].topic) || 'Other';
          if (!questionsByTopic[topic]) {
            questionsByTopic[topic] = [];
          }
          questionsByTopic[topic].push({...q, index: i});
        }
        
        // Output questions by topic
        Object.keys(questionsByTopic).forEach(topic => {
          html += `<div style="margin:16px 0 10px 0;background:#e8eaf6;padding:8px 12px;border-radius:5px;font-weight:bold;color:#1a237e;">${topic}</div>`;
          
          questionsByTopic[topic].forEach(q => {
            const i = q.index;
            const rowBg = i % 2 === 0 ? '#f9fbe7' : '#fff';
            html += '<li style="margin-bottom:18px;line-height:1.6;background:' + rowBg + ';padding:12px 10px;border-radius:8px;box-shadow:0 1px 2px #ececec;">';
            html += '<div style="font-weight:bold;color:#283593;">Q' + (i + 1) + ': ' + (q.question || '-') + '</div>';
            
            if (!q.wasAnswered) {
              html += '<div><b>Status:</b> <span style="color:#ffa000;">⚪ Unanswered</span></div>';
              html += '<div><b>Your Answer:</b> <span style="color:#757575;">Unanswered</span></div>';
              html += '<div><b>Correct Answer:</b> <span style="color:#1565c0;">' + (q.correctAnswer || '-') + '</span></div>';
            } else if (q.isCorrect) {
              html += '<div><b>Status:</b> <span style="color:#388e3c;">🟢 Answered</span></div>';
              html += '<div><b>Your Answer:</b> <span style="color:#388e3c;">' + (q.userAnswer || '-') + '</span></div>';
              html += '<div style="color:#388e3c;font-weight:bold;">✅ Correct</div>';
            } else {
              html += '<div><b>Status:</b> <span style="color:#d32f2f;">🟠 Answered</span></div>';
              html += '<div><b>Your Answer:</b> <span style="color:#d32f2f;">' + (q.userAnswer || '-') + '</span></div>';
              html += '<div><b>Correct Answer:</b> <span style="color:#1565c0;">' + (q.correctAnswer || '-') + '</span></div>';
              html += '<div style="color:#d32f2f;font-weight:bold;">❌ Wrong</div>';
            }
            html += '</li>';
          });
        });
        
        html += '</ol>';
        html += '<div style="margin-top:24px;font-size:1.1em;color:#333;">Thank you for attending the quiz.</div>';
      } else if (!isPostTest) {
        html += '<div style="margin-top:24px;font-size:1.1em;color:#333;">Thank you for attending the quiz. Your responses have been recorded. Please stay in touch with your instructor for further details. We hope to see you in the post-test!</div>';
      }

      html += '<p style="margin-top:32px;font-size:1.1em;">Best regards,<br/><b>Dr. NK Bhat Skill Lab Quiz Team</b></p>';
      html += '<div style="margin-top:12px;font-size:0.95em;color:#888;">[final v2]</div>';
      html += '</div>';
      html += '</div>';

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
        
        await sgMail.send(msg);
        console.log('Email sent successfully to ' + email);
        return {
          success: true, 
          details: {
            totalQuestions: normalizedDetails.length,
            answeredCount,
            unansweredCount,
            emailVersion: "final v2"
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
