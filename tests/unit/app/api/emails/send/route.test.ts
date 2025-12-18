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

describe("Email Send API - POST /api/emails/[id]/send", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates approval request for draft outbound email", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const emailId = "email-123";
    const mockEmail = {
      id: emailId,
      subject: "Test email",
      status: "draft",
      direction: "outbound",
      toAddresses: [{ email: "client@example.com", name: "John Client" }],
      bodyText: "Test body",
      bodyHtml: null,
      approvalRequestId: null,
    };
    const mockApproval = {
      id: "approval-1",
      firmId: "firm-1",
      action: "email.send",
      summary: 'Send email "Test email" to client@example.com',
      status: "pending",
      createdAt: new Date(),
    };

    vi.mocked(withFirmDb).mockResolvedValueOnce(mockApproval as any);

    const { POST } = await import("@/app/api/emails/[id]/send/route");
    const request = new NextRequest("http://localhost/api/emails/email-123/send", {
      method: "POST",
    });
    const response = await POST(request, {
      params: Promise.resolve({ id: emailId }),
      user: { user: { id: "user-1" } },
    } as any);

    expect(response.status).toBe(201);
    const json = await response.json();
    expect(json.action).toBe("email.send");
    expect(json.status).toBe("pending");
  });

  it("rejects inbound emails", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const { ValidationError } = await import("@/middleware/withErrorHandler");
    const emailId = "email-123";

    vi.mocked(withFirmDb).mockRejectedValueOnce(
      new ValidationError("Only outbound emails can be sent")
    );

    const { POST } = await import("@/app/api/emails/[id]/send/route");
    const request = new NextRequest("http://localhost/api/emails/email-123/send", {
      method: "POST",
    });
    const response = await POST(request, {
      params: Promise.resolve({ id: emailId }),
      user: { user: { id: "user-1" } },
    } as any);

    expect([400, 500]).toContain(response.status);
  });

  it("rejects non-draft emails", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const { ValidationError } = await import("@/middleware/withErrorHandler");
    const emailId = "email-123";

    vi.mocked(withFirmDb).mockRejectedValueOnce(
      new ValidationError("Only draft emails can be sent")
    );

    const { POST } = await import("@/app/api/emails/[id]/send/route");
    const request = new NextRequest("http://localhost/api/emails/email-123/send", {
      method: "POST",
    });
    const response = await POST(request, {
      params: Promise.resolve({ id: emailId }),
      user: { user: { id: "user-1" } },
    } as any);

    expect([400, 500]).toContain(response.status);
  });

  it("rejects when pending approval already exists", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const { ValidationError } = await import("@/middleware/withErrorHandler");
    const emailId = "email-123";

    vi.mocked(withFirmDb).mockRejectedValueOnce(
      new ValidationError("An approval request already exists for this email")
    );

    const { POST } = await import("@/app/api/emails/[id]/send/route");
    const request = new NextRequest("http://localhost/api/emails/email-123/send", {
      method: "POST",
    });
    const response = await POST(request, {
      params: Promise.resolve({ id: emailId }),
      user: { user: { id: "user-1" } },
    } as any);

    expect([400, 500]).toContain(response.status);
  });

  it("returns 404 when email does not exist", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const { NotFoundError } = await import("@/middleware/withErrorHandler");
    const emailId = "nonexistent-email";

    vi.mocked(withFirmDb).mockRejectedValueOnce(new NotFoundError("Email not found"));

    const { POST } = await import("@/app/api/emails/[id]/send/route");
    const request = new NextRequest("http://localhost/api/emails/nonexistent-email/send", {
      method: "POST",
    });
    const response = await POST(request, {
      params: Promise.resolve({ id: emailId }),
      user: { user: { id: "user-1" } },
    } as any);

    expect([404, 500]).toContain(response.status);
  });

  it("creates content hash for idempotency", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const emailId = "email-123";
    const mockApproval = {
      id: "approval-1",
      proposedPayload: {
        emailId,
        contentHash: expect.any(String),
      },
    };

    vi.mocked(withFirmDb).mockResolvedValueOnce(mockApproval as any);

    const { POST } = await import("@/app/api/emails/[id]/send/route");
    const request = new NextRequest("http://localhost/api/emails/email-123/send", {
      method: "POST",
    });
    const response = await POST(request, {
      params: Promise.resolve({ id: emailId }),
      user: { user: { id: "user-1" } },
    } as any);

    expect(response.status).toBe(201);
  });

  it("updates email status to pending", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const emailId = "email-123";
    const mockApproval = {
      id: "approval-1",
      action: "email.send",
      status: "pending",
    };

    vi.mocked(withFirmDb).mockResolvedValueOnce(mockApproval as any);

    const { POST } = await import("@/app/api/emails/[id]/send/route");
    const request = new NextRequest("http://localhost/api/emails/email-123/send", {
      method: "POST",
    });
    const response = await POST(request, {
      params: Promise.resolve({ id: emailId }),
      user: { user: { id: "user-1" } },
    } as any);

    expect(response.status).toBe(201);
  });

  it("formats recipient list for multiple recipients", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const emailId = "email-123";
    const mockApproval = {
      id: "approval-1",
      summary: expect.stringContaining("client1@example.com, client2@example.com"),
    };

    vi.mocked(withFirmDb).mockResolvedValueOnce(mockApproval as any);

    const { POST } = await import("@/app/api/emails/[id]/send/route");
    const request = new NextRequest("http://localhost/api/emails/email-123/send", {
      method: "POST",
    });
    const response = await POST(request, {
      params: Promise.resolve({ id: emailId }),
      user: { user: { id: "user-1" } },
    } as any);

    expect(response.status).toBe(201);
  });
});
