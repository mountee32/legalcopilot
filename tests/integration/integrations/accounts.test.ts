/**
 * Integration Accounts Integration Tests
 *
 * Tests integration account CRUD operations against the real database.
 * Covers email accounts, calendar accounts, payment accounts, and accounting connections.
 */
import { describe, it, expect } from "vitest";
import { db } from "@/lib/db";
import {
  emailAccounts,
  calendarAccounts,
  paymentProviderAccounts,
  accountingConnections,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { setupIntegrationSuite, setupFreshFirmPerTest } from "@tests/integration/setup";
import {
  createEmailAccount,
  createCalendarAccount,
  createPaymentAccount,
  createAccountingConnection,
} from "@tests/fixtures/factories/integration-accounts";
import { createUser } from "@tests/fixtures/factories/user";
import { createFirm } from "@tests/fixtures/factories/firm";

describe("Email Accounts Integration - CRUD", () => {
  const ctx = setupIntegrationSuite();

  describe("Create", () => {
    it("creates an email account with required fields", async () => {
      const user = await createUser({ firmId: ctx.firmId });

      const account = await createEmailAccount({
        firmId: ctx.firmId,
        userId: user.id,
        provider: "google",
        emailAddress: "test@example.com",
      });

      expect(account.id).toBeDefined();
      expect(account.firmId).toBe(ctx.firmId);
      expect(account.userId).toBe(user.id);
      expect(account.provider).toBe("google");
      expect(account.emailAddress).toBe("test@example.com");
      expect(account.status).toBe("connected");
      expect(account.webhookSecret).toBeDefined();
    });

    it("creates a microsoft email account", async () => {
      const user = await createUser({ firmId: ctx.firmId });

      const account = await createEmailAccount({
        firmId: ctx.firmId,
        userId: user.id,
        provider: "microsoft",
        emailAddress: "outlook@example.com",
      });

      expect(account.provider).toBe("microsoft");
      expect(account.emailAddress).toBe("outlook@example.com");
    });

    it("persists email account data to database", async () => {
      const user = await createUser({ firmId: ctx.firmId });

      const account = await createEmailAccount({
        firmId: ctx.firmId,
        userId: user.id,
        emailAddress: "persist@example.com",
        externalAccountId: "ext-123",
      });

      const [dbAccount] = await db
        .select()
        .from(emailAccounts)
        .where(eq(emailAccounts.id, account.id));

      expect(dbAccount).toBeDefined();
      expect(dbAccount.emailAddress).toBe("persist@example.com");
      expect(dbAccount.externalAccountId).toBe("ext-123");
    });
  });

  describe("Read", () => {
    it("retrieves email account by ID", async () => {
      const user = await createUser({ firmId: ctx.firmId });
      const created = await createEmailAccount({
        firmId: ctx.firmId,
        userId: user.id,
        emailAddress: "retrieve@example.com",
      });

      const [retrieved] = await db
        .select()
        .from(emailAccounts)
        .where(eq(emailAccounts.id, created.id));

      expect(retrieved).toBeDefined();
      expect(retrieved.id).toBe(created.id);
      expect(retrieved.emailAddress).toBe("retrieve@example.com");
    });

    it("lists email accounts for a firm", async () => {
      const user = await createUser({ firmId: ctx.firmId });

      await createEmailAccount({ firmId: ctx.firmId, userId: user.id });
      await createEmailAccount({ firmId: ctx.firmId, userId: user.id });
      await createEmailAccount({ firmId: ctx.firmId, userId: user.id });

      const firmAccounts = await db
        .select()
        .from(emailAccounts)
        .where(eq(emailAccounts.firmId, ctx.firmId));

      expect(firmAccounts.length).toBeGreaterThanOrEqual(3);
    });

    it("filters by provider", async () => {
      const user = await createUser({ firmId: ctx.firmId });

      await createEmailAccount({ firmId: ctx.firmId, userId: user.id, provider: "google" });
      await createEmailAccount({ firmId: ctx.firmId, userId: user.id, provider: "microsoft" });

      const googleAccounts = await db
        .select()
        .from(emailAccounts)
        .where(and(eq(emailAccounts.firmId, ctx.firmId), eq(emailAccounts.provider, "google")));

      const microsoftAccounts = await db
        .select()
        .from(emailAccounts)
        .where(and(eq(emailAccounts.firmId, ctx.firmId), eq(emailAccounts.provider, "microsoft")));

      expect(googleAccounts.length).toBeGreaterThanOrEqual(1);
      expect(microsoftAccounts.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Update", () => {
    it("updates email account status", async () => {
      const user = await createUser({ firmId: ctx.firmId });
      const account = await createEmailAccount({
        firmId: ctx.firmId,
        userId: user.id,
        status: "connected",
      });

      await db
        .update(emailAccounts)
        .set({ status: "error", updatedAt: new Date() })
        .where(eq(emailAccounts.id, account.id));

      const [updated] = await db
        .select()
        .from(emailAccounts)
        .where(eq(emailAccounts.id, account.id));

      expect(updated.status).toBe("error");
    });

    it("revokes email account (soft delete)", async () => {
      const user = await createUser({ firmId: ctx.firmId });
      const account = await createEmailAccount({
        firmId: ctx.firmId,
        userId: user.id,
        status: "connected",
      });

      await db
        .update(emailAccounts)
        .set({ status: "revoked", tokens: null, updatedAt: new Date() })
        .where(eq(emailAccounts.id, account.id));

      const [revoked] = await db
        .select()
        .from(emailAccounts)
        .where(eq(emailAccounts.id, account.id));

      expect(revoked.status).toBe("revoked");
      expect(revoked.tokens).toBeNull();
    });
  });
});

describe("Calendar Accounts Integration - CRUD", () => {
  const ctx = setupIntegrationSuite();

  describe("Create", () => {
    it("creates a calendar account with required fields", async () => {
      const user = await createUser({ firmId: ctx.firmId });

      const account = await createCalendarAccount({
        firmId: ctx.firmId,
        userId: user.id,
        provider: "google",
      });

      expect(account.id).toBeDefined();
      expect(account.firmId).toBe(ctx.firmId);
      expect(account.userId).toBe(user.id);
      expect(account.provider).toBe("google");
      expect(account.status).toBe("connected");
      expect(account.syncDirection).toBe("push");
      expect(account.webhookSecret).toBeDefined();
    });

    it("creates a calendar account with custom sync direction", async () => {
      const user = await createUser({ firmId: ctx.firmId });

      const account = await createCalendarAccount({
        firmId: ctx.firmId,
        userId: user.id,
        syncDirection: "both",
      });

      expect(account.syncDirection).toBe("both");
    });

    it("persists calendar account data to database", async () => {
      const user = await createUser({ firmId: ctx.firmId });

      const account = await createCalendarAccount({
        firmId: ctx.firmId,
        userId: user.id,
        externalAccountId: "cal-ext-123",
      });

      const [dbAccount] = await db
        .select()
        .from(calendarAccounts)
        .where(eq(calendarAccounts.id, account.id));

      expect(dbAccount).toBeDefined();
      expect(dbAccount.externalAccountId).toBe("cal-ext-123");
    });
  });

  describe("Read", () => {
    it("retrieves calendar account by ID", async () => {
      const user = await createUser({ firmId: ctx.firmId });
      const created = await createCalendarAccount({
        firmId: ctx.firmId,
        userId: user.id,
      });

      const [retrieved] = await db
        .select()
        .from(calendarAccounts)
        .where(eq(calendarAccounts.id, created.id));

      expect(retrieved).toBeDefined();
      expect(retrieved.id).toBe(created.id);
    });

    it("lists calendar accounts for a firm", async () => {
      const user = await createUser({ firmId: ctx.firmId });

      await createCalendarAccount({ firmId: ctx.firmId, userId: user.id });
      await createCalendarAccount({ firmId: ctx.firmId, userId: user.id });

      const firmAccounts = await db
        .select()
        .from(calendarAccounts)
        .where(eq(calendarAccounts.firmId, ctx.firmId));

      expect(firmAccounts.length).toBeGreaterThanOrEqual(2);
    });

    it("filters by sync direction", async () => {
      const user = await createUser({ firmId: ctx.firmId });

      await createCalendarAccount({
        firmId: ctx.firmId,
        userId: user.id,
        syncDirection: "push",
      });
      await createCalendarAccount({
        firmId: ctx.firmId,
        userId: user.id,
        syncDirection: "pull",
      });

      const pushAccounts = await db
        .select()
        .from(calendarAccounts)
        .where(
          and(eq(calendarAccounts.firmId, ctx.firmId), eq(calendarAccounts.syncDirection, "push"))
        );

      expect(pushAccounts.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Update", () => {
    it("updates calendar account sync direction", async () => {
      const user = await createUser({ firmId: ctx.firmId });
      const account = await createCalendarAccount({
        firmId: ctx.firmId,
        userId: user.id,
        syncDirection: "push",
      });

      await db
        .update(calendarAccounts)
        .set({ syncDirection: "both", updatedAt: new Date() })
        .where(eq(calendarAccounts.id, account.id));

      const [updated] = await db
        .select()
        .from(calendarAccounts)
        .where(eq(calendarAccounts.id, account.id));

      expect(updated.syncDirection).toBe("both");
    });

    it("revokes calendar account (soft delete)", async () => {
      const user = await createUser({ firmId: ctx.firmId });
      const account = await createCalendarAccount({
        firmId: ctx.firmId,
        userId: user.id,
      });

      await db
        .update(calendarAccounts)
        .set({ status: "revoked", tokens: null, updatedAt: new Date() })
        .where(eq(calendarAccounts.id, account.id));

      const [revoked] = await db
        .select()
        .from(calendarAccounts)
        .where(eq(calendarAccounts.id, account.id));

      expect(revoked.status).toBe("revoked");
      expect(revoked.tokens).toBeNull();
    });
  });
});

describe("Payment Provider Accounts Integration - CRUD", () => {
  const ctx = setupIntegrationSuite();

  describe("Create", () => {
    it("creates a payment account with required fields", async () => {
      const account = await createPaymentAccount({
        firmId: ctx.firmId,
        provider: "stripe",
      });

      expect(account.id).toBeDefined();
      expect(account.firmId).toBe(ctx.firmId);
      expect(account.provider).toBe("stripe");
      expect(account.status).toBe("connected");
      expect(account.webhookSecret).toBeDefined();
    });

    it("creates a gocardless payment account", async () => {
      const account = await createPaymentAccount({
        firmId: ctx.firmId,
        provider: "gocardless",
      });

      expect(account.provider).toBe("gocardless");
    });

    it("persists payment account data to database", async () => {
      const account = await createPaymentAccount({
        firmId: ctx.firmId,
        externalAccountId: "acct_123",
        config: { apiKey: "sk_test_123" },
      });

      const [dbAccount] = await db
        .select()
        .from(paymentProviderAccounts)
        .where(eq(paymentProviderAccounts.id, account.id));

      expect(dbAccount).toBeDefined();
      expect(dbAccount.externalAccountId).toBe("acct_123");
      expect(dbAccount.config).toMatchObject({ apiKey: "sk_test_123" });
    });
  });

  describe("Read", () => {
    it("retrieves payment account by ID", async () => {
      const created = await createPaymentAccount({
        firmId: ctx.firmId,
      });

      const [retrieved] = await db
        .select()
        .from(paymentProviderAccounts)
        .where(eq(paymentProviderAccounts.id, created.id));

      expect(retrieved).toBeDefined();
      expect(retrieved.id).toBe(created.id);
    });

    it("lists payment accounts for a firm", async () => {
      await createPaymentAccount({ firmId: ctx.firmId, provider: "stripe" });
      await createPaymentAccount({ firmId: ctx.firmId, provider: "gocardless" });

      const firmAccounts = await db
        .select()
        .from(paymentProviderAccounts)
        .where(eq(paymentProviderAccounts.firmId, ctx.firmId));

      expect(firmAccounts.length).toBeGreaterThanOrEqual(2);
    });

    it("filters by provider", async () => {
      await createPaymentAccount({ firmId: ctx.firmId, provider: "stripe" });

      const stripeAccounts = await db
        .select()
        .from(paymentProviderAccounts)
        .where(
          and(
            eq(paymentProviderAccounts.firmId, ctx.firmId),
            eq(paymentProviderAccounts.provider, "stripe")
          )
        );

      expect(stripeAccounts.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Update", () => {
    it("updates payment account status", async () => {
      const account = await createPaymentAccount({
        firmId: ctx.firmId,
        status: "connected",
      });

      await db
        .update(paymentProviderAccounts)
        .set({ status: "error", updatedAt: new Date() })
        .where(eq(paymentProviderAccounts.id, account.id));

      const [updated] = await db
        .select()
        .from(paymentProviderAccounts)
        .where(eq(paymentProviderAccounts.id, account.id));

      expect(updated.status).toBe("error");
    });

    it("revokes payment account (soft delete)", async () => {
      const account = await createPaymentAccount({
        firmId: ctx.firmId,
      });

      await db
        .update(paymentProviderAccounts)
        .set({ status: "revoked", updatedAt: new Date() })
        .where(eq(paymentProviderAccounts.id, account.id));

      const [revoked] = await db
        .select()
        .from(paymentProviderAccounts)
        .where(eq(paymentProviderAccounts.id, account.id));

      expect(revoked.status).toBe("revoked");
    });
  });
});

describe("Accounting Connections Integration - CRUD", () => {
  const ctx = setupIntegrationSuite();

  describe("Create", () => {
    it("creates an accounting connection with required fields", async () => {
      const connection = await createAccountingConnection({
        firmId: ctx.firmId,
        provider: "xero",
      });

      expect(connection.id).toBeDefined();
      expect(connection.firmId).toBe(ctx.firmId);
      expect(connection.provider).toBe("xero");
      expect(connection.status).toBe("connected");
      expect(connection.webhookSecret).toBeDefined();
    });

    it("creates a quickbooks accounting connection", async () => {
      const connection = await createAccountingConnection({
        firmId: ctx.firmId,
        provider: "quickbooks",
      });

      expect(connection.provider).toBe("quickbooks");
    });

    it("persists accounting connection data to database", async () => {
      const connection = await createAccountingConnection({
        firmId: ctx.firmId,
        externalTenantId: "tenant-abc-123",
      });

      const [dbConnection] = await db
        .select()
        .from(accountingConnections)
        .where(eq(accountingConnections.id, connection.id));

      expect(dbConnection).toBeDefined();
      expect(dbConnection.externalTenantId).toBe("tenant-abc-123");
    });
  });

  describe("Read", () => {
    it("retrieves accounting connection by ID", async () => {
      const created = await createAccountingConnection({
        firmId: ctx.firmId,
      });

      const [retrieved] = await db
        .select()
        .from(accountingConnections)
        .where(eq(accountingConnections.id, created.id));

      expect(retrieved).toBeDefined();
      expect(retrieved.id).toBe(created.id);
    });

    it("lists accounting connections for a firm", async () => {
      await createAccountingConnection({ firmId: ctx.firmId, provider: "xero" });
      await createAccountingConnection({ firmId: ctx.firmId, provider: "quickbooks" });

      const firmConnections = await db
        .select()
        .from(accountingConnections)
        .where(eq(accountingConnections.firmId, ctx.firmId));

      expect(firmConnections.length).toBeGreaterThanOrEqual(2);
    });

    it("filters by provider", async () => {
      await createAccountingConnection({ firmId: ctx.firmId, provider: "xero" });

      const xeroConnections = await db
        .select()
        .from(accountingConnections)
        .where(
          and(
            eq(accountingConnections.firmId, ctx.firmId),
            eq(accountingConnections.provider, "xero")
          )
        );

      expect(xeroConnections.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Update", () => {
    it("updates accounting connection status", async () => {
      const connection = await createAccountingConnection({
        firmId: ctx.firmId,
        status: "connected",
      });

      await db
        .update(accountingConnections)
        .set({ status: "error", updatedAt: new Date() })
        .where(eq(accountingConnections.id, connection.id));

      const [updated] = await db
        .select()
        .from(accountingConnections)
        .where(eq(accountingConnections.id, connection.id));

      expect(updated.status).toBe("error");
    });

    it("revokes accounting connection (soft delete)", async () => {
      const connection = await createAccountingConnection({
        firmId: ctx.firmId,
      });

      await db
        .update(accountingConnections)
        .set({ status: "revoked", tokens: null, updatedAt: new Date() })
        .where(eq(accountingConnections.id, connection.id));

      const [revoked] = await db
        .select()
        .from(accountingConnections)
        .where(eq(accountingConnections.id, connection.id));

      expect(revoked.status).toBe("revoked");
      expect(revoked.tokens).toBeNull();
    });
  });
});

describe("Integration Accounts - Multi-Tenancy", () => {
  const ctx = setupFreshFirmPerTest();

  it("isolates email accounts between firms", async () => {
    const user1 = await createUser({ firmId: ctx.firmId });
    const account1 = await createEmailAccount({
      firmId: ctx.firmId,
      userId: user1.id,
    });

    // Create second firm
    const firm2 = await createFirm({ name: "Second Test Firm" });
    const user2 = await createUser({ firmId: firm2.id });
    const account2 = await createEmailAccount({
      firmId: firm2.id,
      userId: user2.id,
    });

    // Query accounts for first firm
    const firm1Accounts = await db
      .select()
      .from(emailAccounts)
      .where(eq(emailAccounts.firmId, ctx.firmId));

    // Query accounts for second firm
    const firm2Accounts = await db
      .select()
      .from(emailAccounts)
      .where(eq(emailAccounts.firmId, firm2.id));

    // Each firm should only see their own accounts
    expect(firm1Accounts.some((a) => a.id === account1.id)).toBe(true);
    expect(firm1Accounts.some((a) => a.id === account2.id)).toBe(false);

    expect(firm2Accounts.some((a) => a.id === account2.id)).toBe(true);
    expect(firm2Accounts.some((a) => a.id === account1.id)).toBe(false);

    // Cleanup second firm
    await db.delete(emailAccounts).where(eq(emailAccounts.firmId, firm2.id));
    const { users, firms } = await import("@/lib/db/schema");
    await db.delete(users).where(eq(users.firmId, firm2.id));
    await db.delete(firms).where(eq(firms.id, firm2.id));
  });

  it("prevents accessing email accounts from another firm by ID", async () => {
    const user1 = await createUser({ firmId: ctx.firmId });
    const account1 = await createEmailAccount({
      firmId: ctx.firmId,
      userId: user1.id,
    });

    // Create second firm
    const firm2 = await createFirm({ name: "Another Test Firm" });

    // Try to query account1 with firm2's firmId filter
    const result = await db
      .select()
      .from(emailAccounts)
      .where(and(eq(emailAccounts.id, account1.id), eq(emailAccounts.firmId, firm2.id)));

    // Should not find the account
    expect(result.length).toBe(0);

    // Cleanup second firm
    const { firms } = await import("@/lib/db/schema");
    await db.delete(firms).where(eq(firms.id, firm2.id));
  });

  it("isolates calendar accounts between firms", async () => {
    const user1 = await createUser({ firmId: ctx.firmId });
    const account1 = await createCalendarAccount({
      firmId: ctx.firmId,
      userId: user1.id,
    });

    const firm2 = await createFirm({ name: "Second Firm Calendar" });
    const user2 = await createUser({ firmId: firm2.id });
    const account2 = await createCalendarAccount({
      firmId: firm2.id,
      userId: user2.id,
    });

    const firm1Accounts = await db
      .select()
      .from(calendarAccounts)
      .where(eq(calendarAccounts.firmId, ctx.firmId));

    const firm2Accounts = await db
      .select()
      .from(calendarAccounts)
      .where(eq(calendarAccounts.firmId, firm2.id));

    expect(firm1Accounts.some((a) => a.id === account1.id)).toBe(true);
    expect(firm1Accounts.some((a) => a.id === account2.id)).toBe(false);

    expect(firm2Accounts.some((a) => a.id === account2.id)).toBe(true);
    expect(firm2Accounts.some((a) => a.id === account1.id)).toBe(false);

    // Cleanup
    await db.delete(calendarAccounts).where(eq(calendarAccounts.firmId, firm2.id));
    const { users, firms } = await import("@/lib/db/schema");
    await db.delete(users).where(eq(users.firmId, firm2.id));
    await db.delete(firms).where(eq(firms.id, firm2.id));
  });

  it("isolates payment accounts between firms", async () => {
    const account1 = await createPaymentAccount({
      firmId: ctx.firmId,
    });

    const firm2 = await createFirm({ name: "Second Firm Payment" });
    const account2 = await createPaymentAccount({
      firmId: firm2.id,
    });

    const firm1Accounts = await db
      .select()
      .from(paymentProviderAccounts)
      .where(eq(paymentProviderAccounts.firmId, ctx.firmId));

    const firm2Accounts = await db
      .select()
      .from(paymentProviderAccounts)
      .where(eq(paymentProviderAccounts.firmId, firm2.id));

    expect(firm1Accounts.some((a) => a.id === account1.id)).toBe(true);
    expect(firm1Accounts.some((a) => a.id === account2.id)).toBe(false);

    expect(firm2Accounts.some((a) => a.id === account2.id)).toBe(true);
    expect(firm2Accounts.some((a) => a.id === account1.id)).toBe(false);

    // Cleanup
    await db.delete(paymentProviderAccounts).where(eq(paymentProviderAccounts.firmId, firm2.id));
    const { firms } = await import("@/lib/db/schema");
    await db.delete(firms).where(eq(firms.id, firm2.id));
  });

  it("isolates accounting connections between firms", async () => {
    const connection1 = await createAccountingConnection({
      firmId: ctx.firmId,
    });

    const firm2 = await createFirm({ name: "Second Firm Accounting" });
    const connection2 = await createAccountingConnection({
      firmId: firm2.id,
    });

    const firm1Connections = await db
      .select()
      .from(accountingConnections)
      .where(eq(accountingConnections.firmId, ctx.firmId));

    const firm2Connections = await db
      .select()
      .from(accountingConnections)
      .where(eq(accountingConnections.firmId, firm2.id));

    expect(firm1Connections.some((c) => c.id === connection1.id)).toBe(true);
    expect(firm1Connections.some((c) => c.id === connection2.id)).toBe(false);

    expect(firm2Connections.some((c) => c.id === connection2.id)).toBe(true);
    expect(firm2Connections.some((c) => c.id === connection1.id)).toBe(false);

    // Cleanup
    await db.delete(accountingConnections).where(eq(accountingConnections.firmId, firm2.id));
    const { firms } = await import("@/lib/db/schema");
    await db.delete(firms).where(eq(firms.id, firm2.id));
  });
});
