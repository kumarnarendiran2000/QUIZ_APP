// src/components/AdminDashboard.jsx
import React, { useEffect, useRef, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../utils/firebase";
import { questions } from "../data/questions";
import { doc, deleteDoc } from "firebase/firestore";

const AdminDashboard = () => {
  const [submissions, setSubmissions] = useState([]);
  const [originalOrder, setOriginalOrder] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState(null);
  const [isSorted, setIsSorted] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // {id, name} or null
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const tableRef = useRef();

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "quiz_responses"),
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        const filtered = data.filter((entry) => entry.score !== undefined);
        setSubmissions(filtered);
        setOriginalOrder(filtered);
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

  const toggleSort = () => {
    if (!isSorted) {
      const sorted = [...submissions].sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;

        const parseTime = (dur) => {
          const [min = "0m", sec = "0s"] = dur.split(" ");
          return parseInt(min) * 60 + parseInt(sec);
        };

        return (
          parseTime(a.quizDuration || "0m 0s") -
          parseTime(b.quizDuration || "0m 0s")
        );
      });
      setSubmissions(sorted);
    } else {
      setSubmissions(originalOrder);
    }
    setIsSorted(!isSorted);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteDoc(doc(db, "quiz_responses", deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      alert("Failed to delete record: " + err.message);
    }
  };

  // Handle select all toggle
  const handleSelectAll = (e) => {
    const checked = e.target.checked;
    setSelectAll(checked);
    if (checked) {
      setSelectedIds(submissions.map((s) => s.id));
    } else {
      setSelectedIds([]);
    }
  };

  // Handle individual row checkbox
  const handleSelectRow = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  // Bulk delete modal state
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);

  // Bulk delete handler (opens modal)
  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    setShowBulkDeleteModal(true);
  };

  // Confirm bulk delete
  const confirmBulkDelete = async () => {
    setBulkDeleteLoading(true);
    for (const id of selectedIds) {
      try {
        await deleteDoc(doc(db, "quiz_responses", id));
      } catch (err) {
        alert("Failed to delete record: " + err.message);
      }
    }
    setSelectedIds([]);
    setSelectAll(false);
    setBulkDeleteLoading(false);
    setShowBulkDeleteModal(false);
  };

  return (
    <div className="max-w-8xl mx-auto mt-10 p-6 bg-white rounded-md shadow-sm">
      {/* Bulk Delete Button */}
      {selectedIds.length > 0 && (
        <div className="mb-4 flex items-center gap-4">
          <button
            onClick={handleBulkDelete}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg shadow transition"
          >
            Delete Selected ({selectedIds.length})
          </button>
          <span className="text-gray-600 text-sm">
            {selectedIds.length} selected
          </span>
        </div>
      )}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-4xl font-bold border-b pb-2 text-gray-800 print:hidden">
          🧾 Admin Dashboard
        </h2>
        <div className="flex gap-4">
          <button
            onClick={toggleSort}
            className="bg-yellow-500 text-white px-4 py-2 rounded shadow hover:bg-yellow-600 print:hidden"
          >
            {isSorted ? "Reset Order" : "Sort by Score & Time"}
          </button>
          <button
            onClick={handlePrint}
            className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 print:hidden"
          >
            Download Results as PDF
          </button>
        </div>
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
                <th className="px-2 py-3">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={handleSelectAll}
                    aria-label="Select all"
                  />
                </th>
                <th className="px-4 py-3">S. No</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Registration Number</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Mobile</th>
                <th className="px-4 py-3">Answered</th>
                <th className="px-4 py-3">Unanswered</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3 text-green-700">Correct</th>
                <th className="px-4 py-3 text-red-700">Wrong</th>
                <th className="px-4 py-3">Time Taken</th>
                <th className="px-4 py-3">Completed At</th>
                <th className="px-4 py-3">Tab Switches</th>
                <th className="px-4 py-3">Copy Attempts</th>
                <th className="px-4 py-3 print:hidden">Action</th>
                <th className="px-4 py-3 print:hidden">Delete</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((s, idx) => (
                <tr
                  key={s.id}
                  className={`border-t hover:bg-gray-50 text-gray-800 ${
                    selectedIds.includes(s.id) ? "bg-blue-50" : ""
                  }`}
                >
                  <td className="px-2 py-2">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(s.id)}
                      onChange={() => handleSelectRow(s.id)}
                      aria-label={`Select row ${idx + 1}`}
                    />
                  </td>
                  <td className="px-4 py-2">{idx + 1}</td>
                  <td className="px-4 py-2">{s.name}</td>
                  <td className="px-4 py-2">{s.regno || "-"}</td>
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
                  <td className="px-4 py-2">
                    {typeof s.tabSwitchCount === "number"
                      ? s.tabSwitchCount
                      : 0}
                  </td>
                  <td className="px-4 py-2">
                    {typeof s.copyAttemptCount === "number"
                      ? s.copyAttemptCount
                      : 0}
                  </td>
                  <td className="px-4 py-2 print:hidden">
                    <button
                      onClick={() => setViewing(s)}
                      className="text-blue-600 underline hover:text-blue-800 text-sm"
                    >
                      View Result
                    </button>
                  </td>
                  <td className="px-4 py-2 print:hidden">
                    <button
                      onClick={() =>
                        setDeleteTarget({ id: s.id, name: s.name })
                      }
                      className="text-red-600 underline hover:text-red-800 text-sm"
                    >
                      Delete
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
          <div className="mb-4">
            <span className="font-bold">Name:</span> {viewing.name} <br />
            <span className="font-bold">Registration Number:</span>{" "}
            {viewing.regno || "-"} <br />
            <span className="font-bold">Email:</span> {viewing.email} <br />
            <span className="font-bold">Mobile:</span> {viewing.mobile}
          </div>
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

      {/* Custom Delete Confirmation Modal (Single) */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 max-w-xs sm:max-w-sm w-[90vw] text-center flex flex-col items-center animate-fade-in border-2 border-red-200">
            <h2 className="text-xl sm:text-2xl font-bold text-red-700 mb-3">
              Confirm Deletion
            </h2>
            <p className="text-gray-700 mb-4 text-base sm:text-lg">
              Are you sure you want to delete the record for
              <span className="font-semibold text-red-700">
                {" "}
                {deleteTarget.name}{" "}
              </span>
              ?
              <br />
              This cannot be undone.
            </p>
            <div className="flex gap-4 w-full justify-center mt-2">
              <button
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg shadow transition w-1/2"
              >
                Delete
              </button>
              <button
                onClick={() => setDeleteTarget(null)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-6 rounded-lg shadow transition w-1/2"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Bulk Delete Confirmation Modal */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 max-w-xs sm:max-w-sm w-[90vw] text-center flex flex-col items-center animate-fade-in border-2 border-red-200">
            <h2 className="text-xl sm:text-2xl font-bold text-red-700 mb-3">
              Confirm Bulk Deletion
            </h2>
            <p className="text-gray-700 mb-4 text-base sm:text-lg">
              Are you sure you want to delete
              <span className="font-semibold text-red-700">
                {" "}
                {selectedIds.length}{" "}
              </span>
              selected record(s)?
              <br />
              This cannot be undone.
            </p>
            <div className="flex gap-4 w-full justify-center mt-2">
              <button
                onClick={confirmBulkDelete}
                disabled={bulkDeleteLoading}
                className={`bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg shadow transition w-1/2 ${
                  bulkDeleteLoading ? "opacity-60 cursor-not-allowed" : ""
                }`}
              >
                {bulkDeleteLoading ? "Deleting..." : "Delete"}
              </button>
              <button
                onClick={() => setShowBulkDeleteModal(false)}
                disabled={bulkDeleteLoading}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-6 rounded-lg shadow transition w-1/2"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
