// src/components/analytics/KpiCards.jsx
import React from "react";

export default function KpiCards({
  totals = {},
  stressAverages = {},
  colors = {},
  metrics = {}, // ← UPDATE: New prop for 48h & overdue
}) {
  const items = [
    {
      label: "To Do",
      value: totals.todo || 0,
      stress: stressAverages.todo || 0,
    },
    {
      label: "In Progress",
      value: totals.in_progress || 0,
      stress: stressAverages.in_progress || 0,
    },
    {
      label: "Missing",
      value: totals.missing || 0,
      stress: stressAverages.missing || 0,
    },
    { label: "Completed", value: totals.completed || 0, stress: 0 },
  ];

  const getStressColor = (stress) => {
    if (stress >= 75) return "text-red-500";
    if (stress >= 50) return "text-yellow-500";
    return "text-green-500";
  };

  return (
    <div
      className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-4"
      style={{ minHeight: "150px" }}
    >
      {/* ← UPDATE: 6-column grid for new cards */}

      {items.map((m) => (
        <div
          key={m.label}
          className="rounded-2xl p-6 shadow-sm"
          style={{ background: colors?.cardBg || "#2a2a2a", color: "#fff" }}
        >
          <div className="text-sm text-gray-300">{m.label}</div>
          <div
            className="text-4xl font-extrabold mt-2"
            style={{ color: colors?.gold || "#ffd700" }}
          >
            {m.value}
          </div>
          {m.label !== "Completed" && (
            <div className={`text-sm mt-2 ${getStressColor(m.stress)}`}>
              Avg Stress: {m.stress}%{m.stress >= 75 && " (warning)"}
            </div>
          )}
        </div>
      ))}

      {/* ← UPDATE: 48h Due Card */}
      <div className="rounded-2xl p-6 shadow-sm bg-yellow-50 border border-yellow-200">
        <div className="text-sm text-yellow-700 font-medium">Due in 48h</div>
        <div className="text-4xl font-extrabold mt-2 text-yellow-800">
          {metrics.due48h || 0}
        </div>
        <div className="text-xs text-yellow-600 mt-1">Urgent</div>
      </div>

      {/* ← UPDATE: Overdue Card */}
      <div className="rounded-2xl p-6 shadow-sm bg-red-50 border border-red-200">
        <div className="text-sm text-red-700 font-medium">Overdue</div>
        <div className="text-4xl font-extrabold mt-2 text-red-800">
          {metrics.overdue || 0}
        </div>
        <div className="text-xs text-red-600 mt-1">Critical</div>
      </div>
    </div>
  );
}
