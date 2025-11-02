import React from "react";
import Card from "../../components/HoverCard";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

const COLORS = ["#222322", "#B9A427", "#E5DEB7", "#6B7280", "#F59E0B", "#64748B", "#A78BFA", "#34D399"];

export default function StressorPie({ data }) {
  const has = data && data.length > 0 && data.some(d => d.value > 0);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Stressor Distribution</h2>
        <span className="text-xs text-gray-500">Percent by tag</span>
      </div>
      {has ? (
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={1}>
                {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v, n, p) => [`${v} (${p.payload.pct}%)`, n]} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-[300px] grid place-items-center">
          <div className="w-full h-full border-2 border-dashed rounded-xl grid place-items-center text-gray-400 text-sm px-4 text-center">
            No stress tags in this range.
          </div>
        </div>
      )}
      <p className="mt-3 text-sm text-gray-500">
        {has
          ? "This shows which stressors come up most often. Reduce the largest category first."
          : "Add stress logs with tags to see your stressor mix."}
      </p>
    </Card>
  );
}
