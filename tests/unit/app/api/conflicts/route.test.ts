import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/middleware/withAuth", () => ({
  withAuth: (handler: any) => (request: any, ctx: any) =>
    handler(request, { ...ctx, user: { user: { id: "user-1" } } }),
}));

vi.mock("@/middleware/withPermission", () => ({
  withPermission: () => (handler: any) => handler,
}));

vi.mock("@/lib/tenancy", () => ({
  getOrCreateFirmIdForUser: vi.fn(async () => "firm-1"),
}));

vi.mock("@/lib/db/tenant", () => ({
  withFirmDb: vi.fn(),
}));

vi.mock("@/lib/timeline/createEvent", () => ({
  createTimelineEvent: vi.fn(async () => ({})),
}));

describe("Conflicts API - POST /api/conflicts/search", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("runs conflict check and returns matches", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const mockMatches = [
      { type: "client", id: "c1", firstName: "John", lastName: "Smith" },
      { type: "matter", id: "m1", reference: "MAT-001", title: "Smith v Jones" },
    ];
    vi.mocked(withFirmDb).mockResolvedValueOnce({
      conflictCheck: { id: "cc1", status: "pending" },
      matches: mockMatches,
    } as any);

    const { POST } = await import("@/app/api/conflicts/search/route");
    const request = new NextRequest("http://localhost/api/conflicts/search", {
      method: "POST",
      body: JSON.stringify({
        matterId: "123e4567-e89b-12d3-a456-426614174000",
        search: "Smith",
      }),
    });

    const response = await POST(request as any, {} as any);
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json.success).toBe(true);
    expect(json.conflictCheck).toBeDefined();
    expect(json.matches).toBeDefined();
    expect(Array.isArray(json.matches)).toBe(true);
  });

  it("returns empty matches when no conflicts found", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    vi.mocked(withFirmDb).mockResolvedValueOnce({
      conflictCheck: { id: "cc2", status: "pending" },
      matches: [],
    } as any);

    const { POST } = await import("@/app/api/conflicts/search/route");
    const request = new NextRequest("http://localhost/api/conflicts/search", {
      method: "POST",
      body: JSON.stringify({
        matterId: "123e4567-e89b-12d3-a456-426614174000",
        search: "UniqueNameXYZ123",
      }),
    });

    const response = await POST(request as any, {} as any);
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json.success).toBe(true);
    expect(json.matches).toEqual([]);
  });

  it("requires matterId", async () => {
    const { POST } = await import("@/app/api/conflicts/search/route");
    const request = new NextRequest("http://localhost/api/conflicts/search", {
      method: "POST",
      body: JSON.stringify({
        search: "Smith",
      }),
    });

    const response = await POST(request as any, {} as any);
    expect([400, 500]).toContain(response.status);
  });

  it("requires search term", async () => {
    const { POST } = await import("@/app/api/conflicts/search/route");
    const request = new NextRequest("http://localhost/api/conflicts/search", {
      method: "POST",
      body: JSON.stringify({
        matterId: "123e4567-e89b-12d3-a456-426614174000",
      }),
    });

    const response = await POST(request as any, {} as any);
    expect([400, 500]).toContain(response.status);
  });

  it("returns error when matter not found", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    vi.mocked(withFirmDb).mockRejectedValueOnce(new Error("Matter not found"));

    const { POST } = await import("@/app/api/conflicts/search/route");
    const request = new NextRequest("http://localhost/api/conflicts/search", {
      method: "POST",
      body: JSON.stringify({
        matterId: "123e4567-e89b-12d3-a456-426614174000",
        search: "Smith",
      }),
    });

    const response = await POST(request as any, {} as any);
    expect(response.status).toBeGreaterThanOrEqual(400);
  });

  it("searches multiple entity types", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const mockMatches = [
      { type: "client", id: "c1", firstName: "Alice", lastName: "Smith" },
      { type: "client", id: "c2", companyName: "Smith & Co Ltd" },
      { type: "matter", id: "m1", reference: "MAT-001", title: "Estate of Smith" },
    ];
    vi.mocked(withFirmDb).mockResolvedValueOnce({
      conflictCheck: { id: "cc3", status: "pending" },
      matches: mockMatches,
    } as any);

    const { POST } = await import("@/app/api/conflicts/search/route");
    const request = new NextRequest("http://localhost/api/conflicts/search", {
      method: "POST",
      body: JSON.stringify({
        matterId: "123e4567-e89b-12d3-a456-426614174000",
        search: "Smith",
      }),
    });

    const response = await POST(request as any, {} as any);
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json.matches.length).toBe(3);
  });

  it("updates existing conflict check", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    vi.mocked(withFirmDb).mockResolvedValueOnce({
      conflictCheck: { id: "existing-cc", status: "pending", updatedAt: new Date() },
      matches: [],
    } as any);

    const { POST } = await import("@/app/api/conflicts/search/route");
    const request = new NextRequest("http://localhost/api/conflicts/search", {
      method: "POST",
      body: JSON.stringify({
        matterId: "123e4567-e89b-12d3-a456-426614174000",
        search: "NewSearch",
      }),
    });

    const response = await POST(request as any, {} as any);
    expect(response.status).toBe(200);
  });
});

