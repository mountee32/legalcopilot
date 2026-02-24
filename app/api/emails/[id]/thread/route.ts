import { NextResponse } from "next/server";
import { and, eq, asc } from "drizzle-orm";
import { emails } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { withAuth } from "@/middleware/withAuth";
import { NotFoundError, withErrorHandler } from "@/middleware/withErrorHandler";
import { withPermission } from "@/middleware/withPermission";

export const GET = withErrorHandler(
  withAuth(
    withPermission("emails:read")(async (_request, { params, user }) => {
      const id = params ? (await params).id : undefined;
      if (!id) throw new NotFoundError("Email not found");

      const firmId = await getOrCreateFirmIdForUser(user.user.id);

      const result = await withFirmDb(firmId, async (tx) => {
        // Load the target email
        const [email] = await tx
          .select()
          .from(emails)
          .where(and(eq(emails.id, id), eq(emails.firmId, firmId)))
          .limit(1);

        if (!email) throw new NotFoundError("Email not found");

        // If no threadId, return just this email
        if (!email.threadId) {
          return { thread: [email], currentEmailId: email.id };
        }

        // Load all emails in the thread
        const threadEmails = await tx
          .select()
          .from(emails)
          .where(and(eq(emails.threadId, email.threadId), eq(emails.firmId, firmId)))
          .orderBy(asc(emails.createdAt));

        return { thread: threadEmails, currentEmailId: email.id };
      });

      return NextResponse.json(result);
    })
  )
);
