// src/components/QuizPage.jsx
import React, { useEffect } from "react"
import { questions } from "../data/questions"

const QuizPage = ({ answers, setAnswers, timeLeft, setTimeLeft, onSubmit }) => {
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000)
      return () => clearInterval(timer)
    } else {
      onSubmit()
    }
  }, [timeLeft, setTimeLeft, onSubmit])

  const handleAnswer = (index, answer) => {
    const updated = [...answers]
    updated[index] = answer
    setAnswers(updated)
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
                checked={answers[index] === i}
                onChange={() => handleAnswer(index, i)}
              />{" "}
              {opt}
            </label>
          ))}
        </div>
      ))}

      <button onClick={onSubmit} className="bg-blue-600 text-white px-4 py-2 rounded">
        Submit
      </button>
    </div>
  )
}

export default QuizPage
