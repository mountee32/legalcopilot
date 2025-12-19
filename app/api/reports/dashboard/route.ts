import { NextRequest, NextResponse } from "next/server";
import { and, eq, gte, lte, sql, lt } from "drizzle-orm";
import { matters, invoices, timeEntries, tasks } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { ReportQuerySchema, DashboardReportSchema } from "@/lib/api/schemas/reports";
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
        // Active matters count
        const [activeMattersResult] = await tx
          .select({ count: sql<number>`count(*)` })
          .from(matters)
          .where(and(eq(matters.firmId, firmId), eq(matters.status, "active")));

        // Revenue calculation (paid and partially paid invoices)
        const revenueWhere = [
          eq(invoices.firmId, firmId),
          sql`${invoices.status} IN ('paid', 'partially_paid')`,
        ];
        if (query.from) {
          revenueWhere.push(gte(invoices.invoiceDate, query.from));
        }
        if (query.to) {
          revenueWhere.push(lte(invoices.invoiceDate, query.to));
        }

        const [revenueResult] = await tx
          .select({
            total: sql<string>`COALESCE(SUM(${invoices.paidAmount}), 0)::numeric(10,2)`,
          })
          .from(invoices)
          .where(and(...revenueWhere));

        // WIP calculation (submitted and approved time entries not yet billed)
        const wipWhere = [
          eq(timeEntries.firmId, firmId),
          sql`${timeEntries.status} IN ('submitted', 'approved')`,
          eq(timeEntries.isBillable, true),
        ];
        if (query.from) {
          wipWhere.push(gte(timeEntries.workDate, query.from));
        }
        if (query.to) {
          wipWhere.push(lte(timeEntries.workDate, query.to));
        }

        const [wipResult] = await tx
          .select({
            total: sql<string>`COALESCE(SUM(${timeEntries.amount}), 0)::numeric(10,2)`,
          })
          .from(timeEntries)
          .where(and(...wipWhere));

        // Task counts
        const [pendingTasksResult] = await tx
          .select({ count: sql<number>`count(*)` })
          .from(tasks)
          .where(and(eq(tasks.firmId, firmId), sql`${tasks.status} IN ('pending', 'in_progress')`));

        const now = new Date().toISOString();
        const [overdueTasksResult] = await tx
          .select({ count: sql<number>`count(*)` })
          .from(tasks)
          .where(
            and(
              eq(tasks.firmId, firmId),
              sql`${tasks.status} IN ('pending', 'in_progress')`,
              lt(tasks.dueDate, now)
            )
          );

        // Outstanding invoices (sent but not fully paid)
        const [outstandingInvoicesResult] = await tx
          .select({ count: sql<number>`count(*)` })
          .from(invoices)
          .where(
            and(
              eq(invoices.firmId, firmId),
              sql`${invoices.status} IN ('sent', 'viewed', 'partially_paid', 'overdue')`
            )
          );

        // Overdue debt (overdue invoices)
        const [overdueDebtResult] = await tx
          .select({
            total: sql<string>`COALESCE(SUM(${invoices.balanceDue}), 0)::numeric(10,2)`,
          })
          .from(invoices)
          .where(and(eq(invoices.firmId, firmId), eq(invoices.status, "overdue")));

        return {
          activeMatters: Number(activeMattersResult?.count ?? 0),
          totalRevenue: revenueResult?.total ?? "0.00",
          totalWip: wipResult?.total ?? "0.00",
          pendingTasks: Number(pendingTasksResult?.count ?? 0),
          overdueTasks: Number(overdueTasksResult?.count ?? 0),
          outstandingInvoices: Number(outstandingInvoicesResult?.count ?? 0),
          overdueDebt: overdueDebtResult?.total ?? "0.00",
        };
      });

      // Validate response against schema
      const validated = DashboardReportSchema.parse(result);

      return NextResponse.json(validated);
    })
  )
);
