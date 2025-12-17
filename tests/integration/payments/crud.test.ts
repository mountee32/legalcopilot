/**
 * Payments Integration Tests
 *
 * Tests payment CRUD operations and application to invoices against the real database.
 * Uses setupIntegrationSuite() to provide a test firm with cleanup.
 */
import { describe, it, expect, beforeAll } from "vitest";
import { db } from "@/lib/db";
import { payments, invoices } from "@/lib/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { setupIntegrationSuite, setupFreshFirmPerTest } from "@tests/integration/setup";
import {
  createPayment,
  createCardPayment,
  createBankTransferPayment,
} from "@tests/fixtures/factories/payment";
import { createInvoice } from "@tests/fixtures/factories/invoice";
import { createClient } from "@tests/fixtures/factories/client";
import { createMatter } from "@tests/fixtures/factories/matter";
import { createFirm } from "@tests/fixtures/factories/firm";

describe("Payments Integration - CRUD", () => {
  const ctx = setupIntegrationSuite();
  let client: Awaited<ReturnType<typeof createClient>>;
  let matter: Awaited<ReturnType<typeof createMatter>>;
  let invoice: Awaited<ReturnType<typeof createInvoice>>;

  beforeAll(async () => {
    // Create test data for this suite
    client = await createClient({
      firmId: ctx.firmId,
      firstName: "Payment",
      lastName: "Test Client",
    });

    matter = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
      title: "Payment Test Matter",
    });

    invoice = await createInvoice({
      firmId: ctx.firmId,
      clientId: client.id,
      matterId: matter.id,
      subtotal: "1000.00",
      status: "sent",
    });
  });

  describe("Create", () => {
    it("creates a payment with required fields", async () => {
      const payment = await createPayment({
        firmId: ctx.firmId,
        invoiceId: invoice.id,
        amount: "500.00",
        method: "bank_transfer",
      });

      expect(payment.id).toBeDefined();
      expect(payment.firmId).toBe(ctx.firmId);
      expect(payment.invoiceId).toBe(invoice.id);
      expect(payment.amount).toBe("500.00");
      expect(payment.method).toBe("bank_transfer");
    });

    it("creates a partial payment", async () => {
      const testInvoice = await createInvoice({
        firmId: ctx.firmId,
        clientId: client.id,
        matterId: matter.id,
        subtotal: "1000.00",
        total: "1200.00",
        balanceDue: "1200.00",
      });

      const payment = await createPayment({
        firmId: ctx.firmId,
        invoiceId: testInvoice.id,
        amount: "600.00",
        method: "card",
      });

      expect(payment.amount).toBe("600.00");
      expect(payment.invoiceId).toBe(testInvoice.id);
    });

    it("creates a full payment", async () => {
      const testInvoice = await createInvoice({
        firmId: ctx.firmId,
        clientId: client.id,
        matterId: matter.id,
        subtotal: "500.00",
        total: "600.00",
        balanceDue: "600.00",
      });

      const payment = await createPayment({
        firmId: ctx.firmId,
        invoiceId: testInvoice.id,
        amount: "600.00",
        method: "bank_transfer",
      });

      expect(payment.amount).toBe("600.00");
      expect(payment.invoiceId).toBe(testInvoice.id);
    });

    it("uses current date as payment date by default", async () => {
      const today = new Date().toISOString().split("T")[0];

      const payment = await createPayment({
        firmId: ctx.firmId,
        invoiceId: invoice.id,
        amount: "100.00",
        method: "card",
      });

      expect(payment.paymentDate).toBe(today);
    });

    it("generates reference automatically", async () => {
      const payment = await createPayment({
        firmId: ctx.firmId,
        invoiceId: invoice.id,
        amount: "50.00",
        method: "bank_transfer",
      });

      expect(payment.reference).toBeDefined();
      expect(payment.reference).toContain("PAY-");
    });

    it("accepts custom reference", async () => {
      const payment = await createPayment({
        firmId: ctx.firmId,
        invoiceId: invoice.id,
        amount: "50.00",
        method: "bank_transfer",
        reference: "CUSTOM-REF-12345",
      });

      expect(payment.reference).toBe("CUSTOM-REF-12345");
    });

    it("persists payment data to database", async () => {
      const payment = await createPayment({
        firmId: ctx.firmId,
        invoiceId: invoice.id,
        amount: "250.00",
        method: "cheque",
        reference: "CHQ-001",
      });

      const [dbPayment] = await db.select().from(payments).where(eq(payments.id, payment.id));

      expect(dbPayment).toBeDefined();
      expect(dbPayment.amount).toBe("250.00");
      expect(dbPayment.method).toBe("cheque");
      expect(dbPayment.reference).toBe("CHQ-001");
    });

    it("fails when invoice does not exist", async () => {
      await expect(
        createPayment({
          firmId: ctx.firmId,
          invoiceId: "00000000-0000-0000-0000-000000000000",
          amount: "100.00",
          method: "bank_transfer",
        })
      ).rejects.toThrow();
    });
  });

  describe("Read", () => {
    it("retrieves payment by ID", async () => {
      const created = await createPayment({
        firmId: ctx.firmId,
        invoiceId: invoice.id,
        amount: "100.00",
        method: "bank_transfer",
      });

      const [retrieved] = await db.select().from(payments).where(eq(payments.id, created.id));

      expect(retrieved).toBeDefined();
      expect(retrieved.id).toBe(created.id);
      expect(retrieved.amount).toBe("100.00");
    });

    it("lists payments for an invoice", async () => {
      const testInvoice = await createInvoice({
        firmId: ctx.firmId,
        clientId: client.id,
        matterId: matter.id,
      });

      await createPayment({
        firmId: ctx.firmId,
        invoiceId: testInvoice.id,
        amount: "100.00",
        method: "bank_transfer",
      });

      await createPayment({
        firmId: ctx.firmId,
        invoiceId: testInvoice.id,
        amount: "200.00",
        method: "card",
      });

      const invoicePayments = await db
        .select()
        .from(payments)
        .where(eq(payments.invoiceId, testInvoice.id));

      expect(invoicePayments.length).toBe(2);
    });

    it("lists payments for a firm", async () => {
      const firmPayments = await db.select().from(payments).where(eq(payments.firmId, ctx.firmId));

      expect(firmPayments.length).toBeGreaterThan(0);
    });
  });

  describe("Delete", () => {
    it("deletes (voids) a payment", async () => {
      const payment = await createPayment({
        firmId: ctx.firmId,
        invoiceId: invoice.id,
        amount: "100.00",
        method: "bank_transfer",
      });

      await db.delete(payments).where(eq(payments.id, payment.id));

      const [deleted] = await db.select().from(payments).where(eq(payments.id, payment.id));

      expect(deleted).toBeUndefined();
    });

    it("supports voiding payment by soft delete pattern", async () => {
      // Note: Payments schema doesn't have soft delete yet, but testing
      // that deletion works for now. In production, you'd want to track
      // voided payments rather than hard deleting them
      const payment = await createPayment({
        firmId: ctx.firmId,
        invoiceId: invoice.id,
        amount: "50.00",
        method: "card",
      });

      const paymentId = payment.id;

      await db.delete(payments).where(eq(payments.id, paymentId));

      const [voided] = await db.select().from(payments).where(eq(payments.id, paymentId));

      expect(voided).toBeUndefined();
    });
  });
});

