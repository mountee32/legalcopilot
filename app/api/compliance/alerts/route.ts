import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, sql } from "drizzle-orm";
import { complianceAlerts } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { AlertsQuerySchema } from "@/lib/api/schemas/compliance";
import { withAuth } from "@/middleware/withAuth";
import { withPermission } from "@/middleware/withPermission";
import { withErrorHandler } from "@/middleware/withErrorHandler";

export const GET = withErrorHandler(
  withAuth(
    withPermission("compliance:read")(async (request, { user }) => {
      const firmId = await getOrCreateFirmIdForUser(user.user.id);
      const { searchParams } = new URL(request.url);

      // Parse and validate query parameters
      const query = AlertsQuerySchema.parse({
        page: searchParams.get("page") || "1",
        limit: searchParams.get("limit") || "20",
        status: searchParams.get("status") || undefined,
        priority: searchParams.get("priority") || undefined,
        matterId: searchParams.get("matterId") || undefined,
        userId: searchParams.get("userId") || undefined,
        ruleId: searchParams.get("ruleId") || undefined,
      });

      const offset = (query.page - 1) * query.limit;

      const result = await withFirmDb(firmId, async (tx) => {
        // Build filters
        const filters = [eq(complianceAlerts.firmId, firmId)];

        if (query.status) {
          filters.push(eq(complianceAlerts.status, query.status as any));
        }

        if (query.priority) {
          filters.push(eq(complianceAlerts.priority, query.priority as any));
        }

        if (query.matterId) {
          filters.push(eq(complianceAlerts.matterId, query.matterId));
        }

        if (query.userId) {
          filters.push(eq(complianceAlerts.userId, query.userId));
        }

        if (query.ruleId) {
          filters.push(eq(complianceAlerts.ruleId, query.ruleId));
        }

        // Get alerts
        const alerts = await tx
          .select()
          .from(complianceAlerts)
          .where(and(...filters))
          .orderBy(desc(complianceAlerts.triggeredAt))
          .limit(query.limit)
          .offset(offset);

        // Get total count
        const [{ count }] = await tx
          .select({ count: sql<number>`count(*)` })
          .from(complianceAlerts)
          .where(and(...filters));

        const total = Number(count);
        const totalPages = Math.ceil(total / query.limit);

        return {
          alerts: alerts.map((a) => ({
            id: a.id,
            firmId: a.firmId,
            ruleId: a.ruleId,
            matterId: a.matterId,
            userId: a.userId,
            priority: a.priority,
            status: a.status,
            title: a.title,
            message: a.message,
            context: a.context,
            triggeredAt: a.triggeredAt.toISOString(),
            acknowledgedAt: a.acknowledgedAt?.toISOString() || null,
            acknowledgedBy: a.acknowledgedBy,
            resolvedAt: a.resolvedAt?.toISOString() || null,
            resolvedBy: a.resolvedBy,
            resolutionNotes: a.resolutionNotes,
            createdAt: a.createdAt.toISOString(),
            updatedAt: a.updatedAt.toISOString(),
          })),
          pagination: {
            page: query.page,
            limit: query.limit,
            total,
            totalPages,
          },
        };
      });

      return NextResponse.json(result);
    })
  )
);
