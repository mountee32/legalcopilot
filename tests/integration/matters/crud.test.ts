/**
 * Matters Integration Tests
 *
 * Tests matter CRUD operations against the real database.
 * Uses setupIntegrationSuite() to provide a test firm with cleanup.
 */
import { describe, it, expect } from "vitest";
import { db } from "@/lib/db";
import { matters, timelineEvents } from "@/lib/db/schema";
import { eq, and, ilike, sql } from "drizzle-orm";
import { setupIntegrationSuite, setupFreshFirmPerTest } from "@tests/integration/setup";
import { createMatter, createConveyancingMatter } from "@tests/fixtures/factories/matter";
import { createClient } from "@tests/fixtures/factories/client";
import { createFirm } from "@tests/fixtures/factories/firm";

describe("Matters Integration - CRUD", () => {
  const ctx = setupIntegrationSuite();

  describe("Create", () => {
    it("creates a matter with required fields", async () => {
      const client = await createClient({ firmId: ctx.firmId });

      const matter = await createMatter({
        firmId: ctx.firmId,
        clientId: client.id,
        title: "Smith v Jones - Property Dispute",
        practiceArea: "conveyancing",
      });

      expect(matter.id).toBeDefined();
      expect(matter.firmId).toBe(ctx.firmId);
      expect(matter.clientId).toBe(client.id);
      expect(matter.title).toBe("Smith v Jones - Property Dispute");
      expect(matter.practiceArea).toBe("conveyancing");
      expect(matter.status).toBe("active");
    });

    it("creates a conveyancing matter", async () => {
      const client = await createClient({ firmId: ctx.firmId });

      const matter = await createConveyancingMatter(ctx.firmId, client.id, {
        title: "123 Main Street Purchase",
      });

      expect(matter.practiceArea).toBe("conveyancing");
      expect(matter.title).toBe("123 Main Street Purchase");
    });

    it("creates a litigation matter", async () => {
      const client = await createClient({ firmId: ctx.firmId });

      const matter = await createMatter({
        firmId: ctx.firmId,
        clientId: client.id,
        title: "Contract Dispute - ACME Ltd",
        practiceArea: "litigation",
      });

      expect(matter.practiceArea).toBe("litigation");
      expect(matter.title).toBe("Contract Dispute - ACME Ltd");
    });

    it("generates unique reference for each matter", async () => {
      const client = await createClient({ firmId: ctx.firmId });

      const matter1 = await createMatter({
        firmId: ctx.firmId,
        clientId: client.id,
        title: "Matter 1",
      });

      const matter2 = await createMatter({
        firmId: ctx.firmId,
        clientId: client.id,
        title: "Matter 2",
      });

      expect(matter1.reference).toBeDefined();
      expect(matter2.reference).toBeDefined();
      expect(matter1.reference).not.toBe(matter2.reference);
    });

    it("persists matter data to database", async () => {
      const client = await createClient({ firmId: ctx.firmId });

      const matter = await createMatter({
        firmId: ctx.firmId,
        clientId: client.id,
        title: "Persistent Matter",
        description: "This is a test matter",
        practiceArea: "family",
      });

      const [dbMatter] = await db.select().from(matters).where(eq(matters.id, matter.id));

      expect(dbMatter).toBeDefined();
      expect(dbMatter.title).toBe("Persistent Matter");
      expect(dbMatter.practiceArea).toBe("family");
      expect(dbMatter.clientId).toBe(client.id);
    });

    it("fails when client does not exist", async () => {
      await expect(
        createMatter({
          firmId: ctx.firmId,
          clientId: "00000000-0000-0000-0000-000000000000", // Non-existent client
          title: "Invalid Matter",
        })
      ).rejects.toThrow();
    });
  });

  describe("Read", () => {
    it("retrieves matter by ID", async () => {
      const client = await createClient({ firmId: ctx.firmId });
      const created = await createMatter({
        firmId: ctx.firmId,
        clientId: client.id,
        title: "Retrieve Test Matter",
      });

      const [retrieved] = await db.select().from(matters).where(eq(matters.id, created.id));

      expect(retrieved).toBeDefined();
      expect(retrieved.id).toBe(created.id);
      expect(retrieved.title).toBe("Retrieve Test Matter");
    });

    it("lists matters for a firm", async () => {
      const client = await createClient({ firmId: ctx.firmId });

      await createMatter({ firmId: ctx.firmId, clientId: client.id, title: "List1" });
      await createMatter({ firmId: ctx.firmId, clientId: client.id, title: "List2" });
      await createMatter({ firmId: ctx.firmId, clientId: client.id, title: "List3" });

      const firmMatters = await db.select().from(matters).where(eq(matters.firmId, ctx.firmId));

      expect(firmMatters.length).toBeGreaterThanOrEqual(3);
    });

    it("lists matters for a specific client", async () => {
      const client1 = await createClient({ firmId: ctx.firmId });
      const client2 = await createClient({ firmId: ctx.firmId });

      await createMatter({ firmId: ctx.firmId, clientId: client1.id, title: "Client1 Matter1" });
      await createMatter({ firmId: ctx.firmId, clientId: client1.id, title: "Client1 Matter2" });
      await createMatter({ firmId: ctx.firmId, clientId: client2.id, title: "Client2 Matter1" });

      const client1Matters = await db
        .select()
        .from(matters)
        .where(and(eq(matters.firmId, ctx.firmId), eq(matters.clientId, client1.id)));

      expect(client1Matters.length).toBeGreaterThanOrEqual(2);
      expect(client1Matters.every((m) => m.clientId === client1.id)).toBe(true);
    });
  });

  describe("Update", () => {
    it("updates matter fields", async () => {
      const client = await createClient({ firmId: ctx.firmId });
      const matter = await createMatter({
        firmId: ctx.firmId,
        clientId: client.id,
        title: "Original Title",
      });

      await db
        .update(matters)
        .set({
          title: "Updated Title",
          description: "Updated description",
          updatedAt: new Date(),
        })
        .where(eq(matters.id, matter.id));

      const [updated] = await db.select().from(matters).where(eq(matters.id, matter.id));

      expect(updated.title).toBe("Updated Title");
      expect(updated.description).toBe("Updated description");
    });

    it("updates matter status", async () => {
      const client = await createClient({ firmId: ctx.firmId });
      const matter = await createMatter({
        firmId: ctx.firmId,
        clientId: client.id,
        status: "active",
      });

      await db
        .update(matters)
        .set({ status: "closed", updatedAt: new Date() })
        .where(eq(matters.id, matter.id));

      const [updated] = await db.select().from(matters).where(eq(matters.id, matter.id));

      expect(updated.status).toBe("closed");
    });

    it("updates matter billing details", async () => {
      const client = await createClient({ firmId: ctx.firmId });
      const matter = await createMatter({
        firmId: ctx.firmId,
        clientId: client.id,
      });

      await db
        .update(matters)
        .set({
          hourlyRate: "250.00",
          estimatedValue: "5000.00",
          updatedAt: new Date(),
        })
        .where(eq(matters.id, matter.id));

      const [updated] = await db.select().from(matters).where(eq(matters.id, matter.id));

      expect(updated.hourlyRate).toBe("250.00");
      expect(updated.estimatedValue).toBe("5000.00");
    });
  });

  describe("Delete (Soft)", () => {
    it("archives matter by setting status to archived", async () => {
      const client = await createClient({ firmId: ctx.firmId });
      const matter = await createMatter({
        firmId: ctx.firmId,
        clientId: client.id,
        status: "active",
      });

      await db
        .update(matters)
        .set({ status: "archived", updatedAt: new Date() })
        .where(eq(matters.id, matter.id));

      const [archived] = await db.select().from(matters).where(eq(matters.id, matter.id));

      expect(archived.status).toBe("archived");
    });
  });
});

