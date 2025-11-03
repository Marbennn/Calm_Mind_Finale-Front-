// src/pages/admin/AdminHomepage.temp.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import AdminSidebar from "../../components/admin/AdminSidebar";
import PriorityChart from "../../components/analytics/PriorityChart";
import StatusChart from "../../components/analytics/StatusChart";
import StressOverTime from "../../components/analytics/StressOverTime";
import WorkloadVsStress from "../../components/analytics/WorkloadVsStress";
import StressorPie from "../../components/analytics/StressorPie";
import PredictiveTrend from "../../components/analytics/PredictiveTrend";
import DepartmentPie from "../../components/analytics/DepartmentPie";
import { fetchStudentsByDepartment } from "../../api/admin";

import { buildPeriods, toDate, fmtYMD, addDays } from "../../utils/dateHelpers";
import { taskDateYMD } from "../../utils/analyticsData";
import {
  fetchGlobalAnalytics,
  getGlobalPriorityDistribution,
  getGlobalStatusCounts,
  calculateGlobalStressLevels,
  calculateGlobalWorkloadStressCorrelation,
  aggregateGlobalStressors,
  calculateGlobalPredictiveTrends,
} from "../../utils/adminAnalytics";
import { calculateAverageStressByStatus } from "../../utils/stressUtils";

/* ---------- Matches Analytics page KPI strip styling ---------- */
const TASKBOARD_THEME = {
  bg: "bg-black",
  text: "text-amber-400",
  border: "border-amber-400/30",
  dot: "bg-white",
};

