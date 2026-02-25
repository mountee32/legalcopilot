/**
 * POST /api/pipeline/findings/batch
 *
 * Bulk resolve pipeline findings — accept or reject multiple at once.
 */

import { NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { pipelineFindings } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { withAuth } from "@/middleware/withAuth";
import { withErrorHandler } from "@/middleware/withErrorHandler";
import { BatchResolveFindingsSchema } from "@/lib/api/schemas/pipeline";

export const POST = withErrorHandler(
  withAuth(async (request, { user }) => {
    const firmId = await getOrCreateFirmIdForUser(user.user.id);
    const body = BatchResolveFindingsSchema.parse(await request.json());

    const result = await withFirmDb(firmId, async (tx) => {
      const updated = await tx
        .update(pipelineFindings)
        .set({
          status: body.status,
          resolvedBy: user.user.id,
          resolvedAt: new Date(),
        })
        .where(
          and(
            eq(pipelineFindings.firmId, firmId),
            inArray(pipelineFindings.id, body.findingIds),
            inArray(pipelineFindings.status, ["pending", "conflict"])
          )
        )
        .returning({ id: pipelineFindings.id });

      return { updated: updated.length };
    });

    return NextResponse.json(result);
  })
);
