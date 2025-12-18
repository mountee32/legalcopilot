import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import * as tenantModule from "@/lib/db/tenant";

vi.mock("@/lib/db", () => ({
  db: {},
}));

vi.mock("@/lib/db/schema", () => ({
  complianceAlerts: {},
}));

vi.mock("drizzle-orm", () => ({
  and: vi.fn(),
  eq: vi.fn(),
}));

vi.mock("@/lib/db/tenant");

vi.mock("@/lib/tenancy", () => ({
  getOrCreateFirmIdForUser: vi.fn(() => "firm-123"),
}));

vi.mock("@/middleware/withAuth", () => ({
  withAuth: vi.fn((handler) => handler),
}));

vi.mock("@/middleware/withPermission", () => ({
  withPermission: vi.fn(() => (handler: any) => handler),
}));

vi.mock("@/middleware/withErrorHandler", () => ({
  withErrorHandler: vi.fn((handler) => handler),
  NotFoundError: class NotFoundError extends Error {},
}));

describe("PATCH /api/compliance/alerts/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock withFirmDb to return an updated alert
    vi.mocked(tenantModule.withFirmDb).mockImplementation(async (firmId, callback) => {
      return {
        id: "alert-123",
        firmId: "firm-123",
        ruleId: "rule-1",
        matterId: "matter-1",
        userId: null,
        priority: "warning",
        status: "acknowledged",
        title: "Test Alert",
        message: "Test message",
        context: {},
        triggeredAt: new Date(),
        acknowledgedAt: new Date(),
        acknowledgedBy: "user-123",
        resolvedAt: null,
        resolvedBy: null,
        resolutionNotes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    });
  });

  it("should update alert status", async () => {
    const { PATCH } = await import("@/app/api/compliance/alerts/[id]/route");

    const request = new NextRequest("http://localhost:3000/api/compliance/alerts/alert-123", {
      method: "PATCH",
      body: JSON.stringify({
        status: "resolved",
        resolutionNotes: "Issue addressed",
      }),
    });

    const response = await PATCH(request, {
      params: Promise.resolve({ id: "alert-123" }),
      user: { user: { id: "user-123" } },
    } as any);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty("id");
    expect(data).toHaveProperty("status");
  });

  it("should handle missing ID", async () => {
    const { PATCH } = await import("@/app/api/compliance/alerts/[id]/route");
    const { NotFoundError } = await import("@/middleware/withErrorHandler");

    const request = new NextRequest("http://localhost:3000/api/compliance/alerts/", {
      method: "PATCH",
      body: JSON.stringify({ status: "acknowledged" }),
    });

    await expect(
      PATCH(request, {
        params: Promise.resolve({ id: undefined }),
        user: { user: { id: "user-123" } },
      } as any)
    ).rejects.toThrow(NotFoundError);
  });
});
