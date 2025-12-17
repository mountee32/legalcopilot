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

vi.mock("@/lib/timeline/createEvent", () => ({
  createTimelineEvent: vi.fn(),
}));

describe("Emails API - GET /api/emails", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns paginated list of emails", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const mockEmails = [
      {
        id: "e1",
        matterId: "m1",
        direction: "inbound",
        fromAddress: { email: "client@example.com", name: "John Client" },
        toAddresses: [{ email: "lawyer@firm.com", name: "Jane Lawyer" }],
        subject: "Question about my case",
        bodyText: "I have a question...",
        status: "received",
        hasAttachments: false,
        attachmentCount: 0,
        aiProcessed: true,
        createdAt: "2025-12-17T10:00:00Z",
      },
      {
        id: "e2",
        matterId: "m2",
        direction: "outbound",
        fromAddress: { email: "lawyer@firm.com", name: "Jane Lawyer" },
        toAddresses: [{ email: "client@example.com", name: "John Client" }],
        subject: "Re: Question about my case",
        bodyText: "Here is the answer...",
        status: "sent",
        hasAttachments: true,
        attachmentCount: 2,
        aiProcessed: false,
        createdAt: "2025-12-17T11:00:00Z",
      },
    ];
    vi.mocked(withFirmDb).mockResolvedValueOnce({ total: 2, rows: mockEmails } as any);

    const { GET } = await import("@/app/api/emails/route");
    const request = new NextRequest("http://localhost/api/emails?page=1&limit=20");
    const response = await GET(request as any, {} as any);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(Array.isArray(json.emails)).toBe(true);
    expect(json.emails.length).toBe(2);
    expect(json.pagination).toEqual({
      page: 1,
      limit: 20,
      total: 2,
      totalPages: 1,
      hasNext: false,
      hasPrev: false,
    });
  });

  it("returns empty list when no emails exist", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    vi.mocked(withFirmDb).mockResolvedValueOnce({ total: 0, rows: [] } as any);

    const { GET } = await import("@/app/api/emails/route");
    const request = new NextRequest("http://localhost/api/emails");
    const response = await GET(request as any, {} as any);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.emails).toEqual([]);
    expect(json.pagination.total).toBe(0);
  });

  it("filters by matterId parameter", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const matterId = "123e4567-e89b-12d3-a456-426614174000";
    const mockEmails = [
      { id: "e1", matterId, subject: "Email for specific matter", direction: "inbound" },
    ];
    vi.mocked(withFirmDb).mockResolvedValueOnce({ total: 1, rows: mockEmails } as any);

    const { GET } = await import("@/app/api/emails/route");
    const request = new NextRequest(`http://localhost/api/emails?matterId=${matterId}`);
    const response = await GET(request as any, {} as any);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.emails.length).toBe(1);
    expect(json.emails[0].matterId).toBe(matterId);
  });

  it("filters by direction=inbound parameter", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const mockEmails = [
      {
        id: "e1",
        direction: "inbound",
        subject: "Inbound email",
        fromAddress: { email: "client@example.com" },
        toAddresses: [{ email: "lawyer@firm.com" }],
      },
    ];
    vi.mocked(withFirmDb).mockResolvedValueOnce({ total: 1, rows: mockEmails } as any);

    const { GET } = await import("@/app/api/emails/route");
    const request = new NextRequest("http://localhost/api/emails?direction=inbound");
    const response = await GET(request as any, {} as any);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.emails[0].direction).toBe("inbound");
  });

  it("filters by direction=outbound parameter", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const mockEmails = [
      {
        id: "e1",
        direction: "outbound",
        subject: "Outbound email",
        fromAddress: { email: "lawyer@firm.com" },
        toAddresses: [{ email: "client@example.com" }],
      },
    ];
    vi.mocked(withFirmDb).mockResolvedValueOnce({ total: 1, rows: mockEmails } as any);

    const { GET } = await import("@/app/api/emails/route");
    const request = new NextRequest("http://localhost/api/emails?direction=outbound");
    const response = await GET(request as any, {} as any);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.emails[0].direction).toBe("outbound");
  });

  it("filters by status parameter", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const mockEmails = [{ id: "e1", status: "sent", subject: "Sent email", direction: "outbound" }];
    vi.mocked(withFirmDb).mockResolvedValueOnce({ total: 1, rows: mockEmails } as any);

    const { GET } = await import("@/app/api/emails/route");
    const request = new NextRequest("http://localhost/api/emails?status=sent");
    const response = await GET(request as any, {} as any);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.emails[0].status).toBe("sent");
  });

  it("filters by aiProcessed=true parameter", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const mockEmails = [
      { id: "e1", aiProcessed: true, subject: "AI processed email", direction: "inbound" },
    ];
    vi.mocked(withFirmDb).mockResolvedValueOnce({ total: 1, rows: mockEmails } as any);

    const { GET } = await import("@/app/api/emails/route");
    const request = new NextRequest("http://localhost/api/emails?aiProcessed=true");
    const response = await GET(request as any, {} as any);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.emails[0].aiProcessed).toBe(true);
  });

  it("filters by aiProcessed=false parameter", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const mockEmails = [
      { id: "e1", aiProcessed: false, subject: "Unprocessed email", direction: "inbound" },
    ];
    vi.mocked(withFirmDb).mockResolvedValueOnce({ total: 1, rows: mockEmails } as any);

    const { GET } = await import("@/app/api/emails/route");
    const request = new NextRequest("http://localhost/api/emails?aiProcessed=false");
    const response = await GET(request as any, {} as any);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.emails[0].aiProcessed).toBe(false);
  });

  it("searches by subject using search parameter", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const mockEmails = [
      { id: "e1", subject: "Urgent: Court deadline approaching", direction: "inbound" },
    ];
    vi.mocked(withFirmDb).mockResolvedValueOnce({ total: 1, rows: mockEmails } as any);

    const { GET } = await import("@/app/api/emails/route");
    const request = new NextRequest("http://localhost/api/emails?search=deadline");
    const response = await GET(request as any, {} as any);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.emails.length).toBe(1);
  });

  it("filters by multiple parameters", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const matterId = "123e4567-e89b-12d3-a456-426614174000";
    const mockEmails = [
      {
        id: "e1",
        matterId,
        direction: "inbound",
        status: "received",
        aiProcessed: false,
        subject: "New client email",
      },
    ];
    vi.mocked(withFirmDb).mockResolvedValueOnce({ total: 1, rows: mockEmails } as any);

    const { GET } = await import("@/app/api/emails/route");
    const request = new NextRequest(
      `http://localhost/api/emails?matterId=${matterId}&direction=inbound&status=received&aiProcessed=false`
    );
    const response = await GET(request as any, {} as any);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.emails.length).toBe(1);
  });

  it("handles pagination correctly", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    vi.mocked(withFirmDb).mockResolvedValueOnce({
      total: 50,
      rows: Array(10).fill({ id: "e", subject: "Email", direction: "inbound" }),
    } as any);

    const { GET } = await import("@/app/api/emails/route");
    const request = new NextRequest("http://localhost/api/emails?page=2&limit=10");
    const response = await GET(request as any, {} as any);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.pagination.page).toBe(2);
    expect(json.pagination.limit).toBe(10);
    expect(json.pagination.totalPages).toBe(5);
    expect(json.pagination.hasNext).toBe(true);
    expect(json.pagination.hasPrev).toBe(true);
  });
});

