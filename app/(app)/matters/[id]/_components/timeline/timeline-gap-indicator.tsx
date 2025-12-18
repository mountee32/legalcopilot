"use client";

interface TimelineGapIndicatorProps {
  days: number;
}

export function TimelineGapIndicator({ days }: TimelineGapIndicatorProps) {
  return (
    <div className="flex items-center justify-center py-1">
      <div className="text-xs text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-200">
        ← {days} days →
      </div>
    </div>
  );
}
