/**
 * Clients Integration Tests
 *
 * Tests client CRUD operations against the real database.
 * Uses setupIntegrationSuite() to provide a test firm with cleanup.
 */
import { describe, it, expect } from "vitest";
import { db } from "@/lib/db";
import { clients } from "@/lib/db/schema";
import { eq, and, ilike } from "drizzle-orm";
import { setupIntegrationSuite, setupFreshFirmPerTest } from "@tests/integration/setup";
import {
  createClient,
  createIndividualClient,
  createCompanyClient,
  createManyClients,
} from "@tests/fixtures/factories/client";
import { createFirm } from "@tests/fixtures/factories/firm";

describe("Clients Integration - CRUD", () => {
  const ctx = setupIntegrationSuite();

  describe("Create", () => {
    it("creates an individual client with required fields", async () => {
      const client = await createIndividualClient(ctx.firmId, {
        firstName: "John",
        lastName: "Smith",
        email: "john.smith@example.com",
      });

      expect(client.id).toBeDefined();
      expect(client.firmId).toBe(ctx.firmId);
      expect(client.type).toBe("individual");
      expect(client.firstName).toBe("John");
      expect(client.lastName).toBe("Smith");
      expect(client.email).toBe("john.smith@example.com");
      expect(client.status).toBe("prospect");
      expect(client.country).toBe("United States");
    });

    it("creates a company client with companyName", async () => {
      const client = await createCompanyClient(ctx.firmId, {
        companyName: "Acme Legal Ltd",
        email: "info@acmelegal.co.uk",
      });

      expect(client.type).toBe("company");
      expect(client.companyName).toBe("Acme Legal Ltd");
      expect(client.firstName).toBeNull();
      expect(client.lastName).toBeNull();
    });

    it("generates unique reference for each client", async () => {
      const client1 = await createClient({ firmId: ctx.firmId });
      const client2 = await createClient({ firmId: ctx.firmId });

      expect(client1.reference).toBeDefined();
      expect(client2.reference).toBeDefined();
      expect(client1.reference).not.toBe(client2.reference);
    });

    it("persists client data to database", async () => {
      const client = await createClient({
        firmId: ctx.firmId,
        firstName: "Persist",
        lastName: "Test",
        email: "persist@test.com",
        phone: "+44 20 1234 5678",
        city: "London",
        postcode: "SW1A 1AA",
      });

      const [dbClient] = await db.select().from(clients).where(eq(clients.id, client.id));

      expect(dbClient).toBeDefined();
      expect(dbClient.firstName).toBe("Persist");
      expect(dbClient.lastName).toBe("Test");
      expect(dbClient.email).toBe("persist@test.com");
      expect(dbClient.phone).toBe("+44 20 1234 5678");
      expect(dbClient.city).toBe("London");
      expect(dbClient.postcode).toBe("SW1A 1AA");
    });
  });

  describe("Read", () => {
    it("retrieves client by ID", async () => {
      const created = await createClient({
        firmId: ctx.firmId,
        firstName: "Retrieve",
        lastName: "Test",
      });

      const [retrieved] = await db.select().from(clients).where(eq(clients.id, created.id));

      expect(retrieved).toBeDefined();
      expect(retrieved.id).toBe(created.id);
      expect(retrieved.firstName).toBe("Retrieve");
    });

    it("lists clients for a firm", async () => {
      // Create several clients
      await createClient({ firmId: ctx.firmId, firstName: "List1" });
      await createClient({ firmId: ctx.firmId, firstName: "List2" });
      await createClient({ firmId: ctx.firmId, firstName: "List3" });

      const firmClients = await db.select().from(clients).where(eq(clients.firmId, ctx.firmId));

      expect(firmClients.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe("Update", () => {
    it("updates client fields", async () => {
      const client = await createClient({
        firmId: ctx.firmId,
        firstName: "Original",
        lastName: "Name",
      });

      await db
        .update(clients)
        .set({
          firstName: "Updated",
          phone: "+44 20 9999 8888",
          notes: "Updated via test",
          updatedAt: new Date(),
        })
        .where(eq(clients.id, client.id));

      const [updated] = await db.select().from(clients).where(eq(clients.id, client.id));

      expect(updated.firstName).toBe("Updated");
      expect(updated.phone).toBe("+44 20 9999 8888");
      expect(updated.notes).toBe("Updated via test");
    });

    it("updates client status", async () => {
      const client = await createClient({ firmId: ctx.firmId });
      expect(client.status).toBe("prospect");

      await db
        .update(clients)
        .set({ status: "active", updatedAt: new Date() })
        .where(eq(clients.id, client.id));

      const [updated] = await db.select().from(clients).where(eq(clients.id, client.id));

      expect(updated.status).toBe("active");
    });
  });

  describe("Delete (Soft)", () => {
    it("archives client by setting status to archived", async () => {
      const client = await createClient({
        firmId: ctx.firmId,
        status: "active",
      });

      await db
        .update(clients)
        .set({ status: "archived", updatedAt: new Date() })
        .where(eq(clients.id, client.id));

      const [archived] = await db.select().from(clients).where(eq(clients.id, client.id));

      expect(archived.status).toBe("archived");
    });
  });
});

describe("Clients Integration - Search & Filter", () => {
  const ctx = setupIntegrationSuite();

  it("searches by firstName", async () => {
    await createClient({
      firmId: ctx.firmId,
      firstName: "UniqueSearchName",
      lastName: "Test",
    });

    const results = await db
      .select()
      .from(clients)
      .where(and(eq(clients.firmId, ctx.firmId), ilike(clients.firstName, "%UniqueSearchName%")));

    expect(results.length).toBe(1);
    expect(results[0].firstName).toBe("UniqueSearchName");
  });

  it("searches by lastName", async () => {
    await createClient({
      firmId: ctx.firmId,
      firstName: "Test",
      lastName: "UniqueLastName123",
    });

    const results = await db
      .select()
      .from(clients)
      .where(and(eq(clients.firmId, ctx.firmId), ilike(clients.lastName, "%UniqueLastName123%")));

    expect(results.length).toBe(1);
    expect(results[0].lastName).toBe("UniqueLastName123");
  });

  it("searches by companyName", async () => {
    await createCompanyClient(ctx.firmId, {
      companyName: "UniqueCompanyXYZ Ltd",
    });

    const results = await db
      .select()
      .from(clients)
      .where(and(eq(clients.firmId, ctx.firmId), ilike(clients.companyName, "%UniqueCompanyXYZ%")));

    expect(results.length).toBe(1);
    expect(results[0].companyName).toBe("UniqueCompanyXYZ Ltd");
  });

  it("filters by status", async () => {
    await createClient({ firmId: ctx.firmId, status: "active" });
    await createClient({ firmId: ctx.firmId, status: "active" });
    await createClient({ firmId: ctx.firmId, status: "dormant" });

    const activeClients = await db
      .select()
      .from(clients)
      .where(and(eq(clients.firmId, ctx.firmId), eq(clients.status, "active")));

    const dormantClients = await db
      .select()
      .from(clients)
      .where(and(eq(clients.firmId, ctx.firmId), eq(clients.status, "dormant")));

    expect(activeClients.length).toBeGreaterThanOrEqual(2);
    expect(dormantClients.length).toBeGreaterThanOrEqual(1);
  });

  it("filters by type", async () => {
    await createIndividualClient(ctx.firmId);
    await createCompanyClient(ctx.firmId);

    const individuals = await db
      .select()
      .from(clients)
      .where(and(eq(clients.firmId, ctx.firmId), eq(clients.type, "individual")));

    const companies = await db
      .select()
      .from(clients)
      .where(and(eq(clients.firmId, ctx.firmId), eq(clients.type, "company")));

    expect(individuals.length).toBeGreaterThanOrEqual(1);
    expect(companies.length).toBeGreaterThanOrEqual(1);
  });
});

describe("Clients Integration - Pagination", () => {
  const ctx = setupIntegrationSuite();

  it("paginates results correctly", async () => {
    // Create enough clients for pagination
    await createManyClients(ctx.firmId, 15);

    // First page
    const page1 = await db
      .select()
      .from(clients)
      .where(eq(clients.firmId, ctx.firmId))
      .limit(5)
      .offset(0);

    // Second page
    const page2 = await db
      .select()
      .from(clients)
      .where(eq(clients.firmId, ctx.firmId))
      .limit(5)
      .offset(5);

    expect(page1.length).toBe(5);
    expect(page2.length).toBe(5);

    // Pages should have different clients
    const page1Ids = page1.map((c) => c.id);
    const page2Ids = page2.map((c) => c.id);
    const overlap = page1Ids.filter((id) => page2Ids.includes(id));
    expect(overlap.length).toBe(0);
  });
});

describe("Clients Integration - Multi-Tenancy", () => {
  const ctx = setupFreshFirmPerTest();

  it("isolates clients between firms", async () => {
    // Create client in first firm (ctx.firm)
    const client1 = await createClient({
      firmId: ctx.firmId,
      firstName: "Firm1",
      lastName: "Client",
    });

    // Create second firm
    const firm2 = await createFirm({ name: "Second Test Firm" });

    // Create client in second firm
    const client2 = await createClient({
      firmId: firm2.id,
      firstName: "Firm2",
      lastName: "Client",
    });

    // Query clients for first firm
    const firm1Clients = await db.select().from(clients).where(eq(clients.firmId, ctx.firmId));

    // Query clients for second firm
    const firm2Clients = await db.select().from(clients).where(eq(clients.firmId, firm2.id));

    // Each firm should only see their own clients
    expect(firm1Clients.some((c) => c.id === client1.id)).toBe(true);
    expect(firm1Clients.some((c) => c.id === client2.id)).toBe(false);

    expect(firm2Clients.some((c) => c.id === client2.id)).toBe(true);
    expect(firm2Clients.some((c) => c.id === client1.id)).toBe(false);

    // Cleanup second firm
    await db.delete(clients).where(eq(clients.firmId, firm2.id));
    const { firms } = await import("@/lib/db/schema");
    await db.delete(firms).where(eq(firms.id, firm2.id));
  });

  it("prevents accessing clients from another firm by ID", async () => {
    // Create client in first firm
    const client1 = await createClient({
      firmId: ctx.firmId,
      firstName: "Isolated",
      lastName: "Client",
    });

    // Create second firm
    const firm2 = await createFirm({ name: "Another Test Firm" });

    // Try to query client1 with firm2's firmId filter (simulating API check)
    const result = await db
      .select()
      .from(clients)
      .where(
        and(
          eq(clients.id, client1.id),
          eq(clients.firmId, firm2.id) // Wrong firm
        )
      );

    // Should not find the client
    expect(result.length).toBe(0);

    // Cleanup second firm
    const { firms } = await import("@/lib/db/schema");
    await db.delete(firms).where(eq(firms.id, firm2.id));
  });
});

describe("Clients Integration - Data Integrity", () => {
  const ctx = setupIntegrationSuite();

  it("enforces unique reference per firm", async () => {
    const reference = `CLI-UNIQUE-${Date.now()}`;

    // Create first client with reference
    await createClient({
      firmId: ctx.firmId,
      reference,
    });

    // Attempt to create second client with same reference should fail
    await expect(
      createClient({
        firmId: ctx.firmId,
        reference,
      })
    ).rejects.toThrow();
  });

  it("allows same reference in different firms", async () => {
    const reference = `CLI-SHARED-${Date.now()}`;

    // Create client in first firm
    const client1 = await createClient({
      firmId: ctx.firmId,
      reference,
    });

    // Create second firm
    const firm2 = await createFirm({ name: "Ref Test Firm" });

    // Create client in second firm with same reference - should work
    const client2 = await createClient({
      firmId: firm2.id,
      reference,
    });

    expect(client1.reference).toBe(reference);
    expect(client2.reference).toBe(reference);
    expect(client1.firmId).not.toBe(client2.firmId);

    // Cleanup
    await db.delete(clients).where(eq(clients.firmId, firm2.id));
    const { firms } = await import("@/lib/db/schema");
    await db.delete(firms).where(eq(firms.id, firm2.id));
  });
});
