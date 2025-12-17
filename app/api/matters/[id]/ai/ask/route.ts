import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { generateText } from "ai";
import { documentChunks, matters } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { AskMatterSchema } from "@/lib/api/schemas";
import { openrouter, models } from "@/lib/ai/openrouter";
import { withAuth } from "@/middleware/withAuth";
import { ValidationError, withErrorHandler, NotFoundError } from "@/middleware/withErrorHandler";

const CitationSchema = z.object({
  documentId: z.string().uuid(),
  documentChunkId: z.string().uuid(),
  quote: z.string().optional(),
});

const AskResponseSchema = z.object({
  answer: z.string(),
  citations: z.array(CitationSchema).default([]),
});

export const POST = withErrorHandler(
  withAuth(async (request, { params, user }) => {
    const matterId = params?.id;
    if (!matterId) throw new NotFoundError("Matter not found");

    const body = await request.json();
    const { question } = AskMatterSchema.parse(body);

    if (!process.env.OPENROUTER_API_KEY) {
      throw new ValidationError("OPENROUTER_API_KEY is not configured");
    }

    const firmId = await getOrCreateFirmIdForUser(user.user.id);

    const chunks = await withFirmDb(firmId, async (tx) => {
      const [matter] = await tx
        .select({ id: matters.id })
        .from(matters)
        .where(and(eq(matters.id, matterId), eq(matters.firmId, firmId)))
        .limit(1);

      if (!matter) throw new NotFoundError("Matter not found");

      return tx
        .select({
          documentId: documentChunks.documentId,
          documentChunkId: documentChunks.id,
          text: documentChunks.text,
        })
        .from(documentChunks)
        .where(and(eq(documentChunks.firmId, firmId), eq(documentChunks.matterId, matterId)))
        .orderBy(desc(documentChunks.createdAt))
        .limit(8);
    });

    if (chunks.length === 0) {
      return NextResponse.json({
        answer: "I don't have any processed document chunks for this matter yet.",
        citations: [],
      });
    }

    const sources = chunks
      .map((c) => {
        const text = c.text.length > 1200 ? `${c.text.slice(0, 1200)}…` : c.text;
        return `- documentId: ${c.documentId}\n  documentChunkId: ${c.documentChunkId}\n  text: |\n    ${text.replace(/\n/g, "\n    ")}`;
      })
      .join("\n");

    const prompt = [
      "You are Legal Copilot.",
      "Answer the user's question using only the SOURCES provided.",
      "Return JSON only in the following shape:",
      `{\"answer\":\"...\",\"citations\":[{\"documentId\":\"...\",\"documentChunkId\":\"...\",\"quote\":\"...\"}]}`,
      "Only cite chunks you actually used. If the sources are insufficient, say you don't know and return empty citations.",
      "",
      "SOURCES:",
      sources,
      "",
      `QUESTION: ${question}`,
    ].join("\n");

    const result = await generateText({
      model: openrouter(models["claude-3-5-sonnet"]),
      prompt,
    });

    let json: unknown = null;
    try {
      json = JSON.parse(result.text);
    } catch {
      json = null;
    }

    const parsed = AskResponseSchema.safeParse(json);

    if (!parsed.success || !parsed.data) {
      return NextResponse.json({ answer: result.text, citations: [] });
    }

    return NextResponse.json(parsed.data);
  })
);
