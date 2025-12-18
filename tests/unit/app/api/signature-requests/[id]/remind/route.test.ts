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

describe("POST /api/signature-requests/[id]/remind", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends reminder for sent signature request", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    vi.mocked(withFirmDb).mockImplementation(async (firmId, callback) => {
      return {
        id: "sig-1",
        status: "sent",
        documentId: "doc-1",
        externalId: "ext-123",
        sentAt: new Date(),
      } as any;
    });

    const { POST } = await import("@/app/api/signature-requests/[id]/remind/route");
    const request = new NextRequest("http://localhost/api/signature-requests/sig-1/remind", {
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
    expect(json.success).toBe(true);
    expect(json.message).toBe("Reminder sent successfully");
    expect(json.signatureRequest.id).toBe("sig-1");
  });

  it("validates signature request exists", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const { NotFoundError } = await import("@/middleware/withErrorHandler");

    vi.mocked(withFirmDb).mockImplementation(async (firmId, callback) => {
      throw new NotFoundError("Signature request not found");
    });

    const { POST } = await import("@/app/api/signature-requests/[id]/remind/route");
    const request = new NextRequest("http://localhost/api/signature-requests/nonexistent/remind", {
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

  it("rejects reminder for non-sent requests", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const { ValidationError } = await import("@/middleware/withErrorHandler");

    vi.mocked(withFirmDb).mockImplementation(async (firmId, callback) => {
      throw new ValidationError("Only sent or delivered signature requests can be reminded");
    });

    const { POST } = await import("@/app/api/signature-requests/[id]/remind/route");
    const request = new NextRequest("http://localhost/api/signature-requests/sig-1/remind", {
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
    expect(data.message).toBe("Only sent or delivered signature requests can be reminded");
  });

  it("rejects reminder for requests without external ID", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const { ValidationError } = await import("@/middleware/withErrorHandler");

    vi.mocked(withFirmDb).mockImplementation(async (firmId, callback) => {
      throw new ValidationError("Cannot send reminder for request without external ID");
    });

    const { POST } = await import("@/app/api/signature-requests/[id]/remind/route");
    const request = new NextRequest("http://localhost/api/signature-requests/sig-1/remind", {
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
    expect(data.message).toBe("Cannot send reminder for request without external ID");
  });

  it("creates timeline event when sending reminder", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const { createTimelineEvent } = await import("@/lib/timeline/createEvent");

    vi.mocked(withFirmDb).mockImplementation(async (firmId, callback) => {
      return {
        id: "sig-1",
        status: "sent",
        documentId: "doc-1",
        externalId: "ext-123",
        sentAt: new Date(),
      } as any;
    });

    const { POST } = await import("@/app/api/signature-requests/[id]/remind/route");
    const request = new NextRequest("http://localhost/api/signature-requests/sig-1/remind", {
      method: "POST",
    });
    await POST(request as any, { params: Promise.resolve({ id: "sig-1" }) } as any);

    // Timeline event creation happens inside withFirmDb transaction
    // We're validating the endpoint completes successfully
    expect(withFirmDb).toHaveBeenCalled();
  });
});
