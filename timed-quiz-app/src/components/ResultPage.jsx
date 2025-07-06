// src/components/ResultPage.jsx
import React, { useEffect, useState } from "react";
import { questions } from "../data/questions";
import { doc, getDoc } from "firebase/firestore";
import { db, sendQuizResultEmail, auth } from "../utils/firebase";

const ResultPage = ({
  userInfo,
  userEmail,
  answers,
  detailedResults,
  quizDuration,
  testMode = "post",
}) => {
  const correct = detailedResults.filter((r) => r.isCorrect).length;
  const wrong = detailedResults.length - correct;
  const answeredCount = answers.filter((a) => typeof a === "number").length;
  const unansweredCount = questions.length - answeredCount;

  const [correctAnswers, setCorrectAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  // Removed unused emailError state
  const [emailAlreadySent, setEmailAlreadySent] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastType, setToastType] = useState("info"); // 'success' | 'error' | 'info'
  const [toastMsg, setToastMsg] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch correct answers
        const metadataRef = doc(db, "quiz_metadata", "default");
        const metadataSnap = await getDoc(metadataRef);

        if (metadataSnap.exists()) {
          setCorrectAnswers(metadataSnap.data().correctAnswers);
        } else {
          setFetchError(
            "Test metadata not found. Please contact the administrator."
          );
          return;
        }

        // Check if email has already been sent for this user
        if (auth.currentUser) {
          const userRef = doc(db, "quiz_responses", auth.currentUser.uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists() && userSnap.data().emailSent === true) {
            console.log(
              "Email was already sent previously. Skipping email send."
            );
            setEmailAlreadySent(true);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setFetchError(
          "Failed to load test metadata. Please check your connection or try again later."
        );
      } finally {
        setLoading(false); // Done loading
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    // Send email for both pre and post test after results are loaded
    const sendEmail = async () => {
      try {
        setShowToast(true);
        setToastType("info");
        setToastMsg("Please wait, sending your test results to your email...");
        console.log("Preparing to send test result email...");
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
        console.log("Normalized results for email:", normalizedResults);
        await sendQuizResultEmail({
          answers,
          detailedResults: normalizedResults,
          correctAnswers,
          allQuestions: questions,
          quizDurationFromFrontend: quizDuration,
          testModeFromFrontend: testMode,
          correct,
          wrong,
          total: questions.length,
          score: correct,
        });
        console.log("Test result email sent successfully.");
        // Wait 5 seconds to allow backend to update flag
        setTimeout(() => {
          setShowToast(true);
          setToastType("success");
          setToastMsg(
            "Success! Your test results have been emailed to you. Please check your inbox (or spam folder in rare case)."
          );
        }, 5000);
        setEmailAlreadySent(true);
      } catch (error) {
        console.error("Email sending error:", error);
        setTimeout(() => {
          setShowToast(true);
          setToastType("error");
          setToastMsg(
            "Oops! We couldn’t send your test results email due to a temporary issue. Please refresh and re-login to try again. The email will be retriggered automatically when you relogin and you will land on this page."
          );
        }, 5000);
        // No need to set emailError, toast already handles user feedback for email failure.
      }
    };
    // Only send email when results are ready AND email hasn't been sent before
    if (
      (testMode === "post" || testMode === "pre") &&
      detailedResults &&
      !loading &&
      correctAnswers.length > 0 &&
      !emailAlreadySent
    ) {
      sendEmail();
    }
  }, [
    testMode,
    detailedResults,
    loading,
    correctAnswers,
    answers,
    quizDuration,
    correct,
    wrong,
    emailAlreadySent,
  ]);

  if (loading) {
    return (
      <div className="text-center mt-10 text-lg text-gray-600">
        Preparing your results...
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="text-center mt-10 text-lg text-red-600">{fetchError}</div>
    );
  }

  const topics = [
    "AIRWAY MANAGEMENT",
    "TRAUMA MANAGEMENT",
    "CARDIOPULMONARY RESUSCITATION (CPR)",
    "BASIC PROCEDURES",
  ];
  const questionsByTopic = topics.map((topic) => ({
    topic,
    questions: questions
      .map((q, i) => ({ ...q, index: i }))
      .filter((q) => q.topic === topic),
  }));

  return (
    <div className="max-w-5xl mx-auto mt-10 p-6 bg-white rounded-md shadow-sm relative">
      {/* Toast notification */}
      {showToast && (
        <div
          className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-6 py-4 rounded-lg shadow-lg text-lg font-semibold transition-all duration-300 flex items-center justify-between gap-4
            ${
              toastType === "success"
                ? "bg-green-600 text-white"
                : toastType === "error"
                ? "bg-red-600 text-white"
                : "bg-blue-600 text-white"
            }
          `}
          style={{ minWidth: 280, maxWidth: 400 }}
        >
          <span className="flex-1">{toastMsg}</span>
          <button
            aria-label="Close notification"
            className="ml-4 text-white text-2xl font-bold focus:outline-none hover:opacity-80"
            style={{
              lineHeight: 1,
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
            onClick={() => setShowToast(false)}
          >
            &times;
          </button>
        </div>
      )}
      {/* ...existing code... */}
      {/* Removed unused emailError display */}
      <h2 className="text-3xl font-bold mb-6 text-gray-800 border-b pb-3 text-center bg-gray-50 p-4 rounded-lg shadow-sm">
        🎯 Your Results {testMode === "pre" ? "(Pre-Test)" : "(Post-Test)"}
      </h2>
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-5 rounded-lg border border-gray-200">
        <div className="space-y-2">
          <p className="text-lg">
            <strong className="text-indigo-700">Name:</strong> {userInfo.name}
          </p>
          <p className="text-lg">
            <strong className="text-indigo-700">Registration Number:</strong>{" "}
            {userInfo.regno}
          </p>
          <p className="text-lg">
            <strong className="text-indigo-700">Mobile:</strong>{" "}
            {userInfo.mobile}
          </p>
          <p className="text-lg">
            <strong className="text-indigo-700">Email:</strong> {userEmail}
          </p>
        </div>

        <div className="space-y-3 border-t md:border-t-0 md:border-l border-gray-200 pt-3 md:pt-0 md:pl-6">
          <p className="text-lg font-medium">
            <strong className="text-indigo-700">Score:</strong>{" "}
            <span className="text-xl font-bold">
              {correct} / {questions.length}
            </span>
          </p>
          <p>
            <span className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
              ✅ Correct: {correct}
            </span>{" "}
            <span className="inline-block bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
              ❌ Wrong: {wrong}
            </span>
          </p>
          <p>
            <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
              🟦 Answered: {answeredCount}
            </span>{" "}
            <span className="inline-block bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium">
              ⬜ Unanswered: {unansweredCount}
            </span>
          </p>
          <p className="text-lg">
            <strong className="text-indigo-700">⏱️ Time Taken:</strong>{" "}
            {quizDuration}
          </p>
        </div>
      </div>

      {/* Conditional rendering based on testMode */}
      {testMode === "pre" ? (
        <div className="mt-8 text-center p-6 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="text-2xl font-bold text-blue-800 mb-4">Thank You!</h3>
          <p className="text-xl text-blue-700">
            Thank you for attending the pre-test. Your responses have been
            recorded.
          </p>
          <p className="text-lg text-blue-600 mt-2">
            Please stay in touch with your instructor for further details.
          </p>
          <p className="text-lg font-semibold text-blue-700 mt-4">
            We look forward to seeing you in the post-test!
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-10">
          <div className="mb-8 text-center p-6 bg-green-50 rounded-lg border border-green-200">
            <h3 className="text-2xl font-bold text-green-800 mb-3">
              Thank You!
            </h3>
            <p className="text-xl text-green-700">
              Thank you for attending the post-test. Your responses have been
              recorded.
            </p>
            <p className="text-lg text-green-600 mt-3">
              Please find the question-wise details of your test below for
              reference.
            </p>
          </div>

          {questionsByTopic.map(({ topic, questions: topicQuestions }) => (
            <div key={topic}>
              <h3 className="text-2xl font-bold text-blue-700 mb-4 border-b-2 border-blue-200 pb-2 uppercase tracking-wide bg-blue-50 p-3 rounded-t-lg shadow-sm">
                {topic}
              </h3>
              <div className="space-y-5">
                {topicQuestions.map((q) => {
                  const i = q.index;
                  const selected = answers[i];
                  const correct = correctAnswers[i];
                  const isCorrect = selected === correct;
                  const wasAnswered = typeof selected === "number";
                  return (
                    <div
                      key={i}
                      className={`p-4 rounded-md border ${
                        wasAnswered
                          ? isCorrect
                            ? "border-green-300 bg-green-50"
                            : "border-red-300 bg-red-50"
                          : "border-yellow-300 bg-yellow-50"
                      }`}
                    >
                      <h4 className="font-semibold text-gray-800 mb-2">
                        Q{i + 1}. {q.question}
                      </h4>
                      {q.options.map((opt, index) => (
                        <div key={index} className="ml-4 text-lg">
                          <span
                            className={`${
                              correct === index
                                ? "font-bold text-green-700"
                                : selected === index
                                ? "text-red-600"
                                : "text-gray-700"
                            }`}
                          >
                            {index + 1}. {opt}
                            {correct === index && " ✅"}
                            {selected === index &&
                              selected !== correct &&
                              " ❌"}
                          </span>
                        </div>
                      ))}
                      {!wasAnswered && (
                        <p className="mt-2 text-yellow-600 font-semibold">
                          ❌ Unanswered
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ResultPage;
