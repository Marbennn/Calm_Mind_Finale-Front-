// src/pages/Analytics.jsx
import React, { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";
import Card from "../components/HoverCard";

import PriorityChart from "../components/analytics/PriorityChart";
import StatusChart from "../components/analytics/StatusChart";
import StressOverTime from "../components/analytics/StressOverTime";
import WorkloadVsStress from "../components/analytics/WorkloadVsStress";
import StressorPie from "../components/analytics/StressorPie";
import PredictiveTrend from "../components/analytics/PredictiveTrend";
import KpiCards from "../components/analytics/KpiCards";

import { calculateAverageStressByStatus, calculateDailyStress } from "../utils/stressUtils";

import { buildPeriods, toDate, fmtYMD, addDays } from "../utils/dateHelpers";

import useStressStore from "../store/useStressStore";

/* ------------------------------ palette ----------------------------- */
const COLORS = { gold: "#B9A427", charcoal: "#222322", cardBg: "#1F1F1D" };
const USER_ID = "69008a1fd3c8660f1ff28779";

export default function Analytics() {
  /* ---------- theme ---------- */
  const [theme, setTheme] = useState(
    () => localStorage.getItem("cm-theme") || "light"
  );
  useEffect(() => {
    localStorage.setItem("cm-theme", theme);
    document.documentElement.classList.toggle("cm-dark", theme === "dark");
  }, [theme]);
  const toggleTheme = (forced) =>
    setTheme((prev) =>
      typeof forced === "string" ? forced : prev === "dark" ? "light" : "dark"
    );

  /* ---------- store-sourced data ---------- */
  const { tasks, fetchTasks } = useStressStore();

  useEffect(() => {
    // Ensure tasks are loaded into the store on mount
    fetchTasks();
    const interval = setInterval(fetchTasks, 30000);
    return () => clearInterval(interval);
  }, [fetchTasks]);

  /* ---------- filters ---------- */
  const today = toDate(new Date());
  const defaultStart = addDays(today, -29);

  const [dateFrom, setDateFrom] = useState(
    () => localStorage.getItem("an_from") || fmtYMD(defaultStart)
  );
  const [dateTo, setDateTo] = useState(
    () => localStorage.getItem("an_to") || fmtYMD(today)
  );
  const [periodMode, setPeriodMode] = useState(
    () => localStorage.getItem("an_mode") || "daily"
  );

  useEffect(() => localStorage.setItem("an_from", dateFrom), [dateFrom]);
  useEffect(() => localStorage.setItem("an_to", dateTo), [dateTo]);
  useEffect(() => localStorage.setItem("an_mode", periodMode), [periodMode]);

  const range = useMemo(() => {
    let s = toDate(dateFrom);
    let e = toDate(dateTo);
    if (e < s) [s, e] = [e, s];
    return { start: s, end: e };
  }, [dateFrom, dateTo]);

  const periods = useMemo(
    () => buildPeriods(range.start, range.end, periodMode),
    [range, periodMode]
  );

  /* ---------- data slices ---------- */
  const tasksForSnapshot = useMemo(() => {
    const { start, end } = range;
    const filtered = tasks.filter((t) => {
      const dateStr = t.due_date || t.start_date || "";
      if (!dateStr) return true; // keep undated tasks visible
      const d = toDate(String(dateStr).slice(0, 10));
      return d >= start && d <= end;
    });
    // Fallback: if no tasks in range but there are tasks overall, show all tasks
    return filtered.length === 0 && tasks.length > 0 ? tasks : filtered;
  }, [tasks, range]);

  const tasksForTimeSeries = useMemo(() => {
    const { start, end } = range;
    return tasks.filter((t) => {
      const dateStr = t.due_date || t.start_date || "";
      if (!dateStr) return false; // time series needs a date
      const d = toDate(String(dateStr).slice(0, 10));
      return d >= start && d <= end;
    });
  }, [tasks, range]);

  // (removed stress logs; store-driven analytics and tasks drive charts)

  /* ---------- KPIs ---------- */
  const totals = useMemo(() => {
    const counts = { todo: 0, in_progress: 0, missing: 0, completed: 0 };
    const now = new Date();
    tasks.forEach((t) => {
      if (t.completed) {
        counts.completed++;
        return;
      }
      const due = t.due_date ? new Date(t.due_date) : null;
      const isOverdue = !!(due && due < now);
      if (isOverdue) counts.missing++;
      else if (t.status === "in_progress") counts.in_progress++;
      else counts.todo++;
    });
    return counts;
  }, [tasks]);

  const stressAverages = useMemo(() => {
    const averages = calculateAverageStressByStatus(tasks);
    return {
      todo: averages.todo,
      in_progress: averages.in_progress,
      missing: averages.missing,
      completed: 0,
    };
  }, [tasks]);

  /* ---------- charts data ---------- */
  const priorityPieData = useMemo(() => {
    const counts = { High: 0, Medium: 0, Low: 0 };
    tasksForSnapshot.forEach((t) => {
      const p = t.priority || "Low";
      counts[p] = (counts[p] || 0) + 1;
    });
    return [
      { name: "High", value: counts.High || 0 },
      { name: "Medium", value: counts.Medium || 0 },
      { name: "Low", value: counts.Low || 0 },
    ];
  }, [tasksForSnapshot]);

  const statusBarData = useMemo(() => {
    const base = { "To Do": 0, "In Progress": 0, Missing: 0, Completed: 0 };
    const now = new Date();
    tasksForSnapshot.forEach((t) => {
      if (t.completed) base["Completed"]++;
      else {
        const due = t.due_date ? new Date(t.due_date) : null;
        const overdue = !!(due && due < now);
        if (overdue) base["Missing"]++;
        else if (t.status === "in_progress") base["In Progress"]++;
        else base["To Do"]++;
      }
    });
    return [
      { name: "To Do", value: base["To Do"] },
      { name: "In Progress", value: base["In Progress"] },
      { name: "Missing", value: base["Missing"] },
      { name: "Completed", value: base["Completed"] },
    ];
  }, [tasksForSnapshot]);

  const stressSeriesByMode = useMemo(() => {
    // Build per selected period using due_date in [p.start, p.end]
    return periods.map((p) => {
      const inPeriod = tasksForTimeSeries.filter((t) => {
        if (!t.due_date) return false;
        const d = new Date(t.due_date);
        return d >= p.start && d <= p.end;
      });
      const total = inPeriod.length;
      // average normalized stress using calculateDailyStress from utils
      const { normalized } = calculateDailyStress(inPeriod);
      const value = total > 0 ? normalized : 0;
      return {
        label: p.label,
        stress: Number((value || 0).toFixed(2)),
        count: total,
      };
    });
  }, [periods, tasksForTimeSeries]);

  const workloadVsStressData = useMemo(() => {
    return periods.map((p) => {
      const inPeriod = tasksForTimeSeries.filter((t) => {
        if (!t.due_date) return false;
        const d = new Date(t.due_date);
        return d >= p.start && d <= p.end;
      });
      const active = inPeriod.filter((t) => !t.completed).length;
      const { normalized } = calculateDailyStress(inPeriod);
      const value = inPeriod.length > 0 ? normalized : 0;
      return {
        label: p.label,
        workload: active,
        stress: Number((value || 0).toFixed(2)),
      };
    });
  }, [periods, tasksForTimeSeries]);

  const tagsForPie = useMemo(() => {
    // If there are no tasks in the snapshot range, show no data (keeps charts consistent after deletions)
    if (!tasksForSnapshot || tasksForSnapshot.length === 0) return [];
    const toTags = (v) => {
      if (!v) return [];
      if (Array.isArray(v))
        return v
          .filter(Boolean)
          .map((s) => String(s).trim())
          .filter(Boolean);
      if (typeof v === "string")
        return v
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      return [];
    };
    const tally = new Map();
    tasksForSnapshot.forEach((t) =>
      toTags(t.tags).forEach((tag) => tally.set(tag, (tally.get(tag) || 0) + 1))
    );
    const total = Array.from(tally.values()).reduce((a, b) => a + b, 0);
    return Array.from(tally.entries()).map(([name, value]) => ({
      name,
      value,
      pct: total ? Math.round((value / total) * 100) : 0,
    }));
  }, [tasksForSnapshot]);

  const metrics = useMemo(() => {
    const now = new Date();
    let due48h = 0,
      overdue = 0;
    tasks.forEach((t) => {
      if (!t.completed && t.due_date) {
        const due = new Date(t.due_date);
        const diffMs = due.getTime() - now.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);
        if (diffHours <= 48 && diffHours > 0) due48h++;
        if (due.getTime() < now.getTime()) overdue++;
      }
    });
    return { due48h, overdue };
  }, [tasks]);

  // == Base Points logic ==
  const basePoints = useMemo(() => {
    let pts = 0,
      todayCount = 0;
    const todayIso = fmtYMD(new Date());
    tasks.forEach((t) => {
      if (t.due_date?.startsWith(todayIso)) todayCount++;
      if (t.priority === "High") pts += 3;
      else if (t.priority === "Medium") pts += 2;
      else pts += 1;
    });
    return { pts, todayCount };
  }, [tasks]);
  // == Pattern detection (unfinished tag abuse) ==
  const tagCounts = useMemo(() => {
    const tagTally = {};
    tasks
      .filter((t) => !t.completed)
      .forEach((t) => {
        (t.tags || []).forEach((tag) => {
          tagTally[tag] = (tagTally[tag] || 0) + 1;
        });
      });
    return tagTally;
  }, [tasks]);
  const flaggedStressor = Object.entries(tagCounts).find((entry) => entry[1] > 2); // e.g. more than 2 unfinished
  // == Dynamic text projection ==
  const stressToday = useMemo(() => {
    const todayIso = fmtYMD(new Date());
    const todayTasks = tasks.filter((t) => t.due_date?.startsWith(todayIso));
    const s = todayTasks.length
      ? todayTasks.reduce((a, b) => a + (b.stress || 0), 0)
      : 0;
    return { value: +s.toFixed(2), count: todayTasks.length };
  }, [tasks]);
  const overdueIncrement = useMemo(() => {
    // Project X stress for overdue (each unfinished task overdue today/week)
    const now = new Date();
    let sum = 0,
      count = 0;
    tasks.forEach((t) => {
      if (!t.completed && t.due_date && new Date(t.due_date) < now) {
        sum += 2.0;
        count++;
      }
    });
    return { sum, count };
  }, [tasks]);

  /* ------------------------------ UI ------------------------------- */
  return (
    <div className="min-h-screen h-screen">
      <div className="h-full w-full flex">
        <Sidebar theme={theme} onToggleTheme={toggleTheme} active="Analytics" />
        <div className="flex-1 flex flex-col min-h-0">
          {/* Header (with filters inside) */}
          <div className="sticky top-0 z-20 bg-transparent">
            <div className="mb-3 mt-2 px-2">
              <Card className="w-full px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3 hover:shadow-none hover:-translate-y-0 hover:bg-inherit cursor-default">
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold tracking-tight">
                    Analytics
                  </h1>
                </div>

                {/* Filters moved here */}
                <div className="flex flex-wrap items-end gap-2">
                  <div className="flex flex-col">
                    <label className="text-[11px] text-gray-500 mb-0.5">
                      From
                    </label>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="border rounded-lg px-3 py-2 bg-white/70 dark:bg-white/70"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[11px] text-gray-500 mb-0.5">
                      To
                    </label>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="border rounded-lg px-3 py-2 bg-white/70 dark:bg-white/70"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[11px] text-gray-500 mb-0.5">
                      Period
                    </label>
                    <select
                      value={periodMode}
                      onChange={(e) => setPeriodMode(e.target.value)}
                      className="border rounded-lg px-3 py-2 bg-white/70 dark:bg-white/70"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                </div>

                {/* Tips text */}
                <div className="text-xs text-gray-500 md:ml-4">
                  Tips: Adjust the date range and period to see trends update
                  live.
                </div>
              </Card>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-2 pb-24">
            {/* KPI Cards */}
            <KpiCards
              totals={totals}
              stressAverages={stressAverages}
              colors={COLORS}
              metrics={metrics}
            />

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PriorityChart data={priorityPieData} />
              <StatusChart data={statusBarData} />

              {/* These charts rely on the global Period/From/To */}
              <StressOverTime periods={periods} series={stressSeriesByMode} />
              <WorkloadVsStress data={workloadVsStressData} />

              <StressorPie data={tagsForPie} />
              <PredictiveTrend
                tasks={tasksForTimeSeries}
                stressSeries={stressSeriesByMode}
                periods={periods}
              />
            </div>
            <div className="mt-4 mb-2">
              <div className="text-xs text-gray-700">
                <strong>Analytics Snippet:</strong> Today: {stressToday.value}{" "}
                stress ({stressToday.count} tasks); Week Projection: If
                unfinished, +{overdueIncrement.sum} overdue ={" "}
                {(stressToday.value + overdueIncrement.sum).toFixed(2)} stress (
                {Math.round(
                  ((stressToday.value + overdueIncrement.sum) / 10) * 100
                )}
                %)
                {flaggedStressor && (
                  <span className="ml-4 inline-flex items-center bg-red-50 border border-red-200 text-red-700 px-2 py-1 rounded">
                    ⚠ Possible stressor: {flaggedStressor[0]}
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-400">
                Base Points Today: {basePoints.pts}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
