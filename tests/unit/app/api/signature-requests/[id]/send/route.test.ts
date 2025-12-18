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

describe("POST /api/signature-requests/[id]/send", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates approval request for draft signature request", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    vi.mocked(withFirmDb).mockImplementation(async (firmId, callback) => {
      // Mock the transaction and return the approval request
      return {
        id: "approval-1",
        action: "signature_request.send",
        status: "pending",
        entityType: "signature_request",
        entityId: "sig-1",
      } as any;
    });

    const { POST } = await import("@/app/api/signature-requests/[id]/send/route");
    const request = new NextRequest("http://localhost/api/signature-requests/sig-1/send", {
      method: "POST",
    });
    const response = await POST(
      request as any,
      {
        params: Promise.resolve({ id: "sig-1" }),
      } as any
    );

    expect(response.status).toBe(201);
    const json = await response.json();
    expect(json.action).toBe("signature_request.send");
    expect(json.status).toBe("pending");
  });

  it("validates signature request exists", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const { NotFoundError } = await import("@/middleware/withErrorHandler");

    vi.mocked(withFirmDb).mockImplementation(async (firmId, callback) => {
      throw new NotFoundError("Signature request not found");
    });

    const { POST } = await import("@/app/api/signature-requests/[id]/send/route");
    const request = new NextRequest("http://localhost/api/signature-requests/nonexistent/send", {
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

  it("rejects non-draft/pending_approval requests", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const { ValidationError } = await import("@/middleware/withErrorHandler");

    vi.mocked(withFirmDb).mockImplementation(async (firmId, callback) => {
      throw new ValidationError("Only draft or pending approval signature requests can be sent");
    });

    const { POST } = await import("@/app/api/signature-requests/[id]/send/route");
    const request = new NextRequest("http://localhost/api/signature-requests/sig-1/send", {
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
    expect(data.message).toBe("Only draft or pending approval signature requests can be sent");
  });

  it("prevents duplicate approval requests", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const { ValidationError } = await import("@/middleware/withErrorHandler");

    vi.mocked(withFirmDb).mockImplementation(async (firmId, callback) => {
      throw new ValidationError("An approval request already exists for this signature request");
    });

    const { POST } = await import("@/app/api/signature-requests/[id]/send/route");
    const request = new NextRequest("http://localhost/api/signature-requests/sig-1/send", {
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
    expect(data.message).toBe("An approval request already exists for this signature request");
  });
});
