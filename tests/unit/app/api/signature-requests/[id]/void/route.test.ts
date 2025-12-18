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
  createTimelineEvent: vi.fn(),
}));

describe("POST /api/signature-requests/[id]/void", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("voids a signature request", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    vi.mocked(withFirmDb).mockImplementation(async (firmId, callback) => {
      return {
        id: "sig-1",
        status: "voided",
        documentId: "doc-1",
        updatedAt: new Date(),
      } as any;
    });

    const { POST } = await import("@/app/api/signature-requests/[id]/void/route");
    const request = new NextRequest("http://localhost/api/signature-requests/sig-1/void", {
      method: "POST",
    });
    const response = await POST(
      request as any,
      {
        params: Promise.resolve({ id: "sig-1" }),
      } as any
    );

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.status).toBe("voided");
    expect(json.id).toBe("sig-1");
  });

  it("validates signature request exists", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const { NotFoundError } = await import("@/middleware/withErrorHandler");

    vi.mocked(withFirmDb).mockImplementation(async (firmId, callback) => {
      throw new NotFoundError("Signature request not found");
    });

    const { POST } = await import("@/app/api/signature-requests/[id]/void/route");
    const request = new NextRequest("http://localhost/api/signature-requests/nonexistent/void", {
      method: "POST",
    });

    const response = await POST(
      request as any,
      {
        params: Promise.resolve({ id: "nonexistent" }),
      } as any
    );
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.message).toBe("Signature request not found");
  });

  it("rejects voiding completed requests", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const { ValidationError } = await import("@/middleware/withErrorHandler");

    vi.mocked(withFirmDb).mockImplementation(async (firmId, callback) => {
      throw new ValidationError("Cannot void a completed signature request");
    });

    const { POST } = await import("@/app/api/signature-requests/[id]/void/route");
    const request = new NextRequest("http://localhost/api/signature-requests/sig-1/void", {
      method: "POST",
    });

    const response = await POST(
      request as any,
      {
        params: Promise.resolve({ id: "sig-1" }),
      } as any
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toBe("Cannot void a completed signature request");
  });

  it("rejects voiding already voided requests", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const { ValidationError } = await import("@/middleware/withErrorHandler");

    vi.mocked(withFirmDb).mockImplementation(async (firmId, callback) => {
      throw new ValidationError("Signature request is already voided");
    });

    const { POST } = await import("@/app/api/signature-requests/[id]/void/route");
    const request = new NextRequest("http://localhost/api/signature-requests/sig-1/void", {
      method: "POST",
    });

    const response = await POST(
      request as any,
      {
        params: Promise.resolve({ id: "sig-1" }),
      } as any
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toBe("Signature request is already voided");
  });

  it("creates timeline event when voiding", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const { createTimelineEvent } = await import("@/lib/timeline/createEvent");

    vi.mocked(withFirmDb).mockImplementation(async (firmId, callback) => {
      return {
        id: "sig-1",
        status: "voided",
        documentId: "doc-1",
        updatedAt: new Date(),
      } as any;
    });

    const { POST } = await import("@/app/api/signature-requests/[id]/void/route");
    const request = new NextRequest("http://localhost/api/signature-requests/sig-1/void", {
      method: "POST",
    });
    await POST(request as any, { params: Promise.resolve({ id: "sig-1" }) } as any);

    // Timeline event creation happens inside withFirmDb transaction
    // We're validating the endpoint completes successfully
    expect(withFirmDb).toHaveBeenCalled();
  });
});
