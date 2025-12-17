import { NextResponse } from "next/server";
import { and, desc, eq, sql } from "drizzle-orm";
import { approvalRequests } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { ApprovalQuerySchema, CreateApprovalRequestSchema } from "@/lib/api/schemas";
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

export const POST = withErrorHandler(
  withAuth(
    withPermission("approvals:create")(async (request, { user }) => {
      const body = await request.json();
      const data = CreateApprovalRequestSchema.parse(body);

      const firmId = await getOrCreateFirmIdForUser(user.user.id);

      const approval = await withFirmDb(firmId, async (tx) => {
        const [approval] = await tx
          .insert(approvalRequests)
          .values({
            firmId,
            sourceType: data.sourceType ?? "ai",
            sourceId: data.sourceId ?? null,
            action: data.action,
            summary: data.summary,
            proposedPayload: data.proposedPayload ?? null,
            entityType: data.entityType ?? null,
            entityId: data.entityId ?? null,
            matterId: data.matterId ?? null,
            aiMetadata: data.aiMetadata ?? null,
            status: "pending",
            executionStatus: "not_executed",
          })
          .returning();
        return approval;
      });

      return NextResponse.json(approval, { status: 201 });
    })
  )
);
