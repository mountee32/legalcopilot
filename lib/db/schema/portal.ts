/**
 * Client Portal Schema
 *
 * Handles magic-link authentication and session management for client portal access.
 * Separate from staff authentication to enforce strict client-scoped data access.
 *
 * @see docs/ideas.md Epic 8 for Client Portal specification
 * @see docs/backend-design.md for tenancy and audit requirements
 */

import { pgTable, text, timestamp, uuid, pgEnum } from "drizzle-orm/pg-core";
import { clients } from "./clients";
import { firms } from "./firms";

/**
 * Token status lifecycle for magic links.
 */
export const portalTokenStatusEnum = pgEnum("portal_token_status", [
  "pending", // Generated, awaiting use
  "used", // Successfully consumed
  "expired", // Timed out
  "revoked", // Manually invalidated
]);

/**
 * Magic link tokens for client portal access.
 * Short-lived, single-use tokens sent via email.
 */
export const clientPortalTokens = pgTable("client_portal_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),

  firmId: uuid("firm_id")
    .notNull()
    .references(() => firms.id, { onDelete: "cascade" }),

  /** Client requesting access */
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),

  /** Secure random token (hashed in production) */
  token: text("token").notNull().unique(),

  /** Email address the token was sent to (for verification) */
  email: text("email").notNull(),

  status: portalTokenStatusEnum("status").notNull().default("pending"),

  /** When the token expires (typically 15-30 minutes from creation) */
  expiresAt: timestamp("expires_at").notNull(),

  /** When the token was used (if status=used) */
  usedAt: timestamp("used_at"),

  /** IP address that requested the token (for security audit) */
  requestIpAddress: text("request_ip_address"),

  /** IP address that used the token (for security audit) */
  useIpAddress: text("use_ip_address"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Active client portal sessions.
 * Created after successful magic link verification.
 */
export const clientPortalSessions = pgTable("client_portal_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),

  firmId: uuid("firm_id")
    .notNull()
    .references(() => firms.id, { onDelete: "cascade" }),

  /** Client with active session */
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),

  /** Session token for authentication */
  token: text("token").notNull().unique(),

  /** When this session expires (typically 24 hours) */
  expiresAt: timestamp("expires_at").notNull(),

  /** IP address of session creation (for security audit) */
  ipAddress: text("ip_address"),

  /** Browser/client user agent string */
  userAgent: text("user_agent"),

  /** Last activity timestamp (for idle timeout) */
  lastActivityAt: timestamp("last_activity_at").defaultNow().notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Audit log for portal AI interactions.
 * Records all client AI chat conversations for compliance and policy enforcement.
 */
export const portalAiConversations = pgTable("portal_ai_conversations", {
  id: uuid("id").primaryKey().defaultRandom(),

  firmId: uuid("firm_id")
    .notNull()
    .references(() => firms.id, { onDelete: "cascade" }),

  /** Client who initiated the conversation */
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),

  /** Portal session this conversation occurred in */
  sessionId: uuid("session_id")
    .notNull()
    .references(() => clientPortalSessions.id, { onDelete: "cascade" }),

  /** Matter context (if conversation is matter-specific) */
  matterId: uuid("matter_id"),

  /** Client's question/prompt */
  prompt: text("prompt").notNull(),

  /** AI's response */
  response: text("response").notNull(),

  /** Whether this query was escalated to staff */
  escalated: text("escalated").default("false"),

  /** Reason for escalation (if escalated=true) */
  escalationReason: text("escalation_reason"),

  /** Policy violations detected (if any) */
  policyViolations: text("policy_violations"),

  /** AI model used */
  model: text("model").notNull(),

  /** Token count for cost tracking */
  tokenCount: text("token_count"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Type exports
export type ClientPortalToken = typeof clientPortalTokens.$inferSelect;
export type NewClientPortalToken = typeof clientPortalTokens.$inferInsert;
export type ClientPortalSession = typeof clientPortalSessions.$inferSelect;
export type NewClientPortalSession = typeof clientPortalSessions.$inferInsert;
export type PortalAiConversation = typeof portalAiConversations.$inferSelect;
export type NewPortalAiConversation = typeof portalAiConversations.$inferInsert;
