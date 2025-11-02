// src/pages/TaskManagement.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Plus, MoreVertical, Kanban, List, Table, X } from "lucide-react";
import Sidebar from "../components/Sidebar";
import TaskBoard from "../components/TaskBoard";
import TaskListView from "../components/TaskListView";
import TaskTableView from "../components/TaskTableView";
import TaskForm from "../components/TaskForm";
import TaskOverview from "../components/TaskOverview";
import KebabMenu from "../components/KebabMenu";
import useStressStore from "../store/useStressStore";
import { generateOverallRecommendations } from "../utils/stressUtils";

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
  const [showSidebar, setShowSidebar] = useState(true);
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

  /* ---------- Data Loading ---------- */
  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, 30000);
    return () => clearInterval(interval);
  }, [fetchTasks]);

  /* ---------- Derived State & Analytics ---------- */
  const dailyStress = getDailyStressSummary();
  const activeCount = tasks.filter((t) => !t.completed).length;

  // Tips based on current stress levels
  const overallTips = useMemo(
    () => generateOverallRecommendations(tasks, dailyStress),
    [tasks, dailyStress]
  );

  /* ---------- Board helpers (columns, grouping, actions) ---------- */
  const deriveStatus = useCallback((task) => {
    if (!task) return "todo";
    if (task.completed || task.status === "completed") return "completed";
    const due = task.due_date ? new Date(task.due_date) : null;
    const now = new Date();
    if (due && due < now) return "missing";
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

  // Use per-task stress values from store
  const taskStresses = useMemo(() => {
    const map = {};
    tasks.forEach(task => {
      map[task.id] = Math.round(getTaskStress(task.id) * 100);
    });
    return map;
  }, [tasks, getTaskStress]);

  const taskStressList = useMemo(() => {
    return tasks
      .filter(t => !t.completed)
      .map(t => ({
        id: t.id,
        title: t.title || 'Untitled',
        percent: Math.round(getTaskStress(t.id) * 100),
      }))
      .sort((a, b) => b.percent - a.percent);
  }, [tasks, getTaskStress]);

  const topTags = useMemo(() => {
    const counts = new Map();
    tasks.forEach((t) => {
      if (t.completed) return;
      (t.tags || []).forEach((tag) => counts.set(tag, (counts.get(tag) || 0) + 1));
    });
    const sorted = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
    const a = sorted[0]?.[0] || '(no tags)';
    const b = sorted[1]?.[0] || '(no tags)';
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
        dueDate: formatDate(task.dueDate || task.due_date) || new Date().toISOString().slice(0, 10),
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
      todo: Math.round((byStatus.todo || []).reduce((a, b) => a + b, 0) / (byStatus.todo?.length || 1) * 100),
      in_progress: Math.round((byStatus.in_progress || []).reduce((a, b) => a + b, 0) / (byStatus.in_progress?.length || 1) * 100),
      missing: Math.round((byStatus.missing || []).reduce((a, b) => a + b, 0) / (byStatus.missing?.length || 1) * 100),
    };
  }, [tasks, getTaskStress, deriveStatus]);

  /* ---------- Render ---------- */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xl">
        Loading tasks...
      </div>
    );
  }

  return (
    <div className="min-h-screen h-screen flex">
      <Sidebar theme={theme} onToggleTheme={toggleTheme} active="Tasks" />

      <div className="flex-1 flex flex-col min-h-0">
        {/* Header */}
        <header className="h-20 px-6 flex items-center justify-between border-b bg-white">
          <h1 className="text-3xl font-bold">Task Management</h1>
          <div className="flex items-center gap-3">
            {/* View Toggle */}
            <div className="hidden sm:flex items-center rounded-full border bg-white p-1 shadow-sm">
              {[
                { key: "board", Icon: Kanban, label: "Board" },
                { key: "list", Icon: List, label: "List" },
                { key: "table", Icon: Table, label: "Table" },
              ].map((v) => (
                <button
                  key={v.key}
                  onClick={() => setView(v.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full transition ${
                    view === v.key
                      ? "bg-amber-600 text-white"
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
              className="sm:hidden border rounded-md px-3 py-2 text-sm"
            >
              <option value="board">Board</option>
              <option value="list">List</option>
              <option value="table">Table</option>
            </select>

            {/* Actions */}
            <button
              onClick={() => openForm()}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition"
            >
              <Plus size={16} /> Add Task
            </button>
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition"
            >
              {showSidebar ? "Hide" : "Show"} Summary
            </button>
            <KebabMenu
              items={[
                { label: "Delete All", danger: true, onClick: deleteAll },
              ]}
            />
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex gap-4 p-4">
          {/* Task View */}
          <section className="flex-1 bg-white rounded-xl shadow-sm border overflow-hidden">
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
            {view === "list" && (
              <TaskListView
                tasks={tasks}
                deriveStatus={deriveStatus}
                onEdit={openForm}
                onDelete={deleteTask}
                onStatusChange={updateTaskStatus}
                completeTask={completeTask}
                onRowClick={openOverview}
              />
            )}
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

          {/* AI Sidebar */}
          {showSidebar && (
            <aside className="w-80 bg-white rounded-xl shadow-sm border p-6 space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-bold">Stress Level</h3>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      dailyStress.average < 0.5
                        ? "bg-green-100 text-green-700"
                        : dailyStress.average < 0.75
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {Math.round(dailyStress.average * 100)}%
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  {activeCount} active tasks
                </p>

                <div className="mt-2">
                  <div className="w-full h-2 bg-gray-200 rounded overflow-hidden">
                    <div
                      className={`${dailyStress.average < 0.5 ? 'bg-blue-500' : dailyStress.average < 0.75 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${Math.round(dailyStress.average * 100)}%`, height: '100%' }}
                    />
                  </div>
                </div>

                <div className="mt-3 text-sm text-gray-700">
                  <span className="font-medium">Main contributors:</span> {topTags[0]}, {topTags[1]}
                </div>

                {/* Overall list: all active tasks by stress percent */}
                <div className="mt-4">
                  <div className="text-sm font-semibold mb-2">Task stress percentages</div>
                  <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                    {taskStressList.map((t) => (
                      <div key={t.id} className="text-sm">
                        <div className="flex justify-between">
                          <span className="truncate max-w-[60%]" title={t.title}>{t.title}</span>
                          <span className="ml-2">{t.percent}%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded overflow-hidden">
                          <div
                            className={`${t.percent < 50 ? 'bg-blue-500' : t.percent < 75 ? 'bg-yellow-500' : 'bg-red-500'}`}
                            style={{ width: `${t.percent}%`, height: '100%' }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Simple numeric lines for status-based stress (percentage) */}
                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span>To Do</span>
                    <span>{statusPercents.todo}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>In Progress</span>
                    <span>{statusPercents.in_progress}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Missing</span>
                    <span>{statusPercents.missing}%</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold mb-3">AI Stress Reducer</h3>
                {overallTips && overallTips.length > 0 ? (
                  <ul className="text-sm text-gray-700 leading-relaxed list-disc pl-5 space-y-1">
                    {overallTips.map((t, i) => (
                      <li key={i}>{t}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm italic text-gray-700 leading-relaxed">All tasks complete. You're in zen mode!</p>
                )}
              </div>
            </aside>
          )}
        </main>
      </div>

      {/* Task Form Modal */}
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
              <button
                onClick={closeForm}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X size={20} />
              </button>
            </div>
            <TaskForm
              data={formData}
              setData={setFormData}
              isEditing={!!editingTask}
              onSubmit={async () => {
                const eid = editingTaskId || formData.id || editingTask?.id || editingTask?._id;
                if (eid) {
                  await updateTask(eid, {
                    title: formData.title,
                    description: formData.description,
                    priority: formData.priority,
                    status: formData.status,
                    due_date: formData.dueDate,
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
                  due_date: formData.dueDate || new Date().toISOString(),
                  tags: formData.tags || [],
                });
                closeForm();
              }}
              onCancel={closeForm}
            />
          </div>
        </div>
      )}

      {/* Task Overview */}
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
