import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { paymentProviderAccounts } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { CreatePaymentProviderAccountSchema } from "@/lib/api/schemas";
import { withAuth } from "@/middleware/withAuth";
import { ValidationError, withErrorHandler } from "@/middleware/withErrorHandler";
import { withPermission } from "@/middleware/withPermission";
import { randomUUID } from "crypto";

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
    withPermission("integrations:read")(async (_request: NextRequest, { user }) => {
      const firmId = await getOrCreateFirmIdForUser(user.user.id);

      const rows = await withFirmDb(firmId, async (tx) => {
        return await tx
          .select()
          .from(paymentProviderAccounts)
          .where(eq(paymentProviderAccounts.firmId, firmId))
          .orderBy(desc(paymentProviderAccounts.updatedAt));
      });

      return NextResponse.json({ accounts: rows.map(toPublicAccount) });
    })
  )
);

export const POST = withErrorHandler(
  withAuth(
    withPermission("integrations:write")(async (request: NextRequest, { user }) => {
      const body = await request.json().catch(() => ({}));
      const data = CreatePaymentProviderAccountSchema.parse(body);

      const firmId = await getOrCreateFirmIdForUser(user.user.id);
      const webhookSecret = data.webhookSecret ?? randomUUID();

      const row = await withFirmDb(firmId, async (tx) => {
        const [account] = await tx
          .insert(paymentProviderAccounts)
          .values({
            firmId,
            provider: data.provider,
            externalAccountId: data.externalAccountId ?? null,
            webhookSecret,
            config: data.config ?? null,
            status: "connected",
            updatedAt: new Date(),
          })
          .returning();
        return account ?? null;
      });

      if (!row) throw new ValidationError("Failed to create payment provider account");

      return NextResponse.json(
        {
          ...toPublicAccount(row),
          webhookSecret: row.webhookSecret,
          webhookPath: `/api/webhooks/payments/${firmId}/${row.id}`,
        },
        { status: 201 }
      );
    })
  )
);
