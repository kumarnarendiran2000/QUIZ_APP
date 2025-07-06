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
      } = request.data;

      console.log(`Preparing email for ${email} (User: ${name}).`);

      // Construct the HTML body for the email.
      let html = `
        <p>Dear ${name || "Participant"},</p>
        <p>Thank you for taking the quiz.</p>
        <p>
          <b>Your Score:</b> ${score} / ${total}<br>
          <b>Correct:</b> ${correct} &nbsp; <b>Wrong:</b> ${wrong}
        </p>`;

      if (isPostTest && details && details.length > 0) {
        html += "<h3>Question-wise Details:</h3><ol>";
        details.forEach((q, i) => {
          html += `
            <li>
              <b>Q${i + 1}:</b> ${q.question}<br>
              <b>Your Answer:</b> ${q.userAnswer || "Not answered"}<br>
              <b>Correct Answer:</b> ${q.correctAnswer}<br>
              <b>${q.isCorrect ? "✅ Correct" : "❌ Wrong"}</b>
            </li>`;
        });
        html += "</ol>";
      }

      html += "<p>Best regards,<br/>The Quiz Team</p>";

      const msg = {
        to: email,
        from: "noreply@dr-nk-bhat-skill-lab-test-app.pro",
        subject: "Your Quiz Results",
        html: html,
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
