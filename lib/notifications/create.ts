/**
 * Notification Helper
 *
 * Central helper for creating in-app notifications.
 * Respects user preferences — if a user has disabled in_app for a type, skips silently.
 */

import { eq, and, inArray } from "drizzle-orm";
import { notifications, notificationPreferences } from "@/lib/db/schema";
import type { db } from "@/lib/db";

interface NotificationInput {
  firmId: string;
  userId: string;
  type: string;
  title: string;
  body?: string;
  link?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Check if in_app delivery is enabled for a given user's preferences and notification type.
 * Returns true (enabled) if: no prefs row, no channelsByType, no entry for this type,
 * or the entry explicitly includes "in_app".
 */
async function isInAppEnabled(
  tx: typeof db,
  firmId: string,
  userId: string,
  type: string
): Promise<boolean> {
  const rows = await tx
    .select({ preferences: notificationPreferences.preferences })
    .from(notificationPreferences)
    .where(
      and(eq(notificationPreferences.firmId, firmId), eq(notificationPreferences.userId, userId))
    )
    .limit(1);

  if (rows.length === 0) return true;

  const prefs = rows[0].preferences as {
    channelsByType?: Record<string, string[]>;
  } | null;

  if (!prefs?.channelsByType) return true;

  const channels = prefs.channelsByType[type];
  if (channels === undefined) return true;

  return channels.includes("in_app");
}

/**
 * Create a single notification, respecting user preferences.
 */
export async function createNotification(tx: typeof db, input: NotificationInput): Promise<void> {
  const enabled = await isInAppEnabled(tx, input.firmId, input.userId, input.type);
  if (!enabled) return;

  await tx.insert(notifications).values({
    firmId: input.firmId,
    userId: input.userId,
    type: input.type as any,
    title: input.title,
    body: input.body ?? null,
    link: input.link ?? null,
    read: false,
    metadata: input.metadata ?? null,
  });
}

/**
 * Create notifications for multiple users in a single batch.
 * Queries all preferences at once, filters out disabled users, then bulk inserts.
 */
export async function createNotifications(
  tx: typeof db,
  inputs: NotificationInput[]
): Promise<void> {
  if (inputs.length === 0) return;

  const userIds = [...new Set(inputs.map((n) => n.userId))];

  const firmId = inputs[0].firmId;

  const prefRows = await tx
    .select({
      userId: notificationPreferences.userId,
      preferences: notificationPreferences.preferences,
    })
    .from(notificationPreferences)
    .where(
      and(
        eq(notificationPreferences.firmId, firmId),
        inArray(notificationPreferences.userId, userIds)
      )
    );

  const prefMap = new Map<string, Record<string, string[]>>();
  for (const row of prefRows) {
    const prefs = row.preferences as { channelsByType?: Record<string, string[]> } | null;
    if (prefs?.channelsByType) {
      prefMap.set(row.userId, prefs.channelsByType);
    }
  }

  const allowed = inputs.filter((input) => {
    const channels = prefMap.get(input.userId);
    if (!channels) return true;
    const typeChannels = channels[input.type];
    if (typeChannels === undefined) return true;
    return typeChannels.includes("in_app");
  });

  if (allowed.length === 0) return;

  await tx.insert(notifications).values(
    allowed.map((input) => ({
      firmId: input.firmId,
      userId: input.userId,
      type: input.type as any,
      title: input.title,
      body: input.body ?? null,
      link: input.link ?? null,
      read: false,
      metadata: input.metadata ?? null,
    }))
  );
}
