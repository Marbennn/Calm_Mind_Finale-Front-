// src/pages/TaskManagement.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Plus, Kanban, Table, X } from "lucide-react";
import Sidebar from "../components/Sidebar";
import TaskBoard from "../components/TaskBoard";
// Removed: import TaskListView from "../components/TaskListView";
import TaskTableView from "../components/TaskTableView";
import TaskForm from "../components/TaskForm";
import TaskOverview from "../components/TaskOverview";
import KebabMenu from "../components/KebabMenu";
import useStressStore from "../store/useStressStore";
import { generateOverallRecommendations } from "../utils/stressUtils";
import api from "../api/client";

const USER_ID = "69008a1fd3c8660f1ff28779";

export default function TaskManagement() {
  /* ---------- Theme ---------- */
  const [theme, setTheme] = useState(
    () => localStorage.getItem("cm-theme") || "light"
  );
  useEffect(() => {
    localStorage.setItem("cm-theme", theme);
    document.documentElement.classList.toggle("cm-dark", theme === "dark");
  }, [theme]);
  const toggleTheme = () =>
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));

  /* ---------- Stress Store ---------- */
  const {
    tasks,
    loading,
    fetchTasks,
    addTask: createTask,
    updateTask,
    deleteTask,
    deleteAllTasks: deleteAll,
    getTaskStress,
    getDailyStressSummary,
  } = useStressStore();

  /* ---------- Local State ---------- */
  const [view, setView] = useState("board");

  // Summary visibility
  const [showSidebar] = useState(true);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [isSummaryVisible, setIsSummaryVisible] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [viewTaskId, setViewTaskId] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "Medium",
    status: "todo",
    startDate: "",
    dueDate: "",
    tags: [],
  });
  const [formError, setFormError] = useState("");

  /* ---------- Notifications ---------- */
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

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
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, 30000);
    return () => clearInterval(interval);
  }, [fetchTasks]);

  useEffect(() => {
    fetchNotifications();
    const id = setInterval(fetchNotifications, 60_000);
    return () => clearInterval(id);
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  /* ---------- Derived State & Analytics ---------- */
  const dailyStress = getDailyStressSummary();
  const activeCount = tasks.filter((t) => !t.completed).length;

  const overallTips = useMemo(
    () => generateOverallRecommendations(tasks, dailyStress),
    [tasks, dailyStress]
  );

  /* ---------- Board helpers ---------- */
  const deriveStatus = useCallback((task) => {
    if (!task) return "todo";
    if (task.completed || task.status === "completed") return "completed";
    const due = task.due_date ? new Date(task.due_date) : null;
    if (due && due < new Date()) return "missing";
    if (task.status === "in_progress") return "in_progress";
    return "todo";
  }, []);

  const columns = useMemo(
    () => [
      { status: "todo", title: "To Do" },
      { status: "in_progress", title: "In Progress" },
      { status: "missing", title: "Missing" },
      { status: "completed", title: "Completed" },
    ],
    []
  );

  const tasksByStatus = useMemo(() => {
    const grouped = { todo: [], in_progress: [], missing: [], completed: [] };
    tasks.forEach((t) => {
      const key = deriveStatus(t);
      grouped[key].push(t);
    });
    return grouped;
  }, [tasks, deriveStatus]);

  const taskStresses = useMemo(() => {
    const map = {};
    tasks.forEach((task) => {
      map[task.id] = Math.round(getTaskStress(task.id) * 100);
    });
    return map;
  }, [tasks, getTaskStress]);

  const taskStressList = useMemo(() => {
    return tasks
      .filter((t) => !t.completed)
      .map((t) => ({
        id: t.id,
        title: t.title || "Untitled",
        percent: Math.round(getTaskStress(t.id) * 100),
      }))
      .sort((a, b) => b.percent - a.percent);
  }, [tasks, getTaskStress]);

  const topTags = useMemo(() => {
    const counts = new Map();
    tasks.forEach((t) => {
      if (t.completed) return;
      (t.tags || []).forEach((tag) =>
        counts.set(tag, (counts.get(tag) || 0) + 1)
      );
    });
    const sorted = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
    const a = sorted[0]?.[0] || "(no tags)";
    const b = sorted[1]?.[0] || "(no tags)";
    return [a, b];
  }, [tasks]);

  const onAddTask = (defaultStatus = "todo") => {
    setEditingTask(null);
    setEditingTaskId(null);
    setFormData({
      id: null,
      title: "",
      description: "",
      priority: "Medium",
      status: defaultStatus,
      startDate: "",
      dueDate: new Date().toISOString().slice(0, 10),
      tags: [],
    });
    setShowForm(true);
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    await updateTask(taskId, { status: newStatus });
  };

  const completeTask = async (taskId) => {
    await updateTask(taskId, { status: "completed" });
  };

  /* ---------- Form & Overview ---------- */
  const openForm = (task = null) => {
    setEditingTask(task);
    setEditingTaskId(task?.id || task?._id || null);
    if (task) {
      const formatDate = (dateStr) => {
        if (!dateStr) return "";
        const d = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
        return isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
      };
      setFormData({
        id: task.id || task._id,
        title: task.title || "",
        description: task.description || "",
        priority: task.priority || "Medium",
        status: task.status || "todo",
        startDate: formatDate(task.startDate || task.start_date),
        dueDate:
          formatDate(task.dueDate || task.due_date) ||
          new Date().toISOString().slice(0, 10),
        tags: task.tags || [],
      });
    } else {
      setFormData({
        id: null,
        title: "",
        description: "",
        priority: "Medium",
        status: "todo",
        startDate: "",
        dueDate: new Date().toISOString().slice(0, 10),
        tags: [],
      });
    }
    setShowForm(true);
  };

  const closeForm = () => {
    setEditingTask(null);
    setEditingTaskId(null);
    setShowForm(false);
  };

  const viewingTask = useMemo(
    () => tasks.find((t) => t.id === viewTaskId) || null,
    [tasks, viewTaskId]
  );
  const openOverview = (task) => setViewTaskId(task?.id);
  const closeOverview = () => setViewTaskId(null);

  const statusPercents = useMemo(() => {
    const byStatus = tasks.reduce((acc, task) => {
      const status = deriveStatus(task);
      if (!acc[status]) acc[status] = [];
      acc[status].push(getTaskStress(task.id));
      return acc;
    }, {});

    return {
      todo: Math.round(
        (((byStatus.todo || []).reduce((a, b) => a + b, 0) /
          (byStatus.todo?.length || 1)) *
          100) || 0
      ),
      in_progress: Math.round(
        (((byStatus.in_progress || []).reduce((a, b) => a + b, 0) /
          (byStatus.in_progress?.length || 1)) *
          100) || 0
      ),
      missing: Math.round(
        (((byStatus.missing || []).reduce((a, b) => a + b, 0) /
          (byStatus.missing?.length || 1)) *
          100) || 0
      ),
    };
  }, [tasks, getTaskStress, deriveStatus]);

  const stressPct = Math.round(dailyStress.average * 100);
  const stressColor =
    dailyStress.average < 0.5
      ? "#fcd34d"
      : dailyStress.average < 0.75
      ? "#f59e0b"
      : "#111827";

  /* ---------- Render ---------- */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xl">
        Loading tasks...
      </div>
    );
  }

  return (
    <div className="min-h-screen h-screen flex overflow-hidden mb-4">
      <Sidebar active="Task Management" />

      {/* hidden scrollbar utility + stop scroll chaining */}
      <style>{`
        .cm-scroll { overflow-y: auto; -ms-overflow-style: none; scrollbar-width: none; overscroll-behavior: contain; }
        .cm-scroll::-webkit-scrollbar { display: none; }
      `}</style>

      <div className="flex-1 flex flex-col min-h-0 px-2 pt-2 pb-4 overflow-hidden">
        {/* ===== Header ===== */}
        <div className="h-20 md:h-[80px] w-full px-4 flex items-center justify-between bg-card rounded-xl shadow-md cursor-default">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Task Management
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {/* Mobile: open Summary drawer */}
            <button
              className="block lg:hidden relative h-12 w-12 grid place-items-center rounded-full bg-card border border-gray-200 shadow-sm"
              onClick={() => setIsSummaryOpen(true)}
              aria-label="Open summary"
            >
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M3 6h18M3 12h12M3 18h18" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {/* Notifications */}
            <div className="relative">
              <button
                className="relative h-12 w-12 grid place-items-center rounded-full bg-card border border-gray-200 shadow-sm"
                onClick={() => {
                  setIsNotifOpen((prev) => !prev);
                  fetchNotifications();
                }}
                aria-label="Toggle notifications"
              >
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
              {isNotifOpen && (
                <div className="absolute right-0 top-14 w-80 bg-card rounded-xl shadow-xl overflow-hidden z-50 max-h-96">
                  {loadingNotifs ? (
                    <p className="p-4 text-gray-500 text-sm">
                      Loading notifications...
                    </p>
                  ) : notifications.length === 0 ? (
                    <p className="p-4 text-gray-500 text-sm">
                      You have no notifications.
                    </p>
                  ) : (
                    <ul className="overflow-y-auto max-h-80">
                      {notifications.map((n) => (
                        <li
                          key={n._id}
                          className={`p-4 border-b border-gray-100 last:border-0 ${
                            n.read
                              ? "bg-white text-gray-600"
                              : "bg-yellow-50 text-gray-800"
                          }`}
                        >
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex-1">
                              <div className="font-medium text-sm">
                                {n.message}
                              </div>
                              <div className="text-xs text-gray-400 mt-1">
                                {new Date(n.created_at).toLocaleString()}
                              </div>
                            </div>
                            {!n.read && (
                              <button
                                onClick={() => markNotificationAsRead(n._id)}
                                className="text-xs text-accent hover:underline whitespace-nowrap"
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

            {/* Account placeholder */}
            <button
              className="h-12 w-12 grid place-items-center rounded-full bg-card border border-gray-200 shadow-sm"
              aria-label="Account"
            >
              <span className="text-base">👤</span>
            </button>
          </div>
        </div>

        {/* ===== Actions toolbar ===== */}
        <div className="w-full px-2 pt-2">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-2xl p-3 md:p-4">
            <div className="hidden sm:flex items-center rounded-full bg-white p-1 shadow-sm">
              {[
                { key: "board", Icon: Kanban, label: "Board" },
                { key: "table", Icon: Table, label: "Table" },
              ].map((v) => (
                <button
                  key={v.key}
                  onClick={() => setView(v.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full transition ${
                    view === v.key
                      ? "bg-black text-amber-400 shadow"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <v.Icon size={16} />
                  {v.label}
                </button>
              ))}
            </div>

            <select
              value={view}
              onChange={(e) => setView(e.target.value)}
              className="sm:hidden rounded-md px-3 py-2 text-sm bg-white shadow-sm"
            >
              <option value="board">Board</option>
              <option value="table">Table</option>
            </select>

            <div className="flex items-center gap-2">
              <button
                onClick={() => openForm()}
                className="flex items-center gap-2 px-4 py-2 bg-black text-amber-400 rounded-lg hover:bg-gray-800 transition shadow-sm"
              >
                <Plus size={16} /> Add Task
              </button>
              <KebabMenu
                items={[
                  { label: "Delete All", danger: true, onClick: deleteAll },
                ]}
              />
            </div>
          </div>
        </div>

        {/* ===== Main Content (no page scroll) ===== */}
        <main className="flex-1 flex gap-2 p-1 min-h-0 overflow-hidden">
          {/* Task View */}
          <section className="flex-1 bg-white rounded-2xl shadow-md overflow-hidden min-h-0">
            {view === "board" && (
              <TaskBoard
                columns={columns}
                tasksByStatus={tasksByStatus}
                deriveStatus={deriveStatus}
                taskStresses={taskStresses}
                onAddTask={onAddTask}
                onCardClick={openOverview}
                onEdit={openForm}
                onDelete={deleteTask}
                onStatusChange={updateTaskStatus}
                completeTask={completeTask}
              />
            )}
            {/* Removed TaskListView */}
            {view === "table" && (
              <TaskTableView
                tasks={tasks}
                deriveStatus={deriveStatus}
                onEdit={openForm}
                onDelete={deleteTask}
                onStatusChange={updateTaskStatus}
                onRowClick={openOverview}
              />
            )}
          </section>

          {/* Mobile overlay for Summary drawer */}
          {isSummaryOpen && (
            <div
              className="fixed inset-0 z-40 bg-black/50 lg:hidden"
              onClick={() => setIsSummaryOpen(false)}
            />
          )}

          {/* ===== Summary Sidebar (scrollable) ===== */}
          {showSidebar && isSummaryVisible && (
            <aside
              className={[
                "w-80 bg-white rounded-2xl shadow-md border border-gray-100",
                "h-[calc(100vh-1.5rem)] lg:h-[calc(100vh-2rem)]",
                "flex flex-col min-h-0 overflow-hidden",
                "transition-transform duration-300 flex-shrink-0",
                isSummaryOpen
                  ? "fixed right-3 top-3 bottom-3 z-50 translate-x-0"
                  : "fixed right-3 top-3 bottom-3 z-50 translate-x-[110%]",
                "lg:static lg:translate-x-0 lg:z-auto lg:top-auto lg:bottom-auto",
              ].join(" ")}
            >
              {/* Mobile close (X) */}
              <button
                className="absolute top-3 left-3 text-gray-500 hover:text-gray-700 lg:hidden"
                onClick={() => setIsSummaryOpen(false)}
                aria-label="Close summary"
              >
                <svg
                  className="h-6 w-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              {/* Header (fixed) */}
              <div className="px-3 pt-2 pb-2 flex items-center justify-between shrink-0">
                <h3 className="text-base font-semibold tracking-tight text-black">Summary</h3>
                <button
                  className="text-gray-400 hover:text-gray-700 hidden lg:inline-flex"
                  onClick={() => setIsSummaryVisible(false)}
                  aria-label="Hide summary"
                >
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>

              {/* Scrollable content ONLY here */}
              <div className="cm-scroll px-3 pt-3 pb-36 flex-1 min-h-0 space-y-4">
                {/* Overview Card */}
                <div className="rounded-xl border border-gray-100 bg-gradient-to-b from-white to-gray-50 p-4">
                  <div className="flex items-center gap-4">
                    {/* Radial gauge */}
                    <div
                      className="h-[72px] w-[72px] rounded-full grid place-items-center shrink-0"
                      style={{
                        background: `conic-gradient(${stressColor} ${stressPct}%, #e5e7eb ${stressPct}%)`,
                      }}
                    >
                      <div className="h-[56px] w-[56px] rounded-full bg-white grid place-items-center text-sm font-semibold text-gray-900">
                        {stressPct}%
                      </div>
                    </div>

                    {/* Metrics */}
                    <div className="flex-1 grid grid-cols-2 gap-3">
                      <div className="rounded-lg bg-white border border-gray-100 p-2">
                        <div className="text-[11px] text-gray-500">Active</div>
                        <div className="text-sm font-semibold text-gray-900">{activeCount}</div>
                      </div>
                      <div className="rounded-lg bg-white border border-gray-100 p-2">
                        <div className="text-[11px] text-gray-500">Top tags</div>
                        <div className="mt-1 flex gap-1 flex-wrap">
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 max-w-[7.5rem] truncate">
                            {topTags[0]}
                          </span>
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700/80 max-w-[7.5rem] truncate">
                            {topTags[1]}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Linear bar */}
                  <div className="mt-4">
                    <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-black"
                        style={{ width: `${stressPct}%` }}
                      />
                    </div>
                    <div className="mt-1 flex justify-between text-[11px] text-gray-500">
                      <span>Low</span>
                      <span>High</span>
                    </div>
                  </div>
                </div>

                {/* What’s spiking stress — ALWAYS a dropdown */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-gray-900">What’s spiking stress</div>
                    <span className="text-[11px] text-gray-400">
                      Top {Math.min(5, taskStressList.length)}
                    </span>
                  </div>

                  <details className="rounded-lg border border-gray-100 bg-white group">
                    <summary className="list-none cursor-pointer select-none p-2 text-sm font-medium text-gray-900 flex items-center justify-between">
                      <span>Show items</span>
                      <svg
                        className="h-4 w-4 text-gray-500 transition-transform group-open:rotate-180"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </summary>

                    <div className="p-2 space-y-2 max-h-64 overflow-auto">
                      {taskStressList.length === 0 ? (
                        <div className="text-xs text-gray-500">
                          No active tasks. Enjoy the calm ✨
                        </div>
                      ) : (
                        taskStressList.slice(0, 5).map((t) => (
                          <div key={t.id} className="rounded-lg border border-gray-100 bg-white p-2">
                            <div className="flex items-center justify-between gap-2">
                              <div className="truncate text-sm font-medium text-gray-900" title={t.title}>
                                {t.title}
                              </div>
                              <span className="text-[11px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                                {t.percent}%
                              </span>
                            </div>
                            <div className="mt-1 h-1.5 w-full rounded-full bg-gray-200 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  t.percent < 50
                                    ? "bg-amber-300"
                                    : t.percent < 75
                                    ? "bg-amber-500"
                                    : "bg-black"
                                }`}
                                style={{ width: `${t.percent}%` }}
                              />
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </details>
                </div>

                {/* Status breakdown */}
                <div className="rounded-xl border border-gray-100 bg-white p-3">
                  <div className="text-sm font-semibold mb-2 text-gray-900">By status</div>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                        <span className="text-gray-700">To Do</span>
                      </div>
                      <span className="font-medium text-gray-900">{statusPercents.todo}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                        <span className="text-gray-700">In Progress</span>
                      </div>
                      <span className="font-medium text-gray-900">{statusPercents.in_progress}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                        <span className="text-gray-700">Missing</span>
                      </div>
                      <span className="font-medium text-gray-900">{statusPercents.missing}%</span>
                    </div>
                  </div>
                </div>

                {/* AI tips */}
                <div className="rounded-xl border border-gray-100 bg-gradient-to-b from-white to-amber-50/50 p-3">
                  <div className="text-sm font-semibold mb-2 text-gray-900">AI Stress Reducer</div>
                  {overallTips && overallTips.length > 0 ? (
                    <ul className="text-sm text-gray-700 leading-relaxed space-y-1">
                      {overallTips.map((t, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                          <span>{t}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm italic text-gray-600">
                      All tasks complete. You're in zen mode!
                    </p>
                  )}
                </div>
              </div>
            </aside>
          )}

          {/* Desktop "show summary" tab when hidden */}
          {!isSummaryVisible && (
            <button
              className="hidden lg:flex fixed right-0 top-1/2 -translate-y-1/2 z-30 h-12 w-8 bg-white rounded-l-lg shadow-md items-center justify-center text-gray-500 hover:text-gray-700"
              onClick={() => setIsSummaryVisible(true)}
              aria-label="Show summary"
            >
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
        </main>
      </div>

      {/* ===== Task Form Modal ===== */}
      {showForm && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={closeForm}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                {editingTask ? "Edit Task" : "Add Task"}
              </h2>
              <button onClick={closeForm} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} />
              </button>
            </div>
            <TaskForm
              data={formData}
              setData={setFormData}
              error={formError}
              isEditing={!!editingTask}
              onSubmit={async () => {
                const hasStart = !!formData.startDate;
                const hasDue = !!formData.dueDate;
                if (hasStart && hasDue) {
                  const s = new Date(formData.startDate);
                  const d = new Date(formData.dueDate);
                  if (!isFinite(s.getTime()) || !isFinite(d.getTime())) {
                    setFormError("Please enter valid dates for Start and Due.");
                    return;
                  }
                  if (d < s) {
                    setFormError("Due Date cannot be earlier than Start Date.");
                    return;
                  }
                }
                setFormError("");
                const eid =
                  editingTaskId ||
                  formData.id ||
                  editingTask?.id ||
                  editingTask?._id;

                const toISO = (d) => {
                  if (!d) return null;
                  const parsed = new Date(d);
                  return isNaN(parsed.getTime()) ? null : parsed.toISOString();
                };

                if (eid) {
                  await updateTask(eid, {
                    title: formData.title,
                    description: formData.description,
                    priority: formData.priority,
                    status: formData.status,
                    start_date: toISO(formData.startDate),
                    due_date: toISO(formData.dueDate),
                    tags: formData.tags || [],
                  });
                  closeForm();
                  return;
                }

                await createTask({
                  title: formData.title,
                  description: formData.description,
                  priority: formData.priority,
                  status: formData.status || "todo",
                  start_date: toISO(formData.startDate),
                  due_date: toISO(formData.dueDate) || new Date().toISOString(),
                  tags: formData.tags || [],
                });
                closeForm();
              }}
              onCancel={closeForm}
            />
          </div>
        </div>
      )}

      {/* ===== Task Overview ===== */}
      {viewTaskId && (
        <TaskOverview
          task={viewingTask}
          derivedStatus={deriveStatus}
          onClose={closeOverview}
          onEdit={() => {
            openForm(viewingTask);
            closeOverview();
          }}
          onDelete={() => {
            deleteTask(viewingTask.id);
            closeOverview();
          }}
          onStatusChange={(status) => updateTask(viewingTask.id, { status })}
        />
      )}
    </div>
  );
}
