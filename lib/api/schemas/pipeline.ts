/**
 * Pipeline API Schemas
 *
 * Request/response validation for document processing pipeline endpoints.
 *
 * @see lib/db/schema/pipeline.ts for database schema
 */

import { z, UuidSchema, DateTimeSchema } from "./common";

// ---------------------------------------------------------------------------
// Enum schemas
// ---------------------------------------------------------------------------

export const PipelineRunStatusSchema = z
  .enum(["queued", "running", "completed", "failed", "cancelled"])
  .openapi("PipelineRunStatus");

export const PipelineStageSchema = z
  .enum(["intake", "ocr", "classify", "extract", "reconcile", "actions"])
  .openapi("PipelineStage");

export const PipelineStageStatusSchema = z
  .enum(["pending", "running", "completed", "failed", "skipped"])
  .openapi("PipelineStageStatus");

export const PipelineFindingStatusSchema = z
  .enum(["pending", "accepted", "rejected", "auto_applied", "conflict"])
  .openapi("PipelineFindingStatus");

export const PipelineFindingImpactSchema = z
  .enum(["critical", "high", "medium", "low", "info"])
  .openapi("PipelineFindingImpact");

export const PipelineActionStatusSchema = z
  .enum(["pending", "accepted", "dismissed", "executed", "failed"])
  .openapi("PipelineActionStatus");

export const PipelineActionTypeSchema = z
  .enum([
    "create_task",
    "create_deadline",
    "update_field",
    "send_notification",
    "flag_risk",
    "request_review",
    "ai_recommendation",
  ])
  .openapi("PipelineActionType");

// ---------------------------------------------------------------------------
// Stage status detail
// ---------------------------------------------------------------------------

export const StageStatusDetailSchema = z.object({
  status: PipelineStageStatusSchema,
  startedAt: DateTimeSchema.optional(),
  completedAt: DateTimeSchema.optional(),
  error: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Pipeline Run schemas
// ---------------------------------------------------------------------------

export const PipelineRunSchema = z
  .object({
    id: UuidSchema,
    firmId: UuidSchema,
    matterId: UuidSchema,
    documentId: UuidSchema,
    status: PipelineRunStatusSchema,
    currentStage: PipelineStageSchema.nullable(),
    stageStatuses: z.record(StageStatusDetailSchema).default({}),
    documentHash: z.string().nullable(),
    classifiedDocType: z.string().nullable(),
    classificationConfidence: z.string().nullable(),
    taxonomyPackId: UuidSchema.nullable(),
    findingsCount: z.number().int(),
    actionsCount: z.number().int(),
    totalTokensUsed: z.number().int(),
    error: z.string().nullable(),
    triggeredBy: UuidSchema.nullable(),
    startedAt: DateTimeSchema.nullable(),
    completedAt: DateTimeSchema.nullable(),
    createdAt: DateTimeSchema,
    updatedAt: DateTimeSchema,
  })
  .openapi("PipelineRun");

export const PipelineRunListSchema = z
  .object({
    runs: z.array(PipelineRunSchema),
  })
  .openapi("PipelineRunListResponse");

// ---------------------------------------------------------------------------
// Pipeline Finding schemas
// ---------------------------------------------------------------------------

export const PipelineFindingSchema = z
  .object({
    id: UuidSchema,
    pipelineRunId: UuidSchema,
    matterId: UuidSchema,
    documentId: UuidSchema,
    categoryKey: z.string(),
    fieldKey: z.string(),
    label: z.string(),
    value: z.string().nullable(),
    sourceQuote: z.string().nullable(),
    pageStart: z.number().int().nullable(),
    pageEnd: z.number().int().nullable(),
    charStart: z.number().int().nullable(),
    charEnd: z.number().int().nullable(),
    confidence: z.string(),
    impact: PipelineFindingImpactSchema,
    status: PipelineFindingStatusSchema,
    existingValue: z.string().nullable(),
    resolvedBy: UuidSchema.nullable(),
    resolvedAt: DateTimeSchema.nullable(),
    metadata: z.record(z.unknown()).nullable(),
    createdAt: DateTimeSchema,
  })
  .openapi("PipelineFinding");

export const ResolveFindingSchema = z
  .object({
    status: z.enum(["accepted", "rejected"]),
  })
  .openapi("ResolveFindingRequest");

// ---------------------------------------------------------------------------
// Pipeline Action schemas
// ---------------------------------------------------------------------------

export const PipelineActionSchema = z
  .object({
    id: UuidSchema,
    pipelineRunId: UuidSchema,
    matterId: UuidSchema,
    actionType: PipelineActionTypeSchema,
    title: z.string(),
    description: z.string().nullable(),
    priority: z.number().int(),
    status: PipelineActionStatusSchema,
    isDeterministic: z.string(),
    actionPayload: z.record(z.unknown()).nullable(),
    triggerFindingId: UuidSchema.nullable(),
    triggerRuleId: UuidSchema.nullable(),
    resolvedBy: UuidSchema.nullable(),
    resolvedAt: DateTimeSchema.nullable(),
    error: z.string().nullable(),
    createdAt: DateTimeSchema,
  })
  .openapi("PipelineAction");

export const ResolveActionSchema = z
  .object({
    status: z.enum(["accepted", "dismissed"]),
  })
  .openapi("ResolveActionRequest");

// ---------------------------------------------------------------------------
// Pipeline Run Detail (with findings + actions)
// ---------------------------------------------------------------------------

export const PipelineRunDetailSchema = z
  .object({
    run: PipelineRunSchema,
    findings: z.array(PipelineFindingSchema),
    actions: z.array(PipelineActionSchema),
  })
  .openapi("PipelineRunDetailResponse");

// ---------------------------------------------------------------------------
// Type exports
// ---------------------------------------------------------------------------

export type PipelineRun = z.infer<typeof PipelineRunSchema>;
export type PipelineFinding = z.infer<typeof PipelineFindingSchema>;
export type PipelineAction = z.infer<typeof PipelineActionSchema>;
export type ResolveFinding = z.infer<typeof ResolveFindingSchema>;
export type ResolveAction = z.infer<typeof ResolveActionSchema>;
