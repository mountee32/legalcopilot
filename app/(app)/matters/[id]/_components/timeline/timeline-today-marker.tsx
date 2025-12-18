"use client";

import { forwardRef } from "react";
import { MapPin } from "lucide-react";
import { formatEventDate } from "./utils";

interface TimelineTodayMarkerProps {
  date?: Date;
}

export const TimelineTodayMarker = forwardRef<HTMLDivElement, TimelineTodayMarkerProps>(
  function TimelineTodayMarker({ date = new Date() }, ref) {
    return (
      <div
        ref={ref}
        data-testid="today-marker"
        role="status"
        aria-live="polite"
        aria-label={`Today is ${formatEventDate(date)}`}
        className="relative flex items-center w-full py-4 z-20"
      >
        {/* Left line */}
        <div className="flex-1 h-0.5 bg-red-500" />

        {/* Center label */}
        <div className="flex items-center gap-1.5 px-4 py-1.5 bg-red-500 text-white text-sm font-bold rounded-full shadow-lg mx-2">
          <MapPin className="w-4 h-4" />
          <span>TODAY</span>
          <span className="hidden sm:inline">· {formatEventDate(date)}</span>
        </div>

        {/* Right line */}
        <div className="flex-1 h-0.5 bg-red-500" />
      </div>
    );
  }
);
