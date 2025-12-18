/**
 * Invoices Integration Tests
 *
 * Tests invoice CRUD operations, generation, status transitions, and actions
 * against the real database. Uses setupIntegrationSuite() to provide a test firm with cleanup.
 */
import { describe, it, expect, beforeAll } from "vitest";
import { db } from "@/lib/db";
import { invoices, invoiceLineItems, timeEntries } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { setupIntegrationSuite, setupFreshFirmPerTest } from "@tests/integration/setup";
import { createInvoice, addInvoiceLineItem } from "@tests/fixtures/factories/invoice";
import { createClient } from "@tests/fixtures/factories/client";
import { createMatter } from "@tests/fixtures/factories/matter";
import { createUser } from "@tests/fixtures/factories/user";
import { createApprovedTimeEntry } from "@tests/fixtures/factories/time-entry";
import { createFirm } from "@tests/fixtures/factories/firm";
import { generateInvoiceTx } from "@/lib/billing/generateInvoice";

describe("Invoices Integration - CRUD", () => {
  const ctx = setupIntegrationSuite();
  let client: Awaited<ReturnType<typeof createClient>>;
  let matter: Awaited<ReturnType<typeof createMatter>>;

  beforeAll(async () => {
    client = await createClient({
      firmId: ctx.firmId,
      firstName: "Invoice",
      lastName: "Test Client",
    });

    matter = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
      title: "Invoice Test Matter",
    });
  });

  describe("Create", () => {
    it("creates an invoice with required fields", async () => {
      const invoice = await createInvoice({
        firmId: ctx.firmId,
        clientId: client.id,
        matterId: matter.id,
        subtotal: "1000.00",
      });

      expect(invoice.id).toBeDefined();
      expect(invoice.firmId).toBe(ctx.firmId);
      expect(invoice.clientId).toBe(client.id);
      expect(invoice.matterId).toBe(matter.id);
      expect(invoice.invoiceNumber).toMatch(/INV-\d{4}-[A-Z0-9]{4,8}/);
      expect(invoice.status).toBe("draft");
      expect(invoice.subtotal).toBe("1000.00");
      expect(invoice.vatAmount).toBe("200.00"); // 20% VAT
      expect(invoice.total).toBe("1200.00");
      expect(invoice.balanceDue).toBe("1200.00");
    });

    it("creates invoice without matter (client-level invoice)", async () => {
      const invoice = await createInvoice({
        firmId: ctx.firmId,
        clientId: client.id,
        matterId: null,
        subtotal: "500.00",
      });

      expect(invoice.matterId).toBeNull();
      expect(invoice.clientId).toBe(client.id);
    });

    it("generates unique invoice number", async () => {
      const invoice1 = await createInvoice({
        firmId: ctx.firmId,
        clientId: client.id,
      });

      const invoice2 = await createInvoice({
        firmId: ctx.firmId,
        clientId: client.id,
      });

      expect(invoice1.invoiceNumber).toBeDefined();
      expect(invoice2.invoiceNumber).toBeDefined();
      expect(invoice1.invoiceNumber).not.toBe(invoice2.invoiceNumber);
    });

    it("calculates VAT correctly (UK 20%)", async () => {
      const invoice = await createInvoice({
        firmId: ctx.firmId,
        clientId: client.id,
        subtotal: "2500.00",
      });

      expect(invoice.subtotal).toBe("2500.00");
      expect(invoice.vatAmount).toBe("500.00"); // 20% of 2500
      expect(invoice.total).toBe("3000.00"); // 2500 + 500
    });

    it("sets default status to draft", async () => {
      const invoice = await createInvoice({
        firmId: ctx.firmId,
        clientId: client.id,
      });

      expect(invoice.status).toBe("draft");
    });

    it("creates invoice with custom dates", async () => {
      const invoiceDate = "2024-06-01";
      const dueDate = "2024-06-30";

      const invoice = await createInvoice({
        firmId: ctx.firmId,
        clientId: client.id,
        invoiceDate,
        dueDate,
      });

      const [dbInvoice] = await db.select().from(invoices).where(eq(invoices.id, invoice.id));

      expect(dbInvoice.invoiceDate).toBe(invoiceDate);
      expect(dbInvoice.dueDate).toBe(dueDate);
    });

    it("persists invoice data to database", async () => {
      const invoice = await createInvoice({
        firmId: ctx.firmId,
        clientId: client.id,
        matterId: matter.id,
        subtotal: "1500.00",
        notes: "Test invoice notes",
      });

      const [dbInvoice] = await db.select().from(invoices).where(eq(invoices.id, invoice.id));

      expect(dbInvoice).toBeDefined();
      expect(dbInvoice.subtotal).toBe("1500.00");
      expect(dbInvoice.notes).toBe("Test invoice notes");
    });
  });

  describe("Read", () => {
    it("retrieves invoice by ID", async () => {
      const created = await createInvoice({
        firmId: ctx.firmId,
        clientId: client.id,
      });

      const [retrieved] = await db.select().from(invoices).where(eq(invoices.id, created.id));

      expect(retrieved).toBeDefined();
      expect(retrieved.id).toBe(created.id);
      expect(retrieved.invoiceNumber).toBe(created.invoiceNumber);
    });

    it("lists invoices for a firm", async () => {
      await createInvoice({ firmId: ctx.firmId, clientId: client.id });
      await createInvoice({ firmId: ctx.firmId, clientId: client.id });

      const firmInvoices = await db.select().from(invoices).where(eq(invoices.firmId, ctx.firmId));

      expect(firmInvoices.length).toBeGreaterThanOrEqual(2);
    });

    it("lists invoices for a specific client", async () => {
      const testClient = await createClient({
        firmId: ctx.firmId,
        firstName: "Specific",
        lastName: "Client",
      });

      await createInvoice({ firmId: ctx.firmId, clientId: testClient.id });
      await createInvoice({ firmId: ctx.firmId, clientId: testClient.id });

      const clientInvoices = await db
        .select()
        .from(invoices)
        .where(and(eq(invoices.firmId, ctx.firmId), eq(invoices.clientId, testClient.id)));

      expect(clientInvoices.length).toBe(2);
      expect(clientInvoices.every((inv) => inv.clientId === testClient.id)).toBe(true);
    });

    it("lists invoices for a specific matter", async () => {
      const testMatter = await createMatter({
        firmId: ctx.firmId,
        clientId: client.id,
        title: "Specific Matter",
      });

      await createInvoice({
        firmId: ctx.firmId,
        clientId: client.id,
        matterId: testMatter.id,
      });
      await createInvoice({
        firmId: ctx.firmId,
        clientId: client.id,
        matterId: testMatter.id,
      });

      const matterInvoices = await db
        .select()
        .from(invoices)
        .where(and(eq(invoices.firmId, ctx.firmId), eq(invoices.matterId, testMatter.id)));

      expect(matterInvoices.length).toBe(2);
      expect(matterInvoices.every((inv) => inv.matterId === testMatter.id)).toBe(true);
    });

    it("retrieves invoice with line items", async () => {
      const invoice = await createInvoice({
        firmId: ctx.firmId,
        clientId: client.id,
      });

      await addInvoiceLineItem(ctx.firmId, invoice.id, {
        description: "Professional services",
        amount: "500.00",
      });
      await addInvoiceLineItem(ctx.firmId, invoice.id, {
        description: "Consultation",
        amount: "300.00",
      });

      const items = await db
        .select()
        .from(invoiceLineItems)
        .where(
          and(eq(invoiceLineItems.invoiceId, invoice.id), eq(invoiceLineItems.firmId, ctx.firmId))
        );

      expect(items.length).toBe(2);
      expect(items[0].description).toBe("Professional services");
      expect(items[1].description).toBe("Consultation");
    });
  });

  describe("Update", () => {
    it("updates invoice fields", async () => {
      const invoice = await createInvoice({
        firmId: ctx.firmId,
        clientId: client.id,
        status: "draft",
      });

      await db
        .update(invoices)
        .set({
          dueDate: "2024-12-31",
          notes: "Updated notes",
          updatedAt: new Date(),
        })
        .where(eq(invoices.id, invoice.id));

      const [updated] = await db.select().from(invoices).where(eq(invoices.id, invoice.id));

      expect(updated.dueDate).toBe("2024-12-31");
      expect(updated.notes).toBe("Updated notes");
    });

    it("updates invoice terms", async () => {
      const invoice = await createInvoice({
        firmId: ctx.firmId,
        clientId: client.id,
      });

      await db
        .update(invoices)
        .set({
          terms: "Payment due within 14 days",
          updatedAt: new Date(),
        })
        .where(eq(invoices.id, invoice.id));

      const [updated] = await db.select().from(invoices).where(eq(invoices.id, invoice.id));

      expect(updated.terms).toBe("Payment due within 14 days");
    });
  });

  describe("Status Transitions", () => {
    it("transitions from draft to sent", async () => {
      const invoice = await createInvoice({
        firmId: ctx.firmId,
        clientId: client.id,
        status: "draft",
      });

      await db
        .update(invoices)
        .set({
          status: "sent",
          sentAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(invoices.id, invoice.id));

      const [updated] = await db.select().from(invoices).where(eq(invoices.id, invoice.id));

      expect(updated.status).toBe("sent");
      expect(updated.sentAt).toBeDefined();
    });

    it("transitions from sent to paid", async () => {
      const invoice = await createInvoice({
        firmId: ctx.firmId,
        clientId: client.id,
        status: "sent",
        subtotal: "1000.00",
      });

      await db
        .update(invoices)
        .set({
          status: "paid",
          paidAmount: "1200.00",
          balanceDue: "0.00",
          paidAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(invoices.id, invoice.id));

      const [updated] = await db.select().from(invoices).where(eq(invoices.id, invoice.id));

      expect(updated.status).toBe("paid");
      expect(updated.paidAmount).toBe("1200.00");
      expect(updated.balanceDue).toBe("0.00");
      expect(updated.paidAt).toBeDefined();
    });

    it("supports partially paid status", async () => {
      const invoice = await createInvoice({
        firmId: ctx.firmId,
        clientId: client.id,
        status: "sent",
        subtotal: "1000.00", // Total: 1200.00 with VAT
      });

      await db
        .update(invoices)
        .set({
          status: "partially_paid",
          paidAmount: "600.00",
          balanceDue: "600.00",
          updatedAt: new Date(),
        })
        .where(eq(invoices.id, invoice.id));

      const [updated] = await db.select().from(invoices).where(eq(invoices.id, invoice.id));

      expect(updated.status).toBe("partially_paid");
      expect(updated.paidAmount).toBe("600.00");
      expect(updated.balanceDue).toBe("600.00");
    });

    it("transitions to written_off", async () => {
      const invoice = await createInvoice({
        firmId: ctx.firmId,
        clientId: client.id,
        status: "draft",
      });

      await db
        .update(invoices)
        .set({
          status: "written_off",
          balanceDue: "0.00",
          updatedAt: new Date(),
        })
        .where(eq(invoices.id, invoice.id));

      const [updated] = await db.select().from(invoices).where(eq(invoices.id, invoice.id));

      expect(updated.status).toBe("written_off");
      expect(updated.balanceDue).toBe("0.00");
    });
  });

  describe("Filter by Status", () => {
    it("filters invoices by status", async () => {
      await createInvoice({
        firmId: ctx.firmId,
        clientId: client.id,
        status: "draft",
      });
      await createInvoice({
        firmId: ctx.firmId,
        clientId: client.id,
        status: "sent",
      });
      await createInvoice({
        firmId: ctx.firmId,
        clientId: client.id,
        status: "paid",
      });

      const draftInvoices = await db
        .select()
        .from(invoices)
        .where(and(eq(invoices.firmId, ctx.firmId), eq(invoices.status, "draft")));

      const sentInvoices = await db
        .select()
        .from(invoices)
        .where(and(eq(invoices.firmId, ctx.firmId), eq(invoices.status, "sent")));

      const paidInvoices = await db
        .select()
        .from(invoices)
        .where(and(eq(invoices.firmId, ctx.firmId), eq(invoices.status, "paid")));

      expect(draftInvoices.length).toBeGreaterThanOrEqual(1);
      expect(sentInvoices.length).toBeGreaterThanOrEqual(1);
      expect(paidInvoices.length).toBeGreaterThanOrEqual(1);
    });
  });
});

describe("Invoices Integration - Invoice Generation", () => {
  const ctx = setupIntegrationSuite();
  let client: Awaited<ReturnType<typeof createClient>>;
  let matter: Awaited<ReturnType<typeof createMatter>>;
  let feeEarner: Awaited<ReturnType<typeof createUser>>;

  beforeAll(async () => {
    client = await createClient({
      firmId: ctx.firmId,
      firstName: "Generation",
      lastName: "Test Client",
    });

    matter = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
      title: "Generation Test Matter",
    });

    feeEarner = await createUser({
      firmId: ctx.firmId,
      name: "Test Fee Earner",
    });
  });

  it("generates invoice from approved time entries", async () => {
    const entry1 = await createApprovedTimeEntry(ctx.firmId, matter.id, feeEarner.id, {
      description: "Client consultation",
      durationMinutes: 60,
      hourlyRate: "200.00",
    });

    const entry2 = await createApprovedTimeEntry(ctx.firmId, matter.id, feeEarner.id, {
      description: "Document review",
      durationMinutes: 120,
      hourlyRate: "200.00",
    });

    const result = await generateInvoiceTx(db, {
      firmId: ctx.firmId,
      clientId: client.id,
      matterId: matter.id,
      timeEntryIds: [entry1.id, entry2.id],
      invoiceDate: new Date(),
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    });

    expect(result.invoiceId).toBeDefined();
    expect(result.invoiceNumber).toMatch(/INV-\d{4}-[A-Z0-9]{4,8}/);

    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, result.invoiceId));

    expect(invoice.subtotal).toBe("600.00"); // 1hr + 2hrs at 200/hr
    expect(invoice.vatAmount).toBe("120.00"); // 20% VAT
    expect(invoice.total).toBe("720.00");
  });

  it("marks time entries as billed when included on invoice", async () => {
    const entry = await createApprovedTimeEntry(ctx.firmId, matter.id, feeEarner.id, {
      description: "Legal research",
      durationMinutes: 90,
      hourlyRate: "250.00",
    });

    const invoiceDate = new Date();
    const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const result = await generateInvoiceTx(db, {
      firmId: ctx.firmId,
      clientId: client.id,
      timeEntryIds: [entry.id],
      invoiceDate,
      dueDate,
    });

    const [updatedEntry] = await db.select().from(timeEntries).where(eq(timeEntries.id, entry.id));

    expect(updatedEntry.status).toBe("billed");
    expect(updatedEntry.invoiceId).toBe(result.invoiceId);
  });

  it("creates invoice line items for each time entry", async () => {
    const entry1 = await createApprovedTimeEntry(ctx.firmId, matter.id, feeEarner.id, {
      description: "Court appearance",
      amount: "500.00",
    });

    const entry2 = await createApprovedTimeEntry(ctx.firmId, matter.id, feeEarner.id, {
      description: "Client meeting",
      amount: "300.00",
    });

    const invoiceDate = new Date();
    const dueDate = new Date();

    const result = await generateInvoiceTx(db, {
      firmId: ctx.firmId,
      clientId: client.id,
      timeEntryIds: [entry1.id, entry2.id],
      invoiceDate,
      dueDate,
    });

    const items = await db
      .select()
      .from(invoiceLineItems)
      .where(eq(invoiceLineItems.invoiceId, result.invoiceId));

    expect(items.length).toBe(2);
    expect(items[0].description).toBe("Court appearance");
    expect(items[0].amount).toBe("500.00");
    expect(items[0].sourceType).toBe("time_entry");
    expect(items[1].description).toBe("Client meeting");
    expect(items[1].amount).toBe("300.00");
  });

  it("supports additional manual line items", async () => {
    const entry = await createApprovedTimeEntry(ctx.firmId, matter.id, feeEarner.id, {
      amount: "200.00",
    });

    const invoiceDate = new Date();
    const dueDate = new Date();

    const result = await generateInvoiceTx(db, {
      firmId: ctx.firmId,
      clientId: client.id,
      timeEntryIds: [entry.id],
      additionalItems: [
        { description: "Court filing fee", amount: "50.00" },
        { description: "Document courier", amount: "25.00" },
      ],
      invoiceDate,
      dueDate,
    });

    const items = await db
      .select()
      .from(invoiceLineItems)
      .where(eq(invoiceLineItems.invoiceId, result.invoiceId));

    expect(items.length).toBe(3); // 1 time entry + 2 manual items

    const manualItems = items.filter((item) => item.sourceType === "manual");
    expect(manualItems.length).toBe(2);
    expect(manualItems[0].description).toBe("Court filing fee");
    expect(manualItems[0].amount).toBe("50.00");
  });

  it("calculates total correctly with additional items", async () => {
    const entry = await createApprovedTimeEntry(ctx.firmId, matter.id, feeEarner.id, {
      amount: "1000.00",
    });

    const invoiceDate = new Date();
    const dueDate = new Date();

    const result = await generateInvoiceTx(db, {
      firmId: ctx.firmId,
      clientId: client.id,
      timeEntryIds: [entry.id],
      additionalItems: [{ description: "Disbursement", amount: "100.00" }],
      invoiceDate,
      dueDate,
    });

    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, result.invoiceId));

    expect(invoice.subtotal).toBe("1100.00"); // 1000 + 100
    expect(invoice.vatAmount).toBe("220.00"); // 20% of 1100
    expect(invoice.total).toBe("1320.00"); // 1100 + 220
  });

  it("only includes approved time entries", async () => {
    const approvedEntry = await createApprovedTimeEntry(ctx.firmId, matter.id, feeEarner.id);
    const { createTimeEntry } = await import("@tests/fixtures/factories/time-entry");
    const draftEntry = await createTimeEntry({
      firmId: ctx.firmId,
      matterId: matter.id,
      feeEarnerId: feeEarner.id,
      status: "draft",
    });

    const invoiceDate = new Date();
    const dueDate = new Date();

    await expect(
      generateInvoiceTx(db, {
        firmId: ctx.firmId,
        clientId: client.id,
        timeEntryIds: [approvedEntry.id, draftEntry.id],
        invoiceDate,
        dueDate,
      })
    ).rejects.toThrow("One or more time entries not eligible for invoicing");
  });

  it("prevents billing already billed time entries", async () => {
    const entry = await createApprovedTimeEntry(ctx.firmId, matter.id, feeEarner.id);

    const invoiceDate = new Date();
    const dueDate = new Date();

    // Bill the entry first
    await generateInvoiceTx(db, {
      firmId: ctx.firmId,
      clientId: client.id,
      timeEntryIds: [entry.id],
      invoiceDate,
      dueDate,
    });

    // Try to bill it again
    await expect(
      generateInvoiceTx(db, {
        firmId: ctx.firmId,
        clientId: client.id,
        timeEntryIds: [entry.id],
        invoiceDate,
        dueDate,
      })
    ).rejects.toThrow("One or more time entries not eligible for invoicing");
  });

  it("generates invoice for specific matter", async () => {
    const entry = await createApprovedTimeEntry(ctx.firmId, matter.id, feeEarner.id, {
      description: "Matter-specific work",
    });

    const invoiceDate = new Date();
    const dueDate = new Date();

    const result = await generateInvoiceTx(db, {
      firmId: ctx.firmId,
      clientId: client.id,
      matterId: matter.id,
      timeEntryIds: [entry.id],
      invoiceDate,
      dueDate,
    });

    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, result.invoiceId));

    expect(invoice.matterId).toBe(matter.id);
  });

  it("prevents billing time entries from different client", async () => {
    const otherClient = await createClient({
      firmId: ctx.firmId,
      firstName: "Other",
      lastName: "Client",
    });

    const otherMatter = await createMatter({
      firmId: ctx.firmId,
      clientId: otherClient.id,
      title: "Other Matter",
    });

    const entry = await createApprovedTimeEntry(ctx.firmId, otherMatter.id, feeEarner.id);

    const invoiceDate = new Date();
    const dueDate = new Date();

    await expect(
      generateInvoiceTx(db, {
        firmId: ctx.firmId,
        clientId: client.id, // Different client
        timeEntryIds: [entry.id],
        invoiceDate,
        dueDate,
      })
    ).rejects.toThrow("One or more time entries belong to a different client");
  });

  it("prevents billing time entries from different matter when matter specified", async () => {
    const matter2 = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
      title: "Second Matter",
    });

    const entry = await createApprovedTimeEntry(ctx.firmId, matter2.id, feeEarner.id);

    const invoiceDate = new Date();
    const dueDate = new Date();

    await expect(
      generateInvoiceTx(db, {
        firmId: ctx.firmId,
        clientId: client.id,
        matterId: matter.id, // Specify matter1, but entry is for matter2
        timeEntryIds: [entry.id],
        invoiceDate,
        dueDate,
      })
    ).rejects.toThrow("One or more time entries belong to a different matter");
  });

  it("generates invoice with notes", async () => {
    const entry = await createApprovedTimeEntry(ctx.firmId, matter.id, feeEarner.id);

    const invoiceDate = new Date();
    const dueDate = new Date();

    const result = await generateInvoiceTx(db, {
      firmId: ctx.firmId,
      clientId: client.id,
      timeEntryIds: [entry.id],
      notes: "Payment terms: 30 days net",
      invoiceDate,
      dueDate,
    });

    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, result.invoiceId));

    expect(invoice.notes).toBe("Payment terms: 30 days net");
  });
});

describe("Invoices Integration - Multi-Tenancy", () => {
  const ctx = setupFreshFirmPerTest();

  it("isolates invoices between firms", async () => {
    // Create data for first firm
    const client1 = await createClient({
      firmId: ctx.firmId,
      firstName: "Firm1",
      lastName: "Client",
    });
    const invoice1 = await createInvoice({
      firmId: ctx.firmId,
      clientId: client1.id,
    });

    // Create second firm with data
    const firm2 = await createFirm({ name: "Second Test Firm" });
    const client2 = await createClient({
      firmId: firm2.id,
      firstName: "Firm2",
      lastName: "Client",
    });
    const invoice2 = await createInvoice({
      firmId: firm2.id,
      clientId: client2.id,
    });

    // Query invoices for first firm
    const firm1Invoices = await db.select().from(invoices).where(eq(invoices.firmId, ctx.firmId));

    // Query invoices for second firm
    const firm2Invoices = await db.select().from(invoices).where(eq(invoices.firmId, firm2.id));

    // Each firm should only see their own invoices
    expect(firm1Invoices.some((inv) => inv.id === invoice1.id)).toBe(true);
    expect(firm1Invoices.some((inv) => inv.id === invoice2.id)).toBe(false);

    expect(firm2Invoices.some((inv) => inv.id === invoice2.id)).toBe(true);
    expect(firm2Invoices.some((inv) => inv.id === invoice1.id)).toBe(false);

    // Cleanup second firm
    await db.delete(invoices).where(eq(invoices.firmId, firm2.id));
    const { clients } = await import("@/lib/db/schema");
    await db.delete(clients).where(eq(clients.firmId, firm2.id));
    const { firms } = await import("@/lib/db/schema");
    await db.delete(firms).where(eq(firms.id, firm2.id));
  });

  it("prevents accessing invoices from another firm by ID", async () => {
    // Create invoice in first firm
    const client1 = await createClient({
      firmId: ctx.firmId,
      firstName: "Isolated",
      lastName: "Client",
    });
    const invoice1 = await createInvoice({
      firmId: ctx.firmId,
      clientId: client1.id,
    });

    // Create second firm
    const firm2 = await createFirm({ name: "Another Test Firm" });

    // Try to query invoice1 with firm2's firmId filter (simulating API check)
    const result = await db
      .select()
      .from(invoices)
      .where(and(eq(invoices.id, invoice1.id), eq(invoices.firmId, firm2.id)));

    // Should not find the invoice
    expect(result.length).toBe(0);

    // Cleanup second firm
    const { firms } = await import("@/lib/db/schema");
    await db.delete(firms).where(eq(firms.id, firm2.id));
  });
});

describe("Invoices Integration - Validation", () => {
  const ctx = setupIntegrationSuite();
  let client: Awaited<ReturnType<typeof createClient>>;

  beforeAll(async () => {
    client = await createClient({
      firmId: ctx.firmId,
      firstName: "Validation",
      lastName: "Test Client",
    });
  });

  it("requires valid client reference", async () => {
    const invalidClientId = "00000000-0000-0000-0000-000000000000";

    await expect(
      createInvoice({
        firmId: ctx.firmId,
        clientId: invalidClientId,
      })
    ).rejects.toThrow();
  });

  it("enforces unique invoice number per firm", async () => {
    const invoiceNumber = `INV-TEST-${Date.now()}`;

    await createInvoice({
      firmId: ctx.firmId,
      clientId: client.id,
      invoiceNumber,
    });

    // Try to create another invoice with same number in same firm
    await expect(
      createInvoice({
        firmId: ctx.firmId,
        clientId: client.id,
        invoiceNumber,
      })
    ).rejects.toThrow();
  });

  it("allows same invoice number in different firms", async () => {
    const invoiceNumber = `INV-SHARED-${Date.now()}`;

    const invoice1 = await createInvoice({
      firmId: ctx.firmId,
      clientId: client.id,
      invoiceNumber,
    });

    // Create second firm
    const firm2 = await createFirm({ name: "Second Firm" });
    const client2 = await createClient({
      firmId: firm2.id,
      firstName: "Firm2",
      lastName: "Client",
    });

    const invoice2 = await createInvoice({
      firmId: firm2.id,
      clientId: client2.id,
      invoiceNumber,
    });

    expect(invoice1.invoiceNumber).toBe(invoiceNumber);
    expect(invoice2.invoiceNumber).toBe(invoiceNumber);
    expect(invoice1.firmId).not.toBe(invoice2.firmId);

    // Cleanup
    await db.delete(invoices).where(eq(invoices.firmId, firm2.id));
    const { clients } = await import("@/lib/db/schema");
    await db.delete(clients).where(eq(clients.firmId, firm2.id));
    const { firms } = await import("@/lib/db/schema");
    await db.delete(firms).where(eq(firms.id, firm2.id));
  });
});

