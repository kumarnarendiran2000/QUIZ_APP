// src/utils/quizStorage.js
import { doc, getDoc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "./firebase";

/**
 * Generate a document ID for a quiz response
 * Format: userUid_testMode_YYYYMMDD
 */
export function generateQuizDocId(userUid, testMode, date = null) {
  // Use provided date or current date, adjusted to IST timezone
  const useDate = date || new Date();
  
  // Add IST offset (UTC+5:30 = +330 minutes)
  const istDate = new Date(useDate.getTime() + (330 * 60000));
  const dateStr = istDate.toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD format
  return `${userUid}_${testMode}_${dateStr}`;
}

/**
 * Parse a document ID to extract components
 * @param {string} docId - The document ID in format userUid_testMode_YYYYMMDD
 * @returns {Object} Object with userUid, testMode, and date properties
 */
export function parseQuizDocId(docId) {
  const parts = docId.split('_');
  if (parts.length < 3) {
    return { userUid: parts[0], testMode: "unknown", dateStr: "unknown" };
  }
  
  // The last part is the date
  const dateStr = parts[parts.length - 1];
  // The second-to-last part is the test mode
  const testMode = parts[parts.length - 2];
  // Everything else is the userUid (in case it contained underscores)
  const userUid = parts.slice(0, parts.length - 2).join('_');
  
  // Parse the date string back to a Date object if it's a valid format
  let date = null;
  if (/^\d{8}$/.test(dateStr)) {
    const year = parseInt(dateStr.substring(0, 4));
    const month = parseInt(dateStr.substring(4, 6)) - 1; // JS months are 0-indexed
    const day = parseInt(dateStr.substring(6, 8));
    date = new Date(year, month, day);
  }
  
  return { userUid, testMode, dateStr, date };
}

/**
 * Get quiz response for a user on a specific date and test mode
 */
export async function getQuizResponse(userUid, testMode, date = null) {
  const docId = generateQuizDocId(userUid, testMode, date);
  const ref = doc(db, "quiz_responses", docId);
  const snap = await getDoc(ref);
  
  if (snap.exists()) {
    return { id: snap.id, ...snap.data() };
  }
  return null;
}

/**
 * Check if user has already taken any quiz with the specified test mode
 * Returns the most recent quiz response or null
 */
export async function getAnyQuizWithTestMode(userUid, testMode) {
  // We need to query by userUid and testMode
  const q = query(
    collection(db, "quiz_responses"),
    where("userUid", "==", userUid),
    where("testMode", "==", testMode)
  );
  
  const querySnapshot = await getDocs(q);
  let mostRecent = null;
  
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    // If we find a match and it's more recent than what we have (or we have nothing yet)
    if (!mostRecent || (data.startedAt > mostRecent.startedAt)) {
      mostRecent = { id: doc.id, ...data };
    }
  });
  
  return mostRecent;
}

/**
 * Check if a user can take a quiz in the given test mode
 * Rules:
 * 1. Can't take same test mode on the same day
 * 2. Can't take pre-test if already taken before
 * 3. Can only take post-test if pre-test has been completed
 * 
 * @returns {Object} { canTake: boolean, existingQuiz: Object|null, reason: string|null }
 */
export async function canTakeQuiz(userUid, currentTestMode) {
  // First check: has the user already completed both tests?
  const preTest = await getAnyQuizWithTestMode(userUid, "pre");
  const postTest = await getAnyQuizWithTestMode(userUid, "post");
  
  // If both tests are already taken, no more tests allowed
  if (preTest && postTest) {
    // Return the appropriate test result based on which test they're trying to take
    return {
      canTake: false,
      existingQuiz: currentTestMode === "pre" ? preTest : postTest,
      reason: currentTestMode === "pre" ? "pre_test_already_taken" : "post_test_already_taken"
    };
  }

  // Check if user has taken this test mode today - if so, show them their results
  const todayQuiz = await getQuizResponse(userUid, currentTestMode);
  if (todayQuiz) {
    return {
      canTake: false,
      existingQuiz: todayQuiz,
      reason: currentTestMode === "pre" ? "pre_test_already_taken" : "post_test_already_taken"
    };
  }
  
  // If this is a pre-test
  if (currentTestMode === "pre") {
    // Check if user has taken any pre-test before
    if (preTest) {
      return {
        canTake: false,
        existingQuiz: preTest,
        reason: "pre_test_already_taken"
      };
    }
    
    // Check if user has taken a post-test already (out of order)
    if (postTest) {
      return {
        canTake: false,
        existingQuiz: postTest,
        reason: "out_of_order"
      };
    }
  }
  
  // If this is a post-test
  if (currentTestMode === "post") {
    // Check if user has taken a pre-test
    if (!preTest) {
      return {
        canTake: false,
        existingQuiz: null,
        reason: "pre_test_required"
      };
    }
    
    // Check if post-test already taken
    if (postTest) {
      return {
        canTake: false,
        existingQuiz: postTest,
        reason: "post_test_already_taken"
      };
    }
    
    // Check if pre-test was taken on the same day as today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const preTestDate = new Date(preTest.startedAt);
    preTestDate.setHours(0, 0, 0, 0);
    
    if (preTestDate.getTime() === today.getTime()) {
      return {
        canTake: false,
        existingQuiz: null,
        reason: "same_day_restriction"
      };
    }
  }
  
  // User can take the quiz
  return {
    canTake: true,
    existingQuiz: null,
    reason: null
  };
}

/**
 * Save quiz response to Firestore with the new document ID format
 */
export async function saveQuizResponse(userUid, testMode, data, merge = true) {
  const docId = generateQuizDocId(userUid, testMode);
  const ref = doc(db, "quiz_responses", docId);
  
  // Always include userUid and testMode in the data
  const enhancedData = {
    ...data,
    userUid,
    testMode,
    // Adjust to IST timezone (UTC+5:30 = +330 minutes)
    quizDate: new Date(new Date().getTime() + (330 * 60000)).toISOString().split('T')[0] // YYYY-MM-DD format in IST
  };
  
  await setDoc(ref, enhancedData, { merge });
  return docId;
}
