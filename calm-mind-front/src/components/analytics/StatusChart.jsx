// src/components/analytics/StatusChart.jsx
import React, { useMemo } from "react";
import Card from "../../components/HoverCard";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

const GOLD = "#B9A427";

export default function StatusChart({ data }) {
  const has = data.some((d) => d.value > 0);
  const interp = useMemo(() => {
    const total = data.reduce((a, b) => a + b.value, 0);
    if (!total) return "No tasks in this range.";
    const max = [...data].sort((a, b) => b.value - a.value)[0];
    switch (max.name) {
      case "In Progress":
        return "Lots of tasks in progress — great momentum. Try finishing a few to reduce context switching.";
      case "To Do":
        return "Most tasks are still to do. Pick 1–3 to start today and set realistic deadlines.";
      case "Missing":
        return "Several tasks are overdue. Re-prioritize or reschedule them to reduce stress.";
      case "Completed":
        return "Nice work — many tasks completed! Do a quick review to capture learnings.";
      default:
        return "";
    }
  }, [data]);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Task Status Snapshot</h2>
        <span className="text-xs text-gray-500">Counts in current range</span>
      </div>
      {has ? (
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" fill={GOLD} radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-[300px] grid place-items-center">
          <div className="w-full h-full border-2 border-dashed rounded-xl grid place-items-center text-gray-400 text-sm px-4 text-center">
            No status data in this range.
          </div>
        </div>
      )}
      <p className="mt-3 text-sm text-gray-500">{interp}</p>
    </Card>
  );
}
