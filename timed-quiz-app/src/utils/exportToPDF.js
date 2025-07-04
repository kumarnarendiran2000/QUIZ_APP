// src/utils/exportToPDF.js
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function exportSubmissionsToPDF(submissions) {
  const doc = new jsPDF({ orientation: "landscape" });
  const dateStr = new Date().toLocaleString().replace(/[:/]/g, "-");

  // Define table columns
  const columns = [
    { header: "S. No", dataKey: "sno" },
    { header: "Name", dataKey: "name" },
    { header: "Registration\nNumber", dataKey: "regno" },
    { header: "Email", dataKey: "email" },
    { header: "Mobile", dataKey: "mobile" },
    { header: "Answered", dataKey: "answeredCount" },
    { header: "Unanswered", dataKey: "unansweredCount" },
    { header: "Test\nMode", dataKey: "testModeAtStart" },
    { header: "Score", dataKey: "score" },
    { header: "Correct", dataKey: "correctCount" },
    { header: "Wrong", dataKey: "wrongCount" },
    { header: "Time\nTaken", dataKey: "quizDuration" },
    { header: "Completed\nAt", dataKey: "completedAt" },
    { header: "Tab\nSwitches", dataKey: "tabSwitchCount" },
    { header: "Copy\nAttempts", dataKey: "copyAttemptCount" },
  ];

  // Prepare table rows
  const rows = submissions.map((s, idx) => ({
    sno: idx + 1,
    name: s.name || "",
    regno: s.regno || "",
    email: s.email || "",
    mobile: s.mobile || "",
    answeredCount: s.answeredCount ?? "",
    unansweredCount: s.unansweredCount ?? "",
    testModeAtStart: s.testModeAtStart || "",
    score: s.score ?? "",
    correctCount: s.correctCount ?? "",
    wrongCount: s.wrongCount ?? "",
    quizDuration: s.quizDuration || "",
    completedAt: s.completedAt ? new Date(s.completedAt).toLocaleString() : "",
    tabSwitchCount: s.tabSwitchCount ?? 0,
    copyAttemptCount: s.copyAttemptCount ?? 0,
  }));

  doc.setFontSize(18);
  doc.text("Quiz Submissions Report", 14, 16);
  doc.setFontSize(11);
  doc.text(`Exported: ${dateStr}`, 14, 24);

  autoTable(doc, {
    head: [columns.map(col => col.header)],
    body: rows.map(row => columns.map(col => row[col.dataKey])),
    startY: 30,
    styles: { fontSize: 8, cellPadding: 1.5 },
    headStyles: { fontSize: 8, fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [240, 248, 255] },
    margin: { left: 4, right: 4 },
    tableWidth: 'auto',
    columnStyles: {
      regno: { cellWidth: 38 },
      testModeAtStart: { cellWidth: 24 },
      quizDuration: { cellWidth: 28 },
      completedAt: { cellWidth: 38 },
      tabSwitchCount: { cellWidth: 24 },
      copyAttemptCount: { cellWidth: 24 },
    },
    didDrawPage: (data) => {
      doc.setFontSize(10);
      doc.text(`Page ${doc.internal.getNumberOfPages()}`, data.settings.margin.left, doc.internal.pageSize.height - 10);
    },
  });

  doc.save(`quiz_submissions_${dateStr}.pdf`);
}
