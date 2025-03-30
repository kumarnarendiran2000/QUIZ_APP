// src/components/ResultPage.jsx
import React from "react"
import { questions } from "../data/questions"

const ResultPage = ({ userInfo, userEmail, answers }) => {
  let correct = 0
  const detailed = questions.map((q, i) => {
    const selected = answers[i]
    const isCorrect = selected === q.answer
    if (isCorrect) correct++

    return {
      q: i + 1,
      question: q.question,
      options: q.options,
      correctAnswer: q.answer,
      selectedAnswer: selected,
      isCorrect,
    }
  })

  const wrong = questions.length - correct

  return (
    <div className="max-w-5xl mx-auto mt-10 p-6 bg-white rounded-md shadow-sm">
      <h2 className="text-3xl font-bold mb-4 text-gray-800 border-b pb-2">
        🎯 Your Quiz Results
      </h2>

      <div className="mb-4 space-y-1 text-lg text-gray-700">
        <p><strong>Name:</strong> {userInfo.name}</p>
        <p><strong>Email:</strong> {userEmail}</p>
        <p><strong>Mobile:</strong> {userInfo.mobile}</p>
        <p>
          <strong>Score:</strong> {correct} / {questions.length} &nbsp;|&nbsp;
          ✅ Correct: <span className="text-green-600 font-semibold">{correct}</span> &nbsp;|&nbsp;
          ❌ Wrong: <span className="text-red-600 font-semibold">{wrong}</span>
        </p>
      </div>

      <div className="mt-6 space-y-5">
        {detailed.map((item, i) => (
          <div
            key={i}
            className={`p-4 rounded-md border ${
              item.isCorrect
                ? "border-green-300 bg-green-50"
                : "border-red-300 bg-red-50"
            }`}
          >
            <h4 className="font-semibold text-gray-800 mb-2">
              Q{item.q}. {item.question}
            </h4>
            {item.options.map((opt, index) => (
              <div key={index} className="ml-4 text-lg">
                <span
                  className={`${
                    item.correctAnswer === index
                      ? "font-bold text-green-700"
                      : item.selectedAnswer === index
                      ? "text-red-600"
                      : "text-gray-700"
                  }`}
                >
                  {index + 1}. {opt}
                  {item.correctAnswer === index && " ✅"}
                  {item.selectedAnswer === index &&
                    item.selectedAnswer !== item.correctAnswer &&
                    " ❌"}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export default ResultPage