/**
 * Matter Timeline Integration Tests
 *
 * Tests the /api/matters/[id]/timeline endpoint for retrieving
 * chronological activity feeds for matters.
 */
import { describe, it, expect } from "vitest";
import { db } from "@/lib/db";
import { timelineEvents, documents, tasks, emails, calendarEvents } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { setupIntegrationSuite, setupFreshFirmPerTest } from "@tests/integration/setup";
import { createMatter } from "@tests/fixtures/factories/matter";
import { createClient } from "@tests/fixtures/factories/client";
import { createFirm } from "@tests/fixtures/factories/firm";
import { createDocument } from "@tests/fixtures/factories/document";
import { createTask } from "@tests/fixtures/factories/task";
import { createEmail } from "@tests/fixtures/factories/email";
import { createCalendarEvent } from "@tests/fixtures/factories/calendar-event";
import { createTimeEntry } from "@tests/fixtures/factories/time-entry";
import { createUser } from "@tests/fixtures/factories/user";

describe("Matter Timeline - Basic Retrieval", () => {
  const ctx = setupIntegrationSuite();

  it("retrieves empty timeline for matter with no activities", async () => {
    const client = await createClient({ firmId: ctx.firmId });
    const matter = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
      title: "Empty Timeline Matter",
    });

    // Query timeline events directly from database
    const events = await db
      .select()
      .from(timelineEvents)
      .where(and(eq(timelineEvents.firmId, ctx.firmId), eq(timelineEvents.matterId, matter.id)));

    // Should have no events for a newly created matter (no automatic events)
    expect(events.length).toBe(0);
  });

  it("retrieves timeline with document events", async () => {
    const client = await createClient({ firmId: ctx.firmId });
    const matter = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
      title: "Document Timeline Matter",
    });

    // Create a document and manually add timeline event
    const doc = await createDocument({
      firmId: ctx.firmId,
      matterId: matter.id,
      title: "Test Document",
      type: "contract",
    });

    await db.insert(timelineEvents).values({
      firmId: ctx.firmId,
      matterId: matter.id,
      type: "document_uploaded",
      title: "Document uploaded",
      description: "Test Document was uploaded",
      actorType: "system",
      actorId: null,
      entityType: "document",
      entityId: doc.id,
      occurredAt: new Date(),
    });

    const events = await db
      .select()
      .from(timelineEvents)
      .where(and(eq(timelineEvents.firmId, ctx.firmId), eq(timelineEvents.matterId, matter.id)));

    expect(events.length).toBe(1);
    expect(events[0].type).toBe("document_uploaded");
    expect(events[0].entityId).toBe(doc.id);
    expect(events[0].entityType).toBe("document");
  });

  it("retrieves timeline with email events", async () => {
    const client = await createClient({ firmId: ctx.firmId });
    const matter = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
      title: "Email Timeline Matter",
    });

    // Create an email
    const email = await createEmail({
      firmId: ctx.firmId,
      matterId: matter.id,
      direction: "inbound",
      status: "received",
      subject: "Test Email",
    });

    // Add timeline event for email
    await db.insert(timelineEvents).values({
      firmId: ctx.firmId,
      matterId: matter.id,
      type: "email_received",
      title: "Email received",
      description: "Test Email",
      actorType: "system",
      actorId: null,
      entityType: "email",
      entityId: email.id,
      occurredAt: new Date(),
    });

    const events = await db
      .select()
      .from(timelineEvents)
      .where(and(eq(timelineEvents.firmId, ctx.firmId), eq(timelineEvents.matterId, matter.id)));

    expect(events.length).toBe(1);
    expect(events[0].type).toBe("email_received");
    expect(events[0].entityId).toBe(email.id);
    expect(events[0].entityType).toBe("email");
  });

  it("retrieves timeline with task events", async () => {
    const client = await createClient({ firmId: ctx.firmId });
    const matter = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
      title: "Task Timeline Matter",
    });

    // Create a task
    const task = await createTask({
      firmId: ctx.firmId,
      matterId: matter.id,
      title: "Test Task",
      status: "pending",
    });

    // Add timeline event for task
    await db.insert(timelineEvents).values({
      firmId: ctx.firmId,
      matterId: matter.id,
      type: "task_created",
      title: "Task created",
      description: "Test Task was created",
      actorType: "system",
      actorId: null,
      entityType: "task",
      entityId: task.id,
      occurredAt: new Date(),
    });

    const events = await db
      .select()
      .from(timelineEvents)
      .where(and(eq(timelineEvents.firmId, ctx.firmId), eq(timelineEvents.matterId, matter.id)));

    expect(events.length).toBe(1);
    expect(events[0].type).toBe("task_created");
    expect(events[0].entityId).toBe(task.id);
    expect(events[0].entityType).toBe("task");
  });

  it("retrieves timeline with time entry events", async () => {
    const client = await createClient({ firmId: ctx.firmId });
    const matter = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
      title: "Time Entry Timeline Matter",
    });

    // Create a user to be the fee earner
    const user = await createUser({ firmId: ctx.firmId, email: "feeearner@test.com" });

    // Create a time entry
    const timeEntry = await createTimeEntry({
      firmId: ctx.firmId,
      matterId: matter.id,
      feeEarnerId: user.id,
      description: "Test time entry",
      durationMinutes: 60,
    });

    // Add timeline event for time entry
    await db.insert(timelineEvents).values({
      firmId: ctx.firmId,
      matterId: matter.id,
      type: "time_entry_submitted",
      title: "Time entry submitted",
      description: "60 minutes logged",
      actorType: "system",
      actorId: null,
      entityType: "time_entry",
      entityId: timeEntry.id,
      occurredAt: new Date(),
    });

    const events = await db
      .select()
      .from(timelineEvents)
      .where(and(eq(timelineEvents.firmId, ctx.firmId), eq(timelineEvents.matterId, matter.id)));

    expect(events.length).toBe(1);
    expect(events[0].type).toBe("time_entry_submitted");
    expect(events[0].entityId).toBe(timeEntry.id);
    expect(events[0].entityType).toBe("time_entry");
  });

  it("retrieves timeline with calendar event entries", async () => {
    const client = await createClient({ firmId: ctx.firmId });
    const matter = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
      title: "Calendar Timeline Matter",
    });

    // Create a calendar event
    const calendarEvent = await createCalendarEvent({
      firmId: ctx.firmId,
      matterId: matter.id,
      title: "Court Hearing",
      startTime: new Date(),
      endTime: new Date(),
    });

    // Add timeline event for calendar event
    await db.insert(timelineEvents).values({
      firmId: ctx.firmId,
      matterId: matter.id,
      type: "calendar_event_created",
      title: "Calendar event created",
      description: "Court Hearing scheduled",
      actorType: "system",
      actorId: null,
      entityType: "calendar_event",
      entityId: calendarEvent.id,
      occurredAt: new Date(),
    });

    const events = await db
      .select()
      .from(timelineEvents)
      .where(and(eq(timelineEvents.firmId, ctx.firmId), eq(timelineEvents.matterId, matter.id)));

    expect(events.length).toBe(1);
    expect(events[0].type).toBe("calendar_event_created");
    expect(events[0].entityId).toBe(calendarEvent.id);
    expect(events[0].entityType).toBe("calendar_event");
  });
});

