import React, { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";

// Only user-selectable states; "missing" and "done_late" are computed elsewhere and not user-selectable
export const STATUS_OPTIONS = [
  { key: "todo",        label: "To Do",       dot: "bg-gray-400"  },
  { key: "in_progress", label: "In Progress", dot: "bg-blue-500"  },
  { key: "completed",   label: "Done",        dot: "bg-green-500" },
];

export default function StatusDropdown({ value, onChange, buttonClass = "", menuAlign = "left" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onDoc = (e) => {
      if (!ref.current || ref.current.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const current = STATUS_OPTIONS.find((o) => o.key === value) || STATUS_OPTIONS[0];

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        type="button"
        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md border border-gray-200 bg-white hover:bg-gray-50 transition text-xs ${buttonClass}`}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={`h-2.5 w-2.5 rounded-full ${current.dot}`} />
        <span>{current.label}</span>
      </button>

      {open && (
        <div
          className={`absolute z-40 mt-2 w-44 rounded-md border border-gray-200 bg-white shadow-md origin-top-${menuAlign} animate-[scaleIn_.12s_ease-out]`}
          style={{ [menuAlign]: 0 }}
          role="listbox"
        >
          {STATUS_OPTIONS.map((opt) => {
            const active = opt.key === value;
            return (
              <button
                key={opt.key}
                type="button"
                className={`w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-50 ${active ? "bg-gray-50" : ""}`}
                onClick={() => { onChange(opt.key); setOpen(false); }}
                role="option"
                aria-selected={active}
              >
                <span className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${opt.dot}`} />
                  {opt.label}
                </span>
                {active && <Check size={16} className="text-gray-600" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}