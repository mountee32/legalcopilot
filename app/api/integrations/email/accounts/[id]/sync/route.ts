/**
 * POST /api/integrations/email/accounts/[id]/sync
 *
 * Trigger an immediate sync for one email account.
 */

import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { emailAccounts } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { emailPollQueue } from "@/lib/queue/email-poll";
import { withAuth } from "@/middleware/withAuth";
import { withErrorHandler, NotFoundError, ValidationError } from "@/middleware/withErrorHandler";

export const POST = withErrorHandler(
  withAuth(async (request, { params, user }) => {
    const id = params ? (await params).id : undefined;
    if (!id) throw new NotFoundError("Account ID required");

    const firmId = await getOrCreateFirmIdForUser(user.user.id);

    const result = await withFirmDb(firmId, async (tx) => {
      const [account] = await tx
        .select()
        .from(emailAccounts)
        .where(and(eq(emailAccounts.id, id), eq(emailAccounts.firmId, firmId)))
        .limit(1);

      if (!account) throw new NotFoundError("Email account not found");

      if (account.status !== "connected") {
        throw new ValidationError("Only connected accounts can be synced");
      }

      await emailPollQueue.add(
        "email:poll",
        {
          emailAccountId: account.id,
          firmId,
        },
        {
          jobId: `sync:${account.id}:${Date.now()}`,
          removeOnComplete: { count: 100 },
          removeOnFail: { count: 500 },
        }
      );

      return { success: true, accountId: id };
    });

    return NextResponse.json(result);
  })
);
