/**
 * Calendar Upcoming Events Integration Tests
 *
 * Tests upcoming calendar event queries against the real database.
 * Uses setupIntegrationSuite() to provide a test firm with cleanup.
 */
import { describe, it, expect } from "vitest";
import { db } from "@/lib/db";
import { calendarEvents } from "@/lib/db/schema";
import { eq, and, gte, lte, asc } from "drizzle-orm";
import { setupIntegrationSuite, setupFreshFirmPerTest } from "@tests/integration/setup";
import { createCalendarEvent } from "@tests/fixtures/factories/calendar-event";
import { createMatter } from "@tests/fixtures/factories/matter";
import { createClient } from "@tests/fixtures/factories/client";
import { createFirm } from "@tests/fixtures/factories/firm";

describe("Calendar Events Integration - Upcoming", () => {
  const ctx = setupIntegrationSuite();

  describe("Get Upcoming Events - Date Range", () => {
    it("returns no events when window is empty", async () => {
      const now = new Date();
      const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      // Create event outside the 7-day window
      await createCalendarEvent({
        firmId: ctx.firmId,
        title: "Far Future Event",
        startAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      });

      // Query for events in next 7 days
      const upcomingEvents = await db
        .select()
        .from(calendarEvents)
        .where(
          and(
            eq(calendarEvents.firmId, ctx.firmId),
            gte(calendarEvents.startAt, now),
            lte(calendarEvents.startAt, sevenDaysFromNow)
          )
        )
        .orderBy(asc(calendarEvents.startAt));

      const farFutureEvents = upcomingEvents.filter((e) => e.title === "Far Future Event");
      expect(farFutureEvents.length).toBe(0);
    });

    it("returns events in next 7 days", async () => {
      const now = new Date();
      const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      // Create events within the 7-day window
      const event1 = await createCalendarEvent({
        firmId: ctx.firmId,
        title: "Tomorrow Meeting",
        startAt: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
      });

      const event2 = await createCalendarEvent({
        firmId: ctx.firmId,
        title: "In 3 Days Deadline",
        startAt: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      });

      const event3 = await createCalendarEvent({
        firmId: ctx.firmId,
        title: "In 5 Days Hearing",
        startAt: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      });

      // Query for events in next 7 days
      const upcomingEvents = await db
        .select()
        .from(calendarEvents)
        .where(
          and(
            eq(calendarEvents.firmId, ctx.firmId),
            gte(calendarEvents.startAt, now),
            lte(calendarEvents.startAt, sevenDaysFromNow)
          )
        )
        .orderBy(asc(calendarEvents.startAt));

      const eventIds = upcomingEvents.map((e) => e.id);
      expect(eventIds).toContain(event1.id);
      expect(eventIds).toContain(event2.id);
      expect(eventIds).toContain(event3.id);
    });

    it("supports custom date range", async () => {
      const startDate = new Date("2025-08-01T00:00:00Z");
      const endDate = new Date("2025-08-31T23:59:59Z");

      // Create events in August 2025
      const event1 = await createCalendarEvent({
        firmId: ctx.firmId,
        title: "Early August Event",
        startAt: new Date("2025-08-05T10:00:00Z"),
      });

      const event2 = await createCalendarEvent({
        firmId: ctx.firmId,
        title: "Mid August Event",
        startAt: new Date("2025-08-15T14:00:00Z"),
      });

      // Create event outside range
      await createCalendarEvent({
        firmId: ctx.firmId,
        title: "September Event",
        startAt: new Date("2025-09-05T10:00:00Z"),
      });

      // Query for events in August
      const augustEvents = await db
        .select()
        .from(calendarEvents)
        .where(
          and(
            eq(calendarEvents.firmId, ctx.firmId),
            gte(calendarEvents.startAt, startDate),
            lte(calendarEvents.startAt, endDate)
          )
        )
        .orderBy(asc(calendarEvents.startAt));

      const augustTitles = augustEvents.map((e) => e.title);
      expect(augustTitles).toContain("Early August Event");
      expect(augustTitles).toContain("Mid August Event");
      expect(augustTitles).not.toContain("September Event");
    });
  });

  describe("Get Upcoming Events - Chronological Order", () => {
    it("returns events in chronological order", async () => {
      const now = new Date();

      // Create events in non-chronological order
      const event3 = await createCalendarEvent({
        firmId: ctx.firmId,
        title: "Third Event",
        startAt: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
      });

      const event1 = await createCalendarEvent({
        firmId: ctx.firmId,
        title: "First Event",
        startAt: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000),
      });

      const event2 = await createCalendarEvent({
        firmId: ctx.firmId,
        title: "Second Event",
        startAt: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
      });

      // Query with ordering
      const upcomingEvents = await db
        .select()
        .from(calendarEvents)
        .where(and(eq(calendarEvents.firmId, ctx.firmId), gte(calendarEvents.startAt, now)))
        .orderBy(asc(calendarEvents.startAt));

      // Find the positions of our events
      const firstEventIndex = upcomingEvents.findIndex((e) => e.id === event1.id);
      const secondEventIndex = upcomingEvents.findIndex((e) => e.id === event2.id);
      const thirdEventIndex = upcomingEvents.findIndex((e) => e.id === event3.id);

      // Verify chronological order
      expect(firstEventIndex).toBeGreaterThanOrEqual(0);
      expect(secondEventIndex).toBeGreaterThanOrEqual(0);
      expect(thirdEventIndex).toBeGreaterThanOrEqual(0);
      expect(firstEventIndex).toBeLessThan(secondEventIndex);
      expect(secondEventIndex).toBeLessThan(thirdEventIndex);
    });

    it("handles same-day events with time ordering", async () => {
      const baseDate = new Date("2025-09-15T00:00:00Z");

      // Create events on the same day at different times
      const morning = await createCalendarEvent({
        firmId: ctx.firmId,
        title: "Morning Meeting",
        startAt: new Date("2025-09-15T09:00:00Z"),
      });

      const afternoon = await createCalendarEvent({
        firmId: ctx.firmId,
        title: "Afternoon Meeting",
        startAt: new Date("2025-09-15T14:00:00Z"),
      });

      const evening = await createCalendarEvent({
        firmId: ctx.firmId,
        title: "Evening Meeting",
        startAt: new Date("2025-09-15T18:00:00Z"),
      });

      // Query for that day
      const sameDayEvents = await db
        .select()
        .from(calendarEvents)
        .where(
          and(
            eq(calendarEvents.firmId, ctx.firmId),
            gte(calendarEvents.startAt, baseDate),
            lte(calendarEvents.startAt, new Date("2025-09-15T23:59:59Z"))
          )
        )
        .orderBy(asc(calendarEvents.startAt));

      const titles = sameDayEvents.map((e) => e.title);
      const morningIdx = titles.indexOf("Morning Meeting");
      const afternoonIdx = titles.indexOf("Afternoon Meeting");
      const eveningIdx = titles.indexOf("Evening Meeting");

      expect(morningIdx).toBeGreaterThanOrEqual(0);
      expect(afternoonIdx).toBeGreaterThanOrEqual(0);
      expect(eveningIdx).toBeGreaterThanOrEqual(0);
      expect(morningIdx).toBeLessThan(afternoonIdx);
      expect(afternoonIdx).toBeLessThan(eveningIdx);
    });
  });

  describe("Get Upcoming Events - Exclude Past Events", () => {
    it("excludes past events from results", async () => {
      const now = new Date();

      // Create past events
      const yesterday = await createCalendarEvent({
        firmId: ctx.firmId,
        title: "Yesterday Event",
        startAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      });

      const lastWeek = await createCalendarEvent({
        firmId: ctx.firmId,
        title: "Last Week Event",
        startAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      });

      // Create future event
      const tomorrow = await createCalendarEvent({
        firmId: ctx.firmId,
        title: "Tomorrow Event",
        startAt: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000),
      });

      // Query for upcoming events (from now onwards)
      const upcomingEvents = await db
        .select()
        .from(calendarEvents)
        .where(and(eq(calendarEvents.firmId, ctx.firmId), gte(calendarEvents.startAt, now)))
        .orderBy(asc(calendarEvents.startAt));

      const titles = upcomingEvents.map((e) => e.title);
      expect(titles).toContain("Tomorrow Event");
      expect(titles).not.toContain("Yesterday Event");
      expect(titles).not.toContain("Last Week Event");
    });

    it("includes events starting right now", async () => {
      const now = new Date();

      // Create event starting now
      const currentEvent = await createCalendarEvent({
        firmId: ctx.firmId,
        title: "Current Event",
        startAt: now,
      });

      // Query for upcoming events (>= now)
      const upcomingEvents = await db
        .select()
        .from(calendarEvents)
        .where(and(eq(calendarEvents.firmId, ctx.firmId), gte(calendarEvents.startAt, now)))
        .orderBy(asc(calendarEvents.startAt));

      const eventIds = upcomingEvents.map((e) => e.id);
      expect(eventIds).toContain(currentEvent.id);
    });
  });

  describe("Get Upcoming Events - Include Recurring Events", () => {
    it("includes events with recurrence rules", async () => {
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);

      // Create recurring event
      const recurringEvent = await db
        .insert(calendarEvents)
        .values({
          firmId: ctx.firmId,
          title: "Weekly Team Meeting",
          eventType: "meeting",
          status: "scheduled",
          priority: "medium",
          startAt: tomorrow,
          allDay: false,
          recurrence: {
            freq: "WEEKLY",
            interval: 1,
            byweekday: ["MO"],
            count: 10,
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      // Query for upcoming events
      const upcomingEvents = await db
        .select()
        .from(calendarEvents)
        .where(and(eq(calendarEvents.firmId, ctx.firmId), gte(calendarEvents.startAt, now)))
        .orderBy(asc(calendarEvents.startAt));

      const recurringTitles = upcomingEvents.filter((e) => e.title === "Weekly Team Meeting");
      expect(recurringTitles.length).toBeGreaterThanOrEqual(1);
      expect(recurringTitles[0].recurrence).toBeDefined();
    });

    it("includes all event types in upcoming results", async () => {
      const now = new Date();
      const futureBase = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

      // Create different event types
      await createCalendarEvent({
        firmId: ctx.firmId,
        title: "Upcoming Hearing",
        eventType: "hearing",
        startAt: new Date(futureBase.getTime() + 1 * 60 * 60 * 1000),
      });

      await createCalendarEvent({
        firmId: ctx.firmId,
        title: "Upcoming Deadline",
        eventType: "deadline",
        startAt: new Date(futureBase.getTime() + 2 * 60 * 60 * 1000),
      });

      await createCalendarEvent({
        firmId: ctx.firmId,
        title: "Upcoming Meeting",
        eventType: "meeting",
        startAt: new Date(futureBase.getTime() + 3 * 60 * 60 * 1000),
      });

      await createCalendarEvent({
        firmId: ctx.firmId,
        title: "Upcoming Reminder",
        eventType: "reminder",
        startAt: new Date(futureBase.getTime() + 4 * 60 * 60 * 1000),
      });

      // Query for upcoming events
      const upcomingEvents = await db
        .select()
        .from(calendarEvents)
        .where(and(eq(calendarEvents.firmId, ctx.firmId), gte(calendarEvents.startAt, now)))
        .orderBy(asc(calendarEvents.startAt));

      const titles = upcomingEvents.map((e) => e.title);
      expect(titles).toContain("Upcoming Hearing");
      expect(titles).toContain("Upcoming Deadline");
      expect(titles).toContain("Upcoming Meeting");
      expect(titles).toContain("Upcoming Reminder");
    });
  });

  describe("Get Upcoming Events - Filter by Attendee", () => {
    it("filters events by attendee user ID", async () => {
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);

      const userId1 = "user-123";
      const userId2 = "user-456";

      // Create event with attendee 1
      await db.insert(calendarEvents).values({
        firmId: ctx.firmId,
        title: "Event for User 1",
        eventType: "meeting",
        status: "scheduled",
        priority: "medium",
        startAt: tomorrow,
        allDay: false,
        attendees: [{ id: userId1, name: "User One" }],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Create event with attendee 2
      await db.insert(calendarEvents).values({
        firmId: ctx.firmId,
        title: "Event for User 2",
        eventType: "meeting",
        status: "scheduled",
        priority: "medium",
        startAt: tomorrow,
        allDay: false,
        attendees: [{ id: userId2, name: "User Two" }],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Create event with both attendees
      await db.insert(calendarEvents).values({
        firmId: ctx.firmId,
        title: "Event for Both",
        eventType: "meeting",
        status: "scheduled",
        priority: "medium",
        startAt: tomorrow,
        allDay: false,
        attendees: [
          { id: userId1, name: "User One" },
          { id: userId2, name: "User Two" },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Query all upcoming events
      const allEvents = await db
        .select()
        .from(calendarEvents)
        .where(and(eq(calendarEvents.firmId, ctx.firmId), gte(calendarEvents.startAt, now)))
        .orderBy(asc(calendarEvents.startAt));

      // Filter by attendee in application logic (as JSONB querying is complex)
      const user1Events = allEvents.filter((e) => {
        const attendees = e.attendees as unknown as { id: string; name: string }[] | null;
        return attendees?.some((a) => a.id === userId1);
      });

      const user2Events = allEvents.filter((e) => {
        const attendees = e.attendees as unknown as { id: string; name: string }[] | null;
        return attendees?.some((a) => a.id === userId2);
      });

      const user1Titles = user1Events.map((e) => e.title);
      const user2Titles = user2Events.map((e) => e.title);

      expect(user1Titles).toContain("Event for User 1");
      expect(user1Titles).toContain("Event for Both");
      expect(user1Titles).not.toContain("Event for User 2");

      expect(user2Titles).toContain("Event for User 2");
      expect(user2Titles).toContain("Event for Both");
      expect(user2Titles).not.toContain("Event for User 1");
    });
  });

  describe("Get Upcoming Events - Multi-Tenancy Isolation", () => {
    const ctx2 = setupFreshFirmPerTest();

    it("isolates upcoming events between firms", async () => {
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);

      // Create event in first firm
      const firm1Event = await createCalendarEvent({
        firmId: ctx2.firmId,
        title: "Firm 1 Upcoming Event",
        startAt: tomorrow,
      });

      // Create second firm
      const firm2 = await createFirm({ name: "Second Firm for Upcoming Test" });

      // Create event in second firm
      const firm2Event = await createCalendarEvent({
        firmId: firm2.id,
        title: "Firm 2 Upcoming Event",
        startAt: tomorrow,
      });

      // Query upcoming events for first firm
      const firm1Upcoming = await db
        .select()
        .from(calendarEvents)
        .where(and(eq(calendarEvents.firmId, ctx2.firmId), gte(calendarEvents.startAt, now)))
        .orderBy(asc(calendarEvents.startAt));

      // Query upcoming events for second firm
      const firm2Upcoming = await db
        .select()
        .from(calendarEvents)
        .where(and(eq(calendarEvents.firmId, firm2.id), gte(calendarEvents.startAt, now)))
        .orderBy(asc(calendarEvents.startAt));

      // Each firm should only see their own events
      expect(firm1Upcoming.some((e) => e.id === firm1Event.id)).toBe(true);
      expect(firm1Upcoming.some((e) => e.id === firm2Event.id)).toBe(false);

      expect(firm2Upcoming.some((e) => e.id === firm2Event.id)).toBe(true);
      expect(firm2Upcoming.some((e) => e.id === firm1Event.id)).toBe(false);

      // Cleanup second firm
      await db.delete(calendarEvents).where(eq(calendarEvents.firmId, firm2.id));
      const { firms } = await import("@/lib/db/schema");
      await db.delete(firms).where(eq(firms.id, firm2.id));
    });

    it("respects matter filtering with multi-tenancy", async () => {
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);

      // Create client and matter in firm
      const client = await createClient({ firmId: ctx2.firmId });
      const matter = await createMatter({
        firmId: ctx2.firmId,
        clientId: client.id,
        title: "Test Matter for Upcoming",
      });

      // Create matter-specific event
      const matterEvent = await createCalendarEvent({
        firmId: ctx2.firmId,
        matterId: matter.id,
        title: "Matter Upcoming Event",
        startAt: tomorrow,
      });

      // Create firm-wide event (no matter)
      const firmEvent = await createCalendarEvent({
        firmId: ctx2.firmId,
        matterId: null,
        title: "Firm-wide Upcoming Event",
        startAt: tomorrow,
      });

      // Query upcoming events for specific matter
      const matterUpcoming = await db
        .select()
        .from(calendarEvents)
        .where(
          and(
            eq(calendarEvents.firmId, ctx2.firmId),
            eq(calendarEvents.matterId, matter.id),
            gte(calendarEvents.startAt, now)
          )
        )
        .orderBy(asc(calendarEvents.startAt));

      // Query all firm upcoming events
      const allFirmUpcoming = await db
        .select()
        .from(calendarEvents)
        .where(and(eq(calendarEvents.firmId, ctx2.firmId), gte(calendarEvents.startAt, now)))
        .orderBy(asc(calendarEvents.startAt));

      // Matter-specific query should only show matter event
      const matterEventIds = matterUpcoming.map((e) => e.id);
      expect(matterEventIds).toContain(matterEvent.id);
      expect(matterEventIds).not.toContain(firmEvent.id);

      // All firm query should show both
      const allEventIds = allFirmUpcoming.map((e) => e.id);
      expect(allEventIds).toContain(matterEvent.id);
      expect(allEventIds).toContain(firmEvent.id);
    });
  });
});
