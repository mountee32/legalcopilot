/**
 * Calendar Events Integration Tests
 *
 * Tests calendar event CRUD operations against the real database.
 * Uses setupIntegrationSuite() to provide a test firm with cleanup.
 */
import { describe, it, expect } from "vitest";
import { db } from "@/lib/db";
import { calendarEvents } from "@/lib/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { setupIntegrationSuite, setupFreshFirmPerTest } from "@tests/integration/setup";
import {
  createCalendarEvent,
  createHearing,
  createDeadline,
  createMeeting,
} from "@tests/fixtures/factories/calendar-event";
import { createMatter } from "@tests/fixtures/factories/matter";
import { createClient } from "@tests/fixtures/factories/client";
import { createFirm } from "@tests/fixtures/factories/firm";

describe("Calendar Events Integration - CRUD", () => {
  const ctx = setupIntegrationSuite();

  describe("Create", () => {
    it("creates a calendar event with required fields", async () => {
      const event = await createCalendarEvent({
        firmId: ctx.firmId,
        title: "Team Meeting",
        eventType: "meeting",
        startAt: new Date("2025-01-15T10:00:00Z"),
      });

      expect(event.id).toBeDefined();
      expect(event.firmId).toBe(ctx.firmId);
      expect(event.title).toBe("Team Meeting");
      expect(event.eventType).toBe("meeting");
      expect(event.status).toBe("scheduled");
      expect(event.priority).toBe("medium");
      expect(event.allDay).toBe(false);
    });

    it("creates event linked to matter", async () => {
      const client = await createClient({ firmId: ctx.firmId });
      const matter = await createMatter({
        firmId: ctx.firmId,
        clientId: client.id,
        title: "Property Sale",
      });

      const event = await createCalendarEvent({
        firmId: ctx.firmId,
        matterId: matter.id,
        title: "Client Meeting - Property Sale",
        eventType: "meeting",
        startAt: new Date("2025-01-16T14:00:00Z"),
      });

      expect(event.matterId).toBe(matter.id);
      expect(event.title).toContain("Property Sale");
    });

    it("creates event with attendees", async () => {
      const attendees = [
        { id: "user-123", name: "John Doe", email: "john@example.com" },
        { id: "user-456", name: "Jane Smith", email: "jane@example.com" },
      ];

      const eventData = {
        firmId: ctx.firmId,
        title: "Client Consultation",
        eventType: "meeting" as const,
        startAt: new Date("2025-01-20T11:00:00Z"),
        location: "Conference Room A",
      };

      const [event] = await db
        .insert(calendarEvents)
        .values({
          ...eventData,
          status: "scheduled",
          priority: "medium",
          allDay: false,
          attendees: attendees,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      expect(event.attendees).toBeDefined();
      const parsedAttendees = event.attendees as unknown as typeof attendees;
      expect(parsedAttendees).toHaveLength(2);
      expect(parsedAttendees[0].email).toBe("john@example.com");
      expect(parsedAttendees[1].email).toBe("jane@example.com");
    });

    it("persists event data to database", async () => {
      const event = await createCalendarEvent({
        firmId: ctx.firmId,
        title: "Court Hearing",
        eventType: "hearing",
        priority: "high",
        startAt: new Date("2025-02-01T09:30:00Z"),
        endAt: new Date("2025-02-01T11:30:00Z"),
        location: "Royal Courts of Justice",
      });

      const [dbEvent] = await db
        .select()
        .from(calendarEvents)
        .where(eq(calendarEvents.id, event.id));

      expect(dbEvent).toBeDefined();
      expect(dbEvent.title).toBe("Court Hearing");
      expect(dbEvent.eventType).toBe("hearing");
      expect(dbEvent.priority).toBe("high");
      expect(dbEvent.startAt.getTime()).toBe(new Date("2025-02-01T09:30:00Z").getTime());
      expect(dbEvent.endAt?.getTime()).toBe(new Date("2025-02-01T11:30:00Z").getTime());
    });
  });

  describe("Read", () => {
    it("retrieves event by ID", async () => {
      const created = await createCalendarEvent({
        firmId: ctx.firmId,
        title: "Deadline Review",
        eventType: "deadline",
        startAt: new Date("2025-01-25T17:00:00Z"),
      });

      const [retrieved] = await db
        .select()
        .from(calendarEvents)
        .where(eq(calendarEvents.id, created.id));

      expect(retrieved).toBeDefined();
      expect(retrieved.id).toBe(created.id);
      expect(retrieved.title).toBe("Deadline Review");
      expect(retrieved.eventType).toBe("deadline");
    });

    it("lists events for a firm", async () => {
      await createCalendarEvent({
        firmId: ctx.firmId,
        title: "Event 1",
        startAt: new Date("2025-01-10T09:00:00Z"),
      });
      await createCalendarEvent({
        firmId: ctx.firmId,
        title: "Event 2",
        startAt: new Date("2025-01-11T10:00:00Z"),
      });
      await createCalendarEvent({
        firmId: ctx.firmId,
        title: "Event 3",
        startAt: new Date("2025-01-12T11:00:00Z"),
      });

      const firmEvents = await db
        .select()
        .from(calendarEvents)
        .where(eq(calendarEvents.firmId, ctx.firmId));

      expect(firmEvents.length).toBeGreaterThanOrEqual(3);
    });

    it("lists events with date range filter", async () => {
      const startDate = new Date("2025-03-01T00:00:00Z");
      const endDate = new Date("2025-03-31T23:59:59Z");

      // Create events within range
      await createCalendarEvent({
        firmId: ctx.firmId,
        title: "March Event 1",
        startAt: new Date("2025-03-05T10:00:00Z"),
      });
      await createCalendarEvent({
        firmId: ctx.firmId,
        title: "March Event 2",
        startAt: new Date("2025-03-15T14:00:00Z"),
      });

      // Create event outside range
      await createCalendarEvent({
        firmId: ctx.firmId,
        title: "April Event",
        startAt: new Date("2025-04-05T10:00:00Z"),
      });

      const eventsInRange = await db
        .select()
        .from(calendarEvents)
        .where(
          and(
            eq(calendarEvents.firmId, ctx.firmId),
            gte(calendarEvents.startAt, startDate),
            lte(calendarEvents.startAt, endDate)
          )
        );

      const marchEvents = eventsInRange.filter((e) => e.title.startsWith("March"));
      expect(marchEvents.length).toBeGreaterThanOrEqual(2);

      const aprilEvents = eventsInRange.filter((e) => e.title.startsWith("April"));
      expect(aprilEvents.length).toBe(0);
    });
  });

  describe("Update", () => {
    it("updates event time", async () => {
      const event = await createCalendarEvent({
        firmId: ctx.firmId,
        title: "Reschedulable Meeting",
        startAt: new Date("2025-01-20T10:00:00Z"),
        endAt: new Date("2025-01-20T11:00:00Z"),
      });

      const newStartAt = new Date("2025-01-20T14:00:00Z");
      const newEndAt = new Date("2025-01-20T15:00:00Z");

      await db
        .update(calendarEvents)
        .set({
          startAt: newStartAt,
          endAt: newEndAt,
          status: "rescheduled",
          updatedAt: new Date(),
        })
        .where(eq(calendarEvents.id, event.id));

      const [updated] = await db
        .select()
        .from(calendarEvents)
        .where(eq(calendarEvents.id, event.id));

      expect(updated.startAt.getTime()).toBe(newStartAt.getTime());
      expect(updated.endAt?.getTime()).toBe(newEndAt.getTime());
      expect(updated.status).toBe("rescheduled");
    });

    it("updates event title", async () => {
      const event = await createCalendarEvent({
        firmId: ctx.firmId,
        title: "Original Title",
        startAt: new Date("2025-01-22T10:00:00Z"),
      });

      await db
        .update(calendarEvents)
        .set({
          title: "Updated Meeting Title",
          updatedAt: new Date(),
        })
        .where(eq(calendarEvents.id, event.id));

      const [updated] = await db
        .select()
        .from(calendarEvents)
        .where(eq(calendarEvents.id, event.id));

      expect(updated.title).toBe("Updated Meeting Title");
    });

    it("updates event location", async () => {
      const event = await createCalendarEvent({
        firmId: ctx.firmId,
        title: "Location Change Test",
        startAt: new Date("2025-01-23T10:00:00Z"),
        location: "Original Location",
      });

      await db
        .update(calendarEvents)
        .set({
          location: "New Conference Room",
          updatedAt: new Date(),
        })
        .where(eq(calendarEvents.id, event.id));

      const [updated] = await db
        .select()
        .from(calendarEvents)
        .where(eq(calendarEvents.id, event.id));

      expect(updated.location).toBe("New Conference Room");
    });

    it("updates event status to completed", async () => {
      const event = await createCalendarEvent({
        firmId: ctx.firmId,
        title: "Completable Meeting",
        startAt: new Date("2025-01-18T10:00:00Z"),
      });

      await db
        .update(calendarEvents)
        .set({
          status: "completed",
          updatedAt: new Date(),
        })
        .where(eq(calendarEvents.id, event.id));

      const [updated] = await db
        .select()
        .from(calendarEvents)
        .where(eq(calendarEvents.id, event.id));

      expect(updated.status).toBe("completed");
    });
  });

  describe("Delete", () => {
    it("deletes event by setting status to cancelled", async () => {
      const event = await createCalendarEvent({
        firmId: ctx.firmId,
        title: "Cancellable Event",
        startAt: new Date("2025-01-30T10:00:00Z"),
      });

      await db
        .update(calendarEvents)
        .set({
          status: "cancelled",
          updatedAt: new Date(),
        })
        .where(eq(calendarEvents.id, event.id));

      const [cancelled] = await db
        .select()
        .from(calendarEvents)
        .where(eq(calendarEvents.id, event.id));

      expect(cancelled.status).toBe("cancelled");
    });

    it("hard deletes event from database", async () => {
      const event = await createCalendarEvent({
        firmId: ctx.firmId,
        title: "Deletable Event",
        startAt: new Date("2025-01-31T10:00:00Z"),
      });

      await db.delete(calendarEvents).where(eq(calendarEvents.id, event.id));

      const [deleted] = await db
        .select()
        .from(calendarEvents)
        .where(eq(calendarEvents.id, event.id));

      expect(deleted).toBeUndefined();
    });
  });
});

describe("Calendar Events Integration - Event Types", () => {
  const ctx = setupIntegrationSuite();

  it("creates court date event", async () => {
    const client = await createClient({ firmId: ctx.firmId });
    const matter = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
      practiceArea: "litigation",
    });

    const hearing = await createHearing(ctx.firmId, matter.id, {
      title: "Preliminary Hearing",
      startAt: new Date("2025-02-10T10:00:00Z"),
      location: "County Court",
    });

    expect(hearing.eventType).toBe("hearing");
    expect(hearing.priority).toBe("high");
    expect(hearing.matterId).toBe(matter.id);
  });

  it("creates client meeting event", async () => {
    const client = await createClient({ firmId: ctx.firmId });
    const matter = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
    });

    const meeting = await createCalendarEvent({
      firmId: ctx.firmId,
      matterId: matter.id,
      title: "Client Consultation",
      eventType: "meeting",
      startAt: new Date("2025-02-05T14:00:00Z"),
      endAt: new Date("2025-02-05T15:00:00Z"),
      location: "Main Office",
    });

    expect(meeting.eventType).toBe("meeting");
    expect(meeting.matterId).toBe(matter.id);
  });

  it("creates deadline event", async () => {
    const client = await createClient({ firmId: ctx.firmId });
    const matter = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
    });

    const deadline = await createDeadline(ctx.firmId, matter.id, {
      title: "Document Submission Deadline",
      startAt: new Date("2025-02-28T23:59:59Z"),
    });

    expect(deadline.eventType).toBe("deadline");
    expect(deadline.allDay).toBe(true);
    expect(deadline.matterId).toBe(matter.id);
  });

  it("creates internal meeting event", async () => {
    const meeting = await createMeeting(ctx.firmId, {
      title: "Team Standup",
      startAt: new Date("2025-01-27T09:00:00Z"),
      endAt: new Date("2025-01-27T09:30:00Z"),
    });

    expect(meeting.eventType).toBe("meeting");
    expect(meeting.matterId).toBeNull();
  });

  it("creates filing deadline event", async () => {
    const client = await createClient({ firmId: ctx.firmId });
    const matter = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
    });

    const filingDeadline = await createCalendarEvent({
      firmId: ctx.firmId,
      matterId: matter.id,
      title: "Court Filing Deadline",
      eventType: "filing_deadline",
      priority: "critical",
      startAt: new Date("2025-03-15T16:00:00Z"),
      allDay: true,
    });

    expect(filingDeadline.eventType).toBe("filing_deadline");
    expect(filingDeadline.priority).toBe("critical");
  });

  it("creates limitation date event", async () => {
    const client = await createClient({ firmId: ctx.firmId });
    const matter = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
      practiceArea: "personal_injury",
    });

    const limitationDate = await createCalendarEvent({
      firmId: ctx.firmId,
      matterId: matter.id,
      title: "Limitation Date - Personal Injury Claim",
      eventType: "limitation_date",
      priority: "critical",
      startAt: new Date("2025-06-30T23:59:59Z"),
      allDay: true,
    });

    expect(limitationDate.eventType).toBe("limitation_date");
    expect(limitationDate.priority).toBe("critical");
  });
});

