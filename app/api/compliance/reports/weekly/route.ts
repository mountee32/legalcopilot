import { NextRequest, NextResponse } from "next/server";
import { and, count, eq, gte, lte, sql } from "drizzle-orm";
import {
  complianceAlerts,
  complianceRules,
  riskEvaluations,
  matters,
  tasks,
} from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { withAuth } from "@/middleware/withAuth";
import { withPermission } from "@/middleware/withPermission";
import { withErrorHandler } from "@/middleware/withErrorHandler";

/**
 * GET /api/compliance/reports/weekly
 * Generate weekly compliance summary report
 */
export const GET = withErrorHandler(
  withAuth(
    withPermission("compliance:read")(async (request, { user }) => {
      const firmId = await getOrCreateFirmIdForUser(user.user.id);
      const { searchParams } = new URL(request.url);

      // Parse date range (defaults to past 7 days)
      const endDateParam = searchParams.get("endDate");
      const endDate = endDateParam ? new Date(endDateParam) : new Date();
      const startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - 7);

      const report = await withFirmDb(firmId, async (tx) => {
        // Get alert statistics
        const alertStats = await tx
          .select({
            status: complianceAlerts.status,
            priority: complianceAlerts.priority,
            count: count(),
          })
          .from(complianceAlerts)
          .where(
            and(
              eq(complianceAlerts.firmId, firmId),
              gte(complianceAlerts.triggeredAt, startDate),
              lte(complianceAlerts.triggeredAt, endDate)
            )
          )
          .groupBy(complianceAlerts.status, complianceAlerts.priority);

        // Aggregate alert stats
        const alertSummary = {
          total: 0,
          byStatus: { pending: 0, acknowledged: 0, resolved: 0, dismissed: 0 },
          byPriority: { info: 0, warning: 0, urgent: 0, critical: 0 },
        };

        for (const stat of alertStats) {
          alertSummary.total += stat.count;
          alertSummary.byStatus[stat.status as keyof typeof alertSummary.byStatus] += stat.count;
          alertSummary.byPriority[stat.priority as keyof typeof alertSummary.byPriority] +=
            stat.count;
        }

        // Get risk evaluation statistics
        const riskStats = await tx
          .select({
            severity: riskEvaluations.severity,
            count: count(),
            avgScore: sql<number>`avg(${riskEvaluations.score})`,
          })
          .from(riskEvaluations)
          .where(
            and(
              eq(riskEvaluations.firmId, firmId),
              gte(riskEvaluations.evaluatedAt, startDate),
              lte(riskEvaluations.evaluatedAt, endDate)
            )
          )
          .groupBy(riskEvaluations.severity);

        const riskSummary = {
          evaluationsPerformed: 0,
          averageScore: 0,
          bySeverity: { low: 0, medium: 0, high: 0, critical: 0 },
        };

        let totalScore = 0;
        for (const stat of riskStats) {
          riskSummary.evaluationsPerformed += stat.count;
          riskSummary.bySeverity[stat.severity as keyof typeof riskSummary.bySeverity] +=
            stat.count;
          totalScore += stat.avgScore * stat.count;
        }
        riskSummary.averageScore =
          riskSummary.evaluationsPerformed > 0
            ? Math.round(totalScore / riskSummary.evaluationsPerformed)
            : 0;

        // Get active rules count
        const [{ activeRules }] = await tx
          .select({ activeRules: count() })
          .from(complianceRules)
          .where(and(eq(complianceRules.firmId, firmId), eq(complianceRules.isActive, true)));

        // Get matter statistics
        const [matterStats] = await tx
          .select({
            total: count(),
            highRisk: sql<number>`count(*) filter (where ${matters.riskScore} >= 67)`,
            criticalRisk: sql<number>`count(*) filter (where ${matters.riskScore} >= 90)`,
          })
          .from(matters)
          .where(and(eq(matters.firmId, firmId), eq(matters.status, "active")));

        // Get overdue tasks count
        const [{ overdueTasks }] = await tx
          .select({ overdueTasks: count() })
          .from(tasks)
          .where(
            and(
              eq(tasks.firmId, firmId),
              eq(tasks.status, "pending"),
              lte(tasks.dueDate, new Date())
            )
          );

        // Calculate compliance score (simplified metric)
        // Higher is better: based on resolved alerts, low-risk matters, and completed tasks
        const resolvedRate =
          alertSummary.total > 0
            ? (alertSummary.byStatus.resolved + alertSummary.byStatus.dismissed) /
              alertSummary.total
            : 1;
        const lowRiskRate =
          matterStats.total > 0
            ? 1 -
              (Number(matterStats.highRisk) + Number(matterStats.criticalRisk)) / matterStats.total
            : 1;
        const complianceScore = Math.round((resolvedRate * 0.4 + lowRiskRate * 0.6) * 100);

        return {
          period: {
            start: startDate.toISOString(),
            end: endDate.toISOString(),
          },
          complianceScore,
          alerts: alertSummary,
          riskEvaluations: riskSummary,
          matters: {
            activeTotal: matterStats.total,
            highRisk: Number(matterStats.highRisk),
            criticalRisk: Number(matterStats.criticalRisk),
          },
          tasks: {
            overdue: Number(overdueTasks),
          },
          rules: {
            active: Number(activeRules),
          },
          recommendations: generateRecommendations({
            alertSummary,
            riskSummary,
            matterStats: {
              total: matterStats.total,
              highRisk: Number(matterStats.highRisk),
              criticalRisk: Number(matterStats.criticalRisk),
            },
            overdueTasks: Number(overdueTasks),
          }),
          generatedAt: new Date().toISOString(),
        };
      });

      return NextResponse.json(report);
    })
  )
);

/**
 * Generate actionable recommendations based on metrics
 */
function generateRecommendations(data: {
  alertSummary: {
    total: number;
    byStatus: { pending: number };
    byPriority: { critical: number; urgent: number };
  };
  riskSummary: { averageScore: number; bySeverity: { critical: number; high: number } };
  matterStats: { total: number; highRisk: number; criticalRisk: number };
  overdueTasks: number;
}): string[] {
  const recommendations: string[] = [];

  // Check for unresolved critical alerts
  if (data.alertSummary.byPriority.critical > 0) {
    recommendations.push(
      `Address ${data.alertSummary.byPriority.critical} critical compliance alert(s) immediately`
    );
  }

  // Check for pending alerts
  if (data.alertSummary.byStatus.pending > 5) {
    recommendations.push(
      `Review and acknowledge ${data.alertSummary.byStatus.pending} pending alerts`
    );
  }

  // Check for high-risk matters
  if (data.matterStats.criticalRisk > 0) {
    recommendations.push(
      `Schedule supervision reviews for ${data.matterStats.criticalRisk} critical-risk matter(s)`
    );
  }

  // Check for overdue tasks
  if (data.overdueTasks > 0) {
    recommendations.push(`Address ${data.overdueTasks} overdue task(s) to maintain compliance`);
  }

  // Check average risk score
  if (data.riskSummary.averageScore > 60) {
    recommendations.push(
      "Overall risk score is elevated - consider reviewing workload distribution"
    );
  }

  // If everything looks good
  if (recommendations.length === 0) {
    recommendations.push(
      "Compliance metrics are within acceptable ranges - maintain current practices"
    );
  }

  return recommendations;
}
