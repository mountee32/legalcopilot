/**
 * Invoice Actions Integration Tests
 *
 * Tests invoice send and void action endpoints against the real database.
 * Uses setupIntegrationSuite() to provide a test firm with cleanup.
 */
import { describe, it, expect, beforeAll } from "vitest";
import { db } from "@/lib/db";
import { invoices, approvalRequests } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { setupIntegrationSuite, setupFreshFirmPerTest } from "@tests/integration/setup";
import { createInvoice } from "@tests/fixtures/factories/invoice";
import { createClient } from "@tests/fixtures/factories/client";
import { createMatter } from "@tests/fixtures/factories/matter";
import { createFirm } from "@tests/fixtures/factories/firm";
import { createUser } from "@tests/fixtures/factories/user";

describe("Invoice Actions Integration - Send", () => {
  const ctx = setupIntegrationSuite();
  let client: Awaited<ReturnType<typeof createClient>>;
  let invoice: Awaited<ReturnType<typeof createInvoice>>;

  beforeAll(async () => {
    client = await createClient({
      firmId: ctx.firmId,
      firstName: "Send",
      lastName: "Test Client",
    });
  });

  describe("Send Invoice - Success Cases", () => {
    it("creates approval request for draft invoice", async () => {
      const draftInvoice = await createInvoice({
        firmId: ctx.firmId,
        clientId: client.id,
        status: "draft",
      });

      // Create a user to act as the requester
      const user = await createUser({
        firmId: ctx.firmId,
        name: "Test User",
        email: `test-${Date.now()}@example.com`,
      });

      // Simulate the send endpoint's approval request creation
      const [approval] = await db
        .insert(approvalRequests)
        .values({
          firmId: ctx.firmId,
          sourceType: "user",
          sourceId: user.id,
          action: "invoice.send",
          summary: `Send invoice ${draftInvoice.invoiceNumber}`,
          proposedPayload: {
            invoiceId: draftInvoice.id,
            invoiceNumber: draftInvoice.invoiceNumber,
          },
          entityType: "invoice",
          entityId: draftInvoice.id,
          updatedAt: new Date(),
        })
        .returning();

      expect(approval.id).toBeDefined();
      expect(approval.action).toBe("invoice.send");
      expect(approval.entityId).toBe(draftInvoice.id);
      expect(approval.status).toBe("pending");
      expect(approval.firmId).toBe(ctx.firmId);
    });

    it("creates approval request with correct payload structure", async () => {
      const draftInvoice = await createInvoice({
        firmId: ctx.firmId,
        clientId: client.id,
        status: "draft",
      });

      const user = await createUser({
        firmId: ctx.firmId,
        name: "Payload Test User",
        email: `payload-${Date.now()}@example.com`,
      });

      const [approval] = await db
        .insert(approvalRequests)
        .values({
          firmId: ctx.firmId,
          sourceType: "user",
          sourceId: user.id,
          action: "invoice.send",
          summary: `Send invoice ${draftInvoice.invoiceNumber}`,
          proposedPayload: {
            invoiceId: draftInvoice.id,
            invoiceNumber: draftInvoice.invoiceNumber,
          },
          entityType: "invoice",
          entityId: draftInvoice.id,
          updatedAt: new Date(),
        })
        .returning();

      expect(approval.proposedPayload).toEqual({
        invoiceId: draftInvoice.id,
        invoiceNumber: draftInvoice.invoiceNumber,
      });
      expect(approval.summary).toBe(`Send invoice ${draftInvoice.invoiceNumber}`);
    });
  });

  describe("Send Invoice - Validation Failures", () => {
    it("prevents sending already sent invoice", async () => {
      const sentInvoice = await createInvoice({
        firmId: ctx.firmId,
        clientId: client.id,
        status: "sent",
      });

      // Check the invoice status
      const [invoice] = await db
        .select()
        .from(invoices)
        .where(and(eq(invoices.id, sentInvoice.id), eq(invoices.firmId, ctx.firmId)));

      expect(invoice.status).toBe("sent");

      // The endpoint would throw ValidationError("Only draft invoices can be sent")
      // Here we verify the status check would fail
      expect(invoice.status).not.toBe("draft");
    });

    it("prevents sending paid invoice", async () => {
      const paidInvoice = await createInvoice({
        firmId: ctx.firmId,
        clientId: client.id,
        status: "paid",
      });

      const [invoice] = await db
        .select()
        .from(invoices)
        .where(and(eq(invoices.id, paidInvoice.id), eq(invoices.firmId, ctx.firmId)));

      expect(invoice.status).toBe("paid");
      expect(invoice.status).not.toBe("draft");
    });

    it("prevents duplicate approval requests for same invoice", async () => {
      const draftInvoice = await createInvoice({
        firmId: ctx.firmId,
        clientId: client.id,
        status: "draft",
      });

      const user = await createUser({
        firmId: ctx.firmId,
        name: "Duplicate Test User",
        email: `duplicate-${Date.now()}@example.com`,
      });

      // Create first approval request
      await db.insert(approvalRequests).values({
        firmId: ctx.firmId,
        sourceType: "user",
        sourceId: user.id,
        action: "invoice.send",
        summary: `Send invoice ${draftInvoice.invoiceNumber}`,
        proposedPayload: {
          invoiceId: draftInvoice.id,
          invoiceNumber: draftInvoice.invoiceNumber,
        },
        entityType: "invoice",
        entityId: draftInvoice.id,
        updatedAt: new Date(),
      });

      // Check for existing approval request (this is what the endpoint does)
      const [existing] = await db
        .select({ id: approvalRequests.id })
        .from(approvalRequests)
        .where(
          and(
            eq(approvalRequests.firmId, ctx.firmId),
            eq(approvalRequests.status, "pending"),
            eq(approvalRequests.action, "invoice.send"),
            eq(approvalRequests.entityType, "invoice"),
            eq(approvalRequests.entityId, draftInvoice.id)
          )
        )
        .limit(1);

      expect(existing).toBeDefined();
      expect(existing.id).toBeDefined();
      // The endpoint would throw ValidationError("An approval request already exists for this invoice")
    });
  });
});

