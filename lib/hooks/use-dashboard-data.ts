"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { isToday, isBefore, startOfDay, parseISO } from "date-fns";
import type { ApprovalItem, TaskItem, CalendarEvent, UrgentItem } from "@/components/dashboard";

interface ApprovalResponse {
  approvals: Array<{
    id: string;
    action: string;
    summary: string;
    status: string;
    entityType?: string;
    entityId?: string;
    matterId?: string;
    aiMetadata?: { confidence?: number; model?: string };
    createdAt: string;
  }>;
  pagination: { total: number };
}

interface TaskResponse {
  tasks: Array<{
    id: string;
    title: string;
    description?: string;
    status: string;
    priority: string;
    dueDate?: string;
    matterId: string;
    assigneeId?: string;
  }>;
  pagination: { total: number };
}

interface CalendarResponse {
  events: Array<{
    id: string;
    title: string;
    eventType: string;
    startAt: string;
    endAt?: string;
    matterId?: string;
    location?: string;
  }>;
}

interface MatterResponse {
  matters: Array<{
    id: string;
    status: string;
  }>;
  pagination: { total: number };
}

interface InvoiceResponse {
  invoices: Array<{
    id: string;
    status: string;
    total: string;
  }>;
  pagination: { total: number };
}

interface NotificationResponse {
  notifications: Array<{
    id: string;
    type: string;
    title: string;
    body?: string;
    read: boolean;
    entityType?: string;
    entityId?: string;
    createdAt: string;
  }>;
  pagination: { total: number };
}

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status}`);
  }
  return res.json();
}

export interface DashboardData {
  approvals: ApprovalItem[];
  approvalsTotal: number;
  tasks: TaskItem[];
  tasksTotal: number;
  calendarEvents: CalendarEvent[];
  urgentItems: UrgentItem[];
  activeCases: number;
  overdueInvoices: number;
  wipValue: number;
  collectedMTD: number;
}

export function useDashboardData() {
  const queryClient = useQueryClient();

  const approvalsQuery = useQuery({
    queryKey: ["dashboard", "approvals"],
    queryFn: () => fetchJSON<ApprovalResponse>("/api/approvals?status=pending&limit=5"),
    staleTime: 30_000,
  });

  const tasksQuery = useQuery({
    queryKey: ["dashboard", "tasks"],
    queryFn: () => fetchJSON<TaskResponse>("/api/tasks?status=pending&limit=10"),
    staleTime: 30_000,
  });

  const calendarQuery = useQuery({
    queryKey: ["dashboard", "calendar"],
    queryFn: () => fetchJSON<CalendarResponse>("/api/calendar/upcoming?days=1&limit=10"),
    staleTime: 60_000,
  });

  const mattersQuery = useQuery({
    queryKey: ["dashboard", "matters"],
    queryFn: () => fetchJSON<MatterResponse>("/api/matters?status=active&limit=1"),
    staleTime: 60_000,
  });

  const invoicesQuery = useQuery({
    queryKey: ["dashboard", "invoices"],
    queryFn: () => fetchJSON<InvoiceResponse>("/api/invoices?status=overdue&limit=10"),
    staleTime: 60_000,
  });

  const notificationsQuery = useQuery({
    queryKey: ["dashboard", "notifications"],
    queryFn: () => fetchJSON<NotificationResponse>("/api/notifications?read=false&limit=10"),
    staleTime: 30_000,
  });

  const isLoading =
    approvalsQuery.isLoading ||
    tasksQuery.isLoading ||
    calendarQuery.isLoading ||
    mattersQuery.isLoading ||
    invoicesQuery.isLoading ||
    notificationsQuery.isLoading;

  const isError =
    approvalsQuery.isError ||
    tasksQuery.isError ||
    calendarQuery.isError ||
    mattersQuery.isError ||
    invoicesQuery.isError ||
    notificationsQuery.isError;

  // Transform approvals
  const approvals: ApprovalItem[] =
    approvalsQuery.data?.approvals.map((a) => ({
      id: a.id,
      action: a.action,
      summary: a.summary,
      confidence: a.aiMetadata?.confidence,
      entityType: a.entityType,
      matterId: a.matterId,
    })) ?? [];

  // Transform tasks - filter to today or overdue
  const today = startOfDay(new Date());
  const tasks: TaskItem[] =
    tasksQuery.data?.tasks
      .map((t) => {
        const dueDate = t.dueDate ? parseISO(t.dueDate) : null;
        const isOverdue = dueDate ? isBefore(dueDate, today) : false;
        const isDueToday = dueDate ? isToday(dueDate) : false;

        return {
          id: t.id,
          title: t.title,
          priority: t.priority as "low" | "medium" | "high" | "urgent",
          dueDate: t.dueDate,
          matterId: t.matterId,
          isOverdue,
          isCompleted: t.status === "completed",
          isDueToday,
        };
      })
      .filter((t) => t.isDueToday || t.isOverdue) ?? [];

  // Transform calendar events
  const calendarEvents: CalendarEvent[] =
    calendarQuery.data?.events.map((e) => ({
      id: e.id,
      title: e.title,
      eventType: e.eventType,
      startAt: e.startAt,
      endAt: e.endAt,
      matterId: e.matterId,
      location: e.location,
    })) ?? [];

  // Transform notifications to urgent items
  const urgentTypes = ["deadline", "limitation", "overdue", "alert"];
  const urgentItems: UrgentItem[] =
    notificationsQuery.data?.notifications
      .filter((n) => urgentTypes.some((type) => n.type.toLowerCase().includes(type)))
      .slice(0, 5)
      .map((n) => ({
        id: n.id,
        type: (urgentTypes.find((type) => n.type.toLowerCase().includes(type)) ||
          "alert") as UrgentItem["type"],
        title: n.title,
        description: n.body,
        href: n.entityType === "matter" ? `/matters/${n.entityId}` : undefined,
      })) ?? [];

  // Calculate metrics
  const activeCases = mattersQuery.data?.pagination.total ?? 0;
  const overdueInvoices = invoicesQuery.data?.pagination.total ?? 0;

  // Calculate WIP value (sum of overdue invoice totals for now)
  const wipValue =
    invoicesQuery.data?.invoices.reduce((sum, inv) => {
      const amount = parseFloat(inv.total) || 0;
      return sum + amount;
    }, 0) ?? 0;

  // Collected MTD would need a separate endpoint - placeholder
  const collectedMTD = 0;

  const data: DashboardData = {
    approvals,
    approvalsTotal: approvalsQuery.data?.pagination.total ?? 0,
    tasks,
    tasksTotal: tasksQuery.data?.pagination.total ?? 0,
    calendarEvents,
    urgentItems,
    activeCases,
    overdueInvoices,
    wipValue,
    collectedMTD,
  };

  const refetch = () => {
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };

  return {
    data,
    isLoading,
    isError,
    refetch,
  };
}
