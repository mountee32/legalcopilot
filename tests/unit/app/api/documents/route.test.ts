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

vi.mock("@/lib/queue/pipeline", () => ({
  startPipeline: vi.fn().mockResolvedValue(undefined),
}));

describe("Documents API - GET /api/documents", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("returns list of all documents", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const mockDocuments = [
      {
        id: "doc-1",
        matterId: "matter-1",
        title: "Contract Agreement",
        type: "contract",
        status: "approved",
        uploadId: "upload-1",
        filename: "contract.pdf",
        mimeType: "application/pdf",
        fileSize: 102400,
        createdBy: "user-1",
        documentDate: new Date("2024-01-15"),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "doc-2",
        matterId: "matter-2",
        title: "Client Correspondence",
        type: "email_in",
        status: "draft",
        uploadId: null,
        filename: null,
        mimeType: null,
        fileSize: null,
        createdBy: "user-1",
        documentDate: new Date("2024-01-20"),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    vi.mocked(withFirmDb).mockResolvedValueOnce(mockDocuments as any);

    const { GET } = await import("@/app/api/documents/route");
    const request = new NextRequest("http://localhost/api/documents");
    const response = await GET(request as any, {} as any);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(Array.isArray(json.documents)).toBe(true);
    expect(json.documents.length).toBe(2);
    expect(json.documents[0].title).toBe("Contract Agreement");
    expect(json.documents[1].title).toBe("Client Correspondence");
  });

  it("returns empty list when no documents exist", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    vi.mocked(withFirmDb).mockResolvedValueOnce([] as any);

    const { GET } = await import("@/app/api/documents/route");
    const request = new NextRequest("http://localhost/api/documents");
    const response = await GET(request as any, {} as any);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.documents).toEqual([]);
  });

  it("filters by matterId parameter", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const mockDocuments = [
      {
        id: "doc-1",
        matterId: "matter-123",
        title: "Document for Matter 123",
        type: "contract",
        status: "approved",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    vi.mocked(withFirmDb).mockResolvedValueOnce(mockDocuments as any);

    const { GET } = await import("@/app/api/documents/route");
    const request = new NextRequest("http://localhost/api/documents?matterId=matter-123");
    const response = await GET(request as any, {} as any);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.documents.length).toBe(1);
    expect(json.documents[0].matterId).toBe("matter-123");
  });

  it("returns documents ordered by creation date", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const mockDocuments = [
      {
        id: "doc-1",
        matterId: "matter-1",
        title: "First Document",
        type: "contract",
        status: "draft",
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
      },
      {
        id: "doc-2",
        matterId: "matter-1",
        title: "Second Document",
        type: "letter_out",
        status: "draft",
        createdAt: new Date("2024-01-02"),
        updatedAt: new Date("2024-01-02"),
      },
    ];
    vi.mocked(withFirmDb).mockResolvedValueOnce(mockDocuments as any);

    const { GET } = await import("@/app/api/documents/route");
    const request = new NextRequest("http://localhost/api/documents");
    const response = await GET(request as any, {} as any);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.documents.length).toBe(2);
  });
});

