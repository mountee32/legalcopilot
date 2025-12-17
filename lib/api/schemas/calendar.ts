/**
 * Calendar API Schemas
 *
 * @see lib/db/schema/calendar.ts for database schema
 */

import { z, UuidSchema, DateTimeSchema, PaginationSchema, PaginationMetaSchema } from "./common";

export const CalendarEventTypeSchema = z
  .enum([
    "hearing",
    "deadline",
    "meeting",
    "reminder",
    "limitation_date",
    "filing_deadline",
    "other",
  ])
  .openapi("CalendarEventType");

export const CalendarEventPrioritySchema = z
  .enum(["low", "medium", "high", "critical"])
  .openapi("CalendarEventPriority");

export const CalendarEventStatusSchema = z
  .enum(["scheduled", "completed", "cancelled", "rescheduled"])
  .openapi("CalendarEventStatus");

export const CalendarEventSchema = z
  .object({
    id: UuidSchema,
    matterId: UuidSchema.nullable(),
    title: z.string(),
    description: z.string().nullable(),
    eventType: CalendarEventTypeSchema,
    status: CalendarEventStatusSchema,
    priority: CalendarEventPrioritySchema,
    startAt: DateTimeSchema,
    endAt: DateTimeSchema.nullable(),
    allDay: z.boolean(),
    location: z.string().nullable(),
    attendees: z.array(z.unknown()).nullable(),
    reminderMinutes: z.array(z.number().int()).nullable(),
    recurrence: z.record(z.unknown()).nullable(),
    createdById: UuidSchema.nullable(),
    externalId: z.string().nullable(),
    externalSource: z.string().nullable(),
    createdAt: DateTimeSchema,
    updatedAt: DateTimeSchema,
  })
  .openapi("CalendarEvent");

export const CreateCalendarEventSchema = z
  .object({
    matterId: UuidSchema.optional(),
    title: z.string().min(1).max(200),
    description: z.string().optional(),
    eventType: CalendarEventTypeSchema,
    startAt: DateTimeSchema,
    endAt: DateTimeSchema.optional(),
    allDay: z.boolean().optional(),
    location: z.string().optional(),
    attendees: z.array(z.unknown()).optional(),
    reminderMinutes: z
      .array(
        z
          .number()
          .int()
          .min(0)
          .max(60 * 24 * 365)
      )
      .optional(),
    recurrence: z.record(z.unknown()).optional(),
  })
  .openapi("CreateCalendarEventRequest");

export const UpdateCalendarEventSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().nullable().optional(),
    eventType: CalendarEventTypeSchema.optional(),
    status: CalendarEventStatusSchema.optional(),
    priority: CalendarEventPrioritySchema.optional(),
    startAt: DateTimeSchema.optional(),
    endAt: DateTimeSchema.nullable().optional(),
    allDay: z.boolean().optional(),
    location: z.string().nullable().optional(),
    attendees: z.array(z.unknown()).nullable().optional(),
    reminderMinutes: z.array(z.number().int()).nullable().optional(),
    recurrence: z.record(z.unknown()).nullable().optional(),
  })
  .openapi("UpdateCalendarEventRequest");

export const CalendarQuerySchema = PaginationSchema.extend({
  from: DateTimeSchema,
  to: DateTimeSchema,
  matterId: UuidSchema.optional(),
  eventType: CalendarEventTypeSchema.optional(),
  status: CalendarEventStatusSchema.optional(),
}).openapi("CalendarQuery");

export const CalendarListSchema = z
  .object({
    events: z.array(CalendarEventSchema),
    pagination: PaginationMetaSchema,
  })
  .openapi("CalendarListResponse");

export const UpcomingCalendarQuerySchema = z
  .object({
    days: z.coerce.number().int().min(1).max(365).default(14),
    limit: z.coerce.number().int().min(1).max(200).default(50),
    matterId: UuidSchema.optional(),
  })
  .openapi("UpcomingCalendarQuery");

export const UpcomingEventsSchema = z
  .object({
    events: z.array(CalendarEventSchema),
  })
  .openapi("UpcomingEventsResponse");

export const CalendarAISuggestRequestSchema = z
  .object({
    text: z.string().min(1).max(20_000),
  })
  .openapi("CalendarAISuggestRequest");
