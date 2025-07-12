// src/components/admin/adminUtils.js
import { doc, deleteDoc, getDoc } from "firebase/firestore";
import { db, sendQuizResultEmail } from "../../utils/firebase";
import { questions } from "../../data/questions";

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
    setEmailToast({
      show: true,
      type: "info",
      message: `Sending email to ${user.name} (${user.email})...`,
    });

    // Get correct answers from metadata
    const metadataRef = doc(db, "quiz_metadata", "default");
    const metadataSnap = await getDoc(metadataRef);

    if (!metadataSnap.exists()) {
      throw new Error("Quiz metadata not found");
    }

    const correctAnswers = metadataSnap.data().correctAnswers || [];

    // Extract the data we need to send from user record
    const answers = user.answers || [];
    const testMode = user.testModeAtStart || "post";
    const quizDuration = user.quizDuration || "N/A";

    // Normalize results data similar to ResultPage.jsx
    const normalizedResults = questions.map((q, i) => {
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
    const total = questions.length;

    // Send the email
    await sendQuizResultEmail({
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      answers,
      detailedResults: normalizedResults,
      correctAnswers,
      allQuestions: questions,
      quizDurationFromFrontend: quizDuration,
      testModeFromFrontend: testMode,
      correct,
      wrong,
      total,
      score: correct,
    });

    setEmailToast({
      show: true,
      type: "success",
      message: `Email sent successfully to ${user.name} (${user.email})`,
    });

    return { success: true };
  } catch (error) {
    console.error("Error sending email:", error);
    
    setEmailToast({
      show: true,
      type: "error",
      message: `Failed to send email to ${user.name} (${user.email}): ${error.message}`,
    });
    
    return { success: false, error: error.message };
  } finally {
    setEmailSending(false);
    setEmailUserInProgress(null);
  }
};
