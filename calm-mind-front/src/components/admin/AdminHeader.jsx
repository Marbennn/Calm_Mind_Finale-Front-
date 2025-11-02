// src/components/admin/AdminHeader.jsx
import React from "react";

/** Header styled EXACTLY like Analytics header, but WITHOUT the two icon buttons. */
export default function AdminHeader({ title = "Admin Dashboard (All Students)" }) {
  return (
    <div className="col-span-12">
      <div className="h-20 md:h-[80px] w-full px-4 flex items-center justify-between bg-card rounded-xl shadow-md cursor-default mt-2 mx-2">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{title}</h1>
        <div className="hidden md:block text-xs text-gray-500">
          Tips: Adjust the date range and period to see trends update live.
        </div>
      </div>
    </div>
  );
}
