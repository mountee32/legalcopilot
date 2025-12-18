/**
 * Email Schema
 *
 * Tracks inbound/outbound email messages, optionally linked to matters.
 * AI can process messages for intent/sentiment/urgency and propose actions.
 */

import {
  pgTable,
  text,
  timestamp,
  uuid,
  pgEnum,
  jsonb,
  boolean,
  integer,
  index,
} from "drizzle-orm/pg-core";
import { firms } from "./firms";
import { matters } from "./matters";
import { users } from "./users";
import { approvalRequests } from "./approvals";

export const emailDirectionEnum = pgEnum("email_direction", ["inbound", "outbound"]);

export const emailStatusEnum = pgEnum("email_status", [
  "draft",
  "pending",
  "sent",
  "delivered",
  "received",
  "failed",
  "bounced",
  "archived",
]);

export const emailIntentEnum = pgEnum("email_intent", [
  "request_information",
  "provide_information",
  "request_action",
  "status_update",
  "complaint",
  "deadline",
  "confirmation",
  "general",
]);

export const emailSentimentEnum = pgEnum("email_sentiment", [
  "positive",
  "neutral",
  "negative",
  "frustrated",
]);

export const emails = pgTable(
  "emails",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    firmId: uuid("firm_id")
      .notNull()
      .references(() => firms.id, { onDelete: "cascade" }),

    matterId: uuid("matter_id").references(() => matters.id, { onDelete: "set null" }),

    direction: emailDirectionEnum("direction").notNull(),

    fromAddress: jsonb("from_address").notNull(),
    toAddresses: jsonb("to_addresses").notNull(),
    ccAddresses: jsonb("cc_addresses"),
    bccAddresses: jsonb("bcc_addresses"),

    subject: text("subject").notNull(),
    bodyText: text("body_text"),
    bodyHtml: text("body_html"),

    messageId: text("message_id"),
    threadId: text("thread_id"),
    inReplyTo: text("in_reply_to"),

    hasAttachments: boolean("has_attachments").notNull().default(false),
    attachmentCount: integer("attachment_count").notNull().default(0),
    attachmentIds: jsonb("attachment_ids"),

    status: emailStatusEnum("status").notNull().default("received"),
    readAt: timestamp("read_at"),

    aiProcessed: boolean("ai_processed").notNull().default(false),
    aiProcessedAt: timestamp("ai_processed_at"),
    aiIntent: emailIntentEnum("ai_intent"),
    aiSentiment: emailSentimentEnum("ai_sentiment"),
    aiUrgency: integer("ai_urgency"),
    aiSummary: text("ai_summary"),
    aiSuggestedResponse: text("ai_suggested_response"),
    aiSuggestedTasks: jsonb("ai_suggested_tasks"),
    aiMatchedMatterId: uuid("ai_matched_matter_id").references(() => matters.id, {
      onDelete: "set null",
    }),
    aiMatchConfidence: integer("ai_match_confidence"),

    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    receivedAt: timestamp("received_at"),
    sentAt: timestamp("sent_at"),

    approvalRequestId: uuid("approval_request_id").references(() => approvalRequests.id, {
      onDelete: "set null",
    }),
    contentHash: text("content_hash"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    firmMatterIdx: index("emails_firm_matter_idx").on(t.firmId, t.matterId),
    firmStatusIdx: index("emails_firm_status_idx").on(t.firmId, t.status),
    firmDirectionIdx: index("emails_firm_direction_idx").on(t.firmId, t.direction),
    threadIdx: index("emails_thread_idx").on(t.threadId),
  })
);

export type Email = typeof emails.$inferSelect;
export type NewEmail = typeof emails.$inferInsert;
