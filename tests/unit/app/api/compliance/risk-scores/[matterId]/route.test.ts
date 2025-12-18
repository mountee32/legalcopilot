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

describe("POST /api/compliance/risk-scores/[matterId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create a new risk evaluation for a matter", async () => {
    const mockEvaluation = {
      id: "eval-123",
      firmId: "firm-123",
      matterId: "550e8400-e29b-41d4-a716-446655440000",
      score: 65,
      severity: "medium",
      factors: [{ factor: "deadline_proximity", weight: 0.3, evidence: "Test" }],
      recommendations: ["Review deadline"],
      aiModel: "gpt-4",
      evaluatedAt: new Date(),
      evaluatedBy: "user-123",
      createdAt: new Date(),
    };

    vi.mocked(tenantModule.withFirmDb).mockImplementation(async (firmId, callback) => {
      return {
        id: mockEvaluation.id,
        firmId: mockEvaluation.firmId,
        matterId: mockEvaluation.matterId,
        score: mockEvaluation.score,
        severity: mockEvaluation.severity,
        factors: mockEvaluation.factors,
        recommendations: mockEvaluation.recommendations,
        aiModel: mockEvaluation.aiModel,
        evaluatedAt: mockEvaluation.evaluatedAt.toISOString(),
        evaluatedBy: mockEvaluation.evaluatedBy,
        createdAt: mockEvaluation.createdAt.toISOString(),
      };
    });

    const { POST } = await import("@/app/api/compliance/risk-scores/[matterId]/route");

    const request = new NextRequest("http://localhost/api/compliance/risk-scores/matter-1", {
      method: "POST",
      body: JSON.stringify({ aiModel: "gpt-4" }),
    });

    const response = await POST(request, {
      params: Promise.resolve({ matterId: "550e8400-e29b-41d4-a716-446655440000" }),
      user: { user: { id: "user-123" } },
    } as any);

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data).toHaveProperty("id");
    expect(data).toHaveProperty("score");
    expect(data).toHaveProperty("severity");
    expect(data).toHaveProperty("factors");
  });

  it("should create evaluation with empty body", async () => {
    vi.mocked(tenantModule.withFirmDb).mockImplementation(async (firmId, callback) => {
      return {
        id: "eval-123",
        firmId: "firm-123",
        matterId: "matter-1",
        score: 50,
        severity: "medium",
        factors: [],
        recommendations: [],
        aiModel: "gpt-4",
        evaluatedAt: new Date().toISOString(),
        evaluatedBy: "user-123",
        createdAt: new Date().toISOString(),
      };
    });

    const { POST } = await import("@/app/api/compliance/risk-scores/[matterId]/route");

    const request = new NextRequest("http://localhost/api/compliance/risk-scores/matter-1", {
      method: "POST",
    });

    const response = await POST(request, {
      params: Promise.resolve({ matterId: "550e8400-e29b-41d4-a716-446655440000" }),
      user: { user: { id: "user-123" } },
    } as any);

    expect(response.status).toBe(201);
  });

  it("should handle missing matterId on POST", async () => {
    const { POST } = await import("@/app/api/compliance/risk-scores/[matterId]/route");
    const { NotFoundError } = await import("@/middleware/withErrorHandler");

    const request = new NextRequest("http://localhost/api/compliance/risk-scores/", {
      method: "POST",
    });

    await expect(
      POST(request, {
        params: Promise.resolve({ matterId: undefined }),
        user: { user: { id: "user-123" } },
      } as any)
    ).rejects.toThrow(NotFoundError);
  });

  it("should handle matter not found", async () => {
    const { NotFoundError } = await import("@/middleware/withErrorHandler");

    vi.mocked(tenantModule.withFirmDb).mockImplementation(async () => {
      throw new NotFoundError("Matter not found");
    });

    const { POST } = await import("@/app/api/compliance/risk-scores/[matterId]/route");

    const request = new NextRequest("http://localhost/api/compliance/risk-scores/matter-1", {
      method: "POST",
    });

    await expect(
      POST(request, {
        params: Promise.resolve({ matterId: "nonexistent-matter" }),
        user: { user: { id: "user-123" } },
      } as any)
    ).rejects.toThrow(NotFoundError);
  });
});
