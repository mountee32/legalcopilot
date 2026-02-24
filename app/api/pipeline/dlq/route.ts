/**
 * GET /api/pipeline/dlq
 * DELETE /api/pipeline/dlq
 *
 * Dead-letter queue monitoring — view and clear permanently failed pipeline jobs.
 */

import { NextResponse } from "next/server";
import { getDlqEntries, getDlqSummary, clearDlqEntries } from "@/lib/queue/pipeline-dlq";
import type { PipelineStageName } from "@/lib/queue/pipeline";
import { withAuth } from "@/middleware/withAuth";
import { withErrorHandler } from "@/middleware/withErrorHandler";

export const GET = withErrorHandler(
  withAuth(async (request) => {
    const url = new URL(request.url);
    const stage = url.searchParams.get("stage") as PipelineStageName | null;

    const entries = getDlqEntries(stage || undefined);
    const summary = getDlqSummary();

    return NextResponse.json({
      totalEntries: entries.length,
      summary,
      entries: entries.slice(0, 100), // Limit response size
    });
  })
);

export const DELETE = withErrorHandler(
  withAuth(async (request) => {
    const url = new URL(request.url);
    const stage = url.searchParams.get("stage") as PipelineStageName | null;

    const cleared = clearDlqEntries(stage || undefined);

    return NextResponse.json({
      success: true,
      cleared,
    });
  })
);
