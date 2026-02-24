/**
 * POST /api/matters/[id]/risk/recalculate
 *
 * Manually trigger risk score recalculation for a matter.
 * Fetches all findings, calculates risk, updates matter, creates timeline event.
 */

import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { matters, pipelineFindings } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { withAuth } from "@/middleware/withAuth";
import { withPermission } from "@/middleware/withPermission";
import { withErrorHandler, NotFoundError } from "@/middleware/withErrorHandler";
import { calculateRiskScore } from "@/lib/pipeline/risk-score";
import { createTimelineEvent } from "@/lib/timeline/createEvent";

export const POST = withErrorHandler(
  withAuth(
    withPermission("cases:write")(async (request, { params, user }) => {
      const matterId = params ? (await params).id : undefined;
      if (!matterId) throw new NotFoundError("Matter ID required");

      const firmId = await getOrCreateFirmIdForUser(user.user.id);

      const result = await withFirmDb(firmId, async (tx) => {
        // Verify matter exists
        const [matter] = await tx
          .select({ id: matters.id })
          .from(matters)
          .where(and(eq(matters.id, matterId), eq(matters.firmId, firmId)));

        if (!matter) throw new NotFoundError("Matter not found");

        // Fetch all findings for the matter
        const allFindings = await tx
          .select({
            status: pipelineFindings.status,
            impact: pipelineFindings.impact,
            confidence: pipelineFindings.confidence,
          })
          .from(pipelineFindings)
          .where(and(eq(pipelineFindings.matterId, matterId), eq(pipelineFindings.firmId, firmId)));

        const { score, factors } = calculateRiskScore(allFindings);
        const now = new Date();

        await tx
          .update(matters)
          .set({
            riskScore: score,
            riskFactors: factors,
            riskAssessedAt: now,
            updatedAt: now,
          })
          .where(eq(matters.id, matterId));

        await createTimelineEvent(tx, {
          firmId,
          matterId,
          type: "risk_assessed",
          title: `Risk score recalculated: ${score}/100`,
          actorType: "user",
          actorId: user.user.id,
          entityType: "matter",
          entityId: matterId,
          occurredAt: now,
          metadata: { score, factorCount: factors.length },
        });

        return {
          riskScore: score,
          riskFactors: factors,
          riskAssessedAt: now.toISOString(),
        };
      });

      return NextResponse.json(result);
    })
  )
);
