import { NextRequest, NextResponse } from "next/server";
import { and, eq, gte, lte, sql } from "drizzle-orm";
import { matters, invoices } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { ReportQuerySchema, MatterSummaryReportSchema } from "@/lib/api/schemas/reports";
import { withAuth } from "@/middleware/withAuth";
import { withErrorHandler } from "@/middleware/withErrorHandler";
import { withPermission } from "@/middleware/withPermission";

export const GET = withErrorHandler(
  withAuth(
    withPermission("reports:view")(async (request: NextRequest, { user }) => {
      const url = new URL(request.url);
      const query = ReportQuerySchema.parse(Object.fromEntries(url.searchParams.entries()));

      const firmId = await getOrCreateFirmIdForUser(user.user.id);

      const result = await withFirmDb(firmId, async (tx) => {
        // Build WHERE clause for date range
        let whereClauses = [eq(matters.firmId, firmId)];
        if (query.from) {
          whereClauses.push(gte(matters.createdAt, new Date(query.from).toISOString()));
        }
        if (query.to) {
          whereClauses.push(lte(matters.createdAt, new Date(query.to).toISOString()));
        }
        if (query.practiceArea) {
          whereClauses.push(eq(matters.practiceArea, query.practiceArea));
        }

        const where = and(...whereClauses);

        // Total matters count
        const [totalResult] = await tx
          .select({ count: sql<number>`count(*)` })
          .from(matters)
          .where(where);

        const total = Number(totalResult?.count ?? 0);

        // Breakdown by status
        const statusCounts = await tx
          .select({
            status: matters.status,
            count: sql<number>`count(*)`,
          })
          .from(matters)
          .where(where)
          .groupBy(matters.status);

        const byStatus = statusCounts.map((item) => ({
          status: item.status,
          count: Number(item.count),
          percentage: total > 0 ? (Number(item.count) / total) * 100 : 0,
        }));

        // Breakdown by practice area with revenue
        const practiceAreaStats = await tx
          .select({
            practiceArea: matters.practiceArea,
            count: sql<number>`count(DISTINCT ${matters.id})`,
            revenue: sql<string>`COALESCE(SUM(${invoices.paidAmount}), 0)::numeric(10,2)`,
          })
          .from(matters)
          .leftJoin(invoices, eq(matters.id, invoices.matterId))
          .where(where)
          .groupBy(matters.practiceArea);

        const byPracticeArea = practiceAreaStats.map((item) => ({
          practiceArea: item.practiceArea,
          count: Number(item.count),
          percentage: total > 0 ? (Number(item.count) / total) * 100 : 0,
          revenue: item.revenue ?? "0.00",
        }));

        return {
          byStatus,
          byPracticeArea,
          total,
        };
      });

      // Validate response against schema
      const validated = MatterSummaryReportSchema.parse(result);

      return NextResponse.json(validated);
    })
  )
);
