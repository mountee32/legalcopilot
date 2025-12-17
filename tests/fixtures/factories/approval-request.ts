/**
 * Approval Request factory for creating test approval requests
 */
import { db } from "@/lib/db";
import { approvalRequests } from "@/lib/db/schema";
import { randomUUID } from "crypto";

export type ApprovalSource = "ai" | "system" | "user";
export type ApprovalStatus = "pending" | "approved" | "rejected" | "cancelled" | "expired";
export type ApprovalExecutionStatus = "not_executed" | "executed" | "failed";

export interface ApprovalRequestFactoryOptions {
  id?: string;
  firmId: string;
  sourceType?: ApprovalSource;
  sourceId?: string | null;
  action: string;
  summary?: string;
  proposedPayload?: Record<string, unknown>;
  entityType?: string | null;
  entityId?: string | null;
  status?: ApprovalStatus;
  decidedBy?: string | null;
  decidedAt?: Date | null;
  decisionReason?: string | null;
  executionStatus?: ApprovalExecutionStatus;
}

export interface TestApprovalRequest {
  id: string;
  firmId: string;
  sourceType: string;
  action: string;
  summary: string;
  proposedPayload: unknown;
  entityType: string | null;
  entityId: string | null;
  status: string;
  executionStatus: string;
}

/**
 * Create a test approval request in the database
 */
export async function createApprovalRequest(
  options: ApprovalRequestFactoryOptions
): Promise<TestApprovalRequest> {
  const id = options.id || randomUUID();

  const approvalData = {
    id,
    firmId: options.firmId,
    sourceType: options.sourceType || "ai",
    sourceId: options.sourceId ?? null,
    action: options.action,
    summary: options.summary || `Approval request for ${options.action}`,
    proposedPayload: options.proposedPayload ?? {},
    entityType: options.entityType ?? null,
    entityId: options.entityId ?? null,
    status: options.status || "pending",
    decidedBy: options.decidedBy ?? null,
    decidedAt: options.decidedAt ?? null,
    decisionReason: options.decisionReason ?? null,
    executionStatus: options.executionStatus || "not_executed",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const [approval] = await db.insert(approvalRequests).values(approvalData).returning();

  return {
    id: approval.id,
    firmId: approval.firmId,
    sourceType: approval.sourceType,
    action: approval.action,
    summary: approval.summary,
    proposedPayload: approval.proposedPayload,
    entityType: approval.entityType,
    entityId: approval.entityId,
    status: approval.status,
    executionStatus: approval.executionStatus,
  };
}

/**
 * Build approval request data without inserting into database
 */
export function buildApprovalRequestData(
  firmId: string,
  action: string,
  options: Partial<ApprovalRequestFactoryOptions> = {}
): Record<string, unknown> {
  return {
    firmId,
    sourceType: options.sourceType || "ai",
    action,
    summary: options.summary || `Approval request for ${action}`,
    proposedPayload: options.proposedPayload ?? {},
    entityType: options.entityType ?? null,
    entityId: options.entityId ?? null,
    status: options.status || "pending",
  };
}

/**
 * Create a task creation approval request
 */
export async function createTaskApproval(
  firmId: string,
  matterId: string,
  tasks: Array<{ title: string; description?: string; priority?: string; dueDate?: string }>,
  options: Partial<ApprovalRequestFactoryOptions> = {}
): Promise<TestApprovalRequest> {
  return createApprovalRequest({
    ...options,
    firmId,
    action: "task.create",
    summary: `Create ${tasks.length} task(s)`,
    proposedPayload: { matterId, tasks },
    entityType: "matter",
    entityId: matterId,
  });
}

/**
 * Create a time entry approval request
 */
export async function createTimeEntryApproval(
  firmId: string,
  timeEntryId: string,
  options: Partial<ApprovalRequestFactoryOptions> = {}
): Promise<TestApprovalRequest> {
  return createApprovalRequest({
    ...options,
    firmId,
    action: "time_entry.approve",
    summary: "Approve time entry",
    proposedPayload: { timeEntryId },
    entityType: "time_entry",
    entityId: timeEntryId,
  });
}

/**
 * Create an invoice send approval request
 */
export async function createInvoiceSendApproval(
  firmId: string,
  invoiceId: string,
  options: Partial<ApprovalRequestFactoryOptions> = {}
): Promise<TestApprovalRequest> {
  return createApprovalRequest({
    ...options,
    firmId,
    action: "invoice.send",
    summary: "Send invoice to client",
    proposedPayload: { invoiceId },
    entityType: "invoice",
    entityId: invoiceId,
  });
}

/**
 * Create a calendar event creation approval request
 */
export async function createCalendarEventApproval(
  firmId: string,
  matterId: string,
  events: Array<{ title: string; eventType?: string; startAt: string }>,
  options: Partial<ApprovalRequestFactoryOptions> = {}
): Promise<TestApprovalRequest> {
  return createApprovalRequest({
    ...options,
    firmId,
    action: "calendar_event.create",
    summary: `Create ${events.length} calendar event(s)`,
    proposedPayload: { matterId, events },
    entityType: "matter",
    entityId: matterId,
  });
}

/**
 * Create a template proposal approval request
 */
export async function createTemplateApproval(
  firmId: string,
  action: "template.create" | "template.update",
  draft: { name: string; type: "document" | "email"; content: string },
  options: Partial<ApprovalRequestFactoryOptions> = {}
): Promise<TestApprovalRequest> {
  return createApprovalRequest({
    ...options,
    firmId,
    action,
    summary: action === "template.create" ? `Create template: ${draft.name}` : `Update template`,
    proposedPayload: { action, draft },
  });
}

/**
 * Create a conflict check approval request
 */
export async function createConflictCheckApproval(
  firmId: string,
  conflictCheckId: string,
  action: "conflict_check.clear" | "conflict_check.waive",
  options: Partial<ApprovalRequestFactoryOptions> = {}
): Promise<TestApprovalRequest> {
  return createApprovalRequest({
    ...options,
    firmId,
    action,
    summary: action === "conflict_check.clear" ? "Clear conflict check" : "Waive conflict",
    proposedPayload: { conflictCheckId, waiverReason: options.decisionReason },
    entityType: "conflict_check",
    entityId: conflictCheckId,
  });
}
