/**
 * Documents Integration Tests
 *
 * Tests document CRUD operations, processing, and storage against the real database.
 * Uses setupIntegrationSuite() to provide a test firm with cleanup.
 */
import { describe, it, expect } from "vitest";
import { db } from "@/lib/db";
import { documents, documentChunks, clients, matters } from "@/lib/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { setupIntegrationSuite, setupFreshFirmPerTest } from "@tests/integration/setup";
import { createDocument } from "@tests/fixtures/factories/document";
import { createClient } from "@tests/fixtures/factories/client";
import { createMatter } from "@tests/fixtures/factories/matter";
import { createFirm } from "@tests/fixtures/factories/firm";

describe("Documents Integration - CRUD", () => {
  const ctx = setupIntegrationSuite();

  describe("Create (Upload Document)", () => {
    it("uploads a document to a matter", async () => {
      const client = await createClient({ firmId: ctx.firmId });
      const matter = await createMatter({
        firmId: ctx.firmId,
        clientId: client.id,
      });

      const document = await createDocument({
        firmId: ctx.firmId,
        matterId: matter.id,
        title: "Test Upload Document",
        type: "contract",
        filename: "contract.pdf",
        mimeType: "application/pdf",
        fileSize: 2048,
      });

      expect(document.id).toBeDefined();
      expect(document.firmId).toBe(ctx.firmId);
      expect(document.matterId).toBe(matter.id);
      expect(document.title).toBe("Test Upload Document");
      expect(document.type).toBe("contract");
      expect(document.status).toBe("draft");
      expect(document.filename).toBe("contract.pdf");
      expect(document.mimeType).toBe("application/pdf");
    });

    it("creates document with extracted text", async () => {
      const client = await createClient({ firmId: ctx.firmId });
      const matter = await createMatter({
        firmId: ctx.firmId,
        clientId: client.id,
      });

      const extractedText = "This is the extracted text from the document.";
      const document = await createDocument({
        firmId: ctx.firmId,
        matterId: matter.id,
        title: "Document with Text",
        extractedText,
      });

      const [dbDoc] = await db.select().from(documents).where(eq(documents.id, document.id));

      expect(dbDoc.extractedText).toBe(extractedText);
    });

    it("creates document with AI summary", async () => {
      const client = await createClient({ firmId: ctx.firmId });
      const matter = await createMatter({
        firmId: ctx.firmId,
        clientId: client.id,
      });

      const aiSummary = "This document is a contract for services.";
      const document = await createDocument({
        firmId: ctx.firmId,
        matterId: matter.id,
        title: "Contract Document",
        aiSummary,
      });

      const [dbDoc] = await db.select().from(documents).where(eq(documents.id, document.id));

      expect(dbDoc.aiSummary).toBe(aiSummary);
    });

    it("persists document metadata to database", async () => {
      const client = await createClient({ firmId: ctx.firmId });
      const matter = await createMatter({
        firmId: ctx.firmId,
        clientId: client.id,
      });

      const document = await createDocument({
        firmId: ctx.firmId,
        matterId: matter.id,
        title: "Persist Test",
        type: "evidence",
        filename: "evidence.jpg",
        mimeType: "image/jpeg",
        fileSize: 4096,
      });

      const [dbDoc] = await db.select().from(documents).where(eq(documents.id, document.id));

      expect(dbDoc).toBeDefined();
      expect(dbDoc.title).toBe("Persist Test");
      expect(dbDoc.type).toBe("evidence");
      expect(dbDoc.filename).toBe("evidence.jpg");
      expect(dbDoc.mimeType).toBe("image/jpeg");
      expect(dbDoc.fileSize).toBe(4096);
    });
  });

  describe("Read", () => {
    it("retrieves document by ID", async () => {
      const client = await createClient({ firmId: ctx.firmId });
      const matter = await createMatter({
        firmId: ctx.firmId,
        clientId: client.id,
      });

      const created = await createDocument({
        firmId: ctx.firmId,
        matterId: matter.id,
        title: "Retrieve Test",
      });

      const [retrieved] = await db.select().from(documents).where(eq(documents.id, created.id));

      expect(retrieved).toBeDefined();
      expect(retrieved.id).toBe(created.id);
      expect(retrieved.title).toBe("Retrieve Test");
    });

    it("lists documents for a matter", async () => {
      const client = await createClient({ firmId: ctx.firmId });
      const matter = await createMatter({
        firmId: ctx.firmId,
        clientId: client.id,
      });

      await createDocument({
        firmId: ctx.firmId,
        matterId: matter.id,
        title: "Doc 1",
      });
      await createDocument({
        firmId: ctx.firmId,
        matterId: matter.id,
        title: "Doc 2",
      });
      await createDocument({
        firmId: ctx.firmId,
        matterId: matter.id,
        title: "Doc 3",
      });

      const matterDocs = await db
        .select()
        .from(documents)
        .where(and(eq(documents.firmId, ctx.firmId), eq(documents.matterId, matter.id)));

      expect(matterDocs.length).toBe(3);
    });

    it("lists documents for entire firm", async () => {
      const client1 = await createClient({ firmId: ctx.firmId });
      const matter1 = await createMatter({
        firmId: ctx.firmId,
        clientId: client1.id,
      });

      const client2 = await createClient({ firmId: ctx.firmId });
      const matter2 = await createMatter({
        firmId: ctx.firmId,
        clientId: client2.id,
      });

      await createDocument({
        firmId: ctx.firmId,
        matterId: matter1.id,
        title: "Firm Doc 1",
      });
      await createDocument({
        firmId: ctx.firmId,
        matterId: matter2.id,
        title: "Firm Doc 2",
      });

      const firmDocs = await db.select().from(documents).where(eq(documents.firmId, ctx.firmId));

      expect(firmDocs.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("Update", () => {
    it("updates document metadata", async () => {
      const client = await createClient({ firmId: ctx.firmId });
      const matter = await createMatter({
        firmId: ctx.firmId,
        clientId: client.id,
      });

      const document = await createDocument({
        firmId: ctx.firmId,
        matterId: matter.id,
        title: "Original Title",
      });

      await db
        .update(documents)
        .set({
          title: "Updated Title",
          status: "approved",
          updatedAt: new Date(),
        })
        .where(eq(documents.id, document.id));

      const [updated] = await db.select().from(documents).where(eq(documents.id, document.id));

      expect(updated.title).toBe("Updated Title");
      expect(updated.status).toBe("approved");
    });

    it("updates document status", async () => {
      const client = await createClient({ firmId: ctx.firmId });
      const matter = await createMatter({
        firmId: ctx.firmId,
        clientId: client.id,
      });

      const document = await createDocument({
        firmId: ctx.firmId,
        matterId: matter.id,
        status: "draft",
      });

      expect(document.status).toBe("draft");

      await db
        .update(documents)
        .set({ status: "sent", updatedAt: new Date() })
        .where(eq(documents.id, document.id));

      const [updated] = await db.select().from(documents).where(eq(documents.id, document.id));

      expect(updated.status).toBe("sent");
    });

    it("updates extracted text and AI summary", async () => {
      const client = await createClient({ firmId: ctx.firmId });
      const matter = await createMatter({
        firmId: ctx.firmId,
        clientId: client.id,
      });

      const document = await createDocument({
        firmId: ctx.firmId,
        matterId: matter.id,
      });

      const newExtractedText = "Updated extracted text content";
      const newSummary = "Updated AI summary";

      await db
        .update(documents)
        .set({
          extractedText: newExtractedText,
          aiSummary: newSummary,
          updatedAt: new Date(),
        })
        .where(eq(documents.id, document.id));

      const [updated] = await db.select().from(documents).where(eq(documents.id, document.id));

      expect(updated.extractedText).toBe(newExtractedText);
      expect(updated.aiSummary).toBe(newSummary);
    });
  });

  describe("Delete (Soft)", () => {
    it("archives document by setting status to archived", async () => {
      const client = await createClient({ firmId: ctx.firmId });
      const matter = await createMatter({
        firmId: ctx.firmId,
        clientId: client.id,
      });

      const document = await createDocument({
        firmId: ctx.firmId,
        matterId: matter.id,
        status: "approved",
      });

      await db
        .update(documents)
        .set({ status: "archived", updatedAt: new Date() })
        .where(eq(documents.id, document.id));

      const [archived] = await db.select().from(documents).where(eq(documents.id, document.id));

      expect(archived.status).toBe("archived");
    });

    it("hard deletes document from database", async () => {
      const client = await createClient({ firmId: ctx.firmId });
      const matter = await createMatter({
        firmId: ctx.firmId,
        clientId: client.id,
      });

      const document = await createDocument({
        firmId: ctx.firmId,
        matterId: matter.id,
      });

      await db.delete(documents).where(eq(documents.id, document.id));

      const result = await db.select().from(documents).where(eq(documents.id, document.id));

      expect(result.length).toBe(0);
    });
  });
});

describe("Documents Integration - Filter & Search", () => {
  const ctx = setupIntegrationSuite();

  it("filters documents by type", async () => {
    const client = await createClient({ firmId: ctx.firmId });
    const matter = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
    });

    await createDocument({
      firmId: ctx.firmId,
      matterId: matter.id,
      type: "contract",
    });
    await createDocument({
      firmId: ctx.firmId,
      matterId: matter.id,
      type: "contract",
    });
    await createDocument({
      firmId: ctx.firmId,
      matterId: matter.id,
      type: "evidence",
    });

    const contracts = await db
      .select()
      .from(documents)
      .where(
        and(
          eq(documents.firmId, ctx.firmId),
          eq(documents.matterId, matter.id),
          eq(documents.type, "contract")
        )
      );

    const evidence = await db
      .select()
      .from(documents)
      .where(
        and(
          eq(documents.firmId, ctx.firmId),
          eq(documents.matterId, matter.id),
          eq(documents.type, "evidence")
        )
      );

    expect(contracts.length).toBe(2);
    expect(evidence.length).toBe(1);
  });

  it("filters documents by date range", async () => {
    const client = await createClient({ firmId: ctx.firmId });
    const matter = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
    });

    const startDate = new Date("2024-01-01");
    const midDate = new Date("2024-06-01");
    const endDate = new Date("2024-12-31");

    await createDocument({
      firmId: ctx.firmId,
      matterId: matter.id,
      title: "Early Doc",
    });

    // Update created date manually for testing
    const [earlyDoc] = await db
      .select()
      .from(documents)
      .where(eq(documents.title, "Early Doc"))
      .limit(1);

    await db.update(documents).set({ createdAt: startDate }).where(eq(documents.id, earlyDoc.id));

    await createDocument({
      firmId: ctx.firmId,
      matterId: matter.id,
      title: "Mid Doc",
    });

    const [midDoc] = await db
      .select()
      .from(documents)
      .where(eq(documents.title, "Mid Doc"))
      .limit(1);

    await db.update(documents).set({ createdAt: midDate }).where(eq(documents.id, midDoc.id));

    const dateFilteredDocs = await db
      .select()
      .from(documents)
      .where(
        and(
          eq(documents.firmId, ctx.firmId),
          eq(documents.matterId, matter.id),
          gte(documents.createdAt, startDate),
          lte(documents.createdAt, midDate)
        )
      );

    expect(dateFilteredDocs.length).toBeGreaterThanOrEqual(2);
    expect(dateFilteredDocs.some((d) => d.title === "Early Doc")).toBe(true);
    expect(dateFilteredDocs.some((d) => d.title === "Mid Doc")).toBe(true);
  });

  it("filters documents by status", async () => {
    const client = await createClient({ firmId: ctx.firmId });
    const matter = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
    });

    await createDocument({
      firmId: ctx.firmId,
      matterId: matter.id,
      status: "draft",
    });
    await createDocument({
      firmId: ctx.firmId,
      matterId: matter.id,
      status: "approved",
    });
    await createDocument({
      firmId: ctx.firmId,
      matterId: matter.id,
      status: "approved",
    });

    const drafts = await db
      .select()
      .from(documents)
      .where(
        and(
          eq(documents.firmId, ctx.firmId),
          eq(documents.matterId, matter.id),
          eq(documents.status, "draft")
        )
      );

    const approved = await db
      .select()
      .from(documents)
      .where(
        and(
          eq(documents.firmId, ctx.firmId),
          eq(documents.matterId, matter.id),
          eq(documents.status, "approved")
        )
      );

    expect(drafts.length).toBe(1);
    expect(approved.length).toBe(2);
  });
});

