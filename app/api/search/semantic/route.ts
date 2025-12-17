import { NextRequest, NextResponse } from "next/server";
import { and, eq, isNotNull, sql } from "drizzle-orm";
import { documentChunks } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { SemanticSearchRequestSchema } from "@/lib/api/schemas";
import { embedTexts } from "@/lib/ai/embeddings";
import { withAuth } from "@/middleware/withAuth";
import { ValidationError, withErrorHandler } from "@/middleware/withErrorHandler";
import { withPermission } from "@/middleware/withPermission";

function vectorLiteral(values: number[]): string {
  return `[${values.map((v) => (Number.isFinite(v) ? v : 0)).join(",")}]`;
}

export const POST = withErrorHandler(
  withAuth(
    withPermission("documents:read")(async (request: NextRequest, { user }) => {
      const body = await request.json().catch(() => ({}));
      const data = SemanticSearchRequestSchema.parse(body);

      if (!process.env.OPENROUTER_API_KEY) {
        throw new ValidationError("OPENROUTER_API_KEY is not configured");
      }

      const firmId = await getOrCreateFirmIdForUser(user.user.id);
      const limit = data.limit ?? 12;

      const [queryEmbedding] = await embedTexts([data.query]);
      const queryVector = vectorLiteral(queryEmbedding);

      const results = await withFirmDb(firmId, async (tx) => {
        const whereClauses = [
          eq(documentChunks.firmId, firmId),
          isNotNull(documentChunks.embedding),
        ];
        if (data.matterId) whereClauses.push(eq(documentChunks.matterId, data.matterId));

        const where = and(...whereClauses);
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
