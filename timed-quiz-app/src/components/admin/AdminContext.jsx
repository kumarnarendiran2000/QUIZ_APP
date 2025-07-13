// src/components/admin/AdminContext.jsx
import React, { createContext, useState, useEffect, useRef } from "react";
import { collection, onSnapshot, doc, getDoc } from "firebase/firestore";
import { db } from "../../utils/firebase";
import {
  getTestMode,
  setTestMode as saveTestMode,
} from "../../utils/quizSettings";

// Create the context
const AdminContext = createContext();

export const AdminProvider = ({ children }) => {
  // Test mode state
  const [testMode, setTestMode] = useState("post");
  const [testModeLoading, setTestModeLoading] = useState(true);

  // Table data state
  const [submissions, setSubmissions] = useState([]);
  const [originalOrder, setOriginalOrder] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState(null);
  const [correctAnswers, setCorrectAnswers] = useState([]);
  const [isSorted, setIsSorted] = useState(false);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Bulk delete state
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);

  // Table ref
  const tableRef = useRef();

  // Visualizations modal state
  const [showVisualizations, setShowVisualizations] = useState(false);

  // Email state
  const [emailSending, setEmailSending] = useState(false);
  const [emailUserInProgress, setEmailUserInProgress] = useState(null);
  const [emailToast, setEmailToast] = useState({
    show: false,
    type: "",
    message: "",
  });

  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);

  // Table navigation controls state
  const [showScrollButtons, setShowScrollButtons] = useState(() => {
    // Get from localStorage if available, default to true
    const saved = localStorage.getItem("showScrollButtons");
    return saved !== null ? JSON.parse(saved) : true;
  });

  // Scroll intervals for continuous scrolling
  const [horizontalScrollInterval, setHorizontalScrollInterval] =
    useState(null);
  const [verticalScrollInterval, setVerticalScrollInterval] = useState(null);

  // Mobile snackbar state
  const [showMobileSnackbar, setShowMobileSnackbar] = useState(false);

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

  // Fetch submissions from Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "quiz_responses"),
      (snapshot) => {
        const data = snapshot.docs.map((doc) => {
          // Parse doc ID to extract test mode and date
          const docId = doc.id;
          let testMode = null;
          let dateStr = null;

          // Extract test mode and date from document ID if available
          if (docId.includes("_")) {
            const parts = docId.split("_");
            if (parts.length >= 3) {
              testMode = parts[parts.length - 2]; // Second-to-last part is test mode
              dateStr = parts[parts.length - 1]; // Last part is date

              // Format date string for display (YYYYMMDD -> YYYY-MM-DD)
              if (/^\d{8}$/.test(dateStr)) {
                const year = dateStr.substring(0, 4);
                const month = dateStr.substring(4, 6);
                const day = dateStr.substring(6, 8);
                dateStr = `${year}-${month}-${day}`;
              }
            }
          }

          const docData = doc.data();
          return {
            id: doc.id,
            // Add extracted fields if available
            testDate: dateStr || "Unknown",
            displayTestMode:
              testMode ||
              docData.testModeAtStart ||
              docData.testMode ||
              "Unknown",
            // Ensure all entries have these fields, even if they're missing
            name: docData.name || "-",
            email: docData.email || "-",
            regno: docData.regno || "-",
            mobile: docData.mobile || "-",
            score: docData.score !== undefined ? docData.score : "-",
            quizDuration: docData.quizDuration || "-",
            completedAt: docData.completedAt || "-",
            // Include the rest of the data
            ...docData,
            // Flag for incomplete submissions
            isIncomplete:
              docData.score === undefined || docData.completedAt === undefined,
          };
        });

        // Include all records, don't filter by score
        setSubmissions(data);
        setOriginalOrder(data);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching real-time data:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Save preference to localStorage when it changes
  useEffect(() => {
    localStorage.setItem(
      "showScrollButtons",
      JSON.stringify(showScrollButtons)
    );
  }, [showScrollButtons]);

  // Check if screen is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      clearInterval(horizontalScrollInterval);
      clearInterval(verticalScrollInterval);
    };
  }, [horizontalScrollInterval, verticalScrollInterval]);

  // Handle test mode change
  const handleTestModeChange = async (e) => {
    const mode = e.target.value;
    setTestMode(mode);
    setTestModeLoading(true);
    await saveTestMode(mode);
    setTestModeLoading(false);
  };

  // Toggle sorting
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

  // Fetch correct answers when viewing a result
  const fetchCorrectAnswers = async () => {
    try {
      const metadataRef = doc(db, "quiz_metadata", "default");
      const metadataSnap = await getDoc(metadataRef);
      if (metadataSnap.exists()) {
        setCorrectAnswers(metadataSnap.data().correctAnswers || []);
      }
    } catch (err) {
      console.error("Failed to fetch correct answers:", err);
    }
  };

  // Value object to be provided to context consumers
  const contextValue = {
    // State
    testMode,
    setTestMode,
    testModeLoading,
    submissions,
    setSubmissions,
    originalOrder,
    loading,
    viewing,
    setViewing,
    correctAnswers,
    setCorrectAnswers,
    isSorted,
    deleteTarget,
    setDeleteTarget,
    deleteLoading,
    setDeleteLoading,
    selectedIds,
    setSelectedIds,
    selectAll,
    setSelectAll,
    showBulkDeleteModal,
    setShowBulkDeleteModal,
    bulkDeleteLoading,
    setBulkDeleteLoading,
    tableRef,
    showVisualizations,
    setShowVisualizations,
    emailSending,
    setEmailSending,
    emailUserInProgress,
    setEmailUserInProgress,
    emailToast,
    setEmailToast,
    isMobile,
    showScrollButtons,
    setShowScrollButtons,
    horizontalScrollInterval,
    setHorizontalScrollInterval,
    verticalScrollInterval,
    setVerticalScrollInterval,
    showMobileSnackbar,
    setShowMobileSnackbar,

    // Functions
    handleTestModeChange,
    toggleSort,
    fetchCorrectAnswers,
  };

  return (
    <AdminContext.Provider value={contextValue}>
      {children}
    </AdminContext.Provider>
  );
};

export default AdminContext;
