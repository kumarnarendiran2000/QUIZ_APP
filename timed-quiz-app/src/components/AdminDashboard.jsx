// src/components/AdminDashboard.jsx
import React, { useEffect, useRef, useState } from "react";
import {
  getTestMode,
  setTestMode as saveTestMode,
} from "../utils/quizSettings";
import { collection, onSnapshot } from "firebase/firestore";
import { db, sendQuizResultEmail } from "../utils/firebase";
import { questions } from "../data/questions";
import { exportSubmissionsToExcel } from "../utils/exportToExcel";
import { exportSubmissionsToPDF } from "../utils/exportToPDF";
import MobileSnackbar from "./MobileSnackbar";
import AdminVisualizations from "./AdminVisualizations";
import { doc, deleteDoc, getDoc } from "firebase/firestore";

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

  // Table navigation controls state
  const [showScrollButtons, setShowScrollButtons] = useState(() => {
    // Get from localStorage if available, default to true
    const saved = localStorage.getItem("showScrollButtons");
    return saved !== null ? JSON.parse(saved) : true;
  });

  // Save preference to localStorage when it changes
  useEffect(() => {
    localStorage.setItem(
      "showScrollButtons",
      JSON.stringify(showScrollButtons)
    );
  }, [showScrollButtons]);

  // Keyboard shortcut handler (Ctrl+N to toggle navigation controls)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === "n") {
        e.preventDefault(); // Prevent browser's "new window" shortcut
        setShowScrollButtons((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Mobile screen detection
  const [isMobile, setIsMobile] = useState(false);

  // Check if screen is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Adjust scroll amount based on screen size
  const scrollAmount = isMobile ? 150 : 300; // Less for mobile

  // Scroll to table function
  const scrollToTable = () => {
    if (tableRef.current) {
      tableRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Scroll intervals for continuous scrolling
  const [horizontalScrollInterval, setHorizontalScrollInterval] =
    useState(null);
  const [verticalScrollInterval, setVerticalScrollInterval] = useState(null);

  // Scroll table functions with smooth behavior
  const scrollTableRight = () => {
    if (tableRef.current) {
      tableRef.current.scrollBy({
        left: scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const scrollTableLeft = () => {
    if (tableRef.current) {
      tableRef.current.scrollBy({
        left: -scrollAmount,
        behavior: "smooth",
      });
    }
  };

  // Scroll page functions
  const scrollPageDown = () => {
    window.scrollBy({
      top: scrollAmount,
      behavior: "smooth",
    });
  };

  const scrollPageUp = () => {
    window.scrollBy({
      top: -scrollAmount,
      behavior: "smooth",
    });
  };

  // Start continuous horizontal scrolling
  const startHorizontalScroll = (direction) => {
    // Clear any existing interval first
    clearInterval(horizontalScrollInterval);

    // Execute once immediately
    if (direction === "right") {
      scrollTableRight();
    } else {
      scrollTableLeft();
    }

    // Set up interval for continuous scrolling (every 250ms)
    const interval = setInterval(() => {
      if (direction === "right") {
        scrollTableRight();
      } else {
        scrollTableLeft();
      }
    }, 250);

    setHorizontalScrollInterval(interval);
  };

  // Start continuous vertical scrolling
  const startVerticalScroll = (direction) => {
    // Clear any existing interval first
    clearInterval(verticalScrollInterval);

    // Execute once immediately
    if (direction === "down") {
      scrollPageDown();
    } else {
      scrollPageUp();
    }

    // Set up interval for continuous scrolling
    const interval = setInterval(() => {
      if (direction === "down") {
        scrollPageDown();
      } else {
        scrollPageUp();
      }
    }, 250);

    setVerticalScrollInterval(interval);
  };

  // Stop continuous scrolling
  const stopHorizontalScroll = () => {
    clearInterval(horizontalScrollInterval);
    setHorizontalScrollInterval(null);
  };

  const stopVerticalScroll = () => {
    clearInterval(verticalScrollInterval);
    setVerticalScrollInterval(null);
  };

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      clearInterval(horizontalScrollInterval);
      clearInterval(verticalScrollInterval);
    };
  }, [horizontalScrollInterval, verticalScrollInterval]);

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

      // Also remove the deleted ID from selectedIds if it was selected
      if (selectedIds.includes(deleteTarget.id)) {
        setSelectedIds((prev) => prev.filter((id) => id !== deleteTarget.id));

        // If we're deleting the last selected item, also update selectAll state
        if (selectedIds.length === 1) {
          setSelectAll(false);
        }
      }

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

  // Email sending state
  const [emailSending, setEmailSending] = useState(false);
  const [emailUserInProgress, setEmailUserInProgress] = useState(null);
  const [emailToast, setEmailToast] = useState({
    show: false,
    type: "",
    message: "",
  });

  // Handle sending email manually for a specific user
  const handleSendEmail = async (user) => {
    if (!user || emailSending) return;

    setEmailSending(true);
    setEmailUserInProgress(user.id);

    // Show info toast with longer timeout for long-running operations
    setEmailToast({
      show: true,
      type: "info",
      message: `Sending email to ${user.name} (${user.email})...`,
    });

    // Auto-dismiss info toast after 15 seconds if operation takes too long
    const infoToastTimeout = setTimeout(() => {
      setEmailToast((prev) => {
        // Only clear if it's still the info toast
        if (prev.type === "info") {
          return { ...prev, show: false };
        }
        return prev;
      });
    }, 15000);

    try {
      console.log(
        "Manually triggering email for user:",
        user.name,
        "with ID:",
        user.id
      );

      // Get correct answers from metadata
      const metadataRef = doc(db, "quiz_metadata", "default");
      const metadataSnap = await getDoc(metadataRef);

      if (!metadataSnap.exists()) {
        throw new Error("Quiz metadata not found");
      }

      const correctAnswers = metadataSnap.data().correctAnswers || [];

      // Extract the data we need to send from user record
      const answers = user.answers || [];
      const testMode = user.testModeAtStart || "post";
      const quizDuration = user.quizDuration || "N/A";

      // Normalize results data similar to ResultPage.jsx
      const normalizedResults = questions.map((q, i) => {
        const selected = answers[i];
        const correct = correctAnswers[i];
        const isCorrect = selected === correct;
        const wasAnswered = typeof selected === "number";
        return {
          question: q.question,
          userAnswer: wasAnswered ? q.options[selected] : null,
          correctAnswer: q.options[correct],
          isCorrect,
          wasAnswered,
          topic: q.topic || "Other",
        };
      });

      // Calculate counts for sending
      const correct = normalizedResults.filter((r) => r.isCorrect).length;
      const wrong = normalizedResults.length - correct;
      const total = questions.length;

      // Send the email - Add userId, userEmail, and userName to identify which user's email to send
      await sendQuizResultEmail({
        userId: user.id, // This is critical - tells the Cloud Function which user's quiz results to use
        userEmail: user.email, // Pass email directly for double-checking
        userName: user.name, // Pass name for personalization
        answers,
        detailedResults: normalizedResults,
        correctAnswers,
        allQuestions: questions,
        quizDurationFromFrontend: quizDuration,
        testModeFromFrontend: testMode,
        correct,
        wrong,
        total,
        score: correct,
      });

      // Success state
      setTimeout(() => {
        // Clear any previous timeout for the info toast
        clearTimeout(infoToastTimeout);

        setEmailToast({
          show: true,
          type: "success",
          message: `Email sent successfully to ${user.name} (${user.email})`,
        });

        // Auto dismiss success toast after 8 seconds
        setTimeout(() => {
          setEmailToast((prev) => ({ ...prev, show: false }));
        }, 8000);
      }, 500);
    } catch (error) {
      console.error("Error sending email manually:", error);

      // Clear any previous timeout for the info toast
      clearTimeout(infoToastTimeout);

      setEmailToast({
        show: true,
        type: "error",
        message: `Failed to send email to ${user.name} (${user.email}): ${error.message}`,
      });

      // Auto dismiss error toast after 5 seconds
      setTimeout(() => {
        setEmailToast((prev) => ({ ...prev, show: false }));
      }, 5000);
    } finally {
      setEmailSending(false);
      setEmailUserInProgress(null);
    }
  };

  return (
    <>
      <MobileSnackbar
        open={showMobileSnackbar}
        message="PDF saved to Downloads. Open with a PDF viewer for best experience. For best results, try exporting from a desktop browser."
        onClose={() => setShowMobileSnackbar(false)}
      />{" "}
      {/* Sticky Navigation Buttons */}
      <div className="fixed top-20 right-4 z-50">
        <button
          onClick={() => setShowScrollButtons((prev) => !prev)}
          className="bg-gray-800 hover:bg-gray-900 text-white text-xs md:text-sm px-3 py-2 rounded-full shadow-lg flex items-center"
          title={`${
            showScrollButtons ? "Hide" : "Show"
          } Navigation Controls (Ctrl+N)`}
        >
          {showScrollButtons ? "Hide Controls" : "Show Controls"}
        </button>
      </div>
      {showScrollButtons && (
        <>
          {/* Horizontal Navigation */}
          <div className="fixed right-4 bottom-24 z-50 flex flex-col gap-2">
            <button
              onMouseDown={() => startHorizontalScroll("left")}
              onMouseUp={stopHorizontalScroll}
              onMouseLeave={stopHorizontalScroll}
              onTouchStart={() => startHorizontalScroll("left")}
              onTouchEnd={stopHorizontalScroll}
              className="bg-blue-700 hover:bg-blue-800 text-white w-10 h-10 md:w-12 md:h-12 rounded-full shadow-lg flex items-center justify-center text-xl"
              title="Scroll Table Left (hold for continuous scroll)"
            >
              ←
            </button>
            <button
              onMouseDown={() => startHorizontalScroll("right")}
              onMouseUp={stopHorizontalScroll}
              onMouseLeave={stopHorizontalScroll}
              onTouchStart={() => startHorizontalScroll("right")}
              onTouchEnd={stopHorizontalScroll}
              className="bg-blue-700 hover:bg-blue-800 text-white w-10 h-10 md:w-12 md:h-12 rounded-full shadow-lg flex items-center justify-center text-xl"
              title="Scroll Table Right (hold for continuous scroll)"
            >
              →
            </button>
          </div>

          {/* Vertical Navigation */}
          <div className="fixed right-4 bottom-4 z-50 flex gap-2">
            <button
              onMouseDown={() => startVerticalScroll("up")}
              onMouseUp={stopVerticalScroll}
              onMouseLeave={stopVerticalScroll}
              onTouchStart={() => startVerticalScroll("up")}
              onTouchEnd={stopVerticalScroll}
              className="bg-green-600 hover:bg-green-700 text-white w-10 h-10 md:w-12 md:h-12 rounded-full shadow-lg flex items-center justify-center text-xl"
              title="Scroll Page Up (hold for continuous scroll)"
            >
              ↑
            </button>
            <button
              onMouseDown={() => startVerticalScroll("down")}
              onMouseUp={stopVerticalScroll}
              onMouseLeave={stopVerticalScroll}
              onTouchStart={() => startVerticalScroll("down")}
              onTouchEnd={stopVerticalScroll}
              className="bg-green-600 hover:bg-green-700 text-white w-10 h-10 md:w-12 md:h-12 rounded-full shadow-lg flex items-center justify-center text-xl"
              title="Scroll Page Down (hold for continuous scroll)"
            >
              ↓
            </button>
          </div>

          {/* Quick access to table */}
          <div className="fixed left-4 bottom-4 z-50">
            <button
              onClick={scrollToTable}
              className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 md:px-4 md:py-2 rounded-full shadow-lg flex items-center text-xs md:text-sm"
              title="Jump to Table"
            >
              <span className="mr-1 text-lg">📋</span> Go to Table
            </button>
          </div>
        </>
      )}
      {/* Email Status Toast - Centered on mobile, right-aligned on desktop */}
      {emailToast.show && (
        <div
          className={`fixed top-4 z-50 px-6 py-4 rounded-lg shadow-lg text-white flex items-center justify-between gap-4 transition-all duration-300 animate-fadeIn md:right-4 left-1/2 md:left-auto md:transform-none transform -translate-x-1/2 md:translate-x-0 ${
            emailToast.type === "success"
              ? "bg-green-600"
              : emailToast.type === "error"
              ? "bg-red-600"
              : "bg-blue-600"
          }`}
          style={{ maxWidth: "90%", width: "400px" }}
        >
          <span className="flex-1">{emailToast.message}</span>
          <button
            aria-label="Close notification"
            className="ml-4 text-white text-2xl font-bold focus:outline-none hover:opacity-80"
            style={{
              lineHeight: 1,
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
            onClick={() => setEmailToast((prev) => ({ ...prev, show: false }))}
          >
            &times;
          </button>
        </div>
      )}
      <div className="max-w-8xl mx-auto mt-10 p-6 bg-white rounded-md shadow-sm">
        {/* Enhanced Admin Dashboard Heading */}
        <h2
          className="text-xl font-semibold text-blue-800 tracking-wide mb-4 bg-blue-50 border border-blue-200 px-6 py-3 rounded-xl shadow-lg w-full flex justify-center items-center mx-auto"
          style={{ maxWidth: "420px" }}
        >
          🧾 Admin Dashboard
        </h2>

        {/* Navigation Controls Info */}
        <div className="hidden md:block mb-4 text-center">
          <p className="text-xs text-gray-600 italic">
            Tip: Press and hold the navigation buttons for continuous scrolling
          </p>
        </div>
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
          <div>
            {/* Mobile-friendly notice */}
            <div className="md:hidden mb-4 bg-blue-50 p-4 rounded-lg border border-blue-200 text-sm">
              <p className="font-medium text-blue-800">
                Note: This table is scrollable horizontally.
              </p>
              <p className="text-blue-600">
                Swipe left/right to view all columns or use the navigation
                controls available.
              </p>
            </div>

            <div ref={tableRef} className="overflow-x-auto border rounded-md">
              <table className="min-w-full text-sm sm:text-base text-left print:text-xs whitespace-nowrap md:whitespace-normal">
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
                    <th className="px-4 py-3 font-bold text-indigo-700 bg-indigo-50 print:hidden">
                      Email Action
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
                      <td className="px-4 py-2 print:hidden text-center">
                        <button
                          onClick={() => handleSendEmail(s)}
                          disabled={
                            emailSending && emailUserInProgress === s.id
                          }
                          className={`px-3 py-1 rounded-md text-sm font-medium ${
                            emailSending && emailUserInProgress === s.id
                              ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                              : "bg-indigo-100 text-indigo-700 hover:bg-indigo-200 cursor-pointer"
                          }`}
                        >
                          {emailSending && emailUserInProgress === s.id
                            ? "Sending..."
                            : s.emailSent
                            ? "Resend Email"
                            : "Send Email"}
                        </button>
                      </td>
                      <td className="px-4 py-2 print:hidden">
                        <button
                          onClick={() => setViewing(s)}
                          className="px-3 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-md text-sm font-medium transition-colors duration-200 border border-blue-200 shadow-sm"
                        >
                          📊 View Result
                        </button>
                      </td>
                      <td className="px-4 py-2 print:hidden">
                        <button
                          onClick={() =>
                            setDeleteTarget({ id: s.id, name: s.name })
                          }
                          className="px-3 py-1 bg-red-100 text-red-700 hover:bg-red-200 rounded-md text-sm font-medium transition-colors duration-200 border border-red-200 shadow-sm"
                        >
                          🗑️ Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
            <div className="flex flex-wrap gap-4 items-center mb-4">
              <div className="flex-grow">
                <span className="font-bold">📧 Email Status:</span>{" "}
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
              </div>
              <button
                onClick={() => handleSendEmail(viewing)}
                disabled={emailSending && emailUserInProgress === viewing.id}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  emailSending && emailUserInProgress === viewing.id
                    ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                    : "bg-indigo-500 text-white hover:bg-indigo-600 cursor-pointer"
                }`}
              >
                {emailSending && emailUserInProgress === viewing.id
                  ? "Sending Email..."
                  : viewing.emailSent
                  ? "Send Email Again"
                  : "Send Email Now"}
              </button>
            </div>

            {/* Map through answers and display each question with responses */}
            {viewing.answers ? (
              // Case 1: Use answers array if available
              viewing.answers.map((selected, index) => {
                const q = questions[index];
                if (!q) return null; // Skip if question doesn't exist

                const correct = viewing.correctAnswers?.[index] || null;
                const isCorrect = selected === correct;
                const wasAnswered = typeof selected === "number";

                return (
                  <div
                    key={index}
                    className={`mb-4 p-4 rounded-md border ${
                      wasAnswered
                        ? isCorrect
                          ? "border-green-300 bg-green-50"
                          : "border-red-300 bg-red-50"
                        : "border-yellow-300 bg-yellow-50"
                    }`}
                  >
                    <h4 className="font-semibold mb-2 text-gray-800">
                      Q{index + 1}. {q.question}
                    </h4>
                    {q.options.map((opt, i) => (
                      <div key={i} className="ml-4">
                        <span
                          className={`text-sm ${
                            correct === i
                              ? "font-bold text-green-700"
                              : selected === i
                              ? "text-red-500"
                              : "text-gray-700"
                          }`}
                        >
                          {i + 1}. {opt}
                          {correct === i && " ✅"}
                          {selected === i && selected !== correct && " ❌"}
                        </span>
                      </div>
                    ))}
                    {!wasAnswered && (
                      <p className="mt-2 text-yellow-600 font-semibold">
                        ❌ Unanswered
                      </p>
                    )}
                  </div>
                );
              })
            ) : viewing.detailedResults ? (
              // Case 2: Fall back to detailedResults if answers array is not available (legacy format)
              viewing.detailedResults.map((r, index) => {
                const q = questions[r.q - 1] || {
                  question: r.question || `Question ${r.q}`,
                  options: [],
                };

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
              })
            ) : (
              // Case 3: No data available
              <p className="text-gray-600">
                No detailed results available for this submission.
              </p>
            )}

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