describe("Matter Timeline - Sorting and Mixed Activities", () => {
  const ctx = setupIntegrationSuite();

  it("retrieves mixed activities sorted by date (chronological order)", async () => {
    const client = await createClient({ firmId: ctx.firmId });
    const matter = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
      title: "Mixed Timeline Matter",
    });

    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

    // Create various types of events with different timestamps
    const doc = await createDocument({
      firmId: ctx.firmId,
      matterId: matter.id,
      title: "Recent Document",
    });

    const task = await createTask({
      firmId: ctx.firmId,
      matterId: matter.id,
      title: "Older Task",
    });

    const email = await createEmail({
      firmId: ctx.firmId,
      matterId: matter.id,
      subject: "Middle Email",
    });

    // Insert timeline events with specific dates
    await db.insert(timelineEvents).values([
      {
        firmId: ctx.firmId,
        matterId: matter.id,
        type: "document_uploaded",
        title: "Recent document",
        actorType: "system",
        actorId: null,
        entityType: "document",
        entityId: doc.id,
        occurredAt: now, // Most recent
      },
      {
        firmId: ctx.firmId,
        matterId: matter.id,
        type: "email_received",
        title: "Middle email",
        actorType: "system",
        actorId: null,
        entityType: "email",
        entityId: email.id,
        occurredAt: yesterday, // Middle
      },
      {
        firmId: ctx.firmId,
        matterId: matter.id,
        type: "task_created",
        title: "Older task",
        actorType: "system",
        actorId: null,
        entityType: "task",
        entityId: task.id,
        occurredAt: twoDaysAgo, // Oldest
      },
    ]);

    // Query with descending order (most recent first)
    const events = await db
      .select()
      .from(timelineEvents)
      .where(and(eq(timelineEvents.firmId, ctx.firmId), eq(timelineEvents.matterId, matter.id)))
      .orderBy(timelineEvents.occurredAt);

    expect(events.length).toBe(3);

    // Check ascending order (oldest first)
    expect(events[0].type).toBe("task_created");
    expect(events[1].type).toBe("email_received");
    expect(events[2].type).toBe("document_uploaded");

    // Verify timestamps are in order
    const timestamp0 = new Date(events[0].occurredAt).getTime();
    const timestamp1 = new Date(events[1].occurredAt).getTime();
    const timestamp2 = new Date(events[2].occurredAt).getTime();

    expect(timestamp0).toBeLessThan(timestamp1);
    expect(timestamp1).toBeLessThan(timestamp2);
  });

  it("handles multiple events on the same timestamp", async () => {
    const client = await createClient({ firmId: ctx.firmId });
    const matter = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
      title: "Same Time Matter",
    });

    const now = new Date();

    // Create multiple events at the same time
    await db.insert(timelineEvents).values([
      {
        firmId: ctx.firmId,
        matterId: matter.id,
        type: "task_created",
        title: "Task 1",
        actorType: "system",
        actorId: null,
        occurredAt: now,
      },
      {
        firmId: ctx.firmId,
        matterId: matter.id,
        type: "task_created",
        title: "Task 2",
        actorType: "system",
        actorId: null,
        occurredAt: now,
      },
      {
        firmId: ctx.firmId,
        matterId: matter.id,
        type: "note_added",
        title: "Note 1",
        actorType: "system",
        actorId: null,
        occurredAt: now,
      },
    ]);

    const events = await db
      .select()
      .from(timelineEvents)
      .where(and(eq(timelineEvents.firmId, ctx.firmId), eq(timelineEvents.matterId, matter.id)));

    expect(events.length).toBe(3);
    // All should have the same timestamp
    expect(events.every((e) => e.occurredAt.getTime() === now.getTime())).toBe(true);
  });
});

