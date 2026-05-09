// src/components/admin/CertificatePreview.jsx
import React from "react";

// Image is 1600x1138px. Preview is rendered at 840x597 (same ratio).
// Scale: x = 840/1600 = 0.525, y = 597/1138 = 0.524
// All overlay positions below are derived from image pixel coords × scale.

const PREVIEW_W = 840;
const PREVIEW_H = 597;

const overlayStyle = (left, top, extra = {}) => ({
  position: "absolute",
  left,
  top,
  fontFamily: "Georgia, 'Times New Roman', serif",
  fontSize: 14,
  fontWeight: "bold",
  color: "#111111",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  whiteSpace: "nowrap",
  pointerEvents: "none",
  ...extra,
});

const CertificatePreview = ({ onClose }) => {
  // Dummy values for preview
  const name    = "Dr. Sample Participant";
  const regno   = "RGUHS-12345";
  const date    = new Date().toLocaleDateString("en-IN", {
    day: "2-digit", month: "long", year: "numeric", timeZone: "Asia/Kolkata",
  });

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl" style={{ maxWidth: "880px", width: "100%" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Certificate Preview</h2>
            <p className="text-xs text-gray-500 mt-0.5">Showing with dummy data — actual certificate uses real participant info</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold leading-none"
          >
            &times;
          </button>
        </div>

        {/* Certificate with overlaid text */}
        <div className="p-4 flex justify-center overflow-auto">
          <div style={{ position: "relative", width: PREVIEW_W, height: PREVIEW_H, flexShrink: 0 }}>

            {/* Background: the actual certificate template */}
            <img
              src="/certificate_template.png"
              alt="Certificate template"
              style={{ width: PREVIEW_W, height: PREVIEW_H, display: "block" }}
            />

            {/* ── Name (after "presented to") ── */}
            <span style={overlayStyle(405, 306, { fontSize: 19, backgroundColor: "rgba(255,255,255,0.9)", padding: "1px 4px" })}>
              {name}
            </span>

            {/* ── Registration Number ── */}
            <span style={overlayStyle(472, 348, { fontSize: 18, backgroundColor: "rgba(255,255,255,0.9)", padding: "1px 4px" })}>
              {regno}
            </span>

            {/* ── "held from" date ── */}
            <span style={overlayStyle(400, 420, { fontSize: 16, backgroundColor: "rgba(255,255,255,0.9)", padding: "1px 4px" })}>
              {date}
            </span>

            {/* ── "to" date (same date) ── */}
            <span style={overlayStyle(570, 420, { fontSize: 16, backgroundColor: "rgba(255,255,255,0.9)", padding: "1px 4px" })}>
              {date}
            </span>

          </div>
        </div>

        <div className="px-5 py-3 border-t text-sm text-gray-500 text-center">
          If any text is misaligned, tell me which field and I'll nudge the coordinates.
        </div>
      </div>
    </div>
  );
};

export default CertificatePreview;
