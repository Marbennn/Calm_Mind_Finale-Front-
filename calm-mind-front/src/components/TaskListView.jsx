// src/components/TaskListView.jsx
import React from "react";

export default function TaskListView({
  tasks = [],
  deriveStatus,
  onRowClick,
  onStatusChange,
  onEdit,
  onDelete,
  completeTask,
}) {
  // SAFETY
  const safeTasks = Array.isArray(tasks) ? tasks : [];
  if (!deriveStatus) return <div className="p-4 text-red-600">Error: deriveStatus missing</div>;

  const grouped = { todo: [], in_progress: [], missing: [], completed: [] };
  safeTasks.forEach((t) => {
    const status = deriveStatus(t);
    grouped[status === "done_late" ? "completed" : status].push(t);
  });

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
    if (status === "done_late") return "bg-orange-100 text-orange-800 ring-orange-300";
    switch (status) {
      case "todo": return "bg-gray-100 text-gray-800 ring-gray-300";
      case "in_progress": return "bg-blue-100 text-blue-800 ring-blue-300";
      case "missing": return "bg-red-100 text-red-800 ring-red-300";
      case "completed": return "bg-green-100 text-green-800 ring-green-300";
      default: return "bg-gray-100 text-gray-800 ring-gray-300";
    }
  };

  const Section = ({ title, status }) => {
    const tasks = grouped[status] || [];
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <h3 className="font-semibold text-lg px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          {title}
          <span className="text-sm text-gray-500">({tasks.length})</span>
        </h3>
        <div className="p-4 space-y-3">
          {tasks.length === 0 ? (
            <div className="text-sm text-gray-500 text-center py-4">No tasks here yet.</div>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200 cursor-pointer"
                onClick={() => onRowClick?.(task)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="font-medium text-gray-900">{task.title}</div>
                  <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(deriveStatus(task))} ring-1 ring-inset`}>
                    {getStatusLabel(deriveStatus(task))}
                  </span>
                </div>
                <div className="text-sm text-gray-500 mb-4">
                  {task.startDate ? `Start: ${task.startDate}` : null}
                  {task.startDate && task.due_date ? " • " : null}
                  {task.due_date ? `Due: ${task.due_date.split("T")[0]}` : "No due date"}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {(status === "todo" || status === "missing") && (
                    <>
                      {status === "missing" && (
                        <span className="px-3 py-1 text-sm rounded-full bg-red-100 text-red-800 ring-1 ring-inset ring-red-300">Overdue</span>
                      )}
                      <button
                        className="text-sm px-3 py-1 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors duration-200"
                        onClick={(e) => { e.stopPropagation(); onStatusChange?.(task.id, "in_progress"); }}
                      >
                        Start
                      </button>
                      <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          onChange={(e) => {
                            e.stopPropagation();
                            if (e.target.checked) completeTask?.(task.id);
                          }}
                          className="h-4 w-4 text-green-600 rounded focus:ring-green-500"
                        />
                        Mark as Completed
                      </label>
                    </>
                  )}
                  {status === "in_progress" && (
                    ["todo", "completed"].map((s) => (
                      <button
                        key={s}
                        className="text-sm px-3 py-1 rounded-md bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                        onClick={(e) => { e.stopPropagation(); onStatusChange?.(task.id, s); }}
                      >
                        Move to {s === "todo" ? "To Do" : "Completed"}
                      </button>
                    ))
                  )}
                  <button
                    className="text-sm px-3 py-1 rounded-md bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                    onClick={(e) => { e.stopPropagation(); onEdit?.(task); }}
                  >
                    Edit
                  </button>
                  <button
                    className="text-sm px-3 py-1 rounded-md bg-red-50 text-red-700 hover:bg-red-100 transition-colors duration-200"
                    onClick={(e) => { e.stopPropagation(); onDelete?.(task.id); }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 max-w-8xl mx-auto p-4">
      <Section title="To Do" status="todo" />
      <Section title="In Progress" status="in_progress" />
      <Section title="Overdue" status="missing" />
      <Section title="Completed" status="completed" />
    </div>
  );
}