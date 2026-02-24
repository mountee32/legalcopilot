/**
 * GET /api/analytics/risk
 *
 * Risk overview metrics: matters with risk scores, distribution,
 * risk by practice area, critical findings count.
 */

import { NextResponse } from "next/server";
import { sql, eq, and, isNotNull, gte } from "drizzle-orm";
import { matters, pipelineFindings } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { withAuth } from "@/middleware/withAuth";
import { withPermission } from "@/middleware/withPermission";
import { withErrorHandler } from "@/middleware/withErrorHandler";
import { AnalyticsQuerySchema } from "@/lib/api/schemas/analytics";

export const GET = withErrorHandler(
  withAuth(
    withPermission("reports:view")(async (request, { user }) => {
      const url = new URL(request.url);
      const { days } = AnalyticsQuerySchema.parse({
        days: url.searchParams.get("days") ?? undefined,
      });

      const firmId = await getOrCreateFirmIdForUser(user.user.id);
      const since = new Date();
      since.setDate(since.getDate() - days);

      const result = await withFirmDb(firmId, async (tx) => {
        // KPIs from matters with risk scores assessed in the time window
        const [kpiRow] = await tx
          .select({
            mattersWithRisk: sql<number>`count(*)::int`,
            avgRiskScore: sql<number>`avg(${matters.riskScore})`,
            highRiskCount: sql<number>`sum(case when ${matters.riskScore} >= 70 then 1 else 0 end)::int`,
          })
          .from(matters)
          .where(
            and(
              eq(matters.firmId, firmId),
              isNotNull(matters.riskScore),
              gte(matters.riskAssessedAt, since)
            )
          );

        // Critical findings count (recent)
        const [criticalRow] = await tx
          .select({
            count: sql<number>`count(*)::int`,
          })
          .from(pipelineFindings)
          .where(
            and(
              eq(pipelineFindings.firmId, firmId),
              eq(pipelineFindings.impact, "critical"),
              gte(pipelineFindings.createdAt, since)
            )
          );

        // Risk score distribution (5 buckets: 0-20, 20-40, 40-60, 60-80, 80-100)
        const riskDistribution = await tx
          .select({
            bucket: sql<number>`width_bucket(${matters.riskScore}, 0, 101, 5)`,
            count: sql<number>`count(*)::int`,
          })
          .from(matters)
          .where(
            and(
              eq(matters.firmId, firmId),
              isNotNull(matters.riskScore),
              gte(matters.riskAssessedAt, since)
            )
          )
          .groupBy(sql`width_bucket(${matters.riskScore}, 0, 101, 5)`)
          .orderBy(sql`width_bucket(${matters.riskScore}, 0, 101, 5)`);

        const bucketLabels: Record<number, string> = {
          1: "0-20",
          2: "21-40",
          3: "41-60",
          4: "61-80",
          5: "81-100",
        };

        // Risk by practice area
        const riskByPracticeArea = await tx
          .select({
            practiceArea: matters.practiceArea,
            avgScore: sql<number>`avg(${matters.riskScore})`,
            matterCount: sql<number>`count(*)::int`,
          })
          .from(matters)
          .where(
            and(
              eq(matters.firmId, firmId),
              isNotNull(matters.riskScore),
              gte(matters.riskAssessedAt, since)
            )
          )
          .groupBy(matters.practiceArea)
          .orderBy(sql`avg(${matters.riskScore}) desc`);

        return {
          kpis: {
            mattersWithRisk: kpiRow?.mattersWithRisk ?? 0,
            avgRiskScore: kpiRow?.avgRiskScore ? Math.round(kpiRow.avgRiskScore) : null,
            highRiskCount: kpiRow?.highRiskCount ?? 0,
            criticalFindingsCount: criticalRow?.count ?? 0,
          },
          riskDistribution: riskDistribution.map((r) => ({
            bucket: bucketLabels[r.bucket] ?? `${r.bucket}`,
            count: r.count,
          })),
          riskByPracticeArea: riskByPracticeArea.map((r) => ({
            practiceArea: r.practiceArea,
            avgScore: r.avgScore ? Math.round(r.avgScore) : null,
            matterCount: r.matterCount,
          })),
        };
      });

      return NextResponse.json(result);
    })
  )
);
