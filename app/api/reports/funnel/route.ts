import { NextRequest, NextResponse } from "next/server";
import { and, eq, gte, lte, sql } from "drizzle-orm";
import { leads } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { ReportQuerySchema, FunnelReportSchema } from "@/lib/api/schemas/reports";
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
        let whereClauses = [eq(leads.firmId, firmId)];
        if (query.from) {
          whereClauses.push(gte(leads.createdAt, new Date(query.from).toISOString()));
        }
        if (query.to) {
          whereClauses.push(lte(leads.createdAt, new Date(query.to).toISOString()));
        }
        if (query.practiceArea) {
          whereClauses.push(eq(leads.enquiryType, query.practiceArea));
        }

        const where = and(...whereClauses);

        // Lead counts by status
        const statusCounts = await tx
          .select({
            status: leads.status,
            count: sql<number>`count(*)`,
          })
          .from(leads)
          .where(where)
          .groupBy(leads.status);

        // Total leads
        const [totalResult] = await tx
          .select({ count: sql<number>`count(*)` })
          .from(leads)
          .where(where);

        const totalLeads = Number(totalResult?.count ?? 0);

        // Won leads count
        const [wonResult] = await tx
          .select({ count: sql<number>`count(*)` })
          .from(leads)
          .where(and(...whereClauses, eq(leads.status, "won")));

        const wonLeads = Number(wonResult?.count ?? 0);

        // Lost leads count
        const [lostResult] = await tx
          .select({ count: sql<number>`count(*)` })
          .from(leads)
          .where(and(...whereClauses, eq(leads.status, "lost")));

        const lostLeads = Number(lostResult?.count ?? 0);

        // Average time to convert (from created to converted)
        // Only for won leads
        const [avgTimeResult] = await tx
          .select({
            avgDays: sql<number>`COALESCE(AVG(EXTRACT(EPOCH FROM (${leads.updatedAt} - ${leads.createdAt})) / 86400), 0)`,
          })
          .from(leads)
          .where(and(...whereClauses, eq(leads.status, "won")));

        const avgTimeToConvert = Number(avgTimeResult?.avgDays ?? 0);

        // Calculate percentages
        const byStatus = statusCounts.map((item) => ({
          status: item.status,
          count: Number(item.count),
          percentage: totalLeads > 0 ? (Number(item.count) / totalLeads) * 100 : 0,
        }));

        // Conversion rate
        const conversionRate = totalLeads > 0 ? wonLeads / totalLeads : 0;

        return {
          byStatus,
          conversionRate,
          avgTimeToConvert,
          totalLeads,
          wonLeads,
          lostLeads,
        };
      });

      // Validate response against schema
      const validated = FunnelReportSchema.parse(result);

      return NextResponse.json(validated);
    })
  )
);
