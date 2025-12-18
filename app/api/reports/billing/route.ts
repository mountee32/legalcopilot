import { NextRequest, NextResponse } from "next/server";
import { and, eq, gte, lte, sql } from "drizzle-orm";
import { invoices, timeEntries } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { ReportQuerySchema, BillingReportSchema } from "@/lib/api/schemas/reports";
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
        // WIP breakdown by status
        let wipWhere = [eq(timeEntries.firmId, firmId), eq(timeEntries.isBillable, true)];
        if (query.from) {
          wipWhere.push(gte(timeEntries.workDate, query.from));
        }
        if (query.to) {
          wipWhere.push(lte(timeEntries.workDate, query.to));
        }
        if (query.practiceArea) {
          // Join with matters to filter by practice area
          wipWhere.push(sql`EXISTS (
            SELECT 1 FROM ${sql.identifier("matters")} m
            WHERE m.id = ${timeEntries.matterId}
            AND m.practice_area = ${query.practiceArea}
          )`);
        }

        const [wipBreakdown] = await tx
          .select({
            draft: sql<string>`COALESCE(SUM(CASE WHEN ${timeEntries.status} = 'draft' THEN ${timeEntries.amount} ELSE 0 END), 0)::numeric(10,2)`,
            submitted: sql<string>`COALESCE(SUM(CASE WHEN ${timeEntries.status} = 'submitted' THEN ${timeEntries.amount} ELSE 0 END), 0)::numeric(10,2)`,
            approved: sql<string>`COALESCE(SUM(CASE WHEN ${timeEntries.status} = 'approved' THEN ${timeEntries.amount} ELSE 0 END), 0)::numeric(10,2)`,
            total: sql<string>`COALESCE(SUM(${timeEntries.amount}), 0)::numeric(10,2)`,
          })
          .from(timeEntries)
          .where(and(...wipWhere));

        // Aged debt analysis (based on due date)
        const now = new Date();
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const sixtyDaysAgo = new Date(now);
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
        const ninetyDaysAgo = new Date(now);
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        let debtWhere = [
          eq(invoices.firmId, firmId),
          sql`${invoices.status} IN ('sent', 'viewed', 'partially_paid', 'overdue')`,
        ];

        const [agedDebt] = await tx
          .select({
            current: sql<string>`COALESCE(SUM(CASE WHEN ${invoices.dueDate} >= ${thirtyDaysAgo.toISOString().split("T")[0]} THEN ${invoices.balanceDue} ELSE 0 END), 0)::numeric(10,2)`,
            days31to60: sql<string>`COALESCE(SUM(CASE WHEN ${invoices.dueDate} >= ${sixtyDaysAgo.toISOString().split("T")[0]} AND ${invoices.dueDate} < ${thirtyDaysAgo.toISOString().split("T")[0]} THEN ${invoices.balanceDue} ELSE 0 END), 0)::numeric(10,2)`,
            days61to90: sql<string>`COALESCE(SUM(CASE WHEN ${invoices.dueDate} >= ${ninetyDaysAgo.toISOString().split("T")[0]} AND ${invoices.dueDate} < ${sixtyDaysAgo.toISOString().split("T")[0]} THEN ${invoices.balanceDue} ELSE 0 END), 0)::numeric(10,2)`,
            days90plus: sql<string>`COALESCE(SUM(CASE WHEN ${invoices.dueDate} < ${ninetyDaysAgo.toISOString().split("T")[0]} THEN ${invoices.balanceDue} ELSE 0 END), 0)::numeric(10,2)`,
            total: sql<string>`COALESCE(SUM(${invoices.balanceDue}), 0)::numeric(10,2)`,
          })
          .from(invoices)
          .where(and(...debtWhere));

        // Revenue breakdown
        let revenueWhere = [eq(invoices.firmId, firmId)];
        if (query.from) {
          revenueWhere.push(gte(invoices.invoiceDate, query.from));
        }
        if (query.to) {
          revenueWhere.push(lte(invoices.invoiceDate, query.to));
        }
        if (query.practiceArea) {
          // Join with matters to filter by practice area
          revenueWhere.push(sql`EXISTS (
            SELECT 1 FROM ${sql.identifier("matters")} m
            WHERE m.id = ${invoices.matterId}
            AND m.practice_area = ${query.practiceArea}
          )`);
        }

        const [revenue] = await tx
          .select({
            total: sql<string>`COALESCE(SUM(${invoices.total}), 0)::numeric(10,2)`,
            paid: sql<string>`COALESCE(SUM(CASE WHEN ${invoices.status} IN ('paid', 'partially_paid') THEN ${invoices.paidAmount} ELSE 0 END), 0)::numeric(10,2)`,
            outstanding: sql<string>`COALESCE(SUM(CASE WHEN ${invoices.status} IN ('sent', 'viewed', 'partially_paid', 'overdue') THEN ${invoices.balanceDue} ELSE 0 END), 0)::numeric(10,2)`,
          })
          .from(invoices)
          .where(and(...revenueWhere));

        return {
          wip: {
            total: wipBreakdown?.total ?? "0.00",
            draft: wipBreakdown?.draft ?? "0.00",
            submitted: wipBreakdown?.submitted ?? "0.00",
            approved: wipBreakdown?.approved ?? "0.00",
          },
          agedDebt: {
            current: agedDebt?.current ?? "0.00",
            days31to60: agedDebt?.days31to60 ?? "0.00",
            days61to90: agedDebt?.days61to90 ?? "0.00",
            days90plus: agedDebt?.days90plus ?? "0.00",
            total: agedDebt?.total ?? "0.00",
          },
          revenue: {
            total: revenue?.total ?? "0.00",
            paid: revenue?.paid ?? "0.00",
            outstanding: revenue?.outstanding ?? "0.00",
          },
        };
      });

      // Validate response against schema
      const validated = BillingReportSchema.parse(result);

      return NextResponse.json(validated);
    })
  )
);
