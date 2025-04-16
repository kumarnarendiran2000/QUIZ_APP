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
}) => {
  const [submitting, setSubmitting] = useState(false);

  const timerRef = useRef(null);

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
    </div>
  );
};

export default QuizPage;
