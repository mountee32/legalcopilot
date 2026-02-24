/**
 * Case Chat Schema
 *
 * Conversational AI assistant for matters.
 * Stores persistent conversation history so users can resume chats.
 */

import { pgTable, text, timestamp, uuid, pgEnum, integer, jsonb, index } from "drizzle-orm/pg-core";
import { firms } from "./firms";
import { matters } from "./matters";
import { users } from "./users";

export const caseMessageRoleEnum = pgEnum("case_message_role", ["user", "assistant"]);

export const caseConversations = pgTable(
  "case_conversations",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    firmId: uuid("firm_id")
      .notNull()
      .references(() => firms.id, { onDelete: "cascade" }),

    matterId: uuid("matter_id")
      .notNull()
      .references(() => matters.id, { onDelete: "cascade" }),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    /** Auto-generated from first user message */
    title: text("title"),

    messageCount: integer("message_count").notNull().default(0),
    lastMessageAt: timestamp("last_message_at"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    firmMatterIdx: index("case_conversations_firm_matter_idx").on(t.firmId, t.matterId),
    firmUserIdx: index("case_conversations_firm_user_idx").on(t.firmId, t.userId),
  })
);

export const caseMessages = pgTable(
  "case_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    firmId: uuid("firm_id")
      .notNull()
      .references(() => firms.id, { onDelete: "cascade" }),

    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => caseConversations.id, { onDelete: "cascade" }),

    role: caseMessageRoleEnum("role").notNull(),
    content: text("content").notNull(),

    /** [{documentId, documentChunkId, quote}] */
    citations: jsonb("citations"),

    /** Metadata about context used for this response */
    contextSummary: jsonb("context_summary"),

    model: text("model"),
    tokensUsed: integer("tokens_used"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    conversationIdx: index("case_messages_conversation_idx").on(t.conversationId),
    firmIdx: index("case_messages_firm_idx").on(t.firmId),
  })
);

export type CaseConversation = typeof caseConversations.$inferSelect;
export type NewCaseConversation = typeof caseConversations.$inferInsert;
export type CaseMessage = typeof caseMessages.$inferSelect;
export type NewCaseMessage = typeof caseMessages.$inferInsert;
