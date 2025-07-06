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
  const [emailError, setEmailError] = useState("");
  const [emailAlreadySent, setEmailAlreadySent] = useState(false);

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
            "Quiz metadata not found. Please contact the administrator."
          );
          return;
        }
        
        // Check if email has already been sent for this user
        if (auth.currentUser) {
          const userRef = doc(db, "quiz_responses", auth.currentUser.uid);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists() && userSnap.data().emailSent === true) {
            console.log("Email was already sent previously. Skipping email send.");
            setEmailAlreadySent(true);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setFetchError(
          "Failed to load quiz metadata. Please check your connection or try again later."
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
        console.log("Sending quiz result email with frontend data...");

        // Create normalized detailed results to match backend's expected format
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

        // Pass data to backend function
        const result = await sendQuizResultEmail({
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
        console.log("Email sent successfully:", result);
        
        // Mark email as sent locally to prevent duplicate sending in this session
        setEmailAlreadySent(true);
      } catch (error) {
        console.error("Email sending error:", error);
        setEmailError(
          "Failed to send quiz result email. Please check your connection or try again later."
        );
      }
    };

    // Only send email when results are ready AND email hasn't been sent before
    if (
      (testMode === "post" || testMode === "pre") &&
      detailedResults &&
      detailedResults.length > 0 &&
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
    emailAlreadySent
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
    <div className="max-w-5xl mx-auto mt-10 p-6 bg-white rounded-md shadow-sm">
      {emailError && (
        <div className="mb-4 text-center text-red-600 font-semibold">
          {emailError}
        </div>
      )}
      <h2 className="text-3xl font-bold mb-4 text-gray-800 border-b pb-2">
        🎯 Your Quiz Results
      </h2>
      <div className="mb-4 space-y-1 text-lg text-gray-700">
        <p>
          <strong>Name:</strong> {userInfo.name}
        </p>
        <p>
          <strong>Registration Number:</strong> {userInfo.regno}
        </p>
        <p>
          <strong>Mobile:</strong> {userInfo.mobile}
        </p>
        <p>
          <strong>Email:</strong> {userEmail}
        </p>
        <p>
          <strong>Score:</strong> {correct} / {questions.length} &nbsp;|&nbsp;
          ✅ Correct:{" "}
          <span className="text-green-600 font-semibold">{correct}</span>{" "}
          &nbsp;|&nbsp; ❌ Wrong:{" "}
          <span className="text-red-600 font-semibold">{wrong}</span>
        </p>
        <p>
          🟦 Answered: <strong>{answeredCount}</strong> &nbsp;|&nbsp; ⬜
          Unanswered: <strong>{unansweredCount}</strong>
        </p>
        <p>
          ⏱️ <strong>Time Taken:</strong> {quizDuration}
        </p>
      </div>

      {/* Conditional rendering based on testMode */}
      {testMode === "pre" ? (
        <div className="mt-8 text-center text-xl text-blue-800 font-semibold">
          Thank you for attending the test. Your responses have been recorded.
          <br />
          Please contact your instructor for further feedback.
        </div>
      ) : (
        <div className="mt-6 space-y-10">
          {questionsByTopic.map(({ topic, questions: topicQuestions }) => (
            <div key={topic}>
              <h3 className="text-2xl font-bold text-blue-700 mb-4 border-b-2 border-blue-200 pb-2 uppercase tracking-wide">
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
