/**
 * Notification factory for creating test notifications
 */
import { db } from "@/lib/db";
import { notifications, notificationPreferences } from "@/lib/db/schema";
import { randomUUID } from "crypto";

export type NotificationType =
  | "task_assigned"
  | "task_due"
  | "task_overdue"
  | "approval_required"
  | "approval_decided"
  | "deadline_approaching"
  | "deadline_passed"
  | "email_received"
  | "document_uploaded"
  | "invoice_paid"
  | "payment_received"
  | "system";

export interface NotificationFactoryOptions {
  id?: string;
  firmId: string;
  userId: string;
  type?: NotificationType;
  title?: string;
  body?: string | null;
  link?: string | null;
  read?: boolean;
  readAt?: Date | null;
  channels?: string[] | null;
  metadata?: Record<string, unknown> | null;
  createdAt?: Date;
}

export interface TestNotification {
  id: string;
  firmId: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  readAt: Date | null;
  channels: unknown;
  metadata: unknown;
  createdAt: Date;
}

/**
 * Create a test notification in the database
 */
export async function createNotification(
  options: NotificationFactoryOptions
): Promise<TestNotification> {
  const id = options.id || randomUUID();
  const type = options.type || "system";
  const suffix = Date.now().toString(36);

  const notificationData = {
    id,
    firmId: options.firmId,
    userId: options.userId,
    type,
    title: options.title || `Test Notification ${suffix}`,
    body: options.body ?? `This is a test notification body for ${type}`,
    link: options.link ?? null,
    read: options.read ?? false,
    readAt: options.readAt ?? null,
    channels: options.channels ?? null,
    metadata: options.metadata ?? null,
    createdAt: options.createdAt ?? new Date(),
  };

  const [notification] = await db.insert(notifications).values(notificationData).returning();

  return {
    id: notification.id,
    firmId: notification.firmId,
    userId: notification.userId,
    type: notification.type as NotificationType,
    title: notification.title,
    body: notification.body,
    link: notification.link,
    read: notification.read,
    readAt: notification.readAt,
    channels: notification.channels,
    metadata: notification.metadata,
    createdAt: notification.createdAt,
  };
}

/**
 * Create multiple notifications for a user
 */
export async function createNotifications(
  firmId: string,
  userId: string,
  count: number,
  options: Partial<NotificationFactoryOptions> = {}
): Promise<TestNotification[]> {
  const notifications: TestNotification[] = [];
  for (let i = 0; i < count; i++) {
    const notification = await createNotification({
      ...options,
      firmId,
      userId,
      title: options.title ? `${options.title} ${i + 1}` : `Notification ${i + 1}`,
    });
    notifications.push(notification);
  }
  return notifications;
}

export interface NotificationPreferencesFactoryOptions {
  id?: string;
  firmId: string;
  userId: string;
  preferences?: Record<string, unknown>;
  updatedAt?: Date;
}

export interface TestNotificationPreferences {
  id: string;
  firmId: string;
  userId: string;
  preferences: unknown;
  updatedAt: Date;
}

/**
 * Create notification preferences for a user
 */
export async function createNotificationPreferences(
  options: NotificationPreferencesFactoryOptions
): Promise<TestNotificationPreferences> {
  const id = options.id || randomUUID();

  const preferencesData = {
    id,
    firmId: options.firmId,
    userId: options.userId,
    preferences: options.preferences ?? {
      channelsByType: {
        task_assigned: ["in_app", "email"],
        approval_required: ["in_app"],
      },
    },
    updatedAt: options.updatedAt ?? new Date(),
  };

  const [prefs] = await db.insert(notificationPreferences).values(preferencesData).returning();

  return {
    id: prefs.id,
    firmId: prefs.firmId,
    userId: prefs.userId,
    preferences: prefs.preferences,
    updatedAt: prefs.updatedAt,
  };
}
