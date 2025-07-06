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

      const {
        email,
        name,
        isPostTest,
        score,
        correct,
        wrong,
        total,
        details,
        regno,
        mobile,
        quizDuration,
      } = request.data;

      // Calculate answered and unanswered counts
      const answeredCount = Array.isArray(details) ? details.filter(q => q.userAnswer !== null && q.userAnswer !== undefined).length : 0;
      const unansweredCount = Array.isArray(details) ? details.length - answeredCount : 0;

      // Construct the HTML body for the email.
      const testType = isPostTest ? "Post-Test" : "Pre-Test";
      let html = `
      <div style="background:#f6f8fa;padding:32px 0;font-family:Arial,sans-serif;">
        <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:10px;box-shadow:0 2px 8px #e0e0e0;padding:32px 24px;">
          <div style="text-align:center;margin-bottom:24px;">
            <img src='https://dr-nk-bhat-skill-lab-test-app.pro/NET-Medical-College.png' alt='NET Medical College Logo' style='height:60px;margin-bottom:8px;' />
            <h2 style="margin:8px 0 0 0;color:#1a237e;font-size:1.6em;">Dr. NK Bhat Skill Lab Quiz Team</h2>
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
          </div>

      `;

      if (isPostTest && Array.isArray(details) && details.length > 0) {
        html += `<h3 style="color:#1a237e;margin-bottom:10px;">Question-wise Details:</h3><ol style="padding-left:20px;">`;
        for (let i = 0; i < total; i++) {
          const q = details[i];
          html += `<li style="margin-bottom:18px;line-height:1.6;">
            <div style="font-weight:bold;color:#283593;">Q${i + 1}: ${q.question}</div>`;

          if (q.userAnswer === null || q.userAnswer === undefined) {
            html += `
              <div><b>Status:</b> <span style='color:#757575;'>Unanswered</span></div>
              <div><b>Your Answer:</b> <span style='color:#757575;'>Unanswered</span></div>
              <div><b>Correct Answer:</b> <span style='color:#1565c0;'>${q.correctAnswer}</span></div>
              <div style='color:#757575;font-weight:bold;'>⚪ Unanswered</div>
            `;
          } else if (q.isCorrect) {
            html += `
              <div><b>Status:</b> <span style='color:#388e3c;'>Answered</span></div>
              <div><b>Your Answer:</b> <span style='color:#388e3c;'>${q.userAnswer}</span></div>
              <div style='color:#388e3c;font-weight:bold;'>✅ Correct</div>
            `;
          } else {
            html += `
              <div><b>Status:</b> <span style='color:#d32f2f;'>Answered</span></div>
              <div><b>Your Answer:</b> <span style='color:#d32f2f;'>${q.userAnswer}</span></div>
              <div><b>Correct Answer:</b> <span style='color:#1565c0;'>${q.correctAnswer}</span></div>
              <div style='color:#d32f2f;font-weight:bold;'>❌ Wrong</div>
            `;
          }
          html += "</li>";
        }
        html += "</ol>";
      }

      html += `
          <p style="margin-top:32px;font-size:1.1em;">Best regards,<br/><b>Dr. NK Bhat Skill Lab Quiz Team</b></p>
        </div>
      </div>
      `;

      // Create a plain-text version of the email for better deliverability.
      const text = `
Dear ${name || "Participant"},

Thank you for taking the quiz.

Test Type: ${testType}
Your Score: ${score} / ${total}
Correct: ${correct} | Wrong: ${wrong}

Best regards,
Dr. NK Bhat Skill Lab Quiz Team
      `;

      const msg = {
        to: email,
        from: {
          name: "Dr. NK Bhat Skill Lab Quiz Team",
          email: "noreply@dr-nk-bhat-skill-lab-test-app.pro",
        },
        subject: `Your ${testType} Quiz Results (${new Date().toLocaleString()})`,
        html: html,
        text: text, // Add the plain-text version.
      };

      try {
        await sgMail.send(msg);
        console.log(`Email sent successfully to ${email}`);
        return {success: true};
      } catch (error) {
        console.error(`Failed to send email to ${email}:`, error.toString());
        // For more detailed error logging, you can inspect error.response.body
        if (error.response) {
          console.error(error.response.body);
        }
        throw new functions.https.HttpsError(
            "internal",
            "An error occurred while trying to send the email.",
            {originalError: error.message},
        );
      }
    },
);