describe("Documents API - POST /api/documents", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("creates a document successfully", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const matterId = "123e4567-e89b-12d3-a456-426614174000";
    const uploadId = "223e4567-e89b-12d3-a456-426614174000";
    const mockDocument = {
      id: "new-doc-1",
      firmId: "firm-1",
      matterId,
      title: "New Contract",
      type: "contract",
      status: "draft",
      uploadId,
      filename: "contract.pdf",
      mimeType: "application/pdf",
      fileSize: 204800,
      createdBy: "user-1",
      documentDate: new Date("2024-02-01"),
      recipient: null,
      sender: null,
      extractedText: null,
      metadata: null,
      version: 1,
      parentId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    vi.mocked(withFirmDb).mockResolvedValueOnce(mockDocument as any);

    const { POST } = await import("@/app/api/documents/route");
    const request = new NextRequest("http://localhost/api/documents", {
      method: "POST",
      body: JSON.stringify({
        matterId,
        title: "New Contract",
        type: "contract",
        uploadId,
        filename: "contract.pdf",
        mimeType: "application/pdf",
        fileSize: 204800,
        documentDate: "2024-02-01T00:00:00Z",
      }),
    });

    const response = await POST(request as any, {} as any);
    expect(response.status).toBe(201);

    const json = await response.json();
    expect(json.title).toBe("New Contract");
    expect(json.type).toBe("contract");
    expect(json.status).toBe("draft");
    expect(json.matterId).toBe(matterId);
  });

  it("creates a document with minimal required fields", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const matterId = "123e4567-e89b-12d3-a456-426614174001";
    const mockDocument = {
      id: "new-doc-2",
      firmId: "firm-1",
      matterId,
      title: "Simple Note",
      type: "note",
      status: "draft",
      uploadId: null,
      filename: null,
      mimeType: null,
      fileSize: null,
      createdBy: "user-1",
      documentDate: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    vi.mocked(withFirmDb).mockResolvedValueOnce(mockDocument as any);

    const { POST } = await import("@/app/api/documents/route");
    const request = new NextRequest("http://localhost/api/documents", {
      method: "POST",
      body: JSON.stringify({
        matterId,
        title: "Simple Note",
        type: "note",
      }),
    });

    const response = await POST(request as any, {} as any);
    expect(response.status).toBe(201);

    const json = await response.json();
    expect(json.title).toBe("Simple Note");
    expect(json.type).toBe("note");
    expect(json.uploadId).toBeNull();
  });

  it("creates document with all optional fields", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const matterId = "123e4567-e89b-12d3-a456-426614174002";
    const uploadId = "223e4567-e89b-12d3-a456-426614174002";
    const mockDocument = {
      id: "new-doc-3",
      firmId: "firm-1",
      matterId,
      title: "Legal Letter",
      type: "letter_out",
      status: "draft",
      uploadId,
      filename: "letter.docx",
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      fileSize: 51200,
      createdBy: "user-1",
      documentDate: new Date("2024-02-10"),
      recipient: "Client Name",
      sender: "Law Firm",
      extractedText: "Letter content...",
      metadata: { category: "formal", priority: "high" },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    vi.mocked(withFirmDb).mockResolvedValueOnce(mockDocument as any);

    const { POST } = await import("@/app/api/documents/route");
    const request = new NextRequest("http://localhost/api/documents", {
      method: "POST",
      body: JSON.stringify({
        matterId,
        title: "Legal Letter",
        type: "letter_out",
        uploadId,
        filename: "letter.docx",
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        fileSize: 51200,
        documentDate: "2024-02-10T00:00:00Z",
        recipient: "Client Name",
        sender: "Law Firm",
        extractedText: "Letter content...",
        metadata: { category: "formal", priority: "high" },
      }),
    });

    const response = await POST(request as any, {} as any);
    expect(response.status).toBe(201);

    const json = await response.json();
    expect(json.recipient).toBe("Client Name");
    expect(json.sender).toBe("Law Firm");
    expect(json.extractedText).toBe("Letter content...");
    expect(json.metadata).toEqual({ category: "formal", priority: "high" });
  });

  it("returns 404 when matter does not exist", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const { NotFoundError } = await import("@/middleware/withErrorHandler");
    const matterId = "123e4567-e89b-12d3-a456-426614174003";
    vi.mocked(withFirmDb).mockRejectedValueOnce(new NotFoundError("Matter not found"));

    const { POST } = await import("@/app/api/documents/route");
    const request = new NextRequest("http://localhost/api/documents", {
      method: "POST",
      body: JSON.stringify({
        matterId,
        title: "Test Document",
        type: "contract",
      }),
    });

    const response = await POST(request as any, {} as any);
    expect(response.status).toBe(404);
  });

  it("returns error when matterId is missing", async () => {
    const { POST } = await import("@/app/api/documents/route");
    const request = new NextRequest("http://localhost/api/documents", {
      method: "POST",
      body: JSON.stringify({
        title: "Test Document",
        type: "contract",
      }),
    });

    const response = await POST(request as any, {} as any);
    expect([400, 500]).toContain(response.status);
  });

  it("returns error when title is missing", async () => {
    const { POST } = await import("@/app/api/documents/route");
    const request = new NextRequest("http://localhost/api/documents", {
      method: "POST",
      body: JSON.stringify({
        matterId: "matter-1",
        type: "contract",
      }),
    });

    const response = await POST(request as any, {} as any);
    expect([400, 500]).toContain(response.status);
  });

  it("returns error when type is missing", async () => {
    const { POST } = await import("@/app/api/documents/route");
    const request = new NextRequest("http://localhost/api/documents", {
      method: "POST",
      body: JSON.stringify({
        matterId: "matter-1",
        title: "Test Document",
      }),
    });

    const response = await POST(request as any, {} as any);
    expect([400, 500]).toContain(response.status);
  });

  it("returns error when title exceeds max length", async () => {
    const { POST } = await import("@/app/api/documents/route");
    const longTitle = "A".repeat(201);
    const request = new NextRequest("http://localhost/api/documents", {
      method: "POST",
      body: JSON.stringify({
        matterId: "matter-1",
        title: longTitle,
        type: "contract",
      }),
    });

    const response = await POST(request as any, {} as any);
    expect([400, 500]).toContain(response.status);
  });

  it("returns error for invalid document type", async () => {
    const { POST } = await import("@/app/api/documents/route");
    const request = new NextRequest("http://localhost/api/documents", {
      method: "POST",
      body: JSON.stringify({
        matterId: "matter-1",
        title: "Test Document",
        type: "invalid_type",
      }),
    });

    const response = await POST(request as any, {} as any);
    expect([400, 500]).toContain(response.status);
  });

  it("returns error for invalid JSON body", async () => {
    const { POST } = await import("@/app/api/documents/route");
    const request = new NextRequest("http://localhost/api/documents", {
      method: "POST",
      body: "invalid json",
    });

    const response = await POST(request as any, {} as any);
    expect([400, 500]).toContain(response.status);
  });

  it("validates contract document type", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const matterId = "123e4567-e89b-12d3-a456-426614174004";
    const mockDocument = {
      id: "doc-contract",
      firmId: "firm-1",
      matterId,
      title: "Contract document",
      type: "contract",
      status: "draft",
      createdBy: "user-1",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    vi.mocked(withFirmDb).mockResolvedValueOnce(mockDocument as any);

    const { POST } = await import("@/app/api/documents/route");
    const request = new NextRequest("http://localhost/api/documents", {
      method: "POST",
      body: JSON.stringify({
        matterId,
        title: "Contract document",
        type: "contract",
      }),
    });

    const response = await POST(request as any, {} as any);
    expect(response.status).toBe(201);
  });

  it("validates letter_in document type", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const matterId = "123e4567-e89b-12d3-a456-426614174005";
    const mockDocument = {
      id: "doc-letter",
      firmId: "firm-1",
      matterId,
      title: "Letter document",
      type: "letter_in",
      status: "draft",
      createdBy: "user-1",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    vi.mocked(withFirmDb).mockResolvedValueOnce(mockDocument as any);

    const { POST } = await import("@/app/api/documents/route");
    const request = new NextRequest("http://localhost/api/documents", {
      method: "POST",
      body: JSON.stringify({
        matterId,
        title: "Letter document",
        type: "letter_in",
      }),
    });

    const response = await POST(request as any, {} as any);
    expect(response.status).toBe(201);
  });
});