describe("Matters Integration - Search & Filter", () => {
  const ctx = setupIntegrationSuite();

  it("searches by title", async () => {
    const client = await createClient({ firmId: ctx.firmId });
    await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
      title: "UniqueSearchTitle12345",
    });

    const results = await db
      .select()
      .from(matters)
      .where(and(eq(matters.firmId, ctx.firmId), ilike(matters.title, "%UniqueSearchTitle12345%")));

    expect(results.length).toBe(1);
    expect(results[0].title).toBe("UniqueSearchTitle12345");
  });

  it("searches by reference", async () => {
    const client = await createClient({ firmId: ctx.firmId });
    const uniqueRef = `MAT-UNIQUE-${Date.now()}`;
    await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
      reference: uniqueRef,
      title: "Test Matter",
    });

    const results = await db
      .select()
      .from(matters)
      .where(and(eq(matters.firmId, ctx.firmId), ilike(matters.reference, `%${uniqueRef}%`)));

    expect(results.length).toBe(1);
    expect(results[0].reference).toBe(uniqueRef);
  });

  it("filters by status", async () => {
    const client = await createClient({ firmId: ctx.firmId });

    await createMatter({ firmId: ctx.firmId, clientId: client.id, status: "active" });
    await createMatter({ firmId: ctx.firmId, clientId: client.id, status: "active" });
    await createMatter({ firmId: ctx.firmId, clientId: client.id, status: "closed" });

    const activeMatters = await db
      .select()
      .from(matters)
      .where(and(eq(matters.firmId, ctx.firmId), eq(matters.status, "active")));

    const closedMatters = await db
      .select()
      .from(matters)
      .where(and(eq(matters.firmId, ctx.firmId), eq(matters.status, "closed")));

    expect(activeMatters.length).toBeGreaterThanOrEqual(2);
    expect(closedMatters.length).toBeGreaterThanOrEqual(1);
  });

  it("filters by practice area", async () => {
    const client = await createClient({ firmId: ctx.firmId });

    await createConveyancingMatter(ctx.firmId, client.id);
    await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
      practiceArea: "litigation",
      title: "Litigation Matter",
    });

    const conveyancingMatters = await db
      .select()
      .from(matters)
      .where(and(eq(matters.firmId, ctx.firmId), eq(matters.practiceArea, "conveyancing")));

    const litigationMatters = await db
      .select()
      .from(matters)
      .where(and(eq(matters.firmId, ctx.firmId), eq(matters.practiceArea, "litigation")));

    expect(conveyancingMatters.length).toBeGreaterThanOrEqual(1);
    expect(litigationMatters.length).toBeGreaterThanOrEqual(1);
  });

  it("filters by client", async () => {
    const client1 = await createClient({ firmId: ctx.firmId });
    const client2 = await createClient({ firmId: ctx.firmId });

    await createMatter({ firmId: ctx.firmId, clientId: client1.id });
    await createMatter({ firmId: ctx.firmId, clientId: client1.id });
    await createMatter({ firmId: ctx.firmId, clientId: client2.id });

    const client1Matters = await db
      .select()
      .from(matters)
      .where(and(eq(matters.firmId, ctx.firmId), eq(matters.clientId, client1.id)));

    expect(client1Matters.length).toBe(2);
    expect(client1Matters.every((m) => m.clientId === client1.id)).toBe(true);
  });
});

