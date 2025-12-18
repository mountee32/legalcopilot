/**
 * Matter/Case Schema
 *
 * A "matter" is the UK legal term for a case or legal engagement.
 * Each matter belongs to a client and tracks the legal work being done.
 *
 * @see docs/backend-design.md Section 2.5 for full Matter specification
 */

import {
  pgTable,
  text,
  timestamp,
  uuid,
  pgEnum,
  numeric,
  jsonb,
  integer,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { clients } from "./clients";
import { firms } from "./firms";
import { users } from "./users";

/**
 * Matter status lifecycle:
 * lead → active → on_hold → closed → archived
 */
export const matterStatusEnum = pgEnum("matter_status", [
  "lead", // Initial enquiry, not yet opened
  "active", // Work in progress
  "on_hold", // Temporarily paused
  "closed", // Completed, pending archival
  "archived", // Long-term storage
]);

/**
 * Practice area classification.
 * Determines workflows, templates, and reporting.
 */
export const practiceAreaEnum = pgEnum("practice_area", [
  "conveyancing",
  "litigation",
  "family",
  "probate",
  "employment",
  "immigration",
  "personal_injury",
  "commercial",
  "criminal",
  "ip",
  "insolvency",
  "other",
]);

/**
 * Billing arrangement type.
 */
export const billingTypeEnum = pgEnum("billing_type", [
  "hourly", // Time-based billing
  "fixed_fee", // Agreed fixed price
  "conditional", // No win, no fee
  "legal_aid", // Government funded
  "pro_bono", // Free service
]);

/**
 * Core matter/case record.
 */
export const matters = pgTable(
  "matters",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    firmId: uuid("firm_id")
      .notNull()
      .references(() => firms.id, { onDelete: "cascade" }),

    /** Internal reference e.g. "SMI-2024-0042" */
    reference: text("reference").notNull(),

    /** Display title e.g. "Smith v Jones - Property Dispute" */
    title: text("title").notNull(),

    /** Brief description of the matter */
    description: text("description"),

    /** Client this matter belongs to */
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id),

    /** Lead fee earner responsible */
    feeEarnerId: uuid("fee_earner_id").references(() => users.id),

    /** Supervising partner (for compliance) */
    supervisorId: uuid("supervisor_id").references(() => users.id),

    status: matterStatusEnum("status").notNull().default("lead"),
    practiceArea: practiceAreaEnum("practice_area").notNull(),

    /** Sub-type within practice area e.g. "freehold_purchase" for conveyancing */
    subType: text("sub_type"),

    billingType: billingTypeEnum("billing_type").notNull().default("hourly"),

    /** Agreed hourly rate (if hourly billing) */
    hourlyRate: numeric("hourly_rate", { precision: 10, scale: 2 }),

    /** Fixed fee amount (if fixed fee billing) */
    fixedFee: numeric("fixed_fee", { precision: 10, scale: 2 }),

    /** Estimated value of the matter */
    estimatedValue: numeric("estimated_value", { precision: 10, scale: 2 }),

    /** Date matter was opened */
    openedAt: timestamp("opened_at"),

    /** Date matter was closed */
    closedAt: timestamp("closed_at"),

    /** Key deadline for the matter (e.g., limitation date) */
    keyDeadline: timestamp("key_deadline"),

    /** Practice-area specific data stored as JSON */
    practiceData: jsonb("practice_data"),

    /** Free-text notes */
    notes: text("notes"),

    /** AI-calculated risk score (0-100 scale, higher = more risky) */
    riskScore: integer("risk_score"),

    /** AI risk assessment factors for explainability */
    riskFactors: jsonb("risk_factors"),

    /** When AI last calculated the risk score */
    riskAssessedAt: timestamp("risk_assessed_at"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    uniqueReferencePerFirm: uniqueIndex("matters_firm_reference_unique").on(t.firmId, t.reference),
  })
);

// Type exports
export type Matter = typeof matters.$inferSelect;
export type NewMatter = typeof matters.$inferInsert;

// TODO: Add when implementing:
// - matterTasks (tasks/to-dos for a matter)
// - matterTimeline (key events in matter lifecycle)
// - matterParties (other parties involved)
