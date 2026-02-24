/**
 * GET /api/matters/[id]/findings/history?fieldKey=xxx&categoryKey=yyy
 *
 * Returns finding history for a specific field across all pipeline runs for a matter.
 * Shows how extracted values have changed over time across different documents.
 */

import { NextResponse } from "next/server";
import { and, eq, desc } from "drizzle-orm";
import { pipelineFindings, pipelineRuns, documents, matters } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { withAuth } from "@/middleware/withAuth";
import { withErrorHandler, NotFoundError, ValidationError } from "@/middleware/withErrorHandler";

export const GET = withErrorHandler(
  withAuth(async (request, { params, user }) => {
    const matterId = params ? (await params).id : undefined;
    if (!matterId) throw new NotFoundError("Matter ID required");

    const url = new URL(request.url);
    const fieldKey = url.searchParams.get("fieldKey");
    if (!fieldKey) throw new ValidationError("fieldKey query parameter is required");

    const categoryKey = url.searchParams.get("categoryKey");

    const firmId = await getOrCreateFirmIdForUser(user.user.id);

    const history = await withFirmDb(firmId, async (tx) => {
      // Verify matter exists
      const [matter] = await tx
        .select({ id: matters.id })
        .from(matters)
        .where(and(eq(matters.id, matterId), eq(matters.firmId, firmId)))
        .limit(1);

      if (!matter) throw new NotFoundError("Matter not found");

      // Build condition
      const conditions = [
        eq(pipelineFindings.matterId, matterId),
        eq(pipelineFindings.firmId, firmId),
        eq(pipelineFindings.fieldKey, fieldKey),
      ];

      if (categoryKey) {
        conditions.push(eq(pipelineFindings.categoryKey, categoryKey));
      }

      // Fetch findings with run and document info
      const findings = await tx
        .select({
          id: pipelineFindings.id,
          value: pipelineFindings.value,
          confidence: pipelineFindings.confidence,
          status: pipelineFindings.status,
          impact: pipelineFindings.impact,
          existingValue: pipelineFindings.existingValue,
          sourceQuote: pipelineFindings.sourceQuote,
          createdAt: pipelineFindings.createdAt,
          resolvedAt: pipelineFindings.resolvedAt,
          // Run info
          pipelineRunId: pipelineFindings.pipelineRunId,
          runStatus: pipelineRuns.status,
          classifiedDocType: pipelineRuns.classifiedDocType,
          // Document info
          documentId: pipelineFindings.documentId,
          documentName: documents.filename,
        })
        .from(pipelineFindings)
        .innerJoin(pipelineRuns, eq(pipelineFindings.pipelineRunId, pipelineRuns.id))
        .innerJoin(documents, eq(pipelineFindings.documentId, documents.id))
        .where(and(...conditions))
        .orderBy(desc(pipelineFindings.createdAt));

      return findings;
    });

    return NextResponse.json({
      fieldKey,
      categoryKey,
      matterId,
      totalEntries: history.length,
      history,
    });
  })
);