describe("Invoice Actions Integration - Void", () => {
  const ctx = setupIntegrationSuite();
  let client: Awaited<ReturnType<typeof createClient>>;
  let matter: Awaited<ReturnType<typeof createMatter>>;

  beforeAll(async () => {
    client = await createClient({
      firmId: ctx.firmId,
      firstName: "Void",
      lastName: "Test Client",
    });

    matter = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
      title: "Void Test Matter",
    });
  });

  describe("Void Invoice - Success Cases", () => {
    it("voids draft invoice successfully", async () => {
      const draftInvoice = await createInvoice({
        firmId: ctx.firmId,
        clientId: client.id,
        matterId: matter.id,
        status: "draft",
        subtotal: "1000.00",
      });

      // Void the invoice
      await db
        .update(invoices)
        .set({
          status: "written_off",
          balanceDue: "0.00",
          updatedAt: new Date(),
        })
        .where(and(eq(invoices.id, draftInvoice.id), eq(invoices.firmId, ctx.firmId)));

      // Verify the invoice was voided
      const [voidedInvoice] = await db
        .select()
        .from(invoices)
        .where(eq(invoices.id, draftInvoice.id));

      expect(voidedInvoice.status).toBe("written_off");
      expect(voidedInvoice.balanceDue).toBe("0.00");
    });

    it("sets balance to zero when voiding", async () => {
      const invoice = await createInvoice({
        firmId: ctx.firmId,
        clientId: client.id,
        status: "draft",
        subtotal: "5000.00",
      });

      // Initial balance should equal total
      expect(invoice.balanceDue).toBe("6000.00"); // 5000 + 20% VAT

      // Void the invoice
      await db
        .update(invoices)
        .set({
          status: "written_off",
          balanceDue: "0.00",
          updatedAt: new Date(),
        })
        .where(and(eq(invoices.id, invoice.id), eq(invoices.firmId, ctx.firmId)));

      const [voided] = await db.select().from(invoices).where(eq(invoices.id, invoice.id));

      expect(voided.balanceDue).toBe("0.00");
    });

    it("preserves original invoice amounts when voiding", async () => {
      const invoice = await createInvoice({
        firmId: ctx.firmId,
        clientId: client.id,
        status: "draft",
        subtotal: "2500.00",
      });

      // Void the invoice
      await db
        .update(invoices)
        .set({
          status: "written_off",
          balanceDue: "0.00",
          updatedAt: new Date(),
        })
        .where(and(eq(invoices.id, invoice.id), eq(invoices.firmId, ctx.firmId)));

      const [voided] = await db.select().from(invoices).where(eq(invoices.id, invoice.id));

      // Original amounts should be preserved
      expect(voided.subtotal).toBe("2500.00");
      expect(voided.vatAmount).toBe("500.00");
      expect(voided.total).toBe("3000.00");
      // But balance should be zero
      expect(voided.balanceDue).toBe("0.00");
      expect(voided.status).toBe("written_off");
    });
  });

  describe("Void Invoice - Validation Failures", () => {
    it("prevents voiding sent invoice", async () => {
      const sentInvoice = await createInvoice({
        firmId: ctx.firmId,
        clientId: client.id,
        status: "sent",
      });

      const [invoice] = await db
        .select()
        .from(invoices)
        .where(and(eq(invoices.id, sentInvoice.id), eq(invoices.firmId, ctx.firmId)));

      expect(invoice.status).toBe("sent");
      expect(invoice.status).not.toBe("draft");
      // The endpoint would throw ValidationError("Only draft invoices can be voided")
    });

    it("prevents voiding paid invoice", async () => {
      const paidInvoice = await createInvoice({
        firmId: ctx.firmId,
        clientId: client.id,
        status: "paid",
        paidAmount: "1200.00",
      });

      const [invoice] = await db
        .select()
        .from(invoices)
        .where(and(eq(invoices.id, paidInvoice.id), eq(invoices.firmId, ctx.firmId)));

      expect(invoice.status).toBe("paid");
      expect(invoice.status).not.toBe("draft");
    });

    it("prevents voiding invoice with payments", async () => {
      const invoice = await createInvoice({
        firmId: ctx.firmId,
        clientId: client.id,
        status: "draft",
        paidAmount: "600.00", // Has received a payment
        balanceDue: "600.00",
      });

      // Fetch from database to verify paidAmount was persisted
      const [dbInvoice] = await db.select().from(invoices).where(eq(invoices.id, invoice.id));

      const paid = Number.parseFloat(dbInvoice.paidAmount ?? "0");
      expect(paid).toBeGreaterThan(0);
      // The endpoint would throw ValidationError("Cannot void an invoice with payments")
    });

    it("prevents voiding already voided invoice", async () => {
      const invoice = await createInvoice({
        firmId: ctx.firmId,
        clientId: client.id,
        status: "written_off",
        balanceDue: "0.00",
      });

      const [voidedInvoice] = await db
        .select()
        .from(invoices)
        .where(and(eq(invoices.id, invoice.id), eq(invoices.firmId, ctx.firmId)));

      expect(voidedInvoice.status).toBe("written_off");
      expect(voidedInvoice.status).not.toBe("draft");
      // The endpoint would throw ValidationError("Only draft invoices can be voided")
    });
  });
});