describe("Documents Integration - Document Processing", () => {
  const ctx = setupIntegrationSuite();

  describe("Chunking", () => {
    it("chunks document for vector search", async () => {
      const client = await createClient({ firmId: ctx.firmId });
      const matter = await createMatter({
        firmId: ctx.firmId,
        clientId: client.id,
      });

      const longText = "This is a test document. ".repeat(50);
      const document = await createDocument({
        firmId: ctx.firmId,
        matterId: matter.id,
        title: "Chunkable Document",
        extractedText: longText,
      });

      // Simulate chunking by creating document chunks
      await db.insert(documentChunks).values([
        {
          firmId: ctx.firmId,
          documentId: document.id,
          matterId: matter.id,
          chunkIndex: 0,
          text: longText.substring(0, 500),
        },
        {
          firmId: ctx.firmId,
          documentId: document.id,
          matterId: matter.id,
          chunkIndex: 1,
          text: longText.substring(500, 1000),
        },
      ]);

      // Update document to reflect chunking
      await db
        .update(documents)
        .set({
          chunkedAt: new Date(),
          chunkCount: 2,
        })
        .where(eq(documents.id, document.id));

      const chunks = await db
        .select()
        .from(documentChunks)
        .where(eq(documentChunks.documentId, document.id))
        .orderBy(documentChunks.chunkIndex);

      expect(chunks.length).toBe(2);
      expect(chunks[0].chunkIndex).toBe(0);
      expect(chunks[1].chunkIndex).toBe(1);

      const [updatedDoc] = await db.select().from(documents).where(eq(documents.id, document.id));

      expect(updatedDoc.chunkedAt).not.toBeNull();
      expect(updatedDoc.chunkCount).toBe(2);
    });

    it("retrieves document chunks", async () => {
      const client = await createClient({ firmId: ctx.firmId });
      const matter = await createMatter({
        firmId: ctx.firmId,
        clientId: client.id,
      });

      const document = await createDocument({
        firmId: ctx.firmId,
        matterId: matter.id,
        extractedText: "Test content for chunking",
      });

      await db.insert(documentChunks).values([
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
        {
          firmId: ctx.firmId,
          documentId: document.id,
          matterId: matter.id,
          chunkIndex: 2,
          text: "Third chunk",
        },
      ]);

      const chunks = await db
        .select()
        .from(documentChunks)
        .where(
          and(eq(documentChunks.documentId, document.id), eq(documentChunks.firmId, ctx.firmId))
        )
        .orderBy(documentChunks.chunkIndex);

      expect(chunks.length).toBe(3);
      expect(chunks[0].text).toBe("First chunk");
      expect(chunks[1].text).toBe("Second chunk");
      expect(chunks[2].text).toBe("Third chunk");
    });

    it("stores chunk metadata (page numbers, character positions)", async () => {
      const client = await createClient({ firmId: ctx.firmId });
      const matter = await createMatter({
        firmId: ctx.firmId,
        clientId: client.id,
      });

      const document = await createDocument({
        firmId: ctx.firmId,
        matterId: matter.id,
        extractedText: "Test content",
      });

      await db.insert(documentChunks).values({
        firmId: ctx.firmId,
        documentId: document.id,
        matterId: matter.id,
        chunkIndex: 0,
        text: "Chunk with metadata",
        pageStart: 1,
        pageEnd: 2,
        charStart: 0,
        charEnd: 500,
      });

      const [chunk] = await db
        .select()
        .from(documentChunks)
        .where(eq(documentChunks.documentId, document.id));

      expect(chunk.pageStart).toBe(1);
      expect(chunk.pageEnd).toBe(2);
      expect(chunk.charStart).toBe(0);
      expect(chunk.charEnd).toBe(500);
    });
  });

  describe("Entity Extraction", () => {
    it("extracts and stores entities from document text", async () => {
      const client = await createClient({ firmId: ctx.firmId });
      const matter = await createMatter({
        firmId: ctx.firmId,
        clientId: client.id,
      });

      const extractedText = `
        Contract dated 15th January 2024 between Acme Ltd and John Smith.
        Amount: £50,000. Address: 123 High Street, London, EC1A 1BB.
      `;

      const document = await createDocument({
        firmId: ctx.firmId,
        matterId: matter.id,
        title: "Contract with Entities",
        extractedText,
      });

      // Store extracted entities as metadata
      await db
        .update(documents)
        .set({
          metadata: {
            entities: {
              dates: ["15th January 2024"],
              parties: ["Acme Ltd", "John Smith"],
              amounts: ["£50,000"],
              addresses: ["123 High Street, London, EC1A 1BB"],
            },
          },
        })
        .where(eq(documents.id, document.id));

      const [updated] = await db.select().from(documents).where(eq(documents.id, document.id));

      expect(updated.metadata).toHaveProperty("entities");
      const entities = (updated.metadata as any).entities;
      expect(entities.dates).toContain("15th January 2024");
      expect(entities.parties).toContain("Acme Ltd");
      expect(entities.amounts).toContain("£50,000");
      expect(entities.addresses).toContain("123 High Street, London, EC1A 1BB");
    });
  });
});

