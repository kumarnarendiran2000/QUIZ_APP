/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const functions = require("firebase-functions");
const sgMail = require("@sendgrid/mail");

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
sgMail.setApiKey(SENDGRID_API_KEY);

// Callable function to send quiz result email
exports.sendQuizResultEmail = functions.https.onCall(async (data, context) => {
  const {email, name, isPostTest, score, correct, wrong, total, details} = data;

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
    return {success: true};
  } catch (error) {
    console.error(error);
    return {success: false, error: error.message};
  }
});
