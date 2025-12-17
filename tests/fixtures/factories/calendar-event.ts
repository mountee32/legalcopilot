/**
 * Calendar Event factory for creating test calendar events
 */
import { db } from "@/lib/db";
import { calendarEvents } from "@/lib/db/schema";
import { randomUUID } from "crypto";

export type CalendarEventType =
  | "hearing"
  | "deadline"
  | "meeting"
  | "reminder"
  | "limitation_date"
  | "filing_deadline"
  | "other";

export type CalendarEventStatus = "scheduled" | "completed" | "cancelled" | "rescheduled";
export type CalendarEventPriority = "low" | "medium" | "high" | "critical";

export interface CalendarEventFactoryOptions {
  id?: string;
  firmId: string;
  matterId?: string | null;
  title?: string;
  description?: string | null;
  eventType?: CalendarEventType;
  status?: CalendarEventStatus;
  priority?: CalendarEventPriority;
  startAt?: Date;
  endAt?: Date | null;
  allDay?: boolean;
  location?: string | null;
  createdById?: string | null;
}

export interface TestCalendarEvent {
  id: string;
  firmId: string;
  matterId: string | null;
  title: string;
  eventType: string;
  status: string;
  priority: string;
  startAt: Date;
  endAt: Date | null;
  allDay: boolean;
}

/**
 * Create a test calendar event in the database
 */
export async function createCalendarEvent(
  options: CalendarEventFactoryOptions
): Promise<TestCalendarEvent> {
  const id = options.id || randomUUID();
  const suffix = Date.now().toString(36);

  const startAt = options.startAt || new Date(Date.now() + 24 * 60 * 60 * 1000); // Tomorrow
  const endAt = options.endAt ?? new Date(startAt.getTime() + 60 * 60 * 1000); // 1 hour later

  const eventData = {
    id,
    firmId: options.firmId,
    matterId: options.matterId ?? null,
    title: options.title || `Test Event ${suffix}`,
    description: options.description ?? null,
    eventType: options.eventType || "meeting",
    status: options.status || "scheduled",
    priority: options.priority || "medium",
    startAt,
    endAt,
    allDay: options.allDay ?? false,
    location: options.location ?? null,
    createdById: options.createdById ?? null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const [event] = await db.insert(calendarEvents).values(eventData).returning();

  return {
    id: event.id,
    firmId: event.firmId,
    matterId: event.matterId,
    title: event.title,
    eventType: event.eventType,
    status: event.status,
    priority: event.priority,
    startAt: event.startAt,
    endAt: event.endAt,
    allDay: event.allDay,
  };
}

/**
 * Build calendar event data without inserting into database
 */
export function buildCalendarEventData(
  firmId: string,
  options: Partial<CalendarEventFactoryOptions> = {}
): Record<string, unknown> {
  const suffix = Date.now().toString(36);
  const startAt = options.startAt || new Date(Date.now() + 24 * 60 * 60 * 1000);

  return {
    firmId,
    matterId: options.matterId ?? null,
    title: options.title || `Test Event ${suffix}`,
    eventType: options.eventType || "meeting",
    status: options.status || "scheduled",
    priority: options.priority || "medium",
    startAt: startAt.toISOString(),
    endAt: options.endAt?.toISOString() ?? null,
    allDay: options.allDay ?? false,
  };
}

/**
 * Create a hearing event
 */
export async function createHearing(
  firmId: string,
  matterId: string,
  options: Partial<CalendarEventFactoryOptions> = {}
): Promise<TestCalendarEvent> {
  return createCalendarEvent({
    ...options,
    firmId,
    matterId,
    eventType: "hearing",
    title: options.title || `Court Hearing ${Date.now().toString(36)}`,
    priority: options.priority || "high",
  });
}

/**
 * Create a deadline event
 */
export async function createDeadline(
  firmId: string,
  matterId: string,
  options: Partial<CalendarEventFactoryOptions> = {}
): Promise<TestCalendarEvent> {
  return createCalendarEvent({
    ...options,
    firmId,
    matterId,
    eventType: "deadline",
    title: options.title || `Deadline ${Date.now().toString(36)}`,
    allDay: true,
  });
}

/**
 * Create a meeting event
 */
export async function createMeeting(
  firmId: string,
  options: Partial<CalendarEventFactoryOptions> = {}
): Promise<TestCalendarEvent> {
  return createCalendarEvent({
    ...options,
    firmId,
    eventType: "meeting",
    title: options.title || `Meeting ${Date.now().toString(36)}`,
  });
}
