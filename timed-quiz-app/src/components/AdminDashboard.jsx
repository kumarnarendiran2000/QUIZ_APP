// src/components/AdminDashboard.jsx
import React, { useEffect, useRef, useState } from "react";
import {
  getTestMode,
  setTestMode as saveTestMode,
} from "../utils/quizSettings";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../utils/firebase";
import { questions } from "../data/questions";
import { exportSubmissionsToExcel } from "../utils/exportToExcel";
import { exportSubmissionsToPDF } from "../utils/exportToPDF";
import MobileSnackbar from "./MobileSnackbar";
import AdminVisualizations from "./AdminVisualizations";
import { doc, deleteDoc } from "firebase/firestore";

const AdminDashboard = () => {
  // Export to Excel handler (must be inside the component to access state)
  const handleExportToExcel = () => {
    exportSubmissionsToExcel(submissions);
  };
  // Export to PDF handler
  // Snackbar state for mobile PDF export
  const [showMobileSnackbar, setShowMobileSnackbar] = useState(false);
  // Show snackbar only on mobile devices (width <= 768px)
  const handleExportToPDF = () => {
    exportSubmissionsToPDF(submissions);
    if (window.innerWidth <= 768) {
      setShowMobileSnackbar(true);
      setTimeout(() => setShowMobileSnackbar(false), 15000); // Increased to 15 seconds
    }
  };
  // Test mode state (pre/post), loaded from Firestore
  const [testMode, setTestMode] = useState("post");
  const [testModeLoading, setTestModeLoading] = useState(true);

  // Load test mode from Firestore on mount
  useEffect(() => {
    let mounted = true;
    getTestMode().then((mode) => {
      if (mounted) {
        setTestMode(mode);
        setTestModeLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  // When changed, update Firestore and app state
  const handleTestModeChange = async (e) => {
    const mode = e.target.value;
    setTestMode(mode);
    setTestModeLoading(true);
    await saveTestMode(mode);
    setTestModeLoading(false);
  };
  const [submissions, setSubmissions] = useState([]);
  const [originalOrder, setOriginalOrder] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState(null);
  const [isSorted, setIsSorted] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // {id, name} or null
  const [deleteLoading, setDeleteLoading] = useState(false);
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

  // Removed unused handlePrint (browser print) as export to PDF is now used

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
    setDeleteLoading(true);
    try {
      await deleteDoc(doc(db, "quiz_responses", deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      alert("Failed to delete record: " + err.message);
    }
    setDeleteLoading(false);
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

  // Visualizations modal state
  const [showVisualizations, setShowVisualizations] = useState(false);

  return (
    <>
      <MobileSnackbar
        open={showMobileSnackbar}
        message="PDF saved to Downloads. Open with a PDF viewer for best experience. For best results, try exporting from a desktop browser."
        onClose={() => setShowMobileSnackbar(false)}
      />
      <div className="max-w-8xl mx-auto mt-10 p-6 bg-white rounded-md shadow-sm">
        {/* Enhanced Admin Dashboard Heading */}
        <h2
          className="text-xl font-semibold text-blue-800 tracking-wide mb-8 bg-blue-50 border border-blue-200 px-6 py-3 rounded-xl shadow-lg w-full flex justify-center items-center mx-auto"
          style={{ maxWidth: "420px" }}
        >
          🧾 Admin Dashboard
        </h2>
        {/* Test Mode Selector (hidden on print, highlighted, at top) */}
        <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center gap-2 print:hidden bg-yellow-100 border-2 border-yellow-400 rounded-lg p-4 shadow">
          <label
            className="font-semibold text-blue-900 text-base sm:text-lg"
            htmlFor="test-mode-select"
          >
            Test Mode:
          </label>
          <select
            id="test-mode-select"
            value={testMode}
            onChange={handleTestModeChange}
            disabled={testModeLoading}
            className="border rounded px-3 py-1 text-base bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="pre">Pre Test</option>
            <option value="post">Post Test</option>
          </select>
          <span className="text-gray-600 text-sm mt-1 sm:mt-0">
            <div className="mb-1">
              <span className="font-medium text-blue-700">Pre Test</span>: Only
              score and summary shown to participants.
            </div>
            <div>
              <span className="font-medium text-blue-700">Post Test</span>: Full
              results with questions and correct answers shown.
            </div>
          </span>
        </div>

        {/* --- Visualizations Button (not shown on print) --- */}
        <div className="mb-8 flex justify-end print:hidden">
          <button
            onClick={() => setShowVisualizations(true)}
            className="bg-blue-700 hover:bg-blue-800 text-white font-semibold px-6 py-3 rounded-lg shadow cursor-pointer"
          >
            View Visualizations
          </button>
        </div>

        {/* --- Visualizations Modal --- */}
        {showVisualizations && (
          <AdminVisualizations
            submissions={submissions}
            onClose={() => setShowVisualizations(false)}
          />
        )}

        {/* Bulk Delete Button */}
        {selectedIds.length > 0 && (
          <div className="mb-4 flex items-center gap-4">
            <button
              onClick={handleBulkDelete}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg shadow transition cursor-pointer"
            >
              Delete Selected ({selectedIds.length})
            </button>
            <span className="text-gray-600 text-sm">
              {selectedIds.length} selected
            </span>
          </div>
        )}
        <div className="flex justify-end items-center mb-6">
          <div className="flex gap-4">
            <button
              onClick={toggleSort}
              className="bg-yellow-500 text-white px-4 py-2 rounded shadow hover:bg-yellow-600 print:hidden cursor-pointer"
            >
              {isSorted ? "Reset Order" : "Sort by Score & Time"}
            </button>
            <button
              onClick={handleExportToPDF}
              className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 print:hidden cursor-pointer"
            >
              Export to PDF
            </button>
            <button
              onClick={handleExportToExcel}
              className="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700 print:hidden cursor-pointer"
            >
              Export to Excel
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
                  <th className="px-4 py-3 font-bold text-blue-700 bg-blue-50">
                    Test Mode (Per User)
                  </th>
                  <th className="px-4 py-3">Score</th>
                  <th className="px-4 py-3 text-green-700">Correct</th>
                  <th className="px-4 py-3 text-red-700">Wrong</th>
                  <th className="px-4 py-3">Time Taken</th>
                  <th className="px-4 py-3">Completed At</th>
                  <th className="px-4 py-3">Tab Switches</th>
                  <th className="px-4 py-3">Copy Attempts</th>
                  <th className="px-4 py-3 font-bold text-purple-700 bg-purple-50">
                    Email Sent
                  </th>
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
                    {/* Show per-user test mode from Firestore */}
                    <td className="px-4 py-2 text-blue-700 font-semibold uppercase">
                      {s.testModeAtStart || "-"}
                    </td>
                    <td className="px-4 py-2 font-semibold">{s.score}</td>
                    <td className="px-4 py-2 text-green-600">
                      {s.correctCount}
                    </td>
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
                    <td className="px-4 py-2 text-center">
                      <span
                        className={`font-medium px-3 py-1 rounded-full text-sm ${
                          s.emailSent
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {s.emailSent ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="px-4 py-2 print:hidden">
                      <button
                        onClick={() => setViewing(s)}
                        className="text-blue-600 underline hover:text-blue-800 text-sm cursor-pointer"
                      >
                        View Result
                      </button>
                    </td>
                    <td className="px-4 py-2 print:hidden">
                      <button
                        onClick={() =>
                          setDeleteTarget({ id: s.id, name: s.name })
                        }
                        className="text-red-600 underline hover:text-red-800 text-sm cursor-pointer"
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
              🟦 Answered: <strong>{viewing.answeredCount}</strong>{" "}
              &nbsp;|&nbsp; ⬜ Unanswered:{" "}
              <strong>{viewing.unansweredCount}</strong>
            </p>
            <p className="text-gray-700 mb-4">
              📧 Email Status:{" "}
              <span
                className={`font-semibold px-3 py-1 rounded-lg ${
                  viewing.emailSent
                    ? "bg-green-100 text-green-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {viewing.emailSent ? "Sent ✓" : "Not Sent"}
              </span>
              {viewing.emailSentAt && (
                <span className="text-xs ml-2 text-gray-500">
                  ({new Date(viewing.emailSentAt.toDate()).toLocaleString()})
                </span>
              )}
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
              className="mt-4 text-sm text-gray-600 underline hover:text-gray-800 cursor-pointer"
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
                  disabled={deleteLoading}
                  className={`bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg shadow transition w-1/2 ${
                    deleteLoading ? "opacity-60 cursor-not-allowed" : ""
                  }`}
                >
                  {deleteLoading ? "Deleting..." : "Delete"}
                </button>
                <button
                  onClick={() => setDeleteTarget(null)}
                  disabled={deleteLoading}
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
    </>
  );
};

export default AdminDashboard;
