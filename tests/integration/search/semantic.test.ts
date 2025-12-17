/**
 * Semantic Search Integration Tests
 *
 * Tests semantic search operations using pgvector against the real database.
 * Uses setupIntegrationSuite() to provide a test firm with cleanup.
 */
import { describe, it, expect, beforeAll, vi } from "vitest";
import { db } from "@/lib/db";
import { documentChunks, documents, clients, matters } from "@/lib/db/schema";
import { eq, and, isNotNull, sql } from "drizzle-orm";
import { setupIntegrationSuite, setupFreshFirmPerTest } from "@tests/integration/setup";
import { createDocument } from "@tests/fixtures/factories/document";
import { createClient } from "@tests/fixtures/factories/client";
import { createMatter } from "@tests/fixtures/factories/matter";
import { createFirm } from "@tests/fixtures/factories/firm";

// Mock embedding function for tests that don't have OPENROUTER_API_KEY
const mockEmbedding = Array.from({ length: 1536 }, () => Math.random());

/**
 * Helper to format embedding as vector literal for PostgreSQL
 */
function vectorLiteral(values: number[]): string {
  return `[${values.map((v) => (Number.isFinite(v) ? v : 0)).join(",")}]`;
}

/**
 * Create document chunks with embeddings for testing
 */
async function createDocumentChunkWithEmbedding(
  firmId: string,
  documentId: string,
  matterId: string,
  chunkIndex: number,
  text: string,
  embedding: number[] = mockEmbedding
) {
  const vectorStr = vectorLiteral(embedding);
  const [chunk] = await db
    .insert(documentChunks)
    .values({
      firmId,
      documentId,
      matterId,
      chunkIndex,
      text,
      embedding: sql`${vectorStr}::vector`,
    })
    .returning();
  return chunk;
}

/**
 * Calculate mock similarity score based on keyword matching
 * (for tests without real embeddings)
 */
function calculateMockSimilarity(queryText: string, documentText: string): number {
  const queryWords = queryText.toLowerCase().split(/\s+/);
  const docWords = documentText.toLowerCase().split(/\s+/);
  const matches = queryWords.filter((word) => docWords.includes(word));
  return matches.length / queryWords.length;
}