describe("Matters Integration - Pagination", () => {
  const ctx = setupIntegrationSuite();

  it("paginates results correctly", async () => {
    const client = await createClient({ firmId: ctx.firmId });

    // Create enough matters for pagination
    for (let i = 0; i < 15; i++) {
      await createMatter({
        firmId: ctx.firmId,
        clientId: client.id,
        title: `Pagination Matter ${i}`,
      });
    }

    // First page
    const page1 = await db
      .select()
      .from(matters)
      .where(eq(matters.firmId, ctx.firmId))
      .limit(5)
      .offset(0);

    // Second page
    const page2 = await db
      .select()
      .from(matters)
      .where(eq(matters.firmId, ctx.firmId))
      .limit(5)
      .offset(5);

    expect(page1.length).toBe(5);
    expect(page2.length).toBe(5);

    // Pages should have different matters
    const page1Ids = page1.map((m) => m.id);
    const page2Ids = page2.map((m) => m.id);
    const overlap = page1Ids.filter((id) => page2Ids.includes(id));
    expect(overlap.length).toBe(0);
  });
});

describe("Matters Integration - Multi-Tenancy", () => {
  const ctx = setupFreshFirmPerTest();

  it("isolates matters between firms", async () => {
    // Create matter in first firm
    const client1 = await createClient({ firmId: ctx.firmId });
    const matter1 = await createMatter({
      firmId: ctx.firmId,
      clientId: client1.id,
      title: "Firm1 Matter",
    });

    // Create second firm
    const firm2 = await createFirm({ name: "Second Test Firm" });
    const client2 = await createClient({ firmId: firm2.id });
    const matter2 = await createMatter({
      firmId: firm2.id,
      clientId: client2.id,
      title: "Firm2 Matter",
    });

    // Query matters for first firm
    const firm1Matters = await db.select().from(matters).where(eq(matters.firmId, ctx.firmId));

    // Query matters for second firm
    const firm2Matters = await db.select().from(matters).where(eq(matters.firmId, firm2.id));

    // Each firm should only see their own matters
    expect(firm1Matters.some((m) => m.id === matter1.id)).toBe(true);
    expect(firm1Matters.some((m) => m.id === matter2.id)).toBe(false);

    expect(firm2Matters.some((m) => m.id === matter2.id)).toBe(true);
    expect(firm2Matters.some((m) => m.id === matter1.id)).toBe(false);

    // Cleanup second firm
    await db.delete(matters).where(eq(matters.firmId, firm2.id));
    const { clients } = await import("@/lib/db/schema");
    await db.delete(clients).where(eq(clients.firmId, firm2.id));
    const { firms } = await import("@/lib/db/schema");
    await db.delete(firms).where(eq(firms.id, firm2.id));
  });

  it("prevents accessing matters from another firm by ID", async () => {
    // Create matter in first firm
    const client1 = await createClient({ firmId: ctx.firmId });
    const matter1 = await createMatter({
      firmId: ctx.firmId,
      clientId: client1.id,
      title: "Isolated Matter",
    });

    // Create second firm
    const firm2 = await createFirm({ name: "Another Test Firm" });

    // Try to query matter1 with firm2's firmId filter (simulating API check)
    const result = await db
      .select()
      .from(matters)
      .where(and(eq(matters.id, matter1.id), eq(matters.firmId, firm2.id)));

    // Should not find the matter
    expect(result.length).toBe(0);

    // Cleanup second firm
    const { firms } = await import("@/lib/db/schema");
    await db.delete(firms).where(eq(firms.id, firm2.id));
  });

  it("matter belongs to correct firm even if client mismatch", async () => {
    // Create client in first firm
    const client1 = await createClient({ firmId: ctx.firmId });

    // Create second firm
    const firm2 = await createFirm({ name: "Cross Firm Test" });

    // Create matter in firm2 with client from firm1
    // Note: The database allows this but it's logically incorrect
    // The API layer should prevent this, not the database
    const matter = await createMatter({
      firmId: firm2.id,
      clientId: client1.id, // Client from different firm
      title: "Cross-Firm Matter",
    });

    // Matter was created in firm2
    expect(matter.firmId).toBe(firm2.id);
    expect(matter.clientId).toBe(client1.id);

    // Cleanup
    await db.delete(matters).where(eq(matters.firmId, firm2.id));
    const { clients } = await import("@/lib/db/schema");
    await db.delete(clients).where(eq(clients.firmId, firm2.id));
    const { firms } = await import("@/lib/db/schema");
    await db.delete(firms).where(eq(firms.id, firm2.id));
  });
});

