import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { supervisionMetrics, users, matters, tasks } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { withAuth } from "@/middleware/withAuth";
import { withPermission } from "@/middleware/withPermission";
import { withErrorHandler } from "@/middleware/withErrorHandler";

/**
 * GET /api/compliance/supervision
 * Get workload metrics for supervision dashboard
 */
export const GET = withErrorHandler(
  withAuth(
    withPermission("compliance:read")(async (request, { user }) => {
      const firmId = await getOrCreateFirmIdForUser(user.user.id);
      const { searchParams } = new URL(request.url);

      // Parse query params
      const userId = searchParams.get("userId") || undefined;
      const period = searchParams.get("period") || "current"; // current, previous, custom
      const startDate = searchParams.get("startDate");
      const endDate = searchParams.get("endDate");

      // Calculate period dates
      const now = new Date();
      let periodStart: Date;
      let periodEnd: Date;

      if (period === "custom" && startDate && endDate) {
        periodStart = new Date(startDate);
        periodEnd = new Date(endDate);
      } else if (period === "previous") {
        // Previous week
        periodEnd = new Date(now);
        periodEnd.setDate(periodEnd.getDate() - 7);
        periodStart = new Date(periodEnd);
        periodStart.setDate(periodStart.getDate() - 7);
      } else {
        // Current week (default)
        periodStart = new Date(now);
        periodStart.setDate(periodStart.getDate() - 7);
        periodEnd = now;
      }

      const result = await withFirmDb(firmId, async (tx) => {
        // Build filters for stored metrics
        const filters = [
          eq(supervisionMetrics.firmId, firmId),
          gte(supervisionMetrics.periodStart, periodStart),
          lte(supervisionMetrics.periodEnd, periodEnd),
        ];

        if (userId) {
          filters.push(eq(supervisionMetrics.userId, userId));
        }

        // Get stored supervision metrics
        const storedMetrics = await tx
          .select()
          .from(supervisionMetrics)
          .where(and(...filters))
          .orderBy(desc(supervisionMetrics.calculatedAt));

        // If we have recent metrics, return them
        if (storedMetrics.length > 0) {
          return {
            metrics: storedMetrics.map((m) => ({
              id: m.id,
              userId: m.userId,
              supervisorId: m.supervisorId,
              periodStart: m.periodStart.toISOString(),
              periodEnd: m.periodEnd.toISOString(),
              activeMatters: m.activeMatters,
              mattersOpened: m.mattersOpened,
              mattersClosed: m.mattersClosed,
              billableHours: m.billableHours,
              revenue: m.revenue,
              overdueTasks: m.overdueTasks,
              highRiskMatters: m.highRiskMatters,
              additionalMetrics: m.additionalMetrics,
              calculatedAt: m.calculatedAt.toISOString(),
            })),
            period: {
              start: periodStart.toISOString(),
              end: periodEnd.toISOString(),
            },
          };
        }

        // If no stored metrics, calculate live from current data
        // This is a simplified calculation - production would use background jobs
        const userFilters = [eq(users.firmId, firmId)];
        if (userId) {
          userFilters.push(eq(users.id, userId));
        }

        const firmUsers = await tx
          .select({ id: users.id, name: users.name, email: users.email })
          .from(users)
          .where(and(...userFilters));

        const liveMetrics = await Promise.all(
          firmUsers.map(async (u) => {
            // Count active matters
            const [{ activeMatters }] = await tx
              .select({ activeMatters: sql<number>`count(*)` })
              .from(matters)
              .where(
                and(
                  eq(matters.firmId, firmId),
                  eq(matters.feeEarnerId, u.id),
                  eq(matters.status, "active")
                )
              );

            // Count overdue tasks
            const [{ overdueTasks }] = await tx
              .select({ overdueTasks: sql<number>`count(*)` })
              .from(tasks)
              .where(
                and(
                  eq(tasks.firmId, firmId),
                  eq(tasks.assigneeId, u.id),
                  eq(tasks.status, "pending"),
                  lte(tasks.dueDate, now)
                )
              );

            // Count high-risk matters
            const [{ highRiskMatters }] = await tx
              .select({ highRiskMatters: sql<number>`count(*)` })
              .from(matters)
              .where(
                and(
                  eq(matters.firmId, firmId),
                  eq(matters.feeEarnerId, u.id),
                  gte(matters.riskScore, 67)
                )
              );

            return {
              id: `live-${u.id}`,
              userId: u.id,
              userName: u.name,
              userEmail: u.email,
              supervisorId: null,
              periodStart: periodStart.toISOString(),
              periodEnd: periodEnd.toISOString(),
              activeMatters: Number(activeMatters),
              mattersOpened: 0, // Would need to query by creation date range
              mattersClosed: 0, // Would need to query by closed date range
              billableHours: 0, // Would need time entries aggregation
              revenue: 0, // Would need invoice aggregation
              overdueTasks: Number(overdueTasks),
              highRiskMatters: Number(highRiskMatters),
              additionalMetrics: null,
              calculatedAt: now.toISOString(),
              isLive: true, // Indicates this is calculated live, not stored
            };
          })
        );

        return {
          metrics: liveMetrics,
          period: {
            start: periodStart.toISOString(),
            end: periodEnd.toISOString(),
          },
          isLive: true,
        };
      });

      return NextResponse.json(result);
    })
  )
);
