/**
 * Pipeline Action Side-Effect Executor
 *
 * When a pipeline action is accepted, this executes the corresponding
 * side-effect: creating a task for create_task, or a calendar event
 * for create_deadline.
 */

import { tasks, calendarEvents } from "@/lib/db/schema";
import { createTimelineEvent } from "@/lib/timeline/createEvent";
import type { db } from "@/lib/db";

interface ActionRow {
  id: string;
  firmId: string;
  matterId: string;
  actionType: string;
  actionPayload: unknown;
}

const VALID_TASK_PRIORITIES = ["low", "medium", "high", "urgent"] as const;
const VALID_CAL_PRIORITIES = ["low", "medium", "high", "critical"] as const;
const VALID_EVENT_TYPES = [
  "hearing",
  "deadline",
  "meeting",
  "reminder",
  "limitation_date",
  "filing_deadline",
  "other",
] as const;

function safeDate(value: unknown): Date | null {
  if (typeof value !== "string") return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

export async function executeActionSideEffects(
  tx: typeof db,
  action: ActionRow,
  userId: string
): Promise<{ executed: boolean; error?: string }> {
  const { actionType, actionPayload, firmId, matterId, id: actionId } = action;

  if (actionType === "create_task") {
    const payload = (actionPayload ?? {}) as Record<string, unknown>;
    const rawTasks = Array.isArray(payload.tasks) ? payload.tasks : [];

    // Support single-task payload: { title, description, priority, dueDate }
    const tasksArray: Record<string, unknown>[] =
      rawTasks.length > 0 ? rawTasks : payload.title ? [payload] : [];

    if (tasksArray.length === 0) {
      return { executed: false, error: "No tasks in actionPayload" };
    }

    const now = new Date();
    const taskValues = tasksArray.slice(0, 10).map((t) => {
      const rawPriority = typeof t.priority === "string" ? t.priority : "medium";
      return {
        firmId,
        matterId,
        title: typeof t.title === "string" ? t.title : "Untitled task",
        description: typeof t.description === "string" ? t.description : null,
        priority: VALID_TASK_PRIORITIES.includes(rawPriority as any) ? rawPriority : "medium",
        status: "pending" as const,
        dueDate: safeDate(t.dueDate),
        assigneeId: null,
        createdById: userId,
        aiGenerated: true,
        aiSource: "matter" as const,
        source: "ai" as const,
        sourceEntityType: "pipeline_action",
        sourceEntityId: actionId,
      };
    });

    await tx.insert(tasks).values(taskValues);

    await createTimelineEvent(tx, {
      firmId,
      matterId,
      type: "task_created",
      title: `Created ${taskValues.length} task(s) from pipeline action`,
      actorType: "user",
      actorId: userId,
      entityType: "pipeline_action",
      entityId: actionId,
      occurredAt: now,
      metadata: { count: taskValues.length, actionType },
    });

    return { executed: true };
  }

  if (actionType === "create_deadline") {
    const payload = (actionPayload ?? {}) as Record<string, unknown>;
    const title = typeof payload.title === "string" ? payload.title : null;
    const startAt = typeof payload.startAt === "string" ? new Date(payload.startAt) : null;

    if (!title || !startAt || isNaN(startAt.getTime())) {
      return { executed: false, error: "Missing title or startAt in actionPayload" };
    }

    const rawEventType = typeof payload.eventType === "string" ? payload.eventType : "deadline";
    const rawCalPriority = typeof payload.priority === "string" ? payload.priority : "medium";

    const now = new Date();
    await tx.insert(calendarEvents).values({
      firmId,
      matterId,
      title,
      description: typeof payload.description === "string" ? payload.description : null,
      eventType: (VALID_EVENT_TYPES.includes(rawEventType as any)
        ? rawEventType
        : "deadline") as any,
      status: "scheduled",
      priority: (VALID_CAL_PRIORITIES.includes(rawCalPriority as any)
        ? rawCalPriority
        : "medium") as any,
      startAt,
      endAt: typeof payload.endAt === "string" ? new Date(payload.endAt) : null,
      allDay: typeof payload.allDay === "boolean" ? payload.allDay : false,
      location: null,
      attendees: null,
      reminderMinutes: null,
      recurrence: null,
      createdById: userId,
      externalId: null,
      externalSource: null,
      updatedAt: now,
    });

    await createTimelineEvent(tx, {
      firmId,
      matterId,
      type: "calendar_event_created",
      title: `Created deadline "${title}" from pipeline action`,
      actorType: "user",
      actorId: userId,
      entityType: "pipeline_action",
      entityId: actionId,
      occurredAt: now,
      metadata: { actionType, startAt: startAt.toISOString() },
    });

    return { executed: true };
  }

  // Other action types (flag_risk, request_review, etc.) — no side effects
  return { executed: false };
}
