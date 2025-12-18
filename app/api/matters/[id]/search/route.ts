import { NextRequest, NextResponse } from "next/server";
import { and, eq, isNotNull, sql } from "drizzle-orm";
import { z } from "zod";
import { documentChunks, matters } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { embedTexts } from "@/lib/ai/embeddings";
import { withAuth } from "@/middleware/withAuth";
import { NotFoundError, ValidationError, withErrorHandler } from "@/middleware/withErrorHandler";
import { withPermission } from "@/middleware/withPermission";

const QuerySchema = z.object({
  q: z.string().min(1),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

function vectorLiteral(values: number[]): string {
  return `[${values.map((v) => (Number.isFinite(v) ? v : 0)).join(",")}]`;
}

export const GET = withErrorHandler(
  withAuth(
    withPermission("documents:read")(async (request: NextRequest, { params, user }) => {
      const matterId = params ? (await params).id : undefined;
      if (!matterId) throw new NotFoundError("Matter not found");

      if (!process.env.OPENROUTER_API_KEY) {
        throw new ValidationError("OPENROUTER_API_KEY is not configured");
      }

      const url = new URL(request.url);
      const query = QuerySchema.parse(Object.fromEntries(url.searchParams.entries()));

      const firmId = await getOrCreateFirmIdForUser(user.user.id);
      const limit = query.limit ?? 12;

      const [queryEmbedding] = await embedTexts([query.q]);
      const queryVector = vectorLiteral(queryEmbedding);

      const results = await withFirmDb(firmId, async (tx) => {
        const [m] = await tx
          .select({ id: matters.id })
          .from(matters)
          .where(and(eq(matters.id, matterId), eq(matters.firmId, firmId)))
          .limit(1);

        if (!m) throw new NotFoundError("Matter not found");

        const where = and(
          eq(documentChunks.firmId, firmId),
          eq(documentChunks.matterId, matterId),
          isNotNull(documentChunks.embedding)
        );

        const distance = sql<number>`(${documentChunks.embedding} <=> ${queryVector}::vector)`;
        const score = sql<number>`(1 - ${distance})`;

        return await tx
          .select({
            documentId: documentChunks.documentId,
            documentChunkId: documentChunks.id,
            text: documentChunks.text,
            score,
          })
          .from(documentChunks)
          .where(where)
          .orderBy(distance)
          .limit(limit);
      });

      return NextResponse.json({ results });
    })
  )
);
