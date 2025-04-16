// src/components/ResultPage.jsx
import React, { useEffect, useState } from "react";
import { questions } from "../data/questions";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../utils/firebase";

const ResultPage = ({
  userInfo,
  userEmail,
  answers,
  detailedResults,
  quizDuration,
}) => {
  const correct = detailedResults.filter((r) => r.isCorrect).length;
  const wrong = detailedResults.length - correct;
  const answeredCount = answers.filter((a) => typeof a === "number").length;
  const unansweredCount = questions.length - answeredCount;

  const [correctAnswers, setCorrectAnswers] = useState([]);

  useEffect(() => {
    const fetchCorrectAnswers = async () => {
      const ref = doc(db, "quiz_metadata", "default");
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setCorrectAnswers(snap.data().correctAnswers);
      }
    };

    fetchCorrectAnswers();
  }, []);

  const resultView = questions.map((q, i) => {
    const selected = answers[i];
    const correct = correctAnswers[i];
    const isCorrect = selected === correct;

    return {
      q: i + 1,
      question: q.question,
      options: q.options,
      selected,
      correct,
      isCorrect,
      wasAnswered: typeof selected === "number",
    };
  });

  return (
    <div className="max-w-5xl mx-auto mt-10 p-6 bg-white rounded-md shadow-sm">
      <h2 className="text-3xl font-bold mb-4 text-gray-800 border-b pb-2">
        🎯 Your Quiz Results
      </h2>

      <div className="mb-4 space-y-1 text-lg text-gray-700">
        <p>
          <strong>Name:</strong> {userInfo.name}
        </p>
        <p>
          <strong>Email:</strong> {userEmail}
        </p>
        <p>
          <strong>Mobile:</strong> {userInfo.mobile}
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

      <div className="mt-6 space-y-5">
        {resultView.map((item, i) => (
          <div
            key={i}
            className={`p-4 rounded-md border ${
              item.wasAnswered
                ? item.isCorrect
                  ? "border-green-300 bg-green-50"
                  : "border-red-300 bg-red-50"
                : "border-yellow-300 bg-yellow-50"
            }`}
          >
            <h4 className="font-semibold text-gray-800 mb-2">
              Q{item.q}. {item.question}
            </h4>

            {item.options.map((opt, index) => (
              <div key={index} className="ml-4 text-lg">
                <span
                  className={`${
                    item.correct === index
                      ? "font-bold text-green-700"
                      : item.selected === index
                      ? "text-red-600"
                      : "text-gray-700"
                  }`}
                >
                  {index + 1}. {opt}
                  {item.correct === index && " ✅"}
                  {item.selected === index &&
                    item.selected !== item.correct &&
                    " ❌"}
                </span>
              </div>
            ))}

            {!item.wasAnswered && (
              <p className="mt-2 text-yellow-600 font-semibold">
                ❌ Unanswered
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResultPage;
