/**
 * PATCH /api/pipeline/findings/[id]
 *
 * Resolve a pipeline finding — accept, reject, or mark as conflict.
 */

import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { pipelineFindings } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { withAuth } from "@/middleware/withAuth";
import { withErrorHandler, NotFoundError, ValidationError } from "@/middleware/withErrorHandler";
import { ResolveFindingSchema } from "@/lib/api/schemas/pipeline";

const VALID_STATUSES = ["accepted", "rejected", "conflict", "pending"] as const;

export const PATCH = withErrorHandler(
  withAuth(async (request, { params, user }) => {
    const findingId = params ? (await params).id : undefined;
    if (!findingId) throw new NotFoundError("Finding ID required");

    const firmId = await getOrCreateFirmIdForUser(user.user.id);
    const body = ResolveFindingSchema.parse(await request.json());

    if (!VALID_STATUSES.includes(body.status as (typeof VALID_STATUSES)[number])) {
      throw new ValidationError(`Invalid status: ${body.status}`);
    }

    const result = await withFirmDb(firmId, async (tx) => {
      const [finding] = await tx
        .select()
        .from(pipelineFindings)
        .where(and(eq(pipelineFindings.id, findingId), eq(pipelineFindings.firmId, firmId)))
        .limit(1);

      if (!finding) throw new NotFoundError("Finding not found");

      const [updated] = await tx
        .update(pipelineFindings)
        .set({
          status: body.status as "accepted" | "rejected" | "conflict" | "pending",
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
