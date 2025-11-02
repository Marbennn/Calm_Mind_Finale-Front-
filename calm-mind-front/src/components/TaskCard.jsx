import React from "react";
import { Pencil, Trash2 } from "lucide-react";
import StatusDropdown from "./StatusDropdown";

export default function TaskCard({
  task,
  derivedStatus,
  onClick,
  onEdit,
  onDelete,
  onStatusChange,
  completeTask,
  // NEW:
  stressPercent = 0,
  StressIndicator,
}) {
  if (!task) return null;
  const eff = derivedStatus(task);
  const canQuickActions = eff === "todo" || eff === "in_progress" || eff === "missing";

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
    if (status === "done_late") return "bg-orange-100 text-orange-800";
    switch (status) {
      case "todo": return "bg-gray-100 text-gray-800";
      case "in_progress": return "bg-blue-100 text-blue-800";
      case "missing": return "bg-red-100 text-red-800";
      case "completed": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div
      className="relative bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-lg transition cursor-pointer"
      onClick={() => onClick(task)}
    >
      {/* NEW: stress indicator top-right */}
      {StressIndicator && (
        <div className="absolute top-2 right-2" onClick={(e) => e.stopPropagation()}>
          <StressIndicator percent={stressPercent} />
        </div>
      )}

      <div className="flex items-start justify-between gap-3">
        <h3 className="font-medium line-clamp-2 pr-10">{task.title}</h3>
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button type="button" className="p-1 rounded hover:bg-gray-100" aria-label="Edit" onClick={() => onEdit(task)}>
            <Pencil size={16} />
          </button>
          <button type="button" className="p-1 rounded hover:bg-gray-100" aria-label="Delete" onClick={() => onDelete(task.id)}>
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {(task.startDate || task.dueDate) && (
        <div className="text-xs text-gray-400 mt-1">
          {task.startDate ? `Start: ${task.startDate}` : null}
          {task.startDate && task.dueDate ? " • " : null}
          {task.dueDate ? `Due: ${task.dueDate}` : null}
        </div>
      )}

      <div className="mt-2 flex items-center justify-between">
        <span
          className={`inline-block px-2 py-1 text-xs rounded-full
          ${task.priority === "High" ? "bg-red-100 text-red-800" :
            task.priority === "Medium" ? "bg-yellow-100 text-yellow-800" :
            "bg-green-100 text-green-800"}`}
        >
          {task.priority}
        </span>

        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {eff === "missing" && (
            <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Overdue</span>
          )}

          {eff !== "done_late" && eff !== "completed" ? (
            <StatusDropdown value={task.status} onChange={(s) => onStatusChange(task.id, s)} menuAlign="right" />
          ) : (
            <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(eff)}`}>
              {getStatusLabel(eff)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