describe("Calendar Events Integration - Upcoming Events", () => {
  const ctx = setupIntegrationSuite();

  it("gets upcoming events for user", async () => {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Create upcoming events
    await createCalendarEvent({
      firmId: ctx.firmId,
      title: "Tomorrow's Meeting",
      startAt: tomorrow,
    });
    await createCalendarEvent({
      firmId: ctx.firmId,
      title: "Next Week's Meeting",
      startAt: nextWeek,
    });

    // Create past event
    await createCalendarEvent({
      firmId: ctx.firmId,
      title: "Yesterday's Meeting",
      startAt: yesterday,
    });

    const upcomingEvents = await db
      .select()
      .from(calendarEvents)
      .where(and(eq(calendarEvents.firmId, ctx.firmId), gte(calendarEvents.startAt, now)))
      .orderBy(calendarEvents.startAt);

    const upcomingTitles = upcomingEvents.map((e) => e.title);
    expect(upcomingTitles).toContain("Tomorrow's Meeting");
    expect(upcomingTitles).toContain("Next Week's Meeting");
    expect(upcomingTitles).not.toContain("Yesterday's Meeting");
  });

  it("filters upcoming events by date range", async () => {
    const startDate = new Date("2025-04-01T00:00:00Z");
    const endDate = new Date("2025-04-30T23:59:59Z");

    // Create events in April
    await createCalendarEvent({
      firmId: ctx.firmId,
      title: "April Event 1",
      startAt: new Date("2025-04-05T10:00:00Z"),
    });
    await createCalendarEvent({
      firmId: ctx.firmId,
      title: "April Event 2",
      startAt: new Date("2025-04-20T14:00:00Z"),
    });

    // Create event in May
    await createCalendarEvent({
      firmId: ctx.firmId,
      title: "May Event",
      startAt: new Date("2025-05-10T10:00:00Z"),
    });

    const aprilEvents = await db
      .select()
      .from(calendarEvents)
      .where(
        and(
          eq(calendarEvents.firmId, ctx.firmId),
          gte(calendarEvents.startAt, startDate),
          lte(calendarEvents.startAt, endDate)
        )
      )
      .orderBy(calendarEvents.startAt);

    const aprilTitles = aprilEvents.map((e) => e.title);
    expect(aprilTitles.filter((t) => t.startsWith("April")).length).toBeGreaterThanOrEqual(2);
    expect(aprilTitles).not.toContain("May Event");
  });

  it("includes matter context in upcoming events", async () => {
    const client = await createClient({
      firmId: ctx.firmId,
      firstName: "Context",
      lastName: "Client",
    });
    const matter = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
      title: "Property Purchase - 123 Main St",
    });

    const event = await createCalendarEvent({
      firmId: ctx.firmId,
      matterId: matter.id,
      title: "Exchange Contracts",
      eventType: "deadline",
      startAt: new Date("2025-05-15T17:00:00Z"),
    });

    // Query event with matter join
    const { matters } = await import("@/lib/db/schema");
    const [eventWithMatter] = await db
      .select({
        event: calendarEvents,
        matter: matters,
      })
      .from(calendarEvents)
      .leftJoin(matters, eq(calendarEvents.matterId, matters.id))
      .where(eq(calendarEvents.id, event.id));

    expect(eventWithMatter.event.matterId).toBe(matter.id);
    expect(eventWithMatter.matter?.title).toBe("Property Purchase - 123 Main St");
  });

  it("filters upcoming events by event type", async () => {
    const futureDate = new Date("2025-06-01T00:00:00Z");

    await createCalendarEvent({
      firmId: ctx.firmId,
      title: "Future Hearing",
      eventType: "hearing",
      startAt: new Date("2025-06-05T10:00:00Z"),
    });
    await createCalendarEvent({
      firmId: ctx.firmId,
      title: "Future Meeting",
      eventType: "meeting",
      startAt: new Date("2025-06-06T14:00:00Z"),
    });
    await createCalendarEvent({
      firmId: ctx.firmId,
      title: "Future Deadline",
      eventType: "deadline",
      startAt: new Date("2025-06-07T23:59:59Z"),
    });

    const upcomingHearings = await db
      .select()
      .from(calendarEvents)
      .where(
        and(
          eq(calendarEvents.firmId, ctx.firmId),
          eq(calendarEvents.eventType, "hearing"),
          gte(calendarEvents.startAt, futureDate)
        )
      );

    expect(upcomingHearings.length).toBeGreaterThanOrEqual(1);
    expect(upcomingHearings.every((e) => e.eventType === "hearing")).toBe(true);
  });
});

