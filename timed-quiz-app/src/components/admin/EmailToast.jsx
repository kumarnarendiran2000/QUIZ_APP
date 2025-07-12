// src/components/admin/EmailToast.jsx
import React from "react";
import useAdmin from "./hooks/useAdmin";

const EmailToast = () => {
  const { emailToast, setEmailToast } = useAdmin();

  if (!emailToast.show) {
    return null;
  }

  return (
    <div
      className={`fixed top-4 z-50 px-6 py-4 rounded-lg shadow-lg text-white flex items-center justify-between gap-4 transition-all duration-300 animate-fadeIn md:right-4 left-1/2 md:left-auto md:transform-none transform -translate-x-1/2 md:translate-x-0 ${
        emailToast.type === "success"
          ? "bg-green-600"
          : emailToast.type === "error"
          ? "bg-red-600"
          : "bg-blue-600"
      }`}
      style={{ maxWidth: "90%", width: "400px" }}
    >
      <span className="flex-1">{emailToast.message}</span>
      <button
        aria-label="Close notification"
        className="ml-4 text-white text-2xl font-bold focus:outline-none hover:opacity-80"
        style={{
          lineHeight: 1,
          background: "none",
          border: "none",
          cursor: "pointer",
        }}
        onClick={() => setEmailToast((prev) => ({ ...prev, show: false }))}
      >
        &times;
      </button>
    </div>
  );
};

export default EmailToast;
