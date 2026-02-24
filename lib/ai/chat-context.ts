/**
 * Chat Context Builder
 *
 * Builds rich context for the conversational case assistant by combining:
 * - Matter/client/firm metadata (via buildGenerationContext)
 * - Document chunks via RAG (embed question → cosine similarity)
 * - Recent timeline events for temporal context
 */

import { and, desc, eq, isNotNull, sql } from "drizzle-orm";
import { documentChunks, timelineEvents } from "@/lib/db/schema";
import { buildGenerationContext, type GenerationContext } from "@/lib/generation/context-builder";
import { embedTexts } from "@/lib/ai/embeddings";
import type { db } from "@/lib/db";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ChatChunk {
  documentId: string;
  documentChunkId: string;
  text: string;
}

export interface ChatTimelineEvent {
  type: string;
  title: string;
  description: string | null;
  occurredAt: string;
}

export interface ChatContext {
  generation: GenerationContext;
  chunks: ChatChunk[];
  timelineEvents: ChatTimelineEvent[];
  ragUsed: boolean;
}

// ---------------------------------------------------------------------------
// Vector helpers (same pattern as existing /ai/ask endpoint)
// ---------------------------------------------------------------------------

function vectorLiteral(values: number[]): string {
  return `[${values.map((v) => (Number.isFinite(v) ? v : 0)).join(",")}]`;
}

// ---------------------------------------------------------------------------
// Context builder
// ---------------------------------------------------------------------------

export async function buildChatContext(
  firmId: string,
  matterId: string,
  question: string,
  tx: typeof db
): Promise<ChatContext> {
  // 1. Get structured matter/client/firm/findings context
  const generation = await buildGenerationContext(firmId, matterId, tx);

  // 2. RAG — retrieve relevant document chunks
  let queryVector: string | null = null;
  try {
    const [embedding] = await embedTexts([question]);
    queryVector = vectorLiteral(embedding);
  } catch {
    queryVector = null;
  }

  let chunks: ChatChunk[];
  const ragUsed = !!queryVector;

  if (queryVector) {
    const where = and(
      eq(documentChunks.firmId, firmId),
      eq(documentChunks.matterId, matterId),
      isNotNull(documentChunks.embedding)
    );
    const distance = sql<number>`(${documentChunks.embedding} <=> ${queryVector}::vector)`;

    const rows = await tx
      .select({
        documentId: documentChunks.documentId,
        documentChunkId: documentChunks.id,
        text: documentChunks.text,
      })
      .from(documentChunks)
      .where(where)
      .orderBy(distance)
      .limit(6);

    chunks = rows.length > 0 ? rows : await recentChunks(firmId, matterId, tx);
  } else {
    chunks = await recentChunks(firmId, matterId, tx);
  }

  // 3. Recent timeline events
  const events = await tx
    .select({
      type: timelineEvents.type,
      title: timelineEvents.title,
      description: timelineEvents.description,
      occurredAt: timelineEvents.occurredAt,
    })
    .from(timelineEvents)
    .where(and(eq(timelineEvents.firmId, firmId), eq(timelineEvents.matterId, matterId)))
    .orderBy(desc(timelineEvents.occurredAt))
    .limit(10);

  const chatTimeline: ChatTimelineEvent[] = events.map((e) => ({
    type: e.type,
    title: e.title,
    description: e.description,
    occurredAt: e.occurredAt instanceof Date ? e.occurredAt.toISOString() : String(e.occurredAt),
  }));

  return { generation, chunks, timelineEvents: chatTimeline, ragUsed };
}

async function recentChunks(firmId: string, matterId: string, tx: typeof db): Promise<ChatChunk[]> {
  return tx
    .select({
      documentId: documentChunks.documentId,
      documentChunkId: documentChunks.id,
      text: documentChunks.text,
    })
    .from(documentChunks)
    .where(and(eq(documentChunks.firmId, firmId), eq(documentChunks.matterId, matterId)))
    .orderBy(desc(documentChunks.createdAt))
    .limit(6);
}

// ---------------------------------------------------------------------------
// System prompt builder
// ---------------------------------------------------------------------------

export function buildChatSystemPrompt(context: ChatContext): string {
  const { generation, chunks, timelineEvents: events } = context;
  const sections: string[] = [];

  // Role
  sections.push(`## ROLE
You are Legal Copilot, an AI assistant for lawyers at ${generation.firm.name}. You help fee earners understand their cases by answering questions based on case data, extracted findings, and documents. Use professional British English.`);

  // Matter context
  sections.push(`## MATTER
- Reference: ${generation.matter.reference}
- Title: ${generation.matter.title}
- Practice Area: ${generation.matter.practiceArea}
- Status: ${generation.matter.status}
${generation.matter.description ? `- Description: ${generation.matter.description}` : ""}
${generation.matter.subType ? `- Sub-type: ${generation.matter.subType}` : ""}`);

  // Client
  sections.push(`## CLIENT
- Name: ${generation.client.name}
- Type: ${generation.client.type}
${generation.client.email ? `- Email: ${generation.client.email}` : ""}
${generation.client.address ? `- Address: ${generation.client.address}` : ""}`);

  // Fee earner
  if (generation.feeEarner) {
    sections.push(`## FEE EARNER
- Name: ${generation.feeEarner.name}
- Email: ${generation.feeEarner.email}`);
  }

  // Findings by category
  const catKeys = Object.keys(generation.findingsByCategory);
  if (catKeys.length > 0) {
    const findingSections: string[] = [];
    for (const cat of catKeys) {
      const entries = generation.findingsByCategory[cat];
      const lines = entries.map(
        (f) =>
          `  - ${f.label}: ${f.value} (confidence: ${Math.round(f.confidence * 100)}%, status: ${f.status})`
      );
      findingSections.push(`### ${cat}\n${lines.join("\n")}`);
    }
    sections.push(`## EXTRACTED FINDINGS\n${findingSections.join("\n\n")}`);
  }

  // Document excerpts
  if (chunks.length > 0) {
    const excerpts = chunks.map((c, i) => {
      const text = c.text.length > 800 ? `${c.text.slice(0, 800)}...` : c.text;
      return `[Source ${i + 1}] (doc: ${c.documentId})\n${text}`;
    });
    sections.push(`## RELEVANT DOCUMENT EXCERPTS\n${excerpts.join("\n\n")}`);
  }

  // Timeline events
  if (events.length > 0) {
    const lines = events.map(
      (e) =>
        `- [${e.occurredAt}] ${e.type}: ${e.title}${e.description ? ` — ${e.description}` : ""}`
    );
    sections.push(`## RECENT TIMELINE (newest first)\n${lines.join("\n")}`);
  }

  // Rules
  sections.push(`## RULES
1. Only reference facts from the provided context — do not speculate or invent information
2. Cite specific sources when referencing document excerpts (e.g. "[Source 1]")
3. Clearly flag uncertainty — say "I don't have information about..." rather than guessing
4. Provide legal analysis and case summaries, but do NOT give legal advice
5. Use professional, concise language appropriate for a UK solicitor
6. If asked about something outside the provided context, say so honestly`);

  return sections.join("\n\n");
}

// ---------------------------------------------------------------------------
// Message history formatter
// ---------------------------------------------------------------------------

export function formatChatHistory(
  messages: Array<{ role: string; content: string }>
): Array<{ role: "user" | "assistant"; content: string }> {
  return messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));
}
