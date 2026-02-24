/**
 * GET /api/matters/[id]/pipeline
 *
 * List all pipeline runs for a matter, ordered by most recent first.
 */

import { NextResponse } from "next/server";
import { and, eq, desc } from "drizzle-orm";
import { pipelineRuns, matters } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { withAuth } from "@/middleware/withAuth";
import { withErrorHandler, NotFoundError } from "@/middleware/withErrorHandler";

export const GET = withErrorHandler(
  withAuth(async (request, { params, user }) => {
    const id = params ? (await params).id : undefined;
    if (!id) throw new NotFoundError("Matter ID required");

    const firmId = await getOrCreateFirmIdForUser(user.user.id);

    const runs = await withFirmDb(firmId, async (tx) => {
      // Verify matter exists and belongs to firm
      const [matter] = await tx
        .select({ id: matters.id })
        .from(matters)
        .where(and(eq(matters.id, id), eq(matters.firmId, firmId)))
        .limit(1);

      if (!matter) throw new NotFoundError("Matter not found");

      return tx
        .select()
        .from(pipelineRuns)
        .where(and(eq(pipelineRuns.matterId, id), eq(pipelineRuns.firmId, firmId)))
        .orderBy(desc(pipelineRuns.createdAt));
    });

    return NextResponse.json({ runs });
  })
);
