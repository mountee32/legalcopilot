import { and, eq, inArray } from "drizzle-orm";
import {
  approvalRequests,
  calendarEvents,
  conflictChecks,
  invoices,
  matters,
  signatureRequests,
  templates,
  timeEntries,
  tasks,
  users,
} from "@/lib/db/schema";
import type { db } from "@/lib/db";
import { createTimelineEvent } from "@/lib/timeline/createEvent";
import { randomUUID } from "crypto";

type ApprovalRow = {
  id: string;
  firmId: string;
  action: string;
  proposedPayload: unknown;
  entityType: string | null;
  entityId: string | null;
  decidedBy?: string | null;
  decisionReason?: string | null;
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

type TimeEntryApprovePayload = {
  timeEntryId?: string;
};

type InvoiceSendPayload = {
  invoiceId?: string;
};

type CalendarEventCreatePayload = {
  matterId?: string;
  events?: Array<{
    title?: string;
    description?: string | null;
    eventType?: string;
    status?: string;
    priority?: string;
    startAt?: string;
    endAt?: string | null;
    allDay?: boolean;
    location?: string | null;
    attendees?: unknown;
    reminderMinutes?: unknown;
    recurrence?: unknown;
  }>;
};

type TemplateProposePayload = {
  action?: "template.create" | "template.update";
  templateId?: string;
  draft?: {
    name?: string;
    type?: "document" | "email";
    category?: string;
    content?: string;
    mergeFields?: Record<string, unknown>;
    isActive?: boolean;
  };
};

type ConflictDecisionPayload = {
  conflictCheckId?: string;
  waiverReason?: string;
};

type SignatureRequestSendPayload = {
  signatureRequestId?: string;
};

export async function executeApprovalIfSupported(
  tx: typeof db,
  approval: ApprovalRow
): Promise<{ executionStatus: "not_executed" | "executed" | "failed"; executionError?: string }> {
  if (approval.action === "task.create") {
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
      .where(
        and(eq(approvalRequests.id, approval.id), eq(approvalRequests.firmId, approval.firmId))
      );

    return { executionStatus: "executed" };
  }

  if (approval.action === "time_entry.approve") {
    const payload = approval.proposedPayload as TimeEntryApprovePayload;
    const timeEntryId = payload?.timeEntryId ?? approval.entityId ?? null;
    if (!timeEntryId) {
      return { executionStatus: "failed", executionError: "Missing timeEntryId" };
    }

    const [entry] = await tx
      .select({ id: timeEntries.id, matterId: timeEntries.matterId, status: timeEntries.status })
      .from(timeEntries)
      .where(and(eq(timeEntries.id, timeEntryId), eq(timeEntries.firmId, approval.firmId)))
      .limit(1);

    if (!entry)
      return { executionStatus: "failed", executionError: "Time entry not found for firm" };
    if (entry.status !== "submitted") {
      return {
        executionStatus: "failed",
        executionError: "Time entry must be submitted to approve",
      };
    }

    await tx
      .update(timeEntries)
      .set({ status: "approved", updatedAt: new Date() })
      .where(and(eq(timeEntries.id, timeEntryId), eq(timeEntries.firmId, approval.firmId)));

    await createTimelineEvent(tx, {
      firmId: approval.firmId,
      matterId: entry.matterId,
      type: "time_entry_approved",
      title: "Time entry approved",
      actorType: "system",
      actorId: null,
      entityType: "time_entry",
      entityId: timeEntryId,
      occurredAt: new Date(),
      metadata: { approvalRequestId: approval.id },
    });

    await tx
      .update(approvalRequests)
      .set({ executedAt: new Date(), executionStatus: "executed", updatedAt: new Date() })
      .where(
        and(eq(approvalRequests.id, approval.id), eq(approvalRequests.firmId, approval.firmId))
      );

    return { executionStatus: "executed" };
  }

  if (approval.action === "invoice.send") {
    const payload = approval.proposedPayload as InvoiceSendPayload;
    const invoiceId = payload?.invoiceId ?? approval.entityId ?? null;
    if (!invoiceId) return { executionStatus: "failed", executionError: "Missing invoiceId" };

    const [inv] = await tx
      .select({ id: invoices.id, matterId: invoices.matterId, status: invoices.status })
      .from(invoices)
      .where(and(eq(invoices.id, invoiceId), eq(invoices.firmId, approval.firmId)))
      .limit(1);

    if (!inv) return { executionStatus: "failed", executionError: "Invoice not found for firm" };
    if (inv.status !== "draft")
      return { executionStatus: "failed", executionError: "Only draft invoices can be sent" };

    await tx
      .update(invoices)
      .set({ status: "sent", sentAt: new Date(), updatedAt: new Date() })
      .where(and(eq(invoices.id, invoiceId), eq(invoices.firmId, approval.firmId)));

    const matterIds = new Set<string>();
    if (inv.matterId) {
      matterIds.add(inv.matterId);
    } else {
      const rows = await tx
        .select({ matterId: timeEntries.matterId })
        .from(timeEntries)
        .where(and(eq(timeEntries.firmId, approval.firmId), eq(timeEntries.invoiceId, invoiceId)));
      for (const r of rows) matterIds.add(r.matterId);
    }

    for (const matterId of matterIds) {
      await createTimelineEvent(tx, {
        firmId: approval.firmId,
        matterId,
        type: "invoice_sent",
        title: "Invoice sent",
        actorType: "system",
        actorId: null,
        entityType: "invoice",
        entityId: invoiceId,
        occurredAt: new Date(),
        metadata: { approvalRequestId: approval.id },
      });
    }

    await tx
      .update(approvalRequests)
      .set({ executedAt: new Date(), executionStatus: "executed", updatedAt: new Date() })
      .where(
        and(eq(approvalRequests.id, approval.id), eq(approvalRequests.firmId, approval.firmId))
      );

    return { executionStatus: "executed" };
  }

  if (approval.action === "calendar_event.create") {
    const payload = approval.proposedPayload as CalendarEventCreatePayload;
    const matterId = payload?.matterId;
    const proposedEvents = payload?.events;

    if (!matterId || !Array.isArray(proposedEvents) || proposedEvents.length === 0) {
      return {
        executionStatus: "failed",
        executionError: "Invalid proposed payload for calendar_event.create",
      };
    }

    const [matter] = await tx
      .select({ id: matters.id })
      .from(matters)
      .where(and(eq(matters.id, matterId), eq(matters.firmId, approval.firmId)))
      .limit(1);

    if (!matter) return { executionStatus: "failed", executionError: "Matter not found for firm" };

    const normalized = proposedEvents.slice(0, 50).map((e) => ({
      title: typeof e?.title === "string" ? e.title : null,
      description: typeof e?.description === "string" ? e.description : null,
      eventType: typeof e?.eventType === "string" ? e.eventType : "other",
      status: typeof e?.status === "string" ? e.status : "scheduled",
      priority: typeof e?.priority === "string" ? e.priority : "medium",
      startAt: typeof e?.startAt === "string" ? new Date(e.startAt) : null,
      endAt: typeof e?.endAt === "string" ? new Date(e.endAt) : null,
      allDay: typeof e?.allDay === "boolean" ? e.allDay : false,
      location: typeof e?.location === "string" ? e.location : null,
      attendees: e?.attendees ?? null,
      reminderMinutes: e?.reminderMinutes ?? null,
      recurrence: e?.recurrence ?? null,
    }));

    if (normalized.some((e) => !e.title || !e.startAt)) {
      return {
        executionStatus: "failed",
        executionError: "One or more events missing title/startAt",
      };
    }

    const inserted = await tx
      .insert(calendarEvents)
      .values(
        normalized.map((e) => ({
          firmId: approval.firmId,
          matterId,
          title: e.title!,
          description: e.description,
          eventType: e.eventType as any,
          status: e.status as any,
          priority: e.priority as any,
          startAt: e.startAt!,
          endAt: e.endAt,
          allDay: e.allDay,
          location: e.location,
          attendees: e.attendees,
          reminderMinutes: e.reminderMinutes,
          recurrence: e.recurrence,
          createdById: null,
          externalId: null,
          externalSource: null,
          updatedAt: new Date(),
        }))
      )
      .returning({ id: calendarEvents.id });

    await createTimelineEvent(tx, {
      firmId: approval.firmId,
      matterId,
      type: "calendar_event_created",
      title: `Created ${inserted.length} calendar event(s) from approval`,
      actorType: "system",
      actorId: null,
      entityType: "approval_request",
      entityId: approval.id,
      occurredAt: new Date(),
      metadata: { count: inserted.length },
    });

    await tx
      .update(approvalRequests)
      .set({ executedAt: new Date(), executionStatus: "executed", updatedAt: new Date() })
      .where(
        and(eq(approvalRequests.id, approval.id), eq(approvalRequests.firmId, approval.firmId))
      );

    return { executionStatus: "executed" };
  }

  if (approval.action === "template.create" || approval.action === "template.update") {
    const payload = approval.proposedPayload as TemplateProposePayload;
    const draft = payload?.draft ?? {};

    if (approval.action === "template.create") {
      if (!draft.name || !draft.type || !draft.content) {
        return {
          executionStatus: "failed",
          executionError: "Invalid proposed payload for template.create",
        };
      }

      await tx.insert(templates).values({
        firmId: approval.firmId,
        name: draft.name,
        type: draft.type,
        category: draft.category ?? null,
        content: draft.content,
        mergeFields: draft.mergeFields ?? null,
        isActive: draft.isActive ?? true,
        parentId: null,
        version: 1,
        createdById: null,
        updatedAt: new Date(),
      });

      await tx
        .update(approvalRequests)
        .set({ executedAt: new Date(), executionStatus: "executed", updatedAt: new Date() })
        .where(
          and(eq(approvalRequests.id, approval.id), eq(approvalRequests.firmId, approval.firmId))
        );

      return { executionStatus: "executed" };
    }

    const templateId = payload?.templateId ?? approval.entityId ?? null;
    if (!templateId) return { executionStatus: "failed", executionError: "Missing templateId" };

    const [current] = await tx
      .select()
      .from(templates)
      .where(and(eq(templates.id, templateId), eq(templates.firmId, approval.firmId)))
      .limit(1);

    if (!current)
      return { executionStatus: "failed", executionError: "Template not found for firm" };

    const parentId = current.parentId ?? current.id;
    const nextVersion = (current.version ?? 1) + 1;

    await tx
      .update(templates)
      .set({ isActive: false, updatedAt: new Date() })
      .where(and(eq(templates.id, current.id), eq(templates.firmId, approval.firmId)));

    await tx.insert(templates).values({
      firmId: approval.firmId,
      name: draft.name ?? current.name,
      type: current.type,
      category: draft.category ?? current.category,
      content: draft.content ?? current.content,
      mergeFields: draft.mergeFields ?? (current.mergeFields as any),
      isActive: draft.isActive ?? current.isActive,
      parentId,
      version: nextVersion,
      createdById: null,
      updatedAt: new Date(),
    });

    await tx
      .update(approvalRequests)
      .set({ executedAt: new Date(), executionStatus: "executed", updatedAt: new Date() })
      .where(
        and(eq(approvalRequests.id, approval.id), eq(approvalRequests.firmId, approval.firmId))
      );

    return { executionStatus: "executed" };
  }

  if (approval.action === "conflict_check.clear" || approval.action === "conflict_check.waive") {
    const payload = approval.proposedPayload as ConflictDecisionPayload;
    const conflictCheckId = payload?.conflictCheckId ?? approval.entityId ?? null;

    if (!conflictCheckId)
      return { executionStatus: "failed", executionError: "Missing conflictCheckId" };

    const [row] = await tx
      .select({ id: conflictChecks.id, matterId: conflictChecks.matterId })
      .from(conflictChecks)
      .where(
        and(eq(conflictChecks.id, conflictCheckId), eq(conflictChecks.firmId, approval.firmId))
      )
      .limit(1);

    if (!row)
      return { executionStatus: "failed", executionError: "Conflict check not found for firm" };

    const decidedBy = approval.decidedBy ?? null;
    const decisionReason = approval.decisionReason ?? null;

    if (approval.action === "conflict_check.clear") {
      await tx
        .update(conflictChecks)
        .set({
          status: "clear",
          decidedBy,
          decidedAt: new Date(),
          decisionReason,
          waiverReason: null,
          updatedAt: new Date(),
        })
        .where(
          and(eq(conflictChecks.id, conflictCheckId), eq(conflictChecks.firmId, approval.firmId))
        );

      await createTimelineEvent(tx, {
        firmId: approval.firmId,
        matterId: row.matterId,
        type: "conflict_check_cleared",
        title: "Conflict check cleared",
        actorType: "system",
        actorId: null,
        entityType: "conflict_check",
        entityId: conflictCheckId,
        occurredAt: new Date(),
        metadata: { approvalRequestId: approval.id },
      });
    } else {
      await tx
        .update(conflictChecks)
        .set({
          status: "waived",
          decidedBy,
          decidedAt: new Date(),
          decisionReason,
          waiverReason: payload?.waiverReason ?? null,
          updatedAt: new Date(),
        })
        .where(
          and(eq(conflictChecks.id, conflictCheckId), eq(conflictChecks.firmId, approval.firmId))
        );

      await createTimelineEvent(tx, {
        firmId: approval.firmId,
        matterId: row.matterId,
        type: "conflict_check_waived",
        title: "Conflict check waived",
        actorType: "system",
        actorId: null,
        entityType: "conflict_check",
        entityId: conflictCheckId,
        occurredAt: new Date(),
        metadata: { approvalRequestId: approval.id },
      });
    }

    await tx
      .update(approvalRequests)
      .set({ executedAt: new Date(), executionStatus: "executed", updatedAt: new Date() })
      .where(
        and(eq(approvalRequests.id, approval.id), eq(approvalRequests.firmId, approval.firmId))
      );

    return { executionStatus: "executed" };
  }

  if (approval.action === "signature_request.send") {
    const payload = approval.proposedPayload as SignatureRequestSendPayload;
    const signatureRequestId = payload?.signatureRequestId ?? approval.entityId ?? null;
    if (!signatureRequestId)
      return { executionStatus: "failed", executionError: "Missing signatureRequestId" };

    const [row] = await tx
      .select({ id: signatureRequests.id, status: signatureRequests.status })
      .from(signatureRequests)
      .where(
        and(
          eq(signatureRequests.id, signatureRequestId),
          eq(signatureRequests.firmId, approval.firmId)
        )
      )
      .limit(1);

    if (!row)
      return { executionStatus: "failed", executionError: "Signature request not found for firm" };
    if (row.status !== "pending_approval" && row.status !== "draft") {
      return {
        executionStatus: "failed",
        executionError: "Signature request is not pending approval",
      };
    }

    await tx
      .update(signatureRequests)
      .set({
        status: "sent",
        sentAt: new Date(),
        externalId: randomUUID(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(signatureRequests.id, signatureRequestId),
          eq(signatureRequests.firmId, approval.firmId)
        )
      );

    await tx
      .update(approvalRequests)
      .set({ executedAt: new Date(), executionStatus: "executed", updatedAt: new Date() })
      .where(
        and(eq(approvalRequests.id, approval.id), eq(approvalRequests.firmId, approval.firmId))
      );

    return { executionStatus: "executed" };
  }

  return { executionStatus: "not_executed" };
}
