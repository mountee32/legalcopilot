"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  MoreVertical,
  FileText,
  Mail,
  CheckSquare,
  Clock,
  MessageSquare,
  Sparkles,
  Calendar as CalendarIcon,
  ListTodo,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/lib/hooks/use-toast";
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
  isPast,
  isFuture,
} from "date-fns";
import type { Matter } from "@/lib/api/schemas/matters";

async function fetchMatter(id: string): Promise<Matter> {
  const res = await fetch(`/api/matters/${id}`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch matter");
  return res.json();
}

async function fetchMatterTimeline(id: string) {
  const res = await fetch(`/api/matters/${id}/timeline`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch timeline");
  return res.json();
}

async function fetchMatterDocuments(matterId: string) {
  const res = await fetch(`/api/documents?matterId=${matterId}`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch documents");
  return res.json();
}

async function fetchMatterTasks(matterId: string) {
  const res = await fetch(`/api/tasks?matterId=${matterId}`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch tasks");
  return res.json();
}

async function fetchMatterEmails(matterId: string) {
  const res = await fetch(`/api/emails?matterId=${matterId}`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch emails");
  return res.json();
}

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  eventType: string;
  status: string;
  priority: "low" | "medium" | "high" | "critical";
  startAt: string;
  endAt?: string;
  allDay: boolean;
  location?: string;
}

async function fetchMatterCalendar(matterId: string, from: string, to: string) {
  const res = await fetch(`/api/calendar?matterId=${matterId}&from=${from}&to=${to}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch calendar events");
  return res.json();
}

function RiskIndicator({ score }: { score: number | null }) {
  if (score === null) return null;

  const config =
    score >= 70
      ? { color: "text-red-600", bg: "bg-red-100", label: "High Risk" }
      : score >= 40
        ? { color: "text-amber-600", bg: "bg-amber-100", label: "Medium" }
        : { color: "text-emerald-600", bg: "bg-emerald-100", label: "Low Risk" };

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${config.bg}`}>
      <div className={`w-2 h-2 rounded-full ${config.color.replace("text-", "bg-")}`} />
      <span className={`text-sm font-medium ${config.color}`}>{config.label}</span>
    </div>
  );
}

function OverviewTab({ matter }: { matter: Matter }) {
  return (
    <div className="grid md:grid-cols-3 gap-6">
      <div className="md:col-span-2 space-y-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Case Details</h3>
          <dl className="grid grid-cols-2 gap-4">
            <div>
              <dt className="text-sm text-slate-500 mb-1">Reference</dt>
              <dd className="text-sm font-mono font-medium">{matter.reference}</dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500 mb-1">Practice Area</dt>
              <dd className="text-sm">{matter.practiceArea.replace("_", " ").toUpperCase()}</dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500 mb-1">Billing Type</dt>
              <dd className="text-sm">{matter.billingType.replace("_", " ").toUpperCase()}</dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500 mb-1">Status</dt>
              <dd>
                <Badge variant={matter.status === "active" ? "default" : "secondary"}>
                  {matter.status.replace("_", " ").toUpperCase()}
                </Badge>
              </dd>
            </div>
            {matter.keyDeadline && (
              <div>
                <dt className="text-sm text-slate-500 mb-1">Key Deadline</dt>
                <dd className="text-sm font-medium text-red-600">
                  {format(new Date(matter.keyDeadline), "d MMMM yyyy")}
                </dd>
              </div>
            )}
            {matter.openedAt && (
              <div>
                <dt className="text-sm text-slate-500 mb-1">Opened</dt>
                <dd className="text-sm">{format(new Date(matter.openedAt), "d MMM yyyy")}</dd>
              </div>
            )}
          </dl>
        </Card>

        {matter.description && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Description</h3>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
              {matter.description}
            </p>
          </Card>
        )}

        {matter.notes && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Notes</h3>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
              {matter.notes}
            </p>
          </Card>
        )}
      </div>

      <div className="space-y-6">
        <Card className="p-6">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-4">
            Risk Assessment
          </h3>
          <RiskIndicator score={matter.riskScore} />
          {matter.riskAssessedAt && (
            <p className="text-xs text-slate-500 mt-3">
              Last assessed {format(new Date(matter.riskAssessedAt), "d MMM yyyy")}
            </p>
          )}
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-4">
            AI Actions
          </h3>
          <div className="space-y-2">
            <Button variant="outline" size="sm" className="w-full justify-start">
              <MessageSquare className="w-4 h-4 mr-2" />
              Ask AI about this case
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start">
              <ListTodo className="w-4 h-4 mr-2" />
              Generate tasks
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start">
              <CalendarIcon className="w-4 h-4 mr-2" />
              Suggest calendar items
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

function TimelineTab({ matterId }: { matterId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["matter-timeline", matterId],
    queryFn: () => fetchMatterTimeline(matterId),
    staleTime: 30_000,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    );
  }

  if (!data || data.events?.length === 0) {
    return (
      <Card className="p-8">
        <EmptyState
          title="No timeline events"
          description="Timeline events will appear here as actions are taken on this case."
        />
      </Card>
    );
  }

  const getEventIcon = (type: string) => {
    switch (type) {
      case "document_uploaded":
      case "document_summarized":
      case "document_extracted":
        return <FileText className="w-4 h-4 text-blue-600" />;
      case "email_sent":
      case "email_received":
        return <Mail className="w-4 h-4 text-green-600" />;
      case "task_created":
      case "task_completed":
        return <CheckSquare className="w-4 h-4 text-purple-600" />;
      case "calendar_event_created":
        return <CalendarIcon className="w-4 h-4 text-orange-600" />;
      case "conflict_check_run":
      case "conflict_check_cleared":
        return <Sparkles className="w-4 h-4 text-amber-600" />;
      case "matter_created":
        return <FileText className="w-4 h-4 text-emerald-600" />;
      default:
        return <Clock className="w-4 h-4 text-slate-600" />;
    }
  };

  const getActorBadge = (actorType: string) => {
    switch (actorType) {
      case "ai":
        return (
          <Badge variant="secondary" className="text-xs">
            AI
          </Badge>
        );
      case "system":
        return (
          <Badge variant="outline" className="text-xs">
            System
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {data.events.map((event: any) => (
        <Card key={event.id} className="p-4">
          <div className="flex items-start gap-3">
            <div className="mt-1">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                {getEventIcon(event.type)}
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-medium text-slate-900">{event.title}</p>
                {getActorBadge(event.actorType)}
              </div>
              {event.description && (
                <p className="text-sm text-slate-600 mb-2">{event.description}</p>
              )}
              <p className="text-xs text-slate-500">
                {format(new Date(event.occurredAt), "d MMM yyyy 'at' HH:mm")}
              </p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function DocumentsTab({ matterId }: { matterId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["matter-documents", matterId],
    queryFn: () => fetchMatterDocuments(matterId),
    staleTime: 30_000,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-16" />
        ))}
      </div>
    );
  }

  if (!data || data.documents?.length === 0) {
    return (
      <Card className="p-8">
        <EmptyState
          title="No documents yet"
          description="Documents will appear here when uploaded to this case."
          action={
            <Button>
              <FileText className="w-4 h-4 mr-2" />
              Upload Document
            </Button>
          }
        />
      </Card>
    );
  }

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: "default" | "secondary" | "outline"; label: string }> =
      {
        draft: { variant: "secondary", label: "Draft" },
        pending_review: { variant: "outline", label: "Pending Review" },
        approved: { variant: "default", label: "Approved" },
        sent: { variant: "default", label: "Sent" },
      };
    const c = config[status] || { variant: "secondary" as const, label: status };
    return <Badge variant={c.variant}>{c.label}</Badge>;
  };

  return (
    <div className="space-y-3">
      {data.documents.map((doc: any) => (
        <Card key={doc.id} className="p-4 hover:bg-slate-50 transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-slate-900 truncate">{doc.title}</p>
              <p className="text-sm text-slate-500">
                {doc.type?.replace("_", " ")} • {doc.filename || "No file"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {getStatusBadge(doc.status)}
              {doc.documentDate && (
                <span className="text-sm text-slate-500">
                  {format(new Date(doc.documentDate), "d MMM yyyy")}
                </span>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function TasksTab({ matterId }: { matterId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["matter-tasks", matterId],
    queryFn: () => fetchMatterTasks(matterId),
    staleTime: 30_000,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-16" />
        ))}
      </div>
    );
  }

  if (!data || data.tasks?.length === 0) {
    return (
      <Card className="p-8">
        <EmptyState
          title="No tasks yet"
          description="Tasks for this case will appear here."
          action={
            <Button>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Tasks with AI
            </Button>
          }
        />
      </Card>
    );
  }

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      urgent: "bg-red-100 text-red-700",
      high: "bg-orange-100 text-orange-700",
      medium: "bg-yellow-100 text-yellow-700",
      low: "bg-slate-100 text-slate-700",
    };
    return colors[priority] || colors.medium;
  };

  const getStatusIcon = (status: string) => {
    if (status === "completed") {
      return <CheckSquare className="w-5 h-5 text-green-600" />;
    }
    if (status === "in_progress") {
      return <Clock className="w-5 h-5 text-blue-600" />;
    }
    return <CheckSquare className="w-5 h-5 text-slate-400" />;
  };

  return (
    <div className="space-y-3">
      {data.tasks.map((task: any) => (
        <Card key={task.id} className="p-4 hover:bg-slate-50 transition-colors">
          <div className="flex items-start gap-4">
            <div className="mt-0.5">{getStatusIcon(task.status)}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p
                  className={`font-medium ${task.status === "completed" ? "text-slate-500 line-through" : "text-slate-900"}`}
                >
                  {task.title}
                </p>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${getPriorityColor(task.priority)}`}
                >
                  {task.priority}
                </span>
              </div>
              {task.description && (
                <p className="text-sm text-slate-600 line-clamp-2">{task.description}</p>
              )}
              {task.dueDate && (
                <p className="text-xs text-slate-500 mt-2">
                  Due: {format(new Date(task.dueDate), "d MMM yyyy")}
                </p>
              )}
            </div>
            <Badge
              variant={
                task.status === "completed"
                  ? "secondary"
                  : task.status === "in_progress"
                    ? "default"
                    : "outline"
              }
            >
              {task.status.replace("_", " ")}
            </Badge>
          </div>
        </Card>
      ))}
    </div>
  );
}

function EmailsTab({ matterId }: { matterId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["matter-emails", matterId],
    queryFn: () => fetchMatterEmails(matterId),
    staleTime: 30_000,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    );
  }

  if (!data || data.emails?.length === 0) {
    return (
      <Card className="p-8">
        <EmptyState
          title="No emails yet"
          description="Emails related to this case will appear here."
        />
      </Card>
    );
  }

  const getUrgencyBadge = (urgency: number | null) => {
    if (!urgency) return null;
    if (urgency >= 75) return <Badge variant="destructive">Urgent</Badge>;
    if (urgency >= 50) return <Badge variant="default">High</Badge>;
    return null;
  };

  const getSentimentColor = (sentiment: string | null) => {
    const colors: Record<string, string> = {
      frustrated: "border-l-red-500",
      negative: "border-l-orange-500",
      positive: "border-l-green-500",
      neutral: "border-l-slate-300",
    };
    return colors[sentiment || "neutral"] || colors.neutral;
  };

  return (
    <div className="space-y-3">
      {data.emails.map((email: any) => (
        <Card
          key={email.id}
          className={`p-4 border-l-4 ${getSentimentColor(email.aiSentiment)} hover:bg-slate-50 transition-colors`}
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
              <Mail className="w-5 h-5 text-slate-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-medium text-slate-900 truncate">{email.subject}</p>
                {getUrgencyBadge(email.aiUrgency)}
              </div>
              <p className="text-sm text-slate-600 mb-1">
                From: {email.fromAddress?.name || email.fromAddress?.email}
              </p>
              {email.aiSummary && (
                <p className="text-sm text-slate-500 line-clamp-2">{email.aiSummary}</p>
              )}
              <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                {email.aiIntent && (
                  <span className="capitalize">{email.aiIntent.replace("_", " ")}</span>
                )}
                {email.receivedAt && (
                  <span>{format(new Date(email.receivedAt), "d MMM yyyy HH:mm")}</span>
                )}
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function getCalendarEventColor(eventType: string, priority: string) {
  if (priority === "critical") return "bg-red-100 border-red-300 text-red-800";
  if (eventType === "limitation_date" || eventType === "filing_deadline")
    return "bg-amber-100 border-amber-300 text-amber-800";
  if (eventType === "hearing") return "bg-blue-100 border-blue-300 text-blue-800";
  if (eventType === "deadline") return "bg-orange-100 border-orange-300 text-orange-800";
  return "bg-slate-100 border-slate-300 text-slate-700";
}

function getCalendarEventIcon(eventType: string) {
  if (eventType === "hearing") return "⚖️";
  if (eventType === "deadline" || eventType === "filing_deadline") return "📅";
  if (eventType === "limitation_date") return "⚠️";
  if (eventType === "meeting") return "👥";
  return "📌";
}

function CalendarTab({ matterId }: { matterId: string }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  // Fetch 6 months of events (3 past, 3 future)
  const rangeStart = subMonths(new Date(), 3);
  const rangeEnd = addMonths(new Date(), 6);

  const { data, isLoading } = useQuery({
    queryKey: ["matter-calendar", matterId],
    queryFn: () =>
      fetchMatterCalendar(
        matterId,
        format(rangeStart, "yyyy-MM-dd'T'00:00:00'Z'"),
        format(rangeEnd, "yyyy-MM-dd'T'23:59:59'Z'")
      ),
    staleTime: 60_000,
  });

  const events: CalendarEvent[] = data?.events || [];

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

  // Group events by upcoming and past
  const upcomingEvents = events
    .filter((e) => isFuture(parseISO(e.startAt)) || isToday(parseISO(e.startAt)))
    .sort((a, b) => parseISO(a.startAt).getTime() - parseISO(b.startAt).getTime());
  const pastEvents = events
    .filter((e) => isPast(parseISO(e.startAt)) && !isToday(parseISO(e.startAt)))
    .sort((a, b) => parseISO(b.startAt).getTime() - parseISO(a.startAt).getTime());

  if (isLoading) {
    return (
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Skeleton className="h-80" />
        </div>
        <div className="md:col-span-2 space-y-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {/* Mini Calendar */}
      <div className="md:col-span-1">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" size="icon" onClick={prevMonth} className="h-8 w-8">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-center">
              <h3 className="font-semibold text-sm">{format(currentMonth, "MMMM yyyy")}</h3>
            </div>
            <Button variant="ghost" size="icon" onClick={nextMonth} className="h-8 w-8">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="mb-2">
            <Button variant="ghost" size="sm" onClick={goToToday} className="w-full text-xs">
              Today
            </Button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {["M", "T", "W", "T", "F", "S", "S"].map((day, idx) => (
              <div key={idx} className="text-center text-xs text-slate-500 font-medium py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-0.5">
            {getDaysArray().map((day, idx) => {
              const dayEvents = getEventsForDate(day);
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isDateToday = isToday(day);
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const hasEvents = dayEvents.length > 0;

              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDate(day)}
                  className={`aspect-square flex flex-col items-center justify-center text-xs rounded-md transition-colors relative ${
                    !isCurrentMonth ? "text-slate-300" : "text-slate-700"
                  } ${isDateToday ? "bg-blue-600 text-white font-semibold" : ""} ${
                    isSelected && !isDateToday ? "bg-slate-200 ring-1 ring-slate-400" : ""
                  } ${!isDateToday && isCurrentMonth ? "hover:bg-slate-100" : ""}`}
                >
                  {format(day, "d")}
                  {hasEvents && !isDateToday && (
                    <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-500" />
                  )}
                  {hasEvents && isDateToday && (
                    <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-4 pt-4 border-t border-slate-200">
            <p className="text-xs text-slate-500 mb-2">Event types</p>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <span>⚖️</span>
                <span className="text-slate-600">Hearing</span>
              </div>
              <div className="flex items-center gap-2">
                <span>📅</span>
                <span className="text-slate-600">Deadline</span>
              </div>
              <div className="flex items-center gap-2">
                <span>👥</span>
                <span className="text-slate-600">Meeting</span>
              </div>
              <div className="flex items-center gap-2">
                <span>⚠️</span>
                <span className="text-slate-600">Limitation Date</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Events List */}
      <div className="md:col-span-2 space-y-6">
        {events.length === 0 ? (
          <Card className="p-8">
            <EmptyState
              title="No calendar events"
              description="Calendar events for this case will appear here."
              action={
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Event
                </Button>
              }
            />
          </Card>
        ) : (
          <>
            {/* Upcoming Events */}
            {upcomingEvents.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  Upcoming ({upcomingEvents.length})
                </h3>
                <div className="space-y-2">
                  {upcomingEvents.map((event) => (
                    <Card
                      key={event.id}
                      className="p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-xl leading-none pt-0.5">
                          {getCalendarEventIcon(event.eventType)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="font-medium text-slate-900">{event.title}</h4>
                              {event.description && (
                                <p className="text-sm text-slate-500 line-clamp-1 mt-0.5">
                                  {event.description}
                                </p>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-1 flex-shrink-0">
                              <Badge
                                variant="outline"
                                className={`${getCalendarEventColor(event.eventType, event.priority)} text-xs`}
                              >
                                {event.eventType.replace(/_/g, " ")}
                              </Badge>
                              {event.priority === "critical" && (
                                <Badge variant="destructive" className="text-xs">
                                  Critical
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3 mt-2 text-sm text-slate-500">
                            <div className="flex items-center gap-1">
                              <CalendarIcon className="w-3.5 h-3.5" />
                              <span>{format(parseISO(event.startAt), "d MMM yyyy")}</span>
                            </div>
                            {!event.allDay && (
                              <div className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                <span className="font-mono text-xs">
                                  {format(parseISO(event.startAt), "HH:mm")}
                                  {event.endAt && ` - ${format(parseISO(event.endAt), "HH:mm")}`}
                                </span>
                              </div>
                            )}
                            {event.location && (
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5" />
                                <span>{event.location}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Past Events */}
            {pastEvents.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Past ({pastEvents.length})
                </h3>
                <div className="space-y-2">
                  {pastEvents.slice(0, 5).map((event) => (
                    <Card
                      key={event.id}
                      className="p-4 hover:bg-slate-50 transition-colors cursor-pointer opacity-70"
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-xl leading-none pt-0.5">
                          {getCalendarEventIcon(event.eventType)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-medium text-slate-700">{event.title}</h4>
                            <Badge variant="outline" className="text-xs">
                              {event.eventType.replace(/_/g, " ")}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 mt-2 text-sm text-slate-500">
                            <div className="flex items-center gap-1">
                              <CalendarIcon className="w-3.5 h-3.5" />
                              <span>{format(parseISO(event.startAt), "d MMM yyyy")}</span>
                            </div>
                            {!event.allDay && (
                              <span className="font-mono text-xs">
                                {format(parseISO(event.startAt), "HH:mm")}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                  {pastEvents.length > 5 && (
                    <Button variant="ghost" className="w-full text-slate-500">
                      Show {pastEvents.length - 5} more past events
                    </Button>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function MatterDetailPage() {
  const params = useParams();
  const router = useRouter();
  const matterId = params.id as string;
  const [activeTab, setActiveTab] = useState("overview");

  const {
    data: matter,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["matter", matterId],
    queryFn: () => fetchMatter(matterId),
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto p-6 md:p-8">
          <Skeleton className="h-8 w-32 mb-8" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (isError || !matter) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <Card className="p-8 max-w-md">
          <EmptyState
            title="Case not found"
            description="The case you're looking for doesn't exist or you don't have access."
            action={<Button onClick={() => router.push("/matters")}>Back to Cases</Button>}
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto p-6 md:p-8">
          <button
            onClick={() => router.push("/matters")}
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-6 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Cases
          </button>

          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-sm font-mono text-slate-500">{matter.reference}</span>
                <Badge variant={matter.status === "active" ? "default" : "secondary"}>
                  {matter.status.replace("_", " ").toUpperCase()}
                </Badge>
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">
                {matter.title}
              </h1>
              <div className="flex items-center gap-4 text-sm text-slate-600">
                <span className="font-medium">
                  {matter.practiceArea.replace("_", " ").toUpperCase()}
                </span>
                {matter.riskScore !== null && <RiskIndicator score={matter.riskScore} />}
              </div>
            </div>
            <Button variant="outline" size="sm">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto p-6 md:p-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white border border-slate-200 p-1">
            <TabsTrigger value="overview" className="gap-2">
              <FileText className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="timeline" className="gap-2">
              <Clock className="w-4 h-4" />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="documents" className="gap-2">
              <FileText className="w-4 h-4" />
              Documents
            </TabsTrigger>
            <TabsTrigger value="emails" className="gap-2">
              <Mail className="w-4 h-4" />
              Emails
            </TabsTrigger>
            <TabsTrigger value="tasks" className="gap-2">
              <CheckSquare className="w-4 h-4" />
              Tasks
            </TabsTrigger>
            <TabsTrigger value="calendar" className="gap-2">
              <CalendarIcon className="w-4 h-4" />
              Calendar
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <OverviewTab matter={matter} />
          </TabsContent>

          <TabsContent value="timeline">
            <TimelineTab matterId={matterId} />
          </TabsContent>

          <TabsContent value="documents">
            <DocumentsTab matterId={matterId} />
          </TabsContent>

          <TabsContent value="emails">
            <EmailsTab matterId={matterId} />
          </TabsContent>

          <TabsContent value="tasks">
            <TasksTab matterId={matterId} />
          </TabsContent>

          <TabsContent value="calendar">
            <CalendarTab matterId={matterId} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