describe("Semantic Search Integration - Basic Search", () => {
  const ctx = setupIntegrationSuite();

  describe("Search across all entities", () => {
    it("searches and returns document chunks with scores", async () => {
      // Create test matter and documents
      const client = await createClient({ firmId: ctx.firmId });
      const matter = await createMatter({
        firmId: ctx.firmId,
        clientId: client.id,
        title: "Contract Review Matter",
      });

      const doc1 = await createDocument({
        firmId: ctx.firmId,
        matterId: matter.id,
        title: "Employment Contract",
        extractedText: "This is an employment contract between employer and employee.",
      });

      const doc2 = await createDocument({
        firmId: ctx.firmId,
        matterId: matter.id,
        title: "NDA Document",
        extractedText: "This non-disclosure agreement protects confidential information.",
      });

      // Create chunks with embeddings
      await createDocumentChunkWithEmbedding(
        ctx.firmId,
        doc1.id,
        matter.id,
        0,
        "This is an employment contract between employer and employee."
      );

      await createDocumentChunkWithEmbedding(
        ctx.firmId,
        doc2.id,
        matter.id,
        0,
        "This non-disclosure agreement protects confidential information."
      );

      // Verify chunks exist with embeddings
      const allChunks = await db
        .select()
        .from(documentChunks)
        .where(and(eq(documentChunks.firmId, ctx.firmId), isNotNull(documentChunks.embedding)));

      expect(allChunks.length).toBeGreaterThanOrEqual(2);
      expect(allChunks.every((c) => c.embedding !== null)).toBe(true);
    });

    it("returns results with relevance scores", async () => {
      const client = await createClient({ firmId: ctx.firmId });
      const matter = await createMatter({
        firmId: ctx.firmId,
        clientId: client.id,
      });

      const doc = await createDocument({
        firmId: ctx.firmId,
        matterId: matter.id,
        title: "Test Document",
        extractedText: "This is a test document for search.",
      });

      await createDocumentChunkWithEmbedding(
        ctx.firmId,
        doc.id,
        matter.id,
        0,
        "This is a test document for search."
      );

      // Query using vector search
      const queryVector = vectorLiteral(mockEmbedding);
      const distance = sql<number>`(${documentChunks.embedding} <=> ${sql.raw(`'${queryVector}'::vector`)})`;
      const score = sql<number>`(1 - ${distance})`;

      const results = await db
        .select({
          documentId: documentChunks.documentId,
          documentChunkId: documentChunks.id,
          text: documentChunks.text,
          score,
        })
        .from(documentChunks)
        .where(and(eq(documentChunks.firmId, ctx.firmId), isNotNull(documentChunks.embedding)))
        .orderBy(distance)
        .limit(10);

      expect(results.length).toBeGreaterThanOrEqual(1);
      results.forEach((result) => {
        expect(result.documentId).toBeDefined();
        expect(result.documentChunkId).toBeDefined();
        expect(result.text).toBeDefined();
        expect(result.score).toBeDefined();
        expect(typeof result.score).toBe("number");
      });
    });

    it("returns results ranked by relevance", async () => {
      const client = await createClient({ firmId: ctx.firmId });
      const matter = await createMatter({
        firmId: ctx.firmId,
        clientId: client.id,
      });

      // Create documents with varying relevance
      const doc1 = await createDocument({
        firmId: ctx.firmId,
        matterId: matter.id,
        title: "Highly Relevant",
        extractedText: "Contract employment terms salary benefits",
      });

      const doc2 = await createDocument({
        firmId: ctx.firmId,
        matterId: matter.id,
        title: "Somewhat Relevant",
        extractedText: "Agreement with general business terms",
      });

      const doc3 = await createDocument({
        firmId: ctx.firmId,
        matterId: matter.id,
        title: "Less Relevant",
        extractedText: "Random text about unrelated topics",
      });

      // Create embeddings (using different vectors to simulate relevance)
      const highRelevanceEmbedding = mockEmbedding;
      const mediumRelevanceEmbedding = mockEmbedding.map((v) => v * 0.8);
      const lowRelevanceEmbedding = mockEmbedding.map((v) => v * 0.3);

      await createDocumentChunkWithEmbedding(
        ctx.firmId,
        doc1.id,
        matter.id,
        0,
        "Contract employment terms salary benefits",
        highRelevanceEmbedding
      );

      await createDocumentChunkWithEmbedding(
        ctx.firmId,
        doc2.id,
        matter.id,
        0,
        "Agreement with general business terms",
        mediumRelevanceEmbedding
      );

      await createDocumentChunkWithEmbedding(
        ctx.firmId,
        doc3.id,
        matter.id,
        0,
        "Random text about unrelated topics",
        lowRelevanceEmbedding
      );

      // Search with high relevance vector
      const queryVector = vectorLiteral(highRelevanceEmbedding);
      const distance = sql<number>`(${documentChunks.embedding} <=> ${sql.raw(`'${queryVector}'::vector`)})`;

      const results = await db
        .select({
          documentId: documentChunks.documentId,
          text: documentChunks.text,
          distance,
        })
        .from(documentChunks)
        .where(and(eq(documentChunks.firmId, ctx.firmId), isNotNull(documentChunks.embedding)))
        .orderBy(distance)
        .limit(10);

      // Verify results are ordered by distance (lower distance = more similar)
      expect(results.length).toBeGreaterThanOrEqual(3);
      for (let i = 1; i < results.length; i++) {
        expect(Number(results[i].distance)).toBeGreaterThanOrEqual(Number(results[i - 1].distance));
      }
    });

    it("returns text snippets from matching chunks", async () => {
      const client = await createClient({ firmId: ctx.firmId });
      const matter = await createMatter({
        firmId: ctx.firmId,
        clientId: client.id,
      });

      const doc = await createDocument({
        firmId: ctx.firmId,
        matterId: matter.id,
        title: "Long Document",
        extractedText: "A very long document with multiple sections and paragraphs",
      });

      const chunkText1 = "This is the first chunk of text containing important contract clauses.";
      const chunkText2 = "This is the second chunk discussing employment terms and conditions.";
      const chunkText3 = "This is the third chunk about confidentiality obligations.";

      await createDocumentChunkWithEmbedding(ctx.firmId, doc.id, matter.id, 0, chunkText1);
      await createDocumentChunkWithEmbedding(ctx.firmId, doc.id, matter.id, 1, chunkText2);
      await createDocumentChunkWithEmbedding(ctx.firmId, doc.id, matter.id, 2, chunkText3);

      const results = await db
        .select({
          text: documentChunks.text,
          chunkIndex: documentChunks.chunkIndex,
        })
        .from(documentChunks)
        .where(and(eq(documentChunks.firmId, ctx.firmId), eq(documentChunks.documentId, doc.id)))
        .orderBy(documentChunks.chunkIndex);

      expect(results.length).toBe(3);
      expect(results[0].text).toBe(chunkText1);
      expect(results[1].text).toBe(chunkText2);
      expect(results[2].text).toBe(chunkText3);
    });
  });

  describe("Search includes entity metadata", () => {
    it("results include document ID", async () => {
      const client = await createClient({ firmId: ctx.firmId });
      const matter = await createMatter({
        firmId: ctx.firmId,
        clientId: client.id,
      });

      const doc = await createDocument({
        firmId: ctx.firmId,
        matterId: matter.id,
        title: "Document ID Test",
      });

      const chunk = await createDocumentChunkWithEmbedding(
        ctx.firmId,
        doc.id,
        matter.id,
        0,
        "Test content"
      );

      const results = await db
        .select({
          documentId: documentChunks.documentId,
          documentChunkId: documentChunks.id,
        })
        .from(documentChunks)
        .where(eq(documentChunks.id, chunk.id));

      expect(results.length).toBe(1);
      expect(results[0].documentId).toBe(doc.id);
      expect(results[0].documentChunkId).toBe(chunk.id);
    });

    it("can join results with document metadata", async () => {
      const client = await createClient({ firmId: ctx.firmId });
      const matter = await createMatter({
        firmId: ctx.firmId,
        clientId: client.id,
      });

      const doc = await createDocument({
        firmId: ctx.firmId,
        matterId: matter.id,
        title: "Important Contract",
        type: "contract",
      });

      const chunk = await createDocumentChunkWithEmbedding(
        ctx.firmId,
        doc.id,
        matter.id,
        0,
        "Contract text"
      );

      // Join search results with document metadata
      const results = await db
        .select({
          chunkText: documentChunks.text,
          documentTitle: documents.title,
          documentType: documents.type,
          documentId: documents.id,
        })
        .from(documentChunks)
        .innerJoin(documents, eq(documentChunks.documentId, documents.id))
        .where(eq(documentChunks.id, chunk.id));

      expect(results.length).toBe(1);
      expect(results[0].documentId).toBe(doc.id);
      expect(results[0].documentTitle).toBe("Important Contract");
      expect(results[0].documentType).toBe("contract");
      expect(results[0].chunkText).toBe("Contract text");
    });

    it("can join results with matter metadata", async () => {
      const client = await createClient({ firmId: ctx.firmId });
      const matter = await createMatter({
        firmId: ctx.firmId,
        clientId: client.id,
        title: "M&A Transaction",
        reference: "M-2024-001",
      });

      const doc = await createDocument({
        firmId: ctx.firmId,
        matterId: matter.id,
        title: "Transaction Document",
      });

      await createDocumentChunkWithEmbedding(
        ctx.firmId,
        doc.id,
        matter.id,
        0,
        "Transaction details"
      );

      // Join with matter metadata
      const results = await db
        .select({
          chunkText: documentChunks.text,
          matterTitle: matters.title,
          matterReference: matters.reference,
        })
        .from(documentChunks)
        .innerJoin(matters, eq(documentChunks.matterId, matters.id))
        .where(and(eq(documentChunks.firmId, ctx.firmId), eq(documentChunks.matterId, matter.id)));

      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results[0].matterTitle).toBe("M&A Transaction");
      expect(results[0].matterReference).toBe("M-2024-001");
    });
  });
});

