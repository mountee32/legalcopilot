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
import { EventFormDialog } from "@/components/calendar/EventFormDialog";

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
  if (priority === "critical") return "bg-red-100 border-red-200 text-red-700";
  if (eventType === "limitation_date" || eventType === "filing_deadline")
    return "bg-amber-100 border-amber-200 text-amber-700";
  if (eventType === "hearing") return "bg-blue-100 border-blue-200 text-blue-700";
  if (eventType === "deadline") return "bg-orange-100 border-orange-200 text-orange-700";
  return "bg-slate-100 border-slate-200 text-slate-700";
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
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
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
    <div className="min-h-screen bg-slate-50">
      <Tabs defaultValue="month">
        {/* Header */}
        <div className="bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto p-6 md:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Calendar</h1>
                <p className="text-slate-600 mt-1">Events & Deadlines</p>
              </div>
              <Button size="sm" onClick={() => setIsEventDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Event
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <TabsList>
                <TabsTrigger value="month">Month</TabsTrigger>
                <TabsTrigger value="agenda">Agenda</TabsTrigger>
              </TabsList>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={goToToday}>
                  Today
                </Button>
                <Button variant="ghost" size="icon" onClick={prevMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="min-w-[180px] text-center">
                  <h2 className="text-lg font-semibold text-slate-900">
                    {format(currentMonth, "MMMM yyyy")}
                  </h2>
                </div>
                <Button variant="ghost" size="icon" onClick={nextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto p-6 md:p-8">
          <TabsContent value="month" className="space-y-4">
            {isLoading ? (
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: 42 }).map((_, i) => (
                  <Skeleton key={i} className="h-32" />
                ))}
              </div>
            ) : (
              <Card className="overflow-hidden">
                <div className="grid grid-cols-7 border-b border-slate-200">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                    <div
                      key={day}
                      className="p-3 text-center text-xs font-medium uppercase tracking-wider text-slate-500 border-r border-slate-200 last:border-r-0"
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
                        className={`min-h-[120px] p-2 border-r border-b border-slate-200 last:border-r-0 cursor-pointer transition-all hover:bg-slate-100 ${
                          !isCurrentMonth ? "opacity-40" : ""
                        } ${isSelected ? "bg-slate-100 ring-1 ring-slate-300 ring-inset" : ""}`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span
                            className={`text-sm ${
                              isDateToday
                                ? "bg-slate-900 text-white px-2 py-0.5 rounded-md font-semibold"
                                : isCurrentMonth
                                  ? "text-slate-900"
                                  : "text-slate-400"
                            }`}
                          >
                            {format(day, "d")}
                          </span>
                          {dayEvents.length > 0 && (
                            <span className="text-xs font-medium text-slate-500">
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
                            <div className="text-xs text-slate-500 px-2">
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
                  <Skeleton key={i} className="h-24" />
                ))}
              </div>
            ) : events.length === 0 ? (
              <Card className="p-12 text-center">
                <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No events scheduled</h3>
                <p className="text-sm text-slate-600 mb-6">
                  Create events or connect your calendar to see them here
                </p>
                <Button onClick={() => setIsEventDialogOpen(true)}>
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
                      <h3 className="text-lg font-semibold text-slate-900">
                        {format(parseISO(date), "EEEE, d MMMM")}
                      </h3>
                      <span className="text-xs text-slate-500">
                        {dateEvents.length} {dateEvents.length === 1 ? "event" : "events"}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {dateEvents.map((event) => (
                        <Card
                          key={event.id}
                          className="hover:shadow-sm transition-all cursor-pointer group"
                        >
                          <div className="p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 space-y-2">
                                <div className="flex items-start gap-3">
                                  <div className="text-2xl leading-none pt-1">
                                    {getEventIcon(event.eventType)}
                                  </div>
                                  <div className="flex-1">
                                    <h4 className="font-semibold text-base text-slate-900 mb-1">
                                      {event.title}
                                    </h4>
                                    {event.description && (
                                      <p className="text-sm text-slate-600 line-clamp-2">
                                        {event.description}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                                  {!event.allDay && (
                                    <div className="flex items-center gap-1.5">
                                      <Clock className="h-3.5 w-3.5" />
                                      <span className="text-xs">
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
                                      <span className="text-xs">View Matter</span>
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
                                    className="bg-red-100 border-red-200 text-red-700 text-xs"
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

          {/* AI Suggestions Section */}
          {events.length > 0 && (
            <Card className="mt-8 bg-slate-100 border-slate-200">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Sparkles className="h-5 w-5 text-slate-600" />
                  <h3 className="text-lg font-semibold text-slate-900">AI Calendar Assistant</h3>
                </div>
                <p className="text-sm text-slate-600 mb-4">
                  Review AI-suggested calendar items based on your matters and deadlines
                </p>
                <Button variant="outline">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Suggest Calendar Items
                </Button>
              </div>
            </Card>
          )}
        </div>
      </Tabs>

      <EventFormDialog open={isEventDialogOpen} onOpenChange={setIsEventDialogOpen} />
    </div>
  );
}
