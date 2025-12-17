/**
 * Integrations Schema
 *
 * Stores provider connection state (OAuth credentials, webhook idempotency, etc.)
 * for email/calendar/payment/accounting/e-signature integrations.
 *
 * Keep schemas minimal and provider-agnostic; move provider-specific payloads into JSONB.
 */

import {
  boolean,
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { documents } from "./documents";
import { firms } from "./firms";
import { users } from "./users";

export const integrationConnectionStatusEnum = pgEnum("integration_connection_status", [
  "connected",
  "revoked",
  "error",
]);

export const emailProviderEnum = pgEnum("email_provider", ["google", "microsoft"]);

export const emailAccounts = pgTable(
  "email_accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    firmId: uuid("firm_id")
      .notNull()
      .references(() => firms.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    provider: emailProviderEnum("provider").notNull(),
    emailAddress: text("email_address").notNull(),
    externalAccountId: text("external_account_id"),
    scopes: jsonb("scopes"),
    tokens: jsonb("tokens"),
    webhookSecret: text("webhook_secret").notNull(),
    status: integrationConnectionStatusEnum("status").notNull().default("connected"),
    lastSyncAt: timestamp("last_sync_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    firmUserIdx: index("email_accounts_firm_user_idx").on(t.firmId, t.userId),
    firmProviderIdx: index("email_accounts_firm_provider_idx").on(t.firmId, t.provider),
    uniqueProviderExternalPerFirm: uniqueIndex("email_accounts_firm_provider_external_unique").on(
      t.firmId,
      t.provider,
      t.externalAccountId
    ),
  })
);

export const emailProviderEvents = pgTable(
  "email_provider_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    firmId: uuid("firm_id")
      .notNull()
      .references(() => firms.id, { onDelete: "cascade" }),
    accountId: uuid("account_id")
      .notNull()
      .references(() => emailAccounts.id, { onDelete: "cascade" }),
    provider: emailProviderEnum("provider").notNull(),
    externalEventId: text("external_event_id").notNull(),
    payload: jsonb("payload"),
    receivedAt: timestamp("received_at").defaultNow().notNull(),
    processedAt: timestamp("processed_at"),
    processedOk: boolean("processed_ok").notNull().default(false),
    error: text("error"),
  },
  (t) => ({
    accountIdx: index("email_provider_events_account_idx").on(t.accountId, t.receivedAt),
    idempotencyUnique: uniqueIndex("email_provider_events_firm_provider_external_unique").on(
      t.firmId,
      t.provider,
      t.externalEventId
    ),
  })
);

export const calendarProviderEnum = pgEnum("calendar_provider", ["google", "microsoft"]);
export const syncDirectionEnum = pgEnum("sync_direction", ["push", "pull", "both"]);

export const calendarAccounts = pgTable(
  "calendar_accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    firmId: uuid("firm_id")
      .notNull()
      .references(() => firms.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    provider: calendarProviderEnum("provider").notNull(),
    externalAccountId: text("external_account_id"),
    scopes: jsonb("scopes"),
    tokens: jsonb("tokens"),
    webhookSecret: text("webhook_secret").notNull(),
    status: integrationConnectionStatusEnum("status").notNull().default("connected"),
    syncDirection: syncDirectionEnum("sync_direction").notNull().default("push"),
    lastSyncAt: timestamp("last_sync_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    firmUserIdx: index("calendar_accounts_firm_user_idx").on(t.firmId, t.userId),
    firmProviderIdx: index("calendar_accounts_firm_provider_idx").on(t.firmId, t.provider),
    uniqueProviderExternalPerFirm: uniqueIndex(
      "calendar_accounts_firm_provider_external_unique"
    ).on(t.firmId, t.provider, t.externalAccountId),
  })
);

export const calendarProviderEvents = pgTable(
  "calendar_provider_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    firmId: uuid("firm_id")
      .notNull()
      .references(() => firms.id, { onDelete: "cascade" }),
    accountId: uuid("account_id")
      .notNull()
      .references(() => calendarAccounts.id, { onDelete: "cascade" }),
    provider: calendarProviderEnum("provider").notNull(),
    externalEventId: text("external_event_id").notNull(),
    payload: jsonb("payload"),
    receivedAt: timestamp("received_at").defaultNow().notNull(),
    processedAt: timestamp("processed_at"),
    processedOk: boolean("processed_ok").notNull().default(false),
    error: text("error"),
  },
  (t) => ({
    accountIdx: index("calendar_provider_events_account_idx").on(t.accountId, t.receivedAt),
    idempotencyUnique: uniqueIndex("calendar_provider_events_firm_provider_external_unique").on(
      t.firmId,
      t.provider,
      t.externalEventId
    ),
  })
);

export const paymentProviderEnum = pgEnum("payment_provider", ["stripe", "gocardless"]);

export const paymentProviderAccounts = pgTable(
  "payment_provider_accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    firmId: uuid("firm_id")
      .notNull()
      .references(() => firms.id, { onDelete: "cascade" }),
    provider: paymentProviderEnum("provider").notNull(),
    webhookSecret: text("webhook_secret").notNull(),
    config: jsonb("config"),
    externalAccountId: text("external_account_id"),
    status: integrationConnectionStatusEnum("status").notNull().default("connected"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    firmProviderIdx: index("payment_provider_accounts_firm_provider_idx").on(t.firmId, t.provider),
  })
);