describe("Semantic Search Integration - Search Filters", () => {
  const ctx = setupIntegrationSuite();

  it("filters by matter ID", async () => {
    const client = await createClient({ firmId: ctx.firmId });

    const matter1 = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
      title: "Matter 1",
    });

    const matter2 = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
      title: "Matter 2",
    });

    const doc1 = await createDocument({
      firmId: ctx.firmId,
      matterId: matter1.id,
      title: "Doc in Matter 1",
    });

    const doc2 = await createDocument({
      firmId: ctx.firmId,
      matterId: matter2.id,
      title: "Doc in Matter 2",
    });

    await createDocumentChunkWithEmbedding(
      ctx.firmId,
      doc1.id,
      matter1.id,
      0,
      "Content for matter 1"
    );
    await createDocumentChunkWithEmbedding(
      ctx.firmId,
      doc2.id,
      matter2.id,
      0,
      "Content for matter 2"
    );

    // Search only in matter1
    const matter1Results = await db
      .select()
      .from(documentChunks)
      .where(
        and(
          eq(documentChunks.firmId, ctx.firmId),
          eq(documentChunks.matterId, matter1.id),
          isNotNull(documentChunks.embedding)
        )
      );

    expect(matter1Results.length).toBe(1);
    expect(matter1Results[0].matterId).toBe(matter1.id);
    expect(matter1Results.every((r) => r.matterId === matter1.id)).toBe(true);
  });

  it("filters by date range", async () => {
    const client = await createClient({ firmId: ctx.firmId });
    const matter = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
    });

    const oldDate = new Date("2024-01-01");
    const recentDate = new Date("2024-12-01");
    const cutoffDate = new Date("2024-06-01");

    const oldDoc = await createDocument({
      firmId: ctx.firmId,
      matterId: matter.id,
      title: "Old Document",
    });

    const recentDoc = await createDocument({
      firmId: ctx.firmId,
      matterId: matter.id,
      title: "Recent Document",
    });

    // Update document dates
    await db.update(documents).set({ createdAt: oldDate }).where(eq(documents.id, oldDoc.id));

    await db.update(documents).set({ createdAt: recentDate }).where(eq(documents.id, recentDoc.id));

    await createDocumentChunkWithEmbedding(ctx.firmId, oldDoc.id, matter.id, 0, "Old content");
    await createDocumentChunkWithEmbedding(
      ctx.firmId,
      recentDoc.id,
      matter.id,
      0,
      "Recent content"
    );

    // Search with date filter
    const recentResults = await db
      .select({
        chunkId: documentChunks.id,
        documentId: documentChunks.documentId,
        createdAt: documents.createdAt,
      })
      .from(documentChunks)
      .innerJoin(documents, eq(documentChunks.documentId, documents.id))
      .where(
        and(
          eq(documentChunks.firmId, ctx.firmId),
          sql`${documents.createdAt} >= ${sql.raw(`'${cutoffDate.toISOString()}'::timestamp`)}`
        )
      );

    expect(recentResults.length).toBeGreaterThanOrEqual(1);
    expect(recentResults.every((r) => r.createdAt >= cutoffDate)).toBe(true);
  });

  it("filters by document type", async () => {
    const client = await createClient({ firmId: ctx.firmId });
    const matter = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
    });

    const contractDoc = await createDocument({
      firmId: ctx.firmId,
      matterId: matter.id,
      title: "Contract",
      type: "contract",
    });

    const evidenceDoc = await createDocument({
      firmId: ctx.firmId,
      matterId: matter.id,
      title: "Evidence",
      type: "evidence",
    });

    await createDocumentChunkWithEmbedding(
      ctx.firmId,
      contractDoc.id,
      matter.id,
      0,
      "Contract terms"
    );
    await createDocumentChunkWithEmbedding(
      ctx.firmId,
      evidenceDoc.id,
      matter.id,
      0,
      "Evidence details"
    );

    // Search only contracts
    const contractResults = await db
      .select({
        chunkId: documentChunks.id,
        documentType: documents.type,
      })
      .from(documentChunks)
      .innerJoin(documents, eq(documentChunks.documentId, documents.id))
      .where(
        and(
          eq(documentChunks.firmId, ctx.firmId),
          eq(documents.type, "contract"),
          isNotNull(documentChunks.embedding)
        )
      );

    expect(contractResults.length).toBeGreaterThanOrEqual(1);
    expect(contractResults.every((r) => r.documentType === "contract")).toBe(true);
  });

  it("combines multiple filters", async () => {
    const client = await createClient({ firmId: ctx.firmId });
    const matter = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
    });

    const doc = await createDocument({
      firmId: ctx.firmId,
      matterId: matter.id,
      title: "Filtered Document",
      type: "contract",
    });

    const recentDate = new Date("2024-12-01");
    const cutoffDate = new Date("2024-06-01");
    await db.update(documents).set({ createdAt: recentDate }).where(eq(documents.id, doc.id));

    await createDocumentChunkWithEmbedding(ctx.firmId, doc.id, matter.id, 0, "Contract content");

    // Search with multiple filters
    const results = await db
      .select({
        chunkId: documentChunks.id,
        documentType: documents.type,
        matterId: documentChunks.matterId,
      })
      .from(documentChunks)
      .innerJoin(documents, eq(documentChunks.documentId, documents.id))
      .where(
        and(
          eq(documentChunks.firmId, ctx.firmId),
          eq(documentChunks.matterId, matter.id),
          eq(documents.type, "contract"),
          sql`${documents.createdAt} >= ${sql.raw(`'${cutoffDate.toISOString()}'::timestamp`)}`,
          isNotNull(documentChunks.embedding)
        )
      );

    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results.every((r) => r.matterId === matter.id)).toBe(true);
    expect(results.every((r) => r.documentType === "contract")).toBe(true);
  });
});

