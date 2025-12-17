import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { accountingConnections } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { CreateAccountingConnectionSchema } from "@/lib/api/schemas";
import { withAuth } from "@/middleware/withAuth";
import { ValidationError, withErrorHandler } from "@/middleware/withErrorHandler";
import { withPermission } from "@/middleware/withPermission";
import { randomUUID } from "crypto";

function toPublicConnection(row: any) {
  return {
    id: row.id,
    provider: row.provider,
    externalTenantId: row.externalTenantId ?? null,
    status: row.status,
    lastSyncAt: row.lastSyncAt ?? null,
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
          .from(accountingConnections)
          .where(eq(accountingConnections.firmId, firmId))
          .orderBy(desc(accountingConnections.updatedAt));
      });

      return NextResponse.json({ connections: rows.map(toPublicConnection) });
    })
  )
);

export const POST = withErrorHandler(
  withAuth(
    withPermission("integrations:write")(async (request: NextRequest, { user }) => {
      const body = await request.json().catch(() => ({}));
      const data = CreateAccountingConnectionSchema.parse(body);

      const firmId = await getOrCreateFirmIdForUser(user.user.id);
      const webhookSecret = randomUUID();

      const row = await withFirmDb(firmId, async (tx) => {
        const [connection] = await tx
          .insert(accountingConnections)
          .values({
            firmId,
            provider: data.provider,
            tokens: data.tokens ?? null,
            externalTenantId: data.externalTenantId ?? null,
            webhookSecret,
            status: "connected",
            updatedAt: new Date(),
          })
          .returning();
        return connection ?? null;
      });

      if (!row) throw new ValidationError("Failed to create accounting connection");

      return NextResponse.json(
        {
          ...toPublicConnection(row),
          webhookSecret: row.webhookSecret,
          webhookPath: `/api/webhooks/accounting/${firmId}/${row.id}`,
        },
        { status: 201 }
      );
    })
  )
);
