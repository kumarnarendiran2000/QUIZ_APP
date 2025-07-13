// src/App.jsx
import React, { useEffect, useState } from "react";
import Login from "./components/Login";
import UserForm from "./components/UserForm";
import QuizPage from "./components/QuizPage";
import ResultPage from "./components/ResultPage";
import AdminDashboard from "./components/AdminDashboard";
import Layout from "./components/Layout";
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
      if (reason === "pre_test_required") {
        // Show message that pre-test is required before post-test
        alert("You need to complete a pre-test before taking a post-test.");
      } else if (reason === "post_test_already_taken") {
        // Load the existing post-test quiz and show results
        const existingPostTest = await getQuizResponse(
          loggedInUser.uid,
          "post"
        );
        if (existingPostTest) {
          setUser(loggedInUser);
          setUserInfo({
            name: existingPostTest.name,
            mobile: existingPostTest.mobile,
            regno: existingPostTest.regno || "",
          });
          setAnswers(existingPostTest.answers || []);
          setDetailedResults(existingPostTest.detailedResults || []);
          setQuizDuration(existingPostTest.quizDuration || "N/A");
          setTestModeAtStart("post");
          setStep("result");
          return;
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
      alert("Scoring data missing!");
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
      // Save using our new format
      await saveQuizResponse(user.uid, currentTestMode, {
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
        completedAt: Date.now(),
        // Preserve submission type and reason
        submissionType,
        autoSubmitReason,
      });

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
    </Layout>
  );
};

export default App;
