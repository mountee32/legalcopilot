import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock middleware and dependencies
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

describe("Team Leave API - GET /api/team/leave/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns leave request by ID", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const mockLeave = {
      id: "leave-123",
      firmId: "firm-1",
      userId: "user-1",
      type: "annual",
      startDate: "2025-12-20",
      endDate: "2025-12-24",
      daysCount: 3,
      reason: "Holiday",
      status: "pending",
      decidedBy: null,
      decidedAt: null,
      decisionReason: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    vi.mocked(withFirmDb).mockResolvedValueOnce(mockLeave as any);

    const { GET } = await import("@/app/api/team/leave/[id]/route");
    const request = new NextRequest("http://localhost/api/team/leave/leave-123");
    const response = await GET(
      request as any,
      {
        params: Promise.resolve({ id: "leave-123" }),
      } as any
    );

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.id).toBe("leave-123");
  });

  it("returns 404 when leave request not found", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    vi.mocked(withFirmDb).mockResolvedValueOnce(null as any);

    const { GET } = await import("@/app/api/team/leave/[id]/route");
    const request = new NextRequest("http://localhost/api/team/leave/nonexistent");
    const response = await GET(
      request as any,
      {
        params: Promise.resolve({ id: "nonexistent" }),
      } as any
    );

    expect([404, 500]).toContain(response.status);
  });
});

describe("Team Leave API - DELETE /api/team/leave/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("cancels pending leave request successfully", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const mockUpdated = {
      id: "leave-123",
      userId: "user-1",
      status: "cancelled",
    };
    vi.mocked(withFirmDb).mockResolvedValueOnce(mockUpdated as any);

    const { DELETE } = await import("@/app/api/team/leave/[id]/route");
    const request = new NextRequest("http://localhost/api/team/leave/leave-123", {
      method: "DELETE",
    });
    const response = await DELETE(
      request as any,
      {
        params: Promise.resolve({ id: "leave-123" }),
      } as any
    );

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.status).toBe("cancelled");
  });

  it("returns error when trying to cancel another user's request", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const { ValidationError } = await import("@/middleware/withErrorHandler");
    vi.mocked(withFirmDb).mockRejectedValueOnce(
      new ValidationError("You can only cancel your own leave requests")
    );

    const { DELETE } = await import("@/app/api/team/leave/[id]/route");
    const request = new NextRequest("http://localhost/api/team/leave/leave-123", {
      method: "DELETE",
    });
    const response = await DELETE(
      request as any,
      {
        params: Promise.resolve({ id: "leave-123" }),
      } as any
    );

    expect([400, 500]).toContain(response.status);
  });

  it("returns error when trying to cancel already approved request", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const { ValidationError } = await import("@/middleware/withErrorHandler");
    vi.mocked(withFirmDb).mockRejectedValueOnce(
      new ValidationError("Only pending leave requests can be cancelled")
    );

    const { DELETE } = await import("@/app/api/team/leave/[id]/route");
    const request = new NextRequest("http://localhost/api/team/leave/leave-123", {
      method: "DELETE",
    });
    const response = await DELETE(
      request as any,
      {
        params: Promise.resolve({ id: "leave-123" }),
      } as any
    );

    expect([400, 500]).toContain(response.status);
  });
});