describe("Conflicts API - POST /api/conflicts/:id/waive", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates approval request to waive conflict", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const mockApproval = {
      id: "approval-1",
      action: "conflict_check.waive",
      status: "pending",
      proposedPayload: {
        conflictCheckId: "cc1",
        waiverReason: "Informed consent obtained",
      },
    };
    vi.mocked(withFirmDb).mockResolvedValueOnce(mockApproval as any);

    const { POST } = await import("@/app/api/conflicts/[id]/waive/route");
    const request = new NextRequest("http://localhost/api/conflicts/cc1/waive", {
      method: "POST",
      body: JSON.stringify({
        waiverReason: "Informed consent obtained",
      }),
    });

    const response = await POST(request as any, { params: { id: "cc1" } } as any);
    expect(response.status).toBe(201);

    const json = await response.json();
    expect(json.action).toBe("conflict_check.waive");
    expect(json.status).toBe("pending");
  });

  it("requires waiverReason", async () => {
    const { POST } = await import("@/app/api/conflicts/[id]/waive/route");
    const request = new NextRequest("http://localhost/api/conflicts/cc1/waive", {
      method: "POST",
      body: JSON.stringify({}),
    });

    const response = await POST(request as any, { params: { id: "cc1" } } as any);
    expect(response.status).toBe(400);
  });

  it("includes optional decisionReason", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const mockApproval = {
      id: "approval-2",
      action: "conflict_check.waive",
      status: "pending",
      decisionReason: "Risk assessed as minimal",
    };
    vi.mocked(withFirmDb).mockResolvedValueOnce(mockApproval as any);

    const { POST } = await import("@/app/api/conflicts/[id]/waive/route");
    const request = new NextRequest("http://localhost/api/conflicts/cc1/waive", {
      method: "POST",
      body: JSON.stringify({
        waiverReason: "Client agreed to proceed",
        decisionReason: "Risk assessed as minimal",
      }),
    });

    const response = await POST(request as any, { params: { id: "cc1" } } as any);
    expect(response.status).toBe(201);
  });

  it("returns error when conflict check not found", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    vi.mocked(withFirmDb).mockRejectedValueOnce(new Error("Conflict check not found"));

    const { POST } = await import("@/app/api/conflicts/[id]/waive/route");
    const request = new NextRequest("http://localhost/api/conflicts/nonexistent/waive", {
      method: "POST",
      body: JSON.stringify({
        waiverReason: "Informed consent",
      }),
    });

    const response = await POST(request as any, { params: { id: "nonexistent" } } as any);
    expect(response.status).toBeGreaterThanOrEqual(400);
  });

  it("prevents duplicate approval requests", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    vi.mocked(withFirmDb).mockRejectedValueOnce(
      new Error("An approval request already exists for this conflict check")
    );

    const { POST } = await import("@/app/api/conflicts/[id]/waive/route");
    const request = new NextRequest("http://localhost/api/conflicts/cc1/waive", {
      method: "POST",
      body: JSON.stringify({
        waiverReason: "Another waiver",
      }),
    });

    const response = await POST(request as any, { params: { id: "cc1" } } as any);
    expect(response.status).toBeGreaterThanOrEqual(400);
  });

  it("requires conflict check ID in params", async () => {
    const { POST } = await import("@/app/api/conflicts/[id]/waive/route");
    const request = new NextRequest("http://localhost/api/conflicts//waive", {
      method: "POST",
      body: JSON.stringify({
        waiverReason: "Test",
      }),
    });

    const response = await POST(request as any, { params: {} } as any);
    expect(response.status).toBeGreaterThanOrEqual(400);
  });
});

