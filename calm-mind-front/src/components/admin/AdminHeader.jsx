// src/components/admin/AdminHeader.jsx
import React from 'react';
import Card from "../HoverCard";

export default function AdminHeader() {
  return (
    <div className="sticky top-0 z-20 bg-transparent">
      <div className="mb-3 mt-2 px-2">
        <Card className="w-full px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3 hover:shadow-none hover:-translate-y-0 hover:bg-inherit cursor-default">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard (All Students)</h1>
          </div>
          <div className="text-xs text-gray-500 md:ml-4">
            Tips: Adjust the date range and period to see trends update live.
          </div>
        </Card>
      </div>
    </div>
  );
}