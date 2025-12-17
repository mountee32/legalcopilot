/**
 * Billing Schema
 *
 * Time entries, invoices, and payments.
 * Supports hourly, fixed fee, and other billing arrangements.
 *
 * @see docs/backend-design.md Section 2.10-2.12 for billing specification
 */

import {
  pgTable,
  text,
  timestamp,
  uuid,
  pgEnum,
  numeric,
  integer,
  date,
  jsonb,
} from "drizzle-orm/pg-core";
import { matters } from "./matters";
import { clients } from "./clients";
import { users } from "./users";

/**
 * Time entry billing status.
 */
export const timeEntryStatusEnum = pgEnum("time_entry_status", [
  "draft", // Not yet submitted
  "submitted", // Submitted for review
  "approved", // Approved for billing
  "billed", // Included on invoice
  "written_off", // Not to be billed
]);

/**
 * Invoice status lifecycle.
 */
export const invoiceStatusEnum = pgEnum("invoice_status", [
  "draft", // Being prepared
  "sent", // Sent to client
  "viewed", // Client has viewed
  "partially_paid", // Partial payment received
  "paid", // Fully paid
  "overdue", // Payment overdue
  "written_off", // Uncollectable
]);

/**
 * Payment method types.
 */
export const paymentMethodEnum = pgEnum("payment_method", [
  "bank_transfer", // BACS/Faster Payments
  "card", // Credit/debit card
  "cheque", // Cheque payment
  "cash", // Cash (rare)
  "client_account", // From client account balance
]);

/**
 * Time entries (billable hours).
 */
export const timeEntries = pgTable("time_entries", {
  id: uuid("id").primaryKey().defaultRandom(),

  /** Matter this time relates to */
  matterId: uuid("matter_id")
    .notNull()
    .references(() => matters.id),

  /** Fee earner who did the work */
  feeEarnerId: uuid("fee_earner_id")
    .notNull()
    .references(() => users.id),

  /** Date work was performed */
  workDate: date("work_date").notNull(),

  /** Description of work done */
  description: text("description").notNull(),

  /** Time in minutes (6-minute units = 0.1 hours) */
  durationMinutes: integer("duration_minutes").notNull(),

  /** Hourly rate at time of entry */
  hourlyRate: numeric("hourly_rate", { precision: 10, scale: 2 }).notNull(),

  /** Calculated amount (duration * rate) */
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),

  status: timeEntryStatusEnum("status").notNull().default("draft"),

  /** Invoice this entry is on (when billed) */
  invoiceId: uuid("invoice_id"),

  /** Activity code (for reporting) */
  activityCode: text("activity_code"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * Invoices sent to clients.
 */
export const invoices = pgTable("invoices", {
  id: uuid("id").primaryKey().defaultRandom(),

  /** Invoice number e.g. "INV-2024-0001" */
  invoiceNumber: text("invoice_number").notNull().unique(),

  /** Client being billed */
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id),

  /** Matter(s) this invoice relates to (may span multiple) */
  matterId: uuid("matter_id").references(() => matters.id),

  status: invoiceStatusEnum("status").notNull().default("draft"),

  /** Invoice date */
  invoiceDate: date("invoice_date").notNull(),

  /** Payment due date */
  dueDate: date("due_date").notNull(),

  /** Subtotal before VAT */
  subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull(),

  /** VAT amount (UK standard 20%) */
  vatAmount: numeric("vat_amount", { precision: 10, scale: 2 }).notNull(),

  /** Total including VAT */
  total: numeric("total", { precision: 10, scale: 2 }).notNull(),

  /** Amount paid so far */
  paidAmount: numeric("paid_amount", { precision: 10, scale: 2 }).default("0"),

  /** Outstanding balance */
  balanceDue: numeric("balance_due", { precision: 10, scale: 2 }).notNull(),

  /** Payment terms text */
  terms: text("terms"),

  /** Additional notes on invoice */
  notes: text("notes"),

  /** When invoice was sent */
  sentAt: timestamp("sent_at"),

  /** When first viewed by client */
  viewedAt: timestamp("viewed_at"),

  /** When fully paid */
  paidAt: timestamp("paid_at"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * Payment records.
 */
export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),

  /** Invoice this payment is for */
  invoiceId: uuid("invoice_id")
    .notNull()
    .references(() => invoices.id),

  /** Payment amount */
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),

  method: paymentMethodEnum("method").notNull(),

  /** Date payment was received */
  paymentDate: date("payment_date").notNull(),

  /** Bank reference or transaction ID */
  reference: text("reference"),

  /** Additional notes */
  notes: text("notes"),

  /** User who recorded the payment */
  recordedBy: uuid("recorded_by").references(() => users.id),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Type exports
export type TimeEntry = typeof timeEntries.$inferSelect;
export type NewTimeEntry = typeof timeEntries.$inferInsert;
export type Invoice = typeof invoices.$inferSelect;
export type NewInvoice = typeof invoices.$inferInsert;
export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;

// TODO: Add when implementing:
// - disbursements (expenses to be recharged)
// - clientAccount (client money holding)
// - writeOffs (written off amounts)
