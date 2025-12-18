import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { matters, riskEvaluations } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { withAuth } from "@/middleware/withAuth";
import { withPermission } from "@/middleware/withPermission";
import { withErrorHandler, NotFoundError } from "@/middleware/withErrorHandler";

export const GET = withErrorHandler(
  withAuth(
    withPermission("compliance:read")(async (_request, { params, user }) => {
      const matterId = params ? (await params).matterId : undefined;
      if (!matterId) throw new NotFoundError("Matter not found");

      const firmId = await getOrCreateFirmIdForUser(user.user.id);

      const evaluations = await withFirmDb(firmId, async (tx) => {
        // Verify matter exists and belongs to firm
        const [matter] = await tx
          .select()
          .from(matters)
          .where(and(eq(matters.id, matterId), eq(matters.firmId, firmId)))
          .limit(1);

        if (!matter) throw new NotFoundError("Matter not found");

        // Get all risk evaluations for this matter, most recent first
        const evals = await tx
          .select()
          .from(riskEvaluations)
          .where(and(eq(riskEvaluations.matterId, matterId), eq(riskEvaluations.firmId, firmId)))
          .orderBy(desc(riskEvaluations.evaluatedAt))
          .limit(10); // Return last 10 evaluations

        return evals.map((e) => ({
          id: e.id,
          firmId: e.firmId,
          matterId: e.matterId,
          score: e.score,
          severity: e.severity,
          factors: e.factors,
          recommendations: e.recommendations,
          aiModel: e.aiModel,
          evaluatedAt: e.evaluatedAt.toISOString(),
          evaluatedBy: e.evaluatedBy,
          createdAt: e.createdAt.toISOString(),
        }));
      });

      return NextResponse.json({
        evaluations,
        latest: evaluations[0] || null,
      });
    })
  )
);
