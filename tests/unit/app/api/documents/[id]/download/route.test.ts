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
  getPresignedUrl: vi.fn(async (bucket: string, path: string, expires: number) => {
    return `https://minio.example.com/${bucket}/${path}?expires=${expires}`;
  }),
}));

describe("Document Download API - GET /api/documents/[id]/download", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("returns presigned URL with default parameters", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const { getPresignedUrl } = await import("@/lib/storage/minio");

    const mockTx = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      leftJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([
        {
          document: {
            id: "doc-1",
            firmId: "firm-1",
            matterId: "matter-1",
            title: "Contract Document",
            uploadId: "upload-1",
            filename: "contract.pdf",
            mimeType: "application/pdf",
          },
          upload: {
            id: "upload-1",
            bucket: "uploads",
            path: "firms/firm-1/contract.pdf",
            mimeType: "application/pdf",
            originalName: "contract.pdf",
          },
        },
      ]),
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockResolvedValue(undefined),
    };

    vi.mocked(withFirmDb).mockImplementation(async (_firmId, callback) => {
      return callback(mockTx as any);
    });

    const { GET } = await import("@/app/api/documents/[id]/download/route");
    const request = new NextRequest("http://localhost/api/documents/doc-1/download");
    const response = await GET(request as any, { params: Promise.resolve({ id: "doc-1" }) } as any);

    expect(response.status).toBe(200);
    const json = await response.json();

    expect(json.url).toBeDefined();
    expect(json.url).toContain("https://minio.example.com/uploads/firms/firm-1/contract.pdf");
    expect(json.expiresAt).toBeDefined();
    expect(json.contentDisposition).toBe("inline");
    expect(json.filename).toBe("contract.pdf");
    expect(json.mimeType).toBe("application/pdf");

    expect(getPresignedUrl).toHaveBeenCalledWith("uploads", "firms/firm-1/contract.pdf", 3600);
    expect(mockTx.insert).toHaveBeenCalled();
    expect(mockTx.values).toHaveBeenCalledWith(
      expect.objectContaining({
        firmId: "firm-1",
        userId: "user-1",
        action: "document.download",
        category: "document",
        severity: "info",
        entityType: "document",
        entityId: "doc-1",
      })
    );
  });

  it("returns presigned URL with attachment disposition", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");

    const mockTx = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      leftJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([
        {
          document: {
            id: "doc-1",
            firmId: "firm-1",
            matterId: "matter-1",
            title: "Document",
            uploadId: "upload-1",
            filename: "document.pdf",
            mimeType: "application/pdf",
          },
          upload: {
            id: "upload-1",
            bucket: "uploads",
            path: "firms/firm-1/document.pdf",
            mimeType: "application/pdf",
            originalName: "document.pdf",
          },
        },
      ]),
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockResolvedValue(undefined),
    };

    vi.mocked(withFirmDb).mockImplementation(async (_firmId, callback) => {
      return callback(mockTx as any);
    });

    const { GET } = await import("@/app/api/documents/[id]/download/route");
    const request = new NextRequest(
      "http://localhost/api/documents/doc-1/download?disposition=attachment"
    );
    const response = await GET(request as any, { params: Promise.resolve({ id: "doc-1" }) } as any);

    expect(response.status).toBe(200);
    const json = await response.json();

    expect(json.contentDisposition).toBe("attachment");
    expect(mockTx.values).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          disposition: "attachment",
        }),
      })
    );
  });

  it("respects custom expiry parameter", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const { getPresignedUrl } = await import("@/lib/storage/minio");

    const mockTx = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      leftJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([
        {
          document: {
            id: "doc-1",
            firmId: "firm-1",
            matterId: "matter-1",
            title: "Document",
            uploadId: "upload-1",
            filename: "doc.pdf",
            mimeType: "application/pdf",
          },
          upload: {
            id: "upload-1",
            bucket: "uploads",
            path: "firms/firm-1/doc.pdf",
            mimeType: "application/pdf",
            originalName: "doc.pdf",
          },
        },
      ]),
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockResolvedValue(undefined),
    };

    vi.mocked(withFirmDb).mockImplementation(async (_firmId, callback) => {
      return callback(mockTx as any);
    });

    const { GET } = await import("@/app/api/documents/[id]/download/route");
    const request = new NextRequest("http://localhost/api/documents/doc-1/download?expires=7200");
    const response = await GET(request as any, { params: Promise.resolve({ id: "doc-1" }) } as any);

    expect(response.status).toBe(200);
    expect(getPresignedUrl).toHaveBeenCalledWith("uploads", "firms/firm-1/doc.pdf", 7200);
  });

  it("validates expiry within allowed range (min 1, max 86400)", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");

    const mockTx = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      leftJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([
        {
          document: {
            id: "doc-1",
            firmId: "firm-1",
            matterId: "matter-1",
            title: "Document",
            uploadId: "upload-1",
            filename: "doc.pdf",
            mimeType: "application/pdf",
          },
          upload: {
            id: "upload-1",
            bucket: "uploads",
            path: "firms/firm-1/doc.pdf",
            mimeType: "application/pdf",
            originalName: "doc.pdf",
          },
        },
      ]),
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockResolvedValue(undefined),
    };

    vi.mocked(withFirmDb).mockImplementation(async (_firmId, callback) => {
      return callback(mockTx as any);
    });

    const { GET } = await import("@/app/api/documents/[id]/download/route");

    // Test with invalid value (0 - below minimum)
    const request1 = new NextRequest("http://localhost/api/documents/doc-1/download?expires=0");
    const response1 = await GET(
      request1 as any,
      { params: Promise.resolve({ id: "doc-1" }) } as any
    );

    // Should reject values below 1
    expect(response1.status).toBe(400);
  });

  it("clamps expiry to maximum 86400 seconds (24 hours)", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");

    const mockTx = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      leftJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([
        {
          document: {
            id: "doc-1",
            firmId: "firm-1",
            matterId: "matter-1",
            title: "Document",
            uploadId: "upload-1",
            filename: "doc.pdf",
            mimeType: "application/pdf",
          },
          upload: {
            id: "upload-1",
            bucket: "uploads",
            path: "firms/firm-1/doc.pdf",
            mimeType: "application/pdf",
            originalName: "doc.pdf",
          },
        },
      ]),
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockResolvedValue(undefined),
    };

    vi.mocked(withFirmDb).mockImplementation(async (_firmId, callback) => {
      return callback(mockTx as any);
    });

    const { GET } = await import("@/app/api/documents/[id]/download/route");
    const request = new NextRequest("http://localhost/api/documents/doc-1/download?expires=100000");
    const response = await GET(request as any, { params: Promise.resolve({ id: "doc-1" }) } as any);

    // Should reject values above 86400
    expect(response.status).toBe(400);
  });

  it("uses original filename from upload", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");

    const mockTx = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      leftJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([
        {
          document: {
            id: "doc-1",
            firmId: "firm-1",
            matterId: "matter-1",
            title: "Document",
            uploadId: "upload-1",
            filename: null,
            mimeType: null,
          },
          upload: {
            id: "upload-1",
            bucket: "uploads",
            path: "firms/firm-1/original.pdf",
            mimeType: "application/pdf",
            originalName: "original.pdf",
          },
        },
      ]),
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockResolvedValue(undefined),
    };

    vi.mocked(withFirmDb).mockImplementation(async (_firmId, callback) => {
      return callback(mockTx as any);
    });

    const { GET } = await import("@/app/api/documents/[id]/download/route");
    const request = new NextRequest("http://localhost/api/documents/doc-1/download");
    const response = await GET(request as any, { params: Promise.resolve({ id: "doc-1" }) } as any);

    expect(response.status).toBe(200);
    const json = await response.json();

    expect(json.filename).toBe("original.pdf");
    expect(json.mimeType).toBe("application/pdf");
  });

  it("returns 404 when document not found", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");

    const mockTx = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      leftJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]),
    };

    vi.mocked(withFirmDb).mockImplementation(async (_firmId, callback) => {
      return callback(mockTx as any);
    });

    const { GET } = await import("@/app/api/documents/[id]/download/route");
    const request = new NextRequest("http://localhost/api/documents/nonexistent/download");
    const response = await GET(
      request as any,
      { params: Promise.resolve({ id: "nonexistent" }) } as any
    );

    expect(response.status).toBe(404);
  });

  it("returns 404 when document has no upload", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");

    const mockTx = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      leftJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([
        {
          document: {
            id: "doc-1",
            firmId: "firm-1",
            matterId: "matter-1",
            title: "Document",
            uploadId: "upload-1",
            filename: null,
            mimeType: null,
          },
          upload: null,
        },
      ]),
    };

    vi.mocked(withFirmDb).mockImplementation(async (_firmId, callback) => {
      return callback(mockTx as any);
    });

    const { GET } = await import("@/app/api/documents/[id]/download/route");
    const request = new NextRequest("http://localhost/api/documents/doc-1/download");
    const response = await GET(request as any, { params: Promise.resolve({ id: "doc-1" }) } as any);

    expect(response.status).toBe(404);
  });

  it("enforces firm scoping", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");

    const mockTx = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      leftJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([
        {
          document: {
            id: "doc-1",
            firmId: "firm-1",
            matterId: "matter-1",
            title: "Contract",
            uploadId: "upload-1",
            filename: "contract.pdf",
            mimeType: "application/pdf",
          },
          upload: {
            id: "upload-1",
            bucket: "uploads",
            path: "firms/firm-1/contract.pdf",
            mimeType: "application/pdf",
            originalName: "contract.pdf",
          },
        },
      ]),
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockResolvedValue(undefined),
    };

    vi.mocked(withFirmDb).mockImplementation(async (firmId, callback) => {
      expect(firmId).toBe("firm-1");
      return callback(mockTx as any);
    });

    const { GET } = await import("@/app/api/documents/[id]/download/route");
    const request = new NextRequest("http://localhost/api/documents/doc-1/download");
    await GET(request as any, { params: Promise.resolve({ id: "doc-1" }) } as any);

    expect(withFirmDb).toHaveBeenCalledWith("firm-1", expect.any(Function));
  });

  it("logs document access to audit trail", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");

    const mockTx = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      leftJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([
        {
          document: {
            id: "doc-1",
            firmId: "firm-1",
            matterId: "matter-1",
            title: "Sensitive Document",
            uploadId: "upload-1",
            filename: "sensitive.pdf",
            mimeType: "application/pdf",
          },
          upload: {
            id: "upload-1",
            bucket: "uploads",
            path: "firms/firm-1/sensitive.pdf",
            mimeType: "application/pdf",
            originalName: "sensitive.pdf",
          },
        },
      ]),
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockResolvedValue(undefined),
    };

    vi.mocked(withFirmDb).mockImplementation(async (_firmId, callback) => {
      return callback(mockTx as any);
    });

    const { GET } = await import("@/app/api/documents/[id]/download/route");
    const request = new NextRequest("http://localhost/api/documents/doc-1/download");
    await GET(request as any, { params: Promise.resolve({ id: "doc-1" }) } as any);

    expect(mockTx.insert).toHaveBeenCalled();
    expect(mockTx.values).toHaveBeenCalledWith(
      expect.objectContaining({
        firmId: "firm-1",
        userId: "user-1",
        action: "document.download",
        category: "document",
        severity: "info",
        description: "Document accessed: Sensitive Document",
        entityType: "document",
        entityId: "doc-1",
        metadata: expect.objectContaining({
          disposition: "inline",
          filename: "sensitive.pdf",
          mimeType: "application/pdf",
        }),
      })
    );
  });
});
