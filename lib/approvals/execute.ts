import { and, eq, inArray } from "drizzle-orm";
import { approvalRequests, matters, tasks, users } from "@/lib/db/schema";
import type { db } from "@/lib/db";
import { createTimelineEvent } from "@/lib/timeline/createEvent";

type ApprovalRow = {
  id: string;
  firmId: string;
  action: string;
  proposedPayload: unknown;
  entityType: string | null;
  entityId: string | null;
};

type TaskCreatePayload = {
  matterId?: string;
  tasks?: Array<{
    title?: string;
    description?: string;
    priority?: string;
    dueDate?: string;
    assigneeId?: string | null;
  }>;
};

export async function executeApprovalIfSupported(
  tx: typeof db,
  approval: ApprovalRow
): Promise<{ executionStatus: "not_executed" | "executed" | "failed"; executionError?: string }> {
  if (approval.action !== "task.create") return { executionStatus: "not_executed" };

  const payload = approval.proposedPayload as TaskCreatePayload;
  const matterId = payload?.matterId;
  const proposedTasks = payload?.tasks;

  if (!matterId || !Array.isArray(proposedTasks) || proposedTasks.length === 0) {
    return {
      executionStatus: "failed",
      executionError: "Invalid proposed payload for task.create",
    };
  }

  const [matter] = await tx
    .select({ id: matters.id })
    .from(matters)
    .where(and(eq(matters.id, matterId), eq(matters.firmId, approval.firmId)))
    .limit(1);

  if (!matter) {
    return { executionStatus: "failed", executionError: "Matter not found for firm" };
  }

  const normalized = proposedTasks.slice(0, 50).map((t) => ({
    title: typeof t?.title === "string" ? t.title : null,
    description: typeof t?.description === "string" ? t.description : null,
    priority: typeof t?.priority === "string" ? t.priority : "medium",
    dueDate: typeof t?.dueDate === "string" ? new Date(t.dueDate) : null,
    assigneeId: t?.assigneeId ?? null,
  }));

  if (normalized.some((t) => !t.title)) {
    return { executionStatus: "failed", executionError: "One or more tasks missing title" };
  }

  const assigneeIds = Array.from(
    new Set(
      normalized.map((t) => t.assigneeId).filter((id): id is string => typeof id === "string")
    )
  );

  if (assigneeIds.length > 0) {
    const firmUsers = await tx
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.firmId, approval.firmId), inArray(users.id, assigneeIds)));

    if (firmUsers.length !== assigneeIds.length) {
      return { executionStatus: "failed", executionError: "Invalid assigneeId for firm" };
    }
  }

  await tx.insert(tasks).values(
    normalized.map((t) => ({
      firmId: approval.firmId,
      matterId,
      title: t.title!,
      description: t.description,
      assigneeId: t.assigneeId,
      createdById: null,
      priority: t.priority,
      status: "pending",
      dueDate: t.dueDate,
      aiGenerated: true,
      aiSource: "matter",
      sourceEntityType: approval.entityType,
      sourceEntityId: approval.entityId,
    }))
  );

  await createTimelineEvent(tx, {
    firmId: approval.firmId,
    matterId,
    type: "task_created",
    title: `Created ${normalized.length} task(s) from approval`,
    actorType: "system",
    actorId: null,
    entityType: "approval_request",
    entityId: approval.id,
    occurredAt: new Date(),
    metadata: { count: normalized.length },
  });

  await tx
    .update(approvalRequests)
    .set({ executedAt: new Date(), executionStatus: "executed", updatedAt: new Date() })
    .where(and(eq(approvalRequests.id, approval.id), eq(approvalRequests.firmId, approval.firmId)));

  return { executionStatus: "executed" };
}
