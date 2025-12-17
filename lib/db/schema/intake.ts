/**
 * Intake Schema
 *
 * Leads and quotes for new business intake.
 */

import {
  pgTable,
  text,
  timestamp,
  uuid,
  pgEnum,
  integer,
  numeric,
  jsonb,
  index,
  uniqueIndex,
  date,
} from "drizzle-orm/pg-core";
import { firms } from "./firms";
import { users } from "./users";
import { clients } from "./clients";
import { matters } from "./matters";

export const leadStatusEnum = pgEnum("lead_status", [
  "new",
  "contacted",
  "qualified",
  "won",
  "lost",
  "archived",
]);

export const quoteStatusEnum = pgEnum("quote_status", [
  "draft",
  "sent",
  "accepted",
  "rejected",
  "expired",
  "converted",
]);

export const leads = pgTable(
  "leads",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    firmId: uuid("firm_id")
      .notNull()
      .references(() => firms.id, { onDelete: "cascade" }),

    firstName: text("first_name"),
    lastName: text("last_name"),
    companyName: text("company_name"),
    email: text("email"),
    phone: text("phone"),

    source: text("source"),
    status: leadStatusEnum("status").notNull().default("new"),
    score: integer("score"),
    notes: text("notes"),

    convertedToClientId: uuid("converted_to_client_id").references(() => clients.id, {
      onDelete: "set null",
    }),

    createdById: uuid("created_by_id").references(() => users.id, { onDelete: "set null" }),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    firmStatusIdx: index("leads_firm_status_idx").on(t.firmId, t.status),
    firmEmailIdx: index("leads_firm_email_idx").on(t.firmId, t.email),
  })
);

export const quotes = pgTable(
  "quotes",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    firmId: uuid("firm_id")
      .notNull()
      .references(() => firms.id, { onDelete: "cascade" }),

    leadId: uuid("lead_id")
      .notNull()
      .references(() => leads.id, { onDelete: "cascade" }),

    status: quoteStatusEnum("status").notNull().default("draft"),
    items: jsonb("items"),

    subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull().default("0"),
    vatAmount: numeric("vat_amount", { precision: 10, scale: 2 }).notNull().default("0"),
    total: numeric("total", { precision: 10, scale: 2 }).notNull().default("0"),

    validUntil: date("valid_until"),
    notes: text("notes"),

    convertedToMatterId: uuid("converted_to_matter_id").references(() => matters.id, {
      onDelete: "set null",
    }),

    createdById: uuid("created_by_id").references(() => users.id, { onDelete: "set null" }),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    firmLeadIdx: index("quotes_firm_lead_idx").on(t.firmId, t.leadId),
  })
);

export const referralSources = pgTable(
  "referral_sources",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    firmId: uuid("firm_id")
      .notNull()
      .references(() => firms.id, { onDelete: "cascade" }),

    name: text("name").notNull(),
    type: text("type"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    firmNameUnique: uniqueIndex("referral_sources_firm_name_unique").on(t.firmId, t.name),
  })
);

export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;
export type Quote = typeof quotes.$inferSelect;
export type NewQuote = typeof quotes.$inferInsert;
export type ReferralSource = typeof referralSources.$inferSelect;
export type NewReferralSource = typeof referralSources.$inferInsert;