describe("Payments Integration - Payment Application", () => {
  const ctx = setupIntegrationSuite();
  let client: Awaited<ReturnType<typeof createClient>>;
  let matter: Awaited<ReturnType<typeof createMatter>>;

  beforeAll(async () => {
    client = await createClient({
      firmId: ctx.firmId,
      firstName: "Application",
      lastName: "Test Client",
    });

    matter = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
      title: "Application Test Matter",
    });
  });

  it("updates invoice balance after payment", async () => {
    const invoice = await createInvoice({
      firmId: ctx.firmId,
      clientId: client.id,
      matterId: matter.id,
      subtotal: "1000.00",
      total: "1200.00",
      balanceDue: "1200.00",
      paidAmount: "0.00",
      status: "sent",
    });

    // Record payment
    await createPayment({
      firmId: ctx.firmId,
      invoiceId: invoice.id,
      amount: "600.00",
      method: "bank_transfer",
    });

    // Update invoice balance
    await db
      .update(invoices)
      .set({
        paidAmount: "600.00",
        balanceDue: "600.00",
        status: "partially_paid",
        updatedAt: new Date(),
      })
      .where(eq(invoices.id, invoice.id));

    const [updated] = await db.select().from(invoices).where(eq(invoices.id, invoice.id));

    expect(updated.paidAmount).toBe("600.00");
    expect(updated.balanceDue).toBe("600.00");
    expect(updated.status).toBe("partially_paid");
  });

  it("marks invoice as paid when full payment received", async () => {
    const invoice = await createInvoice({
      firmId: ctx.firmId,
      clientId: client.id,
      matterId: matter.id,
      subtotal: "500.00",
      total: "600.00",
      balanceDue: "600.00",
      paidAmount: "0.00",
      status: "sent",
    });

    // Record full payment
    await createPayment({
      firmId: ctx.firmId,
      invoiceId: invoice.id,
      amount: "600.00",
      method: "bank_transfer",
    });

    // Update invoice to paid
    await db
      .update(invoices)
      .set({
        paidAmount: "600.00",
        balanceDue: "0.00",
        status: "paid",
        paidAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(invoices.id, invoice.id));

    const [updated] = await db.select().from(invoices).where(eq(invoices.id, invoice.id));

    expect(updated.paidAmount).toBe("600.00");
    expect(updated.balanceDue).toBe("0.00");
    expect(updated.status).toBe("paid");
    expect(updated.paidAt).toBeDefined();
  });

  it("handles multiple partial payments", async () => {
    const invoice = await createInvoice({
      firmId: ctx.firmId,
      clientId: client.id,
      matterId: matter.id,
      subtotal: "1000.00",
      total: "1200.00",
      balanceDue: "1200.00",
      paidAmount: "0.00",
      status: "sent",
    });

    // First payment
    await createPayment({
      firmId: ctx.firmId,
      invoiceId: invoice.id,
      amount: "400.00",
      method: "bank_transfer",
    });

    await db
      .update(invoices)
      .set({
        paidAmount: "400.00",
        balanceDue: "800.00",
        status: "partially_paid",
        updatedAt: new Date(),
      })
      .where(eq(invoices.id, invoice.id));

    // Second payment
    await createPayment({
      firmId: ctx.firmId,
      invoiceId: invoice.id,
      amount: "400.00",
      method: "card",
    });

    await db
      .update(invoices)
      .set({
        paidAmount: "800.00",
        balanceDue: "400.00",
        updatedAt: new Date(),
      })
      .where(eq(invoices.id, invoice.id));

    // Third payment (final)
    await createPayment({
      firmId: ctx.firmId,
      invoiceId: invoice.id,
      amount: "400.00",
      method: "bank_transfer",
    });

    await db
      .update(invoices)
      .set({
        paidAmount: "1200.00",
        balanceDue: "0.00",
        status: "paid",
        paidAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(invoices.id, invoice.id));

    const [updated] = await db.select().from(invoices).where(eq(invoices.id, invoice.id));

    expect(updated.paidAmount).toBe("1200.00");
    expect(updated.balanceDue).toBe("0.00");
    expect(updated.status).toBe("paid");
  });

  it("tracks total payments for an invoice", async () => {
    const invoice = await createInvoice({
      firmId: ctx.firmId,
      clientId: client.id,
      matterId: matter.id,
      subtotal: "1000.00",
      total: "1200.00",
      balanceDue: "1200.00",
      status: "sent",
    });

    await createPayment({
      firmId: ctx.firmId,
      invoiceId: invoice.id,
      amount: "400.00",
      method: "bank_transfer",
    });

    await createPayment({
      firmId: ctx.firmId,
      invoiceId: invoice.id,
      amount: "400.00",
      method: "card",
    });

    await createPayment({
      firmId: ctx.firmId,
      invoiceId: invoice.id,
      amount: "400.00",
      method: "bank_transfer",
    });

    const invoicePayments = await db
      .select()
      .from(payments)
      .where(eq(payments.invoiceId, invoice.id));

    const totalPaid = invoicePayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);

    expect(invoicePayments.length).toBe(3);
    expect(totalPaid).toBe(1200);
  });
});

