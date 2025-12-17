// @vitest-environment node
/**
 * Notification Preferences & Read-All Integration Tests
 *
 * Tests the `/api/notifications/preferences` and `/api/notifications/read-all`
 * API endpoints against a real database with mocked authentication.
 */
import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from "vitest";
import { NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { notifications, notificationPreferences } from "@/lib/db/schema";
import { setupIntegrationSuite } from "@tests/integration/setup";
import { createUser } from "@tests/fixtures/factories/user";
import {
  createNotifications,
  createNotificationPreferences,
} from "@tests/fixtures/factories/notification";

// Test context for auth mocking
let testUserId: string = "";
let testFirmId: string = "";

// Mock the auth module to return our test user
vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(async () => {
        if (!testUserId) return null;
        return { user: { id: testUserId } };
      }),
    },
  },
}));

// Mock tenancy to return our test firm
vi.mock("@/lib/tenancy", () => ({
  getOrCreateFirmIdForUser: vi.fn(async () => testFirmId),
}));

describe("Notification Preferences API - Integration Tests", () => {
  const ctx = setupIntegrationSuite();

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset test context
    testFirmId = ctx.firmId;
    testUserId = "";
  });

  describe("GET /api/notifications/preferences", () => {
    it("returns empty preferences for new user", async () => {
      const user = await createUser({ firmId: ctx.firmId });
      testUserId = user.id;
      testFirmId = ctx.firmId;

      const { GET } = await import("@/app/api/notifications/preferences/route");

      const request = new NextRequest("http://localhost/api/notifications/preferences", {
        method: "GET",
      });

      const response = await GET(request as any, {} as any);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.preferences).toEqual({});
      expect(body.updatedAt).toBeDefined();
    });

    it("returns saved preferences for user", async () => {
      const user = await createUser({ firmId: ctx.firmId });
      testUserId = user.id;
      testFirmId = ctx.firmId;

      // Create preferences in database
      await createNotificationPreferences({
        firmId: ctx.firmId,
        userId: user.id,
        preferences: {
          channelsByType: {
            task_assigned: ["in_app", "email"],
            approval_required: ["in_app"],
          },
        },
      });

      const { GET } = await import("@/app/api/notifications/preferences/route");

      const request = new NextRequest("http://localhost/api/notifications/preferences", {
        method: "GET",
      });

      const response = await GET(request as any, {} as any);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.preferences.channelsByType.task_assigned).toEqual(["in_app", "email"]);
      expect(body.preferences.channelsByType.approval_required).toEqual(["in_app"]);
    });
  });

  describe("PATCH /api/notifications/preferences", () => {
    it("creates preferences if none exist", async () => {
      const user = await createUser({ firmId: ctx.firmId });
      testUserId = user.id;
      testFirmId = ctx.firmId;

      const { PATCH } = await import("@/app/api/notifications/preferences/route");

      const request = new NextRequest("http://localhost/api/notifications/preferences", {
        method: "PATCH",
        headers: new Headers({
          "content-type": "application/json",
        }),
        body: JSON.stringify({
          channelsByType: {
            system: ["in_app", "email"],
          },
        }),
      });

      const response = await PATCH(request as any, {} as any);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.preferences.channelsByType.system).toEqual(["in_app", "email"]);

      // Verify persisted to database
      const [saved] = await db
        .select()
        .from(notificationPreferences)
        .where(
          and(
            eq(notificationPreferences.firmId, ctx.firmId),
            eq(notificationPreferences.userId, user.id)
          )
        );

      expect(saved).toBeDefined();
      expect((saved.preferences as any).channelsByType.system).toEqual(["in_app", "email"]);
    });

    it("updates existing preferences with deep merge", async () => {
      const user = await createUser({ firmId: ctx.firmId });
      testUserId = user.id;
      testFirmId = ctx.firmId;

      // Create initial preferences
      await createNotificationPreferences({
        firmId: ctx.firmId,
        userId: user.id,
        preferences: {
          channelsByType: {
            task_assigned: ["in_app"],
          },
          emailDigest: "daily",
        },
      });

      const { PATCH } = await import("@/app/api/notifications/preferences/route");

      const request = new NextRequest("http://localhost/api/notifications/preferences", {
        method: "PATCH",
        headers: new Headers({
          "content-type": "application/json",
        }),
        body: JSON.stringify({
          channelsByType: {
            task_assigned: ["in_app", "email"],
            approval_required: ["in_app", "push"],
          },
        }),
      });

      const response = await PATCH(request as any, {} as any);

      expect(response.status).toBe(200);
      const body = await response.json();

      // New channels merged
      expect(body.preferences.channelsByType.task_assigned).toEqual(["in_app", "email"]);
      expect(body.preferences.channelsByType.approval_required).toEqual(["in_app", "push"]);
      // Existing unrelated preferences preserved
      expect(body.preferences.emailDigest).toBe("daily");
    });

    it("preserves unrelated preferences on partial update", async () => {
      const user = await createUser({ firmId: ctx.firmId });
      testUserId = user.id;
      testFirmId = ctx.firmId;

      // Create initial preferences with multiple fields
      await createNotificationPreferences({
        firmId: ctx.firmId,
        userId: user.id,
        preferences: {
          channelsByType: {
            task_assigned: ["in_app"],
          },
          emailDigest: "weekly",
          quietHours: { start: "22:00", end: "08:00" },
        },
      });

      const { PATCH } = await import("@/app/api/notifications/preferences/route");

      // Update only emailDigest
      const request = new NextRequest("http://localhost/api/notifications/preferences", {
        method: "PATCH",
        headers: new Headers({
          "content-type": "application/json",
        }),
        body: JSON.stringify({
          emailDigest: "daily",
        }),
      });

      const response = await PATCH(request as any, {} as any);

      expect(response.status).toBe(200);
      const body = await response.json();

      // Updated field
      expect(body.preferences.emailDigest).toBe("daily");
      // Preserved fields
      expect(body.preferences.channelsByType.task_assigned).toEqual(["in_app"]);
      expect(body.preferences.quietHours).toEqual({ start: "22:00", end: "08:00" });
    });
  });

  describe("POST /api/notifications/read-all", () => {
    it("marks all unread notifications as read", async () => {
      const user = await createUser({ firmId: ctx.firmId });
      testUserId = user.id;
      testFirmId = ctx.firmId;

      // Create some unread notifications
      await createNotifications(ctx.firmId, user.id, 5, { read: false });

      const { POST } = await import("@/app/api/notifications/read-all/route");

      const request = new NextRequest("http://localhost/api/notifications/read-all", {
        method: "POST",
      });

      const response = await POST(request as any, {} as any);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);

      // Verify all notifications are now read
      const unread = await db
        .select()
        .from(notifications)
        .where(
          and(
            eq(notifications.firmId, ctx.firmId),
            eq(notifications.userId, user.id),
            eq(notifications.read, false)
          )
        );

      expect(unread.length).toBe(0);
    });

    it("returns success even with no unread notifications", async () => {
      const user = await createUser({ firmId: ctx.firmId });
      testUserId = user.id;
      testFirmId = ctx.firmId;

      // Create some already-read notifications
      await createNotifications(ctx.firmId, user.id, 3, {
        read: true,
        readAt: new Date(),
      });

      const { POST } = await import("@/app/api/notifications/read-all/route");

      const request = new NextRequest("http://localhost/api/notifications/read-all", {
        method: "POST",
      });

      const response = await POST(request as any, {} as any);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
    });

    it("only affects current user notifications", async () => {
      const user1 = await createUser({ firmId: ctx.firmId });
      const user2 = await createUser({ firmId: ctx.firmId });

      // Set auth context to user1
      testUserId = user1.id;
      testFirmId = ctx.firmId;

      // Create unread notifications for both users
      await createNotifications(ctx.firmId, user1.id, 3, { read: false });
      await createNotifications(ctx.firmId, user2.id, 4, { read: false });

      const { POST } = await import("@/app/api/notifications/read-all/route");

      // Mark user1's notifications as read
      const request = new NextRequest("http://localhost/api/notifications/read-all", {
        method: "POST",
      });

      const response = await POST(request as any, {} as any);

      expect(response.status).toBe(200);

      // User1's notifications should be read
      const user1Unread = await db
        .select()
        .from(notifications)
        .where(
          and(
            eq(notifications.firmId, ctx.firmId),
            eq(notifications.userId, user1.id),
            eq(notifications.read, false)
          )
        );

      expect(user1Unread.length).toBe(0);

      // User2's notifications should still be unread
      const user2Unread = await db
        .select()
        .from(notifications)
        .where(
          and(
            eq(notifications.firmId, ctx.firmId),
            eq(notifications.userId, user2.id),
            eq(notifications.read, false)
          )
        );

      expect(user2Unread.length).toBe(4);
    });
  });
});
