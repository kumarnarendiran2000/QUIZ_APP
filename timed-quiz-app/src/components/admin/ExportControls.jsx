// src/components/admin/ExportControls.jsx
import React from "react";
import useAdmin from "./hooks/useAdmin";
import { exportSubmissionsToExcel } from "../../utils/exportToExcel";
import { exportSubmissionsToPDF } from "../../utils/exportToPDF";

const ExportControls = ({ filteredSubmissions }) => {
  const { submissions, toggleSort, isSorted, setShowMobileSnackbar } =
    useAdmin();

  // Export to Excel handler - use filteredSubmissions if provided, otherwise use all submissions
  const handleExportToExcel = () => {
    const dataToExport = filteredSubmissions || submissions;
    exportSubmissionsToExcel(dataToExport);
  };

  // Export to PDF handler - use filteredSubmissions if provided, otherwise use all submissions
  const handleExportToPDF = () => {
    const dataToExport = filteredSubmissions || submissions;
    exportSubmissionsToPDF(dataToExport);
    if (window.innerWidth <= 768) {
      setShowMobileSnackbar(true);
      setTimeout(() => setShowMobileSnackbar(false), 15000); // Increased to 15 seconds
    }
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
  );
};

export default ExportControls;
