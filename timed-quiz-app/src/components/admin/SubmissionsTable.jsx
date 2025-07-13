// src/components/admin/SubmissionsTable.jsx
import React from "react";
import useAdmin from "./hooks/useAdmin";
import ExportControls from "./ExportControls";

const SubmissionsTable = () => {
  const {
    submissions,
    loading,
    tableRef,
    selectedIds,
    selectAll,
    setSelectAll,
    setViewing,
    setDeleteTarget,
    fetchCorrectAnswers,
    emailSending,
    emailUserInProgress,
    setEmailSending,
    setEmailUserInProgress,
    setEmailToast,
    setSelectedIds,
  } = useAdmin();

  // State for date and test mode filters
  const [dateFilter, setDateFilter] = React.useState("all");
  const [testModeFilter, setTestModeFilter] = React.useState("all");

  // Get unique dates and test modes
  const uniqueDates = React.useMemo(() => {
    const dates = [...new Set(submissions.map((s) => s.testDate || "Unknown"))];
    return ["all", ...dates.sort()];
  }, [submissions]);

  const uniqueTestModes = React.useMemo(() => {
    const modes = [
      ...new Set(
        submissions.map(
          (s) => s.displayTestMode || s.testModeAtStart || "Unknown"
        )
      ),
    ];
    return ["all", ...modes.sort()];
  }, [submissions]);

  // Filter submissions based on selected filters
  const filteredSubmissions = React.useMemo(() => {
    return submissions.filter((s) => {
      const matchesDate = dateFilter === "all" || s.testDate === dateFilter;
      const matchesTestMode =
        testModeFilter === "all" ||
        s.displayTestMode === testModeFilter ||
        s.testModeAtStart === testModeFilter;
      return matchesDate && matchesTestMode;
    });
  }, [submissions, dateFilter, testModeFilter]);

  // Handle select all toggle
  const handleSelectAllRows = (e) => {
    const checked = e.target.checked;
    setSelectAll(checked);
    if (checked) {
      // Only select IDs from the filtered submissions
      setSelectedIds(filteredSubmissions.map((s) => s.id));
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
      // Import sendEmail from adminUtils dynamically to avoid circular dependency
      const { sendEmail } = await import("./adminUtils");
      await sendEmail(
        user,
        setEmailToast,
        setEmailSending,
        setEmailUserInProgress
      );

      // Clear any previous timeout for the info toast
      clearTimeout(infoToastTimeout);

      setTimeout(() => {
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

      setEmailSending(false);
      setEmailUserInProgress(null);
    } finally {
      // Make sure states are reset even if not caught by the adminUtils sendEmail function
      setTimeout(() => {
        setEmailSending(false);
        setEmailUserInProgress(null);
      }, 500);
    }
  };

  // Update selectAll state when filters or selections change
  React.useEffect(() => {
    // If there are no filtered submissions, ensure selectAll is false
    if (filteredSubmissions.length === 0) {
      setSelectAll(false);
      return;
    }

    // Check if all filtered submissions are selected
    const allSelected = filteredSubmissions.every((s) =>
      selectedIds.includes(s.id)
    );

    setSelectAll(allSelected);
  }, [filteredSubmissions, selectedIds, setSelectAll]);

  // Effect to check if current filter has no results after deletion, and reset if needed
  React.useEffect(() => {
    // If there are submissions but none match the current filters, reset to "all"
    if (submissions.length > 0 && filteredSubmissions.length === 0) {
      setDateFilter("all");
      setTestModeFilter("all");
    }

    // If there are no dates matching the current dateFilter, reset it
    if (dateFilter !== "all" && !uniqueDates.includes(dateFilter)) {
      setDateFilter("all");
    }

    // If there are no test modes matching the current testModeFilter, reset it
    if (testModeFilter !== "all" && !uniqueTestModes.includes(testModeFilter)) {
      setTestModeFilter("all");
    }
  }, [
    submissions,
    filteredSubmissions,
    uniqueDates,
    uniqueTestModes,
    dateFilter,
    testModeFilter,
  ]);

  if (loading) {
    return (
      <p className="text-center text-gray-500 text-lg">
        Loading submissions...
      </p>
    );
  }

  if (submissions.length === 0) {
    return (
      <p className="text-center text-gray-500 text-lg">
        No submissions found yet.
      </p>
    );
  }

  return (
    <div>
      {/* Filters */}
      {/* Add animation style for the filter box */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
          @keyframes fadeInDown {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          @keyframes pulse {
            0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.3); }
            70% { box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
            100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
          }
          .animate-fade-in-down {
            animation: fadeInDown 0.5s ease-out forwards;
          }
          .animate-pulse-once {
            animation: pulse 2s ease-in-out;
          }
          .filter-transition {
            transition: all 0.3s ease-in-out;
          }
          `,
        }}
      />

      {/* Export controls with filtered submissions - Mobile optimized layout */}
      <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <ExportControls filteredSubmissions={filteredSubmissions} />

        {/* Container with adjusted width for the filter box */}
        <div className="w-full md:w-2/3 md:ml-auto">
          {/* Filter Box - Enhanced design with mobile optimization and animation */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-300 shadow-md w-full animate-fade-in-down animate-pulse-once">
            {/* Top row with evenly distributed dropdowns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div className="flex flex-col">
                <label className="font-bold text-blue-800 text-base mb-1">
                  Test Date:
                </label>
                <select
                  className="border border-blue-300 rounded-md p-2 bg-white focus:ring-2 focus:ring-blue-400 focus:border-blue-400 w-full filter-transition hover:border-blue-500"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                >
                  {uniqueDates.map((date) => (
                    <option key={date} value={date}>
                      {date === "all" ? "All Dates" : date}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col">
                <label className="font-bold text-blue-800 text-base mb-1">
                  Test Mode:
                </label>
                <select
                  className="border border-blue-300 rounded-md p-2 bg-white focus:ring-2 focus:ring-blue-400 focus:border-blue-400 w-full filter-transition hover:border-blue-500"
                  value={testModeFilter}
                  onChange={(e) => setTestModeFilter(e.target.value)}
                >
                  {uniqueTestModes.map((mode) => (
                    <option key={mode} value={mode}>
                      {mode === "all"
                        ? "All Modes"
                        : mode.charAt(0).toUpperCase() + mode.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Bottom row with counter centered */}
            <div className="flex justify-center">
              <div className="text-center text-sm font-semibold text-blue-700 bg-white bg-opacity-70 p-2 rounded-md border border-blue-100 shadow-sm w-full sm:w-1/2">
                Showing{" "}
                <span className="font-bold text-blue-900">
                  {filteredSubmissions.length}
                </span>{" "}
                of{" "}
                <span className="font-bold text-blue-900">
                  {submissions.length}
                </span>{" "}
                submissions
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile-friendly notice */}
      <div className="md:hidden mb-4 bg-blue-50 p-4 rounded-lg border border-blue-200 text-sm">
        <p className="font-medium text-blue-800">
          Note: This table is scrollable horizontally.
        </p>
        <p className="text-blue-600">
          Swipe left/right to view all columns or use the navigation controls
          available.
        </p>
      </div>

      <div ref={tableRef} className="overflow-x-auto border rounded-md">
        <table className="min-w-full text-sm sm:text-base text-left print:text-xs whitespace-nowrap md:whitespace-normal">
          <thead className="bg-gray-100 text-gray-700 uppercase font-semibold">
            <tr>
              <th className="px-2 py-3 text-center w-12">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={handleSelectAllRows}
                  aria-label="Select all"
                />
              </th>
              <th className="px-4 py-3 text-center w-16">S. No</th>
              <th className="px-4 py-3 text-center">Name</th>
              <th className="px-4 py-3">Registration Number</th>
              <th className="px-4 py-3 text-center">Email</th>
              <th className="px-4 py-3">Mobile</th>
              <th className="px-2 py-3 text-center w-20">Answered</th>
              <th className="px-2 py-3 text-center w-20">Unanswered</th>
              <th className="px-4 py-3 font-bold text-blue-700 bg-blue-50 text-center">
                Test Mode
              </th>
              <th className="px-4 py-3 text-center w-16">Score</th>
              <th className="px-4 py-3 text-green-700 text-center w-16">
                Correct
              </th>
              <th className="px-4 py-3 text-red-700 text-center w-16">Wrong</th>
              <th className="px-4 py-3 text-center whitespace-nowrap">
                Time Taken
              </th>
              <th className="px-4 py-3 text-center whitespace-nowrap">
                Started At
              </th>
              <th className="px-4 py-3 text-center whitespace-nowrap">
                Completed At
              </th>
              <th className="px-4 py-3 text-center w-24">Tab Switches</th>
              <th className="px-4 py-3 text-center w-24">Copy Attempts</th>
              <th className="px-4 py-3 font-bold text-purple-700 bg-purple-50 text-center w-24">
                Email Sent
              </th>
              <th className="px-4 py-3 font-bold text-indigo-700 bg-indigo-50 print:hidden text-center">
                Email Action
              </th>
              <th className="px-4 py-3 print:hidden text-center">Action</th>
              <th className="px-4 py-3 print:hidden text-center">Delete</th>
              <th className="px-4 py-3 font-bold text-orange-700 bg-orange-50 text-center w-32">
                Submission Type
              </th>
              <th className="px-4 py-3 font-bold text-orange-700 bg-orange-50 w-36 text-left">
                Auto-Submit Reason
              </th>
              <th className="px-4 py-3 font-bold text-purple-700 bg-purple-50 text-center w-28">
                Device Type
              </th>
              <th className="px-4 py-3 font-bold text-purple-700 bg-purple-50 text-center w-32">
                Browser Info
              </th>
              <th className="px-4 py-3 font-bold text-purple-700 bg-purple-50 text-center w-32">
                Screen Resolution
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredSubmissions.map((s, idx) => (
              <tr
                key={s.id}
                className={`border-t hover:bg-gray-50 text-gray-800 ${
                  selectedIds.includes(s.id) ? "bg-blue-50" : ""
                } ${
                  s.isIncomplete ? "bg-yellow-50 border border-yellow-200" : ""
                }`}
                title={
                  s.isIncomplete
                    ? "Incomplete submission - may be missing data"
                    : ""
                }
              >
                <td className="px-2 py-2">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(s.id)}
                    onChange={() => handleSelectRow(s.id)}
                    aria-label={`Select row ${idx + 1}`}
                  />
                </td>
                <td className="px-4 py-2 text-center">{idx + 1}</td>
                <td className="px-4 py-2 whitespace-nowrap overflow-hidden text-ellipsis">
                  {s.name}
                </td>
                <td className="px-4 py-2">{s.regno || "-"}</td>
                <td className="px-4 py-2 whitespace-nowrap overflow-hidden text-ellipsis">
                  {s.email}
                </td>
                <td className="px-4 py-2">{s.mobile}</td>
                <td className="px-2 py-2 text-center w-20">
                  {s.answeredCount}
                </td>
                <td className="px-2 py-2 text-center w-20">
                  {s.unansweredCount}
                </td>
                {/* Show user's test mode from Firestore */}
                <td className="px-4 py-2 text-blue-700 font-semibold uppercase text-center">
                  {s.testModeAtStart || "-"}
                </td>
                <td className="px-4 py-2 font-semibold text-center w-16">
                  {s.score}
                </td>
                <td className="px-4 py-2 text-green-600 text-center w-16">
                  {s.correctCount}
                </td>
                <td className="px-4 py-2 text-red-600 text-center w-16">
                  {s.wrongCount}
                </td>
                <td className="px-4 py-2 text-center whitespace-nowrap">
                  {s.quizDuration || "N/A"}
                </td>
                <td className="px-4 py-2 text-center whitespace-nowrap">
                  {s.startedAt ? new Date(s.startedAt).toLocaleString() : "N/A"}
                </td>
                <td className="px-4 py-2 text-center whitespace-nowrap">
                  {s.completedAt
                    ? new Date(s.completedAt).toLocaleString()
                    : "N/A"}
                </td>
                <td className="px-4 py-2 text-center w-24">
                  {typeof s.tabSwitchCount === "number" ? s.tabSwitchCount : 0}
                </td>
                <td className="px-4 py-2 text-center w-24">
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
                    disabled={emailSending && emailUserInProgress === s.id}
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
                <td className="px-4 py-2 print:hidden text-center">
                  <button
                    onClick={async () => {
                      setViewing(s);
                      await fetchCorrectAnswers();

                      // Add a small delay to ensure the DOM updates before scrolling
                      setTimeout(() => {
                        document.getElementById("result-view")?.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        });
                      }, 100);
                    }}
                    className="px-3 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-md text-sm font-medium transition-colors duration-200 border border-blue-200 shadow-sm"
                  >
                    📊 View Result
                  </button>
                </td>
                <td className="px-4 py-2 print:hidden text-center">
                  <button
                    onClick={() => setDeleteTarget({ id: s.id, name: s.name })}
                    className="px-3 py-1 bg-red-100 text-red-700 hover:bg-red-200 rounded-md text-sm font-medium transition-colors duration-200 border border-red-200 shadow-sm"
                  >
                    🗑️ Delete
                  </button>
                </td>
                <td className="px-4 py-2 text-center w-32">
                  <span
                    className={`font-medium px-3 py-1 rounded-full text-sm ${
                      s.submissionType === "auto"
                        ? "bg-orange-100 text-orange-800"
                        : s.submissionType === "manual" &&
                          s.completedAt < 1720900800000 // Before July 13, 2025 (timestamp for detection implementation)
                        ? "bg-gray-100 text-gray-700"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {s.submissionType === "auto"
                      ? "Auto"
                      : s.submissionType === "manual"
                      ? "Manual"
                      : "Unknown"}
                  </span>
                </td>
                <td className="px-4 py-2 w-36">
                  {s.submissionType === "auto" ? (
                    <span className="font-medium px-3 py-1 rounded-full text-sm bg-orange-50 text-orange-800 inline-block text-left">
                      {s.autoSubmitReason === "timeExpired"
                        ? "Timer Expired"
                        : s.autoSubmitReason === "maxTabSwitches"
                        ? "Max Tab Switches"
                        : s.autoSubmitReason === "tabSwitchTimeout"
                        ? "Tab Switch Timeout"
                        : s.autoSubmitReason === "maxCopyAttempts"
                        ? "Copy Attempts Limit"
                        : "Unknown"}
                    </span>
                  ) : (
                    <span className="text-center inline-block w-full">-</span>
                  )}
                </td>
                <td className="px-4 py-2 text-center w-28">
                  <span
                    className={`font-medium px-3 py-1 rounded-full text-sm ${
                      s.deviceType === "mobile"
                        ? "bg-red-100 text-red-800"
                        : s.deviceType === "tablet"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {s.deviceType || "Unknown"}
                  </span>
                </td>
                <td className="px-4 py-2 text-center w-32">
                  {s.browser || s.browserInfo || "Unknown"}
                </td>
                <td className="px-4 py-2 text-center w-32">
                  {s.screenResolution ||
                    s.deviceInfo?.screenResolution ||
                    "Unknown"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Removed duplicate export controls that were here */}
    </div>
  );
};

export default SubmissionsTable;
