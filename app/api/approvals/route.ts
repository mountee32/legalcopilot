import { NextResponse } from "next/server";
import { and, desc, eq, sql } from "drizzle-orm";
import { approvalRequests } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { ApprovalQuerySchema } from "@/lib/api/schemas";
import { withAuth } from "@/middleware/withAuth";
import { withErrorHandler } from "@/middleware/withErrorHandler";
import { withPermission } from "@/middleware/withPermission";

export const GET = withErrorHandler(
  withAuth(
    withPermission("approvals:view")(async (request, { user }) => {
      const url = new URL(request.url);
      const query = ApprovalQuerySchema.parse(Object.fromEntries(url.searchParams.entries()));

      const firmId = await getOrCreateFirmIdForUser(user.user.id);

      const whereClauses = [eq(approvalRequests.firmId, firmId)];
      if (query.status) whereClauses.push(eq(approvalRequests.status, query.status));
      if (query.action) whereClauses.push(eq(approvalRequests.action, query.action));
      if (query.entityType) whereClauses.push(eq(approvalRequests.entityType, query.entityType));
      if (query.entityId) whereClauses.push(eq(approvalRequests.entityId, query.entityId));

      const where = and(...whereClauses);
      const offset = (query.page - 1) * query.limit;

      const { total, rows } = await withFirmDb(firmId, async (tx) => {
        const [countRow] = await tx
          .select({ total: sql<number>`count(*)` })
          .from(approvalRequests)
          .where(where);

        const rows = await tx
          .select()
          .from(approvalRequests)
          .where(where)
          .orderBy(desc(approvalRequests.createdAt))
          .limit(query.limit)
          .offset(offset);

        return { total: Number(countRow?.total ?? 0), rows };
      });

      const totalPages = Math.max(1, Math.ceil(total / query.limit));

      return NextResponse.json({
        approvals: rows,
        pagination: { page: query.page, limit: query.limit, total, totalPages },
      });
    })
  )
);
