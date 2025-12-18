import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { matters, riskEvaluations } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { RiskScoresQuerySchema } from "@/lib/api/schemas/compliance";
import { withAuth } from "@/middleware/withAuth";
import { withPermission } from "@/middleware/withPermission";
import { withErrorHandler } from "@/middleware/withErrorHandler";

export const GET = withErrorHandler(
  withAuth(
    withPermission("compliance:read")(async (request, { user }) => {
      const firmId = await getOrCreateFirmIdForUser(user.user.id);
      const { searchParams } = new URL(request.url);

      // Parse and validate query parameters
      const query = RiskScoresQuerySchema.parse({
        page: searchParams.get("page") || "1",
        limit: searchParams.get("limit") || "20",
        severity: searchParams.get("severity") || undefined,
        minScore: searchParams.get("minScore") || undefined,
        practiceArea: searchParams.get("practiceArea") || undefined,
      });

      const offset = (query.page - 1) * query.limit;

      const riskScores = await withFirmDb(firmId, async (tx) => {
        // Build filters
        const filters = [eq(matters.firmId, firmId)];

        if (query.practiceArea) {
          filters.push(eq(matters.practiceArea, query.practiceArea as any));
        }

        if (query.minScore !== undefined) {
          filters.push(gte(matters.riskScore, query.minScore));
        }

        // Get matters with their latest risk evaluations
        const mattersWithRisk = await tx
          .select({
            matterId: matters.id,
            matterReference: matters.reference,
            matterTitle: matters.title,
            score: matters.riskScore,
            riskFactors: matters.riskFactors,
            riskAssessedAt: matters.riskAssessedAt,
            evaluationId: riskEvaluations.id,
            severity: riskEvaluations.severity,
            factors: riskEvaluations.factors,
          })
          .from(matters)
          .leftJoin(
            riskEvaluations,
            and(
              eq(riskEvaluations.matterId, matters.id),
              eq(
                riskEvaluations.evaluatedAt,
                sql`(SELECT MAX(evaluated_at) FROM ${riskEvaluations} WHERE matter_id = ${matters.id})`
              )
            )
          )
          .where(and(...filters))
          .orderBy(desc(matters.riskScore))
          .limit(query.limit)
          .offset(offset);

        // Get total count
        const [{ count }] = await tx
          .select({ count: sql<number>`count(*)` })
          .from(matters)
          .where(and(...filters));

        // Format results
        const results = mattersWithRisk
          .filter((m) => m.score !== null)
          .filter((m) => !query.severity || m.severity === query.severity)
          .map((m) => {
            // Determine severity from score if not in evaluation
            let severity = m.severity;
            if (!severity && m.score !== null) {
              if (m.score >= 90) severity = "critical";
              else if (m.score >= 67) severity = "high";
              else if (m.score >= 34) severity = "medium";
              else severity = "low";
            }

            // Extract top 3 factors
            const factorsArray = (m.factors as any[]) || (m.riskFactors as any[]) || [];
            const topFactors = Array.isArray(factorsArray)
              ? factorsArray.sort((a: any, b: any) => (b.weight || 0) - (a.weight || 0)).slice(0, 3)
              : [];

            return {
              matterId: m.matterId,
              matterReference: m.matterReference,
              matterTitle: m.matterTitle,
              score: m.score!,
              severity: severity || "low",
              evaluatedAt: m.riskAssessedAt?.toISOString() || new Date().toISOString(),
              topFactors,
            };
          });

        const total = results.length;
        const totalPages = Math.ceil(total / query.limit);

        return {
          riskScores: results,
          pagination: {
            page: query.page,
            limit: query.limit,
            total,
            totalPages,
          },
        };
      });

      return NextResponse.json(riskScores);
    })
  )
);
