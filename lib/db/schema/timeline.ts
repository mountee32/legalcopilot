/**
 * Timeline Events Schema
 *
 * Append-only chronological activity log per matter.
 * Used for compliance, case review, and AI context.
 */

import { pgTable, text, timestamp, uuid, pgEnum, jsonb, index } from "drizzle-orm/pg-core";
import { firms } from "./firms";
import { matters } from "./matters";
import { users } from "./users";

export const timelineActorTypeEnum = pgEnum("timeline_actor_type", ["user", "system", "ai"]);

/**
 * Timeline event types.
 * Extended to include workflow, task status, and evidence events.
 */
export const timelineEventTypeEnum = pgEnum("timeline_event_type", [
  // Matter events
  "matter_created",
  "matter_updated",
  "matter_archived",

  // Document events
  "document_uploaded",
  "document_deleted",
  "document_analyzed",
  "document_extracted",
  "document_chunked",
  "document_summarized",
  "document_entities_extracted",

  // Email events
  "email_received",
  "email_sent",

  // Task events (existing)
  "task_created",
  "task_completed",

  // Task events (new - Enhanced Task Model)
  "task_skipped", // Task deliberately skipped
  "task_not_applicable", // Task marked not applicable
  "task_evidence_added", // Evidence attached to task
  "task_evidence_verified", // Evidence verified
  "task_approval_requested", // Task approval requested
  "task_approved", // Task approved by supervisor
  "task_rejected", // Task rejected by supervisor

  // Workflow stage events (new - Enhanced Task Model)
  "stage_started", // Stage work began
  "stage_completed", // Stage completed
  "stage_skipped", // Stage skipped (applicability conditions not met)
  "stage_gate_blocked", // Attempted to proceed but gate blocked
  "stage_gate_overridden", // Gate manually overridden

  // Workflow events (new - Enhanced Task Model)
  "workflow_activated", // Workflow attached to matter
  "workflow_changed", // Workflow changed mid-matter

  // Billing events
  "time_entry_submitted",
  "time_entry_approved",
  "invoice_generated",
  "invoice_sent",
  "invoice_voided",
  "payment_recorded",
  "payment_deleted",

  // Calendar events
  "calendar_event_created",
  "calendar_event_updated",
  "calendar_event_deleted",

  // Lead/Quote events
  "lead_converted",
  "quote_converted",

  // Compliance events
  "conflict_check_run",
  "conflict_check_cleared",
  "conflict_check_waived",
  "approval_decided",

  // Note events
  "note_added",
  "note_deleted",
  "template_applied",

  // Pipeline events
  "pipeline_started",
  "pipeline_completed",
  "pipeline_failed",
  "pipeline_stage_completed",
  "pipeline_finding_extracted",
  "pipeline_action_generated",
  "pipeline_finding_resolved",
  "pipeline_action_resolved",

  // Email import events
  "email_import_completed",
  "email_import_failed",
  "email_import_unmatched",

  // Email response events
  "email_response_generated",
  "email_tasks_created",
  "email_delivery_failed",
]);

export const timelineEvents = pgTable(
  "timeline_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    firmId: uuid("firm_id")
      .notNull()
      .references(() => firms.id, { onDelete: "cascade" }),

    matterId: uuid("matter_id")
      .notNull()
      .references(() => matters.id, { onDelete: "cascade" }),

    type: timelineEventTypeEnum("type").notNull(),
    title: text("title").notNull(),
    description: text("description"),

    actorType: timelineActorTypeEnum("actor_type").notNull(),
    actorId: uuid("actor_id").references(() => users.id, { onDelete: "set null" }),

    entityType: text("entity_type"),
    entityId: uuid("entity_id"),
    metadata: jsonb("metadata"),

    /**
     * Visibility of this event.
     * - internal: Staff only (default)
     * - client_visible: Visible in client portal
     */
    visibility: text("visibility").default("internal"), // "internal" | "client_visible"

    occurredAt: timestamp("occurred_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    firmMatterIdx: index("timeline_events_firm_matter_idx").on(t.firmId, t.matterId),
    firmOccurredAtIdx: index("timeline_events_firm_occurred_at_idx").on(t.firmId, t.occurredAt),
  })
);

export type TimelineEvent = typeof timelineEvents.$inferSelect;
export type NewTimelineEvent = typeof timelineEvents.$inferInsert;
