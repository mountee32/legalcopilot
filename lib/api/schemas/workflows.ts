/**
 * Workflow API Schemas
 *
 * Zod schemas for workflow template and stage management.
 *
 * @see lib/db/schema/workflows.ts for database schema
 */

import { z, UuidSchema, DateTimeSchema, PaginationSchema, PaginationMetaSchema } from "./common";

// ═══════════════════════════════════════════════════════════════════════════
// Enums
// ═══════════════════════════════════════════════════════════════════════════

export const WorkflowGateTypeSchema = z.enum(["hard", "soft", "none"]).openapi("WorkflowGateType");

export const DueDateRelativeToSchema = z
  .enum(["stage_started", "task_created", "matter_created", "matter_opened"])
  .openapi("DueDateRelativeTo");

export const MatterStageStatusSchema = z
  .enum(["pending", "in_progress", "completed", "skipped"])
  .openapi("MatterStageStatus");

export const CompletionCriteriaSchema = z
  .enum(["all_mandatory_tasks", "all_tasks", "custom"])
  .openapi("CompletionCriteria");

export const PracticeAreaSchema = z
  .enum([
    "conveyancing",
    "litigation",
    "family",
    "probate",
    "employment",
    "immigration",
    "personal_injury",
    "commercial",
    "criminal",
    "ip",
    "insolvency",
    "other",
  ])
  .openapi("PracticeArea");

export const AssigneeRoleSchema = z
  .enum(["fee_earner", "supervisor", "paralegal", "secretary"])
  .openapi("AssigneeRole");

export const TaskPrioritySchema = z
  .enum(["low", "medium", "high", "urgent"])
  .openapi("TaskPriority");

// ═══════════════════════════════════════════════════════════════════════════
// Workflow Template Schemas
// ═══════════════════════════════════════════════════════════════════════════

export const WorkflowTaskTemplateSchema = z
  .object({
    id: UuidSchema,
    stageId: UuidSchema,
    title: z.string(),
    description: z.string().nullable(),
    isMandatory: z.boolean(),
    requiresEvidence: z.boolean(),
    requiredEvidenceTypes: z.array(z.string()).nullable(),
    requiresVerifiedEvidence: z.boolean(),
    requiresApproval: z.boolean(),
    requiredApproverRole: AssigneeRoleSchema.nullable(),
    defaultAssigneeRole: AssigneeRoleSchema.nullable(),
    defaultPriority: TaskPrioritySchema,
    relativeDueDays: z.number().nullable(),
    dueDateRelativeTo: DueDateRelativeToSchema.nullable(),
    clientVisible: z.boolean(),
    regulatoryBasis: z.string().nullable(),
    sortOrder: z.number(),
    createdAt: DateTimeSchema,
  })
  .openapi("WorkflowTaskTemplate");

export const WorkflowStageSchema = z
  .object({
    id: UuidSchema,
    workflowTemplateId: UuidSchema,
    name: z.string(),
    description: z.string().nullable(),
    sortOrder: z.number(),
    gateType: WorkflowGateTypeSchema,
    completionCriteria: CompletionCriteriaSchema,
    applicabilityConditions: z.record(z.unknown()).nullable(),
    clientVisible: z.boolean(),
    createdAt: DateTimeSchema,
    tasks: z.array(WorkflowTaskTemplateSchema).optional(),
  })
  .openapi("WorkflowStage");

export const WorkflowTemplateSchema = z
  .object({
    id: UuidSchema,
    key: z.string(),
    version: z.string(),
    name: z.string(),
    description: z.string().nullable(),
    practiceArea: PracticeAreaSchema,
    subTypes: z.array(z.string()).nullable(),
    selectionConditions: z.record(z.unknown()).nullable(),
    isDefault: z.boolean(),
    releasedAt: DateTimeSchema.nullable(),
    isActive: z.boolean(),
    createdAt: DateTimeSchema,
    stages: z.array(WorkflowStageSchema).optional(),
  })
  .openapi("WorkflowTemplate");

export const WorkflowTemplateListSchema = z
  .object({
    workflows: z.array(WorkflowTemplateSchema),
    pagination: PaginationMetaSchema,
  })
  .openapi("WorkflowTemplateListResponse");

export const WorkflowQuerySchema = PaginationSchema.extend({
  practiceArea: PracticeAreaSchema.optional(),
  isActive: z.coerce.boolean().optional(),
}).openapi("WorkflowQuery");

// ═══════════════════════════════════════════════════════════════════════════
// Matter Workflow Schemas
// ═══════════════════════════════════════════════════════════════════════════

export const MatterStageSchema = z
  .object({
    id: UuidSchema,
    matterWorkflowId: UuidSchema,
    workflowStageId: UuidSchema,
    name: z.string(),
    sortOrder: z.number(),
    status: MatterStageStatusSchema,
    skippedReason: z.string().nullable(),
    startedAt: DateTimeSchema.nullable(),
    completedAt: DateTimeSchema.nullable(),
    createdAt: DateTimeSchema,
  })
  .openapi("MatterStage");

export const MatterWorkflowSchema = z
  .object({
    id: UuidSchema,
    matterId: UuidSchema,
    firmId: UuidSchema,
    workflowTemplateId: UuidSchema,
    workflowVersion: z.string(),
    activatedAt: DateTimeSchema,
    activatedById: UuidSchema.nullable(),
    currentStageId: UuidSchema.nullable(),
    createdAt: DateTimeSchema,
    stages: z.array(MatterStageSchema).optional(),
    template: WorkflowTemplateSchema.optional(),
  })
  .openapi("MatterWorkflow");

/**
 * Request to activate a workflow on a matter.
 */
export const ActivateWorkflowSchema = z
  .object({
    workflowTemplateId: UuidSchema,
    /** Matter conditions for applicability evaluation */
    conditions: z.record(z.union([z.boolean(), z.string(), z.number()])).optional(),
  })
  .openapi("ActivateWorkflowRequest");

/**
 * Request to override a stage gate.
 */
export const OverrideGateSchema = z
  .object({
    reason: z
      .string()
      .min(10, "Reason must be at least 10 characters")
      .max(2000, "Reason must be at most 2000 characters"),
  })
  .openapi("OverrideGateRequest");

// ═══════════════════════════════════════════════════════════════════════════
// Extended Response Schemas (with counts and nested data)
// ═══════════════════════════════════════════════════════════════════════════

export const MatterStageWithCountsSchema = MatterStageSchema.extend({
  totalTasks: z.number(),
  completedTasks: z.number(),
  mandatoryTasks: z.number(),
  completedMandatoryTasks: z.number(),
}).openapi("MatterStageWithCounts");

export const MatterWorkflowWithStagesSchema = MatterWorkflowSchema.extend({
  stages: z.array(MatterStageWithCountsSchema),
}).openapi("MatterWorkflowWithStages");