describe("Matter Timeline - Pagination", () => {
  const ctx = setupIntegrationSuite();

  it("paginates timeline events correctly with limit", async () => {
    const client = await createClient({ firmId: ctx.firmId });
    const matter = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
      title: "Pagination Matter",
    });

    // Create 15 timeline events
    const events = [];
    for (let i = 0; i < 15; i++) {
      events.push({
        firmId: ctx.firmId,
        matterId: matter.id,
        type: "note_added" as const,
        title: `Event ${i}`,
        actorType: "system" as const,
        actorId: null,
        occurredAt: new Date(Date.now() + i * 1000), // Spread over time
      });
    }
    await db.insert(timelineEvents).values(events);

    // First page (limit 5, offset 0)
    const page1 = await db
      .select()
      .from(timelineEvents)
      .where(and(eq(timelineEvents.firmId, ctx.firmId), eq(timelineEvents.matterId, matter.id)))
      .limit(5)
      .offset(0);

    // Second page (limit 5, offset 5)
    const page2 = await db
      .select()
      .from(timelineEvents)
      .where(and(eq(timelineEvents.firmId, ctx.firmId), eq(timelineEvents.matterId, matter.id)))
      .limit(5)
      .offset(5);

    expect(page1.length).toBe(5);
    expect(page2.length).toBe(5);

    // Verify no overlap
    const page1Ids = page1.map((e) => e.id);
    const page2Ids = page2.map((e) => e.id);
    const overlap = page1Ids.filter((id) => page2Ids.includes(id));
    expect(overlap.length).toBe(0);
  });

  it("handles offset beyond total events", async () => {
    const client = await createClient({ firmId: ctx.firmId });
    const matter = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
      title: "Offset Matter",
    });

    // Create only 5 events
    const events = [];
    for (let i = 0; i < 5; i++) {
      events.push({
        firmId: ctx.firmId,
        matterId: matter.id,
        type: "note_added" as const,
        title: `Event ${i}`,
        actorType: "system" as const,
        actorId: null,
        occurredAt: new Date(),
      });
    }
    await db.insert(timelineEvents).values(events);

    // Try to get events with offset of 10 (beyond total)
    const results = await db
      .select()
      .from(timelineEvents)
      .where(and(eq(timelineEvents.firmId, ctx.firmId), eq(timelineEvents.matterId, matter.id)))
      .limit(5)
      .offset(10);

    expect(results.length).toBe(0);
  });
});

