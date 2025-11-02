// src/components/analytics/DepartmentPie.jsx
import React from "react";
import Card from "../../components/HoverCard";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

const COLORS = ["#222322", "#B9A427", "#E5DEB7", "#6B7280", "#A78BFA", "#34D399", "#F59E0B"]; 

export default function DepartmentPie({ data = [] }) {
  const total = (data || []).reduce((s, d) => s + (Number(d.value) || 0), 0);
  const has = total > 0;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Students by Department</h2>
        <span className="text-xs text-gray-500">Total: {total}</span>
      </div>
      {has ? (
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={85}>
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-[300px] grid place-items-center">
          <div className="w-full h-full border-2 border-dashed rounded-xl grid place-items-center text-gray-400 text-sm px-4 text-center">
            No department data available.
          </div>
        </div>
      )}
    </Card>
  );
}