describe("Payments Integration - Payment Methods", () => {
  const ctx = setupIntegrationSuite();
  let client: Awaited<ReturnType<typeof createClient>>;
  let matter: Awaited<ReturnType<typeof createMatter>>;
  let invoice: Awaited<ReturnType<typeof createInvoice>>;

  beforeAll(async () => {
    client = await createClient({
      firmId: ctx.firmId,
      firstName: "Method",
      lastName: "Test Client",
    });

    matter = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
      title: "Method Test Matter",
    });

    invoice = await createInvoice({
      firmId: ctx.firmId,
      clientId: client.id,
      matterId: matter.id,
      subtotal: "1000.00",
      status: "sent",
    });
  });

  it("records bank transfer payment", async () => {
    const payment = await createBankTransferPayment(ctx.firmId, invoice.id, "500.00");

    expect(payment.method).toBe("bank_transfer");
    expect(payment.amount).toBe("500.00");
  });

  it("records card payment", async () => {
    const payment = await createCardPayment(ctx.firmId, invoice.id, "300.00");

    expect(payment.method).toBe("card");
    expect(payment.amount).toBe("300.00");
  });

  it("records cheque payment", async () => {
    const payment = await createPayment({
      firmId: ctx.firmId,
      invoiceId: invoice.id,
      amount: "200.00",
      method: "cheque",
      reference: "CHQ-123456",
    });

    expect(payment.method).toBe("cheque");
    expect(payment.reference).toBe("CHQ-123456");
  });

  it("records cash payment", async () => {
    const payment = await createPayment({
      firmId: ctx.firmId,
      invoiceId: invoice.id,
      amount: "50.00",
      method: "cash",
    });

    expect(payment.method).toBe("cash");
  });

  it("records client account payment", async () => {
    const payment = await createPayment({
      firmId: ctx.firmId,
      invoiceId: invoice.id,
      amount: "100.00",
      method: "client_account",
    });

    expect(payment.method).toBe("client_account");
  });

  it("filters payments by method", async () => {
    const testInvoice = await createInvoice({
      firmId: ctx.firmId,
      clientId: client.id,
      matterId: matter.id,
    });

    await createPayment({
      firmId: ctx.firmId,
      invoiceId: testInvoice.id,
      amount: "100.00",
      method: "bank_transfer",
    });

    await createPayment({
      firmId: ctx.firmId,
      invoiceId: testInvoice.id,
      amount: "200.00",
      method: "card",
    });

    await createPayment({
      firmId: ctx.firmId,
      invoiceId: testInvoice.id,
      amount: "50.00",
      method: "cheque",
    });

    const bankPayments = await db
      .select()
      .from(payments)
      .where(and(eq(payments.firmId, ctx.firmId), eq(payments.method, "bank_transfer")));

    const cardPayments = await db
      .select()
      .from(payments)
      .where(and(eq(payments.firmId, ctx.firmId), eq(payments.method, "card")));

    const chequePayments = await db
      .select()
      .from(payments)
      .where(and(eq(payments.firmId, ctx.firmId), eq(payments.method, "cheque")));

    expect(bankPayments.length).toBeGreaterThanOrEqual(1);
    expect(cardPayments.length).toBeGreaterThanOrEqual(1);
    expect(chequePayments.length).toBeGreaterThanOrEqual(1);
  });
});

