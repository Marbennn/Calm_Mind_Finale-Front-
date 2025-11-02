// src/components/analytics/PriorityChart.jsx
import React, { useMemo } from "react";
import Card from "../../components/HoverCard";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

const COLORS = ["#222322", "#B9A427", "#E5DEB7"];

export default function PriorityChart({ data }) {
  const has = data.some((d) => d.value > 0);
  const interp = useMemo(() => {
    const total = data.reduce((a, b) => a + b.value, 0);
    if (!total) return "No tasks yet in this range. Add tasks to see your priority mix.";
    const max = [...data].sort((a, b) => b.value - a.value)[0];
    if (max.name === "High")
      return "Most tasks are high priority — workload may be heavy. Consider splitting or delegating.";
    if (max.name === "Medium")
      return "You have a balanced workload with many medium-priority tasks. Time-block to keep momentum.";
    return "Plenty of low-priority tasks — perfect for batching quick wins.";
  }, [data]);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Task Priority Distribution</h2>
        <span className="text-xs text-gray-500">Counts in current range</span>
      </div>
      {has ? (
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={85}>
                {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-[300px] grid place-items-center">
          <div className="w-full h-full border-2 border-dashed rounded-xl grid place-items-center text-gray-400 text-sm px-4 text-center">
            No priority data in this range.
          </div>
        </div>
      )}
      <p className="mt-3 text-sm text-gray-500">{interp}</p>
    </Card>
  );
}
