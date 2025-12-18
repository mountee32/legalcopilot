"use client";

import { formatMonthHeader } from "./utils";

interface TimelineMonthHeaderProps {
  date: Date;
}

export function TimelineMonthHeader({ date }: TimelineMonthHeaderProps) {
  return (
    <div className="relative flex items-center w-full py-3">
      {/* Left line */}
      <div className="flex-1 h-px bg-slate-200" />

      {/* Month label */}
      <div className="px-4 py-1 bg-slate-100 text-slate-500 text-sm font-semibold rounded-full mx-2">
        {formatMonthHeader(date)}
      </div>

      {/* Right line */}
      <div className="flex-1 h-px bg-slate-200" />
    </div>
  );
}
