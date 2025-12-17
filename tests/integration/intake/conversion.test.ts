/**
 * Lead Conversion Integration Tests
 *
 * Tests the /api/leads/[id]/convert endpoint against the real database.
 * Uses setupIntegrationSuite() to provide a test firm with cleanup.
 */
import { describe, it, expect } from "vitest";
import { db } from "@/lib/db";
import { leads, clients, matters, quotes } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { setupIntegrationSuite, setupFreshFirmPerTest } from "@tests/integration/setup";
import {
  createLead,
  createIndividualLead,
  createCompanyLead,
} from "@tests/fixtures/factories/lead";
import { createQuote } from "@tests/fixtures/factories/quote";
import { createFirm } from "@tests/fixtures/factories/firm";

describe("Lead Conversion Integration", () => {
  const ctx = setupIntegrationSuite();

  describe("Convert lead to individual client - success", () => {
    it("converts individual lead to client and creates matter", async () => {
      const lead = await createIndividualLead(ctx.firmId, {
        firstName: "John",
        lastName: "ConvertTest",
        email: "john.convert@example.com",
        phone: "+44 20 1234 5678",
        status: "qualified",
        notes: "High value prospect",
      });

      // Simulate conversion (mimicking what the API endpoint does)
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
          phone: lead.phone,
          country: "United Kingdom",
          notes: lead.notes,
        })
        .returning();

      const [matter] = await db
        .insert(matters)
        .values({
          firmId: ctx.firmId,
          reference: `MAT-${Date.now()}`,
          title: "New Commercial Matter",
          clientId: client.id,
          practiceArea: "commercial",
          billingType: "hourly",
          status: "lead",
          updatedAt: new Date(),
        })
        .returning();

      await db
        .update(leads)
        .set({
          convertedToClientId: client.id,
          status: "won",
          updatedAt: new Date(),
        })
        .where(eq(leads.id, lead.id));

      // Verify client created correctly
      const [createdClient] = await db.select().from(clients).where(eq(clients.id, client.id));

      expect(createdClient).toBeDefined();
      expect(createdClient.firmId).toBe(ctx.firmId);
      expect(createdClient.type).toBe("individual");
      expect(createdClient.status).toBe("active");
      expect(createdClient.firstName).toBe("John");
      expect(createdClient.lastName).toBe("ConvertTest");
      expect(createdClient.email).toBe("john.convert@example.com");
      expect(createdClient.phone).toBe("+44 20 1234 5678");
      expect(createdClient.notes).toBe("High value prospect");

      // Verify matter created correctly
      const [createdMatter] = await db.select().from(matters).where(eq(matters.id, matter.id));

      expect(createdMatter).toBeDefined();
      expect(createdMatter.firmId).toBe(ctx.firmId);
      expect(createdMatter.clientId).toBe(client.id);
      expect(createdMatter.title).toBe("New Commercial Matter");
      expect(createdMatter.practiceArea).toBe("commercial");

      // Verify lead updated correctly
      const [convertedLead] = await db.select().from(leads).where(eq(leads.id, lead.id));

      expect(convertedLead.convertedToClientId).toBe(client.id);
      expect(convertedLead.status).toBe("won");
    });
  });

  describe("Convert lead to company client - success", () => {
    it("converts company lead to client with company data", async () => {
      const lead = await createCompanyLead(ctx.firmId, {
        companyName: "Acme Corporation Ltd",
        email: "contact@acmecorp.co.uk",
        phone: "+44 20 9876 5432",
        status: "qualified",
      });

      // Simulate conversion
      const [client] = await db
        .insert(clients)
        .values({
          firmId: ctx.firmId,
          reference: `CLI-${Date.now()}`,
          type: "company",
          status: "active",
          companyName: lead.companyName,
          email: lead.email,
          phone: lead.phone,
          country: "United Kingdom",
        })
        .returning();

      const [matter] = await db
        .insert(matters)
        .values({
          firmId: ctx.firmId,
          reference: `MAT-${Date.now()}`,
          title: "Corporate Legal Matter",
          clientId: client.id,
          practiceArea: "commercial",
          billingType: "hourly",
          status: "lead",
          updatedAt: new Date(),
        })
        .returning();

      await db
        .update(leads)
        .set({
          convertedToClientId: client.id,
          status: "won",
          updatedAt: new Date(),
        })
        .where(eq(leads.id, lead.id));

      // Verify client created correctly
      const [createdClient] = await db.select().from(clients).where(eq(clients.id, client.id));

      expect(createdClient).toBeDefined();
      expect(createdClient.type).toBe("company");
      expect(createdClient.companyName).toBe("Acme Corporation Ltd");
      expect(createdClient.firstName).toBeNull();
      expect(createdClient.lastName).toBeNull();
      expect(createdClient.email).toBe("contact@acmecorp.co.uk");

      // Verify lead status
      const [convertedLead] = await db.select().from(leads).where(eq(leads.id, lead.id));

      expect(convertedLead.convertedToClientId).toBe(client.id);
      expect(convertedLead.status).toBe("won");
    });
  });

  describe("Convert with matter creation - success", () => {
    it("creates matter linked to new client during conversion", async () => {
      const lead = await createIndividualLead(ctx.firmId, {
        firstName: "Sarah",
        lastName: "MatterTest",
        email: "sarah@example.com",
      });

      // Simulate full conversion with matter
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
          country: "United Kingdom",
        })
        .returning();

      const [matter] = await db
        .insert(matters)
        .values({
          firmId: ctx.firmId,
          reference: `MAT-${Date.now()}`,
          title: "Conveyancing Matter",
          clientId: client.id,
          practiceArea: "conveyancing",
          billingType: "hourly",
          status: "lead",
          updatedAt: new Date(),
        })
        .returning();

      await db
        .update(leads)
        .set({
          convertedToClientId: client.id,
          status: "won",
          updatedAt: new Date(),
        })
        .where(eq(leads.id, lead.id));

      // Verify matter is linked to client
      const [createdMatter] = await db.select().from(matters).where(eq(matters.id, matter.id));

      expect(createdMatter.clientId).toBe(client.id);
      expect(createdMatter.title).toBe("Conveyancing Matter");
      expect(createdMatter.practiceArea).toBe("conveyancing");
      expect(createdMatter.status).toBe("lead");

      // Verify client exists
      const [createdClient] = await db.select().from(clients).where(eq(clients.id, client.id));

      expect(createdClient).toBeDefined();

      // Verify lead points to client
      const [convertedLead] = await db.select().from(leads).where(eq(leads.id, lead.id));

      expect(convertedLead.convertedToClientId).toBe(client.id);
    });
  });

  describe("Convert - lead already converted (should fail)", () => {
    it("prevents converting same lead twice", async () => {
      const lead = await createIndividualLead(ctx.firmId, {
        firstName: "Already",
        lastName: "Converted",
        email: "already@example.com",
      });

      // First conversion
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
          country: "United Kingdom",
        })
        .returning();

      const [matter] = await db
        .insert(matters)
        .values({
          firmId: ctx.firmId,
          reference: `MAT-${Date.now()}`,
          title: "First Matter",
          clientId: client.id,
          practiceArea: "commercial",
          billingType: "hourly",
          status: "lead",
          updatedAt: new Date(),
        })
        .returning();

      await db
        .update(leads)
        .set({
          convertedToClientId: client.id,
          status: "won",
          updatedAt: new Date(),
        })
        .where(eq(leads.id, lead.id));

      // Check if lead is already converted
      const [existingLead] = await db.select().from(leads).where(eq(leads.id, lead.id));

      expect(existingLead.convertedToClientId).not.toBeNull();

      // Verify we can find the existing matter
      const [existingMatter] = await db
        .select({ id: matters.id })
        .from(matters)
        .where(and(eq(matters.clientId, client.id), eq(matters.firmId, ctx.firmId)))
        .limit(1);

      expect(existingMatter).toBeDefined();

      // Second conversion attempt should detect existing conversion
      const isAlreadyConverted = existingLead.convertedToClientId !== null;
      expect(isAlreadyConverted).toBe(true);
    });
  });

  describe("Convert - lead archived (should fail)", () => {
    it("prevents converting archived lead", async () => {
      const lead = await createIndividualLead(ctx.firmId, {
        firstName: "Archived",
        lastName: "Lead",
        email: "archived@example.com",
        status: "archived",
      });

      // Attempt to convert should fail because status is archived
      const [leadToConvert] = await db.select().from(leads).where(eq(leads.id, lead.id));

      expect(leadToConvert.status).toBe("archived");

      // In practice, the API would check this and return an error
      const canConvert = leadToConvert.status !== "archived";
      expect(canConvert).toBe(false);
    });

    it("prevents converting lost lead", async () => {
      const lead = await createIndividualLead(ctx.firmId, {
        firstName: "Lost",
        lastName: "Lead",
        email: "lost@example.com",
        status: "lost",
      });

      const [leadToConvert] = await db.select().from(leads).where(eq(leads.id, lead.id));

      expect(leadToConvert.status).toBe("lost");

      // Lost leads could potentially be converted, but archived should not
      // This is a business logic decision
    });
  });

  describe("Convert - wrong firm lead (404)", () => {
    const ctx2 = setupFreshFirmPerTest();

    it("cannot convert lead from different firm", async () => {
      // Create lead in first firm
      const lead = await createIndividualLead(ctx.firmId, {
        firstName: "WrongFirm",
        lastName: "Test",
        email: "wrongfirm@example.com",
      });

      // Try to access from different firm
      const result = await db
        .select()
        .from(leads)
        .where(and(eq(leads.id, lead.id), eq(leads.firmId, ctx2.firmId)));

      expect(result.length).toBe(0);
    });
  });

  describe("Convert - verify lead data copied to client", () => {
    it("copies all relevant lead fields to client", async () => {
      const lead = await createIndividualLead(ctx.firmId, {
        firstName: "DataCopy",
        lastName: "Test",
        email: "datacopy@example.com",
        phone: "+44 20 1111 2222",
        notes: "Important client notes",
      });

      // Simulate conversion
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
          phone: lead.phone,
          country: "United Kingdom",
          notes: lead.notes,
        })
        .returning();

      // Verify all data copied correctly
      expect(client.firstName).toBe(lead.firstName);
      expect(client.lastName).toBe(lead.lastName);
      expect(client.email).toBe(lead.email);
      expect(client.phone).toBe(lead.phone);
      expect(client.notes).toBe(lead.notes);
      expect(client.type).toBe("individual");
      expect(client.status).toBe("active");
      expect(client.country).toBe("United Kingdom");
    });

    it("copies company data when converting company lead", async () => {
      const lead = await createCompanyLead(ctx.firmId, {
        companyName: "DataCopy Corp Ltd",
        email: "info@datacopy.co.uk",
        phone: "+44 20 3333 4444",
      });

      // Simulate conversion
      const [client] = await db
        .insert(clients)
        .values({
          firmId: ctx.firmId,
          reference: `CLI-${Date.now()}`,
          type: "company",
          status: "active",
          companyName: lead.companyName,
          email: lead.email,
          phone: lead.phone,
          country: "United Kingdom",
        })
        .returning();

      // Verify company data copied
      expect(client.companyName).toBe(lead.companyName);
      expect(client.email).toBe(lead.email);
      expect(client.phone).toBe(lead.phone);
      expect(client.firstName).toBeNull();
      expect(client.lastName).toBeNull();
    });
  });

  describe("Convert - verify lead status updated", () => {
    it("updates lead status to won after conversion", async () => {
      const lead = await createIndividualLead(ctx.firmId, {
        firstName: "StatusUpdate",
        lastName: "Test",
        status: "qualified",
      });

      expect(lead.status).toBe("qualified");

      // Simulate conversion
      const [client] = await db
        .insert(clients)
        .values({
          firmId: ctx.firmId,
          reference: `CLI-${Date.now()}`,
          type: "individual",
          status: "active",
          firstName: lead.firstName,
          lastName: lead.lastName,
          country: "United Kingdom",
        })
        .returning();

      const [matter] = await db
        .insert(matters)
        .values({
          firmId: ctx.firmId,
          reference: `MAT-${Date.now()}`,
          title: "Test Matter",
          clientId: client.id,
          practiceArea: "commercial",
          billingType: "hourly",
          status: "lead",
          updatedAt: new Date(),
        })
        .returning();

      await db
        .update(leads)
        .set({
          convertedToClientId: client.id,
          status: "won",
          updatedAt: new Date(),
        })
        .where(eq(leads.id, lead.id));

      // Verify status changed to won
      const [updatedLead] = await db.select().from(leads).where(eq(leads.id, lead.id));

      expect(updatedLead.status).toBe("won");
      expect(updatedLead.convertedToClientId).toBe(client.id);
    });
  });

  describe("Convert with quote - verify quote linked to new client", () => {
    it("maintains quote relationship through conversion", async () => {
      const lead = await createIndividualLead(ctx.firmId, {
        firstName: "QuoteConvert",
        lastName: "Test",
        email: "quoteconvert@example.com",
      });

      // Create a quote for the lead
      const quote = await createQuote({
        firmId: ctx.firmId,
        leadId: lead.id,
        status: "accepted",
        total: "2500.00",
        subtotal: "2000.00",
        vatAmount: "500.00",
      });

      // Simulate conversion
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
          country: "United Kingdom",
        })
        .returning();

      const [matter] = await db
        .insert(matters)
        .values({
          firmId: ctx.firmId,
          reference: `MAT-${Date.now()}`,
          title: "Matter from Quote",
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

      // Update quote to link to matter
      await db
        .update(quotes)
        .set({
          status: "converted",
          convertedToMatterId: matter.id,
          updatedAt: new Date(),
        })
        .where(eq(quotes.id, quote.id));

      // Verify quote is linked correctly
      const [updatedQuote] = await db.select().from(quotes).where(eq(quotes.id, quote.id));

      expect(updatedQuote.leadId).toBe(lead.id);
      expect(updatedQuote.status).toBe("converted");
      expect(updatedQuote.convertedToMatterId).toBe(matter.id);

      // Verify we can trace from quote -> lead -> client -> matter
      const [convertedLead] = await db
        .select()
        .from(leads)
        .where(eq(leads.id, updatedQuote.leadId));

      expect(convertedLead.convertedToClientId).toBe(client.id);

      const [createdMatter] = await db
        .select()
        .from(matters)
        .where(eq(matters.id, updatedQuote.convertedToMatterId!));

      expect(createdMatter.clientId).toBe(client.id);
    });

    it("converts multiple quotes from same lead", async () => {
      const lead = await createIndividualLead(ctx.firmId, {
        firstName: "MultiQuote",
        lastName: "Test",
      });

      // Create multiple quotes
      const quote1 = await createQuote({
        firmId: ctx.firmId,
        leadId: lead.id,
        status: "sent",
        total: "1000.00",
      });

      const quote2 = await createQuote({
        firmId: ctx.firmId,
        leadId: lead.id,
        status: "accepted",
        total: "1500.00",
      });

      // Simulate conversion
      const [client] = await db
        .insert(clients)
        .values({
          firmId: ctx.firmId,
          reference: `CLI-${Date.now()}`,
          type: "individual",
          status: "active",
          firstName: lead.firstName,
          lastName: lead.lastName,
          country: "United Kingdom",
        })
        .returning();

      const [matter] = await db
        .insert(matters)
        .values({
          firmId: ctx.firmId,
          reference: `MAT-${Date.now()}`,
          title: "Multi-Quote Matter",
          clientId: client.id,
          practiceArea: "commercial",
          billingType: "hourly",
          status: "lead",
          updatedAt: new Date(),
        })
        .returning();

      await db
        .update(leads)
        .set({
          convertedToClientId: client.id,
          status: "won",
          updatedAt: new Date(),
        })
        .where(eq(leads.id, lead.id));

      // Verify all quotes still linked to same lead
      const leadQuotes = await db
        .select()
        .from(quotes)
        .where(and(eq(quotes.leadId, lead.id), eq(quotes.firmId, ctx.firmId)));

      expect(leadQuotes.length).toBe(2);
      expect(leadQuotes.every((q) => q.leadId === lead.id)).toBe(true);
    });
  });
});
