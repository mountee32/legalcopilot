import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, sql } from "drizzle-orm";
import { leads, quotes } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { CreateQuoteSchema, QuoteQuerySchema } from "@/lib/api/schemas";
import { withAuth } from "@/middleware/withAuth";
import { NotFoundError, ValidationError, withErrorHandler } from "@/middleware/withErrorHandler";
import { withPermission } from "@/middleware/withPermission";

export const GET = withErrorHandler(
  withAuth(
    withPermission("intake:read")(async (request: NextRequest, { user }) => {
      const url = new URL(request.url);
      const query = QuoteQuerySchema.parse(Object.fromEntries(url.searchParams.entries()));

      const firmId = await getOrCreateFirmIdForUser(user.user.id);
      const offset = (query.page - 1) * query.limit;

      const whereClauses = [eq(quotes.firmId, firmId)];
      if (query.leadId) whereClauses.push(eq(quotes.leadId, query.leadId));
      if (query.status) whereClauses.push(eq(quotes.status, query.status));

      const where = and(...whereClauses);

      const { total, rows } = await withFirmDb(firmId, async (tx) => {
        const [countRow] = await tx
          .select({ total: sql<number>`count(*)` })
          .from(quotes)
          .where(where);

        const rows = await tx
          .select()
          .from(quotes)
          .where(where)
          .orderBy(desc(quotes.createdAt))
          .limit(query.limit)
          .offset(offset);

        return { total: Number(countRow?.total ?? 0), rows };
      });

      const totalPages = Math.max(1, Math.ceil(total / query.limit));

      return NextResponse.json({
        quotes: rows,
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
    withPermission("intake:write")(async (request: NextRequest, { user }) => {
      const body = await request.json().catch(() => ({}));
      const data = CreateQuoteSchema.parse(body);

      const firmId = await getOrCreateFirmIdForUser(user.user.id);

      const row = await withFirmDb(firmId, async (tx) => {
        const [lead] = await tx
          .select({ id: leads.id })
          .from(leads)
          .where(and(eq(leads.id, data.leadId), eq(leads.firmId, firmId)))
          .limit(1);
        if (!lead) throw new NotFoundError("Lead not found");

        const [quote] = await tx
          .insert(quotes)
          .values({
            firmId,
            leadId: data.leadId,
            type: data.type,
            status: "draft",
            items: data.items ?? null,
            fees: data.fees ?? null,
            disbursements: data.disbursements ?? null,
            subtotal: data.subtotal ?? "0.00",
            vatAmount: data.vatAmount ?? "0.00",
            total: data.total,
            validUntil: data.validUntil ?? null,
            notes: data.notes ?? null,
            convertedToMatterId: null,
            createdById: user.user.id,
            updatedAt: new Date(),
          })
          .returning();

        return quote ?? null;
      });

      if (!row) throw new ValidationError("Failed to create quote");
      return NextResponse.json(row, { status: 201 });
    })
  )
);
