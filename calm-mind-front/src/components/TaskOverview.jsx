import React from "react";
import { X, Pencil, Trash2, Calendar, Flag } from "lucide-react";
import StatusDropdown from "./StatusDropdown";

export default function TaskOverview({
  task,
  derivedStatus,
  onClose,
  onEdit,
  onDelete,
  onStatusChange,
}) {
  if (!task || !derivedStatus) return null;

  const eff = derivedStatus(task);
  const showDropdown = eff !== "done_late" && eff !== "completed";

  const statusBadge =
    eff === "missing" ? (
      <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Overdue</span>
    ) : eff === "done_late" ? (
      <span className="px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-800">Done Late</span>
    ) : eff === "completed" ? (
      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Done</span>
    ) : eff === "in_progress" ? (
      <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">In Progress</span>
    ) : (
      <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">To Do</span>
    );

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/10" onClick={onClose} />
      <aside className="absolute right-0 top-0 h-full w-full sm:w-[560px] bg-white shadow-xl border-l border-gray-200
                       translate-x-0 animate-[slideIn_.15s_ease-out]">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <h3 className="text-lg font-semibold line-clamp-2 pr-4">{task.title}</h3>
          <div className="flex items-center gap-1">
            <button className="p-2 rounded hover:bg-gray-100" aria-label="Edit" onClick={() => onEdit(task)}>
              <Pencil size={18} />
            </button>
            <button className="p-2 rounded hover:bg-gray-100" aria-label="Delete" onClick={() => onDelete(task.id)}>
              <Trash2 size={18} />
            </button>
            <button className="p-2 rounded hover:bg-gray-100" aria-label="Close" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>
        <div className="p-5 space-y-5">
          <div className="flex items-center gap-3">
            {showDropdown ? (
              <StatusDropdown
                value={task.status}
                onChange={(s) => onStatusChange(task.id, s)}
              />
            ) : (
              statusBadge
            )}
            <div className="flex items-center gap-2 text-sm rounded-md border border-gray-200 px-2 py-1">
              <Flag size={14} className={
                task.priority === "High" ? "text-red-500" :
                task.priority === "Medium" ? "text-yellow-500" : "text-green-500"
              } />
              <span className="text-gray-700">{task.priority}</span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-2 text-sm">
              <Calendar size={16} className="text-gray-500" />
              <div>
                <div className="text-gray-500">Start</div>
                <div className="font-medium">{task.startDate || "—"}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar size={16} className="text-gray-500" />
              <div>
                <div className="text-gray-500">Due</div>
                <div className="font-medium">
                  {task.dueDate || "—"} {eff === "missing" && task.dueDate ? <span className="ml-2 text-red-600 text-xs">(Overdue)</span> : null}
                </div>
              </div>
            </div>
          </div>
          <div>
            <div className="text-gray-500 text-sm mb-1">Description</div>
            <div className="whitespace-pre-wrap text-sm">{task.description || "—"}</div>
          </div>
        </div>
      </aside>
    </div>
  );
}