// src/utils/questionsStorage.js
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot,
  query, 
  orderBy 
} from "firebase/firestore";
import { db } from "./firebase";

// Collection references
const QUESTIONS_COLLECTION = "quiz_questions";
const SETTINGS_COLLECTION = "quiz_settings";

/**
 * Get all questions from Firestore
 * @returns {Promise<Array>} Array of questions with their IDs
 */
export async function getQuestionsFromFirestore() {
  try {
    const q = query(collection(db, QUESTIONS_COLLECTION), orderBy("order", "asc"));
    const querySnapshot = await getDocs(q);
    
    const questions = [];
    querySnapshot.forEach((doc) => {
      questions.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return questions;
  } catch (error) {
    console.error("Error fetching questions from Firestore:", error);
    return [];
  }
}

/**
 * Get a single question by ID
 * @param {string} questionId - The question document ID
 * @returns {Promise<Object|null>} Question object or null if not found
 */
export async function getQuestionById(questionId) {
  try {
    const docRef = doc(db, QUESTIONS_COLLECTION, questionId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      };
    }
    return null;
  } catch (error) {
    console.error("Error fetching question:", error);
    return null;
  }
}

/**
 * Add a new question to Firestore
 * @param {Object} questionData - Question data object
 * @returns {Promise<string|null>} Document ID if successful, null if failed
 */
export async function addQuestionToFirestore(questionData) {
  try {
    // Get the current highest order number
    const questions = await getQuestionsFromFirestore();
    const maxOrder = questions.length > 0 ? Math.max(...questions.map(q => q.order || 0)) : 0;
    
    const questionWithOrder = {
      ...questionData,
      order: maxOrder + 1,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    const docRef = await addDoc(collection(db, QUESTIONS_COLLECTION), questionWithOrder);
    return docRef.id;
  } catch (error) {
    console.error("Error adding question:", error);
    return null;
  }
}

/**
 * Update an existing question in Firestore
 * @param {string} questionId - The question document ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<boolean>} Success status
 */
export async function updateQuestionInFirestore(questionId, updateData) {
  try {
    const docRef = doc(db, QUESTIONS_COLLECTION, questionId);
    await updateDoc(docRef, {
      ...updateData,
      updatedAt: Date.now()
    });
    return true;
  } catch (error) {
    console.error("Error updating question:", error);
    return false;
  }
}

/**
 * Delete a question from Firestore
 * @param {string} questionId - The question document ID
 * @returns {Promise<boolean>} Success status
 */
export async function deleteQuestionFromFirestore(questionId) {
  try {
    const docRef = doc(db, QUESTIONS_COLLECTION, questionId);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error("Error deleting question:", error);
    return false;
  }
}

/**
 * Reorder questions in Firestore
 * @param {Array} questionIds - Array of question IDs in the new order
 * @returns {Promise<boolean>} Success status
 */
export async function reorderQuestions(questionIds) {
  try {
    const batch = [];
    questionIds.forEach((id, index) => {
      const docRef = doc(db, QUESTIONS_COLLECTION, id);
      batch.push(updateDoc(docRef, { order: index + 1 }));
    });
    
    await Promise.all(batch);
    return true;
  } catch (error) {
    console.error("Error reordering questions:", error);
    return false;
  }
}

/**
 * Bulk import questions to Firestore
 * @param {Array} questions - Array of question objects
 * @returns {Promise<boolean>} Success status
 */
export async function bulkImportQuestions(questions) {
  try {
    const promises = questions.map((question, index) => {
      const questionData = {
        ...question,
        order: index + 1,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      return addDoc(collection(db, QUESTIONS_COLLECTION), questionData);
    });
    
    await Promise.all(promises);
    return true;
  } catch (error) {
    console.error("Error bulk importing questions:", error);
    return false;
  }
}

/**
 * Set up real-time listener for questions
 * @param {Function} callback - Callback function to handle updates
 * @returns {Function} Unsubscribe function
 */
export function listenToQuestions(callback) {
  const q = query(collection(db, QUESTIONS_COLLECTION), orderBy("order", "asc"));
  return onSnapshot(q, (querySnapshot) => {
    const questions = [];
    querySnapshot.forEach((doc) => {
      questions.push({
        id: doc.id,
        ...doc.data()
      });
    });
    callback(questions);
  });
}

/**
 * Get correct answers for all questions
 * @returns {Promise<Array>} Array of correct answer indices
 */
export async function getCorrectAnswers() {
  try {
    const questions = await getQuestionsFromFirestore();
    return questions.map(question => question.correctAnswer || 0);
  } catch (error) {
    console.error("Error fetching correct answers:", error);
    return [];
  }
}

/**
 * Get question statistics
 * @returns {Promise<Object>} Statistics object
 */
export async function getQuestionStatistics() {
  try {
    const questions = await getQuestionsFromFirestore();
    const topicCounts = {};
    let activeCount = 0;
    
    questions.forEach(question => {
      // Count by topic
      const topic = question.topic || "Uncategorized";
      topicCounts[topic] = (topicCounts[topic] || 0) + 1;
      
      // Count active questions
      if (question.isActive !== false) {
        activeCount++;
      }
    });
    
    return {
      totalQuestions: questions.length,
      activeQuestions: activeCount,
      inactiveQuestions: questions.length - activeCount,
      topicBreakdown: topicCounts,
      topics: Object.keys(topicCounts)
    };
  } catch (error) {
    console.error("Error getting question statistics:", error);
    return {
      totalQuestions: 0,
      activeQuestions: 0,
      inactiveQuestions: 0,
      topicBreakdown: {},
      topics: []
    };
  }
}