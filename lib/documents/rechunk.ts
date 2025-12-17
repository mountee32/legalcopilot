import { and, eq } from "drizzle-orm";
import type { db } from "@/lib/db";
import { documents, documentChunks } from "@/lib/db/schema";
import { createTimelineEvent } from "@/lib/timeline/createEvent";
import { chunkText } from "@/lib/documents/chunking";
import { embedTexts } from "@/lib/ai/embeddings";

type RechunkOptions = {
  firmId: string;
  documentId: string;
  matterId: string;
  extractedText: string;
  maxChars?: number;
};

export async function rechunkDocumentTx(
  tx: typeof db,
  { firmId, documentId, matterId, extractedText, maxChars = 1200 }: RechunkOptions
): Promise<number> {
  const chunks = chunkText(extractedText, maxChars);
  if (chunks.length === 0) return 0;

  let embeddings: number[][] | null = null;
  try {
    embeddings = await embedTexts(chunks.map((c) => c.text));
  } catch {
    embeddings = null;
  }

  await tx
    .delete(documentChunks)
    .where(and(eq(documentChunks.documentId, documentId), eq(documentChunks.firmId, firmId)));

  await tx.insert(documentChunks).values(
    chunks.map((chunk, index) => ({
      firmId,
      documentId,
      matterId,
      chunkIndex: index,
      text: chunk.text,
      charStart: chunk.charStart,
      charEnd: chunk.charEnd,
      embedding: embeddings ? embeddings[index] : null,
    }))
  );

  await tx
    .update(documents)
    .set({ chunkedAt: new Date(), chunkCount: chunks.length, updatedAt: new Date() })
    .where(and(eq(documents.id, documentId), eq(documents.firmId, firmId)));

  await createTimelineEvent(tx, {
    firmId,
    matterId,
    type: "document_chunked",
    title: "Document processed for citations",
    actorType: "system",
    actorId: null,
    entityType: "document",
    entityId: documentId,
    occurredAt: new Date(),
    metadata: { chunkCount: chunks.length, maxChars },
  });

  return chunks.length;
}
