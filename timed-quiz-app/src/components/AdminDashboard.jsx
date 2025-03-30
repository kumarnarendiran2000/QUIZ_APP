import React, { useEffect, useState } from "react"
import { collection, onSnapshot } from "firebase/firestore"
import { db } from "../utils/firebase"

const AdminDashboard = () => {
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)

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

    return () => unsubscribe() // 🔁 Cleanup listener on unmount
  }, [])

  return (
    <div className="max-w-5xl mx-auto mt-10 p-4">
      <h2 className="text-2xl font-bold mb-4">Admin Dashboard</h2>

      {loading ? (
        <p className="text-center text-gray-500">Loading submissions...</p>
      ) : submissions.length === 0 ? (
        <p className="text-center text-gray-500">No submissions found yet.</p>
      ) : (
        <div className="overflow-x-auto border rounded">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2">Name</th>
                <th className="p-2">Email</th>
                <th className="p-2">Mobile</th>
                <th className="p-2">Score</th>
                <th className="p-2">Submitted At</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((s, i) => (
                <tr key={i} className="border-t hover:bg-gray-50">
                  <td className="p-2">{s.name}</td>
                  <td className="p-2">{s.email}</td>
                  <td className="p-2">{s.mobile}</td>
                  <td className="p-2 font-semibold">{s.score}</td>
                  <td className="p-2">{new Date(s.submittedAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard