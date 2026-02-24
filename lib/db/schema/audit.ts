/**
 * Audit Schema
 *
 * Comprehensive audit logging for compliance and debugging.
 * Every significant action is logged for legal/compliance auditability.
 *
 * @see docs/backend-design.md Section 2.16 for Audit Log specification
 */

import { pgTable, text, timestamp, uuid, pgEnum, jsonb, inet } from "drizzle-orm/pg-core";
import { firms } from "./firms";
import { users } from "./users";

/**
 * Action categories for filtering.
 */
export const auditCategoryEnum = pgEnum("audit_category", [
  "auth", // Login, logout, session events
  "client", // Client CRUD operations
  "matter", // Matter CRUD operations
  "document", // Document operations
  "billing", // Time entries, invoices, payments
  "email", // Email sent/received
  "ai", // AI actions and decisions
  "admin", // Admin/settings changes
  "system", // System events
]);

/**
 * Severity levels.
 */
export const auditSeverityEnum = pgEnum("audit_severity", [
  "info", // Normal operation
  "warning", // Potentially concerning
  "error", // Error occurred
  "critical", // Critical security event
]);

/**
 * Audit log entries.
 *
 * Immutable record of all significant actions.
 * Used for compliance, debugging, and security monitoring.
 */
export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),

  firmId: uuid("firm_id")
    .notNull()
    .references(() => firms.id, { onDelete: "cascade" }),

  /** User who performed the action (null for system actions) */
  userId: uuid("user_id").references(() => users.id),

  /** Action performed e.g. "client.create", "document.view" */
  action: text("action").notNull(),

  category: auditCategoryEnum("category").notNull(),
  severity: auditSeverityEnum("severity").notNull().default("info"),

  /** Human-readable description */
  description: text("description"),

  /** Entity type affected (e.g., "client", "matter") */
  entityType: text("entity_type"),

  /** ID of the affected entity */
  entityId: uuid("entity_id"),

  /** Previous state (for updates) */
  oldValue: jsonb("old_value"),

  /** New state (for creates/updates) */
  newValue: jsonb("new_value"),

  /** Additional context */
  metadata: jsonb("metadata"),

  /** Client IP address */
  ipAddress: inet("ip_address"),

  /** User agent string */
  userAgent: text("user_agent"),

  /** Request ID for correlation */
  requestId: text("request_id"),

  /** AI model used (if AI action) */
  aiModel: text("ai_model"),

  /** AI prompt (if AI action) */
  aiPrompt: text("ai_prompt"),

  /** AI response (if AI action) */
  aiResponse: text("ai_response"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Type exports
export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;

// TODO: Add when implementing:
// - auditRetention (retention policy configuration)
// - auditAlerts (alert rules for critical events)
