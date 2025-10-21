// src/utils/questionsLoader.js
import { getQuestionsFromFirestore, getCorrectAnswers } from "./questionsStorage";

/**
 * Load questions from the Firestore quiz_questions collection
 * @returns {Promise<Object>} Object containing questions and correctAnswers arrays
 */
export async function loadQuestions() {
  try {
    // Load from the quiz_questions collection
    const firestoreQuestions = await getQuestionsFromFirestore();
    
    if (firestoreQuestions.length > 0) {
      // Filter out inactive questions for the quiz
      const activeQuestions = firestoreQuestions.filter(q => q.isActive !== false);
      
      // Format questions to match the expected structure
      const formattedQuestions = activeQuestions.map(q => ({
        question: q.question,
        options: q.options,
        topic: q.topic
      }));
      
      // Get correct answers from each question document
      const correctAnswers = activeQuestions.map(q => q.correctAnswer || 0);
      
      console.log(`✅ Loaded ${formattedQuestions.length} questions from Firestore quiz_questions collection`);
      return {
        questions: formattedQuestions,
        correctAnswers: correctAnswers
      };
    } else {
      // No questions in Firestore
      console.error("❌ No questions found in quiz_questions collection!");
      throw new Error("No questions available. Please add questions through the Question Manager.");
    }
  } catch (error) {
    console.error("❌ Error loading questions from Firestore:", error);
    throw error; // Let the calling code handle the error
  }
}

/**
 * Load questions with correct answers for result calculation
 * @returns {Promise<Object>} Object containing questions and correctAnswers arrays
 */
export async function loadQuestionsWithCorrectAnswers() {
  return await loadQuestions();
}

/**
 * Get only the correct answers array
 * @returns {Promise<Array>} Array of correct answer indices
 */
export async function loadCorrectAnswers() {
  try {
    const { correctAnswers } = await loadQuestions();
    return correctAnswers;
  } catch (error) {
    console.error("Error loading correct answers:", error);
    throw error;
  }
}