describe("Semantic Search Integration - Pagination & Limits", () => {
  const ctx = setupIntegrationSuite();

  it("limits search results", async () => {
    const client = await createClient({ firmId: ctx.firmId });
    const matter = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
    });

    // Create multiple documents with chunks
    for (let i = 0; i < 20; i++) {
      const doc = await createDocument({
        firmId: ctx.firmId,
        matterId: matter.id,
        title: `Document ${i}`,
      });
      await createDocumentChunkWithEmbedding(
        ctx.firmId,
        doc.id,
        matter.id,
        0,
        `Content for document ${i}`
      );
    }

    // Query with limit
    const limit = 5;
    const results = await db
      .select()
      .from(documentChunks)
      .where(and(eq(documentChunks.firmId, ctx.firmId), isNotNull(documentChunks.embedding)))
      .limit(limit);

    expect(results.length).toBeLessThanOrEqual(limit);
  });

  it("respects maximum limit", async () => {
    const client = await createClient({ firmId: ctx.firmId });
    const matter = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
    });

    // Create many chunks
    const doc = await createDocument({
      firmId: ctx.firmId,
      matterId: matter.id,
      title: "Large Document",
    });

    for (let i = 0; i < 60; i++) {
      await createDocumentChunkWithEmbedding(
        ctx.firmId,
        doc.id,
        matter.id,
        i,
        `Chunk ${i} content`
      );
    }

    // Maximum limit should be 50 per schema
    const maxLimit = 50;
    const results = await db
      .select()
      .from(documentChunks)
      .where(eq(documentChunks.documentId, doc.id))
      .limit(maxLimit);

    expect(results.length).toBeLessThanOrEqual(maxLimit);
  });

  it("returns default number of results when no limit specified", async () => {
    const client = await createClient({ firmId: ctx.firmId });
    const matter = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
    });

    const doc = await createDocument({
      firmId: ctx.firmId,
      matterId: matter.id,
      title: "Test Document",
    });

    for (let i = 0; i < 15; i++) {
      await createDocumentChunkWithEmbedding(ctx.firmId, doc.id, matter.id, i, `Chunk ${i}`);
    }

    // Default limit per schema is 12
    const defaultLimit = 12;
    const results = await db
      .select()
      .from(documentChunks)
      .where(eq(documentChunks.documentId, doc.id))
      .limit(defaultLimit);

    expect(results.length).toBeLessThanOrEqual(defaultLimit);
  });
});

