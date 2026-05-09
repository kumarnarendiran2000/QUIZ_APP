// src/components/admin/CertificatePreview.jsx
import React from "react";

const CertificatePreview = ({ onClose }) => {
  // Sample values for preview
  const name = "Participant Name";
  const regno = "REG-12345";
  const testType = "Post-Test";
  const dateStr = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-70 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full">
        <div className="flex items-center justify-between px-5 py-3 border-b">
          <h2 className="text-lg font-bold text-gray-800">Certificate Preview</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold leading-none"
          >
            &times;
          </button>
        </div>

        {/* Certificate canvas — scaled to fit the modal */}
        <div className="p-4 flex justify-center overflow-auto">
          <div
            style={{
              width: "840px",
              height: "594px",
              background: "#faf8f3",
              position: "relative",
              fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
              border: "14px solid #1a237e",
              boxSizing: "border-box",
              flexShrink: 0,
            }}
          >
            {/* Inner gold accent lines */}
            <div style={{ position: "absolute", top: 6, left: 6, right: 6, height: 2, background: "#c5a028" }} />
            <div style={{ position: "absolute", bottom: 6, left: 6, right: 6, height: 2, background: "#c5a028" }} />
            <div style={{ position: "absolute", top: 6, bottom: 6, left: 6, width: 2, background: "#c5a028" }} />
            <div style={{ position: "absolute", top: 6, bottom: 6, right: 6, width: 2, background: "#c5a028" }} />

            {/* Corner L-brackets */}
            {[
              { top: 13, left: 13, borderTop: "2.5px solid #c5a028", borderLeft: "2.5px solid #c5a028", borderRight: "none", borderBottom: "none" },
              { top: 13, right: 13, borderTop: "2.5px solid #c5a028", borderRight: "2.5px solid #c5a028", borderLeft: "none", borderBottom: "none" },
              { bottom: 13, left: 13, borderBottom: "2.5px solid #c5a028", borderLeft: "2.5px solid #c5a028", borderRight: "none", borderTop: "none" },
              { bottom: 13, right: 13, borderBottom: "2.5px solid #c5a028", borderRight: "2.5px solid #c5a028", borderLeft: "none", borderTop: "none" },
            ].map((style, i) => (
              <div key={i} style={{ position: "absolute", width: 20, height: 20, ...style }} />
            ))}

            {/* Header band */}
            <div
              style={{
                position: "absolute", top: 10, left: 10, right: 10, height: 68,
                background: "#1a237e",
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", gap: 4,
              }}
            >
              <div style={{ color: "#ffffff", fontSize: 19, fontWeight: "bold", letterSpacing: "2px" }}>
                DR. NK BHAT SKILL LAB
              </div>
              <div style={{ color: "#f0c040", fontSize: 12 }}>
                Navodaya Medical College, Raichur, Karnataka
              </div>
            </div>

            {/* Gold bar under header */}
            <div style={{ position: "absolute", top: 78, left: 10, right: 10, height: 4, background: "#c5a028" }} />

            {/* CERTIFICATE */}
            <div
              style={{
                position: "absolute", top: 94, left: 0, right: 0,
                textAlign: "center", color: "#1a237e",
                fontSize: 44, fontWeight: "bold", letterSpacing: "3px",
              }}
            >
              CERTIFICATE
            </div>

            {/* OF PARTICIPATION */}
            <div
              style={{
                position: "absolute", top: 146, left: 0, right: 0,
                textAlign: "center", color: "#1a237e",
                fontSize: 16, fontWeight: "bold", letterSpacing: "2px",
              }}
            >
              OF PARTICIPATION
            </div>

            {/* Ornamental divider */}
            <div style={{ position: "absolute", top: 178, left: 0, right: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <div style={{ height: 1, width: 180, background: "#c5a028" }} />
              <div style={{ width: 10, height: 10, background: "#c5a028", transform: "rotate(45deg)", flexShrink: 0 }} />
              <div style={{ height: 1, width: 180, background: "#c5a028" }} />
            </div>

            {/* "This is to certify that" */}
            <div style={{ position: "absolute", top: 198, left: 0, right: 0, textAlign: "center", color: "#777777", fontSize: 14 }}>
              This is to certify that
            </div>

            {/* Name */}
            <div
              style={{
                position: "absolute", top: 220, left: 0, right: 0,
                textAlign: "center", color: "#1a237e",
                fontSize: 30, fontWeight: "bold",
              }}
            >
              {name}
            </div>

            {/* Gold underline for name */}
            <div style={{ position: "absolute", top: 259, left: "25%", right: "25%", height: 2, background: "#c5a028" }} />

            {/* Registration No */}
            <div style={{ position: "absolute", top: 268, left: 0, right: 0, textAlign: "center", color: "#888888", fontSize: 13 }}>
              Registration No: {regno}
            </div>

            {/* Body */}
            <div style={{ position: "absolute", top: 292, left: 0, right: 0, textAlign: "center", color: "#444444", fontSize: 14 }}>
              has successfully participated in the
            </div>
            <div style={{ position: "absolute", top: 316, left: 0, right: 0, textAlign: "center", color: "#1a237e", fontSize: 20, fontWeight: "bold" }}>
              {testType}
            </div>
            <div style={{ position: "absolute", top: 346, left: 0, right: 0, textAlign: "center", color: "#555555", fontSize: 13 }}>
              organized by Dr. NK Bhat Skill Lab, Navodaya Medical College, Raichur
            </div>

            {/* Gold divider before date */}
            <div style={{ position: "absolute", top: 372, left: 50, right: 50, height: 1, background: "#c5a028" }} />

            {/* Date */}
            <div style={{ position: "absolute", top: 386, left: 0, right: 0, textAlign: "center", color: "#999999", fontSize: 10, letterSpacing: "1px" }}>
              DATE
            </div>
            <div style={{ position: "absolute", top: 402, left: 0, right: 0, textAlign: "center", color: "#333333", fontSize: 13, fontWeight: "bold" }}>
              {dateStr}
            </div>

            {/* Footer */}
            <div
              style={{
                position: "absolute", bottom: 10, left: 10, right: 10, height: 14,
                background: "#1a237e",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <span style={{ color: "#f0c040", fontSize: 9 }}>
                Dr. NK Bhat Skill Lab &nbsp;·&nbsp; Navodaya Medical College, Raichur, Karnataka
              </span>
            </div>
          </div>
        </div>

        <div className="px-5 py-3 border-t text-sm text-gray-500 text-center">
          This is a representative preview — the actual PDF certificate will match this layout.
        </div>
      </div>
    </div>
  );
};

export default CertificatePreview;
