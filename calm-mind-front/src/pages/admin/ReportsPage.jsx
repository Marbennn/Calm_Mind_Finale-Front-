// src/pages/admin/ReportsPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import AdminSidebar from "../../components/admin/AdminSidebar";
import Card from "../../components/HoverCard";
import FilterCard from "../../components/analytics/FilterCard";
import { useAuthStore } from "../../store/authStore";
import { toDate, addDays, fmtYMD, buildPeriods } from "../../utils/dateHelpers";
import { deriveStatus, taskDateYMD } from "../../utils/analyticsData";
import { fetchGlobalAnalytics } from "../../utils/adminAnalytics";
import api from "../../api/client";

export default function ReportsPage() {
  /* ---------- filters ---------- */
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

  const periods = useMemo(
    () => buildPeriods(range.start, range.end, periodMode),
    [range, periodMode]
  );

  /* ---------- data ---------- */
  const { users, fetchAllUsers, serverLogout } = useAuthStore();
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
        // Fetch profiles via admin batch endpoint only
        const list = Array.isArray(users) ? users : [];
        const ids = list.map((u) => u?._id || u?.id || u?.userId).filter(Boolean);
        let map = new Map();
        try {
          if (ids.length) {
            const { data: batch } = await api.post('/admin/profiles/batch', { ids });
            const profiles = Array.isArray(batch?.profiles) ? batch.profiles : [];
            map = new Map(
              profiles
                .map((p) => {
                  const uid = p?.userId?._id || p?.userId || null;
                  if (!uid) return null;
                  return [uid, {
                    department: p.department || "",
                    yearLevel: p.yearLevel || "",
                    studentNumber: p.studentNumber || "",
                    fullName: p.fullName || [p.firstName, p.lastName].filter(Boolean).join(" ")
                  }];
                })
                .filter(Boolean)
            );
          }
        } catch {
          // If batch fails, proceed with empty map; UI will show blanks for missing profiles
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

  /* ---------- rows ---------- */
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
      const prof = profilesMap.get(uid) || {};
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
        const st = deriveStatus(t); // returns 'completed' | 'missing' | 'in_progress' | 'todo'
        const dueRaw = t?.dueDate || t?.due_date || t?.date || null;
        const doneRaw = t?.completedAt || t?.completed_at || null;
        const due = dueRaw ? toDate(String(dueRaw).slice(0,10)) : null;
        const done = doneRaw ? new Date(doneRaw) : null;

        if (st === "completed") {
          if (due && done) {
            if (done <= due) completedOnTime += 1; else overdue += 1;
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
      const totalStress = ustress.reduce((sum, sl) => sum + (Number(sl?.level) || 0), 0);

      r.push({ studentId, name, level, department, totalStress, onTimeRate, overdueRate });
    });

    return r;
  }, [users, tasks, stressLogs, range.start, range.end]);

  /* ---------- export ---------- */
  const onExport = () => {
    const headers = [
      "Student ID","Name","Level","Department","Total Stress","On-time Task Rate","Overdue Task Rate"
    ];
    const lines = [headers.join(",")];
    rows.forEach((r) => {
      const line = [
        r.studentId,
        (r.name || "").toString().replaceAll(","," "),
        r.level || "",
        (r.department || "").toString().replaceAll(","," "),
        r.totalStress ?? 0,
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

  /* ---------- render ---------- */
  return (
    <div className="min-h-screen h-screen">
      <div className="h-full w-full flex">
        <AdminSidebar active={"Reports"} />
        <div className="flex-1 flex flex-col min-h-0">
          {/* Header */}
          <div className="sticky top-0 z-20 bg-transparent">
            <div className="mb-3 mt-2 px-2">
              <Card className="w-full px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3 hover:shadow-none hover:-translate-y-0 hover:bg-inherit cursor-default">
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold tracking-tight">Admin Reports</h1>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={onExport} className="px-3 py-1.5 text-sm rounded-md border border-gray-300 hover:bg-gray-50">Export CSV</button>
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
              groupBy={"None"}
              onChangeGroupBy={() => {}}
            />
          </div>

          {/* Table */}
          <div className="flex-1 overflow-y-auto px-2 pb-24">
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
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Stress</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">On-time Task Rate</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Overdue Task Rate</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {rows.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-4 text-sm text-gray-500 text-center">No data for this period.</td>
                        </tr>
                      ) : (
                        rows.map((r, i) => (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{r.studentId}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{r.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{r.level}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{r.department}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{r.totalStress}</td>
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
    </div>
  );
}
