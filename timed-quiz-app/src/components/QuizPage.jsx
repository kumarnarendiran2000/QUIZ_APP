// src/components/QuizPage.jsx
import React, { useEffect, useState } from "react"
import { questions } from "../data/questions"
import { doc, setDoc } from "firebase/firestore"
import { db } from "../utils/firebase"

const QuizPage = ({ answers, setAnswers, timeLeft, setTimeLeft, onSubmit, user }) => {
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000)
      return () => clearInterval(timer)
    } else {
      onSubmit()
    }
  }, [timeLeft, setTimeLeft, onSubmit])

  const handleAnswer = async (index, answer) => {
    const updated = [...answers]
    updated[index] = answer
    setAnswers(updated)

    if (user?.uid) {
      await setDoc(
        doc(db, "quiz_responses", user.uid),
        { answers: updated },
        { merge: true }
      )
    }
  }

  const handleSubmit = () => {
    setSubmitting(true)
    onSubmit()
  }

  return (
    <div className="max-w-5xl mx-auto mt-10 p-6 bg-white rounded-md shadow-sm">
      {/* Timer Block */}
      <div className="text-center mb-6">
        <div className="inline-block bg-blue-100 text-blue-800 font-semibold px-6 py-2 rounded-full text-xl shadow-sm">
          ⏱ Time Left: {Math.floor(timeLeft / 60)}:
          {String(timeLeft % 60).padStart(2, "0")}
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
  )
}

export default QuizPage