describe("Documents Integration - Multi-Tenancy", () => {
  const ctx = setupFreshFirmPerTest();

  it("isolates documents between firms", async () => {
    const client1 = await createClient({ firmId: ctx.firmId });
    const matter1 = await createMatter({
      firmId: ctx.firmId,
      clientId: client1.id,
    });

    const doc1 = await createDocument({
      firmId: ctx.firmId,
      matterId: matter1.id,
      title: "Firm 1 Document",
    });

    // Create second firm
    const firm2 = await createFirm({ name: "Second Test Firm" });
    const client2 = await createClient({ firmId: firm2.id });
    const matter2 = await createMatter({
      firmId: firm2.id,
      clientId: client2.id,
    });

    const doc2 = await createDocument({
      firmId: firm2.id,
      matterId: matter2.id,
      title: "Firm 2 Document",
    });

    // Query documents for first firm
    const firm1Docs = await db.select().from(documents).where(eq(documents.firmId, ctx.firmId));

    // Query documents for second firm
    const firm2Docs = await db.select().from(documents).where(eq(documents.firmId, firm2.id));

    // Each firm should only see their own documents
    expect(firm1Docs.some((d) => d.id === doc1.id)).toBe(true);
    expect(firm1Docs.some((d) => d.id === doc2.id)).toBe(false);

    expect(firm2Docs.some((d) => d.id === doc2.id)).toBe(true);
    expect(firm2Docs.some((d) => d.id === doc1.id)).toBe(false);

    // Cleanup second firm
    await db.delete(documentChunks).where(eq(documentChunks.firmId, firm2.id));
    await db.delete(documents).where(eq(documents.firmId, firm2.id));
    await db.delete(matters).where(eq(matters.firmId, firm2.id));
    await db.delete(clients).where(eq(clients.firmId, firm2.id));
    const { firms } = await import("@/lib/db/schema");
    await db.delete(firms).where(eq(firms.id, firm2.id));
  });

  it("prevents accessing documents from another firm by ID", async () => {
    const client1 = await createClient({ firmId: ctx.firmId });
    const matter1 = await createMatter({
      firmId: ctx.firmId,
      clientId: client1.id,
    });

    const doc1 = await createDocument({
      firmId: ctx.firmId,
      matterId: matter1.id,
      title: "Isolated Document",
    });

    // Create second firm
    const firm2 = await createFirm({ name: "Another Test Firm" });

    // Try to query doc1 with firm2's firmId filter (simulating API check)
    const result = await db
      .select()
      .from(documents)
      .where(
        and(
          eq(documents.id, doc1.id),
          eq(documents.firmId, firm2.id) // Wrong firm
        )
      );

    // Should not find the document
    expect(result.length).toBe(0);

    // Cleanup second firm
    const { firms } = await import("@/lib/db/schema");
    await db.delete(firms).where(eq(firms.id, firm2.id));
  });

  it("isolates document chunks between firms", async () => {
    const client1 = await createClient({ firmId: ctx.firmId });
    const matter1 = await createMatter({
      firmId: ctx.firmId,
      clientId: client1.id,
    });

    const doc1 = await createDocument({
      firmId: ctx.firmId,
      matterId: matter1.id,
      extractedText: "Firm 1 document text",
    });

    await db.insert(documentChunks).values({
      firmId: ctx.firmId,
      documentId: doc1.id,
      matterId: matter1.id,
      chunkIndex: 0,
      text: "Firm 1 chunk",
    });

    // Create second firm with document and chunks
    const firm2 = await createFirm({ name: "Chunk Test Firm" });
    const client2 = await createClient({ firmId: firm2.id });
    const matter2 = await createMatter({
      firmId: firm2.id,
      clientId: client2.id,
    });

    const doc2 = await createDocument({
      firmId: firm2.id,
      matterId: matter2.id,
      extractedText: "Firm 2 document text",
    });

    await db.insert(documentChunks).values({
      firmId: firm2.id,
      documentId: doc2.id,
      matterId: matter2.id,
      chunkIndex: 0,
      text: "Firm 2 chunk",
    });

    // Query chunks for each firm
    const firm1Chunks = await db
      .select()
      .from(documentChunks)
      .where(eq(documentChunks.firmId, ctx.firmId));

    const firm2Chunks = await db
      .select()
      .from(documentChunks)
      .where(eq(documentChunks.firmId, firm2.id));

    expect(firm1Chunks.every((c) => c.firmId === ctx.firmId)).toBe(true);
    expect(firm2Chunks.every((c) => c.firmId === firm2.id)).toBe(true);
    expect(firm1Chunks.some((c) => c.text === "Firm 2 chunk")).toBe(false);
    expect(firm2Chunks.some((c) => c.text === "Firm 1 chunk")).toBe(false);

    // Cleanup second firm
    await db.delete(documentChunks).where(eq(documentChunks.firmId, firm2.id));
    await db.delete(documents).where(eq(documents.firmId, firm2.id));
    await db.delete(matters).where(eq(matters.firmId, firm2.id));
    await db.delete(clients).where(eq(clients.firmId, firm2.id));
    const { firms } = await import("@/lib/db/schema");
    await db.delete(firms).where(eq(firms.id, firm2.id));
  });
});

