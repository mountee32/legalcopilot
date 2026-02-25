/**
 * PATCH /api/pipeline/findings/[id]
 *
 * Resolve a pipeline finding — accept, reject, or revise with a corrected value.
 */

import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { pipelineFindings, entityCorrections } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { createTimelineEvent } from "@/lib/timeline/createEvent";
import { withAuth } from "@/middleware/withAuth";
import { withErrorHandler, NotFoundError } from "@/middleware/withErrorHandler";
import { ResolveFindingSchema } from "@/lib/api/schemas/pipeline";

export const PATCH = withErrorHandler(
  withAuth(async (request, { params, user }) => {
    const findingId = params ? (await params).id : undefined;
    if (!findingId) throw new NotFoundError("Finding ID required");

    const firmId = await getOrCreateFirmIdForUser(user.user.id);
    const body = ResolveFindingSchema.parse(await request.json());

    const result = await withFirmDb(firmId, async (tx) => {
      const [finding] = await tx
        .select()
        .from(pipelineFindings)
        .where(and(eq(pipelineFindings.id, findingId), eq(pipelineFindings.firmId, firmId)))
        .limit(1);

      if (!finding) throw new NotFoundError("Finding not found");

      if (body.status === "revised") {
        // Update finding value and status
        const [updated] = await tx
          .update(pipelineFindings)
          .set({
            status: "revised",
            value: body.correctedValue!,
            resolvedBy: user.user.id,
            resolvedAt: new Date(),
          })
          .where(eq(pipelineFindings.id, findingId))
          .returning();

        // Record the correction for learning
        await tx.insert(entityCorrections).values({
          firmId,
          matterId: body.correctionScope === "case" ? finding.matterId : null,
          findingId: finding.id,
          categoryKey: finding.categoryKey,
          fieldKey: finding.fieldKey,
          originalValue: finding.value,
          correctedValue: body.correctedValue!,
          scope: body.correctionScope!,
          correctedBy: user.user.id,
        });

        // Timeline event for audit trail
        await createTimelineEvent(tx, {
          firmId,
          matterId: finding.matterId,
          type: "finding_revised",
          title: `Finding corrected: ${finding.label}`,
          actorType: "user",
          actorId: user.user.id,
          entityType: "pipeline_finding",
          entityId: finding.id,
          occurredAt: new Date(),
          metadata: {
            fieldKey: finding.fieldKey,
            categoryKey: finding.categoryKey,
            originalValue: finding.value,
            correctedValue: body.correctedValue,
            scope: body.correctionScope,
          },
        });

        return updated;
      }

      // Standard accept/reject
      const [updated] = await tx
        .update(pipelineFindings)
        .set({
          status: body.status as "accepted" | "rejected",
          resolvedBy: user.user.id,
          resolvedAt: new Date(),
        })
        .where(eq(pipelineFindings.id, findingId))
        .returning();

      return updated;
    });

    return NextResponse.json(result);
  })
);
