// src/components/analytics/WorkloadVsStress.jsx
import React, { useMemo } from "react";
import Card from "../../components/HoverCard";
import { ResponsiveContainer, ComposedChart, XAxis, YAxis, Tooltip, CartesianGrid, Legend, Bar, Line } from "recharts";

const GOLD = "#B9A427";
const CHAR = "#222322";

function pearson(xs, ys) {
  const n = Math.min(xs.length, ys.length);
  if (n < 2) return 0;
  let sx = 0, sy = 0, sxx = 0, syy = 0, sxy = 0;
  for (let i = 0; i < n; i++) {
    const x = Number(xs[i] || 0), y = Number(ys[i] || 0);
    sx += x; sy += y; sxx += x*x; syy += y*y; sxy += x*y;
  }
  const cov = sxy - (sx * sy) / n;
  const vx = sxx - (sx * sx) / n;
  const vy = syy - (sy * sy) / n;
  const denom = Math.sqrt(vx * vy);
  return denom ? cov / denom : 0;
}

function summarize(data) {
  if (!data.length) return "Add tasks and stress logs to compare workload vs stress.";
  const xs = data.map(d => Number(d.workload || 0));
  const ys = data.map(d => Number(d.stress || 0));
  const r = pearson(xs, ys);

  const maxWork = data.reduce((a,b)=> (b.workload > (a?.workload||0) ? b : a), null);
  const maxStress = data.reduce((a,b)=> (b.stress   > (a?.stress  ||0) ? b : a), null);

  let msg = "";
  if (r >= 0.5) msg = "Workload and stress are moving together — watch your capacity.";
  else if (r <= -0.3) msg = "Workload and stress are inversely related — possible recovery patterns.";
  else msg = "Workload and stress are loosely coupled — check specific spikes.";

  if (maxWork && maxStress) {
    const extra = ` Peak workload: ${maxWork.label} (${maxWork.workload}). Peak stress: ${maxStress.label} (${maxStress.stress}).`;
    msg += extra;
  }
  return msg;
}

export default function WorkloadVsStress({ data }) {
  const has = data.some((d) => (d.workload || 0) > 0 || (d.stress || 0) > 0);
  const insight = useMemo(() => (has ? summarize(data) : "Add tasks and stress logs to compare workload vs stress."), [has, data]);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold">Workload vs Stress</h2>
        <span className="text-xs text-gray-500">Active tasks vs average stress</span>
      </div>
      {has ? (
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis yAxisId="left" allowDecimals={false} />
              <YAxis yAxisId="right" orientation="right" domain={[0, 5]} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-4 rounded-lg shadow-lg border">
                        <p className="font-semibold">{data.label}</p>
                        <p className="text-sm text-gray-600">Active Tasks: {data.workload}</p>
                        <p className="text-sm text-gray-600">Stress Level: {data.stress}</p>
                        {data.stressCause && (
                          <p className="text-sm text-red-500 mt-2">
                            Main stressor: {data.stressCause}
                          </p>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend />
              <Bar yAxisId="left" dataKey="workload" name="Active Tasks" fill={CHAR} radius={[6, 6, 0, 0]} />
              <Line yAxisId="right" type="monotone" dataKey="stress" name="Stress (avg)" stroke={GOLD} strokeWidth={3} dot={{ r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-[320px] grid place-items-center">
          <div className="w-full h-full border-2 border-dashed rounded-xl grid place-items-center text-gray-400 text-sm px-4 text-center">
            No workload/stress data to compare.
          </div>
        </div>
      )}
      <p className="mt-3 text-sm text-gray-500">{insight}</p>
    </Card>
  );
}
