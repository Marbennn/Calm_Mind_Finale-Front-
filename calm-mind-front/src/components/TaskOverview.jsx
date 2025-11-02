// components/TaskOverview.jsx
import React from "react";
import { X, Calendar, Flag, Tag as TagIcon } from "lucide-react";
import StatusDropdown from "./StatusDropdown";

export default function TaskOverview({
  task,
  derivedStatus,
  onClose,
  onStatusChange,
}) {
  if (!task || !derivedStatus) return null;

  const eff = derivedStatus(task);
  const showDropdown = eff !== "done_late" && eff !== "completed";

  // Support camelCase & snake_case fields like in TaskForm
  const rawStart = task.startDate || task.start_date || "";
  const rawDue = task.dueDate || task.due_date || "";
  const fmt = (d) => {
    if (!d) return "—";
    const nd = new Date(d);
    return isNaN(nd) ? String(d) : nd.toLocaleDateString();
  };

  const statusBadge =
    eff === "missing" ? (
      <span className="px-2.5 py-1 text-xs rounded-full bg-red-100 text-red-700 ring-1 ring-red-200">
        Overdue
      </span>
    ) : eff === "done_late" ? (
      <span className="px-2.5 py-1 text-xs rounded-full bg-orange-100 text-orange-700 ring-1 ring-orange-200">
        Done Late
      </span>
    ) : eff === "completed" ? (
      <span className="px-2.5 py-1 text-xs rounded-full bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200">
        Done
      </span>
    ) : eff === "in_progress" ? (
      <span className="px-2.5 py-1 text-xs rounded-full bg-blue-100 text-blue-700 ring-1 ring-blue-200">
        In Progress
      </span>
    ) : (
      <span className="px-2.5 py-1 text-xs rounded-full bg-gray-100 text-gray-700 ring-1 ring-gray-200">
        To Do
      </span>
    );

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />

      {/* Drawer */}
      <aside
        role="dialog"
        aria-modal="true"
        className="absolute right-0 top-0 h-full w-full sm:w-[560px] lg:w-[640px]
                   bg-white/90 backdrop-blur-xl border-l border-gray-200 shadow-2xl
                   lg:rounded-l-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-200">
          <div className="px-6 py-4 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                {statusBadge}
                <span
                  className={`px-2 py-0.5 text-[11px] rounded-full ring-1 ${
                    task.priority === "High"
                      ? "bg-red-50 text-red-700 ring-red-200"
                      : task.priority === "Medium"
                      ? "bg-amber-50 text-amber-700 ring-amber-200"
                      : "bg-emerald-50 text-emerald-700 ring-emerald-200"
                  }`}
                >
                  {task.priority || "—"}
                </span>
              </div>
              {/* Title */}
              <div className="mt-2">
                <div className="text-[12px] text-gray-500">Title</div>
                <h3 className="mt-0.5 text-xl font-semibold tracking-tight text-gray-900 break-words">
                  {task.title || "—"}
                </h3>
              </div>
            </div>

            {/* Close only (Edit/Delete removed) */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                className="p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition"
                aria-label="Close"
                onClick={onClose}
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Body mirrors TaskForm sections, but read-only except Status */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Status + Priority */}
          <div className="rounded-2xl border border-gray-200 bg-white/80 p-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
              {/* Status */}
              <div>
                <div className="block text-sm font-medium text-gray-700">Status</div>
                <div className="mt-1.5">
                  {showDropdown ? (
                    <StatusDropdown
                      value={
                        task.status === "missing" || task.status === "done_late"
                          ? "todo"
                          : task.status
                      }
                      onChange={(s) => onStatusChange(task.id, s)}
                      className="block w-full rounded-md border border-gray-300 px-3.5 py-2 shadow-sm"
                    />
                  ) : (
                    <div className="inline-block mt-0.5">{statusBadge}</div>
                  )}
                </div>
              </div>

              {/* Priority */}
              <div>
                <div className="block text-sm font-medium text-gray-700">Priority</div>
                <div className="mt-2 inline-flex items-center gap-2 text-sm rounded-full border border-gray-200 px-3 py-1.5 bg-white">
                  <Flag
                    size={14}
                    className={
                      task.priority === "High"
                        ? "text-red-500"
                        : task.priority === "Medium"
                        ? "text-amber-500"
                        : "text-emerald-600"
                    }
                  />
                  <span className="text-gray-800">{task.priority || "—"}</span>
                </div>
              </div>

              <div className="hidden sm:block" />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-gray-200 bg-white/80 p-4">
              <label className="block text-sm font-medium text-gray-700">Start Date</label>
              <p className="text-xs text-gray-400 mt-1">Select Start Date</p>
              <div className="mt-2 flex items-center gap-2 text-sm text-gray-800">
                <Calendar size={16} className="text-gray-500" />
                <span>{fmt(rawStart)}</span>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white/80 p-4">
              <label className="block text-sm font-medium text-gray-700">Due Date</label>
              <p className="text-xs text-gray-400 mt-1">Select Due Date</p>
              <div className="mt-2 flex items-center gap-2 text-sm text-gray-800">
                <Calendar size={16} className="text-gray-500" />
                <span>
                  {fmt(rawDue)}
                  {eff === "missing" && rawDue !== "" ? " (Overdue)" : ""}
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white/80 p-4 hidden sm:block" />
          </div>

          {/* Description */}
          <div className="rounded-2xl border border-gray-200 bg-white/80 p-4">
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <div className="mt-1.5 whitespace-pre-wrap text-sm text-gray-800 max-h-64 overflow-y-auto pr-1">
              {task.description || "—"}
            </div>
          </div>

          {/* Tags */}
          <div className="rounded-2xl border border-gray-200 bg-white/80 p-4">
            <label className="block text-sm font-medium text-gray-700">Stressor Tags</label>

            {Array.isArray(task.tags) && task.tags.length > 0 ? (
              <>
                <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-500">
                  <TagIcon size={14} className="text-gray-400" />
                  <span>{task.tags.length} selected</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {task.tags.map((t, i) => (
                    <span
                      key={`${t}-${i}`}
                      className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-sm font-medium text-amber-700"
                      title={t}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <div className="mt-2 text-sm text-gray-500">No tags</div>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