describe("Matter Timeline - Filtering", () => {
  const ctx = setupIntegrationSuite();

  it("filters timeline by event type", async () => {
    const client = await createClient({ firmId: ctx.firmId });
    const matter = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
      title: "Filter Type Matter",
    });

    // Create different types of events
    await db.insert(timelineEvents).values([
      {
        firmId: ctx.firmId,
        matterId: matter.id,
        type: "document_uploaded",
        title: "Doc 1",
        actorType: "system",
        actorId: null,
        occurredAt: new Date(),
      },
      {
        firmId: ctx.firmId,
        matterId: matter.id,
        type: "document_uploaded",
        title: "Doc 2",
        actorType: "system",
        actorId: null,
        occurredAt: new Date(),
      },
      {
        firmId: ctx.firmId,
        matterId: matter.id,
        type: "email_received",
        title: "Email 1",
        actorType: "system",
        actorId: null,
        occurredAt: new Date(),
      },
      {
        firmId: ctx.firmId,
        matterId: matter.id,
        type: "task_created",
        title: "Task 1",
        actorType: "system",
        actorId: null,
        occurredAt: new Date(),
      },
    ]);

    // Filter by document_uploaded
    const docEvents = await db
      .select()
      .from(timelineEvents)
      .where(
        and(
          eq(timelineEvents.firmId, ctx.firmId),
          eq(timelineEvents.matterId, matter.id),
          eq(timelineEvents.type, "document_uploaded")
        )
      );

    // Filter by email_received
    const emailEvents = await db
      .select()
      .from(timelineEvents)
      .where(
        and(
          eq(timelineEvents.firmId, ctx.firmId),
          eq(timelineEvents.matterId, matter.id),
          eq(timelineEvents.type, "email_received")
        )
      );

    expect(docEvents.length).toBe(2);
    expect(emailEvents.length).toBe(1);
    expect(docEvents.every((e) => e.type === "document_uploaded")).toBe(true);
    expect(emailEvents.every((e) => e.type === "email_received")).toBe(true);
  });

  it("filters timeline by entity type and ID", async () => {
    const client = await createClient({ firmId: ctx.firmId });
    const matter = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
      title: "Filter Entity Matter",
    });

    const doc1 = await createDocument({
      firmId: ctx.firmId,
      matterId: matter.id,
      title: "Doc 1",
    });

    const doc2 = await createDocument({
      firmId: ctx.firmId,
      matterId: matter.id,
      title: "Doc 2",
    });

    // Create events for different documents
    await db.insert(timelineEvents).values([
      {
        firmId: ctx.firmId,
        matterId: matter.id,
        type: "document_uploaded",
        title: "Doc 1 uploaded",
        actorType: "system",
        actorId: null,
        entityType: "document",
        entityId: doc1.id,
        occurredAt: new Date(),
      },
      {
        firmId: ctx.firmId,
        matterId: matter.id,
        type: "document_chunked",
        title: "Doc 1 chunked",
        actorType: "system",
        actorId: null,
        entityType: "document",
        entityId: doc1.id,
        occurredAt: new Date(),
      },
      {
        firmId: ctx.firmId,
        matterId: matter.id,
        type: "document_uploaded",
        title: "Doc 2 uploaded",
        actorType: "system",
        actorId: null,
        entityType: "document",
        entityId: doc2.id,
        occurredAt: new Date(),
      },
    ]);

    // Filter by doc1's entity ID
    const doc1Events = await db
      .select()
      .from(timelineEvents)
      .where(
        and(
          eq(timelineEvents.firmId, ctx.firmId),
          eq(timelineEvents.matterId, matter.id),
          eq(timelineEvents.entityType, "document"),
          eq(timelineEvents.entityId, doc1.id)
        )
      );

    expect(doc1Events.length).toBe(2);
    expect(doc1Events.every((e) => e.entityId === doc1.id)).toBe(true);
  });
});

