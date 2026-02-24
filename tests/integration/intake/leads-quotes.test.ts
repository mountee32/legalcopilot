/**
 * Leads & Quotes Integration Tests
 *
 * Tests lead and quote CRUD operations against the real database.
 * Uses setupIntegrationSuite() to provide a test firm with cleanup.
 */
import { describe, it, expect } from "vitest";
import { db } from "@/lib/db";
import { leads, quotes, clients, matters } from "@/lib/db/schema";
import { eq, and, ilike } from "drizzle-orm";
import { setupIntegrationSuite, setupFreshFirmPerTest } from "@tests/integration/setup";
import {
  createLead,
  createIndividualLead,
  createCompanyLead,
  createManyLeads,
} from "@tests/fixtures/factories/lead";
import {
  createQuote,
  createQuoteWithItems,
  createManyQuotes,
} from "@tests/fixtures/factories/quote";
import { createFirm } from "@tests/fixtures/factories/firm";
import { createClient } from "@tests/fixtures/factories/client";

describe("Leads Integration - CRUD", () => {
  const ctx = setupIntegrationSuite();

  describe("Create", () => {
    it("creates an individual lead with contact info", async () => {
      const lead = await createIndividualLead(ctx.firmId, {
        firstName: "John",
        lastName: "Prospect",
        email: "john.prospect@example.com",
        phone: "+44 20 1234 5678",
      });

      expect(lead.id).toBeDefined();
      expect(lead.firmId).toBe(ctx.firmId);
      expect(lead.firstName).toBe("John");
      expect(lead.lastName).toBe("Prospect");
      expect(lead.email).toBe("john.prospect@example.com");
      expect(lead.phone).toBe("+44 20 1234 5678");
      expect(lead.status).toBe("new");
      expect(lead.companyName).toBeNull();
    });

    it("creates a company lead with companyName", async () => {
      const lead = await createCompanyLead(ctx.firmId, {
        companyName: "Acme Corp",
        email: "info@acmecorp.co.uk",
      });

      expect(lead.id).toBeDefined();
      expect(lead.firmId).toBe(ctx.firmId);
      expect(lead.companyName).toBe("Acme Corp");
      expect(lead.firstName).toBeNull();
      expect(lead.lastName).toBeNull();
      expect(lead.status).toBe("new");
    });

    it("creates lead with source and score", async () => {
      const lead = await createLead({
        firmId: ctx.firmId,
        firstName: "Jane",
        lastName: "Smith",
        source: "website",
        score: 85,
      });

      expect(lead.source).toBe("website");
      expect(lead.score).toBe(85);
    });

    it("persists lead data to database", async () => {
      const lead = await createLead({
        firmId: ctx.firmId,
        firstName: "Test",
        lastName: "Persist",
        email: "persist@test.com",
        notes: "High value prospect",
      });

      const [dbLead] = await db.select().from(leads).where(eq(leads.id, lead.id));

      expect(dbLead).toBeDefined();
      expect(dbLead.firstName).toBe("Test");
      expect(dbLead.lastName).toBe("Persist");
      expect(dbLead.email).toBe("persist@test.com");
      expect(dbLead.notes).toBe("High value prospect");
    });
  });

  describe("Read", () => {
    it("retrieves lead by ID", async () => {
      const created = await createLead({
        firmId: ctx.firmId,
        firstName: "Retrieve",
        lastName: "Test",
      });

      const [retrieved] = await db.select().from(leads).where(eq(leads.id, created.id));

      expect(retrieved).toBeDefined();
      expect(retrieved.id).toBe(created.id);
      expect(retrieved.firstName).toBe("Retrieve");
    });

    it("lists leads for a firm", async () => {
      await createLead({ firmId: ctx.firmId, firstName: "Lead1" });
      await createLead({ firmId: ctx.firmId, firstName: "Lead2" });
      await createLead({ firmId: ctx.firmId, firstName: "Lead3" });

      const firmLeads = await db.select().from(leads).where(eq(leads.firmId, ctx.firmId));

      expect(firmLeads.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe("Update", () => {
    it("updates lead fields", async () => {
      const lead = await createLead({
        firmId: ctx.firmId,
        firstName: "Original",
        lastName: "Name",
        status: "new",
      });

      await db
        .update(leads)
        .set({
          firstName: "Updated",
          status: "contacted",
          notes: "Contacted via phone",
          updatedAt: new Date(),
        })
        .where(eq(leads.id, lead.id));

      const [updated] = await db.select().from(leads).where(eq(leads.id, lead.id));

      expect(updated.firstName).toBe("Updated");
      expect(updated.status).toBe("contacted");
      expect(updated.notes).toBe("Contacted via phone");
    });

    it("updates lead status through workflow", async () => {
      const lead = await createLead({ firmId: ctx.firmId, status: "new" });

      // Simulate workflow: new -> contacted -> qualified
      await db
        .update(leads)
        .set({ status: "contacted", updatedAt: new Date() })
        .where(eq(leads.id, lead.id));

      let [updated] = await db.select().from(leads).where(eq(leads.id, lead.id));
      expect(updated.status).toBe("contacted");

      await db
        .update(leads)
        .set({ status: "qualified", updatedAt: new Date() })
        .where(eq(leads.id, lead.id));

      [updated] = await db.select().from(leads).where(eq(leads.id, lead.id));
      expect(updated.status).toBe("qualified");
    });
  });

  describe("Delete (Soft)", () => {
    it("archives lead by setting status to archived", async () => {
      const lead = await createLead({
        firmId: ctx.firmId,
        status: "lost",
      });

      await db
        .update(leads)
        .set({ status: "archived", updatedAt: new Date() })
        .where(eq(leads.id, lead.id));

      const [archived] = await db.select().from(leads).where(eq(leads.id, lead.id));

      expect(archived.status).toBe("archived");
    });
  });
});

describe("Leads Integration - Search & Filter", () => {
  const ctx = setupIntegrationSuite();

  it("searches by firstName", async () => {
    await createLead({
      firmId: ctx.firmId,
      firstName: "UniqueFirstName",
      lastName: "Test",
    });

    const results = await db
      .select()
      .from(leads)
      .where(and(eq(leads.firmId, ctx.firmId), ilike(leads.firstName, "%UniqueFirstName%")));

    expect(results.length).toBe(1);
    expect(results[0].firstName).toBe("UniqueFirstName");
  });

  it("searches by lastName", async () => {
    await createLead({
      firmId: ctx.firmId,
      firstName: "Test",
      lastName: "UniqueLastName789",
    });

    const results = await db
      .select()
      .from(leads)
      .where(and(eq(leads.firmId, ctx.firmId), ilike(leads.lastName, "%UniqueLastName789%")));

    expect(results.length).toBe(1);
    expect(results[0].lastName).toBe("UniqueLastName789");
  });

  it("searches by companyName", async () => {
    await createCompanyLead(ctx.firmId, {
      companyName: "UniqueCompany123 Ltd",
    });

    const results = await db
      .select()
      .from(leads)
      .where(and(eq(leads.firmId, ctx.firmId), ilike(leads.companyName, "%UniqueCompany123%")));

    expect(results.length).toBe(1);
    expect(results[0].companyName).toBe("UniqueCompany123 Ltd");
  });

  it("filters by status", async () => {
    await createLead({ firmId: ctx.firmId, status: "new" });
    await createLead({ firmId: ctx.firmId, status: "new" });
    await createLead({ firmId: ctx.firmId, status: "qualified" });

    const newLeads = await db
      .select()
      .from(leads)
      .where(and(eq(leads.firmId, ctx.firmId), eq(leads.status, "new")));

    const qualifiedLeads = await db
      .select()
      .from(leads)
      .where(and(eq(leads.firmId, ctx.firmId), eq(leads.status, "qualified")));

    expect(newLeads.length).toBeGreaterThanOrEqual(2);
    expect(qualifiedLeads.length).toBeGreaterThanOrEqual(1);
  });

  it("filters by source", async () => {
    await createLead({ firmId: ctx.firmId, source: "website" });
    await createLead({ firmId: ctx.firmId, source: "referral" });

    const websiteLeads = await db
      .select()
      .from(leads)
      .where(and(eq(leads.firmId, ctx.firmId), eq(leads.source, "website")));

    expect(websiteLeads.length).toBeGreaterThanOrEqual(1);
    expect(websiteLeads[0].source).toBe("website");
  });
});

describe("Leads Integration - Multi-Tenancy", () => {
  const ctx = setupFreshFirmPerTest();

  it("isolates leads between firms", async () => {
    const lead1 = await createLead({
      firmId: ctx.firmId,
      firstName: "Firm1",
      lastName: "Lead",
    });

    const firm2 = await createFirm({ name: "Second Test Firm" });
    const lead2 = await createLead({
      firmId: firm2.id,
      firstName: "Firm2",
      lastName: "Lead",
    });

    const firm1Leads = await db.select().from(leads).where(eq(leads.firmId, ctx.firmId));
    const firm2Leads = await db.select().from(leads).where(eq(leads.firmId, firm2.id));

    expect(firm1Leads.some((l) => l.id === lead1.id)).toBe(true);
    expect(firm1Leads.some((l) => l.id === lead2.id)).toBe(false);

    expect(firm2Leads.some((l) => l.id === lead2.id)).toBe(true);
    expect(firm2Leads.some((l) => l.id === lead1.id)).toBe(false);

    // Cleanup second firm
    await db.delete(leads).where(eq(leads.firmId, firm2.id));
    const { firms } = await import("@/lib/db/schema");
    await db.delete(firms).where(eq(firms.id, firm2.id));
  });

  it("prevents accessing leads from another firm by ID", async () => {
    const lead1 = await createLead({
      firmId: ctx.firmId,
      firstName: "Isolated",
      lastName: "Lead",
    });

    const firm2 = await createFirm({ name: "Another Test Firm" });

    const result = await db
      .select()
      .from(leads)
      .where(and(eq(leads.id, lead1.id), eq(leads.firmId, firm2.id)));

    expect(result.length).toBe(0);

    // Cleanup second firm
    const { firms } = await import("@/lib/db/schema");
    await db.delete(firms).where(eq(firms.id, firm2.id));
  });
});

describe("Leads Integration - Lead Conversion", () => {
  const ctx = setupIntegrationSuite();

  it("converts lead to client", async () => {
    const lead = await createLead({
      firmId: ctx.firmId,
      firstName: "Convert",
      lastName: "Test",
      email: "convert@test.com",
      status: "qualified",
    });

    // Create client from lead
    const [client] = await db
      .insert(clients)
      .values({
        firmId: ctx.firmId,
        reference: `CLI-${Date.now()}`,
        type: "individual",
        status: "active",
        firstName: lead.firstName,
        lastName: lead.lastName,
        email: lead.email,
        country: "United States",
      })
      .returning();

    // Update lead to mark as converted
    await db
      .update(leads)
      .set({
        convertedToClientId: client.id,
        status: "won",
        updatedAt: new Date(),
      })
      .where(eq(leads.id, lead.id));

    const [convertedLead] = await db.select().from(leads).where(eq(leads.id, lead.id));

    expect(convertedLead.convertedToClientId).toBe(client.id);
    expect(convertedLead.status).toBe("won");

    const [createdClient] = await db.select().from(clients).where(eq(clients.id, client.id));
    expect(createdClient.firstName).toBe("Convert");
    expect(createdClient.lastName).toBe("Test");
  });

  it("conversion creates both client and matter", async () => {
    const lead = await createLead({
      firmId: ctx.firmId,
      firstName: "Full",
      lastName: "Conversion",
      email: "full@test.com",
    });

    // Create client
    const [client] = await db
      .insert(clients)
      .values({
        firmId: ctx.firmId,
        reference: `CLI-${Date.now()}`,
        type: "individual",
        status: "active",
        firstName: lead.firstName,
        lastName: lead.lastName,
        email: lead.email,
        country: "United States",
      })
      .returning();

    // Create matter
    const [matter] = await db
      .insert(matters)
      .values({
        firmId: ctx.firmId,
        reference: `MAT-${Date.now()}`,
        title: "New Matter from Lead",
        clientId: client.id,
        practiceArea: "commercial",
        billingType: "hourly",
        status: "lead",
        updatedAt: new Date(),
      })
      .returning();

    // Update lead
    await db
      .update(leads)
      .set({
        convertedToClientId: client.id,
        status: "won",
        updatedAt: new Date(),
      })
      .where(eq(leads.id, lead.id));

    const [convertedLead] = await db.select().from(leads).where(eq(leads.id, lead.id));
    const [createdClient] = await db.select().from(clients).where(eq(clients.id, client.id));
    const [createdMatter] = await db.select().from(matters).where(eq(matters.id, matter.id));

    expect(convertedLead.convertedToClientId).toBe(client.id);
    expect(createdClient).toBeDefined();
    expect(createdMatter).toBeDefined();
    expect(createdMatter.clientId).toBe(client.id);
  });
});

describe("Quotes Integration - CRUD", () => {
  const ctx = setupIntegrationSuite();

  describe("Create", () => {
    it("creates quote for a lead", async () => {
      const lead = await createLead({
        firmId: ctx.firmId,
        firstName: "Quote",
        lastName: "Test",
      });

      const quote = await createQuote({
        firmId: ctx.firmId,
        leadId: lead.id,
        total: "1200.00",
      });

      expect(quote.id).toBeDefined();
      expect(quote.firmId).toBe(ctx.firmId);
      expect(quote.leadId).toBe(lead.id);
      expect(quote.status).toBe("draft");
      expect(quote.total).toBe("1200.00");
    });

    it("creates quote with line items", async () => {
      const lead = await createLead({ firmId: ctx.firmId });

      const quote = await createQuoteWithItems(ctx.firmId, lead.id, {
        items: [
          { description: "Consultation", quantity: 1, rate: "500.00", amount: "500.00" },
          { description: "Document prep", quantity: 2, rate: "250.00", amount: "500.00" },
        ],
        subtotal: "1000.00",
        vatAmount: "200.00",
        total: "1200.00",
      });

      expect(quote.items).toBeDefined();
      expect(Array.isArray(quote.items)).toBe(true);
      expect(quote.items).toHaveLength(2);
      expect(quote.subtotal).toBe("1000.00");
      expect(quote.vatAmount).toBe("200.00");
      expect(quote.total).toBe("1200.00");
    });

    it("persists quote data to database", async () => {
      const lead = await createLead({ firmId: ctx.firmId });
      const quote = await createQuote({
        firmId: ctx.firmId,
        leadId: lead.id,
        total: "500.00",
        notes: "Discounted rate for new client",
      });

      const [dbQuote] = await db.select().from(quotes).where(eq(quotes.id, quote.id));

      expect(dbQuote).toBeDefined();
      expect(dbQuote.leadId).toBe(lead.id);
      expect(dbQuote.total).toBe("500.00");
      expect(dbQuote.notes).toBe("Discounted rate for new client");
    });
  });

  describe("Read", () => {
    it("retrieves quote by ID", async () => {
      const lead = await createLead({ firmId: ctx.firmId });
      const created = await createQuote({
        firmId: ctx.firmId,
        leadId: lead.id,
        total: "750.00",
      });

      const [retrieved] = await db.select().from(quotes).where(eq(quotes.id, created.id));

      expect(retrieved).toBeDefined();
      expect(retrieved.id).toBe(created.id);
      expect(retrieved.total).toBe("750.00");
    });

    it("lists quotes for a lead", async () => {
      const lead = await createLead({ firmId: ctx.firmId });
      await createQuote({ firmId: ctx.firmId, leadId: lead.id, total: "1000.00" });
      await createQuote({ firmId: ctx.firmId, leadId: lead.id, total: "1500.00" });

      const leadQuotes = await db
        .select()
        .from(quotes)
        .where(and(eq(quotes.firmId, ctx.firmId), eq(quotes.leadId, lead.id)));

      expect(leadQuotes.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("Update", () => {
    it("updates quote amounts", async () => {
      const lead = await createLead({ firmId: ctx.firmId });
      const quote = await createQuote({
        firmId: ctx.firmId,
        leadId: lead.id,
        subtotal: "1000.00",
        vatAmount: "200.00",
        total: "1200.00",
      });

      await db
        .update(quotes)
        .set({
          subtotal: "1500.00",
          vatAmount: "300.00",
          total: "1800.00",
          updatedAt: new Date(),
        })
        .where(eq(quotes.id, quote.id));

      const [updated] = await db.select().from(quotes).where(eq(quotes.id, quote.id));

      expect(updated.subtotal).toBe("1500.00");
      expect(updated.vatAmount).toBe("300.00");
      expect(updated.total).toBe("1800.00");
    });

    it("updates quote status", async () => {
      const lead = await createLead({ firmId: ctx.firmId });
      const quote = await createQuote({
        firmId: ctx.firmId,
        leadId: lead.id,
        status: "draft",
        total: "1000.00",
      });

      await db
        .update(quotes)
        .set({ status: "sent", updatedAt: new Date() })
        .where(eq(quotes.id, quote.id));

      const [updated] = await db.select().from(quotes).where(eq(quotes.id, quote.id));
      expect(updated.status).toBe("sent");
    });
  });
});

describe("Quotes Integration - Workflow", () => {
  const ctx = setupIntegrationSuite();

  it("sends quote to lead (draft -> sent)", async () => {
    const lead = await createLead({ firmId: ctx.firmId });
    const quote = await createQuote({
      firmId: ctx.firmId,
      leadId: lead.id,
      status: "draft",
      total: "1000.00",
    });

    await db
      .update(quotes)
      .set({ status: "sent", updatedAt: new Date() })
      .where(eq(quotes.id, quote.id));

    const [sentQuote] = await db.select().from(quotes).where(eq(quotes.id, quote.id));
    expect(sentQuote.status).toBe("sent");
  });

  it("marks quote as accepted", async () => {
    const lead = await createLead({ firmId: ctx.firmId });
    const quote = await createQuote({
      firmId: ctx.firmId,
      leadId: lead.id,
      status: "sent",
      total: "1000.00",
    });

    await db
      .update(quotes)
      .set({ status: "accepted", updatedAt: new Date() })
      .where(eq(quotes.id, quote.id));

    const [acceptedQuote] = await db.select().from(quotes).where(eq(quotes.id, quote.id));
    expect(acceptedQuote.status).toBe("accepted");
  });

  it("marks quote as rejected", async () => {
    const lead = await createLead({ firmId: ctx.firmId });
    const quote = await createQuote({
      firmId: ctx.firmId,
      leadId: lead.id,
      status: "sent",
      total: "1000.00",
    });

    await db
      .update(quotes)
      .set({ status: "rejected", updatedAt: new Date() })
      .where(eq(quotes.id, quote.id));

    const [rejectedQuote] = await db.select().from(quotes).where(eq(quotes.id, quote.id));
    expect(rejectedQuote.status).toBe("rejected");
  });

  it("accepted quote can trigger conversion", async () => {
    const lead = await createLead({
      firmId: ctx.firmId,
      firstName: "Accept",
      lastName: "Quote",
    });
    const quote = await createQuote({
      firmId: ctx.firmId,
      leadId: lead.id,
      status: "sent",
      total: "1000.00",
    });

    // Accept quote
    await db
      .update(quotes)
      .set({ status: "accepted", updatedAt: new Date() })
      .where(eq(quotes.id, quote.id));

    // Create client
    const [client] = await db
      .insert(clients)
      .values({
        firmId: ctx.firmId,
        reference: `CLI-${Date.now()}`,
        type: "individual",
        status: "active",
        firstName: lead.firstName,
        lastName: lead.lastName,
        country: "United States",
      })
      .returning();

    // Create matter
    const [matter] = await db
      .insert(matters)
      .values({
        firmId: ctx.firmId,
        reference: `MAT-${Date.now()}`,
        title: "Matter from accepted quote",
        clientId: client.id,
        practiceArea: "commercial",
        billingType: "hourly",
        status: "lead",
        updatedAt: new Date(),
      })
      .returning();

    // Update quote and lead
    await db
      .update(quotes)
      .set({ status: "converted", convertedToMatterId: matter.id, updatedAt: new Date() })
      .where(eq(quotes.id, quote.id));

    await db
      .update(leads)
      .set({ convertedToClientId: client.id, status: "won", updatedAt: new Date() })
      .where(eq(leads.id, lead.id));

    const [convertedQuote] = await db.select().from(quotes).where(eq(quotes.id, quote.id));
    const [convertedLead] = await db.select().from(leads).where(eq(leads.id, lead.id));

    expect(convertedQuote.status).toBe("converted");
    expect(convertedQuote.convertedToMatterId).toBe(matter.id);
    expect(convertedLead.convertedToClientId).toBe(client.id);
    expect(convertedLead.status).toBe("won");
  });
});

describe("Quotes Integration - Multi-Tenancy", () => {
  const ctx = setupFreshFirmPerTest();

  it("isolates quotes between firms", async () => {
    const lead1 = await createLead({ firmId: ctx.firmId });
    const quote1 = await createQuote({
      firmId: ctx.firmId,
      leadId: lead1.id,
      total: "1000.00",
    });

    const firm2 = await createFirm({ name: "Second Test Firm" });
    const lead2 = await createLead({ firmId: firm2.id });
    const quote2 = await createQuote({
      firmId: firm2.id,
      leadId: lead2.id,
      total: "2000.00",
    });

    const firm1Quotes = await db.select().from(quotes).where(eq(quotes.firmId, ctx.firmId));
    const firm2Quotes = await db.select().from(quotes).where(eq(quotes.firmId, firm2.id));

    expect(firm1Quotes.some((q) => q.id === quote1.id)).toBe(true);
    expect(firm1Quotes.some((q) => q.id === quote2.id)).toBe(false);

    expect(firm2Quotes.some((q) => q.id === quote2.id)).toBe(true);
    expect(firm2Quotes.some((q) => q.id === quote1.id)).toBe(false);

    // Cleanup second firm
    await db.delete(quotes).where(eq(quotes.firmId, firm2.id));
    await db.delete(leads).where(eq(leads.firmId, firm2.id));
    const { firms } = await import("@/lib/db/schema");
    await db.delete(firms).where(eq(firms.id, firm2.id));
  });

  it("cannot access quotes from another firm's leads", async () => {
    const lead1 = await createLead({ firmId: ctx.firmId });
    const quote1 = await createQuote({
      firmId: ctx.firmId,
      leadId: lead1.id,
      total: "1000.00",
    });

    const firm2 = await createFirm({ name: "Another Test Firm" });

    const result = await db
      .select()
      .from(quotes)
      .where(and(eq(quotes.id, quote1.id), eq(quotes.firmId, firm2.id)));

    expect(result.length).toBe(0);

    // Cleanup second firm
    const { firms } = await import("@/lib/db/schema");
    await db.delete(firms).where(eq(firms.id, firm2.id));
  });
});

describe("Quotes Integration - Filtering", () => {
  const ctx = setupIntegrationSuite();

  it("filters quotes by status", async () => {
    const lead = await createLead({ firmId: ctx.firmId });
    await createQuote({ firmId: ctx.firmId, leadId: lead.id, status: "draft", total: "1000.00" });
    await createQuote({ firmId: ctx.firmId, leadId: lead.id, status: "sent", total: "1200.00" });

    const draftQuotes = await db
      .select()
      .from(quotes)
      .where(and(eq(quotes.firmId, ctx.firmId), eq(quotes.status, "draft")));

    const sentQuotes = await db
      .select()
      .from(quotes)
      .where(and(eq(quotes.firmId, ctx.firmId), eq(quotes.status, "sent")));

    expect(draftQuotes.length).toBeGreaterThanOrEqual(1);
    expect(sentQuotes.length).toBeGreaterThanOrEqual(1);
  });

  it("filters quotes by leadId", async () => {
    const lead1 = await createLead({ firmId: ctx.firmId });
    const lead2 = await createLead({ firmId: ctx.firmId });

    await createQuote({ firmId: ctx.firmId, leadId: lead1.id, total: "1000.00" });
    await createQuote({ firmId: ctx.firmId, leadId: lead1.id, total: "1500.00" });
    await createQuote({ firmId: ctx.firmId, leadId: lead2.id, total: "2000.00" });

    const lead1Quotes = await db
      .select()
      .from(quotes)
      .where(and(eq(quotes.firmId, ctx.firmId), eq(quotes.leadId, lead1.id)));

    const lead2Quotes = await db
      .select()
      .from(quotes)
      .where(and(eq(quotes.firmId, ctx.firmId), eq(quotes.leadId, lead2.id)));

    expect(lead1Quotes.length).toBe(2);
    expect(lead2Quotes.length).toBe(1);
  });
});
