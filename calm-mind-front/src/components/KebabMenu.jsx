import React, { useEffect, useRef, useState } from "react";

export default function KebabMenu({ triggerClass = "", triggerIcon, items = [] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onDoc = (e) => { if (!ref.current || ref.current.contains(e.target)) return; setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button className={triggerClass} onClick={() => setOpen((v) => !v)} aria-haspopup="menu" aria-expanded={open}>
        {triggerIcon ?? "⋯"}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 rounded-md border border-gray-200 bg-white shadow-md animate-[scaleIn_.12s_ease-out] z-40">
          {items.map((it) => (
            <button
              key={it.key}
              type="button"
              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${it.danger ? "text-red-600" : ""}`}
              onClick={() => { setOpen(false); it.onClick && it.onClick(); }}
            >
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
