import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { emailAccounts } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { UuidSchema } from "@/lib/api/schemas";
import { withAuth } from "@/middleware/withAuth";
import { NotFoundError, withErrorHandler } from "@/middleware/withErrorHandler";
import { withPermission } from "@/middleware/withPermission";

function toPublicEmailAccount(row: any) {
  return {
    id: row.id,
    provider: row.provider,
    emailAddress: row.emailAddress,
    externalAccountId: row.externalAccountId ?? null,
    status: row.status,
    lastSyncAt: row.lastSyncAt ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export const GET = withErrorHandler(
  withAuth(
    withPermission("integrations:read")(async (_request: NextRequest, { params, user }) => {
      const id = UuidSchema.parse(params.id);
      const firmId = await getOrCreateFirmIdForUser(user.user.id);

      const row = await withFirmDb(firmId, async (tx) => {
        const [account] = await tx
          .select()
          .from(emailAccounts)
          .where(and(eq(emailAccounts.firmId, firmId), eq(emailAccounts.id, id)));
        return account ?? null;
      });

      if (!row) throw new NotFoundError("Email account not found");

      return NextResponse.json({
        ...toPublicEmailAccount(row),
        webhookSecret: row.webhookSecret,
        webhookPath: `/api/webhooks/email/${firmId}/${row.id}`,
      });
    })
  )
);

export const DELETE = withErrorHandler(
  withAuth(
    withPermission("integrations:write")(async (_request: NextRequest, { params, user }) => {
      const id = UuidSchema.parse(params.id);
      const firmId = await getOrCreateFirmIdForUser(user.user.id);

      const row = await withFirmDb(firmId, async (tx) => {
        const [account] = await tx
          .update(emailAccounts)
          .set({ status: "revoked", tokens: null, updatedAt: new Date() })
          .where(and(eq(emailAccounts.firmId, firmId), eq(emailAccounts.id, id)))
          .returning();
        return account ?? null;
      });

      if (!row) throw new NotFoundError("Email account not found");

      return NextResponse.json({ ok: true });
    })
  )
);
