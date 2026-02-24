/**
 * Analytics API Schemas
 *
 * Zod schemas for operational analytics endpoints:
 * - Pipeline health metrics
 * - Extraction quality metrics
 * - Risk overview metrics
 */

import { z } from "zod";

// ---------------------------------------------------------------------------
// Query schemas (shared)
// ---------------------------------------------------------------------------

export const AnalyticsQuerySchema = z.object({
  /** Number of days to look back (default 30) */
  days: z.coerce.number().int().min(1).max(365).default(30),
});

export type AnalyticsQuery = z.infer<typeof AnalyticsQuerySchema>;

// ---------------------------------------------------------------------------
// Pipeline health response
// ---------------------------------------------------------------------------

export const PipelineHealthResponseSchema = z.object({
  /** High-level KPIs */
  kpis: z.object({
    totalRuns: z.number(),
    completedRuns: z.number(),
    failedRuns: z.number(),
    avgDurationSeconds: z.number().nullable(),
  }),
  /** Daily run counts grouped by status */
  dailyRuns: z.array(
    z.object({
      date: z.string(),
      completed: z.number(),
      failed: z.number(),
      running: z.number(),
    })
  ),
  /** Failure counts by stage */
  failuresByStage: z.array(
    z.object({
      stage: z.string(),
      count: z.number(),
    })
  ),
});

export type PipelineHealthResponse = z.infer<typeof PipelineHealthResponseSchema>;

// ---------------------------------------------------------------------------
// Extraction quality response
// ---------------------------------------------------------------------------

export const ExtractionQualityResponseSchema = z.object({
  /** High-level KPIs */
  kpis: z.object({
    totalFindings: z.number(),
    avgConfidence: z.number().nullable(),
    acceptRate: z.number().nullable(),
    autoAppliedRate: z.number().nullable(),
  }),
  /** Finding counts by status */
  findingsByStatus: z.array(
    z.object({
      status: z.string(),
      count: z.number(),
    })
  ),
  /** Confidence distribution (histogram buckets) */
  confidenceDistribution: z.array(
    z.object({
      bucket: z.string(),
      count: z.number(),
    })
  ),
  /** Top categories by finding count */
  topCategories: z.array(
    z.object({
      category: z.string(),
      count: z.number(),
      avgConfidence: z.number().nullable(),
    })
  ),
});

export type ExtractionQualityResponse = z.infer<typeof ExtractionQualityResponseSchema>;

// ---------------------------------------------------------------------------
// Risk overview response
// ---------------------------------------------------------------------------

export const RiskOverviewResponseSchema = z.object({
  /** High-level KPIs */
  kpis: z.object({
    mattersWithRisk: z.number(),
    avgRiskScore: z.number().nullable(),
    highRiskCount: z.number(),
    criticalFindingsCount: z.number(),
  }),
  /** Risk score distribution (bucketed) */
  riskDistribution: z.array(
    z.object({
      bucket: z.string(),
      count: z.number(),
    })
  ),
  /** Risk by practice area */
  riskByPracticeArea: z.array(
    z.object({
      practiceArea: z.string(),
      avgScore: z.number().nullable(),
      matterCount: z.number(),
    })
  ),
});

export type RiskOverviewResponse = z.infer<typeof RiskOverviewResponseSchema>;
