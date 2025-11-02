// src/components/TaskTableView.jsx
import React, { useEffect, useState } from "react";
import { Pencil, Trash2, Calendar, Tag as TagIcon } from "lucide-react";
import StatusDropdown from "./StatusDropdown";

export default function TaskTableView({
  tasks = [],
  deriveStatus,
  onRowClick,
  onStatusChange,
  onEdit,
  onDelete,
  completeTask,
}) {
  const [editingStatusId, setEditingStatusId] = useState(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".status-cell")) {
        setEditingStatusId(null);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const safeTasks = Array.isArray(tasks) ? tasks : [];
  const rows = safeTasks.map((t) => ({ ...t, eff: deriveStatus?.(t) || "todo" }));

  const getStatusLabel = (status) => {
    if (status === "done_late") return "Done Late";
    switch (status) {
      case "todo": return "To Do";
      case "in_progress": return "In Progress";
      case "missing": return "Overdue";
      case "completed": return "Completed";
      default: return status;
    }
  };

  const getStatusColor = (status) => {
    if (status === "done_late") return "bg-orange-100 text-orange-800 ring-orange-500/20";
    switch (status) {
      case "todo": return "bg-gray-100 text-gray-800 ring-gray-500/20";
      case "in_progress": return "bg-blue-100 text-blue-800 ring-blue-500/20";
      case "missing": return "bg-red-100 text-red-800 ring-red-500/20";
      case "completed": return "bg-green-100 text-green-800 ring-green-500/20";
      default: return "bg-gray-100 text-gray-800 ring-gray-500/20";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "Low": return "bg-green-100 text-green-800 ring-green-500/20";
      case "Medium": return "bg-yellow-100 text-yellow-800 ring-yellow-500/20";
      case "High": return "bg-red-100 text-red-800 ring-red-500/20";
      default: return "bg-gray-100 text-gray-800 ring-gray-500/20";
    }
  };

  const fmtDate = (d) => {
    if (!d) return "-";
    try {
      const nd = new Date(d);
      return isNaN(nd) ? String(d) : nd.toLocaleDateString();
    } catch {
      return String(d);
    }
  };

  return (
    <div className="h-full min-h-0 rounded-2xl border border-gray-200 bg-white shadow-md flex flex-col">
      {/* hide scrollbars utility (both axes) */}
      <style>{`
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>

      {/* Header bar to match TaskBoard vibe */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gradient-to-b from-black to-gray-900 rounded-t-2xl">
        <div className="text-sm font-semibold tracking-wide text-amber-400">Tasks Table</div>
        <div className="text-xs text-amber-300">{rows.length} item(s)</div>
      </div>

      {/* Scrollable table container (vertical & horizontal), header remains sticky */}
      <div className="flex-1 min-h-0 overflow-auto no-scrollbar">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="sticky top-0 z-10 bg-black text-amber-400 shadow-sm">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">Title & Tags</th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">Priority</th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider hidden md:table-cell">Start</th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">Due</th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {rows.map((t, index) => (
              <tr
                key={t.id}
                className={`group relative transition-all ${index % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-gray-100`}
              >
                {/* Title + tags */}
                <td
                  className="px-6 py-4 align-top cursor-pointer"
                  onClick={() => onRowClick?.(t)}
                  title={t.title}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${
                        t.eff === "missing" ? "bg-red-500"
                        : t.eff === "in_progress" ? "bg-blue-500"
                        : t.eff === "completed" ? "bg-green-600"
                        : "bg-gray-400"
                      }`}
                    />
                    <div className="min-w-0">
                      <div className="font-medium text-gray-900 truncate max-w-[40ch]">
                        {t.title || "Untitled"}
                      </div>
                      {Array.isArray(t.tags) && t.tags.length > 0 ? (
                        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-gray-600">
                          <TagIcon size={12} className="text-gray-400" />
                          {t.tags.slice(0, 3).map((tg, i) => (
                            <span
                              key={`${tg}-${i}`}
                              className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100"
                              title={tg}
                            >
                              {tg}
                            </span>
                          ))}
                          {t.tags.length > 3 && (
                            <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                              +{t.tags.length - 3}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="mt-1 text-xs text-gray-400">No tags</div>
                      )}
                    </div>
                  </div>
                </td>

                {/* Priority */}
                <td
                  className="px-6 py-4 whitespace-nowrap cursor-pointer align-top"
                  onClick={() => onRowClick?.(t)}
                >
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ring-1 ring-inset ${getPriorityColor(
                      t.priority
                    )}`}
                  >
                    {t.priority}
                  </span>
                </td>

                {/* Start (hidden on small) */}
                <td
                  className="px-6 py-4 whitespace-nowrap text-gray-600 cursor-pointer hidden md:table-cell align-top"
                  onClick={() => onRowClick?.(t)}
                  title="Start date"
                >
                  <div className="inline-flex items-center gap-1.5">
                    <Calendar size={14} className="text-gray-400" />
                    <span>{fmtDate(t.startDate || t.start_date)}</span>
                  </div>
                </td>

                {/* Due */}
                <td
                  className="px-6 py-4 whitespace-nowrap text-gray-600 cursor-pointer align-top"
                  onClick={() => onRowClick?.(t)}
                  title="Due date"
                >
                  <div className="inline-flex items-center gap-1.5">
                    <Calendar size={14} className="text-gray-400" />
                    <span>
                      {fmtDate(t.dueDate || t.due_date)}
                      {t.eff === "missing" && (t.dueDate || t.due_date) ? (
                        <span className="ml-1 text-red-600 text-xs">(Overdue)</span>
                      ) : null}
                    </span>
                  </div>
                </td>

                {/* Status */}
                <td className="px-6 py-4 whitespace-nowrap status-cell align-top">
                  {t.eff !== "done_late" && t.eff !== "completed" ? (
                    <StatusDropdown
                      value={t.status}
                      onChange={(s) => {
                        onStatusChange?.(t.id, s);
                        setEditingStatusId(null);
                      }}
                      menuAlign="right"
                    />
                  ) : (
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ring-1 ring-inset ${getStatusColor(
                        t.eff
                      )}`}
                    >
                      {getStatusLabel(t.eff)}
                    </span>
                  )}
                </td>

                {/* Actions */}
                <td className="px-6 py-4 whitespace-nowrap text-right align-top">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      className="p-2 rounded-md text-gray-700 hover:text-amber-600 hover:bg-amber-50 transition"
                      onClick={() => onEdit?.(t)}
                      title="Edit"
                      aria-label="Edit task"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      className="p-2 rounded-md text-red-600 hover:text-red-700 hover:bg-red-50 transition"
                      onClick={() => onDelete?.(t.id)}
                      title="Delete"
                      aria-label="Delete task"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {rows.length === 0 && (
              <tr>
                <td className="px-6 py-12" colSpan={6}>
                  <div className="mx-auto max-w-sm text-center rounded-xl border border-dashed border-gray-300 p-6 bg-white">
                    <div className="text-lg font-semibold text-gray-800">No tasks yet</div>
                    <p className="mt-1 text-sm text-gray-500">Add a task from the Board to get started.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
