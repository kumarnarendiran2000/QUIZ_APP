import React, { useEffect, useRef, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../utils/firebase";
import { questions } from "../data/questions";

const AdminDashboard = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState(null);
  const tableRef = useRef();

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "quiz_responses"),
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setSubmissions(data.filter((entry) => entry.score !== undefined));
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching real-time data:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-8xl mx-auto mt-10 p-6 bg-white rounded-md shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-4xl font-bold border-b pb-2 text-gray-800">
          🧾 Admin Dashboard
        </h2>
        <button
          onClick={handlePrint}
          className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 print:hidden"
        >
          Download Results as PDF
        </button>
      </div>

      {loading ? (
        <p className="text-center text-gray-500 text-lg">
          Loading submissions...
        </p>
      ) : submissions.length === 0 ? (
        <p className="text-center text-gray-500 text-lg">
          No submissions found yet.
        </p>
      ) : (
        <div ref={tableRef} className="overflow-x-auto border rounded-md">
          <table className="min-w-full text-sm sm:text-base text-left print:text-xs">
            <thead className="bg-gray-100 text-gray-700 uppercase font-semibold">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Mobile</th>
                <th className="px-4 py-3">Answered</th>
                <th className="px-4 py-3">Unanswered</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3 text-green-700">Correct</th>
                <th className="px-4 py-3 text-red-700">Wrong</th>
                <th className="px-4 py-3">Time Taken</th>
                <th className="px-4 py-3">Completed At</th>
                <th className="px-4 py-3 print:hidden">Action</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((s) => (
                <tr
                  key={s.id}
                  className="border-t hover:bg-gray-50 text-gray-800"
                >
                  <td className="px-4 py-2">{s.name}</td>
                  <td className="px-4 py-2">{s.email}</td>
                  <td className="px-4 py-2">{s.mobile}</td>
                  <td className="px-4 py-2">{s.answeredCount}</td>
                  <td className="px-4 py-2">{s.unansweredCount}</td>
                  <td className="px-4 py-2 font-semibold">{s.score}</td>
                  <td className="px-4 py-2 text-green-600">{s.correctCount}</td>
                  <td className="px-4 py-2 text-red-600">{s.wrongCount}</td>
                  <td className="px-4 py-2">{s.quizDuration || "N/A"}</td>
                  <td className="px-4 py-2">
                    {s.completedAt
                      ? new Date(s.completedAt).toLocaleString()
                      : "N/A"}
                  </td>
                  <td className="px-4 py-2 print:hidden">
                    <button
                      onClick={() => setViewing(s)}
                      className="text-blue-600 underline hover:text-blue-800 text-sm"
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
        <div className="mt-8 p-6 border border-gray-300 rounded-md bg-gray-50">
          <h3 className="text-xl font-bold mb-2 text-gray-800">
            Result for: {viewing.name} ({viewing.email}) - Mobile:{" "}
            {viewing.mobile}
          </h3>
          <p className="mb-4 text-gray-700">
            ✅ Correct: <strong>{viewing.correctCount}</strong> | ❌ Wrong:{" "}
            <strong>{viewing.wrongCount}</strong>
          </p>

          <p className="text-gray-700 mb-2">
            🟦 Answered: <strong>{viewing.answeredCount}</strong> &nbsp;|&nbsp;
            ⬜ Unanswered: <strong>{viewing.unansweredCount}</strong>
          </p>

          {viewing.detailedResults?.map((r, index) => {
            const q = questions[r.q - 1];
            return (
              <div
                key={index}
                className={`mb-4 p-4 rounded-md border ${
                  r.isCorrect
                    ? "border-green-300 bg-green-50"
                    : "border-red-300 bg-red-50"
                }`}
              >
                <h4 className="font-semibold mb-2 text-gray-800">
                  Q{r.q}. {q.question}
                </h4>
                {q.options.map((opt, i) => (
                  <div key={i} className="ml-4">
                    <span
                      className={`text-sm ${
                        r.correct === i
                          ? "font-bold text-green-700"
                          : r.selected === i
                          ? "text-red-500"
                          : "text-gray-700"
                      }`}
                    >
                      {i + 1}. {opt}
                      {r.correct === i && " ✅"}
                      {r.selected === i && r.correct !== i && " ❌"}
                    </span>
                  </div>
                ))}
              </div>
            );
          })}

          <button
            onClick={() => setViewing(null)}
            className="mt-4 text-sm text-gray-600 underline hover:text-gray-800"
          >
            ← Close Result View
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
