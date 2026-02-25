/**
 * Notifications API Schemas
 *
 * @see lib/db/schema/notifications.ts for database schema
 */

import { z, UuidSchema, DateTimeSchema, PaginationSchema, PaginationMetaSchema } from "./common";

export const NotificationTypeSchema = z
  .enum([
    "task_assigned",
    "task_due",
    "task_overdue",
    "approval_required",
    "approval_decided",
    "deadline_approaching",
    "deadline_passed",
    "email_received",
    "document_uploaded",
    "invoice_paid",
    "payment_received",
    "stage_gate_blocked",
    "evidence_required",
    "task_approval_needed",
    "system",
  ])
  .openapi("NotificationType");

export const NotificationSchema = z
  .object({
    id: UuidSchema,
    userId: UuidSchema,
    type: NotificationTypeSchema,
    title: z.string(),
    body: z.string().nullable(),
    link: z.string().nullable(),
    read: z.boolean(),
    readAt: DateTimeSchema.nullable(),
    channels: z.array(z.string()).nullable(),
    metadata: z.record(z.unknown()).nullable(),
    createdAt: DateTimeSchema,
  })
  .openapi("Notification");

export const NotificationQuerySchema = PaginationSchema.extend({
  read: z
    .preprocess((value) => {
      if (value === undefined) return undefined;
      if (value === "true") return true;
      if (value === "false") return false;
      return value;
    }, z.boolean())
    .optional(),
  type: NotificationTypeSchema.optional(),
}).openapi("NotificationQuery");

export const NotificationListSchema = z
  .object({
    notifications: z.array(NotificationSchema),
    pagination: PaginationMetaSchema,
  })
  .openapi("NotificationListResponse");

export const NotificationPreferencesSchema = z
  .object({
    channelsByType: z.record(z.array(z.enum(["in_app", "email", "push"]))).optional(),
  })
  .passthrough()
  .openapi("NotificationPreferences");

export const NotificationPreferencesResponseSchema = z
  .object({
    preferences: NotificationPreferencesSchema,
    updatedAt: DateTimeSchema,
  })
  .openapi("NotificationPreferencesResponse");

export const UpdateNotificationPreferencesSchema = NotificationPreferencesSchema.partial().openapi(
  "UpdateNotificationPreferencesRequest"
);