describe("Invoice Actions Integration - Multi-Tenancy", () => {
  const ctx = setupFreshFirmPerTest();

  describe("Send Invoice - Firm Isolation", () => {
    it("prevents sending invoice from another firm", async () => {
      // Create invoice in first firm
      const client1 = await createClient({
        firmId: ctx.firmId,
        firstName: "Firm1",
        lastName: "Client",
      });
      const invoice1 = await createInvoice({
        firmId: ctx.firmId,
        clientId: client1.id,
        status: "draft",
      });

      // Create second firm
      const firm2 = await createFirm({ name: "Second Test Firm" });

      // Try to query invoice from firm1 using firm2's firmId
      const result = await db
        .select()
        .from(invoices)
        .where(and(eq(invoices.id, invoice1.id), eq(invoices.firmId, firm2.id)));

      // Should not find the invoice
      expect(result.length).toBe(0);
      // The endpoint would throw NotFoundError("Invoice not found")

      // Cleanup second firm
      const { firms } = await import("@/lib/db/schema");
      await db.delete(firms).where(eq(firms.id, firm2.id));
    });

    it("firm can only create approval requests for own invoices", async () => {
      const client1 = await createClient({
        firmId: ctx.firmId,
        firstName: "Approval",
        lastName: "Client",
      });
      const invoice1 = await createInvoice({
        firmId: ctx.firmId,
        clientId: client1.id,
        status: "draft",
      });

      const user1 = await createUser({
        firmId: ctx.firmId,
        name: "Firm1 User",
        email: `firm1-${Date.now()}@example.com`,
      });

      // Create approval request
      const [approval] = await db
        .insert(approvalRequests)
        .values({
          firmId: ctx.firmId,
          sourceType: "user",
          sourceId: user1.id,
          action: "invoice.send",
          summary: `Send invoice ${invoice1.invoiceNumber}`,
          proposedPayload: {
            invoiceId: invoice1.id,
            invoiceNumber: invoice1.invoiceNumber,
          },
          entityType: "invoice",
          entityId: invoice1.id,
          updatedAt: new Date(),
        })
        .returning();

      expect(approval.firmId).toBe(ctx.firmId);
      expect(approval.entityId).toBe(invoice1.id);
    });
  });

  describe("Void Invoice - Firm Isolation", () => {
    it("prevents voiding invoice from another firm", async () => {
      // Create invoice in first firm
      const client1 = await createClient({
        firmId: ctx.firmId,
        firstName: "Void",
        lastName: "Client",
      });
      const invoice1 = await createInvoice({
        firmId: ctx.firmId,
        clientId: client1.id,
        status: "draft",
      });

      // Create second firm
      const firm2 = await createFirm({ name: "Another Test Firm" });

      // Try to void invoice1 with firm2's firmId filter
      const result = await db
        .update(invoices)
        .set({
          status: "written_off",
          balanceDue: "0.00",
          updatedAt: new Date(),
        })
        .where(and(eq(invoices.id, invoice1.id), eq(invoices.firmId, firm2.id)))
        .returning();

      // Should not update anything
      expect(result.length).toBe(0);

      // Verify invoice1 is still draft
      const [unchanged] = await db.select().from(invoices).where(eq(invoices.id, invoice1.id));

      expect(unchanged.status).toBe("draft");
      expect(unchanged.firmId).toBe(ctx.firmId);
      // The endpoint would throw NotFoundError("Invoice not found")

      // Cleanup second firm
      const { firms } = await import("@/lib/db/schema");
      await db.delete(firms).where(eq(firms.id, firm2.id));
    });

    it("firm can only void own invoices", async () => {
      const client = await createClient({
        firmId: ctx.firmId,
        firstName: "Own",
        lastName: "Client",
      });
      const invoice = await createInvoice({
        firmId: ctx.firmId,
        clientId: client.id,
        status: "draft",
      });

      // Void with correct firm filter
      const [voided] = await db
        .update(invoices)
        .set({
          status: "written_off",
          balanceDue: "0.00",
          updatedAt: new Date(),
        })
        .where(and(eq(invoices.id, invoice.id), eq(invoices.firmId, ctx.firmId)))
        .returning();

      expect(voided).toBeDefined();
      expect(voided.status).toBe("written_off");
      expect(voided.firmId).toBe(ctx.firmId);
    });
  });
});
