/**
 * POST /api/email-imports/[id]/retry
 *
 * Retry a failed email import.
 */

import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { emailImports } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { emailPollQueue } from "@/lib/queue/email-poll";
import { withAuth } from "@/middleware/withAuth";
import { withErrorHandler, NotFoundError, ValidationError } from "@/middleware/withErrorHandler";

export const POST = withErrorHandler(
  withAuth(async (request, { params, user }) => {
    const id = params ? (await params).id : undefined;
    if (!id) throw new NotFoundError("Email import ID required");

    const firmId = await getOrCreateFirmIdForUser(user.user.id);

    const result = await withFirmDb(firmId, async (tx) => {
      const [record] = await tx
        .select()
        .from(emailImports)
        .where(and(eq(emailImports.id, id), eq(emailImports.firmId, firmId)))
        .limit(1);

      if (!record) throw new NotFoundError("Email import not found");

      if (record.status !== "failed") {
        throw new ValidationError("Only failed imports can be retried");
      }

      // Reset status
      await tx
        .update(emailImports)
        .set({
          status: "processing",
          error: null,
          updatedAt: new Date(),
        })
        .where(eq(emailImports.id, id));

      // Re-enqueue poll for this account
      await emailPollQueue.add(
        "email:poll",
        {
          emailAccountId: record.emailAccountId,
          firmId,
        },
        {
          removeOnComplete: { count: 100 },
          removeOnFail: { count: 500 },
        }
      );

      return { success: true, importId: id };
    });

    return NextResponse.json(result);
  })
);
