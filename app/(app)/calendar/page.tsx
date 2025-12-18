"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  format,
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
} from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  FileText,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/lib/hooks/use-toast";

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  eventType:
    | "hearing"
    | "deadline"
    | "meeting"
    | "reminder"
    | "limitation_date"
    | "filing_deadline"
    | "other";
  status: string;
  priority: "low" | "medium" | "high" | "critical";
  startAt: string;
  endAt?: string;
  allDay: boolean;
  location?: string;
  matterId?: string;
}

interface CalendarResponse {
  events: CalendarEvent[];
}

async function fetchEvents(from: string, to: string): Promise<CalendarResponse> {
  const res = await fetch(`/api/calendar?from=${from}&to=${to}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch calendar events");
  return res.json();
}

function getEventColor(eventType: string, priority: string) {
  if (priority === "critical") return "bg-red-900/20 border-red-900/30 text-red-100";
  if (eventType === "limitation_date" || eventType === "filing_deadline")
    return "bg-amber-900/20 border-amber-900/30 text-amber-100";
  if (eventType === "hearing") return "bg-blue-900/20 border-blue-900/30 text-blue-100";
  if (eventType === "deadline") return "bg-orange-900/20 border-orange-900/30 text-orange-100";
  return "bg-slate-700/20 border-slate-700/30 text-slate-300";
}

function getEventIcon(eventType: string) {
  if (eventType === "hearing") return "⚖️";
  if (eventType === "deadline" || eventType === "filing_deadline") return "📅";
  if (eventType === "limitation_date") return "⚠️";
  if (eventType === "meeting") return "👥";
  return "📌";
}

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const { toast } = useToast();

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const { data, isLoading } = useQuery({
    queryKey: ["calendar", format(calendarStart, "yyyy-MM-dd"), format(calendarEnd, "yyyy-MM-dd")],
    queryFn: () =>
      fetchEvents(
        format(calendarStart, "yyyy-MM-dd'T'00:00:00'Z'"),
        format(calendarEnd, "yyyy-MM-dd'T'23:59:59'Z'")
      ),
    staleTime: 60_000,
  });

  const events = data?.events || [];

  const getEventsForDate = (date: Date) => {
    return events.filter((event) => {
      const eventDate = parseISO(event.startAt);
      return isSameDay(eventDate, date);
    });
  };

  const getDaysArray = () => {
    const days = [];
    let day = calendarStart;
    while (day <= calendarEnd) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  };

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToToday = () => {
    setCurrentMonth(new Date());
    setSelectedDate(new Date());
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Subtle paper texture overlay */}
      <div className="fixed inset-0 opacity-[0.015] pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNhKSIvPjwvc3ZnPg==')]" />

      <div className="relative p-6 md:p-8 max-w-7xl mx-auto">
        {/* Header with elegant serif typography */}
        <div className="mb-8">
          <div className="flex items-baseline gap-4 mb-2">
            <h1 className="text-4xl font-serif font-light tracking-tight text-amber-50">
              Calendar
            </h1>
            <span className="text-sm font-mono text-amber-600/60 tracking-wider uppercase">
              Events & Deadlines
            </span>
          </div>
          <div className="h-[1px] bg-gradient-to-r from-amber-600/40 via-amber-600/10 to-transparent mt-3" />
        </div>

        <Tabs defaultValue="month" className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <TabsList className="bg-slate-900/50 border border-slate-800/50">
              <TabsTrigger
                value="month"
                className="data-[state=active]:bg-amber-900/30 data-[state=active]:text-amber-50"
              >
                Month
              </TabsTrigger>
              <TabsTrigger
                value="agenda"
                className="data-[state=active]:bg-amber-900/30 data-[state=active]:text-amber-50"
              >
                Agenda
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={goToToday}
                className="border-slate-700/50 bg-slate-900/30 hover:bg-slate-800/50 text-slate-300 hover:text-amber-50"
              >
                Today
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={prevMonth}
                className="hover:bg-slate-800/50 text-slate-400 hover:text-amber-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="min-w-[180px] text-center">
                <h2 className="text-lg font-serif text-amber-50">
                  {format(currentMonth, "MMMM yyyy")}
                </h2>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={nextMonth}
                className="hover:bg-slate-800/50 text-slate-400 hover:text-amber-50"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                className="ml-2 bg-amber-900/30 hover:bg-amber-900/50 text-amber-50 border border-amber-800/30"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Event
              </Button>
            </div>
          </div>

          <TabsContent value="month" className="space-y-4">
            {isLoading ? (
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: 42 }).map((_, i) => (
                  <Skeleton key={i} className="h-32 bg-slate-800/30" />
                ))}
              </div>
            ) : (
              <Card className="bg-slate-900/40 border-slate-800/50 backdrop-blur-sm overflow-hidden">
                <div className="grid grid-cols-7 border-b border-slate-800/50">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                    <div
                      key={day}
                      className="p-3 text-center text-xs font-mono uppercase tracking-wider text-amber-600/70 border-r border-slate-800/30 last:border-r-0"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7">
                  {getDaysArray().map((day, idx) => {
                    const dayEvents = getEventsForDate(day);
                    const isCurrentMonth = isSameMonth(day, currentMonth);
                    const isDateToday = isToday(day);
                    const isSelected = selectedDate && isSameDay(day, selectedDate);

                    return (
                      <div
                        key={idx}
                        onClick={() => setSelectedDate(day)}
                        className={`min-h-[120px] p-2 border-r border-b border-slate-800/30 last:border-r-0 cursor-pointer transition-all hover:bg-slate-800/20 ${
                          !isCurrentMonth ? "opacity-40" : ""
                        } ${isSelected ? "bg-amber-900/10 ring-1 ring-amber-800/30 ring-inset" : ""}`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span
                            className={`text-sm font-mono ${
                              isDateToday
                                ? "bg-amber-900/40 text-amber-50 px-2 py-0.5 rounded-md font-semibold"
                                : isCurrentMonth
                                  ? "text-slate-300"
                                  : "text-slate-600"
                            }`}
                          >
                            {format(day, "d")}
                          </span>
                          {dayEvents.length > 0 && (
                            <span className="text-xs font-mono text-amber-600/70">
                              {dayEvents.length}
                            </span>
                          )}
                        </div>

                        <div className="space-y-1">
                          {dayEvents.slice(0, 3).map((event) => (
                            <div
                              key={event.id}
                              className={`text-xs px-2 py-1 rounded border ${getEventColor(event.eventType, event.priority)}`}
                            >
                              <div className="flex items-start gap-1">
                                <span className="text-xs leading-none">
                                  {getEventIcon(event.eventType)}
                                </span>
                                <span className="line-clamp-1 font-medium">{event.title}</span>
                              </div>
                              {!event.allDay && (
                                <div className="text-xs opacity-70 mt-0.5 font-mono">
                                  {format(parseISO(event.startAt), "HH:mm")}
                                </div>
                              )}
                            </div>
                          ))}
                          {dayEvents.length > 3 && (
                            <div className="text-xs text-amber-600/60 px-2">
                              +{dayEvents.length - 3} more
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="agenda" className="space-y-4">
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 bg-slate-800/30" />
                ))}
              </div>
            ) : events.length === 0 ? (
              <Card className="bg-slate-900/40 border-slate-800/50 backdrop-blur-sm p-12 text-center">
                <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-slate-600" />
                <h3 className="text-lg font-serif text-slate-300 mb-2">No events scheduled</h3>
                <p className="text-sm text-slate-500 mb-6">
                  Create events or connect your calendar to see them here
                </p>
                <Button className="bg-amber-900/30 hover:bg-amber-900/50 text-amber-50 border border-amber-800/30">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Event
                </Button>
              </Card>
            ) : (
              <div className="space-y-6">
                {Object.entries(
                  events
                    .sort((a, b) => parseISO(a.startAt).getTime() - parseISO(b.startAt).getTime())
                    .reduce(
                      (acc, event) => {
                        const date = format(parseISO(event.startAt), "yyyy-MM-dd");
                        if (!acc[date]) acc[date] = [];
                        acc[date].push(event);
                        return acc;
                      },
                      {} as Record<string, CalendarEvent[]>
                    )
                ).map(([date, dateEvents]) => (
                  <div key={date} className="space-y-3">
                    <div className="flex items-baseline gap-3">
                      <h3 className="text-lg font-serif text-amber-50">
                        {format(parseISO(date), "EEEE, d MMMM")}
                      </h3>
                      <span className="text-xs font-mono text-slate-500 tracking-wider">
                        {dateEvents.length} {dateEvents.length === 1 ? "event" : "events"}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {dateEvents.map((event) => (
                        <Card
                          key={event.id}
                          className="bg-slate-900/40 border-slate-800/50 backdrop-blur-sm hover:bg-slate-800/40 transition-all cursor-pointer group"
                        >
                          <div className="p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 space-y-2">
                                <div className="flex items-start gap-3">
                                  <div className="text-2xl leading-none pt-1">
                                    {getEventIcon(event.eventType)}
                                  </div>
                                  <div className="flex-1">
                                    <h4 className="font-serif text-base text-amber-50 mb-1 group-hover:text-amber-200 transition-colors">
                                      {event.title}
                                    </h4>
                                    {event.description && (
                                      <p className="text-sm text-slate-400 line-clamp-2">
                                        {event.description}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
                                  {!event.allDay && (
                                    <div className="flex items-center gap-1.5">
                                      <Clock className="h-3.5 w-3.5" />
                                      <span className="font-mono text-xs">
                                        {format(parseISO(event.startAt), "HH:mm")}
                                        {event.endAt &&
                                          ` - ${format(parseISO(event.endAt), "HH:mm")}`}
                                      </span>
                                    </div>
                                  )}
                                  {event.location && (
                                    <div className="flex items-center gap-1.5">
                                      <MapPin className="h-3.5 w-3.5" />
                                      <span className="text-xs">{event.location}</span>
                                    </div>
                                  )}
                                  {event.matterId && (
                                    <div className="flex items-center gap-1.5">
                                      <FileText className="h-3.5 w-3.5" />
                                      <span className="text-xs font-mono">View Matter</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="flex flex-col items-end gap-2">
                                <Badge
                                  variant="outline"
                                  className={`${getEventColor(event.eventType, event.priority)} border text-xs`}
                                >
                                  {event.eventType.replace(/_/g, " ")}
                                </Badge>
                                {event.priority === "critical" && (
                                  <Badge
                                    variant="outline"
                                    className="bg-red-900/20 border-red-900/30 text-red-100 text-xs"
                                  >
                                    Critical
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* AI Suggestions Section */}
        {events.length > 0 && (
          <Card className="mt-8 bg-gradient-to-br from-amber-950/20 to-amber-900/10 border-amber-800/30 backdrop-blur-sm">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Sparkles className="h-5 w-5 text-amber-500" />
                <h3 className="font-serif text-lg text-amber-50">AI Calendar Assistant</h3>
              </div>
              <p className="text-sm text-slate-400 mb-4">
                Review AI-suggested calendar items based on your matters and deadlines
              </p>
              <Button
                variant="outline"
                className="border-amber-800/30 bg-amber-900/20 hover:bg-amber-900/40 text-amber-100"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Suggest Calendar Items
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
