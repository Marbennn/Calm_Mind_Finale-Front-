// src/pages/Analytics.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import Sidebar from "../components/Sidebar";
import PriorityChart from "../components/analytics/PriorityChart";
import StatusChart from "../components/analytics/StatusChart";
import StressOverTime from "../components/analytics/StressOverTime";
import WorkloadVsStress from "../components/analytics/WorkloadVsStress";
import StressorPie from "../components/analytics/StressorPie";
import PredictiveTrend from "../components/analytics/PredictiveTrend";
// import KpiCards from "../components/analytics/KpiCards"; // ⛔️ removed per request

import { calculateAverageStressByStatus, calculateDailyStress } from "../utils/stressUtils";
import { buildPeriods, toDate, fmtYMD, addDays } from "../utils/dateHelpers";
import useStressStore from "../store/useStressStore";
import api from "../api/client";

/* Matches TaskBoard header chips */
const TASKBOARD_THEME = {
  bg: "bg-black",
  text: "text-amber-400",
  border: "border-amber-400/30",
  dot: "bg-white",
};

/* --------------------------- simple KPI strip ------------------------ */
// Only the KPIs you want (no "Due in 48 hours", no "Overdue")
// Styled to match TaskBoard theme.
function InlineKpis({ totals, stressAverages }) {
  const cards = [
    { label: "To-Do", value: totals.todo },
    { label: "In Progress", value: totals.in_progress },
    { label: "Completed", value: totals.completed },
    {
      label: "Avg Stress (Active)",
      value: Number(((stressAverages.todo + stressAverages.in_progress) / 2).toFixed(2)),
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      {cards.map((c) => (
        <div
          key={c.label}
          className={[
            "rounded-2xl p-4 shadow-sm transition-shadow",
            TASKBOARD_THEME.bg,
            "border",
            TASKBOARD_THEME.border,
            "hover:shadow-lg hover:shadow-amber-400/10",
          ].join(" ")}
        >
          <div className="flex items-center gap-2">
            <span className={["h-2 w-2 rounded-full", TASKBOARD_THEME.dot].join(" ")} />
            <span className={["text-xs font-semibold", TASKBOARD_THEME.text].join(" ")}>
              {c.label}
            </span>
          </div>

          <div className="mt-2 text-3xl font-semibold text-white">{c.value}</div>
        </div>
      ))}
    </div>
  );
}

export default function Analytics() {
  /* ---------- theme ---------- */
  const [theme, setTheme] = useState(() => localStorage.getItem("cm-theme") || "light");
  useEffect(() => {
    localStorage.setItem("cm-theme", theme);
    document.documentElement.classList.toggle("cm-dark", theme === "dark");
  }, [theme]);
  const toggleTheme = (forced) =>
    setTheme((prev) => (typeof forced === "string" ? forced : prev === "dark" ? "light" : "dark"));

  /* ---------- store-sourced data ---------- */
  const { tasks, fetchTasks } = useStressStore();
  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, 30000);
    return () => clearInterval(interval);
  }, [fetchTasks]);

  /* ---------- notifications ---------- */
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      setLoadingNotifs(true);
      const res = await api.get("/notifications");
      setNotifications(res.data || []);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setLoadingNotifs(false);
    }
  };
  const markNotificationAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const id = setInterval(fetchNotifications, 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  /* ---------- filters ---------- */
  const today = toDate(new Date());
  const defaultStart = addDays(today, -29);

  const [dateFrom, setDateFrom] = useState(() => localStorage.getItem("an_from") || fmtYMD(defaultStart));
  const [dateTo, setDateTo] = useState(() => localStorage.getItem("an_to") || fmtYMD(today));
  const [periodMode, setPeriodMode] = useState(() => localStorage.getItem("an_mode") || "daily");

  useEffect(() => localStorage.setItem("an_from", dateFrom), [dateFrom]);
  useEffect(() => localStorage.setItem("an_to", dateTo), [dateTo]);
  useEffect(() => localStorage.setItem("an_mode", periodMode), [periodMode]);

  const range = useMemo(() => {
    let s = toDate(dateFrom);
    let e = toDate(dateTo);
    if (e < s) [s, e] = [e, s];
    return { start: s, end: e };
  }, [dateFrom, dateTo]);

  const periods = useMemo(() => buildPeriods(range.start, range.end, periodMode), [range, periodMode]);

  /* ---------- data slices ---------- */
  const tasksForSnapshot = useMemo(() => {
    const { start, end } = range;
    const filtered = tasks.filter((t) => {
      const dateStr = t.due_date || t.start_date || "";
      if (!dateStr) return true; // keep undated tasks visible
      const d = toDate(String(dateStr).slice(0, 10));
      return d >= start && d <= end;
    });
    return filtered.length === 0 && tasks.length > 0 ? tasks : filtered;
  }, [tasks, range]);

  const tasksForTimeSeries = useMemo(() => {
    const { start, end } = range;
    return tasks.filter((t) => {
      const dateStr = t.due_date || t.start_date || "";
      if (!dateStr) return false;
      const d = toDate(String(dateStr).slice(0, 10));
      return d >= start && d <= end;
    });
  }, [tasks, range]);

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
    return { todo: averages.todo, in_progress: averages.in_progress, missing: averages.missing, completed: 0 };
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
    return periods.map((p) => {
      const inPeriod = tasksForTimeSeries.filter((t) => {
        if (!t.due_date) return false;
        const d = new Date(t.due_date);
        return d >= p.start && d <= p.end;
      });
      const total = inPeriod.length;
      const { normalized } = calculateDailyStress(inPeriod);
      const value = total > 0 ? normalized : 0;
      return { label: p.label, stress: Number((value || 0).toFixed(2)), count: total };
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
      return { label: p.label, workload: active, stress: Number((value || 0).toFixed(2)) };
    });
  }, [periods, tasksForTimeSeries]);

  const tagsForPie = useMemo(() => {
    if (!tasksForSnapshot || tasksForSnapshot.length === 0) return [];
    const toTags = (v) => {
      if (!v) return [];
      if (Array.isArray(v)) return v.filter(Boolean).map((s) => String(s).trim()).filter(Boolean);
      if (typeof v === "string") return v.split(",").map((s) => s.trim()).filter(Boolean);
      return [];
    };
    const tally = new Map();
    tasksForSnapshot.forEach((t) => toTags(t.tags).forEach((tag) => tally.set(tag, (tally.get(tag) || 0) + 1)));
    const total = Array.from(tally.values()).reduce((a, b) => a + b, 0);
    return Array.from(tally.entries()).map(([name, value]) => ({
      name,
      value,
      pct: total ? Math.round((value / total) * 100) : 0,
    }));
  }, [tasksForSnapshot]);

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
  const flaggedStressor = Object.entries(tagCounts).find((entry) => entry[1] > 2);

  const stressToday = useMemo(() => {
    const todayIso = fmtYMD(new Date());
    const todayTasks = tasks.filter((t) => t.due_date?.startsWith(todayIso));
    const s = todayTasks.length ? todayTasks.reduce((a, b) => a + (b.stress || 0), 0) : 0;
    return { value: +s.toFixed(2), count: todayTasks.length };
  }, [tasks]);

  const overdueIncrement = useMemo(() => {
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
    <div className="min-h-screen h-screen overflow-hidden">
      <div className="h-full w-full flex overflow-hidden">
        <Sidebar theme={theme} onToggleTheme={toggleTheme} active="Analytics" />

        {/* Right column */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Header */}
          <div className="col-span-12">
            <div className="h-20 md:h-[80px] w-full px-4 flex items-center justify-between bg-card rounded-xl shadow-md cursor-default mt-2 mx-2">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Analytics</h1>

              <div className="flex items-center gap-2">
                {/* Notifications (calendar icon removed) */}
                <div className="relative" ref={notifRef}>
                  <button
                    className="relative h-12 w-12 grid place-items-center rounded-full bg-card border border-gray-200 shadow-sm"
                    onClick={() => {
                      fetchNotifications();
                      setShowNotifications((s) => !s);
                    }}
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </button>

                  {showNotifications && (
                    <div className="absolute top-full right-0 mt-2 w-80 bg-card rounded-xl shadow-xl border border-gray-200 z-50 p-4 max-h-96 overflow-y-auto">
                      <div className="flex items-start justify-between mb-3">
                        <h2 className="text-xl font-medium tracking-tight text-primary">Notifications</h2>
                        <button className="text-sm text-accent underline hover:opacity-80" onClick={fetchNotifications}>
                          Refresh
                        </button>
                      </div>
                      {loadingNotifs ? (
                        <p className="text-gray-500 text-sm">Loading notifications...</p>
                      ) : notifications.length === 0 ? (
                        <div className="mt-2 text-gray-500 text-sm">You have no notifications.</div>
                      ) : (
                        <ul className="space-y-2">
                          {notifications.map((n) => (
                            <li
                              key={n._id}
                              className={`p-3 rounded-lg border ${
                                n.read
                                  ? "bg-white text-gray-600 border-gray-100"
                                  : "bg-yellow-50 text-gray-800 border-yellow-200"
                              }`}
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="font-medium">{n.message}</div>
                                  <div className="text-xs text-gray-400 mt-1">
                                    {new Date(n.created_at).toLocaleString()}
                                  </div>
                                </div>
                                {!n.read && (
                                  <button
                                    onClick={() => markNotificationAsRead(n._id)}
                                    className="text-xs text-accent hover:underline"
                                  >
                                    Mark read
                                  </button>
                                )}
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>

                {/* Profile placeholder for symmetry */}
                <button className="h-12 w-12 grid place-items-center rounded-full bg-card border border-gray-200 shadow-sm">
                  <span className="text-base">👤</span>
                </button>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="an-scroll flex-1 overflow-y-auto overflow-x-hidden px-2 pb-24 pt-2 overscroll-contain">
            {/* Filter toolbar */}
            <div className="w-full mb-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {/* From */}
                <div className="flex flex-col">
                  <label className="text-[11px] text-gray-500 mb-1">From</label>
                  <input
                    type="date"
                    value={dateFrom}
                    max={dateTo || undefined}
                    onChange={(e) => e.target.value && setDateFrom(e.target.value)}
                    className="rounded-xl border border-gray-200 bg-white/70 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>

                {/* To */}
                <div className="flex flex-col">
                  <label className="text-[11px] text-gray-500 mb-1">To</label>
                  <input
                    type="date"
                    value={dateTo}
                    min={dateFrom || undefined}
                    onChange={(e) => e.target.value && setDateTo(e.target.value)}
                    className="rounded-xl border border-gray-200 bg-white/70 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>

                {/* Period */}
                <div className="flex flex-col">
                  <label className="text-[11px] text-gray-500 mb-1">Period</label>
                  <select
                    value={periodMode}
                    onChange={(e) => setPeriodMode(e.target.value)}
                    className="rounded-xl border border-gray-200 bg-white/70 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>

                {/* Quick actions */}
                <div className="flex items-end gap-2">
                  <button
                    type="button"
                    className="px-4 py-2 rounded-xl bg-black text-amber-400 font-medium hover:bg-black/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
                    onClick={() => {
                      /* filters are reactive; button kept for UX */
                    }}
                  >
                    Apply
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50"
                    onClick={() => {
                      const defFrom = fmtYMD(addDays(toDate(new Date()), -29));
                      const defTo = fmtYMD(toDate(new Date()));
                      setDateFrom(defFrom);
                      setDateTo(defTo);
                      setPeriodMode("daily");
                    }}
                  >
                    Reset
                  </button>
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-500">Use the date inputs to update the range.</div>
            </div>

            {/* KPI Strip (no “Due in 48 hours / Overdue”) */}
            <InlineKpis totals={totals} stressAverages={stressAverages} />

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PriorityChart data={priorityPieData} />
              <StatusChart data={statusBarData} />

              <StressOverTime periods={periods} series={stressSeriesByMode} />
              <WorkloadVsStress data={workloadVsStressData} />

              <StressorPie data={tagsForPie} />
              <PredictiveTrend tasks={tasksForTimeSeries} stressSeries={stressSeriesByMode} periods={periods} />
            </div>

            {/* Snippet */}
            <div className="mt-4 mb-2">
              <div className="text-xs text-gray-700">
                <strong>Analytics Snippet:</strong> Today: {stressToday.value} stress ({stressToday.count} tasks); Week
                Projection: If unfinished, +{overdueIncrement.sum} overdue ={" "}
                {(stressToday.value + overdueIncrement.sum).toFixed(2)} stress (
                {Math.round(((stressToday.value + overdueIncrement.sum) / 10) * 100)}%)
                {flaggedStressor && (
                  <span className="ml-4 inline-flex items-center bg-red-50 border border-red-200 text-red-700 px-2 py-1 rounded">
                    ⚠ Possible stressor: {flaggedStressor[0]}
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-400">Base Points Today: {basePoints.pts}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Hide scrollbar for the body scroller only */}
      <style>{`
        .an-scroll { 
          scrollbar-width: none;
        }
        .an-scroll::-webkit-scrollbar {
          width: 0; height: 0;
        }
      `}</style>
    </div>
  );
}