describe("Calendar Events Integration - Multi-Tenancy", () => {
  const ctx = setupFreshFirmPerTest();

  it("isolates events between firms", async () => {
    // Create event in first firm
    const event1 = await createCalendarEvent({
      firmId: ctx.firmId,
      title: "Firm 1 Event",
      startAt: new Date("2025-07-01T10:00:00Z"),
    });

    // Create second firm
    const firm2 = await createFirm({ name: "Second Test Firm" });

    // Create event in second firm
    const event2 = await createCalendarEvent({
      firmId: firm2.id,
      title: "Firm 2 Event",
      startAt: new Date("2025-07-02T10:00:00Z"),
    });

    // Query events for first firm
    const firm1Events = await db
      .select()
      .from(calendarEvents)
      .where(eq(calendarEvents.firmId, ctx.firmId));

    // Query events for second firm
    const firm2Events = await db
      .select()
      .from(calendarEvents)
      .where(eq(calendarEvents.firmId, firm2.id));

    // Each firm should only see their own events
    expect(firm1Events.some((e) => e.id === event1.id)).toBe(true);
    expect(firm1Events.some((e) => e.id === event2.id)).toBe(false);

    expect(firm2Events.some((e) => e.id === event2.id)).toBe(true);
    expect(firm2Events.some((e) => e.id === event1.id)).toBe(false);

    // Cleanup second firm
    await db.delete(calendarEvents).where(eq(calendarEvents.firmId, firm2.id));
    const { firms } = await import("@/lib/db/schema");
    await db.delete(firms).where(eq(firms.id, firm2.id));
  });

  it("cannot access other firm's events", async () => {
    // Create event in first firm
    const event1 = await createCalendarEvent({
      firmId: ctx.firmId,
      title: "Isolated Event",
      startAt: new Date("2025-07-05T10:00:00Z"),
    });

    // Create second firm
    const firm2 = await createFirm({ name: "Another Test Firm" });

    // Try to query event1 with firm2's firmId filter (simulating API check)
    const result = await db
      .select()
      .from(calendarEvents)
      .where(and(eq(calendarEvents.id, event1.id), eq(calendarEvents.firmId, firm2.id)));

    // Should not find the event
    expect(result.length).toBe(0);

    // Cleanup second firm
    const { firms } = await import("@/lib/db/schema");
    await db.delete(firms).where(eq(firms.id, firm2.id));
  });

  it("isolates matter-linked events between firms", async () => {
    // Create client and matter in first firm
    const client1 = await createClient({ firmId: ctx.firmId });
    const matter1 = await createMatter({
      firmId: ctx.firmId,
      clientId: client1.id,
      title: "Firm 1 Matter",
    });
    const event1 = await createCalendarEvent({
      firmId: ctx.firmId,
      matterId: matter1.id,
      title: "Firm 1 Matter Event",
      startAt: new Date("2025-07-10T10:00:00Z"),
    });

    // Create second firm with client and matter
    const firm2 = await createFirm({ name: "Isolation Test Firm" });
    const client2 = await createClient({ firmId: firm2.id });
    const matter2 = await createMatter({
      firmId: firm2.id,
      clientId: client2.id,
      title: "Firm 2 Matter",
    });
    const event2 = await createCalendarEvent({
      firmId: firm2.id,
      matterId: matter2.id,
      title: "Firm 2 Matter Event",
      startAt: new Date("2025-07-11T10:00:00Z"),
    });

    // Query events by matter for each firm
    const firm1MatterEvents = await db
      .select()
      .from(calendarEvents)
      .where(and(eq(calendarEvents.firmId, ctx.firmId), eq(calendarEvents.matterId, matter1.id)));

    const firm2MatterEvents = await db
      .select()
      .from(calendarEvents)
      .where(and(eq(calendarEvents.firmId, firm2.id), eq(calendarEvents.matterId, matter2.id)));

    expect(firm1MatterEvents.some((e) => e.id === event1.id)).toBe(true);
    expect(firm1MatterEvents.some((e) => e.id === event2.id)).toBe(false);

    expect(firm2MatterEvents.some((e) => e.id === event2.id)).toBe(true);
    expect(firm2MatterEvents.some((e) => e.id === event1.id)).toBe(false);

    // Cleanup second firm
    await db.delete(calendarEvents).where(eq(calendarEvents.firmId, firm2.id));
    const { matters, clients, firms } = await import("@/lib/db/schema");
    await db.delete(matters).where(eq(matters.firmId, firm2.id));
    await db.delete(clients).where(eq(clients.firmId, firm2.id));
    await db.delete(firms).where(eq(firms.id, firm2.id));
  });
});
