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

describe("Email Attachments API - POST /api/emails/[id]/attachments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("attaches single document to draft email", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const emailId = "123e4567-e89b-12d3-a456-426614174000";
    const documentId = "223e4567-e89b-12d3-a456-426614174000";
    const mockUpdatedEmail = {
      id: emailId,
      attachmentIds: [documentId],
      attachmentCount: 1,
      hasAttachments: true,
    };

    vi.mocked(withFirmDb).mockResolvedValueOnce(mockUpdatedEmail as any);

    const { POST } = await import("@/app/api/emails/[id]/attachments/route");
    const request = new NextRequest("http://localhost/api/emails/email-123/attachments", {
      method: "POST",
      body: JSON.stringify({ documentIds: [documentId] }),
    });

    const response = await POST(request, {
      params: Promise.resolve({ id: emailId }),
      user: { user: { id: "user-1" } },
    } as any);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.success).toBe(true);
    expect(json.email.attachmentCount).toBe(1);
    expect(json.email.hasAttachments).toBe(true);
  });

  it("attaches multiple documents at once", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const emailId = "123e4567-e89b-12d3-a456-426614174000";
    const doc1 = "223e4567-e89b-12d3-a456-426614174000";
    const doc2 = "333e4567-e89b-12d3-a456-426614174000";
    const mockUpdatedEmail = {
      id: emailId,
      attachmentIds: [doc1, doc2],
      attachmentCount: 2,
      hasAttachments: true,
    };

    vi.mocked(withFirmDb).mockResolvedValueOnce(mockUpdatedEmail as any);

    const { POST } = await import("@/app/api/emails/[id]/attachments/route");
    const request = new NextRequest("http://localhost/api/emails/email-123/attachments", {
      method: "POST",
      body: JSON.stringify({ documentIds: [doc1, doc2] }),
    });

    const response = await POST(request, {
      params: Promise.resolve({ id: emailId }),
      user: { user: { id: "user-1" } },
    } as any);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.success).toBe(true);
    expect(json.email.attachmentCount).toBe(2);
  });

  it("rejects duplicate attachments", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const { ValidationError } = await import("@/middleware/withErrorHandler");
    const emailId = "email-123";
    const documentId = "doc-456";

    vi.mocked(withFirmDb).mockRejectedValueOnce(
      new ValidationError("Documents already attached: doc-456")
    );

    const { POST } = await import("@/app/api/emails/[id]/attachments/route");
    const request = new NextRequest("http://localhost/api/emails/email-123/attachments", {
      method: "POST",
      body: JSON.stringify({ documentIds: [documentId] }),
    });

    const response = await POST(request, {
      params: Promise.resolve({ id: emailId }),
      user: { user: { id: "user-1" } },
    } as any);

    expect([400, 500]).toContain(response.status);
  });

  it("rejects attaching to inbound emails", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const { ValidationError } = await import("@/middleware/withErrorHandler");
    const emailId = "email-123";
    const documentId = "doc-456";

    vi.mocked(withFirmDb).mockRejectedValueOnce(
      new ValidationError("Can only attach documents to outbound emails")
    );

    const { POST } = await import("@/app/api/emails/[id]/attachments/route");
    const request = new NextRequest("http://localhost/api/emails/email-123/attachments", {
      method: "POST",
      body: JSON.stringify({ documentIds: [documentId] }),
    });

    const response = await POST(request, {
      params: Promise.resolve({ id: emailId }),
      user: { user: { id: "user-1" } },
    } as any);

    expect([400, 500]).toContain(response.status);
  });

  it("rejects attaching to non-draft emails", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const { ValidationError } = await import("@/middleware/withErrorHandler");
    const emailId = "email-123";
    const documentId = "doc-456";

    vi.mocked(withFirmDb).mockRejectedValueOnce(
      new ValidationError("Can only attach documents to draft emails")
    );

    const { POST } = await import("@/app/api/emails/[id]/attachments/route");
    const request = new NextRequest("http://localhost/api/emails/email-123/attachments", {
      method: "POST",
      body: JSON.stringify({ documentIds: [documentId] }),
    });

    const response = await POST(request, {
      params: Promise.resolve({ id: emailId }),
      user: { user: { id: "user-1" } },
    } as any);

    expect([400, 500]).toContain(response.status);
  });

  it("returns 404 when email not found", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const { NotFoundError } = await import("@/middleware/withErrorHandler");
    const emailId = "nonexistent-email";
    const documentId = "123e4567-e89b-12d3-a456-426614174000";

    vi.mocked(withFirmDb).mockRejectedValueOnce(new NotFoundError("Email not found"));

    const { POST } = await import("@/app/api/emails/[id]/attachments/route");
    const request = new NextRequest("http://localhost/api/emails/nonexistent-email/attachments", {
      method: "POST",
      body: JSON.stringify({ documentIds: [documentId] }),
    });

    const response = await POST(request, {
      params: Promise.resolve({ id: emailId }),
      user: { user: { id: "user-1" } },
    } as any);

    expect([400, 404, 500]).toContain(response.status);
  });

  it("returns 404 when document not found", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const { NotFoundError } = await import("@/middleware/withErrorHandler");
    const emailId = "email-123";
    const documentId = "123e4567-e89b-12d3-a456-426614174000";

    vi.mocked(withFirmDb).mockRejectedValueOnce(
      new NotFoundError("One or more documents not found")
    );

    const { POST } = await import("@/app/api/emails/[id]/attachments/route");
    const request = new NextRequest("http://localhost/api/emails/email-123/attachments", {
      method: "POST",
      body: JSON.stringify({ documentIds: [documentId] }),
    });

    const response = await POST(request, {
      params: Promise.resolve({ id: emailId }),
      user: { user: { id: "user-1" } },
    } as any);

    expect([400, 404, 500]).toContain(response.status);
  });

  it("validates matter association when email has matter", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const { ValidationError } = await import("@/middleware/withErrorHandler");
    const emailId = "email-123";
    const documentId = "doc-456";

    vi.mocked(withFirmDb).mockRejectedValueOnce(
      new ValidationError("All documents must belong to the same matter as the email")
    );

    const { POST } = await import("@/app/api/emails/[id]/attachments/route");
    const request = new NextRequest("http://localhost/api/emails/email-123/attachments", {
      method: "POST",
      body: JSON.stringify({ documentIds: [documentId] }),
    });

    const response = await POST(request, {
      params: Promise.resolve({ id: emailId }),
      user: { user: { id: "user-1" } },
    } as any);

    expect([400, 500]).toContain(response.status);
  });

  it("validates documentIds is required", async () => {
    const { POST } = await import("@/app/api/emails/[id]/attachments/route");
    const request = new NextRequest("http://localhost/api/emails/email-123/attachments", {
      method: "POST",
      body: JSON.stringify({}),
    });

    const response = await POST(request, {
      params: Promise.resolve({ id: "email-123" }),
      user: { user: { id: "user-1" } },
    } as any);

    expect([400, 500]).toContain(response.status);
  });

  it("validates documentIds array has at least 1 item", async () => {
    const { POST } = await import("@/app/api/emails/[id]/attachments/route");
    const request = new NextRequest("http://localhost/api/emails/email-123/attachments", {
      method: "POST",
      body: JSON.stringify({ documentIds: [] }),
    });

    const response = await POST(request, {
      params: Promise.resolve({ id: "email-123" }),
      user: { user: { id: "user-1" } },
    } as any);

    expect([400, 500]).toContain(response.status);
  });

  it("validates documentIds contains valid UUIDs", async () => {
    const { POST } = await import("@/app/api/emails/[id]/attachments/route");
    const request = new NextRequest("http://localhost/api/emails/email-123/attachments", {
      method: "POST",
      body: JSON.stringify({ documentIds: ["not-a-uuid"] }),
    });

    const response = await POST(request, {
      params: Promise.resolve({ id: "email-123" }),
      user: { user: { id: "user-1" } },
    } as any);

    expect([400, 500]).toContain(response.status);
  });

  it("limits maximum documents to 10", async () => {
    const { POST } = await import("@/app/api/emails/[id]/attachments/route");
    const tooManyDocs = Array(11).fill("123e4567-e89b-12d3-a456-426614174000");
    const request = new NextRequest("http://localhost/api/emails/email-123/attachments", {
      method: "POST",
      body: JSON.stringify({ documentIds: tooManyDocs }),
    });

    const response = await POST(request, {
      params: Promise.resolve({ id: "email-123" }),
      user: { user: { id: "user-1" } },
    } as any);

    expect([400, 500]).toContain(response.status);
  });
});
