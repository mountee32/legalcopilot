import { NextRequest, NextResponse } from "next/server";
import { desc, eq, sql } from "drizzle-orm";
import { calendarAccounts } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { CreateCalendarAccountSchema, CalendarAccountQuerySchema } from "@/lib/api/schemas";
import { withAuth } from "@/middleware/withAuth";
import { ValidationError, withErrorHandler } from "@/middleware/withErrorHandler";
import { withPermission } from "@/middleware/withPermission";
import { randomUUID } from "crypto";

function toPublicCalendarAccount(row: any) {
  return {
    id: row.id,
    provider: row.provider,
    externalAccountId: row.externalAccountId ?? null,
    status: row.status,
    syncDirection: row.syncDirection,
    lastSyncAt: row.lastSyncAt ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export const GET = withErrorHandler(
  withAuth(
    withPermission("integrations:read")(async (request: NextRequest, { user }) => {
      const url = new URL(request.url);
      const query = CalendarAccountQuerySchema.parse(
        Object.fromEntries(url.searchParams.entries())
      );

      const firmId = await getOrCreateFirmIdForUser(user.user.id);
      const offset = (query.page - 1) * query.limit;

      const { total, rows } = await withFirmDb(firmId, async (tx) => {
        const where = eq(calendarAccounts.firmId, firmId);
        const [countRow] = await tx
          .select({ total: sql<number>`count(*)` })
          .from(calendarAccounts)
          .where(where);

        const rows = await tx
          .select()
          .from(calendarAccounts)
          .where(where)
          .orderBy(desc(calendarAccounts.updatedAt))
          .limit(query.limit)
          .offset(offset);

        return { total: Number(countRow?.total ?? 0), rows };
      });

      const totalPages = Math.max(1, Math.ceil(total / query.limit));

      return NextResponse.json({
        accounts: rows.map(toPublicCalendarAccount),
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
      const data = CreateCalendarAccountSchema.parse(body);

      const firmId = await getOrCreateFirmIdForUser(user.user.id);
      const webhookSecret = randomUUID();

      const row = await withFirmDb(firmId, async (tx) => {
        const [account] = await tx
          .insert(calendarAccounts)
          .values({
            firmId,
            userId: user.user.id,
            provider: data.provider,
            externalAccountId: data.externalAccountId ?? null,
            scopes: data.scopes ?? null,
            tokens: data.tokens ?? null,
            webhookSecret,
            status: "connected",
            syncDirection: data.syncDirection ?? "push",
            updatedAt: new Date(),
          })
          .returning();
        return account ?? null;
      });

      if (!row) throw new ValidationError("Failed to create calendar account");

      return NextResponse.json(
        {
          ...toPublicCalendarAccount(row),
          webhookSecret: row.webhookSecret,
          webhookPath: `/api/webhooks/calendar/${firmId}/${row.id}`,
        },
        { status: 201 }
      );
    })
  )
);
