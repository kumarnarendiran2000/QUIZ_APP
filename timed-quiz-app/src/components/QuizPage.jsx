// src/components/QuizPage.jsx
import React, { useEffect, useState, useRef } from "react";
import {
  handleAutoSubmit,
  updateSubmissionStatus,
} from "../utils/QuizPageHelpers";

const QuizPage = ({
  answers,
  setAnswers,
  timeLeft,
  setTimeLeft,
  onSubmit,
  user,
  initialTabSwitchCount = 0,
  initialCopyAttemptCount = 0,
  questions,
}) => {
  const [tabSwitchCount, setTabSwitchCount] = useState(initialTabSwitchCount);
  const [showProctorWarning, setShowProctorWarning] = useState(false);
  const [proctorAutoSubmit, setProctorAutoSubmit] = useState(false);
  const [proctorCountdown, setProctorCountdown] = useState(0);
  const [showCopyWarning, setShowCopyWarning] = useState(false);
  const [copyAttemptCount, setCopyAttemptCount] = useState(0);
  const MAX_TAB_SWITCHES = 10;
  const MAX_COPY_ATTEMPTS = 10;
  const [submitting, setSubmitting] = useState(false);

  const timerRef = useRef(null);
  const proctorIntervalRef = useRef(null);
  const autoSubmittedRef = useRef(false); // Prevent double auto-submit

  // Store the startedAt timestamp locally for more accurate timing
  const startedAtRef = useRef(null);

  useEffect(() => {
    // Timer effect - countdown logic with server-time synchronization
    if (timeLeft > 0) {
      // Get startedAt once to use for all calculations
      if (!startedAtRef.current && user?.uid) {
        // Retrieve the startedAt value from Firestore
        (async () => {
          try {
            // Import here to avoid circular dependencies
            const { getTestMode } = await import("../utils/quizSettings");
            const { getQuizResponse } = await import("../utils/quizStorage");

            // Get current test mode
            const currentTestMode = await getTestMode();

            // Get quiz response using the new format
            const quizData = await getQuizResponse(user.uid, currentTestMode);

            if (quizData && quizData.startedAt) {
              startedAtRef.current = quizData.startedAt;
            }
          } catch (error) {
            console.error("Error fetching startedAt:", error);
          }
        })();
      }

      // Set up the timer with a slightly more frequent update to ensure accuracy
      timerRef.current = setInterval(() => {
        if (startedAtRef.current) {
          // Calculate remaining time based on server timestamp
          const elapsedSec = Math.floor(
            (Date.now() - startedAtRef.current) / 1000
          );
          const serverTimeLeft = Math.max(0, 1200 - elapsedSec); // 1200 = QUIZ_DURATION

          // Only update if there's a meaningful difference to avoid unnecessary re-renders
          if (Math.abs(serverTimeLeft - timeLeft) >= 1) {
            setTimeLeft(serverTimeLeft);
          } else {
            // Normal countdown when in sync
            setTimeLeft((t) => Math.max(0, t - 1));
          }
        } else {
          // If startedAt not available yet, use normal countdown
          setTimeLeft((t) => Math.max(0, t - 1));
        }
      }, 1000);
    } else if (timeLeft <= 0 && !submitting && !autoSubmittedRef.current) {
      // Prevent multiple auto-submissions
      autoSubmittedRef.current = true;
      setSubmitting(true);

      // Record time expiry auto-submission reason
      if (user?.uid) {
        handleAutoSubmit(user, "timeExpired", onSubmit);
      } else {
        onSubmit();
      }
    }

    return () => clearInterval(timerRef.current);
  }, [timeLeft, setTimeLeft, onSubmit, user, submitting]);

  // Handle tab visibility changes to ensure timer keeps running even when tab is inactive
  useEffect(() => {
    if (!user?.uid) return; // Only run this for logged in users

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && startedAtRef.current) {
        // Immediate sync when tab becomes visible again
        const elapsedSec = Math.floor(
          (Date.now() - startedAtRef.current) / 1000
        );
        const serverTimeLeft = Math.max(0, 1200 - elapsedSec); // 1200 = QUIZ_DURATION

        if (Math.abs(serverTimeLeft - timeLeft) >= 2) {
          console.log(
            `Tab visible sync: Client: ${timeLeft}s, Server: ${serverTimeLeft}s`
          );
          setTimeLeft(serverTimeLeft);
        }
      }
    };

    // Register visibility change event for timer sync
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [timeLeft, setTimeLeft, user]);

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
            // Use the imported functions
            import("../utils/QuizPageHelpers").then(
              ({ updateTabSwitchCount }) => {
                updateTabSwitchCount(user, newCount);
              }
            );
          }
          return newCount;
        });
        setShowProctorWarning(true);
        setProctorCountdown(20);
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
              setSubmitting(true);

              // Update Firestore with auto-submit reason for tab switching timeout
              if (user?.uid) {
                updateSubmissionStatus(user, "auto", "tabSwitchTimeout");
              }

              setTimeout(() => {
                onSubmit();
              }, 2000); // Show the auto-submit popup for 2 seconds
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
  }, [showProctorWarning, onSubmit, user]);

  // If proctorAutoSubmit is set (after 5th switch or timeout), always auto-submit
  useEffect(() => {
    if (proctorAutoSubmit && !submitting) {
      setSubmitting(true);

      // Update Firestore with auto-submit reason for max tab switches reached
      if (user?.uid && tabSwitchCount >= MAX_TAB_SWITCHES) {
        updateSubmissionStatus(user, "auto", "maxTabSwitches");
      }

      setTimeout(() => {
        onSubmit();
      }, 2000); // Show the auto-submit popup for 2 seconds
    }
  }, [proctorAutoSubmit, onSubmit, submitting, user, tabSwitchCount]);

  // Prevent copy and show warning
  useEffect(() => {
    const handleCopy = (e) => {
      e.preventDefault();
      setCopyAttemptCount((prev) => {
        const newCount = prev + 1;
        // Save to Firestore
        if (user?.uid) {
          // Use the imported functions
          import("../utils/QuizPageHelpers").then(
            ({ updateCopyAttemptCount }) => {
              updateCopyAttemptCount(user, newCount);
            }
          );
        }
        return newCount;
      });
      setShowCopyWarning(true);
    };
    document.addEventListener("copy", handleCopy);
    return () => document.removeEventListener("copy", handleCopy);
  }, [user, proctorAutoSubmit, submitting]);

  // Auto-submit if copy attempts exceed limit
  useEffect(() => {
    if (copyAttemptCount >= MAX_COPY_ATTEMPTS && !submitting) {
      setShowCopyWarning(false);
      setProctorAutoSubmit(true);
      setSubmitting(true);

      // Update Firestore with auto-submit reason
      if (user?.uid) {
        updateSubmissionStatus(user, "auto", "maxCopyAttempts");
      }

      setTimeout(() => {
        onSubmit();
      }, 2000); // Show the auto-submit popup for 2 seconds
    }
  }, [copyAttemptCount, submitting, onSubmit, user]);

  // Restore copyAttemptCount from Firestore on mount (if present)
  useEffect(() => {
    if (typeof initialCopyAttemptCount === "number") {
      setCopyAttemptCount(initialCopyAttemptCount);
    }
  }, [initialCopyAttemptCount]);

  const handleAnswer = async (index, answer) => {
    const updated = [...answers];
    updated[index] = answer;
    setAnswers(updated);

    if (user?.uid) {
      const { updateAnswer } = await import("../utils/QuizPageHelpers");
      await updateAnswer(user, updated);
    }
  };

  const handleSubmit = () => {
    clearInterval(timerRef.current); // ⛔ stop timer immediately
    setSubmitting(true);

    // Update Firestore with manual submission type
    if (user?.uid) {
      // Update device info first
      import("../utils/QuizPageHelpers").then(({ updateDeviceInfo }) => {
        updateDeviceInfo(user).then(() => {
          // Then update submission type
          updateSubmissionStatus(user, "manual", null).then(() => {
            onSubmit(); // this still reads timeLeft at this moment
          });
        });
      });
    } else {
      onSubmit();
    }
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

  // Group questions by topic
  const topics = [
    "AIRWAY MANAGEMENT",
    "TRAUMA MANAGEMENT",
    "CARDIOPULMONARY RESUSCITATION (CPR)",
    "BASIC PROCEDURES",
  ];
  const questionsByTopic = topics.map((topic) => ({
    topic,
    questions: questions.filter((q) => q.topic === topic),
  }));

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

      {/* Quiz Questions - Grouped by Topic */}
      <div className="5">
        {questionsByTopic.map(({ topic, questions: topicQuestions }) => (
          <div key={topic} className="mb-10">
            <h3 className="text-2xl font-bold text-blue-700 mb-6 border-b-2 border-blue-200 pb-2 uppercase tracking-wide">
              {topic}
            </h3>
            {topicQuestions.map((q) => {
              // Find the global index of this question in the full questions array
              const globalIndex = questions.findIndex(
                (qq) => qq.question === q.question && qq.topic === q.topic
              );
              return (
                <div
                  key={globalIndex}
                  className="p-6 border border-gray-300 rounded-md shadow-md bg-white hover:shadow-lg transition mb-6"
                >
                  <h4 className="text-xl font-bold mb-4 text-gray-800 leading-snug tracking-wide">
                    {globalIndex + 1}. {q.question}
                  </h4>

                  <div className="space-y-5">
                    {q.options.map((opt, i) => (
                      <label
                        key={i}
                        className={`block p-2 pl-4 rounded-md transition cursor-pointer border ${
                          answers[globalIndex] === i
                            ? "bg-blue-100 border-blue-500 text-blue-900 font-semibold"
                            : "bg-gray-100 border-transparent hover:bg-gray-200 text-gray-800"
                        }`}
                      >
                        <input
                          type="radio"
                          name={`q${globalIndex}`}
                          checked={
                            answers[globalIndex] !== null &&
                            answers[globalIndex] === i
                          }
                          onChange={() => handleAnswer(globalIndex, i)}
                          className="mr-2"
                        />
                        <span className="text-gray-800 text-lg">{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
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
          {submitting ? "Submitting test, please wait..." : "Submit Test"}
        </button>
      </div>

      {/* Proctoring popups */}
      {showProctorWarning &&
        tabSwitchCount <= MAX_TAB_SWITCHES &&
        !proctorAutoSubmit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm">
            <div className="relative bg-white/80 backdrop-blur-lg p-6 sm:p-10 rounded-3xl shadow-2xl text-center max-w-xs sm:max-w-md w-[90vw] border-2 border-blue-200 animate-fade-in flex flex-col items-center">
              <h2 className="text-2xl sm:text-3xl font-extrabold mb-3 sm:mb-4 text-blue-800 tracking-tight drop-shadow-lg">
                <span className="inline-block align-middle mr-2">⚠️</span>
                Proctoring Alert
              </h2>
              <div className="flex flex-col items-center justify-center mb-3 sm:mb-4 w-full">
                <span className="text-base sm:text-lg text-gray-700 font-medium mb-1 sm:mb-2">
                  Tab switching is{" "}
                  <span className="text-red-600 font-bold">prohibited</span>{" "}
                  during the test.
                </span>
                <span className="text-sm sm:text-base text-gray-600 mb-2 w-full">
                  {tabSwitchCount < MAX_TAB_SWITCHES ? (
                    <>
                      You have
                      <span className="font-bold text-blue-700 text-xl sm:text-2xl mx-1">
                        {MAX_TAB_SWITCHES - tabSwitchCount}
                      </span>
                      tab switch attempt(s) left.
                      <br />
                      If you do not return and click Resume within
                      <span className="inline-flex items-center justify-center mx-2 w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-blue-200 to-blue-400 text-blue-900 font-extrabold text-2xl sm:text-3xl border-4 border-blue-300 shadow-lg animate-pulse relative">
                        <svg
                          className="absolute top-0 left-0 w-full h-full"
                          viewBox="0 0 40 40"
                        >
                          <circle
                            cx="20"
                            cy="20"
                            r="18"
                            fill="none"
                            stroke="#3b82f6"
                            strokeWidth="3"
                            strokeDasharray="113"
                            strokeDashoffset={`${
                              113 - (proctorCountdown / 15) * 113
                            }`}
                          />
                        </svg>
                        <span className="relative z-10">
                          {proctorCountdown}
                        </span>
                      </span>
                      seconds, your test will be auto-submitted.
                    </>
                  ) : tabSwitchCount === MAX_TAB_SWITCHES ? (
                    <>
                      You have
                      <span className="font-bold text-blue-700 text-xl sm:text-2xl mx-1">
                        0
                      </span>
                      tab switch attempt(s) left.
                      <br />
                      <span className="font-bold text-red-700">
                        Auto-submitting...
                      </span>
                    </>
                  ) : null}
                </span>
              </div>
              {/* Only show Resume button if attempts left > 0 */}
              {tabSwitchCount < MAX_TAB_SWITCHES && (
                <button
                  className={`mt-3 sm:mt-4 px-8 py-3 rounded-xl text-lg sm:text-xl font-bold shadow-lg transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50 w-full sm:w-auto
                    ${
                      proctorCountdown === 0
                        ? "bg-blue-300 text-white cursor-not-allowed opacity-70"
                        : "bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white"
                    }
                  `}
                  onClick={handleProctorOk}
                  disabled={proctorCountdown === 0}
                >
                  <span className="inline-block align-middle mr-2">🔓</span>
                  Resume Test
                </button>
              )}
            </div>
          </div>
        )}
      {/* Tab switch auto-submit popup */}
      {proctorAutoSubmit &&
        !(copyAttemptCount >= MAX_COPY_ATTEMPTS && submitting) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm">
            <div className="bg-white/80 backdrop-blur-lg p-6 sm:p-10 rounded-3xl shadow-2xl text-center max-w-xs sm:max-w-md w-[90vw] border-2 border-red-200 animate-fade-in flex flex-col items-center">
              <h2 className="text-2xl sm:text-3xl font-extrabold mb-3 sm:mb-4 text-red-700 tracking-tight drop-shadow-lg">
                <span className="inline-block align-middle mr-2">⏳</span>
                Auto-Submitting
              </h2>
              <p className="text-base sm:text-lg text-gray-700 font-medium mb-3 sm:mb-4">
                Tab switching is{" "}
                <span className="text-red-600 font-bold">prohibited</span> and
                you have exceeded the allowed threshold.
                <br />
                <span className="font-bold text-blue-700">
                  0 tab switch attempt(s) left.
                </span>
                <br />
                <span className="text-blue-700 font-bold">
                  Your test is being auto-submitted.
                </span>
              </p>
              <div className="flex items-center justify-center mt-2">
                <span className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-red-200 to-red-400 text-red-700 font-extrabold text-2xl sm:text-3xl border-4 border-red-300 shadow-lg animate-pulse">
                  <span className="relative z-10">Please wait...</span>
                </span>
              </div>
            </div>
          </div>
        )}
      {/* Copying auto-submit popup (separate) */}
      {copyAttemptCount >= MAX_COPY_ATTEMPTS && submitting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm">
          <div className="bg-white/90 backdrop-blur-lg p-6 sm:p-10 rounded-3xl shadow-2xl text-center max-w-xs sm:max-w-md w-[90vw] border-2 border-red-200 animate-fade-in flex flex-col items-center">
            <h2 className="text-2xl sm:text-3xl font-extrabold mb-3 sm:mb-4 text-red-700 tracking-tight drop-shadow-lg">
              <span className="inline-block align-middle mr-2">🚫</span>
              Copy Attempts Exceeded
            </h2>
            <p className="text-base sm:text-lg text-gray-700 font-medium mb-3 sm:mb-4">
              Copying is{" "}
              <span className="text-red-600 font-bold">not allowed</span> and
              you have exceeded the allowed attempts.
              <br />
              <span className="font-bold text-red-700">
                0 copy attempts left.
              </span>
              <br />
              <span className="text-blue-700 font-bold">
                Your test is being auto-submitted.
              </span>
            </p>
            <div className="flex items-center justify-center mt-2">
              <span className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-red-200 to-red-400 text-red-700 font-extrabold text-2xl sm:text-3xl border-4 border-red-300 shadow-lg animate-pulse">
                <span className="relative z-10">Please wait...</span>
              </span>
            </div>
          </div>
        </div>
      )}
      {/* Copying Prohibited Popup */}
      {showCopyWarning && !proctorAutoSubmit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm">
          <div className="relative bg-white/90 backdrop-blur-lg p-6 sm:p-10 rounded-3xl shadow-2xl text-center max-w-xs sm:max-w-md w-[90vw] border-2 border-red-200 animate-fade-in flex flex-col items-center">
            <h2 className="text-2xl sm:text-3xl font-extrabold mb-3 sm:mb-4 text-red-700 tracking-tight drop-shadow-lg">
              <span className="inline-block align-middle mr-2">🚫</span>
              Copying Prohibited
            </h2>
            <div className="flex flex-col items-center justify-center mb-3 sm:mb-4 w-full">
              <span className="text-base sm:text-lg text-gray-700 font-medium mb-1 sm:mb-2">
                Copying is{" "}
                <span className="text-red-600 font-bold">not allowed</span>{" "}
                during the test.
              </span>
              <span className="text-sm sm:text-base text-gray-600 mb-2 w-full">
                {copyAttemptCount < MAX_COPY_ATTEMPTS ? (
                  <>
                    You have
                    <span className="font-bold text-red-700 text-xl sm:text-2xl mx-1">
                      {MAX_COPY_ATTEMPTS - copyAttemptCount}
                    </span>
                    copy attempt(s) left.
                    <br />
                    If you try to copy again, your test will be{" "}
                    <span className="font-bold text-red-700">
                      auto-submitted
                    </span>
                    .<br />
                    <span className="text-blue-700 font-semibold">
                      Every action is being recorded.
                    </span>
                  </>
                ) : (
                  <>
                    You have
                    <span className="font-bold text-red-700 text-xl sm:text-2xl mx-1">
                      0
                    </span>
                    copy attempts left.
                    <br />
                    <span className="font-bold text-red-700">
                      Auto-submitting...
                    </span>
                  </>
                )}
              </span>
            </div>
            <button
              className="mt-3 sm:mt-4 px-8 py-3 rounded-xl text-lg sm:text-xl font-bold shadow-lg transition duration-200 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-50 w-full sm:w-auto bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white"
              onClick={() => setShowCopyWarning(false)}
              disabled={copyAttemptCount >= MAX_COPY_ATTEMPTS}
            >
              <span className="inline-block align-middle mr-2">✖️</span>Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizPage;