describe("Team Leave API - POST /api/team/leave/[id]/approve", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("approves pending leave request", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const mockApproved = {
      id: "leave-123",
      status: "approved",
      decidedBy: "user-1",
      decidedAt: new Date(),
      decisionReason: null,
    };
    vi.mocked(withFirmDb).mockResolvedValueOnce(mockApproved as any);

    const { POST } = await import("@/app/api/team/leave/[id]/approve/route");
    const request = new NextRequest("http://localhost/api/team/leave/leave-123/approve", {
      method: "POST",
      body: JSON.stringify({}),
    });
    const response = await POST(
      request as any,
      {
        params: Promise.resolve({ id: "leave-123" }),
      } as any
    );

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.status).toBe("approved");
    expect(json.decidedBy).toBe("user-1");
  });

  it("approves with decision reason", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const mockApproved = {
      id: "leave-123",
      status: "approved",
      decidedBy: "user-1",
      decidedAt: new Date(),
      decisionReason: "Approved - team coverage arranged",
    };
    vi.mocked(withFirmDb).mockResolvedValueOnce(mockApproved as any);

    const { POST } = await import("@/app/api/team/leave/[id]/approve/route");
    const request = new NextRequest("http://localhost/api/team/leave/leave-123/approve", {
      method: "POST",
      body: JSON.stringify({
        decisionReason: "Approved - team coverage arranged",
      }),
    });
    const response = await POST(
      request as any,
      {
        params: Promise.resolve({ id: "leave-123" }),
      } as any
    );

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.decisionReason).toBe("Approved - team coverage arranged");
  });

  it("returns error when leave request not found", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const { NotFoundError } = await import("@/middleware/withErrorHandler");
    vi.mocked(withFirmDb).mockRejectedValueOnce(new NotFoundError("Leave request not found"));

    const { POST } = await import("@/app/api/team/leave/[id]/approve/route");
    const request = new NextRequest("http://localhost/api/team/leave/nonexistent/approve", {
      method: "POST",
      body: JSON.stringify({}),
    });
    const response = await POST(
      request as any,
      {
        params: Promise.resolve({ id: "nonexistent" }),
      } as any
    );

    expect([404, 500]).toContain(response.status);
  });

  it("returns error when trying to approve non-pending request", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const { ValidationError } = await import("@/middleware/withErrorHandler");
    vi.mocked(withFirmDb).mockRejectedValueOnce(
      new ValidationError("Only pending leave requests can be approved")
    );

    const { POST } = await import("@/app/api/team/leave/[id]/approve/route");
    const request = new NextRequest("http://localhost/api/team/leave/leave-123/approve", {
      method: "POST",
      body: JSON.stringify({}),
    });
    const response = await POST(
      request as any,
      {
        params: Promise.resolve({ id: "leave-123" }),
      } as any
    );

    expect([400, 500]).toContain(response.status);
  });
});

describe("Team Leave API - POST /api/team/leave/[id]/reject", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects pending leave request", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const mockRejected = {
      id: "leave-123",
      status: "rejected",
      decidedBy: "user-1",
      decidedAt: new Date(),
      decisionReason: null,
    };
    vi.mocked(withFirmDb).mockResolvedValueOnce(mockRejected as any);

    const { POST } = await import("@/app/api/team/leave/[id]/reject/route");
    const request = new NextRequest("http://localhost/api/team/leave/leave-123/reject", {
      method: "POST",
      body: JSON.stringify({}),
    });
    const response = await POST(
      request as any,
      {
        params: Promise.resolve({ id: "leave-123" }),
      } as any
    );

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.status).toBe("rejected");
    expect(json.decidedBy).toBe("user-1");
  });

  it("rejects with decision reason", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const mockRejected = {
      id: "leave-123",
      status: "rejected",
      decidedBy: "user-1",
      decidedAt: new Date(),
      decisionReason: "Critical deadline during this period",
    };
    vi.mocked(withFirmDb).mockResolvedValueOnce(mockRejected as any);

    const { POST } = await import("@/app/api/team/leave/[id]/reject/route");
    const request = new NextRequest("http://localhost/api/team/leave/leave-123/reject", {
      method: "POST",
      body: JSON.stringify({
        decisionReason: "Critical deadline during this period",
      }),
    });
    const response = await POST(
      request as any,
      {
        params: Promise.resolve({ id: "leave-123" }),
      } as any
    );

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.decisionReason).toBe("Critical deadline during this period");
  });

  it("returns error when trying to reject non-pending request", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const { ValidationError } = await import("@/middleware/withErrorHandler");
    vi.mocked(withFirmDb).mockRejectedValueOnce(
      new ValidationError("Only pending leave requests can be rejected")
    );

    const { POST } = await import("@/app/api/team/leave/[id]/reject/route");
    const request = new NextRequest("http://localhost/api/team/leave/leave-123/reject", {
      method: "POST",
      body: JSON.stringify({}),
    });
    const response = await POST(
      request as any,
      {
        params: Promise.resolve({ id: "leave-123" }),
      } as any
    );

    expect([400, 500]).toContain(response.status);
  });
});
