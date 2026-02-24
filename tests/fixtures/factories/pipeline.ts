/**
 * Pipeline factories for creating test pipeline runs, findings, and actions
 */
import { db } from "@/lib/db";
import { pipelineRuns, pipelineFindings, pipelineActions } from "@/lib/db/schema";
import { randomUUID } from "crypto";

// ---------------------------------------------------------------------------
// Pipeline Run
// ---------------------------------------------------------------------------

export interface PipelineRunFactoryOptions {
  id?: string;
  firmId: string;
  matterId: string;
  documentId: string;
  status?: "queued" | "running" | "completed" | "failed" | "cancelled";
  currentStage?: "intake" | "ocr" | "classify" | "extract" | "reconcile" | "actions" | null;
  stageStatuses?: Record<string, unknown>;
  documentHash?: string;
  classifiedDocType?: string;
  classificationConfidence?: string;
  taxonomyPackId?: string;
  findingsCount?: number;
  actionsCount?: number;
  totalTokensUsed?: number;
  error?: string;
  triggeredBy?: string;
}

export interface TestPipelineRun {
  id: string;
  firmId: string;
  matterId: string;
  documentId: string;
  status: string;
  currentStage: string | null;
}

export async function createPipelineRun(
  options: PipelineRunFactoryOptions
): Promise<TestPipelineRun> {
  const id = options.id || randomUUID();

  const [run] = await db
    .insert(pipelineRuns)
    .values({
      id,
      firmId: options.firmId,
      matterId: options.matterId,
      documentId: options.documentId,
      status: options.status || "queued",
      currentStage: options.currentStage ?? null,
      stageStatuses: options.stageStatuses || {},
      documentHash: options.documentHash ?? null,
      classifiedDocType: options.classifiedDocType ?? null,
      classificationConfidence: options.classificationConfidence ?? null,
      taxonomyPackId: options.taxonomyPackId ?? null,
      findingsCount: options.findingsCount ?? 0,
      actionsCount: options.actionsCount ?? 0,
      totalTokensUsed: options.totalTokensUsed ?? 0,
      error: options.error ?? null,
      triggeredBy: options.triggeredBy ?? null,
    })
    .returning();

  return {
    id: run.id,
    firmId: run.firmId,
    matterId: run.matterId,
    documentId: run.documentId,
    status: run.status,
    currentStage: run.currentStage,
  };
}

// ---------------------------------------------------------------------------
// Pipeline Finding
// ---------------------------------------------------------------------------

export interface PipelineFindingFactoryOptions {
  id?: string;
  firmId: string;
  pipelineRunId: string;
  matterId: string;
  documentId: string;
  categoryKey?: string;
  fieldKey?: string;
  label?: string;
  value?: string;
  sourceQuote?: string;
  confidence?: string;
  impact?: "critical" | "high" | "medium" | "low" | "info";
  status?: "pending" | "accepted" | "rejected" | "auto_applied" | "conflict";
  existingValue?: string;
}

export interface TestPipelineFinding {
  id: string;
  pipelineRunId: string;
  fieldKey: string;
  value: string | null;
  confidence: string;
  status: string;
}

export async function createPipelineFinding(
  options: PipelineFindingFactoryOptions
): Promise<TestPipelineFinding> {
  const id = options.id || randomUUID();
  const suffix = Date.now().toString(36);

  const [finding] = await db
    .insert(pipelineFindings)
    .values({
      id,
      firmId: options.firmId,
      pipelineRunId: options.pipelineRunId,
      matterId: options.matterId,
      documentId: options.documentId,
      categoryKey: options.categoryKey || "general",
      fieldKey: options.fieldKey || `field_${suffix}`,
      label: options.label || `Test Finding ${suffix}`,
      value: options.value ?? null,
      sourceQuote: options.sourceQuote ?? null,
      confidence: options.confidence || "0.850",
      impact: options.impact || "medium",
      status: options.status || "pending",
      existingValue: options.existingValue ?? null,
    })
    .returning();

  return {
    id: finding.id,
    pipelineRunId: finding.pipelineRunId,
    fieldKey: finding.fieldKey,
    value: finding.value,
    confidence: finding.confidence,
    status: finding.status,
  };
}

// ---------------------------------------------------------------------------
// Pipeline Action
// ---------------------------------------------------------------------------

export interface PipelineActionFactoryOptions {
  id?: string;
  firmId: string;
  pipelineRunId: string;
  matterId: string;
  actionType?:
    | "create_task"
    | "create_deadline"
    | "update_field"
    | "send_notification"
    | "flag_risk"
    | "request_review"
    | "ai_recommendation";
  title?: string;
  description?: string;
  status?: "pending" | "accepted" | "dismissed" | "executed" | "failed";
  triggerFindingId?: string;
}

export interface TestPipelineAction {
  id: string;
  pipelineRunId: string;
  actionType: string;
  title: string;
  status: string;
}

export async function createPipelineAction(
  options: PipelineActionFactoryOptions
): Promise<TestPipelineAction> {
  const id = options.id || randomUUID();
  const suffix = Date.now().toString(36);

  const [action] = await db
    .insert(pipelineActions)
    .values({
      id,
      firmId: options.firmId,
      pipelineRunId: options.pipelineRunId,
      matterId: options.matterId,
      actionType: options.actionType || "create_task",
      title: options.title || `Test Action ${suffix}`,
      description: options.description ?? null,
      status: options.status || "pending",
      triggerFindingId: options.triggerFindingId ?? null,
    })
    .returning();

  return {
    id: action.id,
    pipelineRunId: action.pipelineRunId,
    actionType: action.actionType,
    title: action.title,
    status: action.status,
  };
}
