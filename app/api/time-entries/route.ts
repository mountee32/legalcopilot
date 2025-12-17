import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { matters, timeEntries, users } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { CreateTimeEntrySchema, TimeEntryQuerySchema } from "@/lib/api/schemas";
import { formatMoney, parseMoney, roundMoney } from "@/lib/billing/money";
import { withAuth } from "@/middleware/withAuth";
import { NotFoundError, ValidationError, withErrorHandler } from "@/middleware/withErrorHandler";
import { withPermission } from "@/middleware/withPermission";

export const GET = withErrorHandler(
  withAuth(
    withPermission("time:read")(async (request: NextRequest, { user }) => {
      const url = new URL(request.url);
      const query = TimeEntryQuerySchema.parse(Object.fromEntries(url.searchParams.entries()));

      const firmId = await getOrCreateFirmIdForUser(user.user.id);
      const offset = (query.page - 1) * query.limit;

      const whereClauses = [eq(timeEntries.firmId, firmId)];
      if (query.matterId) whereClauses.push(eq(timeEntries.matterId, query.matterId));
      if (query.feeEarnerId) whereClauses.push(eq(timeEntries.feeEarnerId, query.feeEarnerId));
      if (query.status) whereClauses.push(eq(timeEntries.status, query.status));
      if (query.from) whereClauses.push(gte(timeEntries.workDate, query.from));
      if (query.to) whereClauses.push(lte(timeEntries.workDate, query.to));

      const where = and(...whereClauses);

      const { total, rows } = await withFirmDb(firmId, async (tx) => {
        const [countRow] = await tx
          .select({ total: sql<number>`count(*)` })
          .from(timeEntries)
          .where(where);

        const rows = await tx
          .select()
          .from(timeEntries)
          .where(where)
          .orderBy(desc(timeEntries.workDate), desc(timeEntries.createdAt))
          .limit(query.limit)
          .offset(offset);

        return { total: Number(countRow?.total ?? 0), rows };
      });

      const totalPages = Math.max(1, Math.ceil(total / query.limit));

      return NextResponse.json({
        timeEntries: rows,
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
    withPermission("time:write")(async (request: NextRequest, { user }) => {
      const firmId = await getOrCreateFirmIdForUser(user.user.id);
      const body = await request.json().catch(() => ({}));
      const data = CreateTimeEntrySchema.parse(body);

      const feeEarnerId = data.feeEarnerId ?? user.user.id;
      const hourlyRate = parseMoney(data.hourlyRate);
      const amount = roundMoney((data.durationMinutes / 60) * hourlyRate);

      const row = await withFirmDb(firmId, async (tx) => {
        const [matter] = await tx
          .select({ id: matters.id })
          .from(matters)
          .where(and(eq(matters.id, data.matterId), eq(matters.firmId, firmId)))
          .limit(1);

        if (!matter) throw new NotFoundError("Matter not found");

        const [feeEarner] = await tx
          .select({ id: users.id })
          .from(users)
          .where(and(eq(users.id, feeEarnerId), eq(users.firmId, firmId)))
          .limit(1);

        if (!feeEarner) throw new ValidationError("Fee earner not found in firm");

        const [entry] = await tx
          .insert(timeEntries)
          .values({
            firmId,
            matterId: data.matterId,
            feeEarnerId,
            workDate: data.workDate,
            description: data.description,
            durationMinutes: data.durationMinutes,
            hourlyRate: data.hourlyRate,
            amount: formatMoney(amount),
            status: "draft",
            activityCode: data.activityCode ?? null,
            updatedAt: new Date(),
          })
          .returning();

        return entry ?? null;
      });

      if (!row) throw new ValidationError("Failed to create time entry");
      return NextResponse.json(row, { status: 201 });
    })
  )
);
