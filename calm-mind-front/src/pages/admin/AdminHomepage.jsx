// src/pages/admin/AdminHomepage.temp.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import AdminSidebar from "../../components/admin/AdminSidebar";
import Card from "../../components/HoverCard";
import PriorityChart from "../../components/analytics/PriorityChart";
import StatusChart from "../../components/analytics/StatusChart";
import StressOverTime from "../../components/analytics/StressOverTime";
import WorkloadVsStress from "../../components/analytics/WorkloadVsStress";
import StressorPie from "../../components/analytics/StressorPie";
import PredictiveTrend from "../../components/analytics/PredictiveTrend";
import FilterCard from "../../components/analytics/FilterCard";
import KpiCards from "../../components/analytics/KpiCards";
import DepartmentPie from "../../components/analytics/DepartmentPie";
import { useAuthStore } from "../../store/authStore";

import {
  buildPeriods,
  toDate,
  fmtYMD,
  addDays,
} from "../../utils/dateHelpers";
import { taskDateYMD } from "../../utils/analyticsData";
import {
  fetchGlobalAnalytics,
  getGlobalPriorityDistribution,
  getGlobalStatusCounts,
  calculateGlobalStressLevels,
  calculateGlobalWorkloadStressCorrelation,
  aggregateGlobalStressors,
  calculateGlobalPredictiveTrends
} from "../../utils/adminAnalytics";

const COLORS = { gold: "#B9A427", charcoal: "#222322", cardBg: "#1F1F1D" };

export default function AdminHomepage() {
  const location = useLocation();
  const active = location.pathname === "/admin" ? "Dashboard" : undefined;

  /* ---------- theme ---------- */
  const [theme] = useState(() => localStorage.getItem("cm-theme") || "light");
  useEffect(() => {
    localStorage.setItem("cm-theme", theme);
    document.documentElement.classList.toggle("cm-dark", theme === "dark");
  }, [theme]);

  /* ---------- global filters ---------- */
  const today = toDate(new Date());
  const defaultStart = addDays(today, -29);

  const [dateFrom, setDateFrom] = useState(() => localStorage.getItem("an_from") || fmtYMD(defaultStart));
  const [dateTo, setDateTo] = useState(() => localStorage.getItem("an_to") || fmtYMD(today));
  const [periodMode, setPeriodMode] = useState(() => localStorage.getItem("an_mode") || "monthly");
  const [groupBy, setGroupBy] = useState("None");

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

  /* ---------- Global Analytics Data ---------- */
  const [tasks, setTasks] = useState([]);
  const [stressLogs, setStressLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { users, fetchAllUsers, serverLogout } = useAuthStore();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await fetchGlobalAnalytics({
          start: range.start,
          end: range.end
        });
        if (data) {
          setTasks(data.tasks || []);
          setStressLogs(data.stressLogs || []);
        }
      } catch (error) {
        console.error('Error fetching global analytics:', error);
      }
      setLoading(false);
    };

    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [range.start, range.end]);

  useEffect(() => {
    fetchAllUsers();
  }, [fetchAllUsers]);

  /* ---------- data slices ---------- */
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

  /* ---------- analytics data ---------- */
  const totals = useMemo(() => getGlobalStatusCounts(tasksForSnapshot), [tasksForSnapshot]);
  const priorityPieData = useMemo(() => getGlobalPriorityDistribution(tasksForSnapshot), [tasksForSnapshot]);
  const statusBarData = useMemo(() => {
    const statusCounts = getGlobalStatusCounts(tasksForSnapshot);
    return Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
  }, [tasksForSnapshot]);
  const stressSeriesByMode = useMemo(() => calculateGlobalStressLevels(stressInRange, periods), [stressInRange, periods]);
  const workloadVsStress = useMemo(() => calculateGlobalWorkloadStressCorrelation(tasksForTimeSeries, stressInRange, periods), [tasksForTimeSeries, stressInRange, periods]);
  const tagsForPie = useMemo(() => aggregateGlobalStressors(stressInRange), [stressInRange]);
  // kept for reference; PredictiveTrend component uses tasksForTimeSeries/stressSeriesByMode/periods directly
  const _predictiveTrends = useMemo(() => calculateGlobalPredictiveTrends(tasksForTimeSeries, stressInRange, periods), [tasksForTimeSeries, stressInRange, periods]);

  const deptData = useMemo(() => {
    const counts = {};
    (users || []).forEach((u) => {
      const d = (u && (u.department || (u.profile && u.profile.department))) || "Unknown";
      counts[d] = (counts[d] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [users]);

  /* ---------- render ---------- */
  return (
    <div className="min-h-screen h-screen">
      <div className="h-full w-full flex">
        <AdminSidebar active={active} />
        <div className="flex-1 flex flex-col min-h-0">
          {/* Header */}
          <div className="sticky top-0 z-20 bg-transparent">
            <div className="mb-3 mt-2 px-2">
              <Card className="w-full px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3 hover:shadow-none hover:-translate-y-0 hover:bg-inherit cursor-default">
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard (All Students)</h1>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-xs text-gray-500 md:ml-4">Tips: Adjust the date range and period to see trends update live.</div>
                </div>
              </Card>
            </div>
          </div>

          {/* Filters */}
          <div className="px-2 mb-4">
            <FilterCard
              dateFrom={dateFrom}
              onChangeFrom={setDateFrom}
              dateTo={dateTo}
              onChangeTo={setDateTo}
              periodMode={periodMode}
              onChangeMode={setPeriodMode}
              groupBy={groupBy}
              onChangeGroupBy={setGroupBy}
            />
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-2 pb-24">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
              </div>
            ) : (
              <>
                <KpiCards totals={totals} colors={COLORS} />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <PriorityChart data={priorityPieData} />
                  <StatusChart data={statusBarData} />
                  <DepartmentPie data={deptData} />
                  <StressOverTime periods={periods} series={stressSeriesByMode} />
                  <WorkloadVsStress data={workloadVsStress} />
                  <StressorPie data={tagsForPie} />
                  <PredictiveTrend tasks={tasksForTimeSeries} stressSeries={stressSeriesByMode} periods={periods} />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}