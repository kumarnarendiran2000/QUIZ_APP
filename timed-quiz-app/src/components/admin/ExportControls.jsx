// src/components/admin/ExportControls.jsx
import React, { useState } from "react";
import useAdmin from "./hooks/useAdmin";
import { exportSubmissionsToExcel } from "../../utils/exportToExcel";
import { exportSubmissionsToPDF } from "../../utils/exportToPDF";

const ExportControls = ({ filteredSubmissions }) => {
  const { submissions, toggleSort, isSorted, setShowMobileSnackbar } =
    useAdmin();

  const [exportingPDF, setExportingPDF] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);

  const handleExportToPDF = () => {
    setExportingPDF(true);
    // Let React render the loading state before the synchronous PDF work blocks the thread
    setTimeout(() => {
      try {
        exportSubmissionsToPDF(filteredSubmissions || submissions);
        if (window.innerWidth <= 768) {
          setShowMobileSnackbar(true);
          setTimeout(() => setShowMobileSnackbar(false), 15000);
        }
      } finally {
        setExportingPDF(false);
      }
    }, 50);
  };

  const handleExportToExcel = () => {
    setExportingExcel(true);
    setTimeout(() => {
      try {
        exportSubmissionsToExcel(filteredSubmissions || submissions);
      } finally {
        setExportingExcel(false);
      }
    }, 50);
  };

  return (
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
          disabled={exportingPDF}
          className={`bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 print:hidden ${exportingPDF ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
        >
          {exportingPDF ? "⏳ Generating..." : "Export to PDF"}
        </button>
        <button
          onClick={handleExportToExcel}
          disabled={exportingExcel}
          className={`bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700 print:hidden ${exportingExcel ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
        >
          {exportingExcel ? "⏳ Generating..." : "Export to Excel"}
        </button>
      </div>
    </div>
  );
};

export default ExportControls;