describe("Documents Integration - Data Integrity", () => {
  const ctx = setupIntegrationSuite();

  it("prevents deleting matter when documents exist (foreign key constraint)", async () => {
    const client = await createClient({ firmId: ctx.firmId });
    const matter = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
    });

    const document = await createDocument({
      firmId: ctx.firmId,
      matterId: matter.id,
      title: "Test Constraint",
    });

    // Attempting to delete the matter should fail due to foreign key constraint
    await expect(db.delete(matters).where(eq(matters.id, matter.id))).rejects.toThrow();

    // Document should still exist
    const result = await db.select().from(documents).where(eq(documents.id, document.id));

    expect(result.length).toBe(1);
  });

  it("cascades delete from document to chunks", async () => {
    const client = await createClient({ firmId: ctx.firmId });
    const matter = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
    });

    const document = await createDocument({
      firmId: ctx.firmId,
      matterId: matter.id,
      extractedText: "Test cascade chunks",
    });

    await db.insert(documentChunks).values([
      {
        firmId: ctx.firmId,
        documentId: document.id,
        matterId: matter.id,
        chunkIndex: 0,
        text: "Chunk 1",
      },
      {
        firmId: ctx.firmId,
        documentId: document.id,
        matterId: matter.id,
        chunkIndex: 1,
        text: "Chunk 2",
      },
    ]);

    // Verify chunks exist
    const chunksBeforeDelete = await db
      .select()
      .from(documentChunks)
      .where(eq(documentChunks.documentId, document.id));

    expect(chunksBeforeDelete.length).toBe(2);

    // Delete the document
    await db.delete(documents).where(eq(documents.id, document.id));

    // Chunks should be deleted due to cascade
    const chunksAfterDelete = await db
      .select()
      .from(documentChunks)
      .where(eq(documentChunks.documentId, document.id));

    expect(chunksAfterDelete.length).toBe(0);
  });

  it("enforces unique chunk index per document", async () => {
    const client = await createClient({ firmId: ctx.firmId });
    const matter = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
    });

    const document = await createDocument({
      firmId: ctx.firmId,
      matterId: matter.id,
      extractedText: "Test unique index",
    });

    await db.insert(documentChunks).values({
      firmId: ctx.firmId,
      documentId: document.id,
      matterId: matter.id,
      chunkIndex: 0,
      text: "First chunk",
    });

    // Attempt to insert duplicate chunk index should fail
    await expect(
      db.insert(documentChunks).values({
        firmId: ctx.firmId,
        documentId: document.id,
        matterId: matter.id,
        chunkIndex: 0,
        text: "Duplicate chunk",
      })
    ).rejects.toThrow();
  });
});
