// src/components/admin/SubmissionsTable.jsx
import React from "react";
import useAdmin from "./hooks/useAdmin";

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

  // Handle select all toggle
  const handleSelectAllRows = (e) => {
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SubmissionsTable;
