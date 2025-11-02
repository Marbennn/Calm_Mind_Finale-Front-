// src/components/admin/AdminCharts.jsx
import React from 'react';
import PriorityChart from "../analytics/PriorityChart";
import StatusChart from "../analytics/StatusChart";
import StressOverTime from "../analytics/StressOverTime";
import WorkloadVsStress from "../analytics/WorkloadVsStress";
import StressorPie from "../analytics/StressorPie";
import PredictiveTrend from "../analytics/PredictiveTrend";

export default function AdminCharts({ 
  priorityPieData, 
  statusBarData, 
  periods, 
  stressSeriesByMode, 
  workloadVsStress, 
  tagsForPie, 
  predictiveTrends 
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <PriorityChart data={priorityPieData} />
      <StatusChart data={statusBarData} />
      <StressOverTime periods={periods} series={stressSeriesByMode} />
      <WorkloadVsStress data={workloadVsStress} />
      <StressorPie data={tagsForPie} />
      <PredictiveTrend data={predictiveTrends} />
    </div>
  );
}