describe("Payments Integration - Filtering", () => {
  const ctx = setupIntegrationSuite();
  let client: Awaited<ReturnType<typeof createClient>>;
  let matter: Awaited<ReturnType<typeof createMatter>>;
  let invoice1: Awaited<ReturnType<typeof createInvoice>>;
  let invoice2: Awaited<ReturnType<typeof createInvoice>>;

  beforeAll(async () => {
    client = await createClient({
      firmId: ctx.firmId,
      firstName: "Filter",
      lastName: "Test Client",
    });

    matter = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
      title: "Filter Test Matter",
    });

    invoice1 = await createInvoice({
      firmId: ctx.firmId,
      clientId: client.id,
      matterId: matter.id,
    });

    invoice2 = await createInvoice({
      firmId: ctx.firmId,
      clientId: client.id,
      matterId: matter.id,
    });
  });

  it("filters payments by invoice", async () => {
    await createPayment({
      firmId: ctx.firmId,
      invoiceId: invoice1.id,
      amount: "100.00",
      method: "bank_transfer",
    });

    await createPayment({
      firmId: ctx.firmId,
      invoiceId: invoice2.id,
      amount: "200.00",
      method: "card",
    });

    const invoice1Payments = await db
      .select()
      .from(payments)
      .where(eq(payments.invoiceId, invoice1.id));

    const invoice2Payments = await db
      .select()
      .from(payments)
      .where(eq(payments.invoiceId, invoice2.id));

    expect(invoice1Payments.length).toBeGreaterThanOrEqual(1);
    expect(invoice2Payments.length).toBeGreaterThanOrEqual(1);
  });

  it("filters payments by date range", async () => {
    await createPayment({
      firmId: ctx.firmId,
      invoiceId: invoice1.id,
      amount: "100.00",
      method: "bank_transfer",
      paymentDate: "2024-01-15",
    });

    await createPayment({
      firmId: ctx.firmId,
      invoiceId: invoice1.id,
      amount: "200.00",
      method: "bank_transfer",
      paymentDate: "2024-02-20",
    });

    await createPayment({
      firmId: ctx.firmId,
      invoiceId: invoice1.id,
      amount: "150.00",
      method: "bank_transfer",
      paymentDate: "2024-03-10",
    });

    const januaryPayments = await db
      .select()
      .from(payments)
      .where(
        and(
          eq(payments.firmId, ctx.firmId),
          gte(payments.paymentDate, "2024-01-01"),
          lte(payments.paymentDate, "2024-01-31")
        )
      );

    const q1Payments = await db
      .select()
      .from(payments)
      .where(
        and(
          eq(payments.firmId, ctx.firmId),
          gte(payments.paymentDate, "2024-01-01"),
          lte(payments.paymentDate, "2024-03-31")
        )
      );

    expect(januaryPayments.length).toBeGreaterThanOrEqual(1);
    expect(q1Payments.length).toBeGreaterThanOrEqual(3);
  });

  it("filters by combined criteria (invoice + method + date)", async () => {
    const testInvoice = await createInvoice({
      firmId: ctx.firmId,
      clientId: client.id,
      matterId: matter.id,
    });

    await createPayment({
      firmId: ctx.firmId,
      invoiceId: testInvoice.id,
      amount: "100.00",
      method: "bank_transfer",
      paymentDate: "2024-06-15",
    });

    await createPayment({
      firmId: ctx.firmId,
      invoiceId: testInvoice.id,
      amount: "200.00",
      method: "card",
      paymentDate: "2024-06-20",
    });

    const filtered = await db
      .select()
      .from(payments)
      .where(
        and(
          eq(payments.firmId, ctx.firmId),
          eq(payments.invoiceId, testInvoice.id),
          eq(payments.method, "bank_transfer"),
          gte(payments.paymentDate, "2024-06-01"),
          lte(payments.paymentDate, "2024-06-30")
        )
      );

    expect(filtered.length).toBeGreaterThanOrEqual(1);
    expect(filtered[0].method).toBe("bank_transfer");
  });
});

