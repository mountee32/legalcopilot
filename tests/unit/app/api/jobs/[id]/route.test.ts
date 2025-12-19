/**
 * Unit tests for jobs API endpoint
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock middleware
vi.mock("@/middleware/withAuth", () => ({
  withAuth: (handler: any) => (request: any, ctx: any) =>
    handler(request, { ...ctx, user: { user: { id: "user-1" } } }),
}));

// Mock database
vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn(),
  },
}));

import { db } from "@/lib/db";

describe("Jobs API - GET /api/jobs/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns job status for pending job", async () => {
    vi.mocked(db.select().from().where().limit).mockResolvedValueOnce([
      {
        id: "job-1",
        name: "document:analyze",
        status: "pending",
        result: null,
        error: null,
        createdAt: new Date("2024-01-01"),
        completedAt: null,
      },
    ]);

    const { GET } = await import("@/app/api/jobs/[id]/route");
    const request = new NextRequest("http://localhost/api/jobs/job-1");

    const response = await GET(
      request as any,
      {
        params: Promise.resolve({ id: "job-1" }),
      } as any
    );

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.id).toBe("job-1");
    expect(json.status).toBe("pending");
    expect(json.result).toBeNull();
  });

  it("returns job with result when completed", async () => {
    const analysisResult = {
      suggestedTitle: "Test Document",
      documentType: "contract",
      confidence: 85,
    };

    vi.mocked(db.select().from().where().limit).mockResolvedValueOnce([
      {
        id: "job-2",
        name: "document:analyze",
        status: "completed",
        result: analysisResult,
        error: null,
        createdAt: new Date("2024-01-01"),
        completedAt: new Date("2024-01-01"),
      },
    ]);

    const { GET } = await import("@/app/api/jobs/[id]/route");
    const request = new NextRequest("http://localhost/api/jobs/job-2");

    const response = await GET(
      request as any,
      {
        params: Promise.resolve({ id: "job-2" }),
      } as any
    );

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.status).toBe("completed");
    expect(json.result).toEqual(analysisResult);
  });

  it("returns job with error when failed", async () => {
    vi.mocked(db.select().from().where().limit).mockResolvedValueOnce([
      {
        id: "job-3",
        name: "document:analyze",
        status: "failed",
        result: null,
        error: "Analysis failed: Invalid PDF",
        createdAt: new Date("2024-01-01"),
        completedAt: new Date("2024-01-01"),
      },
    ]);

    const { GET } = await import("@/app/api/jobs/[id]/route");
    const request = new NextRequest("http://localhost/api/jobs/job-3");

    const response = await GET(
      request as any,
      {
        params: Promise.resolve({ id: "job-3" }),
      } as any
    );

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.status).toBe("failed");
    expect(json.error).toBe("Analysis failed: Invalid PDF");
  });

  it("returns 404 for non-existent job", async () => {
    vi.mocked(db.select().from().where().limit).mockResolvedValueOnce([]);

    const { GET } = await import("@/app/api/jobs/[id]/route");
    const request = new NextRequest("http://localhost/api/jobs/nonexistent");

    const response = await GET(
      request as any,
      {
        params: Promise.resolve({ id: "nonexistent" }),
      } as any
    );

    expect(response.status).toBe(404);
  });
});
