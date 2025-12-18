import type { LucideIcon } from "lucide-react";
import {
  FileText,
  Mail,
  CheckSquare,
  Receipt,
  Calendar,
  Sparkles,
  Folder,
  Clock,
  Scale,
  AlertCircle,
  AlertTriangle,
  Users,
} from "lucide-react";

export type DisplayCategory =
  | "document"
  | "email"
  | "task"
  | "billing"
  | "calendar"
  | "ai"
  | "matter"
  | "other";

export type EventSource = "timeline" | "calendar";

export interface UnifiedEvent {
  id: string;
  date: Date;
  title: string;
  description?: string | null;
  source: EventSource;
  eventType: string;
  displayCategory: DisplayCategory;
  actorType?: "user" | "system" | "ai";
  metadata?: Record<string, unknown> | null;
  // Calendar-specific fields
  startTime?: string | null;
  endTime?: string | null;
  location?: string | null;
  allDay?: boolean;
  priority?: string;
}

export const TIMELINE_TYPE_MAP: Record<string, DisplayCategory> = {
  document_uploaded: "document",
  document_extracted: "document",
  document_chunked: "document",
  document_summarized: "document",
  document_entities_extracted: "document",
  email_received: "email",
  email_sent: "email",
  task_created: "task",
  task_completed: "task",
  time_entry_submitted: "billing",
  time_entry_approved: "billing",
  invoice_generated: "billing",
  invoice_sent: "billing",
  invoice_voided: "billing",
  payment_recorded: "billing",
  payment_deleted: "billing",
  calendar_event_created: "calendar",
  calendar_event_updated: "calendar",
  calendar_event_deleted: "calendar",
  conflict_check_run: "ai",
  conflict_check_cleared: "ai",
  conflict_check_waived: "ai",
  matter_created: "matter",
  matter_updated: "matter",
  matter_archived: "matter",
  lead_converted: "other",
  quote_converted: "other",
  approval_decided: "other",
  note_added: "other",
};

export const CALENDAR_TYPE_MAP: Record<string, { icon: LucideIcon; color: string }> = {
  hearing: { icon: Scale, color: "text-blue-600" },
  deadline: { icon: AlertCircle, color: "text-orange-600" },
  filing_deadline: { icon: AlertCircle, color: "text-orange-600" },
  limitation_date: { icon: AlertTriangle, color: "text-red-600" },
  meeting: { icon: Users, color: "text-green-600" },
  reminder: { icon: Clock, color: "text-slate-600" },
  other: { icon: Calendar, color: "text-slate-600" },
};

export interface CategoryConfig {
  icon: LucideIcon;
  bg: string;
  border: string;
  iconColor: string;
}

export const CATEGORY_CONFIG: Record<DisplayCategory, CategoryConfig> = {
  document: {
    icon: FileText,
    bg: "bg-blue-50",
    border: "border-blue-200",
    iconColor: "text-blue-600",
  },
  email: {
    icon: Mail,
    bg: "bg-green-50",
    border: "border-green-200",
    iconColor: "text-green-600",
  },
  task: {
    icon: CheckSquare,
    bg: "bg-purple-50",
    border: "border-purple-200",
    iconColor: "text-purple-600",
  },
  billing: {
    icon: Receipt,
    bg: "bg-amber-50",
    border: "border-amber-200",
    iconColor: "text-amber-600",
  },
  calendar: {
    icon: Calendar,
    bg: "bg-orange-50",
    border: "border-orange-200",
    iconColor: "text-orange-600",
  },
  ai: {
    icon: Sparkles,
    bg: "bg-violet-50",
    border: "border-violet-200",
    iconColor: "text-violet-600",
  },
  matter: {
    icon: Folder,
    bg: "bg-slate-50",
    border: "border-slate-300",
    iconColor: "text-slate-600",
  },
  other: {
    icon: Clock,
    bg: "bg-slate-50",
    border: "border-slate-300",
    iconColor: "text-slate-600",
  },
};

export function getDisplayCategory(eventType: string): DisplayCategory {
  return TIMELINE_TYPE_MAP[eventType] || "other";
}

export function getCategoryConfig(category: DisplayCategory): CategoryConfig {
  return CATEGORY_CONFIG[category];
}

export function getCalendarEventConfig(eventType: string) {
  return CALENDAR_TYPE_MAP[eventType] || CALENDAR_TYPE_MAP.other;
}
