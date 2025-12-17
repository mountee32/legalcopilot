import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, sql } from "drizzle-orm";
import { emailAccounts } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { CreateEmailAccountSchema, EmailAccountQuerySchema } from "@/lib/api/schemas";
import { withAuth } from "@/middleware/withAuth";
import { ValidationError, withErrorHandler } from "@/middleware/withErrorHandler";
import { withPermission } from "@/middleware/withPermission";
import { randomUUID } from "crypto";

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
    withPermission("integrations:read")(async (request: NextRequest, { user }) => {
      const url = new URL(request.url);
      const query = EmailAccountQuerySchema.parse(Object.fromEntries(url.searchParams.entries()));

      const firmId = await getOrCreateFirmIdForUser(user.user.id);
      const offset = (query.page - 1) * query.limit;

      const { total, rows } = await withFirmDb(firmId, async (tx) => {
        const where = eq(emailAccounts.firmId, firmId);
        const [countRow] = await tx
          .select({ total: sql<number>`count(*)` })
          .from(emailAccounts)
          .where(where);

        const rows = await tx
          .select()
          .from(emailAccounts)
          .where(where)
          .orderBy(desc(emailAccounts.updatedAt))
          .limit(query.limit)
          .offset(offset);

        return { total: Number(countRow?.total ?? 0), rows };
      });

      const totalPages = Math.max(1, Math.ceil(total / query.limit));

      return NextResponse.json({
        accounts: rows.map(toPublicEmailAccount),
        pagination: {
          page: query.page,
          limit: query.limit,
          total,
          totalPages,
          hasNext: query.page < totalPages,
          hasPrev: query.page > 1,
        },
      });
    })
  )
);

export const POST = withErrorHandler(
  withAuth(
    withPermission("integrations:write")(async (request: NextRequest, { user }) => {
      const body = await request.json().catch(() => ({}));
      const data = CreateEmailAccountSchema.parse(body);

      const firmId = await getOrCreateFirmIdForUser(user.user.id);
      const webhookSecret = randomUUID();

      const row = await withFirmDb(firmId, async (tx) => {
        const [account] = await tx
          .insert(emailAccounts)
          .values({
            firmId,
            userId: user.user.id,
            provider: data.provider,
            emailAddress: data.emailAddress,
            externalAccountId: data.externalAccountId ?? null,
            scopes: data.scopes ?? null,
            tokens: data.tokens ?? null,
            webhookSecret,
            status: "connected",
            updatedAt: new Date(),
          })
          .returning();
        return account ?? null;
      });

      if (!row) throw new ValidationError("Failed to create email account");

      return NextResponse.json(
        {
          ...toPublicEmailAccount(row),
          webhookSecret: row.webhookSecret,
          webhookPath: `/api/webhooks/email/${firmId}/${row.id}`,
        },
        { status: 201 }
      );
    })
  )
);
