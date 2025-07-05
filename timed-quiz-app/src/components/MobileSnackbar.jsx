import React from "react";

const MobileSnackbar = ({ open, message, onClose }) => {
  if (!open) return null;
  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 w-[95vw] max-w-sm">
      <div className="bg-red-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center justify-between animate-fade-in">
        <span className="text-sm font-semibold">{message}</span>
        <button
          onClick={onClose}
          className="ml-4 text-white text-lg font-bold focus:outline-none"
          aria-label="Close notification"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default MobileSnackbar;
