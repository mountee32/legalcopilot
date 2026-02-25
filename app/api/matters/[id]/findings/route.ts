/**
 * GET /api/matters/[id]/findings
 *
 * Aggregated findings for a matter across all pipeline runs.
 * Groups by category with field-level details and status counts.
 */

import { NextResponse } from "next/server";
import { and, eq, desc } from "drizzle-orm";
import { pipelineFindings } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { withAuth } from "@/middleware/withAuth";
import { withErrorHandler, NotFoundError } from "@/middleware/withErrorHandler";

export const GET = withErrorHandler(
  withAuth(async (request, { params, user }) => {
    const matterId = params ? (await params).id : undefined;
    if (!matterId) throw new NotFoundError("Matter ID required");

    const firmId = await getOrCreateFirmIdForUser(user.user.id);
    const url = new URL(request.url);
    const status = url.searchParams.get("status"); // optional filter
    const category = url.searchParams.get("category"); // optional filter

    const result = await withFirmDb(firmId, async (tx) => {
      let query = tx
        .select()
        .from(pipelineFindings)
        .where(and(eq(pipelineFindings.matterId, matterId), eq(pipelineFindings.firmId, firmId)))
        .orderBy(desc(pipelineFindings.createdAt));

      const allFindings = await query;

      // Apply optional filters in-memory (simpler than dynamic where clauses)
      let filtered = allFindings;
      if (status) {
        filtered = filtered.filter((f) => f.status === status);
      }
      if (category) {
        filtered = filtered.filter((f) => f.categoryKey === category);
      }

      // Group by category
      const byCategory = new Map<string, typeof filtered>();
      for (const f of filtered) {
        const bucket = byCategory.get(f.categoryKey) || [];
        bucket.push(f);
        byCategory.set(f.categoryKey, bucket);
      }

      // Status counts
      const pendingCount = allFindings.filter((f) => f.status === "pending").length;
      const conflictCount = allFindings.filter((f) => f.status === "conflict").length;
      const statusCounts = {
        pending: pendingCount,
        accepted: allFindings.filter((f) => f.status === "accepted").length,
        rejected: allFindings.filter((f) => f.status === "rejected").length,
        auto_applied: allFindings.filter((f) => f.status === "auto_applied").length,
        conflict: conflictCount,
        revised: allFindings.filter((f) => f.status === "revised").length,
      };

      const reviewSummary = {
        pendingCount,
        conflictCount,
        needsReview: pendingCount + conflictCount,
      };

      const categories = Array.from(byCategory.entries()).map(([key, findings]) => ({
        categoryKey: key,
        findings,
        count: findings.length,
      }));

      return {
        matterId,
        total: filtered.length,
        statusCounts,
        reviewSummary,
        categories,
      };
    });

    return NextResponse.json(result);
  })
);
