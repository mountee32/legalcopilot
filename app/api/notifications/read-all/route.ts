import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { notifications } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { withAuth } from "@/middleware/withAuth";
import { withErrorHandler } from "@/middleware/withErrorHandler";

export const POST = withErrorHandler(
  withAuth(async (_request, { user }) => {
    const firmId = await getOrCreateFirmIdForUser(user.user.id);
    const userId = user.user.id;

    await withFirmDb(firmId, async (tx) => {
      await tx
        .update(notifications)
        .set({ read: true, readAt: new Date() })
        .where(
          and(
            eq(notifications.firmId, firmId),
            eq(notifications.userId, userId),
            eq(notifications.read, false)
          )
        );
    });

    return NextResponse.json({ success: true });
  })
);