describe("Conflicts API - POST /api/conflicts/:id/clear", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates approval request to clear conflict", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const mockApproval = {
      id: "approval-3",
      action: "conflict_check.clear",
      status: "pending",
      proposedPayload: {
        conflictCheckId: "cc1",
      },
    };
    vi.mocked(withFirmDb).mockResolvedValueOnce(mockApproval as any);

    const { POST } = await import("@/app/api/conflicts/[id]/clear/route");
    const request = new NextRequest("http://localhost/api/conflicts/cc1/clear", {
      method: "POST",
      body: JSON.stringify({}),
    });

    const response = await POST(request as any, { params: { id: "cc1" } } as any);
    expect(response.status).toBe(201);

    const json = await response.json();
    expect(json.action).toBe("conflict_check.clear");
  });

  it("includes optional decisionReason", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const mockApproval = {
      id: "approval-4",
      action: "conflict_check.clear",
      status: "pending",
      decisionReason: "No actual conflicts identified",
    };
    vi.mocked(withFirmDb).mockResolvedValueOnce(mockApproval as any);

    const { POST } = await import("@/app/api/conflicts/[id]/clear/route");
    const request = new NextRequest("http://localhost/api/conflicts/cc1/clear", {
      method: "POST",
      body: JSON.stringify({
        decisionReason: "No actual conflicts identified",
      }),
    });

    const response = await POST(request as any, { params: { id: "cc1" } } as any);
    expect(response.status).toBe(201);
  });

  it("returns error when conflict check not found", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    vi.mocked(withFirmDb).mockRejectedValueOnce(new Error("Conflict check not found"));

    const { POST } = await import("@/app/api/conflicts/[id]/clear/route");
    const request = new NextRequest("http://localhost/api/conflicts/nonexistent/clear", {
      method: "POST",
      body: JSON.stringify({}),
    });

    const response = await POST(request as any, { params: { id: "nonexistent" } } as any);
    expect(response.status).toBeGreaterThanOrEqual(400);
  });

  it("prevents duplicate approval requests", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    vi.mocked(withFirmDb).mockRejectedValueOnce(
      new Error("An approval request already exists for this conflict check")
    );

    const { POST } = await import("@/app/api/conflicts/[id]/clear/route");
    const request = new NextRequest("http://localhost/api/conflicts/cc1/clear", {
      method: "POST",
      body: JSON.stringify({}),
    });

    const response = await POST(request as any, { params: { id: "cc1" } } as any);
    expect(response.status).toBeGreaterThanOrEqual(400);
  });

  it("does not require waiverReason (unlike waive)", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const mockApproval = {
      id: "approval-5",
      action: "conflict_check.clear",
      status: "pending",
    };
    vi.mocked(withFirmDb).mockResolvedValueOnce(mockApproval as any);

    const { POST } = await import("@/app/api/conflicts/[id]/clear/route");
    const request = new NextRequest("http://localhost/api/conflicts/cc1/clear", {
      method: "POST",
      body: JSON.stringify({}),
    });

    const response = await POST(request as any, { params: { id: "cc1" } } as any);
    expect(response.status).toBe(201);
  });

  it("requires conflict check ID in params", async () => {
    const { POST } = await import("@/app/api/conflicts/[id]/clear/route");
    const request = new NextRequest("http://localhost/api/conflicts//clear", {
      method: "POST",
      body: JSON.stringify({}),
    });

    const response = await POST(request as any, { params: {} } as any);
    expect(response.status).toBeGreaterThanOrEqual(400);
  });
});
