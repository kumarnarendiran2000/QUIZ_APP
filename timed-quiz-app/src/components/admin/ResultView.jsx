// src/components/admin/ResultView.jsx
import React from "react";
import useAdmin from "./hooks/useAdmin";
import { questions } from "../../data/questions";
import { sendEmail } from "./adminUtils";

const ResultView = () => {
  const {
    viewing,
    setViewing,
    tableRef,
    correctAnswers,
    emailSending,
    emailUserInProgress,
    setEmailSending,
    setEmailUserInProgress,
    setEmailToast,
  } = useAdmin();

  if (!viewing) {
    return null;
  }

  const handleSendEmail = async () => {
    if (!viewing || emailSending) return;

    setEmailSending(true);
    setEmailUserInProgress(viewing.id);

    // Show info toast with longer timeout for long-running operations
    setEmailToast({
      show: true,
      type: "info",
      message: `Sending email to ${viewing.name} (${viewing.email})...`,
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
      await sendEmail(
        viewing,
        setEmailToast,
        setEmailSending,
        setEmailUserInProgress
      );

      // Clear any previous timeout for the info toast
      clearTimeout(infoToastTimeout);
    } catch (error) {
      console.error("Error sending email:", error);
      // Clear any previous timeout for the info toast
      clearTimeout(infoToastTimeout);

      setEmailToast({
        show: true,
        type: "error",
        message: `Failed to send email to ${viewing.name} (${viewing.email}): ${error.message}`,
      });

      // Auto dismiss error toast after 5 seconds
      setTimeout(() => {
        setEmailToast((prev) => ({ ...prev, show: false }));
      }, 5000);
    } finally {
      // Make sure states are reset even if not caught by the adminUtils sendEmail function
      setTimeout(() => {
        setEmailSending(false);
        setEmailUserInProgress(null);
      }, 500);
    }
  };

  return (
    <div
      id="result-view"
      className="mt-8 p-6 border border-gray-300 rounded-md bg-gray-50 relative"
    >
      {/* Floating close results view button with semi-transparency (positioned to avoid collision with controls) */}
      <div className="fixed left-4 top-32 z-50">
        <button
          onClick={() => {
            setViewing(null);
            tableRef.current?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-full shadow-lg flex items-center text-xs md:text-sm"
        >
          Close Results View <span className="mx-1">↑</span> Table
        </button>
      </div>

      {/* User Details - Centered Container */}
      <div className="mb-6 bg-white p-4 md:p-6 rounded-lg shadow-sm border border-gray-200 max-w-3xl mx-auto text-center">
        <div className="inline-block text-left">
          {/* User Info Grid - Better alignment and mobile responsive */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 mb-4">
            <div className="flex flex-wrap items-baseline">
              <span className="font-bold min-w-24 mr-1">Name:</span>
              <span className="flex-1">{viewing.name}</span>
            </div>
            <div className="flex flex-wrap items-baseline">
              <span className="font-bold min-w-24 mr-1">Registration:</span>
              <span className="flex-1">{viewing.regno || "-"}</span>
            </div>
            <div className="flex flex-wrap items-baseline">
              <span className="font-bold min-w-24 mr-1">Email:</span>
              <span className="flex-1 break-words">{viewing.email}</span>
            </div>
            <div className="flex flex-wrap items-baseline">
              <span className="font-bold min-w-24 mr-1">Mobile:</span>
              <span className="flex-1">{viewing.mobile}</span>
            </div>
          </div>

          {/* Score Stats - Mobile Optimized */}
          <div className="grid grid-cols-1 gap-3 mb-4">
            <div className="px-3 py-2 rounded-md bg-gray-50 text-gray-700 flex flex-wrap justify-center gap-x-4 gap-y-2">
              <div className="flex-shrink-0 whitespace-nowrap">
                ✅ Correct: <strong>{viewing.correctCount}</strong>
              </div>
              <div className="flex-shrink-0 whitespace-nowrap">
                ❌ Wrong: <strong>{viewing.wrongCount}</strong>
              </div>
            </div>

            <div className="px-3 py-2 rounded-md bg-gray-50 text-gray-700 flex flex-wrap justify-center gap-x-4 gap-y-2">
              <div className="flex-shrink-0 whitespace-nowrap">
                🟦 Answered: <strong>{viewing.answeredCount}</strong>
              </div>
              <div className="flex-shrink-0 whitespace-nowrap">
                ⬜ Unanswered: <strong>{viewing.unansweredCount}</strong>
              </div>
            </div>

            <div className="px-3 py-2 rounded-md bg-gray-50 text-gray-700 flex flex-wrap justify-center gap-x-4 gap-y-2">
              <div className="flex-shrink-0 whitespace-nowrap">
                🕒 Started At:{" "}
                <strong>
                  {viewing.startedAt
                    ? new Date(viewing.startedAt).toLocaleString()
                    : "N/A"}
                </strong>
              </div>
              <div className="flex-shrink-0 whitespace-nowrap">
                🏁 Completed At:{" "}
                <strong>
                  {viewing.completedAt
                    ? new Date(viewing.completedAt).toLocaleString()
                    : "N/A"}
                </strong>
              </div>
            </div>

            <div className="px-3 py-2 rounded-md bg-gray-50 text-gray-700 flex flex-wrap justify-center gap-x-4 gap-y-2">
              <div className="flex-shrink-0 whitespace-nowrap">
                ⏱️ Time Taken: <strong>{viewing.quizDuration || "N/A"}</strong>
              </div>
              <div className="flex-shrink-0 whitespace-nowrap">
                🔄 Tab Switches:{" "}
                <strong>
                  {typeof viewing.tabSwitchCount === "number"
                    ? viewing.tabSwitchCount
                    : 0}
                </strong>
              </div>
            </div>

            <div className="px-3 py-2 rounded-md bg-orange-50 text-gray-700 flex flex-wrap justify-center gap-x-4 gap-y-2">
              <div className="flex-shrink-0 whitespace-nowrap">
                📝 Submission Type:{" "}
                <strong
                  className={
                    viewing.submissionType === "auto"
                      ? "text-orange-700"
                      : viewing.submissionType === "manual" &&
                        viewing.completedAt < 1720900800000
                      ? "text-gray-700"
                      : "text-blue-700"
                  }
                >
                  {viewing.submissionType === "auto"
                    ? "Auto"
                    : viewing.submissionType === "manual" &&
                      viewing.completedAt < 1720900800000
                    ? "Legacy"
                    : "Manual"}
                </strong>
              </div>
              {viewing.submissionType === "auto" && (
                <div className="flex-shrink-0 whitespace-nowrap text-left">
                  <span className="inline-block align-middle">
                    ℹ️ Auto-Submit Reason:
                  </span>{" "}
                  <strong className="text-orange-700 inline-block align-middle">
                    {viewing.autoSubmitReason === "timeExpired"
                      ? "Timer Expired"
                      : viewing.autoSubmitReason === "maxTabSwitches"
                      ? "Max Tab Switches"
                      : viewing.autoSubmitReason === "tabSwitchTimeout"
                      ? "Tab Switch Timeout"
                      : viewing.autoSubmitReason === "maxCopyAttempts"
                      ? "Copy Attempts Limit"
                      : viewing.autoSubmitReason || "Unknown"}
                  </strong>
                </div>
              )}
            </div>

            <div className="px-3 py-2 rounded-md bg-purple-50 text-gray-700 flex flex-wrap justify-center gap-x-4 gap-y-2">
              <div className="flex-shrink-0 whitespace-nowrap">
                📱 Device Type:{" "}
                <strong
                  className={
                    viewing.deviceType === "mobile"
                      ? "text-red-700"
                      : viewing.deviceType === "tablet"
                      ? "text-yellow-700"
                      : "text-green-700"
                  }
                >
                  {viewing.deviceType || "Unknown"}
                </strong>
              </div>
              <div className="flex-shrink-0 whitespace-nowrap">
                🌐 Browser: <strong>{viewing.browserInfo || "Unknown"}</strong>
              </div>
            </div>
          </div>

          {/* Email Status - Centered properly */}
          <div className="flex flex-wrap justify-center gap-2 items-center">
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
              <span className="text-sm text-gray-500">
                ({new Date(viewing.emailSentAt.toDate()).toLocaleString()})
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-center mb-4">
        <button
          onClick={handleSendEmail}
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

          const correct = correctAnswers[index]; // Use from component state instead of viewing object
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

          // Use correctAnswers from state for legacy format too
          const correct = correctAnswers[r.q - 1];
          const selected = r.selected;

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
            </div>
          );
        })
      ) : (
        // Case 3: No data available
        <p className="text-gray-600">
          No detailed results available for this submission.
        </p>
      )}
    </div>
  );
};

export default ResultView;
