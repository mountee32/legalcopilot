"use client";

import { Card } from "@/components/ui/card";
import type { UnifiedEvent } from "./types";
import { isPastEvent, isFutureEvent, getDaysBetween } from "./utils";

interface TimelineStatsProps {
  events: UnifiedEvent[];
}

export function TimelineStats({ events }: TimelineStatsProps) {
  const now = new Date();

  const completedCount = events.filter((e) => isPastEvent(e.date, now)).length;
  const upcomingCount = events.filter(
    (e) => isFutureEvent(e.date, now) || e.date.toDateString() === now.toDateString()
  ).length;

  const sortedEvents = [...events].sort((a, b) => a.date.getTime() - b.date.getTime());
  const earliestEvent = sortedEvents[0];
  const daysActive = earliestEvent ? getDaysBetween(earliestEvent.date, now) : 0;

  // Find next upcoming calendar event (deadline, hearing, etc.)
  const upcomingCalendarEvents = events
    .filter((e) => e.source === "calendar" && e.date >= now)
    .sort((a, b) => a.date.getTime() - b.date.getTime());
  const nextDeadline = upcomingCalendarEvents[0];
  const daysToNext = nextDeadline ? getDaysBetween(now, nextDeadline.date) : null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card className="p-4 border-slate-200">
        <div className="text-2xl font-bold text-slate-800">{completedCount}</div>
        <div className="text-sm text-slate-500">Events completed</div>
      </Card>

      <Card className="p-4 border-slate-200">
        <div className="text-2xl font-bold text-blue-600">{upcomingCount}</div>
        <div className="text-sm text-slate-500">Upcoming</div>
      </Card>

      <Card className="p-4 border-slate-200">
        <div className="text-2xl font-bold text-slate-800">{daysActive}</div>
        <div className="text-sm text-slate-500">Days active</div>
      </Card>

      <Card className="p-4 border-slate-200">
        <div className="text-2xl font-bold text-emerald-600">
          {daysToNext !== null ? `${daysToNext}d` : "—"}
        </div>
        <div className="text-sm text-slate-500">Next deadline</div>
      </Card>
    </div>
  );
}
