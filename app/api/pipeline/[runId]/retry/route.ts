/**
 * POST /api/pipeline/[runId]/retry
 *
 * Retry a failed pipeline run from the last failed stage.
 */

import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { pipelineRuns } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { retryFromStage, PIPELINE_STAGES } from "@/lib/queue/pipeline";
import type { PipelineStageName } from "@/lib/queue/pipeline";
import { withAuth } from "@/middleware/withAuth";
import { withErrorHandler, NotFoundError, ValidationError } from "@/middleware/withErrorHandler";

export const POST = withErrorHandler(
  withAuth(async (request, { params, user }) => {
    const runId = params ? (await params).runId : undefined;
    if (!runId) throw new NotFoundError("Pipeline run ID required");

    const firmId = await getOrCreateFirmIdForUser(user.user.id);

    const run = await withFirmDb(firmId, async (tx) => {
      const [run] = await tx
        .select()
        .from(pipelineRuns)
        .where(and(eq(pipelineRuns.id, runId), eq(pipelineRuns.firmId, firmId)))
        .limit(1);

      if (!run) throw new NotFoundError("Pipeline run not found");
      if (run.status !== "failed") {
        throw new ValidationError("Only failed pipeline runs can be retried");
      }

      // Find the failed stage from stageStatuses
      const statuses = run.stageStatuses as Record<string, { status: string }>;
      let failedStage: PipelineStageName | null = null;

      for (const stage of PIPELINE_STAGES) {
        if (statuses[stage]?.status === "failed") {
          failedStage = stage;
          break;
        }
      }

      if (!failedStage) {
        // If no specific stage failed, retry from the current stage or intake
        failedStage = (run.currentStage as PipelineStageName) || "intake";
      }

      // Reset the run status
      await tx
        .update(pipelineRuns)
        .set({
          status: "queued",
          error: null,
          updatedAt: new Date(),
        })
        .where(eq(pipelineRuns.id, runId));

      // Re-enqueue from the failed stage
      await retryFromStage(failedStage, {
        pipelineRunId: run.id,
        firmId: run.firmId,
        matterId: run.matterId,
        documentId: run.documentId,
        triggeredBy: user.user.id,
      });

      return { ...run, retryStage: failedStage };
    });

    return NextResponse.json({
      success: true,
      runId: run.id,
      retryFromStage: run.retryStage,
    });
  })
);