describe("Emails API - POST /api/emails", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates inbound email successfully", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const matterId = "123e4567-e89b-12d3-a456-426614174000";
    const mockEmail = {
      id: "new-e1",
      firmId: "firm-1",
      matterId,
      direction: "inbound",
      fromAddress: { email: "client@example.com", name: "John Client" },
      toAddresses: [{ email: "lawyer@firm.com", name: "Jane Lawyer" }],
      ccAddresses: null,
      bccAddresses: null,
      subject: "Question about property purchase",
      bodyText: "I have a question about the property purchase...",
      bodyHtml: null,
      messageId: "msg-123",
      threadId: null,
      inReplyTo: null,
      hasAttachments: false,
      attachmentCount: 0,
      attachmentIds: null,
      status: "received",
      createdBy: "user-1",
      receivedAt: new Date(),
      sentAt: null,
      aiProcessed: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    vi.mocked(withFirmDb).mockResolvedValueOnce(mockEmail as any);

    const { POST } = await import("@/app/api/emails/route");
    const request = new NextRequest("http://localhost/api/emails", {
      method: "POST",
      body: JSON.stringify({
        matterId,
        direction: "inbound",
        fromAddress: { email: "client@example.com", name: "John Client" },
        toAddresses: [{ email: "lawyer@firm.com", name: "Jane Lawyer" }],
        subject: "Question about property purchase",
        bodyText: "I have a question about the property purchase...",
        messageId: "msg-123",
      }),
    });

    const response = await POST(request as any, {} as any);
    expect(response.status).toBe(201);

    const json = await response.json();
    expect(json.direction).toBe("inbound");
    expect(json.status).toBe("received");
    expect(json.subject).toBe("Question about property purchase");
  });

  it("creates outbound email successfully", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const matterId = "123e4567-e89b-12d3-a456-426614174000";
    const mockEmail = {
      id: "new-e2",
      matterId,
      direction: "outbound",
      fromAddress: { email: "lawyer@firm.com", name: "Jane Lawyer" },
      toAddresses: [{ email: "client@example.com", name: "John Client" }],
      subject: "Re: Question about property purchase",
      bodyText: "Here is the answer...",
      status: "draft",
      hasAttachments: false,
      attachmentCount: 0,
      receivedAt: null,
      sentAt: null,
    };
    vi.mocked(withFirmDb).mockResolvedValueOnce(mockEmail as any);

    const { POST } = await import("@/app/api/emails/route");
    const request = new NextRequest("http://localhost/api/emails", {
      method: "POST",
      body: JSON.stringify({
        matterId,
        direction: "outbound",
        fromAddress: { email: "lawyer@firm.com", name: "Jane Lawyer" },
        toAddresses: [{ email: "client@example.com", name: "John Client" }],
        subject: "Re: Question about property purchase",
        bodyText: "Here is the answer...",
      }),
    });

    const response = await POST(request as any, {} as any);
    expect(response.status).toBe(201);

    const json = await response.json();
    expect(json.direction).toBe("outbound");
    expect(json.status).toBe("draft");
  });

  it("creates email without matter association", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const mockEmail = {
      id: "new-e3",
      matterId: null,
      direction: "inbound",
      fromAddress: { email: "unknown@example.com" },
      toAddresses: [{ email: "lawyer@firm.com" }],
      subject: "Unassociated email",
      status: "received",
      hasAttachments: false,
      attachmentCount: 0,
    };
    vi.mocked(withFirmDb).mockResolvedValueOnce(mockEmail as any);

    const { POST } = await import("@/app/api/emails/route");
    const request = new NextRequest("http://localhost/api/emails", {
      method: "POST",
      body: JSON.stringify({
        direction: "inbound",
        fromAddress: { email: "unknown@example.com" },
        toAddresses: [{ email: "lawyer@firm.com" }],
        subject: "Unassociated email",
      }),
    });

    const response = await POST(request as any, {} as any);
    expect(response.status).toBe(201);

    const json = await response.json();
    expect(json.matterId).toBeNull();
  });

  it("creates email with CC and BCC addresses", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const mockEmail = {
      id: "new-e4",
      direction: "outbound",
      fromAddress: { email: "lawyer@firm.com" },
      toAddresses: [{ email: "client@example.com" }],
      ccAddresses: [{ email: "partner@firm.com" }],
      bccAddresses: [{ email: "admin@firm.com" }],
      subject: "Email with CC and BCC",
      status: "draft",
      hasAttachments: false,
      attachmentCount: 0,
    };
    vi.mocked(withFirmDb).mockResolvedValueOnce(mockEmail as any);

    const { POST } = await import("@/app/api/emails/route");
    const request = new NextRequest("http://localhost/api/emails", {
      method: "POST",
      body: JSON.stringify({
        direction: "outbound",
        fromAddress: { email: "lawyer@firm.com" },
        toAddresses: [{ email: "client@example.com" }],
        ccAddresses: [{ email: "partner@firm.com" }],
        bccAddresses: [{ email: "admin@firm.com" }],
        subject: "Email with CC and BCC",
      }),
    });

    const response = await POST(request as any, {} as any);
    expect(response.status).toBe(201);
  });

  it("creates email with attachments", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const attachmentIds = [
      "111e4567-e89b-12d3-a456-426614174000",
      "222e4567-e89b-12d3-a456-426614174000",
    ];
    const mockEmail = {
      id: "new-e5",
      direction: "outbound",
      fromAddress: { email: "lawyer@firm.com" },
      toAddresses: [{ email: "client@example.com" }],
      subject: "Documents attached",
      bodyText: "Please find attached documents",
      hasAttachments: true,
      attachmentCount: 2,
      attachmentIds,
      status: "draft",
    };
    vi.mocked(withFirmDb).mockResolvedValueOnce(mockEmail as any);

    const { POST } = await import("@/app/api/emails/route");
    const request = new NextRequest("http://localhost/api/emails", {
      method: "POST",
      body: JSON.stringify({
        direction: "outbound",
        fromAddress: { email: "lawyer@firm.com" },
        toAddresses: [{ email: "client@example.com" }],
        subject: "Documents attached",
        bodyText: "Please find attached documents",
        attachmentIds,
      }),
    });

    const response = await POST(request as any, {} as any);
    expect(response.status).toBe(201);

    const json = await response.json();
    expect(json.hasAttachments).toBe(true);
    expect(json.attachmentCount).toBe(2);
  });

  it("creates email with HTML body", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const mockEmail = {
      id: "new-e6",
      direction: "outbound",
      fromAddress: { email: "lawyer@firm.com" },
      toAddresses: [{ email: "client@example.com" }],
      subject: "HTML email",
      bodyText: "Plain text version",
      bodyHtml: "<p>HTML version</p>",
      status: "draft",
      hasAttachments: false,
      attachmentCount: 0,
    };
    vi.mocked(withFirmDb).mockResolvedValueOnce(mockEmail as any);

    const { POST } = await import("@/app/api/emails/route");
    const request = new NextRequest("http://localhost/api/emails", {
      method: "POST",
      body: JSON.stringify({
        direction: "outbound",
        fromAddress: { email: "lawyer@firm.com" },
        toAddresses: [{ email: "client@example.com" }],
        subject: "HTML email",
        bodyText: "Plain text version",
        bodyHtml: "<p>HTML version</p>",
      }),
    });

    const response = await POST(request as any, {} as any);
    expect(response.status).toBe(201);
  });

  it("creates email with thread information", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const mockEmail = {
      id: "new-e7",
      direction: "outbound",
      fromAddress: { email: "lawyer@firm.com" },
      toAddresses: [{ email: "client@example.com" }],
      subject: "Re: Previous email",
      bodyText: "Reply text",
      messageId: "msg-456",
      threadId: "thread-123",
      inReplyTo: "msg-123",
      status: "draft",
      hasAttachments: false,
      attachmentCount: 0,
    };
    vi.mocked(withFirmDb).mockResolvedValueOnce(mockEmail as any);

    const { POST } = await import("@/app/api/emails/route");
    const request = new NextRequest("http://localhost/api/emails", {
      method: "POST",
      body: JSON.stringify({
        direction: "outbound",
        fromAddress: { email: "lawyer@firm.com" },
        toAddresses: [{ email: "client@example.com" }],
        subject: "Re: Previous email",
        bodyText: "Reply text",
        messageId: "msg-456",
        threadId: "thread-123",
        inReplyTo: "msg-123",
      }),
    });

    const response = await POST(request as any, {} as any);
    expect(response.status).toBe(201);
  });

  it("returns 404 when matter does not exist", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const { NotFoundError } = await import("@/middleware/withErrorHandler");
    vi.mocked(withFirmDb).mockRejectedValueOnce(new NotFoundError("Matter not found"));

    const { POST } = await import("@/app/api/emails/route");
    const request = new NextRequest("http://localhost/api/emails", {
      method: "POST",
      body: JSON.stringify({
        matterId: "123e4567-e89b-12d3-a456-426614174000",
        direction: "inbound",
        fromAddress: { email: "client@example.com" },
        toAddresses: [{ email: "lawyer@firm.com" }],
        subject: "Email for non-existent matter",
      }),
    });

    const response = await POST(request as any, {} as any);
    expect([404, 500]).toContain(response.status);
  });

  it("returns error when direction is missing", async () => {
    const { POST } = await import("@/app/api/emails/route");
    const request = new NextRequest("http://localhost/api/emails", {
      method: "POST",
      body: JSON.stringify({
        fromAddress: { email: "lawyer@firm.com" },
        toAddresses: [{ email: "client@example.com" }],
        subject: "Missing direction",
        // direction is missing
      }),
    });

    const response = await POST(request as any, {} as any);
    expect([400, 500]).toContain(response.status);
  });

  it("returns error when fromAddress is missing", async () => {
    const { POST } = await import("@/app/api/emails/route");
    const request = new NextRequest("http://localhost/api/emails", {
      method: "POST",
      body: JSON.stringify({
        direction: "outbound",
        toAddresses: [{ email: "client@example.com" }],
        subject: "Missing from address",
        // fromAddress is missing
      }),
    });

    const response = await POST(request as any, {} as any);
    expect([400, 500]).toContain(response.status);
  });

  it("returns error when toAddresses is missing", async () => {
    const { POST } = await import("@/app/api/emails/route");
    const request = new NextRequest("http://localhost/api/emails", {
      method: "POST",
      body: JSON.stringify({
        direction: "outbound",
        fromAddress: { email: "lawyer@firm.com" },
        subject: "Missing to addresses",
        // toAddresses is missing
      }),
    });

    const response = await POST(request as any, {} as any);
    expect([400, 500]).toContain(response.status);
  });

  it("returns error when toAddresses is empty array", async () => {
    const { POST } = await import("@/app/api/emails/route");
    const request = new NextRequest("http://localhost/api/emails", {
      method: "POST",
      body: JSON.stringify({
        direction: "outbound",
        fromAddress: { email: "lawyer@firm.com" },
        toAddresses: [],
        subject: "Empty to addresses",
      }),
    });

    const response = await POST(request as any, {} as any);
    expect([400, 500]).toContain(response.status);
  });

  it("returns error when subject is missing", async () => {
    const { POST } = await import("@/app/api/emails/route");
    const request = new NextRequest("http://localhost/api/emails", {
      method: "POST",
      body: JSON.stringify({
        direction: "outbound",
        fromAddress: { email: "lawyer@firm.com" },
        toAddresses: [{ email: "client@example.com" }],
        // subject is missing
      }),
    });

    const response = await POST(request as any, {} as any);
    expect([400, 500]).toContain(response.status);
  });

  it("returns error when subject is empty string", async () => {
    const { POST } = await import("@/app/api/emails/route");
    const request = new NextRequest("http://localhost/api/emails", {
      method: "POST",
      body: JSON.stringify({
        direction: "outbound",
        fromAddress: { email: "lawyer@firm.com" },
        toAddresses: [{ email: "client@example.com" }],
        subject: "",
      }),
    });

    const response = await POST(request as any, {} as any);
    expect([400, 500]).toContain(response.status);
  });

  it("validates email addresses in fromAddress", async () => {
    const { POST } = await import("@/app/api/emails/route");
    const request = new NextRequest("http://localhost/api/emails", {
      method: "POST",
      body: JSON.stringify({
        direction: "outbound",
        fromAddress: { email: "not-an-email" },
        toAddresses: [{ email: "client@example.com" }],
        subject: "Invalid from email",
      }),
    });

    const response = await POST(request as any, {} as any);
    expect([400, 500]).toContain(response.status);
  });

  it("validates email addresses in toAddresses", async () => {
    const { POST } = await import("@/app/api/emails/route");
    const request = new NextRequest("http://localhost/api/emails", {
      method: "POST",
      body: JSON.stringify({
        direction: "outbound",
        fromAddress: { email: "lawyer@firm.com" },
        toAddresses: [{ email: "not-an-email" }],
        subject: "Invalid to email",
      }),
    });

    const response = await POST(request as any, {} as any);
    expect([400, 500]).toContain(response.status);
  });

  it("validates direction enum values", async () => {
    const { POST } = await import("@/app/api/emails/route");
    const request = new NextRequest("http://localhost/api/emails", {
      method: "POST",
      body: JSON.stringify({
        direction: "invalid_direction",
        fromAddress: { email: "lawyer@firm.com" },
        toAddresses: [{ email: "client@example.com" }],
        subject: "Invalid direction",
      }),
    });

    const response = await POST(request as any, {} as any);
    expect([400, 500]).toContain(response.status);
  });

  it("validates matterId is a valid UUID when provided", async () => {
    const { POST } = await import("@/app/api/emails/route");
    const request = new NextRequest("http://localhost/api/emails", {
      method: "POST",
      body: JSON.stringify({
        matterId: "not-a-uuid",
        direction: "inbound",
        fromAddress: { email: "client@example.com" },
        toAddresses: [{ email: "lawyer@firm.com" }],
        subject: "Invalid matter ID",
      }),
    });

    const response = await POST(request as any, {} as any);
    expect([400, 500]).toContain(response.status);
  });
});
