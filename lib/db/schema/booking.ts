/**
 * Booking & Scheduling Schema
 *
 * Appointment types, availability rules, and bookings for client consultations.
 */

import {
  pgTable,
  text,
  timestamp,
  uuid,
  pgEnum,
  integer,
  jsonb,
  boolean,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { firms } from "./firms";
import { users } from "./users";
import { leads } from "./intake";
import { matters, practiceAreaEnum } from "./matters";
import { calendarEvents } from "./calendar";

export const bookingStatusEnum = pgEnum("booking_status", [
  "pending", // Awaiting confirmation
  "confirmed", // Confirmed by firm
  "cancelled", // Cancelled by either party
  "completed", // Meeting completed
  "no_show", // Client didn't attend
]);

/**
 * Appointment types define consultation offerings.
 * e.g., "Initial Consultation - Conveyancing (30 min)"
 */
export const appointmentTypes = pgTable(
  "appointment_types",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    firmId: uuid("firm_id")
      .notNull()
      .references(() => firms.id, { onDelete: "cascade" }),

    name: text("name").notNull(),
    description: text("description"),

    /** Practice area for this appointment type */
    practiceArea: practiceAreaEnum("practice_area"),

    /** Duration in minutes */
    duration: integer("duration").notNull(),

    /** Buffer time after appointment in minutes */
    bufferAfter: integer("buffer_after").notNull().default(0),

    /** Whether this appointment type is publicly bookable */
    isActive: boolean("is_active").notNull().default(true),

    /** Maximum advance booking days (null = no limit) */
    maxAdvanceBookingDays: integer("max_advance_booking_days"),

    /** Minimum notice hours required */
    minNoticeHours: integer("min_notice_hours").notNull().default(24),

    /** Additional settings (e.g., require CAPTCHA, custom fields) */
    settings: jsonb("settings"),

    createdById: uuid("created_by_id").references(() => users.id, { onDelete: "set null" }),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    firmActiveIdx: index("appointment_types_firm_active_idx").on(t.firmId, t.isActive),
  })
);

/**
 * Availability rules define when appointments can be booked.
 * Supports weekly recurring patterns and date-specific overrides.
 */
export const availabilityRules = pgTable(
  "availability_rules",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    firmId: uuid("firm_id")
      .notNull()
      .references(() => firms.id, { onDelete: "cascade" }),

    /** Optional: availability for specific user/solicitor */
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),

    /** Day of week (0 = Sunday, 6 = Saturday) */
    dayOfWeek: integer("day_of_week"),

    /** Start time (HH:MM format) */
    startTime: text("start_time"),

    /** End time (HH:MM format) */
    endTime: text("end_time"),

    /** Specific date override (takes precedence over recurring rules) */
    specificDate: timestamp("specific_date"),

    /** Whether this is an unavailable period (e.g., holiday, closed) */
    isUnavailable: boolean("is_unavailable").notNull().default(false),

    /** Optional: appointment type this rule applies to */
    appointmentTypeId: uuid("appointment_type_id").references(() => appointmentTypes.id, {
      onDelete: "cascade",
    }),

    createdById: uuid("created_by_id").references(() => users.id, { onDelete: "set null" }),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    firmDayIdx: index("availability_rules_firm_day_idx").on(t.firmId, t.dayOfWeek),
    firmDateIdx: index("availability_rules_firm_date_idx").on(t.firmId, t.specificDate),
    firmUserIdx: index("availability_rules_firm_user_idx").on(t.firmId, t.userId),
  })
);

/**
 * Bookings represent scheduled appointments.
 * Can be linked to leads (new clients) or existing matters.
 */
export const bookings = pgTable(
  "bookings",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    firmId: uuid("firm_id")
      .notNull()
      .references(() => firms.id, { onDelete: "cascade" }),

    appointmentTypeId: uuid("appointment_type_id")
      .notNull()
      .references(() => appointmentTypes.id, { onDelete: "restrict" }),

    /** Assigned solicitor/user */
    assignedTo: uuid("assigned_to").references(() => users.id, { onDelete: "set null" }),

    /** Optional: link to lead (for new business) */
    leadId: uuid("lead_id").references(() => leads.id, { onDelete: "set null" }),

    /** Optional: link to existing matter */
    matterId: uuid("matter_id").references(() => matters.id, { onDelete: "set null" }),

    /** Optional: link to calendar event */
    calendarEventId: uuid("calendar_event_id").references(() => calendarEvents.id, {
      onDelete: "set null",
    }),

    status: bookingStatusEnum("status").notNull().default("pending"),

    /** Scheduled start time */
    startAt: timestamp("start_at").notNull(),

    /** Scheduled end time */
    endAt: timestamp("end_at").notNull(),

    /** Client contact details */
    clientName: text("client_name").notNull(),
    clientEmail: text("client_email").notNull(),
    clientPhone: text("client_phone"),

    /** Additional notes/questions from client */
    notes: text("notes"),

    /** Internal notes (not visible to client) */
    internalNotes: text("internal_notes"),

    /** Cancellation reason */
    cancellationReason: text("cancellation_reason"),

    /** Cancelled by (user id or "client") */
    cancelledBy: text("cancelled_by"),

    /** Metadata (e.g., CAPTCHA token, custom field responses) */
    metadata: jsonb("metadata"),

    createdById: uuid("created_by_id").references(() => users.id, { onDelete: "set null" }),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    firmStartAtIdx: index("bookings_firm_start_at_idx").on(t.firmId, t.startAt),
    firmStatusIdx: index("bookings_firm_status_idx").on(t.firmId, t.status),
    firmLeadIdx: index("bookings_firm_lead_idx").on(t.firmId, t.leadId),
    firmMatterIdx: index("bookings_firm_matter_idx").on(t.firmId, t.matterId),
    firmAssignedIdx: index("bookings_firm_assigned_idx").on(t.firmId, t.assignedTo),
  })
);

export type AppointmentType = typeof appointmentTypes.$inferSelect;
export type NewAppointmentType = typeof appointmentTypes.$inferInsert;
export type AvailabilityRule = typeof availabilityRules.$inferSelect;
export type NewAvailabilityRule = typeof availabilityRules.$inferInsert;
export type Booking = typeof bookings.$inferSelect;
export type NewBooking = typeof bookings.$inferInsert;
