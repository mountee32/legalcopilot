"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, subMonths, addMonths } from "date-fns";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TimelineEventCard } from "./timeline-event-card";
import { TimelineTodayMarker } from "./timeline-today-marker";
import { TimelineMonthHeader } from "./timeline-month-header";
import { TimelineGapIndicator } from "./timeline-gap-indicator";
import { TimelineStats } from "./timeline-stats";
import { TimelineEmpty } from "./timeline-empty";
import { type UnifiedEvent, TIMELINE_TYPE_MAP } from "./types";
import {
  calculateGap,
  getDaysBetween,
  getMonthKey,
  isPastEvent,
  isFutureEvent,
  COMPACT_GAP,
} from "./utils";

interface UnifiedTimelineProps {
  matterId: string;
}

async function fetchMatterTimeline(matterId: string) {
  const res = await fetch(`/api/matters/${matterId}/timeline?limit=100`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch timeline");
  return res.json();
}

async function fetchMatterCalendar(matterId: string, from: string, to: string) {
  const res = await fetch(`/api/calendar?matterId=${matterId}&from=${from}&to=${to}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch calendar");
  return res.json();
}

type ViewMode = "proportional" | "compact";

export function UnifiedTimeline({ matterId }: UnifiedTimelineProps) {
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== "undefined") {
      return (sessionStorage.getItem("timeline-view-mode") as ViewMode) || "proportional";
    }
    return "proportional";
  });

  const todayRef = useRef<HTMLDivElement>(null);
  const now = useMemo(() => new Date(), []);

  // Persist view mode
  useEffect(() => {
    sessionStorage.setItem("timeline-view-mode", viewMode);
  }, [viewMode]);

  // Fetch timeline events
  const { data: timelineData, isLoading: timelineLoading } = useQuery({
    queryKey: ["matter-timeline", matterId],
    queryFn: () => fetchMatterTimeline(matterId),
    staleTime: 30_000,
  });

  // Fetch calendar events (6 months back, 6 months ahead)
  const sixMonthsAgo = format(subMonths(now, 6), "yyyy-MM-dd'T'00:00:00'Z'");
  const sixMonthsAhead = format(addMonths(now, 6), "yyyy-MM-dd'T'23:59:59'Z'");

  const { data: calendarData, isLoading: calendarLoading } = useQuery({
    queryKey: ["matter-calendar", matterId],
    queryFn: () => fetchMatterCalendar(matterId, sixMonthsAgo, sixMonthsAhead),
    staleTime: 60_000,
  });

  // Merge and sort events
  const unifiedEvents = useMemo<UnifiedEvent[]>(() => {
    const timeline = (timelineData?.events || []).map((e: any) => ({
      id: e.id,
      date: new Date(e.occurredAt),
      title: e.title,
      description: e.description,
      source: "timeline" as const,
      eventType: e.type,
      displayCategory: TIMELINE_TYPE_MAP[e.type] || "other",
      actorType: e.actorType,
      metadata: e.metadata,
    }));

    const calendar = (calendarData?.events || []).map((e: any) => ({
      id: e.id,
      date: new Date(e.startAt),
      title: e.title,
      description: e.description,
      source: "calendar" as const,
      eventType: e.eventType,
      displayCategory: "calendar" as const,
      startTime: e.allDay ? null : format(new Date(e.startAt), "HH:mm"),
      endTime: e.endAt && !e.allDay ? format(new Date(e.endAt), "HH:mm") : null,
      location: e.location,
      allDay: e.allDay,
      priority: e.priority,
    }));

    return [...timeline, ...calendar].sort(
      (a, b) => b.date.getTime() - a.date.getTime() // Most recent first
    );
  }, [timelineData, calendarData]);

  // Scroll to TODAY on load
  useEffect(() => {
    if (unifiedEvents.length > 0 && todayRef.current) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        todayRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [unifiedEvents.length]);

  const isLoading = timelineLoading || calendarLoading;

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (unifiedEvents.length === 0) {
    return <TimelineEmpty />;
  }

  // Find TODAY position (with newest-first order, find first past event)
  const todayIndex = unifiedEvents.findIndex((e) => isPastEvent(e.date, now));
  const insertTodayAt = todayIndex === -1 ? unifiedEvents.length : todayIndex;

  // Build timeline items with month headers and gaps
  const timelineItems: Array<{
    type: "event" | "today" | "month" | "gap";
    event?: UnifiedEvent;
    date?: Date;
    days?: number;
    index?: number;
  }> = [];

  let lastMonth: string | null = null;
  let lastDate: Date | null = null;

  unifiedEvents.forEach((event, idx) => {
    const monthKey = getMonthKey(event.date);

    // Insert month header if new month
    if (monthKey !== lastMonth) {
      timelineItems.push({ type: "month", date: event.date });
      lastMonth = monthKey;
    }

    // Insert TODAY marker at correct position
    if (idx === insertTodayAt) {
      timelineItems.push({ type: "today", date: now });
    }

    // Calculate gap from previous event
    if (lastDate && viewMode === "proportional") {
      const daysBetween = getDaysBetween(lastDate, event.date);
      const { showIndicator } = calculateGap(daysBetween);
      if (showIndicator) {
        timelineItems.push({ type: "gap", days: daysBetween });
      }
    }

    timelineItems.push({ type: "event", event, index: idx });
    lastDate = event.date;
  });

  // If all events are in the future (no past events), add TODAY at the end
  if (insertTodayAt === unifiedEvents.length) {
    timelineItems.push({ type: "today", date: now });
  }

  return (
    <div className="space-y-6">
      {/* View Mode Toggle */}
      <div className="flex gap-2">
        <Button
          variant={viewMode === "proportional" ? "default" : "outline"}
          size="sm"
          onClick={() => setViewMode("proportional")}
        >
          Proportional
        </Button>
        <Button
          variant={viewMode === "compact" ? "default" : "outline"}
          size="sm"
          onClick={() => setViewMode("compact")}
        >
          Compact
        </Button>
      </div>

      {/* Timeline Container */}
      <div className="relative bg-white rounded-2xl border border-slate-200 p-6 overflow-hidden">
        {/* Central axis line */}
        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-slate-200 -translate-x-1/2 hidden md:block" />

        {/* Timeline Items */}
        <div className="space-y-0">
          {timelineItems.map((item, idx) => {
            if (item.type === "month" && item.date) {
              return <TimelineMonthHeader key={`month-${idx}`} date={item.date} />;
            }

            if (item.type === "today") {
              return <TimelineTodayMarker key="today" ref={todayRef} date={now} />;
            }

            if (item.type === "gap" && item.days) {
              return <TimelineGapIndicator key={`gap-${idx}`} days={item.days} />;
            }

            if (item.type === "event" && item.event && item.index !== undefined) {
              const side = item.index % 2 === 0 ? "left" : "right";
              const isPast = isPastEvent(item.event.date, now);

              // Calculate dynamic gap for proportional mode
              let marginTop = COMPACT_GAP;
              if (viewMode === "proportional" && idx > 0) {
                const prevEventItem = timelineItems
                  .slice(0, idx)
                  .reverse()
                  .find((i) => i.type === "event");
                if (prevEventItem?.event) {
                  const daysBetween = getDaysBetween(prevEventItem.event.date, item.event.date);
                  marginTop = calculateGap(daysBetween).gap;
                }
              }

              return (
                <div
                  key={item.event.id}
                  className="relative flex items-start md:items-center"
                  style={{ marginTop: idx === 0 ? 0 : marginTop }}
                >
                  {/* Desktop: Centered layout */}
                  <div className="hidden md:flex w-full items-center">
                    {/* Left side */}
                    <div className="flex-1 pr-8">
                      {side === "left" && (
                        <div className="flex justify-end">
                          <div className="max-w-sm w-full">
                            <TimelineEventCard
                              event={item.event}
                              side="left"
                              isCompact={viewMode === "compact"}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Center dot */}
                    <div className="relative z-10 flex-shrink-0">
                      <div
                        className={`w-3 h-3 rounded-full border-2 border-white shadow-sm ${
                          item.event.source === "calendar"
                            ? "bg-orange-500 rotate-45"
                            : isPast
                              ? "bg-slate-400"
                              : "bg-blue-500"
                        }`}
                        style={{
                          clipPath:
                            item.event.source === "calendar"
                              ? "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)"
                              : undefined,
                        }}
                      />
                    </div>

                    {/* Right side */}
                    <div className="flex-1 pl-8">
                      {side === "right" && (
                        <div className="max-w-sm w-full">
                          <TimelineEventCard
                            event={item.event}
                            side="right"
                            isCompact={viewMode === "compact"}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Mobile: Single column */}
                  <div className="md:hidden flex items-start gap-4 w-full">
                    <div className="flex-shrink-0 flex flex-col items-center">
                      <div
                        className={`w-3 h-3 rounded-full border-2 border-white shadow-sm ${
                          item.event.source === "calendar"
                            ? "bg-orange-500"
                            : isPast
                              ? "bg-slate-400"
                              : "bg-blue-500"
                        }`}
                      />
                      <div className="w-0.5 flex-1 bg-slate-200 min-h-[40px]" />
                    </div>
                    <div className="flex-1 pb-4">
                      <TimelineEventCard
                        event={item.event}
                        side="right"
                        isCompact={viewMode === "compact"}
                      />
                    </div>
                  </div>
                </div>
              );
            }

            return null;
          })}
        </div>
      </div>

      {/* Statistics */}
      <TimelineStats events={unifiedEvents} />
    </div>
  );
}
