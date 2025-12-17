import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { paymentProviderAccounts } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { UuidSchema } from "@/lib/api/schemas";
import { withAuth } from "@/middleware/withAuth";
import { NotFoundError, withErrorHandler } from "@/middleware/withErrorHandler";
import { withPermission } from "@/middleware/withPermission";

function toPublicAccount(row: any) {
  return {
    id: row.id,
    provider: row.provider,
    externalAccountId: row.externalAccountId ?? null,
    status: row.status,
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
          .from(paymentProviderAccounts)
          .where(
            and(eq(paymentProviderAccounts.firmId, firmId), eq(paymentProviderAccounts.id, id))
          );
        return account ?? null;
      });

      if (!row) throw new NotFoundError("Payment provider account not found");

      return NextResponse.json({
        ...toPublicAccount(row),
        webhookSecret: row.webhookSecret,
        webhookPath: `/api/webhooks/payments/${firmId}/${row.id}`,
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
          .update(paymentProviderAccounts)
          .set({ status: "revoked", updatedAt: new Date() })
          .where(
            and(eq(paymentProviderAccounts.firmId, firmId), eq(paymentProviderAccounts.id, id))
          )
          .returning();
        return account ?? null;
      });

      if (!row) throw new NotFoundError("Payment provider account not found");
      return NextResponse.json({ ok: true });
    })
  )
);
