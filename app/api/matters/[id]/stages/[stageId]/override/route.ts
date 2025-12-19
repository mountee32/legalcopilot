/**
 * Stage Gate Override API
 *
 * POST /api/matters/[id]/stages/[stageId]/override - Override a stage gate
 */

import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { matters, matterWorkflows, matterStages } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { OverrideGateSchema } from "@/lib/api/schemas";
import { overrideGate, checkGate, advanceToNextStage } from "@/lib/workflows";
import { withAuth } from "@/middleware/withAuth";
import { NotFoundError, ValidationError, withErrorHandler } from "@/middleware/withErrorHandler";
import { withPermission } from "@/middleware/withPermission";

/**
 * POST /api/matters/[id]/stages/[stageId]/override
 * Override a stage gate to proceed to the next stage despite incomplete tasks.
 * Creates an exception log for audit trail.
 */
export const POST = withErrorHandler(
  withAuth(
    withPermission("cases:write")(async (request: NextRequest, { params, user }) => {
      const resolvedParams = params ? await params : {};
      const matterId = resolvedParams.id;
      const stageId = resolvedParams.stageId;

      if (!matterId) throw new NotFoundError("Matter not found");
      if (!stageId) throw new NotFoundError("Stage not found");

      const firmId = await getOrCreateFirmIdForUser(user.user.id);
      const body = await request.json();
      const data = OverrideGateSchema.parse(body);

      const result = await withFirmDb(firmId, async (tx) => {
        // Verify matter exists and belongs to firm
        const [matter] = await tx
          .select({ id: matters.id })
          .from(matters)
          .where(and(eq(matters.id, matterId), eq(matters.firmId, firmId)))
          .limit(1);

        if (!matter) throw new NotFoundError("Matter not found");

        // Get the stage
        const [stage] = await tx
          .select()
          .from(matterStages)
          .where(eq(matterStages.id, stageId))
          .limit(1);

        if (!stage) throw new NotFoundError("Stage not found");

        // Verify stage belongs to this matter's workflow
        const [workflow] = await tx
          .select()
          .from(matterWorkflows)
          .where(eq(matterWorkflows.id, stage.matterWorkflowId))
          .limit(1);

        if (!workflow || workflow.matterId !== matterId) {
          throw new NotFoundError("Stage not found");
        }

        // Check if gate actually needs to be overridden
        const gateCheck = await checkGate(tx, stageId);

        if (gateCheck.canProceed && !gateCheck.isBlocked) {
          throw new ValidationError("No gate to override - stage can already proceed");
        }

        // Log the gate override
        await overrideGate(tx, {
          firmId,
          matterId,
          stageId,
          reason: data.reason,
          overriddenById: user.user.id,
        });

        // Try to advance to next stage
        const advanceResult = await advanceToNextStage(tx, {
          firmId,
          matterId,
          matterWorkflowId: workflow.id,
          userId: user.user.id,
          overrideReason: data.reason,
        });

        return {
          success: true,
          overriddenStageId: stageId,
          overriddenStageName: stage.name,
          advancedToStageId: advanceResult.newStageId,
          message: advanceResult.success
            ? `Gate overridden, advanced to next stage`
            : `Gate overridden${advanceResult.error ? `: ${advanceResult.error}` : ""}`,
        };
      });

      return NextResponse.json(result);
    })
  )
);