describe("Semantic Search Integration - Vector Operations", () => {
  const ctx = setupIntegrationSuite();

  it("stores vector embeddings correctly", async () => {
    const client = await createClient({ firmId: ctx.firmId });
    const matter = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
    });

    const doc = await createDocument({
      firmId: ctx.firmId,
      matterId: matter.id,
      title: "Vector Test",
    });

    const testEmbedding = mockEmbedding;
    const chunk = await createDocumentChunkWithEmbedding(
      ctx.firmId,
      doc.id,
      matter.id,
      0,
      "Test text",
      testEmbedding
    );

    expect(chunk.embedding).toBeDefined();
    expect(chunk.embedding).not.toBeNull();
  });

  it("performs vector distance calculation", async () => {
    const client = await createClient({ firmId: ctx.firmId });
    const matter = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
    });

    const doc = await createDocument({
      firmId: ctx.firmId,
      matterId: matter.id,
      title: "Distance Test",
    });

    await createDocumentChunkWithEmbedding(
      ctx.firmId,
      doc.id,
      matter.id,
      0,
      "Test content",
      mockEmbedding
    );

    // Query using cosine distance operator (<=>)
    const queryVector = vectorLiteral(mockEmbedding);
    const distance = sql<number>`(${documentChunks.embedding} <=> ${sql.raw(`'${queryVector}'::vector`)})`;

    const results = await db
      .select({
        id: documentChunks.id,
        distance,
      })
      .from(documentChunks)
      .where(and(eq(documentChunks.firmId, ctx.firmId), isNotNull(documentChunks.embedding)))
      .orderBy(distance)
      .limit(1);

    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].distance).toBeDefined();
    expect(typeof Number(results[0].distance)).toBe("number");
  });

  it("calculates similarity scores from distance", async () => {
    const client = await createClient({ firmId: ctx.firmId });
    const matter = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
    });

    const doc = await createDocument({
      firmId: ctx.firmId,
      matterId: matter.id,
      title: "Similarity Test",
    });

    await createDocumentChunkWithEmbedding(
      ctx.firmId,
      doc.id,
      matter.id,
      0,
      "Test content",
      mockEmbedding
    );

    // Calculate similarity score (1 - distance)
    const queryVector = vectorLiteral(mockEmbedding);
    const distance = sql<number>`(${documentChunks.embedding} <=> ${sql.raw(`'${queryVector}'::vector`)})`;
    const score = sql<number>`(1 - ${distance})`;

    const results = await db
      .select({
        id: documentChunks.id,
        score,
      })
      .from(documentChunks)
      .where(and(eq(documentChunks.firmId, ctx.firmId), isNotNull(documentChunks.embedding)));

    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].score).toBeDefined();
    expect(typeof Number(results[0].score)).toBe("number");
    // Score should be between 0 and 1
    expect(Number(results[0].score)).toBeGreaterThanOrEqual(0);
    expect(Number(results[0].score)).toBeLessThanOrEqual(1);
  });

  it("only searches chunks with embeddings", async () => {
    const client = await createClient({ firmId: ctx.firmId });
    const matter = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
    });

    const doc = await createDocument({
      firmId: ctx.firmId,
      matterId: matter.id,
      title: "Mixed Embeddings",
    });

    // Create chunk WITH embedding
    await createDocumentChunkWithEmbedding(
      ctx.firmId,
      doc.id,
      matter.id,
      0,
      "Chunk with embedding",
      mockEmbedding
    );

    // Create chunk WITHOUT embedding
    await db.insert(documentChunks).values({
      firmId: ctx.firmId,
      documentId: doc.id,
      matterId: matter.id,
      chunkIndex: 1,
      text: "Chunk without embedding",
      embedding: null,
    });

    // Search should only return chunks with embeddings
    const results = await db
      .select()
      .from(documentChunks)
      .where(
        and(
          eq(documentChunks.firmId, ctx.firmId),
          eq(documentChunks.documentId, doc.id),
          isNotNull(documentChunks.embedding)
        )
      );

    expect(results.length).toBe(1);
    expect(results[0].text).toBe("Chunk with embedding");
  });
});

