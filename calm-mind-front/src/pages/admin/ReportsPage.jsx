// src/pages/admin/ReportsPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import AdminSidebar from "../../components/admin/AdminSidebar";
// import Card from "../../components/HoverCard"; // UI switched to match Dashboard header (no logic change)
import { useAuthStore } from "../../store/authStore";
import { toDate, addDays, fmtYMD, buildPeriods } from "../../utils/dateHelpers";
import { deriveStatus, taskDateYMD } from "../../utils/analyticsData";
import { fetchGlobalAnalytics } from "../../utils/adminAnalytics";
import api from "../../api/client";

export default function ReportsPage() {
  /* ---------- filters (unchanged logic) ---------- */
  const today = toDate(new Date());
  const defaultStart = addDays(today, -29);
  const [dateFrom, setDateFrom] = useState(() => localStorage.getItem("an_from") || fmtYMD(defaultStart));
  const [dateTo, setDateTo] = useState(() => localStorage.getItem("an_to") || fmtYMD(today));
  const [periodMode, setPeriodMode] = useState(() => localStorage.getItem("an_mode") || "monthly");

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

  /* ---------- data (unchanged logic) ---------- */
  const { users, fetchAllUsers } = useAuthStore();
  const [tasks, setTasks] = useState([]);
  const [stressLogs, setStressLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profilesMap, setProfilesMap] = useState(new Map());

  useEffect(() => { fetchAllUsers(); }, [fetchAllUsers]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchGlobalAnalytics({ start: range.start, end: range.end });
        setTasks(data?.tasks || []);
        setStressLogs(data?.stressLogs || []);

        // Fetch profiles via admin batch endpoint only (unchanged)
        const list = Array.isArray(users) ? users : [];
        const ids = list.map((u) => u?._id || u?.id || u?.userId).filter(Boolean);
        let map = new Map();
        try {
          if (ids.length) {
            const { data: batch } = await api.post("/admin/profiles/batch", { ids });
            const profiles = Array.isArray(batch?.profiles) ? batch.profiles : [];
            map = new Map(
              profiles
                .map((p) => {
                  const uid = p?.userId?._id || p?.userId || null;
                  if (!uid) return null;
                  return [
                    uid,
                    {
                      department: p.department || "",
                      yearLevel: p.yearLevel || "",
                      studentNumber: p.studentNumber || "",
                      fullName: p.fullName || [p.firstName, p.lastName].filter(Boolean).join(" "),
                      // new: include live stress percentage/level provided by backend
                      stressPercentage: p.stressPercentage ?? p.stressLevel ?? null,
                      stressLevel: p.stressLevel ?? null,
                      stressMetrics: p.stressMetrics || null,
                    },
                  ];
                })
                .filter(Boolean)
            );
          }
        } catch {
          map = new Map();
        }
        setProfilesMap(map);
      } catch (e) {
        console.error("Failed to load analytics for reports", e);
      }
      setLoading(false);
    };
    load();
  }, [range.start, range.end, users]);

  /* ---------- rows (unchanged logic) ---------- */
  const rows = useMemo(() => {
    const toKey = (u) => u?.id || u?._id || u?.userId;
    const usersMap = new Map((users || []).map((u) => [toKey(u), u]));

    const tasksByUser = new Map();
    (tasks || []).forEach((t) => {
      const uid = t?.assignedTo || t?.userId || t?.ownerId;
      if (!uid) return;
      if (!tasksByUser.has(uid)) tasksByUser.set(uid, []);
      tasksByUser.get(uid).push(t);
    });

    const stressByUser = new Map();
    (stressLogs || []).forEach((s) => {
      const uid = s?.userId || s?.ownerId;
      if (!uid) return;
      if (!stressByUser.has(uid)) stressByUser.set(uid, []);
      stressByUser.get(uid).push(s);
    });

    const s = range.start, e = range.end;

  const r = [];
  usersMap.forEach((u, uid) => {
      const name = u?.name || [u?.firstName, u?.lastName].filter(Boolean).join(" ");
  const prof = profilesMap.get(String(uid)) || {};
      const department = prof.department || u?.department || u?.profile?.department || "";
      const level = prof.yearLevel || u?.level || u?.profile?.level || u?.yearLevel || "";
      const studentId = prof.studentNumber || u?.studentId || u?.id || u?._id || uid;

      const utasks = (tasksByUser.get(uid) || []).filter((t) => {
        const ymd = taskDateYMD(t);
        if (!ymd) return false;
        const d = toDate(ymd);
        return d >= s && d <= e;
      });

      let completedOnTime = 0;
      let overdue = 0;
      utasks.forEach((t) => {
        const st = deriveStatus(t); // 'completed' | 'missing' | 'in_progress' | 'todo'
        const dueRaw = t?.dueDate || t?.due_date || t?.date || null;
        const doneRaw = t?.completedAt || t?.completed_at || null;
        const due = dueRaw ? toDate(String(dueRaw).slice(0, 10)) : null;
        const done = doneRaw ? new Date(doneRaw) : null;

        if (st === "completed") {
          if (due && done) {
            if (done <= due) completedOnTime += 1;
            else overdue += 1;
          } else {
            completedOnTime += 1;
          }
        } else if (st === "missing") {
          overdue += 1;
        }
      });
      const totalConsidered = utasks.length || 1;
      const onTimeRate = Math.round((completedOnTime / totalConsidered) * 100);
      const overdueRate = Math.round((overdue / totalConsidered) * 100);

      const ustress = (stressByUser.get(uid) || []).filter((sl) => {
        const d = toDate(sl?.ts || sl?.date);
        return d >= s && d <= e;
      });
      const computedTotalStress = ustress.reduce((sum, sl) => sum + (Number(sl?.level) || 0), 0);
      const totalTasks = utasks.length;

      // Prefer live stress percentage from profile when available
      // If only `stressLevel` (normalized 1-5) is present, convert to percentage
      let liveStressPct = null;
      if (prof?.stressPercentage != null && Number(prof.stressPercentage) > 0) {
        liveStressPct = Number(prof.stressPercentage);
      } else if (prof?.stressLevel != null && Number(prof.stressLevel) > 0) {
        // convert normalized 1-5 to percentage 0-100
        const nl = Number(prof.stressLevel);
        liveStressPct = ((nl - 1) / 4) * 100;
      }

      const totalStressValue = liveStressPct != null ? liveStressPct : computedTotalStress;
      const totalStressDisplay = liveStressPct != null ? `${Math.round(liveStressPct)}%` : String(totalStressValue || 0);

      r.push({ studentId, name, level, department, totalTasks, totalStress: totalStressValue, totalStressDisplay, onTimeRate, overdueRate });
    });

    return r;
  }, [users, tasks, stressLogs, range.start, range.end, profilesMap]);

  /* ---------- export (unchanged logic) ---------- */
  const onExport = () => {
    const headers = [
      "Student ID", "Name", "Level", "Department", "Total Task", "Total Stress", "On-time Task Rate", "Overdue Task Rate",
    ];
    const lines = [headers.join(",")];
    rows.forEach((r) => {
      const line = [
        r.studentId,
        (r.name || "").toString().replaceAll(",", " "),
        r.level || "",
        (r.department || "").toString().replaceAll(",", " "),
        r.totalTasks ?? 0,
        // use formatted display so CSV matches UI (e.g. "42%" or numeric fallback)
        (r.totalStressDisplay ?? String(r.totalStress ?? 0)).toString().replaceAll(",", " "),
        (r.onTimeRate ?? 0) + "%",
        (r.overdueRate ?? 0) + "%",
      ].join(",");
      lines.push(line);
    });
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `admin-report-${fmtYMD(range.start)}-to-${fmtYMD(range.end)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ---------- render (header + filters match Dashboard UI) ---------- */
  return (
    <div className="min-h-screen h-screen overflow-hidden">
      <div className="h-full w-full flex overflow-hidden">
        <AdminSidebar active={"Reports"} />

        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Header — EXACT same shell as Dashboard (no icon buttons) */}
          <div className="col-span-12">
            <div className="h-20 md:h-[80px] w-full px-4 flex items-center justify-between bg-card rounded-xl shadow-md cursor-default mt-2 mx-2">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Admin Reports</h1>

              <div className="flex items-center gap-2">
                <div className="hidden md:block text-xs text-gray-500 mr-2">
                  Tips: Adjust the date range and period to refine the report.
                </div>
                <button
                  onClick={onExport}
                  className="px-4 py-2 rounded-xl bg-black text-amber-400 font-medium hover:bg-black/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
                >
                  Export CSV
                </button>
              </div>
            </div>
          </div>

          {/* Body scroller (same paddings as Dashboard/Analytics) */}
          <div className="an-scroll flex-1 overflow-y-auto overflow-x-hidden px-2 pb-24 pt-2 overscroll-contain">
            {/* Filter toolbar — matches Dashboard UI (no logic changes) */}
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
                      /* filters are reactive; button kept for UX parity */
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

            {/* Table (unchanged logic) */}
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
              </div>
            ) : (
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Level</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Task</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Stress</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">On-time Task Rate</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Overdue Task Rate</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {rows.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-6 py-4 text-sm text-gray-500 text-center">
                            No data for this period.
                          </td>
                        </tr>
                      ) : (
                        rows.map((r, i) => (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{r.studentId}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{r.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{r.level}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{r.department}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{r.totalTasks}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{r.totalStressDisplay ?? (r.totalStress != null ? `${Math.round(r.totalStress)}%` : 0)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{r.onTimeRate}%</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{r.overdueRate}%</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hide scrollbar to match Dashboard/Analytics */}
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
