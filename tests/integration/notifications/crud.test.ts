/**
 * Notifications Integration Tests
 *
 * Tests notification CRUD operations, filtering, and preferences against the real database.
 * Uses setupIntegrationSuite() to provide a test firm with cleanup.
 */
import { describe, it, expect } from "vitest";
import { db } from "@/lib/db";
import { notifications, notificationPreferences } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { setupIntegrationSuite, setupFreshFirmPerTest } from "@tests/integration/setup";
import {
  createNotification,
  createNotifications,
  createNotificationPreferences,
} from "@tests/fixtures/factories/notification";
import { createUser } from "@tests/fixtures/factories/user";
import { createFirm } from "@tests/fixtures/factories/firm";

describe("Notifications Integration - CRUD", () => {
  const ctx = setupIntegrationSuite();

  describe("Create", () => {
    it("creates a notification for a user", async () => {
      const user = await createUser({ firmId: ctx.firmId });

      const notification = await createNotification({
        firmId: ctx.firmId,
        userId: user.id,
        type: "task_assigned",
        title: "New Task Assigned",
        body: "You have been assigned a new task",
      });

      expect(notification.id).toBeDefined();
      expect(notification.firmId).toBe(ctx.firmId);
      expect(notification.userId).toBe(user.id);
      expect(notification.type).toBe("task_assigned");
      expect(notification.title).toBe("New Task Assigned");
      expect(notification.read).toBe(false);
      expect(notification.readAt).toBeNull();
    });

    it("creates notification with link and metadata", async () => {
      const user = await createUser({ firmId: ctx.firmId });

      const notification = await createNotification({
        firmId: ctx.firmId,
        userId: user.id,
        type: "approval_required",
        title: "Approval Required",
        body: "A document requires your approval",
        link: "/documents/123",
        metadata: { documentId: "doc-123", priority: "high" },
      });

      expect(notification.link).toBe("/documents/123");
      expect(notification.metadata).toEqual({
        documentId: "doc-123",
        priority: "high",
      });
    });

    it("creates notification with channels specified", async () => {
      const user = await createUser({ firmId: ctx.firmId });

      const notification = await createNotification({
        firmId: ctx.firmId,
        userId: user.id,
        type: "email_received",
        title: "New Email",
        channels: ["in_app", "email"],
      });

      expect(notification.channels).toEqual(["in_app", "email"]);
    });

    it("creates multiple notifications for the same user", async () => {
      const user = await createUser({ firmId: ctx.firmId });

      await createNotifications(ctx.firmId, user.id, 5, {
        type: "system",
      });

      const userNotifications = await db
        .select()
        .from(notifications)
        .where(and(eq(notifications.firmId, ctx.firmId), eq(notifications.userId, user.id)));

      expect(userNotifications.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe("Read", () => {
    it("retrieves notification by ID", async () => {
      const user = await createUser({ firmId: ctx.firmId });

      const created = await createNotification({
        firmId: ctx.firmId,
        userId: user.id,
        title: "Retrieve Test",
      });

      const [retrieved] = await db
        .select()
        .from(notifications)
        .where(eq(notifications.id, created.id));

      expect(retrieved).toBeDefined();
      expect(retrieved.id).toBe(created.id);
      expect(retrieved.title).toBe("Retrieve Test");
    });

    it("lists all notifications for a user", async () => {
      const user = await createUser({ firmId: ctx.firmId });

      await createNotifications(ctx.firmId, user.id, 3);

      const userNotifications = await db
        .select()
        .from(notifications)
        .where(and(eq(notifications.firmId, ctx.firmId), eq(notifications.userId, user.id)))
        .orderBy(desc(notifications.createdAt));

      expect(userNotifications.length).toBeGreaterThanOrEqual(3);
    });

    it("filters notifications by read status", async () => {
      const user = await createUser({ firmId: ctx.firmId });

      // Create unread notifications
      await createNotifications(ctx.firmId, user.id, 2, { read: false });

      // Create read notifications
      await createNotifications(ctx.firmId, user.id, 3, {
        read: true,
        readAt: new Date(),
      });

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

      const read = await db
        .select()
        .from(notifications)
        .where(
          and(
            eq(notifications.firmId, ctx.firmId),
            eq(notifications.userId, user.id),
            eq(notifications.read, true)
          )
        );

      expect(unread.length).toBeGreaterThanOrEqual(2);
      expect(read.length).toBeGreaterThanOrEqual(3);
    });

    it("filters notifications by type", async () => {
      const user = await createUser({ firmId: ctx.firmId });

      await createNotification({
        firmId: ctx.firmId,
        userId: user.id,
        type: "task_assigned",
      });
      await createNotification({
        firmId: ctx.firmId,
        userId: user.id,
        type: "task_assigned",
      });
      await createNotification({
        firmId: ctx.firmId,
        userId: user.id,
        type: "approval_required",
      });
      await createNotification({
        firmId: ctx.firmId,
        userId: user.id,
        type: "email_received",
      });

      const taskNotifications = await db
        .select()
        .from(notifications)
        .where(
          and(
            eq(notifications.firmId, ctx.firmId),
            eq(notifications.userId, user.id),
            eq(notifications.type, "task_assigned")
          )
        );

      const approvalNotifications = await db
        .select()
        .from(notifications)
        .where(
          and(
            eq(notifications.firmId, ctx.firmId),
            eq(notifications.userId, user.id),
            eq(notifications.type, "approval_required")
          )
        );

      expect(taskNotifications.length).toBe(2);
      expect(approvalNotifications.length).toBe(1);
    });

    it("orders notifications by created date descending", async () => {
      const user = await createUser({ firmId: ctx.firmId });

      const first = await createNotification({
        firmId: ctx.firmId,
        userId: user.id,
        title: "First",
        createdAt: new Date("2024-01-01"),
      });

      const second = await createNotification({
        firmId: ctx.firmId,
        userId: user.id,
        title: "Second",
        createdAt: new Date("2024-01-02"),
      });

      const third = await createNotification({
        firmId: ctx.firmId,
        userId: user.id,
        title: "Third",
        createdAt: new Date("2024-01-03"),
      });

      const ordered = await db
        .select()
        .from(notifications)
        .where(and(eq(notifications.firmId, ctx.firmId), eq(notifications.userId, user.id)))
        .orderBy(desc(notifications.createdAt));

      const titles = ordered.map((n) => n.title);
      const expectedOrder = ["Third", "Second", "First"];

      expect(titles.indexOf("Third")).toBeLessThan(titles.indexOf("Second"));
      expect(titles.indexOf("Second")).toBeLessThan(titles.indexOf("First"));
    });
  });

  describe("Update", () => {
    it("marks notification as read", async () => {
      const user = await createUser({ firmId: ctx.firmId });

      const notification = await createNotification({
        firmId: ctx.firmId,
        userId: user.id,
        read: false,
      });

      expect(notification.read).toBe(false);
      expect(notification.readAt).toBeNull();

      const readTime = new Date();
      await db
        .update(notifications)
        .set({ read: true, readAt: readTime })
        .where(eq(notifications.id, notification.id));

      const [updated] = await db
        .select()
        .from(notifications)
        .where(eq(notifications.id, notification.id));

      expect(updated.read).toBe(true);
      expect(updated.readAt).toBeDefined();
    });

    it("marks all user notifications as read", async () => {
      const user = await createUser({ firmId: ctx.firmId });

      await createNotifications(ctx.firmId, user.id, 5, { read: false });

      await db
        .update(notifications)
        .set({ read: true, readAt: new Date() })
        .where(
          and(
            eq(notifications.firmId, ctx.firmId),
            eq(notifications.userId, user.id),
            eq(notifications.read, false)
          )
        );

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

    it("updates only notifications for specific user", async () => {
      const user1 = await createUser({ firmId: ctx.firmId });
      const user2 = await createUser({ firmId: ctx.firmId });

      await createNotifications(ctx.firmId, user1.id, 3, { read: false });
      await createNotifications(ctx.firmId, user2.id, 3, { read: false });

      // Mark user1's notifications as read
      await db
        .update(notifications)
        .set({ read: true, readAt: new Date() })
        .where(
          and(
            eq(notifications.firmId, ctx.firmId),
            eq(notifications.userId, user1.id),
            eq(notifications.read, false)
          )
        );

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

      expect(user1Unread.length).toBe(0);
      expect(user2Unread.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe("Delete", () => {
    it("deletes notification by ID", async () => {
      const user = await createUser({ firmId: ctx.firmId });

      const notification = await createNotification({
        firmId: ctx.firmId,
        userId: user.id,
      });

      await db.delete(notifications).where(eq(notifications.id, notification.id));

      const result = await db
        .select()
        .from(notifications)
        .where(eq(notifications.id, notification.id));

      expect(result.length).toBe(0);
    });

    it("cascades delete when user is deleted", async () => {
      const user = await createUser({ firmId: ctx.firmId });

      await createNotifications(ctx.firmId, user.id, 3);

      const userNotifications = await db
        .select()
        .from(notifications)
        .where(and(eq(notifications.firmId, ctx.firmId), eq(notifications.userId, user.id)));

      expect(userNotifications.length).toBeGreaterThanOrEqual(3);

      // Delete user
      const { users } = await import("@/lib/db/schema");
      await db.delete(users).where(eq(users.id, user.id));

      const orphanedNotifications = await db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, user.id));

      expect(orphanedNotifications.length).toBe(0);
    });
  });
});

describe("Notifications Integration - Notification Types", () => {
  const ctx = setupIntegrationSuite();

  it("creates task_assigned notification", async () => {
    const user = await createUser({ firmId: ctx.firmId });

    const notification = await createNotification({
      firmId: ctx.firmId,
      userId: user.id,
      type: "task_assigned",
      title: "Task Assigned",
      body: "You have been assigned to task #123",
      link: "/tasks/123",
      metadata: { taskId: "task-123", assignedBy: "user-456" },
    });

    expect(notification.type).toBe("task_assigned");
    expect(notification.metadata).toMatchObject({
      taskId: "task-123",
      assignedBy: "user-456",
    });
  });

  it("creates task_due notification", async () => {
    const user = await createUser({ firmId: ctx.firmId });

    const notification = await createNotification({
      firmId: ctx.firmId,
      userId: user.id,
      type: "task_due",
      title: "Task Due Soon",
      body: "Task #123 is due tomorrow",
      link: "/tasks/123",
      metadata: { taskId: "task-123", dueDate: "2024-12-18" },
    });

    expect(notification.type).toBe("task_due");
  });

  it("creates approval_required notification", async () => {
    const user = await createUser({ firmId: ctx.firmId });

    const notification = await createNotification({
      firmId: ctx.firmId,
      userId: user.id,
      type: "approval_required",
      title: "Approval Required",
      body: "Document requires your approval",
      link: "/documents/123",
      metadata: { documentId: "doc-123", requestedBy: "user-789" },
    });

    expect(notification.type).toBe("approval_required");
  });

  it("creates email_received notification", async () => {
    const user = await createUser({ firmId: ctx.firmId });

    const notification = await createNotification({
      firmId: ctx.firmId,
      userId: user.id,
      type: "email_received",
      title: "New Email",
      body: "You have received a new email",
      link: "/emails/123",
      metadata: { emailId: "email-123", from: "client@example.com" },
    });

    expect(notification.type).toBe("email_received");
  });

  it("creates system notification", async () => {
    const user = await createUser({ firmId: ctx.firmId });

    const notification = await createNotification({
      firmId: ctx.firmId,
      userId: user.id,
      type: "system",
      title: "System Maintenance",
      body: "System will be under maintenance tonight",
    });

    expect(notification.type).toBe("system");
  });
});

describe("Notifications Integration - Preferences", () => {
  const ctx = setupIntegrationSuite();

  describe("Create & Read", () => {
    it("creates notification preferences for a user", async () => {
      const user = await createUser({ firmId: ctx.firmId });

      const prefs = await createNotificationPreferences({
        firmId: ctx.firmId,
        userId: user.id,
        preferences: {
          channelsByType: {
            task_assigned: ["in_app", "email"],
            approval_required: ["in_app"],
            email_received: ["in_app", "email", "push"],
          },
        },
      });

      expect(prefs.id).toBeDefined();
      expect(prefs.firmId).toBe(ctx.firmId);
      expect(prefs.userId).toBe(user.id);
      expect(prefs.preferences).toMatchObject({
        channelsByType: {
          task_assigned: ["in_app", "email"],
          approval_required: ["in_app"],
          email_received: ["in_app", "email", "push"],
        },
      });
    });

    it("retrieves notification preferences for a user", async () => {
      const user = await createUser({ firmId: ctx.firmId });

      const created = await createNotificationPreferences({
        firmId: ctx.firmId,
        userId: user.id,
      });

      const [retrieved] = await db
        .select()
        .from(notificationPreferences)
        .where(
          and(
            eq(notificationPreferences.firmId, ctx.firmId),
            eq(notificationPreferences.userId, user.id)
          )
        );

      expect(retrieved).toBeDefined();
      expect(retrieved.id).toBe(created.id);
    });

    it("returns empty preferences when none exist", async () => {
      const user = await createUser({ firmId: ctx.firmId });

      const result = await db
        .select()
        .from(notificationPreferences)
        .where(
          and(
            eq(notificationPreferences.firmId, ctx.firmId),
            eq(notificationPreferences.userId, user.id)
          )
        );

      expect(result.length).toBe(0);
    });
  });

  describe("Update", () => {
    it("updates existing notification preferences", async () => {
      const user = await createUser({ firmId: ctx.firmId });

      const prefs = await createNotificationPreferences({
        firmId: ctx.firmId,
        userId: user.id,
        preferences: {
          channelsByType: {
            task_assigned: ["in_app"],
          },
        },
      });

      const newPreferences = {
        channelsByType: {
          task_assigned: ["in_app", "email"],
          approval_required: ["in_app", "email", "push"],
        },
      };

      await db
        .update(notificationPreferences)
        .set({ preferences: newPreferences, updatedAt: new Date() })
        .where(eq(notificationPreferences.id, prefs.id));

      const [updated] = await db
        .select()
        .from(notificationPreferences)
        .where(eq(notificationPreferences.id, prefs.id));

      expect(updated.preferences).toEqual(newPreferences);
    });

    it("enforces unique constraint on firmId + userId", async () => {
      const user = await createUser({ firmId: ctx.firmId });

      await createNotificationPreferences({
        firmId: ctx.firmId,
        userId: user.id,
      });

      // Attempt to create duplicate preferences
      await expect(
        createNotificationPreferences({
          firmId: ctx.firmId,
          userId: user.id,
        })
      ).rejects.toThrow();
    });
  });

  describe("Delete", () => {
    it("deletes notification preferences", async () => {
      const user = await createUser({ firmId: ctx.firmId });

      const prefs = await createNotificationPreferences({
        firmId: ctx.firmId,
        userId: user.id,
      });

      await db.delete(notificationPreferences).where(eq(notificationPreferences.id, prefs.id));

      const result = await db
        .select()
        .from(notificationPreferences)
        .where(eq(notificationPreferences.id, prefs.id));

      expect(result.length).toBe(0);
    });

    it("cascades delete when user is deleted", async () => {
      const user = await createUser({ firmId: ctx.firmId });

      await createNotificationPreferences({
        firmId: ctx.firmId,
        userId: user.id,
      });

      // Delete user
      const { users } = await import("@/lib/db/schema");
      await db.delete(users).where(eq(users.id, user.id));

      const orphanedPrefs = await db
        .select()
        .from(notificationPreferences)
        .where(eq(notificationPreferences.userId, user.id));

      expect(orphanedPrefs.length).toBe(0);
    });
  });
});

describe("Notifications Integration - Multi-Tenancy", () => {
  const ctx = setupFreshFirmPerTest();

  it("isolates notifications between firms", async () => {
    const user1 = await createUser({ firmId: ctx.firmId });
    const notification1 = await createNotification({
      firmId: ctx.firmId,
      userId: user1.id,
      title: "Firm 1 Notification",
    });

    // Create second firm
    const firm2 = await createFirm({ name: "Second Test Firm" });
    const user2 = await createUser({ firmId: firm2.id });
    const notification2 = await createNotification({
      firmId: firm2.id,
      userId: user2.id,
      title: "Firm 2 Notification",
    });

    // Query notifications for first firm
    const firm1Notifications = await db
      .select()
      .from(notifications)
      .where(eq(notifications.firmId, ctx.firmId));

    // Query notifications for second firm
    const firm2Notifications = await db
      .select()
      .from(notifications)
      .where(eq(notifications.firmId, firm2.id));

    // Each firm should only see their own notifications
    expect(firm1Notifications.some((n) => n.id === notification1.id)).toBe(true);
    expect(firm1Notifications.some((n) => n.id === notification2.id)).toBe(false);

    expect(firm2Notifications.some((n) => n.id === notification2.id)).toBe(true);
    expect(firm2Notifications.some((n) => n.id === notification1.id)).toBe(false);

    // Cleanup second firm
    const { users } = await import("@/lib/db/schema");
    await db.delete(users).where(eq(users.id, user2.id));
    const { firms } = await import("@/lib/db/schema");
    await db.delete(firms).where(eq(firms.id, firm2.id));
  });

  it("prevents accessing notifications from another firm by ID", async () => {
    const user1 = await createUser({ firmId: ctx.firmId });
    const notification1 = await createNotification({
      firmId: ctx.firmId,
      userId: user1.id,
      title: "Isolated Notification",
    });

    // Create second firm
    const firm2 = await createFirm({ name: "Another Test Firm" });

    // Try to query notification1 with firm2's firmId filter (simulating API check)
    const result = await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.id, notification1.id),
          eq(notifications.firmId, firm2.id) // Wrong firm
        )
      );

    // Should not find the notification
    expect(result.length).toBe(0);

    // Cleanup second firm
    const { firms } = await import("@/lib/db/schema");
    await db.delete(firms).where(eq(firms.id, firm2.id));
  });

  it("isolates notification preferences between firms", async () => {
    const user1 = await createUser({ firmId: ctx.firmId });
    const prefs1 = await createNotificationPreferences({
      firmId: ctx.firmId,
      userId: user1.id,
      preferences: { channelsByType: { task_assigned: ["in_app"] } },
    });

    // Create second firm
    const firm2 = await createFirm({ name: "Prefs Test Firm" });
    const user2 = await createUser({ firmId: firm2.id });
    const prefs2 = await createNotificationPreferences({
      firmId: firm2.id,
      userId: user2.id,
      preferences: { channelsByType: { task_assigned: ["email"] } },
    });

    // Query preferences for each firm
    const firm1Prefs = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.firmId, ctx.firmId));

    const firm2Prefs = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.firmId, firm2.id));

    expect(firm1Prefs.every((p) => p.firmId === ctx.firmId)).toBe(true);
    expect(firm2Prefs.every((p) => p.firmId === firm2.id)).toBe(true);
    expect(firm1Prefs.some((p) => p.id === prefs2.id)).toBe(false);
    expect(firm2Prefs.some((p) => p.id === prefs1.id)).toBe(false);

    // Cleanup second firm
    const { users } = await import("@/lib/db/schema");
    await db.delete(users).where(eq(users.id, user2.id));
    const { firms } = await import("@/lib/db/schema");
    await db.delete(firms).where(eq(firms.id, firm2.id));
  });

  it("isolates user notifications within a firm", async () => {
    const user1 = await createUser({ firmId: ctx.firmId });
    const user2 = await createUser({ firmId: ctx.firmId });

    await createNotifications(ctx.firmId, user1.id, 3);
    await createNotifications(ctx.firmId, user2.id, 5);

    const user1Notifications = await db
      .select()
      .from(notifications)
      .where(and(eq(notifications.firmId, ctx.firmId), eq(notifications.userId, user1.id)));

    const user2Notifications = await db
      .select()
      .from(notifications)
      .where(and(eq(notifications.firmId, ctx.firmId), eq(notifications.userId, user2.id)));

    expect(user1Notifications.every((n) => n.userId === user1.id)).toBe(true);
    expect(user2Notifications.every((n) => n.userId === user2.id)).toBe(true);
    expect(user1Notifications.length).toBeGreaterThanOrEqual(3);
    expect(user2Notifications.length).toBeGreaterThanOrEqual(5);
  });
});

describe("Notifications Integration - Pagination", () => {
  const ctx = setupIntegrationSuite();

  it("supports pagination with limit and offset", async () => {
    const user = await createUser({ firmId: ctx.firmId });

    // Create 10 notifications
    await createNotifications(ctx.firmId, user.id, 10);

    const page1 = await db
      .select()
      .from(notifications)
      .where(and(eq(notifications.firmId, ctx.firmId), eq(notifications.userId, user.id)))
      .orderBy(desc(notifications.createdAt))
      .limit(5)
      .offset(0);

    const page2 = await db
      .select()
      .from(notifications)
      .where(and(eq(notifications.firmId, ctx.firmId), eq(notifications.userId, user.id)))
      .orderBy(desc(notifications.createdAt))
      .limit(5)
      .offset(5);

    expect(page1.length).toBe(5);
    expect(page2.length).toBe(5);
    expect(page1[0].id).not.toBe(page2[0].id);
  });

  it("handles empty pages correctly", async () => {
    const user = await createUser({ firmId: ctx.firmId });

    await createNotifications(ctx.firmId, user.id, 3);

    const emptyPage = await db
      .select()
      .from(notifications)
      .where(and(eq(notifications.firmId, ctx.firmId), eq(notifications.userId, user.id)))
      .orderBy(desc(notifications.createdAt))
      .limit(5)
      .offset(100);

    expect(emptyPage.length).toBe(0);
  });
});

describe("Notifications Integration - Data Integrity", () => {
  const ctx = setupIntegrationSuite();

  it("enforces foreign key constraint on firmId", async () => {
    const user = await createUser({ firmId: ctx.firmId });

    const fakeFirmId = "00000000-0000-0000-0000-000000000000";

    await expect(
      db.insert(notifications).values({
        firmId: fakeFirmId,
        userId: user.id,
        type: "system",
        title: "Test",
        read: false,
        createdAt: new Date(),
      })
    ).rejects.toThrow();
  });

  it("enforces foreign key constraint on userId", async () => {
    const fakeUserId = "00000000-0000-0000-0000-000000000000";

    await expect(
      db.insert(notifications).values({
        firmId: ctx.firmId,
        userId: fakeUserId,
        type: "system",
        title: "Test",
        read: false,
        createdAt: new Date(),
      })
    ).rejects.toThrow();
  });

  it("cascades delete from firm to notifications", async () => {
    const firm = await createFirm({ name: "Cascade Test Firm" });
    const user = await createUser({ firmId: firm.id });

    await createNotifications(firm.id, user.id, 3);

    const firmNotifications = await db
      .select()
      .from(notifications)
      .where(eq(notifications.firmId, firm.id));

    expect(firmNotifications.length).toBeGreaterThanOrEqual(3);

    // Delete firm
    const { users } = await import("@/lib/db/schema");
    await db.delete(users).where(eq(users.id, user.id));
    const { firms } = await import("@/lib/db/schema");
    await db.delete(firms).where(eq(firms.id, firm.id));

    const orphanedNotifications = await db
      .select()
      .from(notifications)
      .where(eq(notifications.firmId, firm.id));

    expect(orphanedNotifications.length).toBe(0);
  });
});
