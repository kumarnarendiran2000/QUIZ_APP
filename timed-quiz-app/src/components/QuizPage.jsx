// src/components/QuizPage.jsx
import React, { useEffect, useState, useRef } from "react";
import { questions } from "../data/questions";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../utils/firebase";

const QuizPage = ({
  answers,
  setAnswers,
  timeLeft,
  setTimeLeft,
  onSubmit,
  user,
  initialTabSwitchCount = 0,
}) => {
  const [tabSwitchCount, setTabSwitchCount] = useState(initialTabSwitchCount);
  const [showProctorWarning, setShowProctorWarning] = useState(false);
  const [proctorAutoSubmit, setProctorAutoSubmit] = useState(false);
  const [proctorCountdown, setProctorCountdown] = useState(0);
  const MAX_TAB_SWITCHES = 5;
  const [submitting, setSubmitting] = useState(false);

  const timerRef = useRef(null);
  const proctorIntervalRef = useRef(null);
  const autoSubmittedRef = useRef(false); // Prevent double auto-submit

  useEffect(() => {
    if (timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => t - 1);
      }, 1000);
    } else {
      onSubmit();
    }

    return () => clearInterval(timerRef.current);
  }, [timeLeft, setTimeLeft, onSubmit]);

  // Proctoring: Tab switch detection and handling
  useEffect(() => {
    const handleVisibility = () => {
      if (
        document.visibilityState === "hidden" &&
        !proctorAutoSubmit &&
        !submitting
      ) {
        setTabSwitchCount((prev) => {
          const newCount = prev + 1;
          // Save to Firestore
          if (user?.uid) {
            setDoc(
              doc(db, "quiz_responses", user.uid),
              { tabSwitchCount: newCount },
              { merge: true }
            );
          }
          return newCount;
        });
        setShowProctorWarning(true);
        setProctorCountdown(15);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [user, proctorAutoSubmit, submitting]);

  // Proctoring: Countdown for popup and auto-submit logic
  useEffect(() => {
    if (showProctorWarning) {
      if (proctorIntervalRef.current) clearInterval(proctorIntervalRef.current);
      proctorIntervalRef.current = setInterval(() => {
        setProctorCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(proctorIntervalRef.current);
            // Only auto-submit if not already submitted
            if (!autoSubmittedRef.current) {
              autoSubmittedRef.current = true;
              setShowProctorWarning(false);
              setProctorAutoSubmit(true);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(proctorIntervalRef.current);
    } else {
      clearInterval(proctorIntervalRef.current);
    }
  }, [showProctorWarning]);

  // If proctorAutoSubmit is set (after 5th switch or timeout), always auto-submit
  useEffect(() => {
    if (proctorAutoSubmit && !submitting) {
      setSubmitting(true);
      setTimeout(() => {
        onSubmit();
      }, 2000); // Show the auto-submit popup for 2 seconds
    }
  }, [proctorAutoSubmit, onSubmit, submitting]);

  // Prevent copy and show warning
  useEffect(() => {
    const handleCopy = (e) => {
      e.preventDefault();
      alert("Proctoring: Copying is not allowed!");
    };
    document.addEventListener("copy", handleCopy);
    return () => document.removeEventListener("copy", handleCopy);
  }, []);

  const handleAnswer = async (index, answer) => {
    const updated = [...answers];
    updated[index] = answer;
    setAnswers(updated);

    if (user?.uid) {
      await setDoc(
        doc(db, "quiz_responses", user.uid),
        { answers: updated },
        { merge: true }
      );
    }
  };

  const handleSubmit = () => {
    clearInterval(timerRef.current); // ⛔ stop timer immediately
    setSubmitting(true);
    onSubmit(); // this still reads timeLeft at this moment
  };

  // When user returns and clicks OK (if under limit)
  const handleProctorOk = () => {
    // Only allow resume if attempts left is 0 or more
    if (tabSwitchCount <= MAX_TAB_SWITCHES) {
      setShowProctorWarning(false);
      setProctorCountdown(0);
      clearInterval(proctorIntervalRef.current);
      autoSubmittedRef.current = false;
      // If attempts left is 0, set proctorAutoSubmit to true so next switch triggers auto-submit
      if (tabSwitchCount === MAX_TAB_SWITCHES) {
        setProctorAutoSubmit(true);
      }
    }
  };

  // Ensure proctoring is enforced after reload/relogin at 0 attempts left
  useEffect(() => {
    if (tabSwitchCount === MAX_TAB_SWITCHES) {
      setProctorAutoSubmit(true);
    }
  }, [tabSwitchCount]);

  useEffect(() => {
    // If user reloads/relogs in with 0 attempts left, re-arm proctoring popup and countdown
    if (
      initialTabSwitchCount === MAX_TAB_SWITCHES &&
      tabSwitchCount === MAX_TAB_SWITCHES &&
      !showProctorWarning &&
      !proctorAutoSubmit
    ) {
      setShowProctorWarning(true);
      setProctorCountdown(15);
    }
    // eslint-disable-next-line
  }, []);

  return (
    <div className="max-w-5xl mx-auto mt-10 p-6 bg-white rounded-md shadow-sm">
      {/* Timer Block */}
      <div className="text-center mb-6">
        <div className="inline-block bg-blue-100 text-blue-800 font-semibold px-6 py-2 rounded-full text-xl shadow-sm">
          ⏱ Time Left: {Math.floor(timeLeft / 60)}:
          {String(timeLeft % 60).padStart(2, "0")}
        </div>
      </div>

      <div className="text-center text-gray-600 mb-4 text-base">
        Answered: {answers.filter((a) => typeof a === "number").length} /{" "}
        {questions.length}
      </div>

      {/* Vertical floating timer - LEFT */}
      <div className="fixed top-75 left-2 sm:top-1/4 sm:left-4 z-50 flex flex-col items-center gap-1 text-xs sm:text-sm">
        <div className="bg-blue-200 text-blue-800 font-bold px-2 py-1 rounded-full shadow border border-blue-300">
          ⏱
        </div>
        <div className="bg-white text-blue-700 font-semibold px-2 py-0.5 rounded">
          {Math.floor(timeLeft / 60)}
        </div>
        <div className="text-blue-700 font-bold">:</div>
        <div className="bg-white text-blue-700 font-semibold px-2 py-0.5 rounded">
          {String(timeLeft % 60).padStart(2, "0")}
        </div>
      </div>

      {/* Vertical floating answered - RIGHT */}
      <div className="fixed top-75 right-2 sm:top-1/4 sm:right-4 z-50 flex flex-col items-center gap-1 text-xs sm:text-sm">
        <div className="bg-green-200 text-green-800 font-bold px-2 py-1 rounded-full shadow border border-green-300">
          ✅
        </div>
        <div className="bg-white text-green-700 font-semibold px-2 py-0.5 rounded">
          {answers.filter((a) => typeof a === "number").length}
        </div>
        <div className="text-green-700 font-bold">/</div>
        <div className="bg-white text-green-700 font-semibold px-2 py-0.5 rounded">
          {questions.length}
        </div>
      </div>

      {/* Quiz Questions */}
      <div className="5">
        {questions.map((q, index) => (
          <div
            key={index}
            className="p-6 border border-gray-300 rounded-md shadow-md bg-white hover:shadow-lg transition"
          >
            <h4 className="text-xl font-bold mb-4 text-gray-800 leading-snug tracking-wide">
              {index + 1}. {q.question}
            </h4>

            <div className="space-y-5">
              {q.options.map((opt, i) => (
                <label
                  key={i}
                  className={`block p-2 pl-4 rounded-md transition cursor-pointer border ${
                    answers[index] === i
                      ? "bg-blue-100 border-blue-500 text-blue-900 font-semibold"
                      : "bg-gray-100 border-transparent hover:bg-gray-200 text-gray-800"
                  }`}
                >
                  <input
                    type="radio"
                    name={`q${index}`}
                    checked={answers[index] !== null && answers[index] === i}
                    onChange={() => handleAnswer(index, i)}
                    className="mr-2"
                  />
                  <span className="text-gray-800 text-lg">{opt}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Submit Button */}
      <div className="mt-10 text-center">
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className={`text-white text-lg font-semibold py-3 px-8 rounded shadow-md transition duration-200 ${
            submitting
              ? "bg-blue-400 cursor-not-allowed opacity-60"
              : "bg-blue-600 hover:bg-blue-700 cursor-pointer"
          }`}
        >
          {submitting ? "Submitting quiz, please wait..." : "Submit Quiz"}
        </button>
      </div>

      {/* Proctoring popups */}
      {showProctorWarning &&
        tabSwitchCount <= MAX_TAB_SWITCHES &&
        !proctorAutoSubmit && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-2xl shadow-2xl text-center max-w-md w-full border-2 border-blue-300 animate-fade-in">
              <h2 className="text-3xl font-extrabold mb-4 text-blue-800 tracking-tight">
                Proctoring Alert
              </h2>
              <div className="flex flex-col items-center justify-center mb-4">
                <span className="text-lg text-gray-700 font-medium mb-2">
                  Tab switching is{" "}
                  <span className="text-red-600 font-bold">prohibited</span>{" "}
                  during the quiz.
                </span>
                <span className="text-base text-gray-600 mb-2">
                  {tabSwitchCount < MAX_TAB_SWITCHES ? (
                    <>
                      You have{" "}
                      <span className="font-bold text-blue-700 text-xl">
                        {MAX_TAB_SWITCHES - tabSwitchCount}
                      </span>{" "}
                      tab switch attempt(s) left.
                      <br />
                      If you do not return and click OK within
                      <span className="inline-block mx-2 px-3 py-1 bg-blue-100 text-blue-800 font-bold rounded-full text-2xl align-middle border border-blue-300 animate-pulse">
                        {proctorCountdown}
                      </span>
                      seconds, your quiz will be auto-submitted.
                    </>
                  ) : tabSwitchCount === MAX_TAB_SWITCHES ? (
                    <>
                      You have{" "}
                      <span className="font-bold text-blue-700 text-xl">0</span>{" "}
                      tab switch attempt(s) left.
                      <br />
                      Auto-submitting in
                      <span className="inline-block mx-2 px-3 py-1 bg-red-100 text-red-700 font-bold rounded-full text-2xl align-middle border border-red-300 animate-pulse">
                        {proctorCountdown}
                      </span>
                      seconds.
                    </>
                  ) : null}
                </span>
              </div>
              <button
                className={`mt-4 px-8 py-3 rounded-lg text-lg font-bold shadow transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50 ${
                  proctorCountdown === 0
                    ? "bg-blue-300 text-white cursor-not-allowed"
                    : "bg-blue-700 hover:bg-blue-800 text-white"
                }`}
                onClick={handleProctorOk}
                disabled={proctorCountdown === 0}
              >
                OK, Resume Quiz
              </button>
            </div>
          </div>
        )}
      {proctorAutoSubmit && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-2xl shadow-2xl text-center max-w-md w-full border-2 border-red-300 animate-fade-in">
            <h2 className="text-3xl font-extrabold mb-4 text-red-700 tracking-tight">
              Auto-Submitting
            </h2>
            <p className="text-lg text-gray-700 font-medium mb-4">
              Tab switching is{" "}
              <span className="text-red-600 font-bold">prohibited</span> and you
              have exceeded the allowed threshold.
              <br />
              <span className="text-blue-700 font-bold">
                Your quiz is being auto-submitted.
              </span>
            </p>
            <div className="flex items-center justify-center mt-4">
              <span className="inline-block px-4 py-2 bg-red-100 text-red-700 font-bold rounded-full text-2xl border border-red-300 animate-pulse">
                Please wait...
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizPage;
