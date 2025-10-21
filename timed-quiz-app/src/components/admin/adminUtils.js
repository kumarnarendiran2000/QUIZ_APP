// src/components/admin/adminUtils.js
import { doc, deleteDoc, getDoc } from "firebase/firestore";
import { db, sendQuizResultEmail } from "../../utils/firebase";
import { loadQuestions } from "../../utils/questionsLoader";

// Delete a submission from Firestore
export const deleteSubmission = async (id, selectedIds, setSelectedIds, setSelectAll) => {
  try {
    await deleteDoc(doc(db, "quiz_responses", id));
    
    // Also remove the deleted ID from selectedIds if it was selected
    if (selectedIds.includes(id)) {
      const newSelectedIds = selectedIds.filter(sid => sid !== id);
      setSelectedIds(newSelectedIds);
      
      // If we're deleting the last selected item, also update selectAll state
      if (newSelectedIds.length === 0) {
        setSelectAll(false);
      }
    }
    
    return true;
  } catch (err) {
    console.error("Failed to delete record:", err);
    return false;
  }
};

// Bulk delete submissions
export const bulkDeleteSubmissions = async (selectedIds) => {
  const results = { success: 0, errors: [] };
  
  for (const id of selectedIds) {
    try {
      await deleteDoc(doc(db, "quiz_responses", id));
      results.success++;
    } catch (err) {
      results.errors.push({ id, error: err.message });
    }
  }
  
  return results;
};

// Send an email with quiz results
export const sendEmail = async (user, setEmailToast, setEmailSending, setEmailUserInProgress) => {
  if (!user) return { success: false, error: "No user provided" };

  try {
    // Add a small note in the toast if this is a resend
    let infoMessage = `Sending email to ${user.name} (${user.email})...`;
    if (user.emailSent === true && user.emailSentAt) {
      const sentDate = new Date(user.emailSentAt.toDate()).toLocaleString();
      infoMessage = `Resending email to ${user.name} (${user.email})... (previously sent on ${sentDate})`;
    }
    
    setEmailToast({
      show: true,
      type: "info",
      message: infoMessage,
    });

    // Load questions and correct answers dynamically
    const { questions: currentQuestions, correctAnswers } = await loadQuestions();

    // Extract the data we need to send from user record
    const answers = user.answers || [];
    const testMode = user.testModeAtStart || "post";
    const quizDuration = user.quizDuration || "N/A";

    // Normalize results data similar to ResultPage.jsx
    const normalizedResults = currentQuestions.map((q, i) => {
      const selected = answers[i];
      const correct = correctAnswers[i];
      const isCorrect = selected === correct;
      const wasAnswered = typeof selected === "number";
      return {
        question: q.question,
        userAnswer: wasAnswered ? q.options[selected] : null,
        correctAnswer: q.options[correct],
        isCorrect,
        wasAnswered,
        topic: q.topic || "Other",
      };
    });

    // Calculate counts for sending
    const correct = normalizedResults.filter((r) => r.isCorrect).length;
    const wrong = normalizedResults.length - correct;
    const total = currentQuestions.length;

    // Send the email
    await sendQuizResultEmail({
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      answers,
      detailedResults: normalizedResults,
      correctAnswers,
      allQuestions: currentQuestions,
      quizDurationFromFrontend: quizDuration,
      testModeFromFrontend: testMode,
      correct,
      wrong,
      total,
      score: correct,
    });

    // Customize success message based on whether this was a resend
    let successMessage = `Email sent successfully to ${user.name} (${user.email})`;
    if (user.emailSent === true && user.emailSentAt) {
      successMessage = `Email resent successfully to ${user.name} (${user.email})`;
    }
    
    setEmailToast({
      show: true,
      type: "success",
      message: successMessage,
    });
    
    return { success: true, toastSet: true };
  } catch (error) {
    console.error("Error sending email:", error);
    
    // Create a more user-friendly error message
    let errorMessage = `Failed to send email to ${user.name} (${user.email})`;
    
    // Add specific error details if available
    if (error.message) {
      // For common error types, provide more user-friendly messages
      if (error.message.includes("unauthorized") || error.message.includes("401")) {
        errorMessage += ": Authentication error with email service. Please check API key configuration.";
      } else if (error.message.includes("timeout") || error.message.includes("ECONNREFUSED")) {
        errorMessage += ": Connection timeout. Please check network connectivity.";
      } else if (error.message.includes("not found") || error.message.includes("404")) {
        errorMessage += ": Resource not found. Data may be missing or deleted.";
      } else {
        // Generic error message with details
        errorMessage += `: ${error.message}`;
      }
    }
    
    setEmailToast({
      show: true,
      type: "error",
      message: errorMessage,
    });
    
    // Auto-dismiss error toast after 8 seconds
    setTimeout(() => {
      setEmailToast((prev) => {
        if (prev.type === "error") {
          return { ...prev, show: false };
        }
        return prev;
      });
    }, 8000);
    
    return { success: false, error: error.message, toastSet: true };
  } finally {
    setEmailSending(false);
    setEmailUserInProgress(null);
  }
};
