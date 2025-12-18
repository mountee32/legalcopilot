/**
 * Team & Resource Management Schema
 *
 * Leave requests, availability windows, and capacity tracking.
 * Supports workload rebalancing and absence management.
 *
 * @see docs/ideas.md Epic 25 for team management specification
 */

import {
  pgTable,
  text,
  timestamp,
  uuid,
  pgEnum,
  date,
  time,
  integer,
  index,
} from "drizzle-orm/pg-core";
import { firms } from "./firms";
import { users } from "./users";

/**
 * Leave request types.
 */
export const leaveTypeEnum = pgEnum("leave_type", [
  "annual", // Annual holiday/vacation
  "sick", // Sick leave
  "parental", // Maternity/paternity leave
  "unpaid", // Unpaid leave
  "other", // Other types
]);

/**
 * Leave request status lifecycle.
 */
export const leaveStatusEnum = pgEnum("leave_status", [
  "pending", // Awaiting approval
  "approved", // Approved by manager
  "rejected", // Rejected by manager
  "cancelled", // Cancelled by requester
]);

/**
 * Leave requests for team members.
 * Tracks holiday/sick leave with approval workflow.
 */
export const leaveRequests = pgTable(
  "leave_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    firmId: uuid("firm_id")
      .notNull()
      .references(() => firms.id, { onDelete: "cascade" }),

    /** User requesting leave */
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    /** Type of leave being requested */
    type: leaveTypeEnum("type").notNull(),

    /** Leave start date (inclusive) */
    startDate: date("start_date").notNull(),

    /** Leave end date (inclusive) */
    endDate: date("end_date").notNull(),

    /** Number of working days (calculated) */
    daysCount: integer("days_count").notNull(),

    /** Optional reason/notes */
    reason: text("reason"),

    status: leaveStatusEnum("status").notNull().default("pending"),

    /** Who approved/rejected the request */
    decidedBy: uuid("decided_by").references(() => users.id),

    /** When the decision was made */
    decidedAt: timestamp("decided_at"),

    /** Optional decision reason/notes */
    decisionReason: text("decision_reason"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    firmUserIdx: index("leave_requests_firm_user_idx").on(t.firmId, t.userId),
    firmStatusIdx: index("leave_requests_firm_status_idx").on(t.firmId, t.status),
    firmDateRangeIdx: index("leave_requests_firm_date_range_idx").on(
      t.firmId,
      t.startDate,
      t.endDate
    ),
  })
);

/**
 * Day of week enum for availability windows.
 */
export const dayOfWeekEnum = pgEnum("day_of_week", [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
]);

/**
 * Availability windows for team members.
 * Defines regular working hours/availability patterns.
 */
export const availabilityWindows = pgTable(
  "availability_windows",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    firmId: uuid("firm_id")
      .notNull()
      .references(() => firms.id, { onDelete: "cascade" }),

    /** User this availability applies to */
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    /** Day of week this window applies to */
    dayOfWeek: dayOfWeekEnum("day_of_week").notNull(),

    /** Start time (e.g., "09:00:00") */
    startTime: time("start_time").notNull(),

    /** End time (e.g., "17:30:00") */
    endTime: time("end_time").notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    firmUserDayIdx: index("availability_windows_firm_user_day_idx").on(
      t.firmId,
      t.userId,
      t.dayOfWeek
    ),
  })
);

// Type exports
export type LeaveRequest = typeof leaveRequests.$inferSelect;
export type NewLeaveRequest = typeof leaveRequests.$inferInsert;
export type AvailabilityWindow = typeof availabilityWindows.$inferSelect;
export type NewAvailabilityWindow = typeof availabilityWindows.$inferInsert;
