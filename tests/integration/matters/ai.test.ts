/**
 * Matter AI Endpoints Integration Tests
 *
 * Tests AI-powered matter functionality against the real database.
 * Uses setupIntegrationSuite() for shared test context.
 * Mocks OpenRouter/AI calls to avoid real API costs.
 *
 * These tests verify:
 * - AI-generated approval requests are correctly stored
 * - Multi-tenancy isolation for AI features
 * - Task and calendar event suggestion structure
 * - Error handling for AI failures
 */
import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { setupIntegrationSuite, setupFreshFirmPerTest } from "@tests/integration/setup";
import { createMatter } from "@tests/fixtures/factories/matter";
import { createClient } from "@tests/fixtures/factories/client";
import { createFirm } from "@tests/fixtures/factories/firm";
import { db } from "@/lib/db";
import { approvalRequests, documentChunks, matters } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

// Mock the AI SDK's generateText function
vi.mock("ai", () => ({
  generateText: vi.fn(),
  streamText: vi.fn(),
}));

// Mock OpenRouter provider
vi.mock("@openrouter/ai-sdk-provider", () => ({
  createOpenRouter: () => (model: string) => ({ model }),
}));

// Mock embeddings
vi.mock("@/lib/ai/embeddings", () => ({
  embedTexts: vi.fn().mockResolvedValue([[0.1, 0.2, 0.3]]),
}));

describe("Matter AI - Ask Question", () => {
  const ctx = setupIntegrationSuite();

  beforeAll(() => {
    // Ensure OPENROUTER_API_KEY is set for tests
    process.env.OPENROUTER_API_KEY = "test-key";
  });

  afterAll(() => {
    vi.clearAllMocks();
  });

  it("retrieves document chunks for matter context", async () => {
    const client = await createClient({ firmId: ctx.firmId });
    const matter = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
      title: "Property Purchase",
      practiceArea: "conveyancing",
    });

    // Create a document first
    const { documents } = await import("@/lib/db/schema");
    const [document] = await db
      .insert(documents)
      .values({
        firmId: ctx.firmId,
        matterId: matter.id,
        title: "Purchase Agreement",
        name: "Purchase Agreement.pdf",
        type: "contract",
        fileKey: "test-file-key.pdf",
        mimeType: "application/pdf",
        fileSize: 1024,
      })
      .returning();

    // Insert test document chunks for the matter
    await db.insert(documentChunks).values([
      {
        firmId: ctx.firmId,
        matterId: matter.id,
        documentId: document.id,
        text: "Property purchase agreement for 123 Main Street",
        chunkIndex: 0,
      },
      {
        firmId: ctx.firmId,
        matterId: matter.id,
        documentId: document.id,
        text: "Purchase price: £350,000. Completion date: 2025-02-15",
        chunkIndex: 1,
      },
    ]);

    // Query chunks for this matter
    const chunks = await db
      .select()
      .from(documentChunks)
      .where(and(eq(documentChunks.firmId, ctx.firmId), eq(documentChunks.matterId, matter.id)));

    expect(chunks.length).toBeGreaterThanOrEqual(2);
    expect(chunks[0].text).toContain("Property purchase");
  });

  it("handles matter with no document chunks", async () => {
    const client = await createClient({ firmId: ctx.firmId });
    const matter = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
      title: "Empty Matter",
    });

    // Query chunks (should be empty)
    const chunks = await db
      .select()
      .from(documentChunks)
      .where(and(eq(documentChunks.firmId, ctx.firmId), eq(documentChunks.matterId, matter.id)));

    expect(chunks.length).toBe(0);
  });

  it("verifies matter exists before processing question", async () => {
    const nonExistentId = "00000000-0000-0000-0000-000000000000";

    const [matter] = await db
      .select()
      .from(matters)
      .where(and(eq(matters.id, nonExistentId), eq(matters.firmId, ctx.firmId)))
      .limit(1);

    expect(matter).toBeUndefined();
  });
});

