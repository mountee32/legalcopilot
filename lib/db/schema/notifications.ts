/**
 * Notifications Schema
 *
 * In-app notifications are stored in Postgres as the system of record.
 * Delivery via email/push is handled separately (future/background jobs).
 */

import {
  pgTable,
  text,
  timestamp,
  uuid,
  pgEnum,
  boolean,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { firms } from "./firms";
import { users } from "./users";

/**
 * Notification types.
 * Extended to include workflow compliance notifications.
 */
export const notificationTypeEnum = pgEnum("notification_type", [
  // Task notifications
  "task_assigned",
  "task_due",
  "task_overdue",

  // Approval notifications
  "approval_required",
  "approval_decided",

  // Deadline notifications
  "deadline_approaching",
  "deadline_passed",

  // Communication notifications
  "email_received",
  "document_uploaded",

  // Billing notifications
  "invoice_paid",
  "payment_received",

  // Workflow compliance notifications (new - Enhanced Task Model)
  "stage_gate_blocked", // Cannot proceed - hard gate blocking progress
  "evidence_required", // Task needs evidence before completion
  "task_approval_needed", // Task requires approval before completion

  // System notifications
  "system",
]);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    firmId: uuid("firm_id")
      .notNull()
      .references(() => firms.id, { onDelete: "cascade" }),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    type: notificationTypeEnum("type").notNull(),
    title: text("title").notNull(),
    body: text("body"),
    link: text("link"),

    read: boolean("read").notNull().default(false),
    readAt: timestamp("read_at"),

    channels: jsonb("channels"),
    metadata: jsonb("metadata"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    firmUserIdx: index("notifications_firm_user_idx").on(t.firmId, t.userId),
    firmUserReadIdx: index("notifications_firm_user_read_idx").on(t.firmId, t.userId, t.read),
    firmUserCreatedIdx: index("notifications_firm_user_created_idx").on(
      t.firmId,
      t.userId,
      t.createdAt
    ),
  })
);

export const notificationPreferences = pgTable(
  "notification_preferences",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    firmId: uuid("firm_id")
      .notNull()
      .references(() => firms.id, { onDelete: "cascade" }),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    preferences: jsonb("preferences").notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    firmUserUnique: uniqueIndex("notification_preferences_firm_user_unique").on(t.firmId, t.userId),
  })
);

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
export type NotificationPreference = typeof notificationPreferences.$inferSelect;
export type NewNotificationPreference = typeof notificationPreferences.$inferInsert;
