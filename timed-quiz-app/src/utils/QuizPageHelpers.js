// QuizPageHelpers.js
import { getTestMode } from './quizSettings';
import { saveQuizResponse } from './quizStorage';
import { detectDeviceType, getBrowserInfo, getScreenResolution } from './deviceDetector';

/**
 * Updates quiz answers in Firestore
 */
export async function updateAnswer(user, answers) {
  if (!user) return;
  
  const currentTestMode = await getTestMode();
  
  // Update Firestore with all answers
  return saveQuizResponse(
    user.uid,
    currentTestMode,
    {
      answers: answers,
    }
  );
}

/**
 * Updates tab switch count in Firestore
 */
export async function updateTabSwitchCount(user, count) {
  if (!user) return;
  
  const currentTestMode = await getTestMode();
  
  return saveQuizResponse(
    user.uid,
    currentTestMode,
    {
      tabSwitchCount: count,
    }
  );
}

/**
 * Updates copy attempt count in Firestore
 */
export async function updateCopyAttemptCount(user, count) {
  if (!user) return;
  
  const currentTestMode = await getTestMode();
  
  return saveQuizResponse(
    user.uid,
    currentTestMode,
    {
      copyAttemptCount: count,
    }
  );
}

/**
 * Updates the submission type and reason
 */
export async function updateSubmissionStatus(user, type, reason = null) {
  if (!user) return;
  
  const currentTestMode = await getTestMode();
  
  return saveQuizResponse(
    user.uid,
    currentTestMode,
    {
      submissionType: type,
      autoSubmitReason: reason,
    }
  );
}

/**
 * Handle quiz auto-submission with reason
 */
export async function handleAutoSubmit(user, reason, onSubmitCallback) {
  if (!user) {
    onSubmitCallback();
    return;
  }
  
  // First update device info
  await updateDeviceInfo(user);
  
  // Then update submission status
  await updateSubmissionStatus(user, "auto", reason);
  onSubmitCallback();
}

/**
 * Updates the device information for the quiz submission
 */
export async function updateDeviceInfo(user) {
  if (!user) return;
  
  const currentTestMode = await getTestMode();
  
  return saveQuizResponse(
    user.uid,
    currentTestMode,
    {
      deviceType: detectDeviceType(),
      browserInfo: getBrowserInfo(),
      screenResolution: getScreenResolution(),
    }
  );
}
