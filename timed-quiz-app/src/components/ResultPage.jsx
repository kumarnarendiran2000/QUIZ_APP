// src/components/ResultPage.jsx
import React from "react"
import { questions } from "../data/questions"

const ResultPage = ({ userInfo, userEmail, answers }) => {
  const score = questions.reduce(
    (total, q, i) => (q.answer === answers[i] ? total + 1 : total),
    0
  )

  return (
    <div className="max-w-xl mx-auto mt-10 p-4 border rounded">
      <h2 className="text-2xl font-bold mb-4">Quiz Result</h2>

      <p><strong>Name:</strong> {userInfo.name}</p>
      <p><strong>Email:</strong> {userEmail}</p>
      <p><strong>Mobile:</strong> {userInfo.mobile}</p>

      <p className="mt-4 font-semibold">Your Score: {score} / {questions.length}</p>

      <div className="mt-4">
        {questions.map((q, index) => (
          <div key={index} className="mb-3">
            <p><strong>{index + 1}. {q.question}</strong></p>
            <p>Your Answer: {q.options[answers[index]] || "Not Answered"}</p>
            <p>Correct Answer: {q.options[q.answer]}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ResultPage
