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

    // 🔐 Save progress to Firestore
    if (user?.uid) {
      await setDoc(
        doc(db, "quiz_responses", user.uid),
        { answers: updated },
        { merge: true }
      )
    }
  }

  return (
    <div className="max-w-xl mx-auto mt-10 p-4 border rounded">
      <div className="mb-4 font-semibold">
        Time Left: {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
      </div>

      {questions.map((q, index) => (
        <div key={index} className="mb-4">
          <h4 className="font-semibold">
            {index + 1}. {q.question}
          </h4>
          {q.options.map((opt, i) => (
            <label key={i} className="block">
              <input
                type="radio"
                name={`q${index}`}
                checked={answers[index] !== null && answers[index] === i}
                onChange={() => handleAnswer(index, i)}
              />{" "}
              {opt}
            </label>
          ))}
        </div>
      ))}

      <button
        onClick={() => {
          setSubmitting(true)
          onSubmit()
        }}
        disabled={submitting}
        className="bg-blue-600 text-white px-4 py-2 rounded cursor-pointer"
      >
        {submitting ? "Submitting..." : "Submit"}
      </button>
    </div>
  )
}

export default QuizPage