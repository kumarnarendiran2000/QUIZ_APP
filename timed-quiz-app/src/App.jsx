// src/App.jsx
import React, { useEffect, useState } from "react";
import Login from "./components/Login";
import UserForm from "./components/UserForm";
import QuizPage from "./components/QuizPage";
import ResultPage from "./components/ResultPage";
import AdminDashboard from "./components/AdminDashboard";
import Layout from "./components/Layout";
import { db } from "./utils/firebase";
import { doc, setDoc, getDoc, onSnapshot } from "firebase/firestore";
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

    const ref = doc(db, "quiz_responses", loggedInUser.uid);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      const data = snap.data();

      // If quiz was submitted
      if (data.score !== undefined) {
        setUser(loggedInUser);
        setUserInfo({
          name: data.name,
          mobile: data.mobile,
          regno: data.regno || "",
        });
        setAnswers(data.answers || []);
        setDetailedResults(data.detailedResults || []);
        setQuizDuration(data.quizDuration || "N/A");
        setTestModeAtStart(data.testModeAtStart || "post");
        setStep("result");
        return;
      }

      // If quiz already started and not submitted
      if (data.startedAt) {
        const elapsed = Math.floor((Date.now() - data.startedAt) / 1000);
        const remaining = Math.max(QUIZ_DURATION - elapsed, 0);

        if (remaining > 0) {
          setUser(loggedInUser);
          setUserInfo({
            name: data.name || "",
            mobile: data.mobile || "",
            regno: data.regno || "",
          });

          // Normalize answers with nulls
          const normalized = Array(questions.length).fill(null);
          const saved = data.answers || [];
          for (let i = 0; i < saved.length; i++) {
            normalized[i] = saved[i];
          }
          setAnswers(normalized);

          setTimeLeft(remaining);
          // On reload/relogin, restore the value from Firestore as-is (do not increment)
          const restoredTabSwitchCount = data.tabSwitchCount || 0;
          setTabSwitchCount(restoredTabSwitchCount);
          const restoredCopyAttemptCount = data.copyAttemptCount || 0;
          setCopyAttemptCount(restoredCopyAttemptCount);
          if (restoredTabSwitchCount >= 10 || restoredCopyAttemptCount >= 10) {
            setStep("quiz");
            return;
          }
          setStep("quiz");
          return;
        }
      }
    }

    // New user (non-admin)
    setUser(loggedInUser);
    setStep("form");
  };

  // ✅ Step 2: Start Quiz
  const startQuiz = async () => {
    const initialAnswers = Array(questions.length).fill(null);

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
      const ref = doc(db, "quiz_responses", user.uid);

      // First check if the user already has a startedAt timestamp
      const existingSnap = await getDoc(ref);
      const currentStartedAt =
        existingSnap.exists() && existingSnap.data().startedAt;

      await setDoc(
        ref,
        {
          name: userInfo.name,
          email: user.email,
          mobile: userInfo.mobile,
          regno: userInfo.regno,
          // Only set startedAt if it doesn't exist yet - never overwrite it
          ...(currentStartedAt ? {} : { startedAt: Date.now() }),
          answers: initialAnswers,
          testModeAtStart: mode,
        },
        { merge: true }
      );
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
      // Get the existing document to read startedAt
      const userRef = doc(db, "quiz_responses", user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists() && userSnap.data().startedAt) {
        // Calculate time based on server timestamps (startedAt to now)
        const startedAtTime = userSnap.data().startedAt;
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
      const ref = doc(db, "quiz_responses", user.uid);
      await setDoc(
        ref,
        {
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
          completedAt: Date.now(), // Optional: tie-breaker
        },
        { merge: true }
      );

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