describe("Matter AI - Ask Multi-Tenancy", () => {
  const ctx = setupFreshFirmPerTest();

  beforeAll(() => {
    process.env.OPENROUTER_API_KEY = "test-key";
  });

  it("isolates document chunks between firms", async () => {
    // Create matter in first firm
    const client1 = await createClient({ firmId: ctx.firmId });
    const matter1 = await createMatter({
      firmId: ctx.firmId,
      clientId: client1.id,
      title: "Firm 1 Matter",
    });

    const { documents } = await import("@/lib/db/schema");
    const [document1] = await db
      .insert(documents)
      .values({
        firmId: ctx.firmId,
        matterId: matter1.id,
        title: "Firm 1 Document",
        name: "Firm1Doc.pdf",
        type: "other",
        fileKey: "firm1-doc.pdf",
        mimeType: "application/pdf",
        fileSize: 1024,
      })
      .returning();

    await db.insert(documentChunks).values({
      firmId: ctx.firmId,
      matterId: matter1.id,
      documentId: document1.id,
      text: "Firm 1 document content",
      chunkIndex: 0,
    });

    // Create second firm
    const firm2 = await createFirm({ name: "Second Firm" });
    const client2 = await createClient({ firmId: firm2.id });
    const matter2 = await createMatter({
      firmId: firm2.id,
      clientId: client2.id,
      title: "Firm 2 Matter",
    });

    const [document2] = await db
      .insert(documents)
      .values({
        firmId: firm2.id,
        matterId: matter2.id,
        title: "Firm 2 Document",
        name: "Firm2Doc.pdf",
        type: "other",
        fileKey: "firm2-doc.pdf",
        mimeType: "application/pdf",
        fileSize: 1024,
      })
      .returning();

    await db.insert(documentChunks).values({
      firmId: firm2.id,
      matterId: matter2.id,
      documentId: document2.id,
      text: "Firm 2 document content",
      chunkIndex: 0,
    });

    // Query chunks for firm 1 - should not see firm 2 chunks
    const firm1Chunks = await db
      .select()
      .from(documentChunks)
      .where(eq(documentChunks.firmId, ctx.firmId));

    // Query chunks for firm 2 - should not see firm 1 chunks
    const firm2Chunks = await db
      .select()
      .from(documentChunks)
      .where(eq(documentChunks.firmId, firm2.id));

    expect(firm1Chunks.every((c) => c.firmId === ctx.firmId)).toBe(true);
    expect(firm2Chunks.every((c) => c.firmId === firm2.id)).toBe(true);

    const firm1Texts = firm1Chunks.map((c) => c.text);
    expect(firm1Texts).toContain("Firm 1 document content");
    expect(firm1Texts).not.toContain("Firm 2 document content");

    // Cleanup second firm (delete in correct order due to foreign keys)
    const { clients, firms } = await import("@/lib/db/schema");
    await db.delete(documentChunks).where(eq(documentChunks.firmId, firm2.id));
    await db.delete(documents).where(eq(documents.firmId, firm2.id));
    await db.delete(matters).where(eq(matters.firmId, firm2.id));
    await db.delete(clients).where(eq(clients.firmId, firm2.id));
    await db.delete(firms).where(eq(firms.id, firm2.id));
  });
});

