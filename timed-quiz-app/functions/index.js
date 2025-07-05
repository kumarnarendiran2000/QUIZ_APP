/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

// Using v2 of the Firebase Functions SDK for better performance and features
const {onCall} = require("firebase-functions/v2/https");
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const sgMail = require("@sendgrid/mail");

// Initialize Firebase Admin SDK
admin.initializeApp();

// Load SendGrid API key from environment variables
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
sgMail.setApiKey(SENDGRID_API_KEY);

// Option 1: Using Firebase Functions v2 syntax (recommended)
exports.sendQuizResultEmail = onCall({
  region: "us-central1", // Specify your region
  memory: "256MiB", // Minimum memory requirement
  maxInstances: 10,
  timeoutSeconds: 60, // Increase timeout to 60 seconds
}, async (request) => {
  // Authentication check (optional)
  if (!request.auth) {
    throw new functions.https.HttpsError(
        "unauthenticated",
        "The function must be called while authenticated.",
    );
  }
  
  const {
    email, name, isPostTest, score, correct, wrong, total, details,
  } = request.data;
  console.log(`Sending email to ${email} for user ${name}`);
  
  let html = `<p>Dear ${name || "Participant"},</p>
    <p>Thank you for attending the quiz.</p>
    <p><b>Your Score:</b> ${score} / ${total}<br>
    <b>Correct:</b> ${correct} &nbsp; <b>Wrong:</b> ${wrong}</p>`;

  if (isPostTest && details) {
    html += `<h3>Question-wise Details:</h3><ol>`;
    details.forEach((q, i) => {
      html += `<li>
        <b>Q${i + 1}:</b> ${q.question}<br>
        <b>Your Answer:</b> ${q.userAnswer}<br>
        <b>Correct Answer:</b> ${q.correctAnswer}<br>
        <b>${q.isCorrect ? "✅ Correct" : "❌ Wrong"}</b>
      </li>`;
    });
    html += `</ol>`;
  }

  html += `<p>Best regards,<br/>Quiz Team</p>`;

  const msg = {
    to: email,
    from: "dr.nk.bhat.skill.lab@gmail.com", // Your verified sender
    subject: "Your Quiz Result",
    html,
  };

  try {
    await sgMail.send(msg);
    console.log(`Email sent successfully to ${email}`);
    return {success: true};
  } catch (error) {
    console.error(`Email sending failed to ${email}:`, error);
    throw new functions.https.HttpsError(
        "internal",
        "Failed to send email",
        {originalError: error.message},
    );
  }
});

// Option 2: Keep the v1 syntax as a fallback if v2 doesn't work
// Comment out Option 1 and uncomment this if you have problems with v2
/*
exports.sendQuizResultEmailV1 = functions.https.onCall(async (data, context) => {
  // Check auth if needed
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }
  
  const {email, name, isPostTest, score, correct, wrong, total, details} = data;
  console.log(`V1: Sending email to ${email} for user ${name}`);
  
  // Rest of the function same as before
  // ...
  
  try {
    await sgMail.send(msg);
    return {success: true};
  } catch (error) {
    console.error(error);
    throw new functions.https.HttpsError(
      "internal", 
      "Failed to send email", 
      { originalError: error.message }
    );
  }
});
*/
