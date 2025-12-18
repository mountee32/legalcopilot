import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { paymentProviderAccounts } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { UuidSchema } from "@/lib/api/schemas";
import { withAuth } from "@/middleware/withAuth";
import { NotFoundError, withErrorHandler } from "@/middleware/withErrorHandler";
import { withPermission } from "@/middleware/withPermission";

export const GET = withErrorHandler(
  withAuth(
    withPermission("integrations:read")(async (_request: NextRequest, { params, user }) => {
      const id = UuidSchema.parse(params ? (await params).id : undefined);
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
        status: row.status,
        lastSyncAt: null,
        webhookActive: row.webhookSecret ? true : false,
      });
    })
  )
);
