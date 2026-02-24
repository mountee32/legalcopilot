/**
 * GET /api/analytics/extraction
 *
 * Extraction quality metrics: finding counts by status, confidence distribution,
 * acceptance rates, and top categories.
 */

import { NextResponse } from "next/server";
import { sql, eq, and, gte } from "drizzle-orm";
import { pipelineFindings } from "@/lib/db/schema";
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
        // KPIs
        const [kpiRow] = await tx
          .select({
            totalFindings: sql<number>`count(*)::int`,
            avgConfidence: sql<number>`avg(${pipelineFindings.confidence}::numeric)`,
            acceptedCount: sql<number>`sum(case when ${pipelineFindings.status} = 'accepted' then 1 else 0 end)::int`,
            autoAppliedCount: sql<number>`sum(case when ${pipelineFindings.status} = 'auto_applied' then 1 else 0 end)::int`,
            resolvedCount: sql<number>`sum(case when ${pipelineFindings.status} in ('accepted', 'rejected', 'auto_applied') then 1 else 0 end)::int`,
          })
          .from(pipelineFindings)
          .where(and(eq(pipelineFindings.firmId, firmId), gte(pipelineFindings.createdAt, since)));

        const total = kpiRow?.totalFindings ?? 0;
        const resolved = kpiRow?.resolvedCount ?? 0;

        // Findings by status
        const findingsByStatus = await tx
          .select({
            status: pipelineFindings.status,
            count: sql<number>`count(*)::int`,
          })
          .from(pipelineFindings)
          .where(and(eq(pipelineFindings.firmId, firmId), gte(pipelineFindings.createdAt, since)))
          .groupBy(pipelineFindings.status);

        // Confidence distribution (5 buckets: 0-20, 20-40, 40-60, 60-80, 80-100)
        const confidenceDistribution = await tx
          .select({
            bucket: sql<number>`width_bucket(${pipelineFindings.confidence}::numeric, -0.001, 1.001, 5)`,
            count: sql<number>`count(*)::int`,
          })
          .from(pipelineFindings)
          .where(and(eq(pipelineFindings.firmId, firmId), gte(pipelineFindings.createdAt, since)))
          .groupBy(sql`width_bucket(${pipelineFindings.confidence}::numeric, -0.001, 1.001, 5)`)
          .orderBy(sql`width_bucket(${pipelineFindings.confidence}::numeric, -0.001, 1.001, 5)`);

        const bucketLabels: Record<number, string> = {
          1: "0-20%",
          2: "20-40%",
          3: "40-60%",
          4: "60-80%",
          5: "80-100%",
        };

        // Top categories
        const topCategories = await tx
          .select({
            category: pipelineFindings.categoryKey,
            count: sql<number>`count(*)::int`,
            avgConfidence: sql<number>`avg(${pipelineFindings.confidence}::numeric)`,
          })
          .from(pipelineFindings)
          .where(and(eq(pipelineFindings.firmId, firmId), gte(pipelineFindings.createdAt, since)))
          .groupBy(pipelineFindings.categoryKey)
          .orderBy(sql`count(*) desc`)
          .limit(10);

        return {
          kpis: {
            totalFindings: total,
            avgConfidence:
              kpiRow?.avgConfidence != null
                ? Math.round(parseFloat(String(kpiRow.avgConfidence)) * 100) / 100
                : null,
            acceptRate:
              resolved > 0
                ? Math.round(((kpiRow?.acceptedCount ?? 0) / resolved) * 100) / 100
                : null,
            autoAppliedRate:
              total > 0 ? Math.round(((kpiRow?.autoAppliedCount ?? 0) / total) * 100) / 100 : null,
          },
          findingsByStatus: findingsByStatus.map((r) => ({
            status: r.status,
            count: r.count,
          })),
          confidenceDistribution: confidenceDistribution.map((r) => ({
            bucket: bucketLabels[r.bucket] ?? `${r.bucket}`,
            count: r.count,
          })),
          topCategories: topCategories.map((r) => ({
            category: r.category,
            count: r.count,
            avgConfidence:
              r.avgConfidence != null
                ? Math.round(parseFloat(String(r.avgConfidence)) * 100) / 100
                : null,
          })),
        };
      });

      return NextResponse.json(result);
    })
  )
);
