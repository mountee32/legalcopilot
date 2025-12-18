import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { notifications } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { withAuth } from "@/middleware/withAuth";
import { NotFoundError, withErrorHandler } from "@/middleware/withErrorHandler";

export const POST = withErrorHandler(
  withAuth(async (_request, { params, user }) => {
    const id = params ? (await params).id : undefined;
    if (!id) throw new NotFoundError("Notification not found");

    const firmId = await getOrCreateFirmIdForUser(user.user.id);
    const userId = user.user.id;

    const updated = await withFirmDb(firmId, async (tx) => {
      const [row] = await tx
        .update(notifications)
        .set({ read: true, readAt: new Date() })
        .where(
          and(
            eq(notifications.id, id),
            eq(notifications.firmId, firmId),
            eq(notifications.userId, userId)
          )
        )
        .returning();

      return row ?? null;
    });

    if (!updated) throw new NotFoundError("Notification not found");
    return NextResponse.json({ success: true });
  })
);
