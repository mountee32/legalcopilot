import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, sql } from "drizzle-orm";
import { invoices } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { InvoiceQuerySchema } from "@/lib/api/schemas";
import { withAuth } from "@/middleware/withAuth";
import { withErrorHandler } from "@/middleware/withErrorHandler";
import { withPermission } from "@/middleware/withPermission";

export const GET = withErrorHandler(
  withAuth(
    withPermission("billing:read")(async (request: NextRequest, { user }) => {
      const url = new URL(request.url);
      const query = InvoiceQuerySchema.parse(Object.fromEntries(url.searchParams.entries()));

      const firmId = await getOrCreateFirmIdForUser(user.user.id);
      const offset = (query.page - 1) * query.limit;

      const whereClauses = [eq(invoices.firmId, firmId)];
      if (query.clientId) whereClauses.push(eq(invoices.clientId, query.clientId));
      if (query.matterId) whereClauses.push(eq(invoices.matterId, query.matterId));
      if (query.status) whereClauses.push(eq(invoices.status, query.status));

      const where = and(...whereClauses);

      const { total, rows } = await withFirmDb(firmId, async (tx) => {
        const [countRow] = await tx
          .select({ total: sql<number>`count(*)` })
          .from(invoices)
          .where(where);

        const rows = await tx
          .select()
          .from(invoices)
          .where(where)
          .orderBy(desc(invoices.createdAt))
          .limit(query.limit)
          .offset(offset);

        return { total: Number(countRow?.total ?? 0), rows };
      });

      const totalPages = Math.max(1, Math.ceil(total / query.limit));

      return NextResponse.json({
        invoices: rows,
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
