// src/components/admin/TestModeSelector.jsx
import React, { useState } from "react";
import useAdmin from "./hooks/useAdmin";
import CertificatePreview from "./CertificatePreview";

const TestModeSelector = () => {
  const {
    testMode, handleTestModeChange, testModeLoading,
    certificateEnabled, certificateLoading, handleCertificateToggle,
  } = useAdmin();

  const [showPreview, setShowPreview] = useState(false);

  return (
    <div className="mb-8 print:hidden space-y-3">
      {showPreview && <CertificatePreview onClose={() => setShowPreview(false)} />}
      {/* Test Mode */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 bg-yellow-100 border-2 border-yellow-400 rounded-lg p-4 shadow">
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

      {/* Certificate Toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-indigo-50 border-2 border-indigo-300 rounded-lg p-4 shadow">
        <span className="font-semibold text-indigo-900 text-base sm:text-lg whitespace-nowrap">
          📄 Participation Certificate:
        </span>
        <button
          onClick={handleCertificateToggle}
          disabled={certificateLoading}
          className={`relative inline-flex items-center w-12 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
            certificateEnabled ? "bg-indigo-600" : "bg-gray-300"
          } ${certificateLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          aria-label="Toggle participation certificate"
        >
          <span
            className={`inline-block w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
              certificateEnabled ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
        <span className={`text-sm font-medium ${certificateEnabled ? "text-indigo-700" : "text-gray-500"}`}>
          {certificateEnabled ? "Enabled — PDF certificate attached to result email" : "Disabled — no certificate sent"}
        </span>
        <button
          onClick={() => setShowPreview(true)}
          className="ml-auto text-xs px-3 py-1 rounded border border-indigo-400 text-indigo-700 hover:bg-indigo-100 transition-colors whitespace-nowrap"
        >
          Preview Certificate
        </button>
      </div>
    </div>
  );
};

export default TestModeSelector;
