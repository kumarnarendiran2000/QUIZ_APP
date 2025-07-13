// src/utils/exportToPDF.js
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function exportSubmissionsToPDF(submissions) {
  // Create landscape document optimized for fitting all columns on a single page
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a3"  // Standard A3 is large enough with our optimizations
  });
  const dateStr = new Date().toLocaleString().replace(/[:/]/g, "-");

  // Define table columns with compact headers (using \n for line breaks where helpful)
  const columns = [
    { header: "#", dataKey: "sno" },
    { header: "Name", dataKey: "name" },
    { header: "Reg.\nNumber", dataKey: "regno" },
    { header: "Email", dataKey: "email" },
    { header: "Mobile", dataKey: "mobile" },
    { header: "Ans", dataKey: "answeredCount" }, // Shortened
    { header: "Unans", dataKey: "unansweredCount" }, // Shortened
    { header: "Test\nMode", dataKey: "testModeAtStart" },
    { header: "Score", dataKey: "score" },
    { header: "Correct", dataKey: "correctCount" },
    { header: "Wrong", dataKey: "wrongCount" },
    { header: "Time\nTaken", dataKey: "quizDuration" },
    { header: "Started\nAt", dataKey: "startedAt" },
    { header: "Completed\nAt", dataKey: "completedAt" },
    { header: "Tab\nSwitch", dataKey: "tabSwitchCount" },
    { header: "Copy\nAttempt", dataKey: "copyAttemptCount" },
    { header: "Email\nSent", dataKey: "emailSent" },
    { header: "Submit\nType", dataKey: "submissionType" },
    { header: "Auto-Submit\nReason", dataKey: "autoSubmitReason" },
    { header: "Device\nType", dataKey: "deviceType" },
    { header: "Browser", dataKey: "browserInfo" }, // Shortened
    { header: "Screen\nRes", dataKey: "screenResolution" }, // Shortened
  ];

  // Function to truncate long strings to prevent layout issues
  const truncate = (str, maxLen = 20) => { // Reduced default max length to 20
    if (!str) return "";
    return str.length > maxLen ? str.substring(0, maxLen - 3) + '...' : str;
  };
  
  // Function to format dates in an ultra-compact way
  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    // Format: DD/MM/YY\nHH:MM - eliminated seconds for even more compact display
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth()+1).toString().padStart(2, '0')}/${date.getFullYear().toString().substring(2)}\n${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  // Prepare table rows
  const rows = submissions.map((s, idx) => {
    // Format submission type with the same logic as in the table
    let submissionType = "Manual";
    if (s.submissionType === "auto") {
      submissionType = "Auto";
    } else if (s.submissionType === "manual" && s.completedAt < 1720900800000) {
      submissionType = "Legacy";
    }
    
    // Format auto-submit reason with the same logic as in the table
    let autoSubmitReason = "-";
    if (s.submissionType === "auto") {
      if (s.autoSubmitReason === "timeExpired") autoSubmitReason = "Timer Expired";
      else if (s.autoSubmitReason === "maxTabSwitches") autoSubmitReason = "Max Tab Switches";
      else if (s.autoSubmitReason === "tabSwitchTimeout") autoSubmitReason = "Tab Switch Timeout";
      else if (s.autoSubmitReason === "maxCopyAttempts") autoSubmitReason = "Copy Attempts Limit";
      else autoSubmitReason = "Unknown";
    }
    
    return {
      sno: idx + 1,
      name: truncate(s.name || "", 30), // Reduced max length
      regno: truncate(s.regno || "", 20), // Reduced max length
      email: truncate(s.email || "", 25), // Reduced max length
      mobile: s.mobile || "",
      answeredCount: s.answeredCount ?? "",
      unansweredCount: s.unansweredCount ?? "",
      testModeAtStart: truncate(s.testModeAtStart || "", 15), // Reduced max length
      score: s.score ?? "",
      correctCount: s.correctCount ?? "",
      wrongCount: s.wrongCount ?? "",
      quizDuration: s.quizDuration || "",
      startedAt: s.startedAt ? formatDate(s.startedAt) : "",
      completedAt: s.completedAt ? formatDate(s.completedAt) : "",
      submissionType,
      autoSubmitReason: truncate(autoSubmitReason, 20), // Reduced max length
      deviceType: truncate(s.deviceType || "Unknown", 12), // Reduced max length
      browserInfo: truncate(s.browserInfo || "Unknown", 20), // Reduced max length
      screenResolution: truncate(s.screenResolution || "Unknown", 15), // Reduced max length
      tabSwitchCount: s.tabSwitchCount ?? 0,
      copyAttemptCount: s.copyAttemptCount ?? 0,
      emailSent: s.emailSent === true ? "Y" : "N", // Shortened to single letter
    };
  });

  // Add a colored header bar
  doc.setFillColor(63, 81, 181);
  doc.rect(0, 0, doc.internal.pageSize.width, 25, 'F');
  
  // Add white text for the title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.text("Test Submissions Report", 10, 15);
  
  // Add date in a smaller size
  doc.setFontSize(12);
  doc.text(`Generated: ${dateStr}`, doc.internal.pageSize.width - 60, 15);

  autoTable(doc, {
    head: [columns.map(col => col.header)],
    body: rows.map(row => columns.map(col => row[col.dataKey])),
    startY: 35,
    theme: 'striped',
    styles: {
      fontSize: 7, // Even smaller font
      cellPadding: 0.5, // Minimal padding
      overflow: 'linebreak',
      minCellWidth: 5,
      cellWidth: 'auto',
      halign: 'center',
      valign: 'middle',
      lineColor: [120, 144, 156],
      lineWidth: 0.1,
    },
    headStyles: {
      fontSize: 7,
      fillColor: [63, 81, 181],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
      cellPadding: 1, // Minimal padding in header too
    },
    alternateRowStyles: {
      fillColor: [240, 248, 255],
    },
    margin: { top: 30, right: 3, bottom: 3, left: 3 }, // Minimal margins
    tableWidth: 'auto',
    horizontalPageBreak: false, // We want all columns on one page
    rowPageBreak: 'auto',
    showHead: 'everyPage',
    showFoot: 'everyPage',
    tableLineWidth: 0.3, // Thinner lines
    tableLineColor: [128, 128, 128],
    createdCell: function(cell) {
      // Set smaller word spacing and character spacing for all cells
      cell.styles.cellPadding = 1;
    },
    // Ultra-optimized column widths to ensure all columns fit on a single A3 page
    columnStyles: {
      // Very narrow columns (minimal numbers/indicators)
      sno: { cellWidth: 6, halign: 'center' },
      score: { cellWidth: 8, halign: 'center' },
      correctCount: { cellWidth: 8, halign: 'center' },
      wrongCount: { cellWidth: 8, halign: 'center' },
      answeredCount: { cellWidth: 8, halign: 'center' },
      unansweredCount: { cellWidth: 8, halign: 'center' },
      tabSwitchCount: { cellWidth: 9, halign: 'center' },
      copyAttemptCount: { cellWidth: 9, halign: 'center' },
      emailSent: { cellWidth: 8, halign: 'center' },
      
      // Narrow columns
      mobile: { cellWidth: 14, halign: 'center' },
      testModeAtStart: { cellWidth: 10, halign: 'center' },
      quizDuration: { cellWidth: 12, halign: 'center' },
      deviceType: { cellWidth: 10, halign: 'center' },
      submissionType: { cellWidth: 12, halign: 'center' },
      screenResolution: { cellWidth: 14, halign: 'center' },
      
      // Medium width columns
      regno: { cellWidth: 16, halign: 'left' },
      browserInfo: { cellWidth: 15, halign: 'center' },
      
      // Date columns - use line breaks efficiently
      startedAt: { cellWidth: 16, halign: 'center' },
      completedAt: { cellWidth: 16, halign: 'center' },
      
      // Wider columns only for crucial information
      name: { cellWidth: 20, halign: 'left' },
      email: { cellWidth: 20, halign: 'left' },
      autoSubmitReason: { cellWidth: 16, halign: 'left' },
    },
    didDrawPage: (data) => {
      // Add footer with page numbers
      const pageNumber = doc.internal.getNumberOfPages();
      const pageCount = doc.internal.getNumberOfPages();
      
      // Add line above footer
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.line(
        data.settings.margin.left, 
        doc.internal.pageSize.height - 10, 
        doc.internal.pageSize.width - data.settings.margin.right, 
        doc.internal.pageSize.height - 10
      );
      
      // Add page number text
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(8);
      doc.text(
        `Page ${pageNumber} of ${pageCount}`, 
        doc.internal.pageSize.width / 2, 
        doc.internal.pageSize.height - 5,
        { align: 'center' }
      );
    },
  });

  doc.save(`quiz_submissions_${dateStr}.pdf`);
}
