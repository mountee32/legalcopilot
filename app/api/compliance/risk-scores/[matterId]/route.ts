import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { matters, riskEvaluations } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { CreateRiskEvaluationSchema } from "@/lib/api/schemas/compliance";
import { withAuth } from "@/middleware/withAuth";
import { withPermission } from "@/middleware/withPermission";
import { withErrorHandler, NotFoundError, ValidationError } from "@/middleware/withErrorHandler";

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

/**
 * POST /api/compliance/risk-scores/[matterId]
 * Trigger a new risk evaluation for a matter
 */
export const POST = withErrorHandler(
  withAuth(
    withPermission("compliance:write")(async (request, { params, user }) => {
      const matterId = params ? (await params).matterId : undefined;
      if (!matterId) throw new NotFoundError("Matter not found");

      const firmId = await getOrCreateFirmIdForUser(user.user.id);

      // Parse optional body for aiModel override
      let body: { aiModel?: string } = {};
      try {
        const text = await request.text();
        if (text) {
          body = JSON.parse(text);
        }
      } catch {
        // Empty body is OK
      }

      const aiModel = body.aiModel || "gpt-4";

      const evaluation = await withFirmDb(firmId, async (tx) => {
        // Verify matter exists and belongs to firm
        const [matter] = await tx
          .select()
          .from(matters)
          .where(and(eq(matters.id, matterId), eq(matters.firmId, firmId)))
          .limit(1);

        if (!matter) throw new NotFoundError("Matter not found");

        // Simulate AI risk evaluation
        // In production, this would call OpenRouter to analyze the matter
        const score = Math.floor(Math.random() * 100);
        let severity: "low" | "medium" | "high" | "critical";
        if (score >= 90) severity = "critical";
        else if (score >= 67) severity = "high";
        else if (score >= 34) severity = "medium";
        else severity = "low";

        const factors = [
          {
            factor: "deadline_proximity",
            weight: 0.3,
            evidence: "Completion deadline approaching",
          },
          {
            factor: "matter_complexity",
            weight: 0.25,
            evidence: "High complexity based on document count",
          },
          { factor: "client_history", weight: 0.2, evidence: "New client with limited history" },
        ];

        const recommendations = [
          "Schedule supervision review meeting",
          "Review deadline feasibility",
          "Confirm client expectations",
        ];

        // Insert evaluation
        const [newEvaluation] = await tx
          .insert(riskEvaluations)
          .values({
            firmId,
            matterId,
            score,
            severity,
            factors,
            recommendations,
            aiModel,
            evaluatedBy: user.user.id,
          })
          .returning();

        // Update matter risk score
        await tx
          .update(matters)
          .set({
            riskScore: score,
            riskFactors: factors,
            riskAssessedAt: new Date(),
          })
          .where(eq(matters.id, matterId));

        return {
          id: newEvaluation.id,
          firmId: newEvaluation.firmId,
          matterId: newEvaluation.matterId,
          score: newEvaluation.score,
          severity: newEvaluation.severity,
          factors: newEvaluation.factors,
          recommendations: newEvaluation.recommendations,
          aiModel: newEvaluation.aiModel,
          evaluatedAt: newEvaluation.evaluatedAt.toISOString(),
          evaluatedBy: newEvaluation.evaluatedBy,
          createdAt: newEvaluation.createdAt.toISOString(),
        };
      });

      return NextResponse.json(evaluation, { status: 201 });
    })
  )
);
