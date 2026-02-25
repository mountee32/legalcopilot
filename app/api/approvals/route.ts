import { NextResponse } from "next/server";
import { and, desc, eq, sql } from "drizzle-orm";
import { approvalRequests, users, roles } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { ApprovalQuerySchema, CreateApprovalRequestSchema } from "@/lib/api/schemas";
import { createNotifications } from "@/lib/notifications/create";
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

        // Notify users who can decide approvals (including wildcard permissions)
        const deciders = await tx
          .select({ id: users.id })
          .from(users)
          .innerJoin(roles, eq(users.roleId, roles.id))
          .where(
            and(
              eq(users.firmId, firmId),
              sql`(
                ${roles.permissions} @> '["approvals:decide"]'::jsonb OR
                ${roles.permissions} @> '["approvals:*"]'::jsonb OR
                ${roles.permissions} @> '["*"]'::jsonb
              )`
            )
          );

        if (deciders.length > 0) {
          await createNotifications(
            tx,
            deciders.map((u) => ({
              firmId,
              userId: u.id,
              type: "approval_required" as const,
              title: `Approval required: ${data.action}`,
              body: data.summary,
              link: data.matterId ? `/matters/${data.matterId}` : "/dashboard",
              metadata: { approvalId: approval.id, action: data.action },
            }))
          );
        }

        return approval;
      });

      return NextResponse.json(approval, { status: 201 });
    })
  )
);