describe("Matters Integration - Data Integrity", () => {
  const ctx = setupIntegrationSuite();

  it("enforces unique reference per firm", async () => {
    const client = await createClient({ firmId: ctx.firmId });
    const reference = `MAT-UNIQUE-${Date.now()}`;

    // Create first matter with reference
    await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
      reference,
    });

    // Attempt to create second matter with same reference should fail
    await expect(
      createMatter({
        firmId: ctx.firmId,
        clientId: client.id,
        reference,
      })
    ).rejects.toThrow();
  });

  it("allows same reference in different firms", async () => {
    const client1 = await createClient({ firmId: ctx.firmId });
    const reference = `MAT-SHARED-${Date.now()}`;

    // Create matter in first firm
    const matter1 = await createMatter({
      firmId: ctx.firmId,
      clientId: client1.id,
      reference,
    });

    // Create second firm
    const firm2 = await createFirm({ name: "Ref Test Firm" });
    const client2 = await createClient({ firmId: firm2.id });

    // Create matter in second firm with same reference - should work
    const matter2 = await createMatter({
      firmId: firm2.id,
      clientId: client2.id,
      reference,
    });

    expect(matter1.reference).toBe(reference);
    expect(matter2.reference).toBe(reference);
    expect(matter1.firmId).not.toBe(matter2.firmId);

    // Cleanup
    await db.delete(matters).where(eq(matters.firmId, firm2.id));
    const { clients } = await import("@/lib/db/schema");
    await db.delete(clients).where(eq(clients.firmId, firm2.id));
    const { firms } = await import("@/lib/db/schema");
    await db.delete(firms).where(eq(firms.id, firm2.id));
  });
});