function InlineKpis({ totals, stressAverages }) {
  const cards = [
    { label: "To-Do", value: totals.todo || 0 },
    { label: "In Progress", value: totals.in_progress || 0 },
    { label: "Completed", value: totals.completed || 0 },
    {
      label: "Avg Stress (Active)",
      value: Number(
        (
          ((stressAverages?.todo || 0) + (stressAverages?.in_progress || 0)) /
          2
        ).toFixed(2)
      ),
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

const COLORS = { gold: "#B9A427", charcoal: "#222322", cardBg: "#1F1F1D" };

export default function AdminHomepage() {
  const location = useLocation();
  const active = location.pathname === "/admin" ? "Dashboard" : undefined;

  /* ---------- theme (unchanged logic) ---------- */
  const [theme] = useState(() => localStorage.getItem("cm-theme") || "light");
  useEffect(() => {
    localStorage.setItem("cm-theme", theme);
    document.documentElement.classList.toggle("cm-dark", theme === "dark");
  }, [theme]);

  /* ---------- global filters (same state/logic as before) ---------- */
  const today = toDate(new Date());
  const defaultStart = addDays(today, -29);

  const [dateFrom, setDateFrom] = useState(
    () => localStorage.getItem("an_from") || fmtYMD(defaultStart)
  );
  const [dateTo, setDateTo] = useState(
    () => localStorage.getItem("an_to") || fmtYMD(today)
  );
  const [periodMode, setPeriodMode] = useState(
    () => localStorage.getItem("an_mode") || "monthly"
  );
  const [groupBy, setGroupBy] = useState("None"); // kept for compatibility

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

  /* ---------- Global Analytics Data (unchanged logic) ---------- */
  const [tasks, setTasks] = useState([]);
  const [stressLogs, setStressLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await fetchGlobalAnalytics({
          start: range.start,
          end: range.end,
        });
        if (data) {
          setTasks(data.tasks || []);
          setStressLogs(data.stressLogs || []);
        }
      } catch (error) {
        console.error("Error fetching global analytics:", error);
      }
      setLoading(false);
    };

    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [range.start, range.end]);

  /* ---------- data slices (unchanged logic) ---------- */
  const tasksForSnapshot = useMemo(() => {
    const { start, end } = range;
    return tasks.filter((t) => {
      const ymd = taskDateYMD(t);
      if (!ymd) return true;
      const d = toDate(ymd);
      return d >= start && d <= end;
    });
  }, [tasks, range]);

  const tasksForTimeSeries = useMemo(() => {
    const { start, end } = range;
    return tasks.filter((t) => {
      const ymd = taskDateYMD(t);
      if (!ymd) return false;
      const d = toDate(ymd);
      return d >= start && d <= end;
    });
  }, [tasks, range]);

  const stressInRange = useMemo(() => {
    const { start, end } = range;
    return stressLogs.filter((s) => {
      const d = toDate(s.ts || s.date);
      return d >= start && d <= end;
    });
  }, [stressLogs, range]);

  /* ---------- analytics data (unchanged logic) ---------- */
  const totals = useMemo(
    () => getGlobalStatusCounts(tasksForSnapshot),
    [tasksForSnapshot]
  );
  const priorityPieData = useMemo(
    () => getGlobalPriorityDistribution(tasksForSnapshot),
    [tasksForSnapshot]
  );
  const statusBarData = useMemo(() => {
    const statusCounts = getGlobalStatusCounts(tasksForSnapshot);
    return Object.entries(statusCounts).map(([name, value]) => ({
      name,
      value,
    }));
  }, [tasksForSnapshot]);

  const stressSeriesByMode = useMemo(
    () => calculateGlobalStressLevels(stressInRange, periods),
    [stressInRange, periods]
  );

  const workloadVsStress = useMemo(
    () =>
      calculateGlobalWorkloadStressCorrelation(
        tasksForTimeSeries,
        stressInRange,
        periods
      ),
    [tasksForTimeSeries, stressInRange, periods]
  );

  const tagsForPie = useMemo(
    () => aggregateGlobalStressors(stressInRange),
    [stressInRange]
  );

  // (PredictiveTrend internal)
  const _predictiveTrends = useMemo(
    () =>
      calculateGlobalPredictiveTrends(
        tasksForTimeSeries,
        stressInRange,
        periods
      ),
    [tasksForTimeSeries, stressInRange, periods]
  );

  const stressAverages = useMemo(() => {
    const averages = calculateAverageStressByStatus(tasks);
    return {
      todo: averages.todo || 0,
      in_progress: averages.in_progress || 0,
      missing: averages.missing || 0,
      completed: 0,
    };
  }, [tasks]);

  /* ---------- department pie data ---------- */
  const [deptData, setDeptData] = useState([]);

  useEffect(() => {
    const fetchDeptData = async () => {
      try {
        const data = await fetchStudentsByDepartment();
        if (data?.labels && data?.datasets?.[0]?.data) {
          setDeptData(
            data.labels.map((label, index) => ({
              name: label,
              value: data.datasets[0].data[index]
            }))
          );
        }
      } catch (error) {
        console.error('Error fetching department data:', error);
      }
    };

    fetchDeptData();
    // Refresh every 5 minutes
    const interval = setInterval(fetchDeptData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  /* ---------- UI (MATCHES Analytics page; header has NO icon buttons) ---------- */
  return (
    <div className="min-h-screen h-screen overflow-hidden">
      <div className="h-full w-full flex overflow-hidden">
        <AdminSidebar active={active} />

        {/* Right column */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Header (same shell as Analytics, without the two icon buttons) */}
          <div className="col-span-12">
            <div className="h-20 md:h-[80px] w-full px-4 flex items-center justify-between bg-card rounded-xl shadow-md cursor-default mt-2 mx-2">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                Admin Dashboard (All Students)
              </h1>
              <div className="hidden md:block text-xs text-gray-500">
                Tips: Adjust the date range and period to see trends update live.
              </div>
            </div>
          </div>

          {/* Body (identical spacing/scroll to Analytics) */}
          <div className="an-scroll flex-1 overflow-y-auto overflow-x-hidden px-2 pb-24 pt-2 overscroll-contain">
            {/* Filter toolbar — copied from Analytics (no logic changes) */}
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

            {/* KPI Strip — same look as Analytics */}
            <InlineKpis totals={totals} stressAverages={stressAverages} />

            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
              </div>
            ) : (
              <>
                {/* Charts grid — exact grid as Analytics (plus DepartmentPie) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <PriorityChart data={priorityPieData} />
                  <StatusChart data={statusBarData} />

                  <DepartmentPie data={deptData} />
                  <StressOverTime periods={periods} series={stressSeriesByMode} />

                  <WorkloadVsStress data={workloadVsStress} />
                  <StressorPie data={tagsForPie} />

                  <PredictiveTrend
                    tasks={tasksForTimeSeries}
                    stressSeries={stressSeriesByMode}
                    periods={periods}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Hide scrollbar for this page scroller only (same as Analytics) */}
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
