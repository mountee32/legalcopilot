/**
 * Integration Account factories for creating test integration accounts
 */
import { db } from "@/lib/db";
import {
  emailAccounts,
  calendarAccounts,
  paymentProviderAccounts,
  accountingConnections,
} from "@/lib/db/schema";
import { randomUUID } from "crypto";

// Email Account Factory

export interface EmailAccountFactoryOptions {
  firmId: string;
  userId: string;
  provider?: "google" | "microsoft";
  emailAddress?: string;
  externalAccountId?: string | null;
  scopes?: any;
  tokens?: any;
  webhookSecret?: string;
  status?: "connected" | "revoked" | "error";
  lastSyncAt?: Date | null;
}

export interface TestEmailAccount {
  id: string;
  firmId: string;
  userId: string;
  provider: "google" | "microsoft";
  emailAddress: string;
  externalAccountId: string | null;
  scopes: any;
  tokens: any;
  webhookSecret: string;
  status: "connected" | "revoked" | "error";
  lastSyncAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export async function createEmailAccount(
  options: EmailAccountFactoryOptions
): Promise<TestEmailAccount> {
  const suffix = Date.now().toString(36);

  const accountData = {
    firmId: options.firmId,
    userId: options.userId,
    provider: options.provider ?? "google",
    emailAddress: options.emailAddress ?? `test-${suffix}@example.com`,
    externalAccountId: options.externalAccountId ?? `ext-${randomUUID()}`,
    scopes: options.scopes ?? ["email", "calendar"],
    tokens: options.tokens ?? {
      accessToken: "test-access-token",
      refreshToken: "test-refresh-token",
    },
    webhookSecret: options.webhookSecret ?? randomUUID(),
    status: options.status ?? "connected",
    lastSyncAt: options.lastSyncAt ?? null,
    updatedAt: new Date(),
  };

  const [account] = await db.insert(emailAccounts).values(accountData).returning();

  return {
    id: account.id,
    firmId: account.firmId,
    userId: account.userId,
    provider: account.provider as "google" | "microsoft",
    emailAddress: account.emailAddress,
    externalAccountId: account.externalAccountId,
    scopes: account.scopes,
    tokens: account.tokens,
    webhookSecret: account.webhookSecret,
    status: account.status as "connected" | "revoked" | "error",
    lastSyncAt: account.lastSyncAt,
    createdAt: account.createdAt,
    updatedAt: account.updatedAt,
  };
}

// Calendar Account Factory

export interface CalendarAccountFactoryOptions {
  firmId: string;
  userId: string;
  provider?: "google" | "microsoft";
  externalAccountId?: string | null;
  scopes?: any;
  tokens?: any;
  webhookSecret?: string;
  status?: "connected" | "revoked" | "error";
  syncDirection?: "push" | "pull" | "both";
  lastSyncAt?: Date | null;
}

export interface TestCalendarAccount {
  id: string;
  firmId: string;
  userId: string;
  provider: "google" | "microsoft";
  externalAccountId: string | null;
  scopes: any;
  tokens: any;
  webhookSecret: string;
  status: "connected" | "revoked" | "error";
  syncDirection: "push" | "pull" | "both";
  lastSyncAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export async function createCalendarAccount(
  options: CalendarAccountFactoryOptions
): Promise<TestCalendarAccount> {
  const accountData = {
    firmId: options.firmId,
    userId: options.userId,
    provider: options.provider ?? "google",
    externalAccountId: options.externalAccountId ?? `ext-${randomUUID()}`,
    scopes: options.scopes ?? ["calendar"],
    tokens: options.tokens ?? {
      accessToken: "test-access-token",
      refreshToken: "test-refresh-token",
    },
    webhookSecret: options.webhookSecret ?? randomUUID(),
    status: options.status ?? "connected",
    syncDirection: options.syncDirection ?? "push",
    lastSyncAt: options.lastSyncAt ?? null,
    updatedAt: new Date(),
  };

  const [account] = await db.insert(calendarAccounts).values(accountData).returning();

  return {
    id: account.id,
    firmId: account.firmId,
    userId: account.userId,
    provider: account.provider as "google" | "microsoft",
    externalAccountId: account.externalAccountId,
    scopes: account.scopes,
    tokens: account.tokens,
    webhookSecret: account.webhookSecret,
    status: account.status as "connected" | "revoked" | "error",
    syncDirection: account.syncDirection as "push" | "pull" | "both",
    lastSyncAt: account.lastSyncAt,
    createdAt: account.createdAt,
    updatedAt: account.updatedAt,
  };
}

// Payment Provider Account Factory

export interface PaymentAccountFactoryOptions {
  firmId: string;
  provider?: "stripe" | "gocardless";
  externalAccountId?: string | null;
  webhookSecret?: string;
  config?: any;
  status?: "connected" | "revoked" | "error";
}

export interface TestPaymentAccount {
  id: string;
  firmId: string;
  provider: "stripe" | "gocardless";
  externalAccountId: string | null;
  webhookSecret: string;
  config: any;
  status: "connected" | "revoked" | "error";
  createdAt: Date;
  updatedAt: Date;
}

export async function createPaymentAccount(
  options: PaymentAccountFactoryOptions
): Promise<TestPaymentAccount> {
  const accountData = {
    firmId: options.firmId,
    provider: options.provider ?? "stripe",
    externalAccountId: options.externalAccountId ?? `ext-${randomUUID()}`,
    webhookSecret: options.webhookSecret ?? randomUUID(),
    config: options.config ?? { apiKey: "test-api-key" },
    status: options.status ?? "connected",
    updatedAt: new Date(),
  };

  const [account] = await db.insert(paymentProviderAccounts).values(accountData).returning();

  return {
    id: account.id,
    firmId: account.firmId,
    provider: account.provider as "stripe" | "gocardless",
    externalAccountId: account.externalAccountId,
    webhookSecret: account.webhookSecret,
    config: account.config,
    status: account.status as "connected" | "revoked" | "error",
    createdAt: account.createdAt,
    updatedAt: account.updatedAt,
  };
}

// Accounting Connection Factory

export interface AccountingConnectionFactoryOptions {
  firmId: string;
  provider?: "xero" | "quickbooks";
  externalTenantId?: string | null;
  tokens?: any;
  webhookSecret?: string;
  status?: "connected" | "revoked" | "error";
  lastSyncAt?: Date | null;
}

export interface TestAccountingConnection {
  id: string;
  firmId: string;
  provider: "xero" | "quickbooks";
  externalTenantId: string | null;
  tokens: any;
  webhookSecret: string;
  status: "connected" | "revoked" | "error";
  lastSyncAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export async function createAccountingConnection(
  options: AccountingConnectionFactoryOptions
): Promise<TestAccountingConnection> {
  const connectionData = {
    firmId: options.firmId,
    provider: options.provider ?? "xero",
    externalTenantId: options.externalTenantId ?? `tenant-${randomUUID()}`,
    tokens: options.tokens ?? {
      accessToken: "test-access-token",
      refreshToken: "test-refresh-token",
    },
    webhookSecret: options.webhookSecret ?? randomUUID(),
    status: options.status ?? "connected",
    lastSyncAt: options.lastSyncAt ?? null,
    updatedAt: new Date(),
  };

  const [connection] = await db.insert(accountingConnections).values(connectionData).returning();

  return {
    id: connection.id,
    firmId: connection.firmId,
    provider: connection.provider as "xero" | "quickbooks",
    externalTenantId: connection.externalTenantId,
    tokens: connection.tokens,
    webhookSecret: connection.webhookSecret,
    status: connection.status as "connected" | "revoked" | "error",
    lastSyncAt: connection.lastSyncAt,
    createdAt: connection.createdAt,
    updatedAt: connection.updatedAt,
  };
}