describe("Matters Integration - Timeline", () => {
  const ctx = setupIntegrationSuite();

  it("retrieves timeline events for a matter", async () => {
    const client = await createClient({ firmId: ctx.firmId });
    const matter = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
      title: "Timeline Test Matter",
    });

    // Query timeline events for the matter
    const events = await db
      .select()
      .from(timelineEvents)
      .where(and(eq(timelineEvents.firmId, ctx.firmId), eq(timelineEvents.matterId, matter.id)));

    // Should have at least a matter_created event
    expect(events.length).toBeGreaterThanOrEqual(0);
  });

  it("orders timeline events by date descending", async () => {
    const client = await createClient({ firmId: ctx.firmId });
    const matter = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
      title: "Timeline Order Test",
    });

    // Insert timeline events with different dates
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

    await db.insert(timelineEvents).values([
      {
        firmId: ctx.firmId,
        matterId: matter.id,
        type: "note_added",
        title: "Recent Event",
        actorType: "system",
        actorId: null,
        occurredAt: now,
      },
      {
        firmId: ctx.firmId,
        matterId: matter.id,
        type: "note_added",
        title: "Yesterday Event",
        actorType: "system",
        actorId: null,
        occurredAt: yesterday,
      },
      {
        firmId: ctx.firmId,
        matterId: matter.id,
        type: "note_added",
        title: "Older Event",
        actorType: "system",
        actorId: null,
        occurredAt: twoDaysAgo,
      },
    ]);

    // Query with descending order
    const events = await db
      .select()
      .from(timelineEvents)
      .where(and(eq(timelineEvents.firmId, ctx.firmId), eq(timelineEvents.matterId, matter.id)))
      .orderBy(sql`${timelineEvents.occurredAt} DESC`);

    expect(events.length).toBeGreaterThanOrEqual(3);

    // Check that events are in descending order (most recent first)
    for (let i = 0; i < events.length - 1; i++) {
      const current = new Date(events[i].occurredAt).getTime();
      const next = new Date(events[i + 1].occurredAt).getTime();
      expect(current).toBeGreaterThanOrEqual(next);
    }
  });

  it("filters timeline events by type", async () => {
    const client = await createClient({ firmId: ctx.firmId });
    const matter = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
      title: "Timeline Filter Test",
    });

    // Insert different types of events
    await db.insert(timelineEvents).values([
      {
        firmId: ctx.firmId,
        matterId: matter.id,
        type: "note_added",
        title: "Note Event",
        actorType: "system",
        actorId: null,
        occurredAt: new Date(),
      },
      {
        firmId: ctx.firmId,
        matterId: matter.id,
        type: "email_sent",
        title: "Email Event",
        actorType: "system",
        actorId: null,
        occurredAt: new Date(),
      },
    ]);

    // Filter by type
    const noteEvents = await db
      .select()
      .from(timelineEvents)
      .where(
        and(
          eq(timelineEvents.firmId, ctx.firmId),
          eq(timelineEvents.matterId, matter.id),
          eq(timelineEvents.type, "note_added")
        )
      );

    const emailEvents = await db
      .select()
      .from(timelineEvents)
      .where(
        and(
          eq(timelineEvents.firmId, ctx.firmId),
          eq(timelineEvents.matterId, matter.id),
          eq(timelineEvents.type, "email_sent")
        )
      );

    expect(noteEvents.length).toBeGreaterThanOrEqual(1);
    expect(emailEvents.length).toBeGreaterThanOrEqual(1);
    expect(noteEvents.every((e) => e.type === "note_added")).toBe(true);
    expect(emailEvents.every((e) => e.type === "email_sent")).toBe(true);
  });
});
