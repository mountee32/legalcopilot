import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import * as tenantModule from "@/lib/db/tenant";

vi.mock("@/lib/db", () => ({
  db: {},
}));

vi.mock("@/lib/db/schema", () => ({
  matters: {},
  riskEvaluations: {},
}));

vi.mock("drizzle-orm", () => ({
  and: vi.fn(),
  eq: vi.fn(),
  desc: vi.fn(),
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

describe("GET /api/compliance/risk-scores/[matterId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock withFirmDb to return default empty results
    vi.mocked(tenantModule.withFirmDb).mockImplementation(async (firmId, callback) => {
      return { evaluations: [], latest: null };
    });
  });

  it("should return risk evaluations for a matter", async () => {
    const { GET } = await import("@/app/api/compliance/risk-scores/[matterId]/route");

    const response = await GET(
      {} as NextRequest,
      {
        params: Promise.resolve({ matterId: "550e8400-e29b-41d4-a716-446655440000" }),
        user: { user: { id: "user-123" } },
      } as any
    );

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty("evaluations");
    expect(data).toHaveProperty("latest");
  });

  it("should handle missing matterId", async () => {
    const { GET } = await import("@/app/api/compliance/risk-scores/[matterId]/route");
    const { NotFoundError } = await import("@/middleware/withErrorHandler");

    await expect(
      GET(
        {} as NextRequest,
        {
          params: Promise.resolve({ matterId: undefined }),
          user: { user: { id: "user-123" } },
        } as any
      )
    ).rejects.toThrow(NotFoundError);
  });
});
