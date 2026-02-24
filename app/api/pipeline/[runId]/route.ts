/**
 * GET /api/pipeline/[runId]
 *
 * Get pipeline run detail including findings and actions.
 */

import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { pipelineRuns, pipelineFindings, pipelineActions } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { withAuth } from "@/middleware/withAuth";
import { withErrorHandler, NotFoundError } from "@/middleware/withErrorHandler";

export const GET = withErrorHandler(
  withAuth(async (request, { params, user }) => {
    const runId = params ? (await params).runId : undefined;
    if (!runId) throw new NotFoundError("Pipeline run ID required");

    const firmId = await getOrCreateFirmIdForUser(user.user.id);

    const result = await withFirmDb(firmId, async (tx) => {
      const [run] = await tx
        .select()
        .from(pipelineRuns)
        .where(and(eq(pipelineRuns.id, runId), eq(pipelineRuns.firmId, firmId)))
        .limit(1);

      if (!run) throw new NotFoundError("Pipeline run not found");

      const findings = await tx
        .select()
        .from(pipelineFindings)
        .where(eq(pipelineFindings.pipelineRunId, runId));

      const actions = await tx
        .select()
        .from(pipelineActions)
        .where(eq(pipelineActions.pipelineRunId, runId));

      return { run, findings, actions };
    });

    return NextResponse.json(result);
  })
);
