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
    <div className="max-w-3xl mx-auto mt-10 p-4">
      <h2 className="text-2xl font-bold mb-4">Quiz Result</h2>
      <p className="mb-2 font-semibold">Name: {userInfo.name}</p>
      <p className="mb-2 font-semibold">Email: {userEmail}</p>
      <p className="mb-4 font-semibold">
        Correct: {correct} / {questions.length} | Wrong: {wrong}
      </p>

      {detailed.map((item, i) => (
        <div
          key={i}
          className={`mb-4 p-3 border rounded ${
            item.isCorrect ? "border-green-400 bg-green-50" : "border-red-400 bg-red-50"
          }`}
        >
          <h4 className="font-semibold mb-1">
            Q{item.q}. {item.question}
          </h4>
          {item.options.map((opt, index) => (
            <div key={index} className="ml-4">
              <span
                className={`${
                  item.correctAnswer === index
                    ? "font-bold text-green-600"
                    : item.selectedAnswer === index
                    ? "text-red-500"
                    : ""
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
  )
}

export default ResultPage