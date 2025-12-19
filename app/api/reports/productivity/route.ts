import { NextRequest, NextResponse } from "next/server";
import { and, eq, gte, lte, sql } from "drizzle-orm";
import { timeEntries, users, matters } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { ProductivityQuerySchema, ProductivityReportSchema } from "@/lib/api/schemas/reports";
import { withAuth } from "@/middleware/withAuth";
import { withErrorHandler } from "@/middleware/withErrorHandler";
import { withPermission } from "@/middleware/withPermission";

export const GET = withErrorHandler(
  withAuth(
    withPermission("reports:view")(async (request: NextRequest, { user }) => {
      const url = new URL(request.url);
      const query = ProductivityQuerySchema.parse(Object.fromEntries(url.searchParams.entries()));

      const firmId = await getOrCreateFirmIdForUser(user.user.id);

      const result = await withFirmDb(firmId, async (tx) => {
        // Build WHERE clause for date range and filters
        const whereClauses = [eq(timeEntries.firmId, firmId)];
        if (query.from) {
          whereClauses.push(gte(timeEntries.workDate, query.from));
        }
        if (query.to) {
          whereClauses.push(lte(timeEntries.workDate, query.to));
        }
        if (query.feeEarnerId) {
          whereClauses.push(eq(timeEntries.feeEarnerId, query.feeEarnerId));
        }
        if (query.practiceArea) {
          // Join with matters to filter by practice area
          whereClauses.push(sql`EXISTS (
            SELECT 1 FROM ${sql.identifier("matters")} m
            WHERE m.id = ${timeEntries.matterId}
            AND m.practice_area = ${query.practiceArea}
          )`);
        }

        const where = and(...whereClauses);

        // Fee earner productivity stats
        const feeEarnerStats = await tx
          .select({
            feeEarnerId: timeEntries.feeEarnerId,
            feeEarnerName: users.name,
            totalMinutes: sql<number>`COALESCE(SUM(${timeEntries.durationMinutes}), 0)`,
            billableMinutes: sql<number>`COALESCE(SUM(CASE WHEN ${timeEntries.isBillable} THEN ${timeEntries.durationMinutes} ELSE 0 END), 0)`,
            nonBillableMinutes: sql<number>`COALESCE(SUM(CASE WHEN NOT ${timeEntries.isBillable} THEN ${timeEntries.durationMinutes} ELSE 0 END), 0)`,
            revenue: sql<string>`COALESCE(SUM(CASE WHEN ${timeEntries.isBillable} THEN ${timeEntries.amount} ELSE 0 END), 0)::numeric(10,2)`,
          })
          .from(timeEntries)
          .innerJoin(users, eq(timeEntries.feeEarnerId, users.id))
          .where(where)
          .groupBy(timeEntries.feeEarnerId, users.name);

        // Get active matter counts per fee earner
        const matterCounts = await tx
          .select({
            feeEarnerId: matters.feeEarnerId,
            count: sql<number>`count(DISTINCT ${matters.id})`,
          })
          .from(matters)
          .where(
            and(
              eq(matters.firmId, firmId),
              eq(matters.status, "active"),
              query.feeEarnerId ? eq(matters.feeEarnerId, query.feeEarnerId) : undefined
            )
          )
          .groupBy(matters.feeEarnerId);

        // Create a map of fee earner to matter count
        const matterCountMap = new Map(
          matterCounts
            .filter((mc) => mc.feeEarnerId !== null)
            .map((mc) => [mc.feeEarnerId!, Number(mc.count)])
        );

        // Build final fee earner results
        const feeEarners = feeEarnerStats.map((stat) => {
          const totalHours = Number(stat.totalMinutes) / 60;
          const billableHours = Number(stat.billableMinutes) / 60;
          const nonBillableHours = Number(stat.nonBillableMinutes) / 60;
          const utilisation = totalHours > 0 ? billableHours / totalHours : 0;

          return {
            feeEarnerId: stat.feeEarnerId,
            feeEarnerName: stat.feeEarnerName || "Unknown",
            totalHours: Math.round(totalHours * 10) / 10, // Round to 1 decimal
            billableHours: Math.round(billableHours * 10) / 10,
            nonBillableHours: Math.round(nonBillableHours * 10) / 10,
            utilisation: Math.round(utilisation * 1000) / 1000, // Round to 3 decimals
            revenue: stat.revenue,
            activeMatters: matterCountMap.get(stat.feeEarnerId) ?? 0,
          };
        });

        // Calculate summary
        const totalHours = feeEarners.reduce((sum, fe) => sum + fe.totalHours, 0);
        const totalBillableHours = feeEarners.reduce((sum, fe) => sum + fe.billableHours, 0);
        const totalRevenue = feeEarners.reduce((sum, fe) => {
          const amount = parseFloat(fe.revenue);
          return sum + (isNaN(amount) ? 0 : amount);
        }, 0);
        const avgUtilisation =
          feeEarners.length > 0
            ? feeEarners.reduce((sum, fe) => sum + fe.utilisation, 0) / feeEarners.length
            : 0;

        return {
          feeEarners,
          summary: {
            totalHours: Math.round(totalHours * 10) / 10,
            totalBillableHours: Math.round(totalBillableHours * 10) / 10,
            avgUtilisation: Math.round(avgUtilisation * 1000) / 1000,
            totalRevenue: totalRevenue.toFixed(2),
          },
        };
      });

      // Validate response against schema
      const validated = ProductivityReportSchema.parse(result);

      return NextResponse.json(validated);
    })
  )
);