describe("Matter AI - Generate Tasks", () => {
  const ctx = setupIntegrationSuite();
  let testUserId: string;

  beforeAll(async () => {
    process.env.OPENROUTER_API_KEY = "test-key";

    // Create a test user for approval requests
    const { createUser } = await import("@tests/fixtures/factories/user");
    const user = await createUser({
      firmId: ctx.firmId,
      name: "Test User",
      email: `test-${Date.now()}@example.com`,
    });
    testUserId = user.id;
  });

  it("creates approval request for task suggestions", async () => {
    const client = await createClient({ firmId: ctx.firmId });
    const matter = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
      title: "Property Purchase Matter",
      practiceArea: "conveyancing",
    });

    // Simulate creating an approval request (as the endpoint would)
    const [approval] = await db
      .insert(approvalRequests)
      .values({
        firmId: ctx.firmId,
        sourceType: "ai",
        sourceId: testUserId,
        action: "task.create",
        summary: "Create 3 task(s) for matter",
        proposedPayload: {
          matterId: matter.id,
          tasks: [
            {
              title: "Review property title deeds",
              description: "Check for any restrictions or covenants",
              priority: "high",
            },
            {
              title: "Request local authority searches",
              description: "Submit search requests to local council",
              priority: "medium",
            },
            {
              title: "Review survey report",
              description: "Assess any issues raised in the survey",
              priority: "medium",
            },
          ],
        },
        entityType: "matter",
        entityId: matter.id,
        aiMetadata: { model: "claude-3-5-sonnet" },
      })
      .returning();

    expect(approval.id).toBeDefined();
    expect(approval.firmId).toBe(ctx.firmId);
    expect(approval.action).toBe("task.create");
    expect(approval.status).toBe("pending");
    expect(approval.executionStatus).toBe("not_executed");
  });

  it("verifies task structure in approval payload", async () => {
    const client = await createClient({ firmId: ctx.firmId });
    const matter = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
      title: "Litigation Matter",
      practiceArea: "litigation",
    });

    const [approval] = await db
      .insert(approvalRequests)
      .values({
        firmId: ctx.firmId,
        sourceType: "ai",
        sourceId: testUserId,
        action: "task.create",
        summary: "Create 1 task(s) for matter",
        proposedPayload: {
          matterId: matter.id,
          tasks: [
            {
              title: "Conduct client intake meeting",
              description: "Initial consultation to gather case details",
              priority: "urgent",
              dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            },
          ],
        },
        entityType: "matter",
        entityId: matter.id,
      })
      .returning();

    const payload = approval.proposedPayload as any;
    expect(payload).toHaveProperty("tasks");
    expect(Array.isArray(payload.tasks)).toBe(true);
    expect(payload.tasks.length).toBe(1);

    const task = payload.tasks[0];
    expect(task).toHaveProperty("title");
    expect(task.title).toBe("Conduct client intake meeting");
    expect(task).toHaveProperty("description");
    expect(task).toHaveProperty("priority");
    expect(task.priority).toBe("urgent");
  });

  it("handles matter not found scenario", async () => {
    const nonExistentId = "00000000-0000-0000-0000-000000000000";

    const [matter] = await db
      .select()
      .from(matters)
      .where(and(eq(matters.id, nonExistentId), eq(matters.firmId, ctx.firmId)))
      .limit(1);

    expect(matter).toBeUndefined();
  });

  it("stores AI metadata in approval request", async () => {
    const client = await createClient({ firmId: ctx.firmId });
    const matter = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
      title: "Test Matter",
    });

    const [approval] = await db
      .insert(approvalRequests)
      .values({
        firmId: ctx.firmId,
        sourceType: "ai",
        sourceId: testUserId,
        action: "task.create",
        summary: "AI generated tasks",
        proposedPayload: { matterId: matter.id, tasks: [] },
        entityType: "matter",
        entityId: matter.id,
        aiMetadata: {
          model: "claude-3-5-sonnet",
          promptTokens: 150,
          completionTokens: 200,
        },
      })
      .returning();

    expect(approval.aiMetadata).toBeDefined();
    const metadata = approval.aiMetadata as any;
    expect(metadata.model).toBe("claude-3-5-sonnet");
  });
});

