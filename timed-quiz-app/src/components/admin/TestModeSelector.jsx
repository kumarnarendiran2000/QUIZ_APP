// src/components/admin/TestModeSelector.jsx
import React from "react";
import useAdmin from "./hooks/useAdmin";

const TestModeSelector = () => {
  const { testMode, handleTestModeChange, testModeLoading } = useAdmin();

  return (
    <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center gap-2 print:hidden bg-yellow-100 border-2 border-yellow-400 rounded-lg p-4 shadow">
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
  );
};

export default TestModeSelector;
