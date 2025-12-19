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

export const timelineEventTypeEnum = pgEnum("timeline_event_type", [
  "matter_created",
  "matter_updated",
  "matter_archived",
  "document_uploaded",
  "document_deleted",
  "document_analyzed",
  "document_extracted",
  "document_chunked",
  "document_summarized",
  "document_entities_extracted",
  "email_received",
  "email_sent",
  "task_created",
  "task_completed",
  "time_entry_submitted",
  "time_entry_approved",
  "invoice_generated",
  "invoice_sent",
  "invoice_voided",
  "payment_recorded",
  "payment_deleted",
  "calendar_event_created",
  "calendar_event_updated",
  "calendar_event_deleted",
  "lead_converted",
  "quote_converted",
  "conflict_check_run",
  "conflict_check_cleared",
  "conflict_check_waived",
  "approval_decided",
  "note_added",
  "template_applied",
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