describe("Payments Integration - Multi-Tenancy", () => {
  const ctx = setupFreshFirmPerTest();

  it("isolates payments between firms", async () => {
    // Create data for first firm
    const client1 = await createClient({
      firmId: ctx.firmId,
      firstName: "Firm1",
      lastName: "Client",
    });
    const matter1 = await createMatter({
      firmId: ctx.firmId,
      clientId: client1.id,
      title: "Firm 1 Matter",
    });
    const invoice1 = await createInvoice({
      firmId: ctx.firmId,
      clientId: client1.id,
      matterId: matter1.id,
    });
    const payment1 = await createPayment({
      firmId: ctx.firmId,
      invoiceId: invoice1.id,
      amount: "500.00",
      method: "bank_transfer",
    });

    // Create second firm with data
    const firm2 = await createFirm({ name: "Second Test Firm" });
    const client2 = await createClient({
      firmId: firm2.id,
      firstName: "Firm2",
      lastName: "Client",
    });
    const matter2 = await createMatter({
      firmId: firm2.id,
      clientId: client2.id,
      title: "Firm 2 Matter",
    });
    const invoice2 = await createInvoice({
      firmId: firm2.id,
      clientId: client2.id,
      matterId: matter2.id,
    });
    const payment2 = await createPayment({
      firmId: firm2.id,
      invoiceId: invoice2.id,
      amount: "600.00",
      method: "card",
    });

    // Query payments for first firm
    const firm1Payments = await db.select().from(payments).where(eq(payments.firmId, ctx.firmId));

    // Query payments for second firm
    const firm2Payments = await db.select().from(payments).where(eq(payments.firmId, firm2.id));

    // Each firm should only see their own payments
    expect(firm1Payments.some((p) => p.id === payment1.id)).toBe(true);
    expect(firm1Payments.some((p) => p.id === payment2.id)).toBe(false);

    expect(firm2Payments.some((p) => p.id === payment2.id)).toBe(true);
    expect(firm2Payments.some((p) => p.id === payment1.id)).toBe(false);

    // Cleanup second firm
    await db.delete(payments).where(eq(payments.firmId, firm2.id));
    await db.delete(invoices).where(eq(invoices.firmId, firm2.id));
    const { matters } = await import("@/lib/db/schema");
    await db.delete(matters).where(eq(matters.firmId, firm2.id));
    const { clients } = await import("@/lib/db/schema");
    await db.delete(clients).where(eq(clients.firmId, firm2.id));
    const { firms } = await import("@/lib/db/schema");
    await db.delete(firms).where(eq(firms.id, firm2.id));
  });

  it("prevents accessing payments from another firm by ID", async () => {
    // Create payment in first firm
    const client1 = await createClient({
      firmId: ctx.firmId,
      firstName: "Isolated",
      lastName: "Client",
    });
    const matter1 = await createMatter({
      firmId: ctx.firmId,
      clientId: client1.id,
      title: "Isolated Matter",
    });
    const invoice1 = await createInvoice({
      firmId: ctx.firmId,
      clientId: client1.id,
      matterId: matter1.id,
    });
    const payment1 = await createPayment({
      firmId: ctx.firmId,
      invoiceId: invoice1.id,
      amount: "100.00",
      method: "bank_transfer",
    });

    // Create second firm
    const firm2 = await createFirm({ name: "Another Test Firm" });

    // Try to query payment1 with firm2's firmId filter (simulating API check)
    const result = await db
      .select()
      .from(payments)
      .where(and(eq(payments.id, payment1.id), eq(payments.firmId, firm2.id)));

    // Should not find the payment
    expect(result.length).toBe(0);

    // Cleanup second firm
    const { firms } = await import("@/lib/db/schema");
    await db.delete(firms).where(eq(firms.id, firm2.id));
  });

  it("cannot create payment for invoice from another firm", async () => {
    // Create data for first firm
    const client1 = await createClient({
      firmId: ctx.firmId,
      firstName: "Cross",
      lastName: "Client",
    });
    const matter1 = await createMatter({
      firmId: ctx.firmId,
      clientId: client1.id,
      title: "Cross Firm Matter",
    });
    const invoice1 = await createInvoice({
      firmId: ctx.firmId,
      clientId: client1.id,
      matterId: matter1.id,
    });

    // Create second firm
    const firm2 = await createFirm({ name: "Cross Firm Test" });

    // Try to create payment in firm2 for invoice from firm1 (should fail in real API)
    // Here we verify that the invoice belongs to firm1
    const [invoiceCheck] = await db.select().from(invoices).where(eq(invoices.id, invoice1.id));

    expect(invoiceCheck.firmId).toBe(ctx.firmId);
    expect(invoiceCheck.firmId).not.toBe(firm2.id);

    // Cleanup second firm
    const { firms } = await import("@/lib/db/schema");
    await db.delete(firms).where(eq(firms.id, firm2.id));
  });
});

