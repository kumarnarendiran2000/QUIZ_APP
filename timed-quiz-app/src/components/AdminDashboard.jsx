import React, { useEffect, useState } from "react"
import { collection, onSnapshot } from "firebase/firestore"
import { db } from "../utils/firebase"
import { questions } from "../data/questions"

const AdminDashboard = () => {
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewing, setViewing] = useState(null) // ← For viewing one result

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "quiz_responses"),
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        setSubmissions(data.filter(entry => entry.score !== undefined))
        setLoading(false)
      },
      (error) => {
        console.error("Error fetching real-time data:", error)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  return (
    <div className="max-w-6xl mx-auto mt-10 p-4">
      <h2 className="text-2xl font-bold mb-4">Admin Dashboard</h2>

      {loading ? (
        <p className="text-center text-gray-500">Loading submissions...</p>
      ) : submissions.length === 0 ? (
        <p className="text-center text-gray-500">No submissions found yet.</p>
      ) : (
        <div className="overflow-x-auto border rounded mb-8">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2">Name</th>
                <th className="p-2">Email</th>
                <th className="p-2">Score</th>
                <th className="p-2">Correct</th>
                <th className="p-2">Wrong</th>
                <th className="p-2">Submitted At</th>
                <th className="p-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((s) => (
                <tr key={s.id} className="border-t hover:bg-gray-50">
                  <td className="p-2">{s.name}</td>
                  <td className="p-2">{s.email}</td>
                  <td className="p-2">{s.score}</td>
                  <td className="p-2 text-green-600">{s.correctCount}</td>
                  <td className="p-2 text-red-600">{s.wrongCount}</td>
                  <td className="p-2">
                    {new Date(s.submittedAt).toLocaleString()}
                  </td>
                  <td className="p-2">
                    <button
                      className="text-blue-600 underline cursor-pointer"
                      onClick={() => setViewing(s)}
                    >
                      View Result
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {viewing && (
        <div className="bg-white border rounded p-4 shadow-md">
          <h3 className="text-xl font-bold mb-2">
            Result: {viewing.name} ({viewing.email})
          </h3>
          <p className="mb-2">
            ✅ Correct: <strong>{viewing.correctCount}</strong> | ❌ Wrong:{" "}
            <strong>{viewing.wrongCount}</strong>
          </p>

          {viewing.detailedResults?.map((r, index) => {
            const q = questions[r.q - 1]
            return (
              <div
                key={index}
                className={`mb-3 p-3 rounded border ${
                  r.isCorrect ? "border-green-400 bg-green-50" : "border-red-400 bg-red-50"
                }`}
              >
                <h4 className="font-semibold mb-1">
                  Q{r.q}. {q.question}
                </h4>
                {q.options.map((opt, i) => (
                  <div key={i} className="ml-4">
                    <span
                      className={`${
                        r.correct === i
                          ? "font-bold text-green-600"
                          : r.selected === i
                          ? "text-red-500"
                          : ""
                      }`}
                    >
                      {i + 1}. {opt}
                      {r.correct === i && " ✅"}
                      {r.selected === i && r.correct !== i && " ❌"}
                    </span>
                  </div>
                ))}
              </div>
            )
          })}

          <button
            className="mt-4 text-sm text-gray-600 underline"
            onClick={() => setViewing(null)}
          >
            ← Close Result View
          </button>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard