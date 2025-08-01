// src/App.jsx
import React, { useEffect, useState } from "react";
import Login from "./components/Login";
import UserForm from "./components/UserForm";
import QuizPage from "./components/QuizPage";
import ResultPage from "./components/ResultPage";
import AdminDashboard from "./components/AdminDashboard";
import Layout from "./components/Layout";
import ErrorModal from "./components/ErrorModal";
import { db } from "./utils/firebase";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { questions } from "./data/questions";

const QUIZ_DURATION = 1200; // 20 minutes in seconds

const App = () => {
  // Strict test mode: lock mode at quiz start for each user
  const [testModeAtStart, setTestModeAtStart] = useState(null);
  const [step, setStep] = useState("login");
  const [user, setUser] = useState(null);
  const [userInfo, setUserInfo] = useState({ name: "", mobile: "", regno: "" });
  const [answers, setAnswers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(QUIZ_DURATION);
  const [detailedResults, setDetailedResults] = useState([]);
  const [quizDuration, setQuizDuration] = useState("N/A");
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [copyAttemptCount, setCopyAttemptCount] = useState(0);
  // New: testMode can be 'pre' or 'post'
  const [testMode, setTestMode] = useState("post");
  
  // Error modal state
  const [errorModal, setErrorModal] = useState({
    isOpen: false,
    title: "",
    message: ""
  });
  
  // Centralized error handling function
  const handleError = (title, message, returnToLogin = true) => {
    console.log(`Error occurred: ${title} - Return to login: ${returnToLogin}`);
    
    setErrorModal({
      isOpen: true,
      title: title,
      message: message
    });
    
    // If returnToLogin is true, we'll set the step back to login when modal is closed
    if (returnToLogin) {
      console.log('Setting user to null to force return to login');
      setUser(null);
    }
  };
  
  // Handle closing of error modal
  const handleErrorClose = () => {
    const wasErrorModal = errorModal.isOpen;
    setErrorModal({ ...errorModal, isOpen: false });
    
    console.log(`Error modal closed. Current user: ${user ? 'Logged in' : 'Not logged in'}, Current step: ${step}`);
    
    // Check if the user state is null, which means we had an authentication error
    if (!user) {
      console.log('User is null, returning to login step');
      // Always return to login step for authentication errors
      setStep("login");
    } else if (step === "login" && wasErrorModal) {
      console.log('Already on login step, ensuring we stay there');
      // If we're on the login step and there was an error modal showing,
      // make sure we stay on the login step
      setStep("login");
    }
  };

  // Load test mode from Firestore on mount and listen for changes
  useEffect(() => {
    const ref = doc(db, "quiz_settings", "default");
    const unsubscribe = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setTestMode(snap.data().testMode || "post");
      } else {
        setTestMode("post");
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  // ✅ Step 1: Handle Login
  const handleLogin = async (loggedInUser) => {
    // Check Firestore /admins/{uid} for admin status
    try {
      const adminRef = doc(db, "admins", loggedInUser.uid);
      const adminSnap = await getDoc(adminRef);
      if (adminSnap.exists()) {
        setUser(loggedInUser);
        setStep("admin");
        return;
      }
    } catch (err) {
      // Optionally log error, but do not block login
      console.error("Error checking admin status:", err);
    }

    // Import the quizStorage utilities
    const { canTakeQuiz, getQuizResponse } = await import(
      "./utils/quizStorage"
    );

    // Get current test mode from Firebase
    let currentTestMode = "post";
    try {
      const refSettings = doc(db, "quiz_settings", "default");
      const snap = await getDoc(refSettings);
      if (snap.exists()) {
        currentTestMode = snap.data().testMode || "post";
      }
    } catch (error) {
      console.error("Error fetching test mode:", error);
    }

    // Check if user can take the quiz in current test mode
    const { canTake, existingQuiz, reason } = await canTakeQuiz(
      loggedInUser.uid,
      currentTestMode
    );

    // If user has a quiz for today in current mode or has an existing quiz that prevents taking a new one
    if (!canTake && existingQuiz) {
      // Load the existing quiz data and show results
      setUser(loggedInUser);
      setUserInfo({
        name: existingQuiz.name,
        mobile: existingQuiz.mobile,
        regno: existingQuiz.regno || "",
      });
      setAnswers(existingQuiz.answers || []);
      setDetailedResults(existingQuiz.detailedResults || []);
      setQuizDuration(existingQuiz.quizDuration || "N/A");
      setTestModeAtStart(existingQuiz.testMode || currentTestMode);
      setStep("result");
      return;
    }

    // Check if there's an in-progress quiz for today's date and current test mode
    const todayQuiz = await getQuizResponse(loggedInUser.uid, currentTestMode);

    if (todayQuiz && todayQuiz.startedAt && !todayQuiz.completedAt) {
      // Quiz already started today but not completed
      const elapsed = Math.floor((Date.now() - todayQuiz.startedAt) / 1000);
      const remaining = Math.max(QUIZ_DURATION - elapsed, 0);

      if (remaining > 0) {
        setUser(loggedInUser);
        setUserInfo({
          name: todayQuiz.name || "",
          mobile: todayQuiz.mobile || "",
          regno: todayQuiz.regno || "",
        });

        // Normalize answers with nulls
        const normalized = Array(questions.length).fill(null);
        const saved = todayQuiz.answers || [];
        for (let i = 0; i < saved.length; i++) {
          normalized[i] = saved[i];
        }
        setAnswers(normalized);

        setTimeLeft(remaining);
        // On reload/relogin, restore the values from Firestore
        setTabSwitchCount(todayQuiz.tabSwitchCount || 0);
        setCopyAttemptCount(todayQuiz.copyAttemptCount || 0);

        // Import device detection utilities
        const { detectDeviceType, getBrowserInfo, getScreenResolution } =
          await import("./utils/deviceDetector");

        // Try to get device information with error handling
        let deviceInfo = {
          deviceType: todayQuiz.deviceType || "Unknown",
          browserInfo: todayQuiz.browserInfo || "Unknown",
          screenResolution: todayQuiz.screenResolution || "Unknown",
        };

        try {
          // Only update if existing values are missing or "Unknown"
          if (!todayQuiz.deviceType || todayQuiz.deviceType === "Unknown") {
            deviceInfo.deviceType = detectDeviceType();
          }
          if (!todayQuiz.browserInfo || todayQuiz.browserInfo === "Unknown") {
            deviceInfo.browserInfo = getBrowserInfo();
          }
          if (
            !todayQuiz.screenResolution ||
            todayQuiz.screenResolution === "Unknown"
          ) {
            deviceInfo.screenResolution = getScreenResolution();
          }
        } catch (error) {
          console.error("Error detecting device info on reload:", error);
        }

        // Import saveQuizResponse function
        const { saveQuizResponse } = await import("./utils/quizStorage");

        // Update device information in Firestore
        await saveQuizResponse(loggedInUser.uid, currentTestMode, {
          ...deviceInfo,
          // Keep existing submission type and reason if present
          submissionType: todayQuiz.submissionType || "manual",
          autoSubmitReason: todayQuiz.autoSubmitReason || null,
        });

        if (
          todayQuiz.tabSwitchCount >= 10 ||
          todayQuiz.copyAttemptCount >= 10
        ) {
          setStep("quiz");
          return;
        }
        setStep("quiz");
        return;
      }
    }

    // If user cannot take quiz in current mode
    if (!canTake) {
      // For most error cases, we want to start with no user logged in
      // but for cases where we're showing results, we'll set the user later
      setUser(null);
      
      // BYPASSED: Pre-test requirement check removed
      // BYPASSED: Same day restriction check removed
      
      if (reason === "out_of_order") {
        // User trying to take pre-test after post-test
        handleError(
          "Test Order Restriction",
          "You've already taken a post-test. You can't take a pre-test after completing a post-test. Please contact the test instructor for more details."
        );
        return; // Important: Exit function to prevent proceeding to next step
      } else if (reason === "already_taken_today") {
        // User is retaking the same test on the same day
        if (existingQuiz) {
          console.log(`User already took ${currentTestMode} test today, showing results`);
          setUser(loggedInUser);
          setUserInfo({
            name: existingQuiz.name,
            mobile: existingQuiz.mobile,
            regno: existingQuiz.regno || "",
          });
          setAnswers(existingQuiz.answers || []);
          setDetailedResults(existingQuiz.detailedResults || []);
          setQuizDuration(existingQuiz.quizDuration || "N/A");
          setTestModeAtStart(currentTestMode);
          setStep("result");
          return;
        }
      } else if (reason === "pre_test_already_taken" || reason === "post_test_already_taken") {
        // User trying to take a test they've already completed
        // Load the existing quiz and show results instead of showing an error
        if (existingQuiz) {
          console.log(`User already taken ${existingQuiz.testMode} test, showing results`);
          setUser(loggedInUser);
          setUserInfo({
            name: existingQuiz.name,
            mobile: existingQuiz.mobile,
            regno: existingQuiz.regno || "",
          });
          setAnswers(existingQuiz.answers || []);
          setDetailedResults(existingQuiz.detailedResults || []);
          setQuizDuration(existingQuiz.quizDuration || "N/A");
          setTestModeAtStart(existingQuiz.testMode || currentTestMode);
          setStep("result");
          return;
        } else {
          // This shouldn't happen normally, but as a fallback show an error message
          const testType = reason === "pre_test_already_taken" ? "pre-test" : "post-test";
          handleError(
            `${testType.charAt(0).toUpperCase() + testType.slice(1)} Already Taken`,
            `You've already taken a ${testType}. Each candidate can only take one ${testType}. Please contact the test instructor for more details.`
          );
          return; // Important: Exit function to prevent proceeding to next step
        }
      }
    }

    // New user who can take the quiz or new quiz attempt allowed
    setUser(loggedInUser);
    setStep("form");
  };

  // ✅ Step 2: Start Quiz
  const startQuiz = async () => {
    const initialAnswers = Array(questions.length).fill(null);

    // Import device detector functions
    const { detectDeviceType, getBrowserInfo, getScreenResolution } =
      await import("./utils/deviceDetector");

    // Get device information with error handling
    let deviceType = "Unknown";
    let browserInfo = "Unknown";
    let screenResolution = "Unknown";

    try {
      deviceType = detectDeviceType();
      browserInfo = getBrowserInfo();
      screenResolution = getScreenResolution();

      // Log for debugging
      console.log(
        `Device detection: ${deviceType}, ${browserInfo}, ${screenResolution}`
      );
    } catch (error) {
      console.error("Error detecting device info:", error);
    }

    // Fetch the current test mode from Firestore
    let mode = "post";
    try {
      const refSettings = doc(db, "quiz_settings", "default");
      const snap = await getDoc(refSettings);
      if (snap.exists()) {
        mode = snap.data().testMode || "post";
      }
    } catch {
      // fallback: mode remains 'post'
    }
    setTestModeAtStart(mode);

    if (user) {
      try {
        // Import the saveQuizResponse function
        const { saveQuizResponse, getQuizResponse } = await import(
          "./utils/quizStorage"
        );
  
        // Check if the user has already started a quiz today
        const existingQuiz = await getQuizResponse(user.uid, mode);
        const currentStartedAt = existingQuiz?.startedAt;
  
        // Prepare device data
        const deviceData = {
          deviceType:
            deviceType !== "Unknown"
              ? deviceType
              : existingQuiz?.deviceType || "Unknown",
          browserInfo:
            browserInfo !== "Unknown"
              ? browserInfo
              : existingQuiz?.browserInfo || "Unknown",
          screenResolution:
            screenResolution !== "Unknown"
              ? screenResolution
              : existingQuiz?.screenResolution || "Unknown",
        };
  
        // Save the quiz with our new format
        await saveQuizResponse(user.uid, mode, {
          name: userInfo.name,
          email: user.email,
          mobile: userInfo.mobile,
          regno: userInfo.regno,
          // Only set startedAt if it doesn't exist yet - never overwrite it
          ...(currentStartedAt ? {} : { startedAt: Date.now() }),
          answers: initialAnswers,
          testModeAtStart: mode,
          // Add device information
          ...deviceData,
          // Initialize submission type
          submissionType: "manual", // Will be updated to "auto" if auto-submitted
          autoSubmitReason: null, // Will be filled if auto-submitted
        });
      } catch (error) {
        console.error("Error saving initial quiz data:", error);
        // Continue with the quiz even if there was an error saving to Firestore
        // The server-side backup will eventually sync any hanging quizzes
      }
    }

    setTimeLeft(QUIZ_DURATION);
    setAnswers(initialAnswers);
    setStep("quiz");
  };

  // ✅ Step 3: Submit Quiz
  const handleSubmit = async () => {
    const finalAnswers = [...answers];

    // ✅ 1. Fetch correct answers securely from Firestore
    const metadataRef = doc(db, "quiz_metadata", "default");
    const metadataSnap = await getDoc(metadataRef);

    if (!metadataSnap.exists()) {
      handleError(
        "Scoring Error",
        "Scoring data missing! Please contact the test administrator.",
        false // Don't return to login
      );
      return;
    }

    const correctAnswers = metadataSnap.data().correctAnswers;

    // Import the quizStorage functions
    const { getQuizResponse, saveQuizResponse } = await import(
      "./utils/quizStorage"
    );

    // Get current test mode
    const currentTestMode = testModeAtStart || "post";

    // Get current submission data to preserve auto-submission status
    let submissionType = "manual";
    let autoSubmitReason = null;

    if (user) {
      const existingQuiz = await getQuizResponse(user.uid, currentTestMode);

      if (existingQuiz) {
        submissionType = existingQuiz.submissionType || "manual";
        autoSubmitReason = existingQuiz.autoSubmitReason || null;
      }
    }

    // ✅ 2. Compare answers & build detailed results
    let correctCount = 0;
    const detailedResults = [];

    finalAnswers.forEach((selected, i) => {
      const question = questions[i];
      const correct = correctAnswers[i];
      const isCorrect = selected === correct;

      if (selected !== null && typeof selected === "number") {
        detailedResults.push({
          question: question.question, // The question text
          userAnswer: question.options[selected], // The text of the user's answer
          correctAnswer: question.options[correct], // The text of the correct answer
          isCorrect,
        });

        if (isCorrect) correctCount++;
      }
    });

    const answeredCount = finalAnswers.filter(
      (a) => typeof a === "number"
    ).length;
    const unansweredCount = questions.length - answeredCount;

    // ⏱️ Calculate quiz duration using server timestamps as source of truth
    let timeTakenSec;

    if (user) {
      // Get the existing quiz to read startedAt
      const existingQuiz = await getQuizResponse(user.uid, currentTestMode);

      if (existingQuiz && existingQuiz.startedAt) {
        // Calculate time based on server timestamps (startedAt to now)
        const startedAtTime = existingQuiz.startedAt;
        const completedAtTime = Date.now();

        // Use server calculation with a safeguard (0 to QUIZ_DURATION)
        timeTakenSec = Math.min(
          Math.max(0, Math.floor((completedAtTime - startedAtTime) / 1000)),
          QUIZ_DURATION
        );

        // Log any suspicious timing discrepancies
        const clientSideCalc = QUIZ_DURATION - timeLeft;
        if (Math.abs(clientSideCalc - timeTakenSec) > 60) {
          console.warn(
            `Timing discrepancy detected! Server calc: ${timeTakenSec}s, Client calc: ${clientSideCalc}s`
          );
        }
      } else {
        // Fallback to client-side timer if startedAt isn't available
        timeTakenSec = Math.max(0, QUIZ_DURATION - timeLeft);
      }
    } else {
      // Fallback to client-side timer if user isn't available
      timeTakenSec = Math.max(0, QUIZ_DURATION - timeLeft);
    }

    const mins = Math.floor(timeTakenSec / 60);
    const secs = timeTakenSec % 60;
    const quizDuration = `${mins}m ${secs}s`;

    if (user) {
      try {
        // Add device information for the submission
        const { detectDeviceType, getBrowserInfo, getScreenResolution } = await import(
          "./utils/deviceDetector"
        );
        
        // CRITICAL - First do a minimal update with completedAt to mark quiz as finished
        // This prevents hanging/incomplete submissions like Meghana's case
        try {
          // First update only essential completion data
          await saveQuizResponse(user.uid, currentTestMode, {
            completedAt: Date.now(),
            submissionType,
            autoSubmitReason,
          });
          console.log("Quiz marked as completed successfully");
        } catch (minUpdateError) {
          console.error("Failed to mark quiz as completed:", minUpdateError);
          // Continue anyway - we'll try the full update next
        }
        
        // Set up a promise with timeout to ensure we don't hang indefinitely on saveQuizResponse
        const saveWithTimeout = (timeoutMs) => {
          return Promise.race([
            saveQuizResponse(user.uid, currentTestMode, {
              name: userInfo.name,
              email: user.email,
              mobile: userInfo.mobile,
              regno: userInfo.regno,
              answers: finalAnswers,
              answeredCount,
              unansweredCount,
              score: correctCount,
              correctCount,
              wrongCount: questions.length - correctCount,
              detailedResults,
              quizDuration,
              completedAt: Date.now(), // Use fresh timestamp
              // Preserve submission type and reason
              submissionType,
              autoSubmitReason,
              // Add device information
              deviceType: detectDeviceType(),
              browserInfo: getBrowserInfo(),
              screenResolution: getScreenResolution(),
              // Add safety flags to prevent partial completion
              resultsCalculated: true,
              submissionCompleted: true
            }),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error("Firestore save timed out")), timeoutMs)
            )
          ]);
        };
        
        // Try to save with a 8-second timeout
        await saveWithTimeout(8000);
        console.log("Quiz submission saved successfully to Firestore");
      } catch (error) {
        console.error("Error saving quiz submission:", error);
        // Continue with local results even if Firestore save failed
        // The server-side function will eventually check for hanging quizzes
        
        // Show an alert to the user so they're aware of the issue
        // This is non-blocking, so the user can still see their results
        alert("Warning: There was an issue saving your quiz results to our servers. " +
              "Your results are displayed now, but you may need to contact support if " +
              "they don't appear in your history later.");
      }

      // Always update the UI with results, even if saving to Firestore failed
      setDetailedResults(detailedResults);
      setQuizDuration(quizDuration);
    }

    setStep("result");
  };

  return (
    <Layout>
      {step === "login" && <Login onLogin={handleLogin} />}
      {step === "form" && (
        <UserForm
          userInfo={userInfo}
          setUserInfo={setUserInfo}
          onStartQuiz={startQuiz}
        />
      )}
      {step === "quiz" && (
        <QuizPage
          answers={answers}
          setAnswers={setAnswers}
          timeLeft={timeLeft}
          setTimeLeft={setTimeLeft}
          onSubmit={handleSubmit}
          user={user}
          initialTabSwitchCount={tabSwitchCount}
          initialCopyAttemptCount={copyAttemptCount}
        />
      )}
      {step === "result" && (
        <ResultPage
          userInfo={userInfo}
          userEmail={user?.email}
          answers={answers}
          detailedResults={detailedResults}
          quizDuration={quizDuration}
          testMode={testModeAtStart || testMode}
        />
      )}
      {step === "admin" && (
        <AdminDashboard testMode={testMode} setTestMode={setTestMode} />
      )}
      
      {/* Error Modal */}
      <ErrorModal 
        isOpen={errorModal.isOpen}
        title={errorModal.title}
        message={errorModal.message}
        onClose={handleErrorClose}
      />
    </Layout>
  );
};

export default App;