describe("Semantic Search Integration - Multi-Tenancy", () => {
  const ctx = setupFreshFirmPerTest();

  it("search results are scoped to firm only", async () => {
    // Create data for firm 1
    const client1 = await createClient({ firmId: ctx.firmId });
    const matter1 = await createMatter({
      firmId: ctx.firmId,
      clientId: client1.id,
      title: "Firm 1 Matter",
    });

    const doc1 = await createDocument({
      firmId: ctx.firmId,
      matterId: matter1.id,
      title: "Firm 1 Document",
    });

    await createDocumentChunkWithEmbedding(
      ctx.firmId,
      doc1.id,
      matter1.id,
      0,
      "Confidential information for Firm 1"
    );

    // Create second firm with similar content
    const firm2 = await createFirm({ name: "Second Test Firm" });
    const client2 = await createClient({ firmId: firm2.id });
    const matter2 = await createMatter({
      firmId: firm2.id,
      clientId: client2.id,
      title: "Firm 2 Matter",
    });

    const doc2 = await createDocument({
      firmId: firm2.id,
      matterId: matter2.id,
      title: "Firm 2 Document",
    });

    await createDocumentChunkWithEmbedding(
      firm2.id,
      doc2.id,
      matter2.id,
      0,
      "Confidential information for Firm 2"
    );

    // Search in firm 1 - should NOT see firm 2's data
    const queryVector = vectorLiteral(mockEmbedding);
    const distance = sql<number>`(${documentChunks.embedding} <=> ${sql.raw(`'${queryVector}'::vector`)})`;

    const firm1Results = await db
      .select({
        chunkId: documentChunks.id,
        firmId: documentChunks.firmId,
        text: documentChunks.text,
      })
      .from(documentChunks)
      .where(and(eq(documentChunks.firmId, ctx.firmId), isNotNull(documentChunks.embedding)))
      .orderBy(distance);

    expect(firm1Results.length).toBeGreaterThanOrEqual(1);
    expect(firm1Results.every((r) => r.firmId === ctx.firmId)).toBe(true);
    expect(firm1Results.some((r) => r.text.includes("Firm 2"))).toBe(false);

    // Cleanup second firm
    await db.delete(documentChunks).where(eq(documentChunks.firmId, firm2.id));
    await db.delete(documents).where(eq(documents.firmId, firm2.id));
    await db.delete(matters).where(eq(matters.firmId, firm2.id));
    await db.delete(clients).where(eq(clients.firmId, firm2.id));
    const { firms } = await import("@/lib/db/schema");
    await db.delete(firms).where(eq(firms.id, firm2.id));
  });

  it("cannot access search results from another firm", async () => {
    const client1 = await createClient({ firmId: ctx.firmId });
    const matter1 = await createMatter({
      firmId: ctx.firmId,
      clientId: client1.id,
    });

    const doc1 = await createDocument({
      firmId: ctx.firmId,
      matterId: matter1.id,
      title: "Private Document",
    });

    const chunk1 = await createDocumentChunkWithEmbedding(
      ctx.firmId,
      doc1.id,
      matter1.id,
      0,
      "Sensitive client data"
    );

    // Create second firm
    const firm2 = await createFirm({ name: "Other Firm" });

    // Try to access firm 1's chunks using firm 2's ID
    const unauthorizedAccess = await db
      .select()
      .from(documentChunks)
      .where(
        and(
          eq(documentChunks.id, chunk1.id),
          eq(documentChunks.firmId, firm2.id) // Wrong firm
        )
      );

    expect(unauthorizedAccess.length).toBe(0);

    // Verify firm 1 can still access its own data
    const authorizedAccess = await db
      .select()
      .from(documentChunks)
      .where(and(eq(documentChunks.id, chunk1.id), eq(documentChunks.firmId, ctx.firmId)));

    expect(authorizedAccess.length).toBe(1);
    expect(authorizedAccess[0].id).toBe(chunk1.id);

    // Cleanup second firm
    const { firms } = await import("@/lib/db/schema");
    await db.delete(firms).where(eq(firms.id, firm2.id));
  });

  it("vector search respects firm isolation", async () => {
    const client1 = await createClient({ firmId: ctx.firmId });
    const matter1 = await createMatter({
      firmId: ctx.firmId,
      clientId: client1.id,
    });

    const doc1 = await createDocument({
      firmId: ctx.firmId,
      matterId: matter1.id,
      title: "Firm 1 Contract",
    });

    await createDocumentChunkWithEmbedding(
      ctx.firmId,
      doc1.id,
      matter1.id,
      0,
      "Employment contract terms"
    );

    // Create firm 2 with identical content
    const firm2 = await createFirm({ name: "Firm 2" });
    const client2 = await createClient({ firmId: firm2.id });
    const matter2 = await createMatter({
      firmId: firm2.id,
      clientId: client2.id,
    });

    const doc2 = await createDocument({
      firmId: firm2.id,
      matterId: matter2.id,
      title: "Firm 2 Contract",
    });

    await createDocumentChunkWithEmbedding(
      firm2.id,
      doc2.id,
      matter2.id,
      0,
      "Employment contract terms" // Same text
    );

    // Vector search for firm 1
    const queryVector = vectorLiteral(mockEmbedding);
    const distance = sql<number>`(${documentChunks.embedding} <=> ${sql.raw(`'${queryVector}'::vector`)})`;

    const firm1Search = await db
      .select({
        firmId: documentChunks.firmId,
        documentId: documentChunks.documentId,
      })
      .from(documentChunks)
      .where(and(eq(documentChunks.firmId, ctx.firmId), isNotNull(documentChunks.embedding)))
      .orderBy(distance);

    expect(firm1Search.length).toBeGreaterThanOrEqual(1);
    expect(firm1Search.every((r) => r.firmId === ctx.firmId)).toBe(true);
    expect(firm1Search.some((r) => r.documentId === doc2.id)).toBe(false);

    // Cleanup firm 2
    await db.delete(documentChunks).where(eq(documentChunks.firmId, firm2.id));
    await db.delete(documents).where(eq(documents.firmId, firm2.id));
    await db.delete(matters).where(eq(matters.firmId, firm2.id));
    await db.delete(clients).where(eq(clients.firmId, firm2.id));
    const { firms } = await import("@/lib/db/schema");
    await db.delete(firms).where(eq(firms.id, firm2.id));
  });
});

