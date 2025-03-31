// src/components/ResultPage.jsx
import React from "react"
import { questions } from "../data/questions"

const ResultPage = ({ userInfo, userEmail, answers, detailedResults }) => {
  const correct = detailedResults.filter((r) => r.isCorrect).length
  const wrong = detailedResults.length - correct
  const answeredCount = answers.filter((a) => typeof a === "number").length
  const unansweredCount = questions.length - answeredCount

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
        <p>
          🟦 Answered: <strong>{answeredCount}</strong> &nbsp;|&nbsp;
          ⬜ Unanswered: <strong>{unansweredCount}</strong>
        </p>
      </div>

      <div className="mt-6 space-y-5">
        {detailedResults.map((item, i) => (
          <div
            key={i}
            className={`p-4 rounded-md border ${
              item.isCorrect
                ? "border-green-300 bg-green-50"
                : "border-red-300 bg-red-50"
            }`}
          >
            <h4 className="font-semibold text-gray-800 mb-2">
              Q{item.q}. {questions[i].question}
            </h4>
            {questions[i].options.map((opt, index) => (
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
          </div>
        ))}
      </div>
    </div>
  )
}

export default ResultPage