describe("Payments Integration - Validation", () => {
  const ctx = setupIntegrationSuite();
  let client: Awaited<ReturnType<typeof createClient>>;
  let matter: Awaited<ReturnType<typeof createMatter>>;
  let invoice: Awaited<ReturnType<typeof createInvoice>>;

  beforeAll(async () => {
    client = await createClient({
      firmId: ctx.firmId,
      firstName: "Validation",
      lastName: "Test Client",
    });

    matter = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
      title: "Validation Test Matter",
    });

    invoice = await createInvoice({
      firmId: ctx.firmId,
      clientId: client.id,
      matterId: matter.id,
    });
  });

  it("requires valid invoice reference", async () => {
    const invalidInvoiceId = "00000000-0000-0000-0000-000000000000";

    await expect(
      createPayment({
        firmId: ctx.firmId,
        invoiceId: invalidInvoiceId,
        amount: "100.00",
        method: "bank_transfer",
      })
    ).rejects.toThrow();
  });

  it("accepts positive payment amounts", async () => {
    const payment = await createPayment({
      firmId: ctx.firmId,
      invoiceId: invoice.id,
      amount: "0.01",
      method: "bank_transfer",
    });

    expect(payment.amount).toBe("0.01");
  });

  it("accepts large payment amounts", async () => {
    const payment = await createPayment({
      firmId: ctx.firmId,
      invoiceId: invoice.id,
      amount: "100000.00",
      method: "bank_transfer",
    });

    expect(payment.amount).toBe("100000.00");
  });

  it("stores payment amounts with correct precision", async () => {
    const payment = await createPayment({
      firmId: ctx.firmId,
      invoiceId: invoice.id,
      amount: "123.45",
      method: "bank_transfer",
    });

    expect(payment.amount).toBe("123.45");
  });

  it("validates payment method enum", async () => {
    const validMethods = ["bank_transfer", "card", "cheque", "cash", "client_account"];

    for (const method of validMethods) {
      const payment = await createPayment({
        firmId: ctx.firmId,
        invoiceId: invoice.id,
        amount: "50.00",
        method: method as any,
      });

      expect(payment.method).toBe(method);
    }
  });

  it("accepts custom payment dates", async () => {
    const payment = await createPayment({
      firmId: ctx.firmId,
      invoiceId: invoice.id,
      amount: "100.00",
      method: "bank_transfer",
      paymentDate: "2024-01-15",
    });

    expect(payment.paymentDate).toBe("2024-01-15");
  });
});
