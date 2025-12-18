/**
 * Compliance & Risk Schema
 *
 * Tracks compliance rules, risk evaluations, alerts, and supervision metrics.
 * Enables proactive compliance monitoring and risk management.
 *
 * @see docs/ideas.md Epic 9 for compliance requirements
 */

import {
  pgTable,
  text,
  timestamp,
  uuid,
  pgEnum,
  jsonb,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { firms } from "./firms";
import { users } from "./users";
import { matters } from "./matters";

/**
 * Risk severity levels.
 */
export const riskSeverityEnum = pgEnum("risk_severity", [
  "low", // 0-33 score
  "medium", // 34-66 score
  "high", // 67-89 score
  "critical", // 90-100 score
]);

/**
 * Compliance rule types.
 */
export const ruleTypeEnum = pgEnum("compliance_rule_type", [
  "deadline", // Deadline-based rules
  "workload", // Workload/capacity rules
  "supervision", // Supervision requirement rules
  "conflict", // Conflict check rules
  "document", // Document retention rules
  "billing", // Billing compliance rules
  "custom", // Custom firm-specific rules
]);

/**
 * Alert status lifecycle.
 */
export const alertStatusEnum = pgEnum("compliance_alert_status", [
  "pending", // Alert created, not yet reviewed
  "acknowledged", // Alert seen by user
  "resolved", // Issue addressed
  "dismissed", // False positive or not applicable
]);

/**
 * Alert priority levels.
 */
export const alertPriorityEnum = pgEnum("alert_priority", [
  "info", // Informational
  "warning", // Requires attention
  "urgent", // Requires immediate action
  "critical", // Critical compliance risk
]);

/**
 * Risk evaluations for matters.
 *
 * AI-generated risk assessments with evidence and recommendations.
 */
export const riskEvaluations = pgTable("risk_evaluations", {
  id: uuid("id").primaryKey().defaultRandom(),

  firmId: uuid("firm_id")
    .notNull()
    .references(() => firms.id, { onDelete: "cascade" }),

  /** Matter being evaluated */
  matterId: uuid("matter_id")
    .notNull()
    .references(() => matters.id, { onDelete: "cascade" }),

  /** Overall risk score (0-100, higher = more risky) */
  score: integer("score").notNull(),

  /** Risk severity classification */
  severity: riskSeverityEnum("severity").notNull(),

  /**
   * Risk factors with weights and evidence.
   * @example [
   *   { factor: "tight_deadline", weight: 0.4, evidence: "Completion due in 3 days" },
   *   { factor: "high_value", weight: 0.3, evidence: "Matter value £500k+" }
   * ]
   */
  factors: jsonb("factors").notNull(),

  /** AI-generated recommendations */
  recommendations: jsonb("recommendations"),

  /** AI model used for evaluation */
  aiModel: text("ai_model").notNull(),

  /** AI prompt used */
  aiPrompt: text("ai_prompt"),

  /** Full AI response */
  aiResponse: text("ai_response"),

  /** When this evaluation was created */
  evaluatedAt: timestamp("evaluated_at").defaultNow().notNull(),

  /** User who triggered evaluation (null for automatic) */
  evaluatedBy: uuid("evaluated_by").references(() => users.id),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Configurable compliance rules per firm.
 *
 * Defines conditions that trigger alerts when violated.
 */
export const complianceRules = pgTable("compliance_rules", {
  id: uuid("id").primaryKey().defaultRandom(),

  firmId: uuid("firm_id")
    .notNull()
    .references(() => firms.id, { onDelete: "cascade" }),

  /** Rule name */
  name: text("name").notNull(),

  /** Detailed description */
  description: text("description"),

  /** Rule type/category */
  type: ruleTypeEnum("type").notNull(),

  /** Is this rule currently active? */
  isActive: boolean("is_active").notNull().default(true),

  /**
   * Rule condition configuration.
   * Structure varies by rule type.
   * @example Deadline rule:
   * {
   *   "type": "deadline",
   *   "warningDays": 7,
   *   "criticalDays": 2,
   *   "practiceAreas": ["conveyancing", "litigation"]
   * }
   * @example Workload rule:
   * {
   *   "type": "workload",
   *   "maxActiveMatters": 25,
   *   "threshold": "warning"
   * }
   */
  condition: jsonb("condition").notNull(),

  /** Alert priority when rule is triggered */
  alertPriority: alertPriorityEnum("alert_priority").notNull().default("warning"),

  /** Alert message template */
  alertTemplate: text("alert_template").notNull(),

  /** How often to check this rule (in seconds) */
  checkInterval: integer("check_interval").default(86400), // Default: daily

  /** When this rule was last checked */
  lastCheckedAt: timestamp("last_checked_at"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),

  /** User who created the rule */
  createdBy: uuid("created_by").references(() => users.id),
});

/**
 * Compliance alerts triggered by rule violations.
 *
 * Tracks compliance issues requiring attention.
 */
export const complianceAlerts = pgTable("compliance_alerts", {
  id: uuid("id").primaryKey().defaultRandom(),

  firmId: uuid("firm_id")
    .notNull()
    .references(() => firms.id, { onDelete: "cascade" }),

  /** Rule that triggered this alert */
  ruleId: uuid("rule_id")
    .notNull()
    .references(() => complianceRules.id, { onDelete: "cascade" }),

  /** Matter this alert relates to (if applicable) */
  matterId: uuid("matter_id").references(() => matters.id, { onDelete: "cascade" }),

  /** User this alert relates to (if applicable) */
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),

  /** Alert priority */
  priority: alertPriorityEnum("priority").notNull(),

  /** Alert status */
  status: alertStatusEnum("status").notNull().default("pending"),

  /** Alert title */
  title: text("title").notNull(),

  /** Alert message */
  message: text("message").notNull(),

  /**
   * Alert context and evidence.
   * @example {
   *   "deadline": "2024-12-20T17:00:00Z",
   *   "daysRemaining": 2,
   *   "matterId": "...",
   *   "matterReference": "SMI-2024-0042"
   * }
   */
  context: jsonb("context"),

  /** When the alert was triggered */
  triggeredAt: timestamp("triggered_at").defaultNow().notNull(),

  /** When the alert was acknowledged */
  acknowledgedAt: timestamp("acknowledged_at"),

  /** User who acknowledged the alert */
  acknowledgedBy: uuid("acknowledged_by").references(() => users.id),

  /** When the alert was resolved/dismissed */
  resolvedAt: timestamp("resolved_at"),

  /** User who resolved/dismissed the alert */
  resolvedBy: uuid("resolved_by").references(() => users.id),

  /** Resolution notes */
  resolutionNotes: text("resolution_notes"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * Supervision metrics for workload tracking.
 *
 * Tracks fee earner workload for supervision and capacity planning.
 */
export const supervisionMetrics = pgTable("supervision_metrics", {
  id: uuid("id").primaryKey().defaultRandom(),

  firmId: uuid("firm_id")
    .notNull()
    .references(() => firms.id, { onDelete: "cascade" }),

  /** Fee earner being tracked */
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  /** Supervisor (if assigned) */
  supervisorId: uuid("supervisor_id").references(() => users.id, { onDelete: "set null" }),

  /** Metrics period start */
  periodStart: timestamp("period_start").notNull(),

  /** Metrics period end */
  periodEnd: timestamp("period_end").notNull(),

  /** Number of active matters */
  activeMatters: integer("active_matters").notNull().default(0),

  /** Number of matters opened in period */
  mattersOpened: integer("matters_opened").notNull().default(0),

  /** Number of matters closed in period */
  mattersClosed: integer("matters_closed").notNull().default(0),

  /** Total billable hours in period */
  billableHours: integer("billable_hours").notNull().default(0),

  /** Total revenue generated in period (pence) */
  revenue: integer("revenue").notNull().default(0),

  /** Number of overdue tasks */
  overdueTasks: integer("overdue_tasks").notNull().default(0),

  /** Number of high-risk matters */
  highRiskMatters: integer("high_risk_matters").notNull().default(0),

  /**
   * Additional metrics as JSON.
   * @example {
   *   "avgMatterDuration": 45, // days
   *   "clientSatisfaction": 4.5,
   *   "responseTime": 2.3 // hours
   * }
   */
  additionalMetrics: jsonb("additional_metrics"),

  /** When metrics were calculated */
  calculatedAt: timestamp("calculated_at").defaultNow().notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Type exports
export type RiskEvaluation = typeof riskEvaluations.$inferSelect;
export type NewRiskEvaluation = typeof riskEvaluations.$inferInsert;

export type ComplianceRule = typeof complianceRules.$inferSelect;
export type NewComplianceRule = typeof complianceRules.$inferInsert;

export type ComplianceAlert = typeof complianceAlerts.$inferSelect;
export type NewComplianceAlert = typeof complianceAlerts.$inferInsert;

export type SupervisionMetric = typeof supervisionMetrics.$inferSelect;
export type NewSupervisionMetric = typeof supervisionMetrics.$inferInsert;