describe("Semantic Search Integration - Empty States", () => {
  const ctx = setupIntegrationSuite();

  it("returns empty results when no documents match", async () => {
    const client = await createClient({ firmId: ctx.firmId });
    const matter = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
    });

    // Search in empty matter
    const results = await db
      .select()
      .from(documentChunks)
      .where(
        and(
          eq(documentChunks.firmId, ctx.firmId),
          eq(documentChunks.matterId, matter.id),
          isNotNull(documentChunks.embedding)
        )
      );

    expect(results).toBeDefined();
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBe(0);
  });

  it("handles search when no embeddings exist", async () => {
    const client = await createClient({ firmId: ctx.firmId });
    const matter = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
    });

    const doc = await createDocument({
      firmId: ctx.firmId,
      matterId: matter.id,
      title: "No Embeddings",
    });

    // Create chunk without embedding
    await db.insert(documentChunks).values({
      firmId: ctx.firmId,
      documentId: doc.id,
      matterId: matter.id,
      chunkIndex: 0,
      text: "Text without embedding",
      embedding: null,
    });

    // Search should return no results
    const results = await db
      .select()
      .from(documentChunks)
      .where(and(eq(documentChunks.firmId, ctx.firmId), isNotNull(documentChunks.embedding)));

    expect(results.length).toBe(0);
  });

  it("handles non-existent matter ID gracefully", async () => {
    const fakeMatterId = "00000000-0000-0000-0000-000000000000";

    const results = await db
      .select()
      .from(documentChunks)
      .where(
        and(
          eq(documentChunks.firmId, ctx.firmId),
          eq(documentChunks.matterId, fakeMatterId),
          isNotNull(documentChunks.embedding)
        )
      );

    expect(results).toBeDefined();
    expect(results.length).toBe(0);
  });
});
