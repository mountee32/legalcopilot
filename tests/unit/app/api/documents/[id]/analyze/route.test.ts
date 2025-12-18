/**
 * Unit tests for document analysis API endpoint
 */

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

vi.mock("@/lib/storage/minio", () => ({
  downloadFile: vi.fn(),
}));

vi.mock("@/lib/documents/analyze", () => ({
  analyzeDocument: vi.fn(),
}));

vi.mock("@/lib/timeline/createEvent", () => ({
  createTimelineEvent: vi.fn(),
}));

describe("Document Analyze API - POST /api/documents/[id]/analyze", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    process.env.OPENROUTER_API_KEY = "test-key";
  });

  it("returns analysis for document with upload", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const { downloadFile } = await import("@/lib/storage/minio");
    const { analyzeDocument } = await import("@/lib/documents/analyze");
    const { createTimelineEvent } = await import("@/lib/timeline/createEvent");

    const mockTx = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn(),
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
    };

    // First call - get document
    mockTx.limit.mockResolvedValueOnce([
      {
        id: "doc-1",
        matterId: "matter-1",
        uploadId: "upload-1",
        analyzedAt: null,
      },
    ]);

    // Second call - get upload
    mockTx.limit.mockResolvedValueOnce([
      {
        bucket: "uploads",
        path: "firms/firm-1/contract.pdf",
      },
    ]);

    vi.mocked(withFirmDb).mockImplementation(async (_firmId, callback) => {
      return callback(mockTx as any);
    });

    vi.mocked(downloadFile).mockResolvedValue(Buffer.from("mock pdf"));

    vi.mocked(analyzeDocument).mockResolvedValue({
      suggestedTitle: "Contract for Sale",
      documentType: "contract",
      documentDate: "2024-11-15",
      parties: [{ name: "Margaret Thompson", role: "Buyer" }],
      keyDates: [{ label: "Completion Date", date: "2024-12-20" }],
      summary: "Standard contract for sale.",
      confidence: 92,
      confidenceLevel: "green",
      tokensUsed: 1500,
      model: "google/gemini-2.0-flash-001",
    });

    const { POST } = await import("@/app/api/documents/[id]/analyze/route");
    const request = new NextRequest("http://localhost/api/documents/doc-1/analyze", {
      method: "POST",
      body: JSON.stringify({}),
    });

    const response = await POST(
      request as any,
      {
        params: Promise.resolve({ id: "doc-1" }),
      } as any
    );

    expect(response.status).toBe(200);
    const json = await response.json();

    expect(json.success).toBe(true);
    expect(json.analysis.suggestedTitle).toBe("Contract for Sale");
    expect(json.analysis.documentType).toBe("contract");
    expect(json.analysis.confidence).toBe(92);
    expect(json.analysis.confidenceLevel).toBe("green");
    expect(json.analysis.parties).toHaveLength(1);
    expect(json.usage.tokensUsed).toBe(1500);
    expect(json.cached).toBe(false);

    expect(downloadFile).toHaveBeenCalledWith("uploads", "firms/firm-1/contract.pdf");
    expect(analyzeDocument).toHaveBeenCalled();
    expect(mockTx.update).toHaveBeenCalled();
    expect(createTimelineEvent).toHaveBeenCalled();
  });

  it("returns cached result when already analyzed", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const { analyzeDocument } = await import("@/lib/documents/analyze");

    const mockTx = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn(),
    };

    // First call - document with analyzedAt set
    mockTx.limit.mockResolvedValueOnce([
      {
        id: "doc-1",
        matterId: "matter-1",
        uploadId: "upload-1",
        analyzedAt: new Date(),
      },
    ]);

    // Second call - cached analysis data
    mockTx.limit.mockResolvedValueOnce([
      {
        title: "Cached Contract",
        type: "contract",
        documentDate: new Date("2024-11-15"),
        aiSummary: "Cached summary",
        aiConfidence: 85,
        extractedParties: [{ name: "Test Party", role: "Buyer" }],
        extractedDates: [{ label: "Date", date: "2024-12-20" }],
        aiTokensUsed: 1000,
        aiModel: "google/gemini-2.0-flash-001",
      },
    ]);

    vi.mocked(withFirmDb).mockImplementation(async (_firmId, callback) => {
      return callback(mockTx as any);
    });

    const { POST } = await import("@/app/api/documents/[id]/analyze/route");
    const request = new NextRequest("http://localhost/api/documents/doc-1/analyze", {
      method: "POST",
      body: JSON.stringify({}),
    });

    const response = await POST(
      request as any,
      {
        params: Promise.resolve({ id: "doc-1" }),
      } as any
    );

    expect(response.status).toBe(200);
    const json = await response.json();

    expect(json.success).toBe(true);
    expect(json.analysis.suggestedTitle).toBe("Cached Contract");
    expect(json.cached).toBe(true);
    expect(analyzeDocument).not.toHaveBeenCalled();
  });

  it("re-analyzes when force=true", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const { downloadFile } = await import("@/lib/storage/minio");
    const { analyzeDocument } = await import("@/lib/documents/analyze");

    const mockTx = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn(),
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
    };

    // Document already analyzed
    mockTx.limit.mockResolvedValueOnce([
      {
        id: "doc-1",
        matterId: "matter-1",
        uploadId: "upload-1",
        analyzedAt: new Date(),
      },
    ]);

    // Get upload
    mockTx.limit.mockResolvedValueOnce([
      {
        bucket: "uploads",
        path: "firms/firm-1/contract.pdf",
      },
    ]);

    vi.mocked(withFirmDb).mockImplementation(async (_firmId, callback) => {
      return callback(mockTx as any);
    });

    vi.mocked(downloadFile).mockResolvedValue(Buffer.from("mock pdf"));

    vi.mocked(analyzeDocument).mockResolvedValue({
      suggestedTitle: "Re-analyzed Contract",
      documentType: "contract",
      documentDate: "2024-11-15",
      parties: [],
      keyDates: [],
      summary: "Fresh analysis",
      confidence: 95,
      confidenceLevel: "green",
      tokensUsed: 1800,
      model: "google/gemini-2.0-flash-001",
    });

    const { POST } = await import("@/app/api/documents/[id]/analyze/route");
    const request = new NextRequest("http://localhost/api/documents/doc-1/analyze", {
      method: "POST",
      body: JSON.stringify({ force: true }),
    });

    const response = await POST(
      request as any,
      {
        params: Promise.resolve({ id: "doc-1" }),
      } as any
    );

    expect(response.status).toBe(200);
    const json = await response.json();

    expect(json.analysis.suggestedTitle).toBe("Re-analyzed Contract");
    expect(json.cached).toBe(false);
    expect(analyzeDocument).toHaveBeenCalled();
  });

  it("returns 404 for non-existent document", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");

    const mockTx = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]),
    };

    vi.mocked(withFirmDb).mockImplementation(async (_firmId, callback) => {
      return callback(mockTx as any);
    });

    const { POST } = await import("@/app/api/documents/[id]/analyze/route");
    const request = new NextRequest("http://localhost/api/documents/nonexistent/analyze", {
      method: "POST",
      body: JSON.stringify({}),
    });

    const response = await POST(
      request as any,
      {
        params: Promise.resolve({ id: "nonexistent" }),
      } as any
    );

    expect(response.status).toBe(404);
  });

  it("returns 400 for document without upload", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");

    const mockTx = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([
        {
          id: "doc-1",
          matterId: "matter-1",
          uploadId: null,
          analyzedAt: null,
        },
      ]),
    };

    vi.mocked(withFirmDb).mockImplementation(async (_firmId, callback) => {
      return callback(mockTx as any);
    });

    const { POST } = await import("@/app/api/documents/[id]/analyze/route");
    const request = new NextRequest("http://localhost/api/documents/doc-1/analyze", {
      method: "POST",
      body: JSON.stringify({}),
    });

    const response = await POST(
      request as any,
      {
        params: Promise.resolve({ id: "doc-1" }),
      } as any
    );

    expect(response.status).toBe(400);
  });

  it("returns 400 when OPENROUTER_API_KEY is not set", async () => {
    delete process.env.OPENROUTER_API_KEY;

    const { POST } = await import("@/app/api/documents/[id]/analyze/route");
    const request = new NextRequest("http://localhost/api/documents/doc-1/analyze", {
      method: "POST",
      body: JSON.stringify({}),
    });

    const response = await POST(
      request as any,
      {
        params: Promise.resolve({ id: "doc-1" }),
      } as any
    );

    expect(response.status).toBe(400);
  });

  it("accepts async=true and returns job ID", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");

    const mockTx = {
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([{ id: "job-123" }]),
    };

    vi.mocked(withFirmDb).mockImplementation(async (_firmId, callback) => {
      return callback(mockTx as any);
    });

    // Mock the queue import
    vi.doMock("@/lib/queue", () => ({
      addGenericJob: vi.fn(),
    }));

    const { POST } = await import("@/app/api/documents/[id]/analyze/route");
    const request = new NextRequest("http://localhost/api/documents/doc-1/analyze?async=true", {
      method: "POST",
      body: JSON.stringify({}),
    });

    const response = await POST(
      request as any,
      {
        params: Promise.resolve({ id: "doc-1" }),
      } as any
    );

    expect(response.status).toBe(202);
    const json = await response.json();

    expect(json.accepted).toBe(true);
    expect(json.jobId).toBe("job-123");
  });

  it("saves analysis results to document record", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const { downloadFile } = await import("@/lib/storage/minio");
    const { analyzeDocument } = await import("@/lib/documents/analyze");

    const mockTx = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn(),
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
    };

    mockTx.limit.mockResolvedValueOnce([
      {
        id: "doc-1",
        matterId: "matter-1",
        uploadId: "upload-1",
        analyzedAt: null,
      },
    ]);

    mockTx.limit.mockResolvedValueOnce([
      {
        bucket: "uploads",
        path: "firms/firm-1/doc.pdf",
      },
    ]);

    vi.mocked(withFirmDb).mockImplementation(async (_firmId, callback) => {
      return callback(mockTx as any);
    });

    vi.mocked(downloadFile).mockResolvedValue(Buffer.from("mock pdf"));

    vi.mocked(analyzeDocument).mockResolvedValue({
      suggestedTitle: "Test Document",
      documentType: "letter_out",
      documentDate: "2024-11-15",
      parties: [{ name: "John Doe", role: "Recipient" }],
      keyDates: [{ label: "Deadline", date: "2024-12-01" }],
      summary: "Test summary",
      confidence: 75,
      confidenceLevel: "amber",
      tokensUsed: 1200,
      model: "google/gemini-2.0-flash-001",
    });

    const { POST } = await import("@/app/api/documents/[id]/analyze/route");
    const request = new NextRequest("http://localhost/api/documents/doc-1/analyze", {
      method: "POST",
      body: JSON.stringify({}),
    });

    await POST(request as any, { params: Promise.resolve({ id: "doc-1" }) } as any);

    expect(mockTx.update).toHaveBeenCalled();
    expect(mockTx.set).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Test Document",
        type: "letter_out",
        aiSummary: "Test summary",
        aiConfidence: 75,
        extractedParties: [{ name: "John Doe", role: "Recipient" }],
        extractedDates: [{ label: "Deadline", date: "2024-12-01" }],
        aiTokensUsed: 1200,
        aiModel: "google/gemini-2.0-flash-001",
      })
    );
  });

  it("creates timeline event for analysis", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const { downloadFile } = await import("@/lib/storage/minio");
    const { analyzeDocument } = await import("@/lib/documents/analyze");
    const { createTimelineEvent } = await import("@/lib/timeline/createEvent");

    const mockTx = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn(),
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
    };

    mockTx.limit.mockResolvedValueOnce([
      {
        id: "doc-1",
        matterId: "matter-1",
        uploadId: "upload-1",
        analyzedAt: null,
      },
    ]);

    mockTx.limit.mockResolvedValueOnce([
      {
        bucket: "uploads",
        path: "firms/firm-1/doc.pdf",
      },
    ]);

    vi.mocked(withFirmDb).mockImplementation(async (_firmId, callback) => {
      return callback(mockTx as any);
    });

    vi.mocked(downloadFile).mockResolvedValue(Buffer.from("mock pdf"));

    vi.mocked(analyzeDocument).mockResolvedValue({
      suggestedTitle: "Contract",
      documentType: "contract",
      documentDate: null,
      parties: [
        { name: "Buyer", role: "Buyer" },
        { name: "Seller", role: "Seller" },
      ],
      keyDates: [],
      summary: "Contract summary",
      confidence: 88,
      confidenceLevel: "green",
      tokensUsed: 1100,
      model: "google/gemini-2.0-flash-001",
    });

    const { POST } = await import("@/app/api/documents/[id]/analyze/route");
    const request = new NextRequest("http://localhost/api/documents/doc-1/analyze", {
      method: "POST",
      body: JSON.stringify({}),
    });

    await POST(request as any, { params: Promise.resolve({ id: "doc-1" }) } as any);

    expect(createTimelineEvent).toHaveBeenCalledWith(
      mockTx,
      expect.objectContaining({
        firmId: "firm-1",
        matterId: "matter-1",
        type: "document_analyzed",
        title: "Document analyzed by AI",
        actorType: "ai",
        entityType: "document",
        entityId: "doc-1",
        metadata: expect.objectContaining({
          confidence: 88,
          confidenceLevel: "green",
          documentType: "contract",
          partiesCount: 2,
          keyDatesCount: 0,
        }),
      })
    );
  });
});