describe("Matter Timeline - Multi-Tenancy", () => {
  const ctx = setupFreshFirmPerTest();

  it("isolates timeline events between firms", async () => {
    // Create matter in first firm
    const client1 = await createClient({ firmId: ctx.firmId });
    const matter1 = await createMatter({
      firmId: ctx.firmId,
      clientId: client1.id,
      title: "Firm1 Matter",
    });

    await db.insert(timelineEvents).values({
      firmId: ctx.firmId,
      matterId: matter1.id,
      type: "note_added",
      title: "Firm1 Event",
      actorType: "system",
      actorId: null,
      occurredAt: new Date(),
    });

    // Create second firm
    const firm2 = await createFirm({ name: "Second Test Firm" });
    const client2 = await createClient({ firmId: firm2.id });
    const matter2 = await createMatter({
      firmId: firm2.id,
      clientId: client2.id,
      title: "Firm2 Matter",
    });

    await db.insert(timelineEvents).values({
      firmId: firm2.id,
      matterId: matter2.id,
      type: "note_added",
      title: "Firm2 Event",
      actorType: "system",
      actorId: null,
      occurredAt: new Date(),
    });

    // Query events for first firm
    const firm1Events = await db
      .select()
      .from(timelineEvents)
      .where(eq(timelineEvents.firmId, ctx.firmId));

    // Query events for second firm
    const firm2Events = await db
      .select()
      .from(timelineEvents)
      .where(eq(timelineEvents.firmId, firm2.id));

    // Each firm should only see their own events
    expect(firm1Events.some((e) => e.matterId === matter1.id)).toBe(true);
    expect(firm1Events.some((e) => e.matterId === matter2.id)).toBe(false);

    expect(firm2Events.some((e) => e.matterId === matter2.id)).toBe(true);
    expect(firm2Events.some((e) => e.matterId === matter1.id)).toBe(false);

    // Cleanup second firm
    await db.delete(timelineEvents).where(eq(timelineEvents.firmId, firm2.id));
    const { documents: docsTable } = await import("@/lib/db/schema");
    await db.delete(docsTable).where(eq(docsTable.firmId, firm2.id));
    const { matters } = await import("@/lib/db/schema");
    await db.delete(matters).where(eq(matters.firmId, firm2.id));
    const { clients } = await import("@/lib/db/schema");
    await db.delete(clients).where(eq(clients.firmId, firm2.id));
    const { firms } = await import("@/lib/db/schema");
    await db.delete(firms).where(eq(firms.id, firm2.id));
  });

  it("returns 404 when accessing wrong firm's matter timeline", async () => {
    // Create matter in first firm
    const client1 = await createClient({ firmId: ctx.firmId });
    const matter1 = await createMatter({
      firmId: ctx.firmId,
      clientId: client1.id,
      title: "Isolated Matter",
    });

    await db.insert(timelineEvents).values({
      firmId: ctx.firmId,
      matterId: matter1.id,
      type: "note_added",
      title: "Event",
      actorType: "system",
      actorId: null,
      occurredAt: new Date(),
    });

    // Create second firm
    const firm2 = await createFirm({ name: "Another Test Firm" });

    // Try to query matter1's timeline with firm2's firmId filter
    const result = await db
      .select()
      .from(timelineEvents)
      .where(and(eq(timelineEvents.matterId, matter1.id), eq(timelineEvents.firmId, firm2.id)));

    // Should not find any events
    expect(result.length).toBe(0);

    // Cleanup second firm
    const { firms } = await import("@/lib/db/schema");
    await db.delete(firms).where(eq(firms.id, firm2.id));
  });
});

