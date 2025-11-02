// src/components/analytics/FilterCard.jsx
import React, { useRef, useState } from "react";
import Card from "../../components/HoverCard";

const COLORS = { gold: "#B9A427" };

export default function FilterCard({
  dateFrom, dateTo, onChangeFrom, onChangeTo,
  periodMode, onChangeMode,
  groupBy, onChangeGroupBy,
}) {
  const fromRef = useRef(null);
  const toRef = useRef(null);
  const [openDatePick, setOpenDatePick] = useState(false);

  const openPicker = () => {
    setOpenDatePick(true);
    // focus the "from" first; user can tab to "to"
    setTimeout(() => fromRef.current?.showPicker?.(), 0);
  };

  return (
    <Card className="p-4 mb-4">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 w-full">
          <div className="flex flex-col">
            <label className="text-xs text-gray-500 mb-1">From</label>
            <input
              ref={fromRef}
              type="date"
              value={dateFrom}
              onChange={(e) => onChangeFrom(e.target.value)}
              className="border rounded-lg px-3 py-2 bg-white/70 dark:bg-neutral-900"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-gray-500 mb-1">To</label>
            <input
              ref={toRef}
              type="date"
              value={dateTo}
              onChange={(e) => onChangeTo(e.target.value)}
              className="border rounded-lg px-3 py-2 bg-white/70 dark:bg-neutral-900"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs text-gray-500 mb-1">Period</label>
            <select
              value={periodMode}
              onChange={(e) => onChangeMode(e.target.value)}
              className="border rounded-lg px-3 py-2 bg-white/70 dark:bg-neutral-900"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-xs text-gray-500 mb-1">Group By</label>
            <select
              value={groupBy}
              onChange={(e) => onChangeGroupBy(e.target.value)}
              className="border rounded-lg px-3 py-2 bg-white/70 dark:bg-neutral-900"
            >
              <option>None</option>
              <option>Priority</option>
              <option>Status</option>
              <option>Tag</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={openPicker}
              className="w-full md:w-auto px-3 py-2 rounded-lg border bg-white hover:bg-gray-50 text-sm"
              style={{ boxShadow: "0 4px 10px rgba(0,0,0,0.03)" }}
              title="Pick dates"
            >
              <span className="inline-flex items-center gap-2">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <path d="M16 2v4M8 2v4M3 10h18" />
                </svg>
                Calendar
              </span>
            </button>
          </div>
        </div>

        {/* Tips (unchanged per requirements) */}
        <div className="text-xs text-gray-500">
          Tips: Adjust the date range and grouping to see trends update live.
        </div>
      </div>
    </Card>
  );
}
