// src/components/TaskTableView.jsx
import React, { useEffect, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
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
      if (!event.target.closest('.status-cell')) {
        setEditingStatusId(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
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

  return (
    <div className="overflow-x-auto bg-white border border-gray-200 rounded-xl shadow-sm">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
          <tr>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Title</th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Priority</th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Start</th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Due</th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {rows.map((t, index) => (
            <tr
              key={t.id}
              className={`${index % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-gray-100 transition-colors duration-150 ease-in-out`}
            >
              <td className="px-6 py-4 whitespace-nowrap cursor-pointer font-medium text-gray-900" onClick={() => onRowClick?.(t)}>
                {t.title}
              </td>
              <td className="px-6 py-4 whitespace-nowrap cursor-pointer" onClick={() => onRowClick?.(t)}>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ring-1 ring-inset ${getPriorityColor(t.priority)}`}>
                  {t.priority}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-gray-600 cursor-pointer" onClick={() => onRowClick?.(t)}>
                {t.startDate || "-"}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-gray-600 cursor-pointer" onClick={() => onRowClick?.(t)}>
                {t.due_date?.split("T")[0] || "-"}
              </td>
              <td className="px-6 py-4 whitespace-nowrap status-cell">
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
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ring-1 ring-inset ${getStatusColor(t.eff)}`}>
                    {getStatusLabel(t.eff)}
                  </span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right">
                <div className="flex items-center justify-end gap-3">
                  <button
                    className="text-gray-600 hover:text-gray-900 p-2 rounded-md hover:bg-gray-200 transition-colors"
                    onClick={() => onEdit?.(t)}
                    title="Edit"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    className="text-red-600 hover:text-red-900 p-2 rounded-md hover:bg-gray-200 transition-colors"
                    onClick={() => onDelete?.(t.id)}
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td className="px-6 py-8 text-center text-gray-500 font-medium" colSpan={6}>
                No tasks yet. Add one to get started!
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}