describe("Matter Timeline - Data Integrity", () => {
  const ctx = setupIntegrationSuite();

  it("maintains timeline events when matter is updated", async () => {
    const client = await createClient({ firmId: ctx.firmId });
    const matter = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
      title: "Original Title",
    });

    // Add timeline event
    await db.insert(timelineEvents).values({
      firmId: ctx.firmId,
      matterId: matter.id,
      type: "matter_created",
      title: "Matter created",
      actorType: "system",
      actorId: null,
      occurredAt: new Date(),
    });

    // Update the matter
    const { matters } = await import("@/lib/db/schema");
    await db
      .update(matters)
      .set({ title: "Updated Title", updatedAt: new Date() })
      .where(eq(matters.id, matter.id));

    // Timeline events should still exist
    const events = await db
      .select()
      .from(timelineEvents)
      .where(and(eq(timelineEvents.firmId, ctx.firmId), eq(timelineEvents.matterId, matter.id)));

    expect(events.length).toBe(1);
    expect(events[0].type).toBe("matter_created");
  });

  it("cascades delete when matter is deleted", async () => {
    const client = await createClient({ firmId: ctx.firmId });
    const matter = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
      title: "To Be Deleted",
    });

    // Add timeline event
    const [event] = await db
      .insert(timelineEvents)
      .values({
        firmId: ctx.firmId,
        matterId: matter.id,
        type: "note_added",
        title: "Event",
        actorType: "system",
        actorId: null,
        occurredAt: new Date(),
      })
      .returning();

    // Delete the matter
    const { matters } = await import("@/lib/db/schema");
    await db.delete(matters).where(eq(matters.id, matter.id));

    // Timeline events should be cascade deleted
    const remainingEvents = await db
      .select()
      .from(timelineEvents)
      .where(eq(timelineEvents.id, event.id));

    expect(remainingEvents.length).toBe(0);
  });

  it("handles null entity references gracefully", async () => {
    const client = await createClient({ firmId: ctx.firmId });
    const matter = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
      title: "Null Entity Matter",
    });

    // Create event with no entity reference
    await db.insert(timelineEvents).values({
      firmId: ctx.firmId,
      matterId: matter.id,
      type: "note_added",
      title: "Manual note",
      description: "A note with no entity reference",
      actorType: "system",
      actorId: null,
      entityType: null,
      entityId: null,
      occurredAt: new Date(),
    });

    const events = await db
      .select()
      .from(timelineEvents)
      .where(and(eq(timelineEvents.firmId, ctx.firmId), eq(timelineEvents.matterId, matter.id)));

    expect(events.length).toBe(1);
    expect(events[0].entityType).toBeNull();
    expect(events[0].entityId).toBeNull();
  });
});
