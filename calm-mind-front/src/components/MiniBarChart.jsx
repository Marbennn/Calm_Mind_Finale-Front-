import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

/**
 * MiniBarChart
 * props:
 *  - data: Array<{ name: string, ...seriesKeys }>
 *  - keys: string[]           // e.g. ["pv", "uv"]
 *  - stacked: boolean         // true = stack bars
 *  - colors: string[]         // same length as keys
 *  - height: number           // px height of the chart area
 *  - loading: boolean
 *  - emptyText: string
 */
export default function MiniBarChart({
  data = [],
  keys = [],
  stacked = false,
  colors = [],
  height = 140,
  loading = false,
  emptyText = "No data",
}) {
  // Loading skeleton
  if (loading) {
    return (
      <div
        className="w-full rounded-xl border border-gray-200 bg-card p- animate-pulse"
        style={{ height }}
      >
        <div className="h-full flex items-end gap-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="w-6 bg-gray-200 rounded" style={{ height: `${30 + (i % 5) * 15}px` }} />
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (!data || !data.length) {
    return (
      <div
        className="w-full grid place-items-center text-sm text-gray-500 border border-gray-200 rounded-xl bg-card"
        style={{ height }}
      >
        {emptyText}
      </div>
    );
  }

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 2, right: 2, left: 2, bottom: 2 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" tickMargin={4} />
          <YAxis width={28} />
          <Tooltip />
          {keys.length > 1 && <Legend />}
          {keys.map((k, i) => (
            <Bar
              key={k}
              dataKey={k}
              stackId={stacked ? "a" : undefined}
              fill={colors[i] || "#8B9A427"}
              radius={[4, 4, 0, 0]}
              maxBarSize={42}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
