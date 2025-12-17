// @vitest-environment node
/**
 * Document Chunks API Integration Tests
 *
 * Tests the `GET /api/documents/[id]/chunks` endpoint against a real database
 * with mocked authentication.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { documentChunks } from "@/lib/db/schema";
import { setupIntegrationSuite } from "@tests/integration/setup";
import { createClient } from "@tests/fixtures/factories/client";
import { createMatter } from "@tests/fixtures/factories/matter";
import { createDocument } from "@tests/fixtures/factories/document";
import { randomUUID } from "crypto";

// Test context for auth mocking
let testUserId: string = "";
let testFirmId: string = "";

// Mock the auth module to return our test user
vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(async () => {
        if (!testUserId) return null;
        return { user: { id: testUserId } };
      }),
    },
  },
}));

// Mock tenancy to return our test firm
vi.mock("@/lib/tenancy", () => ({
  getOrCreateFirmIdForUser: vi.fn(async () => testFirmId),
}));

describe("Document Chunks API - Integration Tests", () => {
  const ctx = setupIntegrationSuite();

  beforeEach(() => {
    vi.clearAllMocks();
    testFirmId = ctx.firmId;
    testUserId = "";
  });

  describe("GET /api/documents/[id]/chunks", () => {
    it("returns chunks for document with chunks", async () => {
      const client = await createClient({ firmId: ctx.firmId });
      const matter = await createMatter({ firmId: ctx.firmId, clientId: client.id });
      const document = await createDocument({
        firmId: ctx.firmId,
        matterId: matter.id,
        extractedText: "Full document text content",
      });

      // Seed chunks directly in DB
      await db.insert(documentChunks).values([
        {
          firmId: ctx.firmId,
          documentId: document.id,
          matterId: matter.id,
          chunkIndex: 0,
          text: "First chunk of text",
          charStart: 0,
          charEnd: 100,
        },
        {
          firmId: ctx.firmId,
          documentId: document.id,
          matterId: matter.id,
          chunkIndex: 1,
          text: "Second chunk of text",
          charStart: 100,
          charEnd: 200,
        },
      ]);

      testUserId = randomUUID();
      testFirmId = ctx.firmId;

      const { GET } = await import("@/app/api/documents/[id]/chunks/route");

      const request = new NextRequest(`http://localhost/api/documents/${document.id}/chunks`, {
        method: "GET",
      });

      const response = await GET(request as any, { params: { id: document.id } } as any);

      expect(response.status).toBe(200);
      const body = await response.json();

      expect(body.chunks).toBeDefined();
      expect(body.chunks.length).toBe(2);
      expect(body.chunks[0].text).toBe("First chunk of text");
      expect(body.chunks[0].chunkIndex).toBe(0);
      expect(body.chunks[1].text).toBe("Second chunk of text");
      expect(body.chunks[1].chunkIndex).toBe(1);
    });

    it("returns empty array for document without chunks", async () => {
      const client = await createClient({ firmId: ctx.firmId });
      const matter = await createMatter({ firmId: ctx.firmId, clientId: client.id });
      const document = await createDocument({
        firmId: ctx.firmId,
        matterId: matter.id,
        extractedText: "Document text without chunks",
      });

      testUserId = randomUUID();
      testFirmId = ctx.firmId;

      const { GET } = await import("@/app/api/documents/[id]/chunks/route");

      const request = new NextRequest(`http://localhost/api/documents/${document.id}/chunks`, {
        method: "GET",
      });

      const response = await GET(request as any, { params: { id: document.id } } as any);

      expect(response.status).toBe(200);
      const body = await response.json();

      expect(body.chunks).toBeDefined();
      expect(body.chunks.length).toBe(0);
    });

    it("returns 404 for non-existent document", async () => {
      testUserId = randomUUID();
      testFirmId = ctx.firmId;

      const nonExistentId = randomUUID();

      const { GET } = await import("@/app/api/documents/[id]/chunks/route");

      const request = new NextRequest(`http://localhost/api/documents/${nonExistentId}/chunks`, {
        method: "GET",
      });

      const response = await GET(request as any, { params: { id: nonExistentId } } as any);

      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body.error).toBeDefined();
    });

    it("returns 404 for document from different firm", async () => {
      // Create document in the test firm
      const client = await createClient({ firmId: ctx.firmId });
      const matter = await createMatter({ firmId: ctx.firmId, clientId: client.id });
      const document = await createDocument({
        firmId: ctx.firmId,
        matterId: matter.id,
      });

      // Set up auth for a different firm
      testUserId = randomUUID();
      testFirmId = randomUUID(); // Different firm!

      const { GET } = await import("@/app/api/documents/[id]/chunks/route");

      const request = new NextRequest(`http://localhost/api/documents/${document.id}/chunks`, {
        method: "GET",
      });

      const response = await GET(request as any, { params: { id: document.id } } as any);

      // Should return 404 because document doesn't belong to the user's firm
      expect(response.status).toBe(404);
    });

    it("returns chunks ordered by index", async () => {
      const client = await createClient({ firmId: ctx.firmId });
      const matter = await createMatter({ firmId: ctx.firmId, clientId: client.id });
      const document = await createDocument({
        firmId: ctx.firmId,
        matterId: matter.id,
        extractedText: "Document with multiple chunks",
      });

      // Insert chunks out of order
      await db.insert(documentChunks).values([
        {
          firmId: ctx.firmId,
          documentId: document.id,
          matterId: matter.id,
          chunkIndex: 2,
          text: "Third chunk",
        },
        {
          firmId: ctx.firmId,
          documentId: document.id,
          matterId: matter.id,
          chunkIndex: 0,
          text: "First chunk",
        },
        {
          firmId: ctx.firmId,
          documentId: document.id,
          matterId: matter.id,
          chunkIndex: 1,
          text: "Second chunk",
        },
      ]);

      testUserId = randomUUID();
      testFirmId = ctx.firmId;

      const { GET } = await import("@/app/api/documents/[id]/chunks/route");

      const request = new NextRequest(`http://localhost/api/documents/${document.id}/chunks`, {
        method: "GET",
      });

      const response = await GET(request as any, { params: { id: document.id } } as any);

      expect(response.status).toBe(200);
      const body = await response.json();

      expect(body.chunks.length).toBe(3);
      // Verify ordered by chunkIndex
      expect(body.chunks[0].chunkIndex).toBe(0);
      expect(body.chunks[0].text).toBe("First chunk");
      expect(body.chunks[1].chunkIndex).toBe(1);
      expect(body.chunks[1].text).toBe("Second chunk");
      expect(body.chunks[2].chunkIndex).toBe(2);
      expect(body.chunks[2].text).toBe("Third chunk");
    });
  });
});
