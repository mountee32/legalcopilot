import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { firms } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { FirmSettingsResponseSchema, UpdateFirmSettingsSchema } from "@/lib/api/schemas";
import { deepMerge } from "@/lib/settings/merge";
import { withAuth } from "@/middleware/withAuth";
import { withErrorHandler } from "@/middleware/withErrorHandler";
import { withPermission } from "@/middleware/withPermission";

export const GET = withErrorHandler(
  withAuth(async (_request, { user }) => {
    const firmId = await getOrCreateFirmIdForUser(user.user.id);

    const result = await withFirmDb(firmId, async (tx) => {
      const [firm] = await tx
        .select({ settings: firms.settings, updatedAt: firms.updatedAt })
        .from(firms)
        .where(eq(firms.id, firmId))
        .limit(1);

      const settingsRaw = (firm?.settings ?? {}) as Record<string, unknown>;

      return {
        settings: settingsRaw,
        updatedAt: (firm?.updatedAt ?? new Date()).toISOString(),
      };
    });

    const parsed = FirmSettingsResponseSchema.parse(result);
    return NextResponse.json(parsed);
  })
);

export const PATCH = withErrorHandler(
  withAuth(
    withPermission("firm:settings")(async (request, { user }) => {
      const firmId = await getOrCreateFirmIdForUser(user.user.id);

      const body = await request.json().catch(() => ({}));
      const patch = UpdateFirmSettingsSchema.parse(body) as Record<string, unknown>;

      const result = await withFirmDb(firmId, async (tx) => {
        const [current] = await tx
          .select({ settings: firms.settings })
          .from(firms)
          .where(eq(firms.id, firmId))
          .limit(1);

        const currentSettings = (current?.settings ?? {}) as Record<string, unknown>;
        const merged = deepMerge(currentSettings, patch);

        const [updated] = await tx
          .update(firms)
          .set({ settings: merged, updatedAt: new Date() })
          .where(eq(firms.id, firmId))
          .returning({ settings: firms.settings, updatedAt: firms.updatedAt });

        return {
          settings: (updated?.settings ?? merged) as Record<string, unknown>,
          updatedAt: (updated?.updatedAt ?? new Date()).toISOString(),
        };
      });

      const parsed = FirmSettingsResponseSchema.parse(result);
      return NextResponse.json(parsed);
    })
  )
);
