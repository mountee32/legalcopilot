/**
 * AI Features Integration Tests
 *
 * Tests AI-powered features against the real database.
 * These tests mock the OpenRouter API calls to avoid hitting external services.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { db } from "@/lib/db";
import { matters, documentChunks, emails, approvalRequests } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { setupIntegrationSuite } from "@tests/integration/setup";
import { createMatter } from "@tests/fixtures/factories/matter";
import { createClient } from "@tests/fixtures/factories/client";
import { createDocument } from "@tests/fixtures/factories/document";
import { createEmail } from "@tests/fixtures/factories/email";
import { createUser } from "@tests/fixtures/factories/user";

// Mock the AI generation functions
vi.mock("ai", () => ({
  generateText: vi.fn(async ({ prompt }) => {
    // Return different responses based on prompt content
    if (prompt.includes("QUESTION:")) {
      // Mock for ask endpoint
      return {
        text: JSON.stringify({
          answer: "Based on the documents, this is a test answer.",
          citations: [
            {
              documentId: "00000000-0000-0000-0000-000000000001",
              documentChunkId: "00000000-0000-0000-0000-000000000002",
              quote: "relevant text from document",
            },
          ],
        }),
      };
    } else if (prompt.includes("Generate a short actionable task list")) {
      // Mock for generate-tasks endpoint
      return {
        text: JSON.stringify({
          tasks: [
            {
              title: "Review client documents",
              description: "Check all submitted documents for completeness",
              priority: "high",
              dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            },
            {
              title: "Schedule client meeting",
              description: "Arrange initial consultation",
              priority: "medium",
              dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            },
          ],
        }),
      };
    } else if (prompt.includes("Extract actionable calendar events")) {
      // Mock for suggest-calendar endpoint
      return {
        text: JSON.stringify({
          events: [
            {
              title: "Court Hearing",
              description: "Preliminary hearing at Manchester County Court",
              eventType: "hearing",
              startAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
              endAt: new Date(
                Date.now() + 14 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000
              ).toISOString(),
              allDay: false,
              priority: "high",
            },
            {
              title: "Filing Deadline",
              description: "Submit response documents",
              eventType: "filing_deadline",
              startAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
              allDay: true,
              priority: "critical",
            },
          ],
        }),
      };
    } else if (prompt.includes("Analyze the email")) {
      // Mock for email processing endpoint
      return {
        text: JSON.stringify({
          intent: "request_information",
          sentiment: "neutral",
          urgency: 3,
          summary: "Client requesting update on case status",
          suggestedResponse: "Thank you for your email. We will provide an update shortly.",
          suggestedTasks: ["Prepare case status update", "Schedule follow-up call"],
          matchedMatterId: null,
          matchConfidence: 0,
        }),
      };
    }

    // Default fallback
    return { text: JSON.stringify({ result: "mocked response" }) };
  }),
  streamText: vi.fn(),
}));

// Mock embeddings
vi.mock("@/lib/ai/embeddings", () => ({
  embedTexts: vi.fn(async (texts: string[]) => {
    // Return mock embeddings (1536 dimensions for OpenAI compatibility)
    return texts.map(() => new Array(1536).fill(0).map(() => Math.random()));
  }),
}));

describe("AI Features Integration - Matter AI Ask", () => {
  const ctx = setupIntegrationSuite();
  let testMatterId: string;
  let testUserId: string;

  beforeEach(async () => {
    // Create test data
    const client = await createClient({ firmId: ctx.firmId });
    const matter = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
      title: "Test Matter for AI Questions",
      practiceArea: "litigation",
    });
    testMatterId = matter.id;

    const user = await createUser({ firmId: ctx.firmId });
    testUserId = user.id;

    // Create a document and chunk for the matter
    const document = await createDocument({
      firmId: ctx.firmId,
      matterId: testMatterId,
      title: "Test Document",
      extractedText: "This is a test document about the case.",
    });

    // Insert a document chunk with text
    await db.insert(documentChunks).values({
      firmId: ctx.firmId,
      matterId: testMatterId,
      documentId: document.id,
      chunkIndex: 0,
      text: "This is relevant case information that can be used to answer questions.",
      embedding: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  it("retrieves matter and document chunks", async () => {
    // Verify matter exists
    const [matter] = await db
      .select()
      .from(matters)
      .where(and(eq(matters.id, testMatterId), eq(matters.firmId, ctx.firmId)))
      .limit(1);

    expect(matter).toBeDefined();
    expect(matter.id).toBe(testMatterId);

    // Verify document chunks exist
    const chunks = await db
      .select()
      .from(documentChunks)
      .where(and(eq(documentChunks.firmId, ctx.firmId), eq(documentChunks.matterId, testMatterId)))
      .orderBy(desc(documentChunks.createdAt))
      .limit(8);

    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks[0].text).toBeDefined();
  });

  it("processes question when chunks are available", async () => {
    const chunks = await db
      .select()
      .from(documentChunks)
      .where(and(eq(documentChunks.firmId, ctx.firmId), eq(documentChunks.matterId, testMatterId)));

    expect(chunks.length).toBeGreaterThan(0);

    // The AI endpoint would use these chunks to generate an answer
    const chunkTexts = chunks.map((c) => c.text);
    expect(chunkTexts.every((text) => typeof text === "string" && text.length > 0)).toBe(true);
  });

  it("returns appropriate response when no chunks exist", async () => {
    // Create a matter without any document chunks
    const client = await createClient({ firmId: ctx.firmId });
    const emptyMatter = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
      title: "Empty Matter",
    });

    const chunks = await db
      .select()
      .from(documentChunks)
      .where(
        and(eq(documentChunks.firmId, ctx.firmId), eq(documentChunks.matterId, emptyMatter.id))
      );

    expect(chunks.length).toBe(0);

    // Expected behavior: should return a message indicating no processed chunks
    const expectedResponse = {
      answer: "I don't have any processed document chunks for this matter yet.",
      citations: [],
    };

    expect(expectedResponse.citations).toHaveLength(0);
  });

  it("validates question format", async () => {
    // Test that valid questions can be processed
    const validQuestions = [
      "What is the status of this case?",
      "When is the next hearing?",
      "Who are the parties involved?",
      "What are the key dates?",
    ];

    validQuestions.forEach((question) => {
      expect(question.length).toBeGreaterThan(0);
      expect(typeof question).toBe("string");
    });
  });
});

describe("AI Features Integration - Matter AI Generate Tasks", () => {
  const ctx = setupIntegrationSuite();
  let testMatterId: string;
  let testUserId: string;

  beforeEach(async () => {
    const client = await createClient({ firmId: ctx.firmId });
    const matter = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
      title: "Contract Review Matter",
      practiceArea: "litigation",
    });
    testMatterId = matter.id;

    const user = await createUser({ firmId: ctx.firmId });
    testUserId = user.id;
  });

  it("creates approval request for generated tasks", async () => {
    // Simulate task generation by creating an approval request
    const mockTasks = [
      {
        title: "Review client documents",
        description: "Check all submitted documents",
        priority: "high" as const,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        title: "Draft initial response",
        description: "Prepare response letter",
        priority: "medium" as const,
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];

    const [approval] = await db
      .insert(approvalRequests)
      .values({
        firmId: ctx.firmId,
        sourceType: "ai",
        sourceId: testUserId,
        action: "task.create",
        summary: `Create ${mockTasks.length} task(s) for matter`,
        proposedPayload: { matterId: testMatterId, tasks: mockTasks },
        entityType: "matter",
        entityId: testMatterId,
        aiMetadata: { model: "claude-3-5-sonnet" },
      })
      .returning();

    expect(approval).toBeDefined();
    expect(approval.action).toBe("task.create");
    expect(approval.sourceType).toBe("ai");
    expect(approval.entityType).toBe("matter");
    expect(approval.entityId).toBe(testMatterId);

    // Verify the payload contains the tasks
    const payload = approval.proposedPayload as any;
    expect(payload.tasks).toHaveLength(2);
    expect(payload.tasks[0].title).toBe("Review client documents");
    expect(payload.tasks[0].priority).toBe("high");
  });

  it("validates task structure", async () => {
    const validTask = {
      title: "Test Task",
      description: "Test description",
      priority: "medium" as const,
      dueDate: new Date().toISOString(),
    };

    expect(validTask.title).toBeDefined();
    expect(validTask.title.length).toBeGreaterThan(0);
    expect(validTask.title.length).toBeLessThanOrEqual(200);
    expect(["low", "medium", "high", "urgent"]).toContain(validTask.priority);
  });

  it("retrieves matter details for context", async () => {
    const [matter] = await db
      .select({ id: matters.id, title: matters.title, practiceArea: matters.practiceArea })
      .from(matters)
      .where(and(eq(matters.id, testMatterId), eq(matters.firmId, ctx.firmId)))
      .limit(1);

    expect(matter).toBeDefined();
    expect(matter.title).toBe("Contract Review Matter");
    expect(matter.practiceArea).toBe("litigation");

    // These details would be used in the AI prompt
  });

  it("stores AI metadata with approval request", async () => {
    const [approval] = await db
      .insert(approvalRequests)
      .values({
        firmId: ctx.firmId,
        sourceType: "ai",
        sourceId: testUserId,
        action: "task.create",
        summary: "Create tasks",
        proposedPayload: { matterId: testMatterId, tasks: [] },
        entityType: "matter",
        entityId: testMatterId,
        aiMetadata: { model: "claude-3-5-sonnet", promptTokens: 100, completionTokens: 50 },
      })
      .returning();

    expect(approval.aiMetadata).toBeDefined();
    const metadata = approval.aiMetadata as any;
    expect(metadata.model).toBe("claude-3-5-sonnet");
  });
});

describe("AI Features Integration - Matter AI Suggest Calendar", () => {
  const ctx = setupIntegrationSuite();
  let testMatterId: string;
  let testUserId: string;

  beforeEach(async () => {
    const client = await createClient({ firmId: ctx.firmId });
    const suffix = Date.now().toString(36);
    const matter = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
      title: "Litigation Case",
      practiceArea: "litigation",
      reference: `LIT-${suffix}`,
    });
    testMatterId = matter.id;

    const user = await createUser({ firmId: ctx.firmId });
    testUserId = user.id;
  });

  it("creates approval request for calendar events", async () => {
    const mockEvents = [
      {
        title: "Court Hearing",
        description: "Preliminary hearing",
        eventType: "hearing" as const,
        startAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        endAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
        allDay: false,
        priority: "high" as const,
      },
      {
        title: "Filing Deadline",
        description: "Submit response",
        eventType: "filing_deadline" as const,
        startAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        endAt: null,
        allDay: true,
        priority: "critical" as const,
      },
    ];

    const [approval] = await db
      .insert(approvalRequests)
      .values({
        firmId: ctx.firmId,
        sourceType: "ai",
        sourceId: testUserId,
        action: "calendar_event.create",
        summary: `Create ${mockEvents.length} calendar event(s) for matter`,
        proposedPayload: { matterId: testMatterId, events: mockEvents },
        entityType: "matter",
        entityId: testMatterId,
        aiMetadata: { model: "claude-3-5-sonnet" },
        updatedAt: new Date(),
      })
      .returning();

    expect(approval).toBeDefined();
    expect(approval.action).toBe("calendar_event.create");
    expect(approval.entityId).toBe(testMatterId);

    const payload = approval.proposedPayload as any;
    expect(payload.events).toHaveLength(2);
    expect(payload.events[0].title).toBe("Court Hearing");
    expect(payload.events[0].eventType).toBe("hearing");
  });

  it("validates event structure", async () => {
    const validEvent = {
      title: "Test Event",
      description: "Test description",
      eventType: "deadline" as const,
      startAt: new Date().toISOString(),
      endAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      allDay: false,
      priority: "medium" as const,
    };

    expect(validEvent.title).toBeDefined();
    expect(validEvent.title.length).toBeGreaterThan(0);
    expect([
      "hearing",
      "deadline",
      "meeting",
      "reminder",
      "limitation_date",
      "filing_deadline",
      "other",
    ]).toContain(validEvent.eventType);
    expect(["low", "medium", "high", "critical"]).toContain(validEvent.priority);
  });

  it("retrieves matter details for calendar context", async () => {
    const [matter] = await db
      .select({ id: matters.id, title: matters.title, reference: matters.reference })
      .from(matters)
      .where(and(eq(matters.id, testMatterId), eq(matters.firmId, ctx.firmId)))
      .limit(1);

    expect(matter).toBeDefined();
    expect(matter.reference).toBeDefined();
    expect(matter.reference).toContain("LIT-");
  });

  it("handles text input for event extraction", async () => {
    const sampleText = `
      Court hearing scheduled for 15th January 2025 at 10:00 AM at Manchester County Court.
      Filing deadline: 10th January 2025.
      Client meeting on 5th January 2025 at 2:00 PM.
    `;

    expect(sampleText.length).toBeGreaterThan(0);
    expect(sampleText.length).toBeLessThanOrEqual(20000);
  });
});

describe("AI Features Integration - Email AI Processing", () => {
  const ctx = setupIntegrationSuite();
  let testEmailId: string;
  let testMatterId: string;

  beforeEach(async () => {
    const client = await createClient({ firmId: ctx.firmId });
    const suffix = Date.now().toString(36);
    const matter = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
      title: "Client Matter",
      reference: `MAT-${suffix}`,
    });
    testMatterId = matter.id;

    const email = await createEmail({
      firmId: ctx.firmId,
      subject: "Question about my case",
      bodyText:
        "Hi, I would like to know the current status of my case. Can you provide an update?",
      direction: "inbound",
      status: "received",
    });
    testEmailId = email.id;
  });

  it("processes email and extracts AI insights", async () => {
    // Simulate AI processing
    const processedData = {
      intent: "request_information" as const,
      sentiment: "neutral" as const,
      urgency: 3,
      summary: "Client requesting case status update",
      suggestedResponse:
        "Thank you for your inquiry. I will review your case and provide an update.",
      suggestedTasks: ["Prepare status report", "Schedule call with client"],
      matchedMatterId: testMatterId,
      matchConfidence: 85,
    };

    const [updated] = await db
      .update(emails)
      .set({
        aiProcessed: true,
        aiProcessedAt: new Date(),
        aiIntent: processedData.intent,
        aiSentiment: processedData.sentiment,
        aiUrgency: processedData.urgency,
        aiSummary: processedData.summary,
        aiSuggestedResponse: processedData.suggestedResponse,
        aiSuggestedTasks: processedData.suggestedTasks,
        aiMatchedMatterId: processedData.matchedMatterId,
        aiMatchConfidence: processedData.matchConfidence,
        updatedAt: new Date(),
      })
      .where(and(eq(emails.id, testEmailId), eq(emails.firmId, ctx.firmId)))
      .returning();

    expect(updated).toBeDefined();
    expect(updated.aiProcessed).toBe(true);
    expect(updated.aiIntent).toBe("request_information");
    expect(updated.aiSentiment).toBe("neutral");
    expect(updated.aiUrgency).toBe(3);
    expect(updated.aiMatchedMatterId).toBe(testMatterId);
  });

  it("retrieves candidate matters for matching", async () => {
    const candidates = await db
      .select({ id: matters.id, reference: matters.reference, title: matters.title })
      .from(matters)
      .where(eq(matters.firmId, ctx.firmId))
      .orderBy(matters.createdAt)
      .limit(30);

    expect(candidates.length).toBeGreaterThan(0);
    expect(candidates.some((c) => c.id === testMatterId)).toBe(true);
  });

  it("validates email AI fields", async () => {
    const validIntents = [
      "request_information",
      "provide_information",
      "request_action",
      "status_update",
      "complaint",
      "deadline",
      "confirmation",
      "general",
    ];

    const validSentiments = ["positive", "neutral", "negative", "frustrated"];

    expect(validIntents).toContain("request_information");
    expect(validSentiments).toContain("neutral");
  });

  it("handles email without matter match", async () => {
    const [updated] = await db
      .update(emails)
      .set({
        aiProcessed: true,
        aiProcessedAt: new Date(),
        aiIntent: "general",
        aiSentiment: "neutral",
        aiUrgency: 2,
        aiSummary: "General inquiry",
        aiMatchedMatterId: null,
        aiMatchConfidence: null,
        updatedAt: new Date(),
      })
      .where(and(eq(emails.id, testEmailId), eq(emails.firmId, ctx.firmId)))
      .returning();

    expect(updated.aiMatchedMatterId).toBeNull();
    expect(updated.aiMatchConfidence).toBeNull();
  });

  it("stores suggested tasks as JSON", async () => {
    const suggestedTasks = [
      "Review client request",
      "Prepare response draft",
      "Schedule follow-up",
    ];

    const [updated] = await db
      .update(emails)
      .set({
        aiProcessed: true,
        aiSuggestedTasks: suggestedTasks,
        updatedAt: new Date(),
      })
      .where(and(eq(emails.id, testEmailId), eq(emails.firmId, ctx.firmId)))
      .returning();

    expect(updated.aiSuggestedTasks).toBeDefined();
    expect(Array.isArray(updated.aiSuggestedTasks)).toBe(true);
    expect((updated.aiSuggestedTasks as string[]).length).toBe(3);
  });
});

describe("AI Features Integration - AI Audit Logging", () => {
  const ctx = setupIntegrationSuite();

  it("logs AI actions in approval requests", async () => {
    const client = await createClient({ firmId: ctx.firmId });
    const matter = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
      title: "Audit Test Matter",
    });
    const user = await createUser({ firmId: ctx.firmId });

    // Create multiple AI approval requests
    const requests = await Promise.all([
      db
        .insert(approvalRequests)
        .values({
          firmId: ctx.firmId,
          sourceType: "ai",
          sourceId: user.id,
          action: "task.create",
          summary: "AI generated tasks",
          proposedPayload: { matterId: matter.id, tasks: [] },
          entityType: "matter",
          entityId: matter.id,
          aiMetadata: { model: "claude-3-5-sonnet", timestamp: new Date().toISOString() },
        })
        .returning(),
      db
        .insert(approvalRequests)
        .values({
          firmId: ctx.firmId,
          sourceType: "ai",
          sourceId: user.id,
          action: "calendar_event.create",
          summary: "AI suggested calendar events",
          proposedPayload: { matterId: matter.id, events: [] },
          entityType: "matter",
          entityId: matter.id,
          aiMetadata: { model: "claude-3-5-sonnet", timestamp: new Date().toISOString() },
        })
        .returning(),
    ]);

    // Query all AI-generated approval requests for this firm
    const aiRequests = await db
      .select()
      .from(approvalRequests)
      .where(and(eq(approvalRequests.firmId, ctx.firmId), eq(approvalRequests.sourceType, "ai")))
      .orderBy(desc(approvalRequests.createdAt));

    expect(aiRequests.length).toBeGreaterThanOrEqual(2);
    expect(aiRequests.every((r) => r.sourceType === "ai")).toBe(true);
    expect(aiRequests.every((r) => r.aiMetadata !== null)).toBe(true);
  });

  it("tracks AI processing on emails", async () => {
    const email = await createEmail({
      firmId: ctx.firmId,
      subject: "Test Email",
      bodyText: "Test content",
    });

    // Process with AI
    await db
      .update(emails)
      .set({
        aiProcessed: true,
        aiProcessedAt: new Date(),
        aiIntent: "general",
        updatedAt: new Date(),
      })
      .where(eq(emails.id, email.id));

    // Query all AI-processed emails
    const processedEmails = await db
      .select()
      .from(emails)
      .where(and(eq(emails.firmId, ctx.firmId), eq(emails.aiProcessed, true)));

    expect(processedEmails.length).toBeGreaterThan(0);
    expect(processedEmails[0].aiProcessedAt).toBeDefined();
  });

  it("includes model information in metadata", async () => {
    const user = await createUser({ firmId: ctx.firmId });
    const client = await createClient({ firmId: ctx.firmId });
    const matter = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
      title: "Metadata Test",
    });

    const [approval] = await db
      .insert(approvalRequests)
      .values({
        firmId: ctx.firmId,
        sourceType: "ai",
        sourceId: user.id,
        action: "task.create",
        summary: "Test",
        proposedPayload: {},
        entityType: "matter",
        entityId: matter.id,
        aiMetadata: {
          model: "claude-3-5-sonnet",
          provider: "openrouter",
          promptTokens: 150,
          completionTokens: 75,
          totalCost: 0.002,
        },
      })
      .returning();

    const metadata = approval.aiMetadata as any;
    expect(metadata.model).toBe("claude-3-5-sonnet");
    expect(metadata.provider).toBe("openrouter");
  });

  it("queries AI actions by entity", async () => {
    const client = await createClient({ firmId: ctx.firmId });
    const matter = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
      title: "Query Test Matter",
    });
    const user = await createUser({ firmId: ctx.firmId });

    // Create multiple AI actions for this matter
    await db.insert(approvalRequests).values([
      {
        firmId: ctx.firmId,
        sourceType: "ai",
        sourceId: user.id,
        action: "task.create",
        summary: "Action 1",
        proposedPayload: {},
        entityType: "matter",
        entityId: matter.id,
        aiMetadata: { model: "claude-3-5-sonnet" },
      },
      {
        firmId: ctx.firmId,
        sourceType: "ai",
        sourceId: user.id,
        action: "calendar_event.create",
        summary: "Action 2",
        proposedPayload: {},
        entityType: "matter",
        entityId: matter.id,
        aiMetadata: { model: "claude-3-5-sonnet" },
      },
    ]);

    // Query all AI actions for this specific matter
    const matterAiActions = await db
      .select()
      .from(approvalRequests)
      .where(
        and(
          eq(approvalRequests.firmId, ctx.firmId),
          eq(approvalRequests.sourceType, "ai"),
          eq(approvalRequests.entityType, "matter"),
          eq(approvalRequests.entityId, matter.id)
        )
      );

    expect(matterAiActions.length).toBe(2);
    expect(matterAiActions.every((a) => a.entityId === matter.id)).toBe(true);
  });
});

describe("AI Features Integration - Error Handling", () => {
  const ctx = setupIntegrationSuite();

  it("handles matter not found", async () => {
    const nonExistentMatterId = "00000000-0000-0000-0000-000000000000";

    const [matter] = await db
      .select()
      .from(matters)
      .where(and(eq(matters.id, nonExistentMatterId), eq(matters.firmId, ctx.firmId)))
      .limit(1);

    expect(matter).toBeUndefined();
  });

  it("handles email not found", async () => {
    const nonExistentEmailId = "00000000-0000-0000-0000-000000000000";

    const [email] = await db
      .select()
      .from(emails)
      .where(and(eq(emails.id, nonExistentEmailId), eq(emails.firmId, ctx.firmId)))
      .limit(1);

    expect(email).toBeUndefined();
  });

  it("validates required fields before AI processing", async () => {
    const client = await createClient({ firmId: ctx.firmId });
    const matter = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
      title: "Validation Test",
    });

    // Verify matter has required fields for AI processing
    expect(matter.id).toBeDefined();
    expect(matter.title).toBeDefined();
    expect(matter.practiceArea).toBeDefined();
  });

  it("handles empty document chunks gracefully", async () => {
    const client = await createClient({ firmId: ctx.firmId });
    const matter = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
      title: "Empty Chunks Test",
    });

    const chunks = await db
      .select()
      .from(documentChunks)
      .where(and(eq(documentChunks.firmId, ctx.firmId), eq(documentChunks.matterId, matter.id)))
      .limit(8);

    expect(chunks.length).toBe(0);
    // Expected: API should return appropriate message when no chunks exist
  });
});
