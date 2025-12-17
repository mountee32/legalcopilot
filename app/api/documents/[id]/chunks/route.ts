import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { documents, documentChunks } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { chunkText } from "@/lib/documents/chunking";
import { ChunkDocumentRequestSchema } from "@/lib/api/schemas";
import { createTimelineEvent } from "@/lib/timeline/createEvent";
import { withAuth } from "@/middleware/withAuth";
import { ValidationError, withErrorHandler, NotFoundError } from "@/middleware/withErrorHandler";

export const GET = withErrorHandler(
  withAuth(async (_request, { params, user }) => {
    const id = params?.id;
    if (!id) throw new NotFoundError("Document not found");

    const firmId = await getOrCreateFirmIdForUser(user.user.id);

    const chunks = await withFirmDb(firmId, async (tx) => {
      const [doc] = await tx
        .select({ id: documents.id })
        .from(documents)
        .where(and(eq(documents.id, id), eq(documents.firmId, firmId)))
        .limit(1);

      if (!doc) throw new NotFoundError("Document not found");

      return tx
        .select()
        .from(documentChunks)
        .where(and(eq(documentChunks.documentId, id), eq(documentChunks.firmId, firmId)))
        .orderBy(documentChunks.chunkIndex);
    });

    return NextResponse.json({ chunks });
  })
);

export const POST = withErrorHandler(
  withAuth(async (request, { params, user }) => {
    const id = params?.id;
    if (!id) throw new NotFoundError("Document not found");

    const firmId = await getOrCreateFirmIdForUser(user.user.id);
    const body = await request.json().catch(() => ({}));
    const data = ChunkDocumentRequestSchema.parse(body);
    const maxChars = data.maxChars ?? 1200;

    const chunkCount = await withFirmDb(firmId, async (tx) => {
      const [doc] = await tx
        .select({ extractedText: documents.extractedText, matterId: documents.matterId })
        .from(documents)
        .where(and(eq(documents.id, id), eq(documents.firmId, firmId)))
        .limit(1);

      if (!doc) throw new NotFoundError("Document not found");
      if (!doc.extractedText) throw new ValidationError("Document has no extracted text to chunk");

      const chunks = chunkText(doc.extractedText, maxChars);
      if (chunks.length === 0) throw new ValidationError("No chunks produced");

      await tx
        .delete(documentChunks)
        .where(and(eq(documentChunks.documentId, id), eq(documentChunks.firmId, firmId)));

      await tx.insert(documentChunks).values(
        chunks.map((chunk, index) => ({
          firmId,
          documentId: id,
          matterId: doc.matterId,
          chunkIndex: index,
          text: chunk.text,
          charStart: chunk.charStart,
          charEnd: chunk.charEnd,
        }))
      );

      const [updated] = await tx
        .update(documents)
        .set({ chunkedAt: new Date(), chunkCount: chunks.length, updatedAt: new Date() })
        .where(and(eq(documents.id, id), eq(documents.firmId, firmId)))
        .returning({ chunkCount: documents.chunkCount });

      await createTimelineEvent(tx, {
        firmId,
        matterId: doc.matterId,
        type: "document_chunked",
        title: "Document processed for citations",
        actorType: "system",
        actorId: null,
        entityType: "document",
        entityId: id,
        occurredAt: new Date(),
        metadata: { chunkCount: chunks.length, maxChars },
      });

      return updated?.chunkCount ?? chunks.length;
    });

    return NextResponse.json({ success: true, chunkCount });
  })
);
