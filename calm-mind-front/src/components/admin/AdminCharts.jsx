// src/components/admin/AdminCharts.jsx
import React from "react";
import PriorityChart from "../analytics/PriorityChart";
import StatusChart from "../analytics/StatusChart";
import StressOverTime from "../analytics/StressOverTime";
import WorkloadVsStress from "../analytics/WorkloadVsStress";
import StressorPie from "../analytics/StressorPie";
import PredictiveTrend from "../analytics/PredictiveTrend";
import DepartmentPie from "../analytics/DepartmentPie";

/**
 * UI-only wrapper to mirror Analytics page layout.
 * Accepts BOTH old and new props for backward compatibility.
 */
export default function AdminCharts({
  // main datasets
  priorityPieData,
  statusBarData,
  periods,
  stressSeriesByMode,
  workloadVsStress,
  tagsForPie,

  // predictive trend (new signature like Analytics)
  tasks,
  // legacy fallback
  predictiveTrends,

  // optional department data
  deptData,
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <PriorityChart data={priorityPieData} />
      <StatusChart data={statusBarData} />

      {deptData && <DepartmentPie data={deptData} />}
      <StressOverTime periods={periods} series={stressSeriesByMode} />

      <WorkloadVsStress data={workloadVsStress} />
      <StressorPie data={tagsForPie} />

      {/* Prefer the Analytics-style props; keep legacy prop for safety */}
      {tasks && stressSeriesByMode && periods ? (
        <PredictiveTrend tasks={tasks} stressSeries={stressSeriesByMode} periods={periods} />
      ) : (
        <PredictiveTrend data={predictiveTrends} />
      )}
    </div>
  );
}
