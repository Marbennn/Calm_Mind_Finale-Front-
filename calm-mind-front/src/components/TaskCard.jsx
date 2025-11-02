import React from "react";
import { Pencil, Trash2, Calendar, Gauge, Tag as TagIcon } from "lucide-react";
import StatusDropdown from "./StatusDropdown";

export default function TaskCard({
  task,
  derivedStatus,
  onClick,
  onEdit,
  onDelete,
  onStatusChange,
  completeTask, // (unused here but kept to avoid breaking signature)
  // NEW (already existed in your code):
  stressPercent = 0,
  StressIndicator,
}) {
  if (!task) return null;

  const eff = derivedStatus(task);
  const canQuickActions =
    eff === "todo" || eff === "in_progress" || eff === "missing";

  // Dates: support both camelCase and snake_case without altering upstream logic
  const rawStart = task.startDate || task.start_date;
  const rawDue = task.dueDate || task.due_date;
  const fmtDate = (d) => {
    try {
      const nd = new Date(d);
      return isNaN(nd) ? String(d ?? "") : nd.toLocaleDateString();
    } catch {
      return String(d ?? "");
    }
  };

  // Stress visuals (kept purely presentational)
  const stress = Math.max(0, Math.min(100, Number(stressPercent) || 0));
  const stressTier = stress < 50 ? "Low" : stress < 75 ? "Medium" : "High";
  const stressClass =
    stress < 50
      ? "bg-amber-100 text-amber-800"
      : stress < 75
      ? "bg-amber-200 text-amber-900"
      : "bg-gray-900 text-amber-300";
  const barClass =
    stress < 50 ? "bg-amber-300" : stress < 75 ? "bg-amber-500" : "bg-black";
  const ringColor = stress < 50 ? "#fde68a" : stress < 75 ? "#f59e0b" : "#111827";

  const getStatusLabel = (status) => {
    if (status === "done_late") return "Done Late";
    switch (status) {
      case "todo":
        return "To Do";
      case "in_progress":
        return "In Progress";
      case "missing":
        return "Overdue";
      case "completed":
        return "Completed";
      default:
        return status;
    }
  };

  const getStatusColor = (status) => {
    if (status === "done_late") return "bg-orange-100 text-orange-800";
    switch (status) {
      case "todo":
        return "bg-gray-100 text-gray-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "missing":
        return "bg-red-100 text-red-800";
      case "completed":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div
      className="group relative cursor-pointer rounded-xl border border-gray-200 bg-gradient-to-b from-white to-gray-50 p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
      onClick={() => onClick(task)}
    >
      {/* Stress ring (always visible). If a custom StressIndicator is provided, we still render it above the ring. */}
      <div className="absolute top-3 right-3 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
        {/* Default ring */}
        <div
          className="h-9 w-9 rounded-full grid place-items-center"
          style={{
            background: `conic-gradient(${ringColor} ${stress}%, #e5e7eb ${stress}% 100%)`,
          }}
          title={`Stress: ${stress}%`}
        >
          <div className="h-7 w-7 rounded-full bg-white grid place-items-center text-[10px] font-semibold text-gray-900">
            {stress}%
          </div>
        </div>

        {/* Optional external indicator (kept, won’t break anything) */}
        {StressIndicator && <StressIndicator percent={stress} />}
      </div>

      {/* Title + actions */}
      <div className="flex items-start justify-between gap-3 pr-12">
        <h3 className="font-semibold text-gray-900 leading-snug line-clamp-2">
          {task.title}
        </h3>
        <div
          className="flex items-center gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            className="p-1.5 rounded-md hover:bg-gray-100"
            aria-label="Edit"
            onClick={() => onEdit(task)}
            title="Edit task"
          >
            <Pencil size={16} />
          </button>
          <button
            type="button"
            className="p-1.5 rounded-md hover:bg-gray-100"
            aria-label="Delete"
            title="Delete task"
            onClick={() => {
              const name = task.title ? `"${task.title}"` : "this task";
              if (window.confirm(`Delete ${name}? This cannot be undone.`)) {
                onDelete(task.id);
              }
            }}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Dates */}
      {(rawStart || rawDue) && (
        <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
          <Calendar size={14} className="opacity-70" />
          <div className="truncate">
            {rawStart ? `Start: ${fmtDate(rawStart)}` : null}
            {rawStart && rawDue ? " • " : null}
            {rawDue ? `Due: ${fmtDate(rawDue)}` : null}
          </div>
        </div>
      )}

      {/* Tags (show up to 3) */}
      {Array.isArray(task.tags) && task.tags.length > 0 && (
        <div className="mt-2 flex items-center gap-1.5 flex-wrap">
          <TagIcon size={14} className="text-gray-400" />
          {task.tags.slice(0, 3).map((tg, i) => (
            <span
              key={`${tg}-${i}`}
              className="text-[11px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100"
              title={tg}
            >
              {tg}
            </span>
          ))}
          {task.tags.length > 3 && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
              +{task.tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Priority + Status + Stress tier */}
      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className={`inline-block px-2 py-1 text-[11px] font-medium rounded-full
            ${
              task.priority === "High"
                ? "bg-red-100 text-red-800"
                : task.priority === "Medium"
                ? "bg-yellow-100 text-yellow-800"
                : "bg-green-100 text-green-800"
            }`}
          >
            {task.priority}
          </span>

          {/* Stress tier label */}
          <span
            className={`inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-full ${stressClass}`}
            title={`Stress level: ${stressTier}`}
          >
            <Gauge size={12} />
            {stressTier}
          </span>

          {/* Overdue flag if applicable */}
          {eff === "missing" && (
            <span className="px-2 py-1 text-[11px] rounded-full bg-red-100 text-red-800">
              Overdue
            </span>
          )}
        </div>

        <div
          className="flex items-center gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          {eff !== "done_late" && eff !== "completed" ? (
            <StatusDropdown
              value={task.status}
              onChange={(s) => onStatusChange(task.id, s)}
              menuAlign="right"
            />
          ) : (
            <span
              className={`text-[11px] px-2 py-1 rounded-full ${getStatusColor(
                eff
              )}`}
            >
              {getStatusLabel(eff)}
            </span>
          )}
        </div>
      </div>

      {/* Stress progress bar */}
      <div className="mt-3">
        <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
          <div
            className={`h-full rounded-full ${barClass} transition-[width] duration-300`}
            style={{ width: `${stress}%` }}
          />
        </div>
        <div className="mt-1 flex justify-between text-[10px] text-gray-500">
          <span>Low</span>
          <span>High</span>
        </div>
      </div>
    </div>
  );
}
