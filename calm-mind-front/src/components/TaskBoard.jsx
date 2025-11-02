// src/components/TaskBoard.jsx
import React from "react";
import TaskCard from "./TaskCard";

export default function TaskBoard({
  columns = [],
  tasksByStatus = {},
  onCardClick,
  onEdit,
  onDelete,
  onStatusChange,
  completeTask,
  deriveStatus,
  taskStresses = {},
  StressIndicator,
  onAddTask,
}) {
  // SAFETY: Always have array
  const safeColumns = Array.isArray(columns) ? columns : [];

  const getColumnStyle = (status) => {
    switch (status) {
      case "todo": return { bg: "bg-amber-50", text: "text-amber-800", dot: "bg-amber-300/60" };
      case "in_progress": return { bg: "bg-blue-50", text: "text-blue-800", dot: "bg-blue-300/60" };
      case "completed": return { bg: "bg-green-50", text: "text-green-800", dot: "bg-green-300/60" };
      case "missing": return { bg: "bg-orange-50", text: "text-orange-800", dot: "bg-orange-300/60" };
      default: return { bg: "bg-gray-50", text: "text-gray-800", dot: "bg-gray-300/60" };
    }
  };

  return (
    <div className="grid grid-cols-1 grid-rows-4 md:grid-cols-4 md:grid-rows-1 gap-4 w-full h-full">
      {safeColumns.map((col) => {
        const style = getColumnStyle(col.status);
        const columnTasks = Array.isArray(tasksByStatus[col.status]) ? tasksByStatus[col.status] : [];

        return (
          <div key={col.status} className="flex flex-col w-full min-w-0 min-h-0">
            <div className={`flex items-center justify-between px-4 py-2 rounded-full ${style.bg} ${style.text} shadow-sm transition-shadow hover:shadow-md`}>
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${style.dot}`} />
                <span className="font-semibold text-sm">{col.title}</span>
                <span className="text-xs opacity-70">({columnTasks.length})</span>
              </div>
              {onAddTask && (
                <button
                  className="text-sm opacity-70 hover:opacity-100 transition-opacity"
                  onClick={() => onAddTask(col.status)}
                >
                  +
                </button>
              )}
            </div>
            <div className="mt-3 flex-1 space-y-3 overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {columnTasks.length === 0 ? (
                <div className="flex items-center justify-center h-full text-sm text-gray-500">
                  No tasks here yet.
                </div>
              ) : (
                columnTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    derivedStatus={deriveStatus}
                    onClick={onCardClick}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onStatusChange={onStatusChange}
                    completeTask={completeTask}
                    stressPercent={taskStresses[task.id] || 0}
                    StressIndicator={StressIndicator}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}