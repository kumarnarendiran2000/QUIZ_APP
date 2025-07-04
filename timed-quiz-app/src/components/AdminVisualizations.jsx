// src/components/AdminVisualizations.jsx
import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts";
import { useNavigate } from "react-router-dom";

const COLORS = [
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff8042",
  "#0088FE",
  "#FFBB28",
];

// Accept onClose prop for modal/expando closing, fallback to history if not provided
const AdminVisualizations = ({ submissions, onClose }) => {
  const navigate = useNavigate();
  const handleBack = () => {
    if (typeof onClose === "function") {
      onClose();
    } else if (window.history.length > 1) {
      window.history.back();
    } else {
      navigate("/"); // fallback to dashboard route, adjust if needed
    }
  };

  // Score distribution (group by score)
  const scoreCounts = {};
  submissions.forEach((s) => {
    const score = s.score ?? 0;
    scoreCounts[score] = (scoreCounts[score] || 0) + 1;
  });
  const scoreData = Object.keys(scoreCounts)
    .sort((a, b) => Number(a) - Number(b))
    .map((score) => ({ score, count: scoreCounts[score] }));

  // Submissions over time (by hour:minute only)
  const timeCounts = {};
  submissions.forEach((s) => {
    if (s.completedAt) {
      const d = new Date(s.completedAt);
      // Format: HH:mm (time only)
      const time = `${String(d.getHours()).padStart(2, "0")}:${String(
        d.getMinutes()
      ).padStart(2, "0")}`;
      timeCounts[time] = (timeCounts[time] || 0) + 1;
    }
  });
  const timeData = Object.keys(timeCounts)
    .sort((a, b) => {
      // Sort by time (HH:mm)
      const [ah, am] = a.split(":").map(Number);
      const [bh, bm] = b.split(":").map(Number);
      return ah !== bh ? ah - bh : am - bm;
    })
    .map((time) => ({ time, count: timeCounts[time] }));

  // Suspicious activity (tab switches/copy attempts)
  const suspiciousData = submissions
    .map((s) => ({
      name: s.name || s.email || s.regno || "User",
      tabSwitches: s.tabSwitchCount ?? 0,
      copyAttempts: s.copyAttemptCount ?? 0,
    }))
    .filter((d) => d.tabSwitches > 0 || d.copyAttempts > 0);

  // Summary stats
  const total = submissions.length;
  const maxScore = total
    ? Math.max(...submissions.map((s) => s.score ?? 0))
    : 0;
  const minScore = total
    ? Math.min(...submissions.map((s) => s.score ?? 0))
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex flex-col items-center py-10 px-2">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center border-2 border-blue-200 relative">
        <button
          onClick={handleBack}
          className="absolute top-4 left-4 text-gray-500 hover:text-gray-800 text-lg font-bold border border-gray-300 rounded px-4 py-1 bg-white cursor-pointer"
        >
          ← Back to Dashboard
        </button>
        <h2 className="text-3xl font-bold text-blue-800 mb-8 mt-2">
          Quiz Data Visualizations
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-10 w-full">
          <div className="bg-blue-50 rounded-lg p-6 text-center">
            <div className="text-3xl font-bold text-blue-700">{total}</div>
            <div className="text-gray-700 mt-2">Total Submissions</div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-6 text-center">
            <div className="text-3xl font-bold text-yellow-700">{maxScore}</div>
            <div className="text-gray-700 mt-2">Highest Score</div>
          </div>
          <div className="bg-red-50 rounded-lg p-6 text-center">
            <div className="text-3xl font-bold text-red-700">{minScore}</div>
            <div className="text-gray-700 mt-2">Lowest Score</div>
          </div>
        </div>
        {/* Score Distribution */}
        <div className="w-full mb-12">
          <h3 className="font-semibold text-lg mb-4 text-blue-800">
            Score Distribution
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart
              data={scoreData}
              margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
            >
              <XAxis
                dataKey="score"
                label={{
                  value: "Score",
                  position: "insideBottom",
                  offset: -5,
                  style: { fontWeight: "bold", fontSize: 16 },
                }}
                tick={{ fontWeight: "bold", fontSize: 14 }}
              />
              <YAxis
                allowDecimals={false}
                label={{
                  value: "Users",
                  angle: -90,
                  position: "insideLeft",
                  style: { fontWeight: "bold", fontSize: 16 },
                }}
                tick={{ fontWeight: "bold", fontSize: 14 }}
              />
              <Tooltip />
              <Bar dataKey="count" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        {/* Submissions Over Time */}
        <div className="w-full mb-12">
          <h3 className="font-semibold text-lg mb-4 text-green-800">
            Submissions Over Time (by Time Only)
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart
              data={timeData}
              margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
            >
              <XAxis
                dataKey="time"
                label={{
                  value: "Time (HH:mm)",
                  position: "insideBottom",
                  offset: -5,
                  style: { fontWeight: "bold", fontSize: 16 },
                }}
                interval={0}
                angle={-30}
                textAnchor="end"
                height={80}
                tick={{ fontWeight: "bold", fontSize: 14 }}
              />
              <YAxis
                allowDecimals={false}
                label={{
                  value: "Submissions",
                  angle: -90,
                  position: "insideLeft",
                  style: {
                    fontWeight: "bold",
                    fontSize: 16,
                    textAnchor: "middle",
                    dominantBaseline: "middle",
                  },
                }}
                tick={{ fontWeight: "bold", fontSize: 14 }}
              />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#82ca9d"
                strokeWidth={3}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        {/* Suspicious Activity */}
        <div className="w-full mb-4">
          <h3 className="font-semibold text-lg mb-4 text-red-800">
            Suspicious Activity (Tab Switches & Copy Attempts)
          </h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart
              data={suspiciousData}
              margin={{ top: 10, right: 40, left: 0, bottom: 30 }}
            >
              <XAxis
                dataKey="name"
                interval={0}
                angle={-30}
                textAnchor="end"
                height={80}
                tick={{ fontWeight: "bold", fontSize: 14 }}
                label={{
                  value: "User",
                  position: "insideBottom",
                  offset: -5,
                  style: { fontWeight: "bold", fontSize: 16 },
                }}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontWeight: "bold", fontSize: 14 }}
                label={{
                  value: "Count",
                  angle: -90,
                  position: "insideLeft",
                  style: { fontWeight: "bold", fontSize: 16 },
                }}
              />
              <Tooltip />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ top: 0, right: 0, fontWeight: "bold" }}
                height={36}
                iconSize={18}
              />
              <Bar dataKey="tabSwitches" fill="#8884d8" name="Tab Switches" />
              <Bar dataKey="copyAttempts" fill="#ff8042" name="Copy Attempts" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AdminVisualizations;