describe("Invoices Integration - Line Items", () => {
  const ctx = setupIntegrationSuite();
  let client: Awaited<ReturnType<typeof createClient>>;
  let invoice: Awaited<ReturnType<typeof createInvoice>>;

  beforeAll(async () => {
    client = await createClient({
      firmId: ctx.firmId,
      firstName: "LineItem",
      lastName: "Test Client",
    });

    invoice = await createInvoice({
      firmId: ctx.firmId,
      clientId: client.id,
    });
  });

  it("adds line item to invoice", async () => {
    const lineItem = await addInvoiceLineItem(ctx.firmId, invoice.id, {
      description: "Legal consultation",
      amount: "250.00",
    });

    expect(lineItem.id).toBeDefined();
    expect(lineItem.description).toBe("Legal consultation");
    expect(lineItem.amount).toBe("250.00");
  });

  it("adds multiple line items to invoice", async () => {
    const testInvoice = await createInvoice({
      firmId: ctx.firmId,
      clientId: client.id,
    });

    await addInvoiceLineItem(ctx.firmId, testInvoice.id, {
      description: "Item 1",
      amount: "100.00",
    });
    await addInvoiceLineItem(ctx.firmId, testInvoice.id, {
      description: "Item 2",
      amount: "200.00",
    });
    await addInvoiceLineItem(ctx.firmId, testInvoice.id, {
      description: "Item 3",
      amount: "300.00",
    });

    const items = await db
      .select()
      .from(invoiceLineItems)
      .where(eq(invoiceLineItems.invoiceId, testInvoice.id));

    expect(items.length).toBe(3);
  });

  it("stores source information for time entry line items", async () => {
    const matter = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
      title: "Test Matter",
    });
    const feeEarner = await createUser({ firmId: ctx.firmId, name: "Fee Earner" });
    const timeEntry = await createApprovedTimeEntry(ctx.firmId, matter.id, feeEarner.id);

    const lineItem = await addInvoiceLineItem(ctx.firmId, invoice.id, {
      description: "Time entry work",
      amount: "200.00",
      sourceType: "time_entry",
      sourceId: timeEntry.id,
    });

    expect(lineItem.id).toBeDefined();

    const [dbLineItem] = await db
      .select()
      .from(invoiceLineItems)
      .where(eq(invoiceLineItems.id, lineItem.id));

    expect(dbLineItem.sourceType).toBe("time_entry");
    expect(dbLineItem.sourceId).toBe(timeEntry.id);
  });
});
