import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { notificationPreferences } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import {
  NotificationPreferencesResponseSchema,
  UpdateNotificationPreferencesSchema,
} from "@/lib/api/schemas";
import { deepMerge } from "@/lib/settings/merge";
import { withAuth } from "@/middleware/withAuth";
import { withErrorHandler } from "@/middleware/withErrorHandler";

export const GET = withErrorHandler(
  withAuth(async (_request, { user }) => {
    const firmId = await getOrCreateFirmIdForUser(user.user.id);
    const userId = user.user.id;

    const result = await withFirmDb(firmId, async (tx) => {
      const [row] = await tx
        .select({
          preferences: notificationPreferences.preferences,
          updatedAt: notificationPreferences.updatedAt,
        })
        .from(notificationPreferences)
        .where(
          and(
            eq(notificationPreferences.firmId, firmId),
            eq(notificationPreferences.userId, userId)
          )
        )
        .limit(1);

      return {
        preferences: (row?.preferences ?? {}) as Record<string, unknown>,
        updatedAt: (row?.updatedAt ?? new Date()).toISOString(),
      };
    });

    return NextResponse.json(NotificationPreferencesResponseSchema.parse(result));
  })
);

export const PATCH = withErrorHandler(
  withAuth(async (request, { user }) => {
    const firmId = await getOrCreateFirmIdForUser(user.user.id);
    const userId = user.user.id;

    const body = await request.json().catch(() => ({}));
    const patch = UpdateNotificationPreferencesSchema.parse(body) as Record<string, unknown>;

    const result = await withFirmDb(firmId, async (tx) => {
      const [existing] = await tx
        .select({
          id: notificationPreferences.id,
          preferences: notificationPreferences.preferences,
        })
        .from(notificationPreferences)
        .where(
          and(
            eq(notificationPreferences.firmId, firmId),
            eq(notificationPreferences.userId, userId)
          )
        )
        .limit(1);

      const current = (existing?.preferences ?? {}) as Record<string, unknown>;
      const merged = deepMerge(current, patch);

      if (!existing) {
        const [created] = await tx
          .insert(notificationPreferences)
          .values({ firmId, userId, preferences: merged, updatedAt: new Date() })
          .returning({
            preferences: notificationPreferences.preferences,
            updatedAt: notificationPreferences.updatedAt,
          });

        return {
          preferences: (created?.preferences ?? merged) as Record<string, unknown>,
          updatedAt: (created?.updatedAt ?? new Date()).toISOString(),
        };
      }

      const [updated] = await tx
        .update(notificationPreferences)
        .set({ preferences: merged, updatedAt: new Date() })
        .where(eq(notificationPreferences.id, existing.id))
        .returning({
          preferences: notificationPreferences.preferences,
          updatedAt: notificationPreferences.updatedAt,
        });

      return {
        preferences: (updated?.preferences ?? merged) as Record<string, unknown>,
        updatedAt: (updated?.updatedAt ?? new Date()).toISOString(),
      };
    });

    return NextResponse.json(NotificationPreferencesResponseSchema.parse(result));
  })
);
