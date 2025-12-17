/**
 * Calendar Events Schema
 *
 * Deadlines, hearings, meetings and reminders.
 */

import { pgTable, text, timestamp, uuid, pgEnum, jsonb, boolean, index } from "drizzle-orm/pg-core";
import { firms } from "./firms";
import { matters } from "./matters";
import { users } from "./users";

export const calendarEventTypeEnum = pgEnum("calendar_event_type", [
  "hearing",
  "deadline",
  "meeting",
  "reminder",
  "limitation_date",
  "filing_deadline",
  "other",
]);

export const calendarEventPriorityEnum = pgEnum("calendar_event_priority", [
  "low",
  "medium",
  "high",
  "critical",
]);

export const calendarEventStatusEnum = pgEnum("calendar_event_status", [
  "scheduled",
  "completed",
  "cancelled",
  "rescheduled",
]);

export const calendarEvents = pgTable(
  "calendar_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    firmId: uuid("firm_id")
      .notNull()
      .references(() => firms.id, { onDelete: "cascade" }),

    /** Optional: event belongs to a matter/case */
    matterId: uuid("matter_id").references(() => matters.id, { onDelete: "cascade" }),

    title: text("title").notNull(),
    description: text("description"),

    eventType: calendarEventTypeEnum("event_type").notNull(),
    status: calendarEventStatusEnum("status").notNull().default("scheduled"),
    priority: calendarEventPriorityEnum("priority").notNull().default("medium"),

    startAt: timestamp("start_at").notNull(),
    endAt: timestamp("end_at"),
    allDay: boolean("all_day").notNull().default(false),

    location: text("location"),

    /** JSONB array: user ids or external strings */
    attendees: jsonb("attendees"),

    /** JSONB array of minutes before: [1440, 60] */
    reminderMinutes: jsonb("reminder_minutes"),

    /** RRULE-like recurrence rules, kept flexible in JSONB */
    recurrence: jsonb("recurrence"),

    createdById: uuid("created_by_id").references(() => users.id, { onDelete: "set null" }),

    externalId: text("external_id"),
    externalSource: text("external_source"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    firmStartAtIdx: index("calendar_events_firm_start_at_idx").on(t.firmId, t.startAt),
    firmMatterIdx: index("calendar_events_firm_matter_idx").on(t.firmId, t.matterId),
  })
);

export type CalendarEvent = typeof calendarEvents.$inferSelect;
export type NewCalendarEvent = typeof calendarEvents.$inferInsert;
