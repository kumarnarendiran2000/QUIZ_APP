// src/utils/exportToExcel.js
// Utility to export quiz submissions to Excel
import * as XLSX from "xlsx";

/**
 * Exports submissions data to an Excel file and triggers download.
 * @param {Array} submissions - Array of quiz submission objects
 */
export function exportSubmissionsToExcel(submissions) {
  if (!Array.isArray(submissions) || submissions.length === 0) {
    alert("No data to export.");
    return;
  }

  // Define columns and headers
  const columns = [
    { header: "S. No", key: "sno" },
    { header: "Name", key: "name" },
    { header: "Registration Number", key: "regno" },
    { header: "Email", key: "email" },
    { header: "Mobile", key: "mobile" },
    { header: "Answered", key: "answeredCount" },
    { header: "Unanswered", key: "unansweredCount" },
    { header: "Test Mode (Per User)", key: "testModeAtStart" },
    { header: "Score", key: "score" },
    { header: "Correct", key: "correctCount" },
    { header: "Wrong", key: "wrongCount" },
    { header: "Time Taken", key: "quizDuration" },
    { header: "Completed At", key: "completedAt" },
    { header: "Tab Switches", key: "tabSwitchCount" },
    { header: "Copy Attempts", key: "copyAttemptCount" },
    { header: "Email Sent", key: "emailSent" },
  ];

  // Prepare data rows
  const data = submissions.map((s, idx) => ({
    sno: idx + 1,
    name: s.name || "",
    regno: s.regno || "-",
    email: s.email || "",
    mobile: s.mobile || "",
    answeredCount: s.answeredCount ?? "",
    unansweredCount: s.unansweredCount ?? "",
    testModeAtStart: s.testModeAtStart || "-",
    score: s.score ?? "",
    correctCount: s.correctCount ?? "",
    wrongCount: s.wrongCount ?? "",
    quizDuration: s.quizDuration || "N/A",
    completedAt: s.completedAt ? new Date(s.completedAt).toLocaleString() : "N/A",
    tabSwitchCount: typeof s.tabSwitchCount === "number" ? s.tabSwitchCount : 0,
    copyAttemptCount: typeof s.copyAttemptCount === "number" ? s.copyAttemptCount : 0,
    emailSent: s.emailSent === true ? "Yes" : "No",
  }));

  // Create worksheet and workbook
  const ws = XLSX.utils.json_to_sheet([], { header: columns.map(c => c.key) });
  // Set header row
  XLSX.utils.sheet_add_aoa(ws, [columns.map(c => c.header)], { origin: "A1" });
  // Add data rows
  XLSX.utils.sheet_add_json(ws, data, { origin: -1, skipHeader: true });

  // Autosize columns
  const colWidths = columns.map(col => {
    const maxLen = Math.max(
      col.header.length,
      ...data.map(row => String(row[col.key] ?? '').length)
    );
    return { wch: maxLen + 2 };
  });
  ws['!cols'] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Quiz Results");

  // Download with date and time in filename
  const now = new Date();
  const pad = (n) => n.toString().padStart(2, '0');
  const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const timeStr = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const filename = `quiz_results_${dateStr}_${timeStr}.xlsx`;
  XLSX.writeFile(wb, filename);
}
