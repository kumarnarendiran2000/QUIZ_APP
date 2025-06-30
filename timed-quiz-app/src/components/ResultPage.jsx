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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCorrectAnswers = async () => {
      const ref = doc(db, "quiz_metadata", "default");
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setCorrectAnswers(snap.data().correctAnswers);
      }
      setLoading(false); // Done loading
    };

    fetchCorrectAnswers();
  }, []);

  if (loading) {
    return (
      <div className="text-center mt-10 text-lg text-gray-600">
        Preparing your results...
      </div>
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

      {/* Results grouped by topic */}
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
                          {selected === index && selected !== correct && " ❌"}
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
    </div>
  );
};

export default ResultPage;