export const paymentProviderEvents = pgTable(
  "payment_provider_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    firmId: uuid("firm_id")
      .notNull()
      .references(() => firms.id, { onDelete: "cascade" }),
    accountId: uuid("account_id")
      .notNull()
      .references(() => paymentProviderAccounts.id, { onDelete: "cascade" }),
    provider: paymentProviderEnum("provider").notNull(),
    externalEventId: text("external_event_id").notNull(),
    eventType: text("event_type"),
    payload: jsonb("payload"),
    receivedAt: timestamp("received_at").defaultNow().notNull(),
    processedAt: timestamp("processed_at"),
    processedOk: boolean("processed_ok").notNull().default(false),
    error: text("error"),
  },
  (t) => ({
    accountIdx: index("payment_provider_events_account_idx").on(t.accountId, t.receivedAt),
    idempotencyUnique: uniqueIndex("payment_provider_events_firm_provider_external_unique").on(
      t.firmId,
      t.provider,
      t.externalEventId
    ),
  })
);

export const accountingProviderEnum = pgEnum("accounting_provider", ["xero", "quickbooks"]);

export const accountingConnections = pgTable(
  "accounting_connections",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    firmId: uuid("firm_id")
      .notNull()
      .references(() => firms.id, { onDelete: "cascade" }),
    provider: accountingProviderEnum("provider").notNull(),
    tokens: jsonb("tokens"),
    externalTenantId: text("external_tenant_id"),
    webhookSecret: text("webhook_secret").notNull(),
    status: integrationConnectionStatusEnum("status").notNull().default("connected"),
    lastSyncAt: timestamp("last_sync_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    firmProviderIdx: index("accounting_connections_firm_provider_idx").on(t.firmId, t.provider),
    uniqueProviderTenant: uniqueIndex("accounting_connections_firm_provider_tenant_unique").on(
      t.firmId,
      t.provider,
      t.externalTenantId
    ),
  })
);

export const accountingSyncEvents = pgTable(
  "accounting_sync_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    firmId: uuid("firm_id")
      .notNull()
      .references(() => firms.id, { onDelete: "cascade" }),
    provider: accountingProviderEnum("provider").notNull(),
    entityType: text("entity_type").notNull(), // "invoice" | "payment" | "contact"
    entityId: uuid("entity_id"),
    externalId: text("external_id"),
    status: text("status").notNull().default("pending"),
    error: text("error"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    firmProviderIdx: index("accounting_sync_events_firm_provider_idx").on(t.firmId, t.provider),
    entityIdx: index("accounting_sync_events_entity_idx").on(t.entityType, t.entityId),
  })
);

export const esignatureProviderEnum = pgEnum("esignature_provider", ["docusign", "adobe_sign"]);
export const signatureRequestStatusEnum = pgEnum("signature_request_status", [
  "draft",
  "pending_approval",
  "sent",
  "delivered",
  "completed",
  "declined",
  "voided",
  "failed",
]);

export const signatureRequests = pgTable(
  "signature_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    firmId: uuid("firm_id")
      .notNull()
      .references(() => firms.id, { onDelete: "cascade" }),
    documentId: uuid("document_id")
      .notNull()
      .references(() => documents.id, { onDelete: "cascade" }),
    provider: esignatureProviderEnum("provider").notNull(),
    externalId: text("external_id"),
    status: signatureRequestStatusEnum("status").notNull().default("draft"),
    signers: jsonb("signers"),
    sentAt: timestamp("sent_at"),
    completedAt: timestamp("completed_at"),
    signedDocumentId: uuid("signed_document_id").references(() => documents.id, {
      onDelete: "set null",
    }),
    createdById: uuid("created_by_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    firmDocumentIdx: index("signature_requests_firm_document_idx").on(t.firmId, t.documentId),
    firmProviderIdx: index("signature_requests_firm_provider_idx").on(t.firmId, t.provider),
  })
);

export const esignatureProviderEvents = pgTable(
  "esignature_provider_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    firmId: uuid("firm_id")
      .notNull()
      .references(() => firms.id, { onDelete: "cascade" }),
    requestId: uuid("request_id")
      .notNull()
      .references(() => signatureRequests.id, { onDelete: "cascade" }),
    provider: esignatureProviderEnum("provider").notNull(),
    externalEventId: text("external_event_id").notNull(),
    payload: jsonb("payload"),
    receivedAt: timestamp("received_at").defaultNow().notNull(),
    processedAt: timestamp("processed_at"),
    processedOk: boolean("processed_ok").notNull().default(false),
    error: text("error"),
  },
  (t) => ({
    requestIdx: index("esignature_provider_events_request_idx").on(t.requestId, t.receivedAt),
    idempotencyUnique: uniqueIndex("esignature_provider_events_firm_provider_external_unique").on(
      t.firmId,
      t.provider,
      t.externalEventId
    ),
  })
);

export type EmailAccount = typeof emailAccounts.$inferSelect;
export type NewEmailAccount = typeof emailAccounts.$inferInsert;
export type CalendarAccount = typeof calendarAccounts.$inferSelect;
export type NewCalendarAccount = typeof calendarAccounts.$inferInsert;
export type PaymentProviderAccount = typeof paymentProviderAccounts.$inferSelect;
export type NewPaymentProviderAccount = typeof paymentProviderAccounts.$inferInsert;
export type AccountingConnection = typeof accountingConnections.$inferSelect;
export type NewAccountingConnection = typeof accountingConnections.$inferInsert;
export type SignatureRequest = typeof signatureRequests.$inferSelect;
export type NewSignatureRequest = typeof signatureRequests.$inferInsert;
