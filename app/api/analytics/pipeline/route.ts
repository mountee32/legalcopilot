/**
 * GET /api/analytics/pipeline
 *
 * Pipeline health metrics: run counts, daily trends, failure-by-stage breakdown.
 */

import { NextResponse } from "next/server";
import { sql, eq, and, gte } from "drizzle-orm";
import { pipelineRuns } from "@/lib/db/schema";
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
        // KPIs: total / completed / failed / avg duration
        const [kpiRow] = await tx
          .select({
            totalRuns: sql<number>`count(*)::int`,
            completedRuns: sql<number>`sum(case when ${pipelineRuns.status} = 'completed' then 1 else 0 end)::int`,
            failedRuns: sql<number>`sum(case when ${pipelineRuns.status} = 'failed' then 1 else 0 end)::int`,
            avgDurationSeconds: sql<number>`
              extract(epoch from avg(
                case when ${pipelineRuns.completedAt} is not null and ${pipelineRuns.startedAt} is not null
                then ${pipelineRuns.completedAt} - ${pipelineRuns.startedAt}
                else null end
              ))
            `,
          })
          .from(pipelineRuns)
          .where(and(eq(pipelineRuns.firmId, firmId), gte(pipelineRuns.createdAt, since)));

        // Daily run counts by status
        const dailyRuns = await tx
          .select({
            date: sql<string>`to_char(${pipelineRuns.createdAt}::date, 'YYYY-MM-DD')`,
            completed: sql<number>`sum(case when ${pipelineRuns.status} = 'completed' then 1 else 0 end)::int`,
            failed: sql<number>`sum(case when ${pipelineRuns.status} = 'failed' then 1 else 0 end)::int`,
            running: sql<number>`sum(case when ${pipelineRuns.status} in ('queued', 'running') then 1 else 0 end)::int`,
          })
          .from(pipelineRuns)
          .where(and(eq(pipelineRuns.firmId, firmId), gte(pipelineRuns.createdAt, since)))
          .groupBy(sql`${pipelineRuns.createdAt}::date`)
          .orderBy(sql`${pipelineRuns.createdAt}::date`);

        // Failure counts by stage (parse from stageStatuses JSONB)
        const failedRunRows = await tx
          .select({
            stageStatuses: pipelineRuns.stageStatuses,
          })
          .from(pipelineRuns)
          .where(
            and(
              eq(pipelineRuns.firmId, firmId),
              eq(pipelineRuns.status, "failed"),
              gte(pipelineRuns.createdAt, since)
            )
          );

        const stageCounts: Record<string, number> = {};
        for (const run of failedRunRows) {
          if (run.stageStatuses && typeof run.stageStatuses === "object") {
            for (const [stage, info] of Object.entries(run.stageStatuses)) {
              if (info && info.status === "failed") {
                stageCounts[stage] = (stageCounts[stage] || 0) + 1;
              }
            }
          }
        }

        const failuresByStage = Object.entries(stageCounts)
          .map(([stage, count]) => ({ stage, count }))
          .sort((a, b) => b.count - a.count);

        return {
          kpis: {
            totalRuns: kpiRow?.totalRuns ?? 0,
            completedRuns: kpiRow?.completedRuns ?? 0,
            failedRuns: kpiRow?.failedRuns ?? 0,
            avgDurationSeconds: kpiRow?.avgDurationSeconds
              ? Math.round(kpiRow.avgDurationSeconds)
              : null,
          },
          dailyRuns,
          failuresByStage,
        };
      });

      return NextResponse.json(result);
    })
  )
);
