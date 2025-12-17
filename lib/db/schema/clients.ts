/**
 * Client Schema
 *
 * Clients are the people or companies the law firm represents.
 * Not to be confused with Users (staff who use the system).
 *
 * @see docs/backend-design.md Section 2.3 for full Client specification
 */

import {
  pgTable,
  text,
  timestamp,
  uuid,
  pgEnum,
  boolean,
  jsonb,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { firms } from "./firms";

/**
 * Client type classification.
 * Affects KYC requirements and billing.
 */
export const clientTypeEnum = pgEnum("client_type", [
  "individual",
  "company",
  "trust",
  "estate",
  "charity",
  "government",
]);

/**
 * Client status lifecycle.
 */
export const clientStatusEnum = pgEnum("client_status", [
  "prospect", // Initial enquiry, not yet engaged
  "active", // Engaged client with active matters
  "dormant", // No active matters, may return
  "archived", // No longer a client, retained for records
]);

/**
 * Core client record.
 *
 * For individuals: name fields used directly
 * For companies: companyName used, contact person in separate table
 */
export const clients = pgTable(
  "clients",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    firmId: uuid("firm_id")
      .notNull()
      .references(() => firms.id, { onDelete: "cascade" }),

    /** Client reference number e.g. "CLI-2024-0042" */
    reference: text("reference").notNull(),

    type: clientTypeEnum("type").notNull().default("individual"),
    status: clientStatusEnum("status").notNull().default("prospect"),

    // Individual fields
    /** Title (Mr, Mrs, Ms, Dr, etc.) */
    title: text("title"),
    firstName: text("first_name"),
    lastName: text("last_name"),

    // Company fields
    /** Company/organisation name (if type is company/trust/etc.) */
    companyName: text("company_name"),
    /** Companies House number (UK) */
    companyNumber: text("company_number"),

    // Contact details
    email: text("email"),
    phone: text("phone"),
    mobile: text("mobile"),

    // Address (UK format)
    addressLine1: text("address_line_1"),
    addressLine2: text("address_line_2"),
    city: text("city"),
    county: text("county"),
    postcode: text("postcode"),
    country: text("country").default("United Kingdom"),

    // KYC/AML
    /** Whether ID verification completed */
    idVerified: boolean("id_verified").default(false),
    idVerifiedAt: timestamp("id_verified_at"),
    /** Source of funds verified */
    sofVerified: boolean("sof_verified").default(false),
    sofVerifiedAt: timestamp("sof_verified_at"),

    /** Flexible metadata for practice-specific fields */
    metadata: jsonb("metadata"),

    /** Free-text notes */
    notes: text("notes"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    uniqueReferencePerFirm: uniqueIndex("clients_firm_reference_unique").on(t.firmId, t.reference),
  })
);

// Type exports
export type Client = typeof clients.$inferSelect;
export type NewClient = typeof clients.$inferInsert;

// TODO: Add when implementing:
// - contacts (related people/contacts for a client)
// - clientRelationships (links between clients)