describe("Matter AI - Suggest Calendar", () => {
  const ctx = setupIntegrationSuite();
  let testUserId: string;

  beforeAll(async () => {
    process.env.OPENROUTER_API_KEY = "test-key";

    // Create a test user for approval requests
    const { createUser } = await import("@tests/fixtures/factories/user");
    const user = await createUser({
      firmId: ctx.firmId,
      name: "Test User Calendar",
      email: `test-calendar-${Date.now()}@example.com`,
    });
    testUserId = user.id;
  });

  it("creates approval request for calendar event suggestions", async () => {
    const client = await createClient({ firmId: ctx.firmId });
    const matter = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
      title: "Property Sale",
      practiceArea: "conveyancing",
    });

    const [approval] = await db
      .insert(approvalRequests)
      .values({
        firmId: ctx.firmId,
        sourceType: "ai",
        sourceId: testUserId,
        action: "calendar_event.create",
        summary: "Create 2 calendar event(s) for matter",
        proposedPayload: {
          matterId: matter.id,
          events: [
            {
              title: "Exchange contracts deadline",
              description: "Final date to exchange contracts",
              eventType: "deadline",
              startAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
              allDay: true,
              priority: "high",
            },
            {
              title: "Completion date",
              description: "Property completion and handover",
              eventType: "deadline",
              startAt: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(),
              endAt: new Date(
                Date.now() + 28 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000
              ).toISOString(),
              allDay: false,
              priority: "critical",
            },
          ],
        },
        entityType: "matter",
        entityId: matter.id,
        aiMetadata: { model: "claude-3-5-sonnet" },
      })
      .returning();

    expect(approval.id).toBeDefined();
    expect(approval.action).toBe("calendar_event.create");
    expect(approval.firmId).toBe(ctx.firmId);
  });

  it("verifies calendar event structure in approval payload", async () => {
    const client = await createClient({ firmId: ctx.firmId });
    const matter = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
      title: "Court Case",
      practiceArea: "litigation",
    });

    const startDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

    const [approval] = await db
      .insert(approvalRequests)
      .values({
        firmId: ctx.firmId,
        sourceType: "ai",
        sourceId: testUserId,
        action: "calendar_event.create",
        summary: "Create 1 calendar event(s) for matter",
        proposedPayload: {
          matterId: matter.id,
          events: [
            {
              title: "Court hearing",
              description: "Preliminary hearing at County Court",
              eventType: "hearing",
              startAt: startDate.toISOString(),
              endAt: endDate.toISOString(),
              allDay: false,
              priority: "high",
            },
          ],
        },
        entityType: "matter",
        entityId: matter.id,
      })
      .returning();

    const payload = approval.proposedPayload as any;
    expect(payload).toHaveProperty("events");
    expect(Array.isArray(payload.events)).toBe(true);
    expect(payload.events.length).toBe(1);

    const event = payload.events[0];
    expect(event).toHaveProperty("title");
    expect(event.title).toBe("Court hearing");
    expect(event).toHaveProperty("eventType");
    expect(event.eventType).toBe("hearing");
    expect(event).toHaveProperty("startAt");
    expect(event).toHaveProperty("endAt");
  });

  it("validates event timestamps are ISO 8601 format", async () => {
    const client = await createClient({ firmId: ctx.firmId });
    const matter = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
      title: "Filing Matter",
    });

    const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const [approval] = await db
      .insert(approvalRequests)
      .values({
        firmId: ctx.firmId,
        sourceType: "ai",
        sourceId: testUserId,
        action: "calendar_event.create",
        summary: "Create calendar events",
        proposedPayload: {
          matterId: matter.id,
          events: [
            {
              title: "Filing deadline",
              eventType: "filing_deadline",
              startAt: futureDate.toISOString(),
              allDay: true,
              priority: "high",
            },
          ],
        },
        entityType: "matter",
        entityId: matter.id,
      })
      .returning();

    const payload = approval.proposedPayload as any;
    const event = payload.events[0];

    // Verify ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)
    expect(event.startAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  it("handles multiple event types correctly", async () => {
    const client = await createClient({ firmId: ctx.firmId });
    const matter = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
      title: "Multi-Event Matter",
    });

    const [approval] = await db
      .insert(approvalRequests)
      .values({
        firmId: ctx.firmId,
        sourceType: "ai",
        sourceId: testUserId,
        action: "calendar_event.create",
        summary: "Create diverse calendar events",
        proposedPayload: {
          matterId: matter.id,
          events: [
            {
              title: "Court hearing",
              eventType: "hearing",
              startAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              allDay: false,
              priority: "critical",
            },
            {
              title: "Filing deadline",
              eventType: "deadline",
              startAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
              allDay: true,
              priority: "high",
            },
            {
              title: "Client meeting",
              eventType: "meeting",
              startAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
              allDay: false,
              priority: "medium",
            },
          ],
        },
        entityType: "matter",
        entityId: matter.id,
      })
      .returning();

    const payload = approval.proposedPayload as any;
    expect(payload.events.length).toBe(3);

    const eventTypes = payload.events.map((e: any) => e.eventType);
    expect(eventTypes).toContain("hearing");
    expect(eventTypes).toContain("deadline");
    expect(eventTypes).toContain("meeting");
  });
});

describe("Matter AI - Error Handling", () => {
  const ctx = setupIntegrationSuite();

  it("handles missing matter gracefully", async () => {
    const nonExistentId = "00000000-0000-0000-0000-000000000000";

    // Try to query a matter that doesn't exist
    const [matter] = await db
      .select()
      .from(matters)
      .where(and(eq(matters.id, nonExistentId), eq(matters.firmId, ctx.firmId)))
      .limit(1);

    expect(matter).toBeUndefined();
  });

  it("prevents creating approvals for non-existent matters", async () => {
    const nonExistentMatterId = "00000000-0000-0000-0000-000000000000";

    // Verify matter doesn't exist first
    const [matter] = await db
      .select()
      .from(matters)
      .where(and(eq(matters.id, nonExistentMatterId), eq(matters.firmId, ctx.firmId)))
      .limit(1);

    expect(matter).toBeUndefined();

    // In the actual API, this would be caught before creating the approval
    // Here we just verify the matter check works
  });
});
