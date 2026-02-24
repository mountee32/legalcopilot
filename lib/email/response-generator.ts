/**
 * Context-Aware Email Response Generator
 *
 * Builds a structured prompt with matter context, thread history, and recent
 * findings to produce high-quality AI draft responses.
 */

import { callAi, type AiCallResult } from "@/lib/pipeline/ai-client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ResponseContext {
  email: {
    fromAddress: { email: string; name?: string };
    subject: string;
    bodyText: string | null;
    aiIntent: string | null;
    aiSentiment: string | null;
    aiUrgency: number | null;
  };
  matter?: {
    reference: string;
    title: string;
    practiceArea: string | null;
    status: string;
  } | null;
  client?: {
    name: string;
    type: string | null;
  } | null;
  recentFindings?: Array<{
    fieldLabel: string;
    extractedValue: string;
    confidence: number;
  }>;
  threadHistory?: Array<{
    direction: string;
    fromName: string;
    subject: string;
    bodyPreview: string;
    createdAt: string;
  }>;
  firmName: string;
  userName: string;
}

export interface GenerateResponseResult {
  response: string;
  tokensUsed: number;
}

// ---------------------------------------------------------------------------
// Prompt builder
// ---------------------------------------------------------------------------

export function buildResponsePrompt(ctx: ResponseContext): string {
  const sections: string[] = [];

  // ROLE
  sections.push(`## ROLE
You are a professional legal assistant drafting an email response on behalf of ${ctx.userName} at ${ctx.firmName}. Write in a professional but warm UK solicitor tone. Use British English spelling and legal conventions.`);

  // CONTEXT
  if (ctx.matter) {
    sections.push(`## MATTER CONTEXT
- Reference: ${ctx.matter.reference}
- Title: ${ctx.matter.title}
- Practice Area: ${ctx.matter.practiceArea || "General"}
- Status: ${ctx.matter.status}`);
  }

  if (ctx.client) {
    sections.push(`## CLIENT
- Name: ${ctx.client.name}
- Type: ${ctx.client.type || "Individual"}`);
  }

  // THREAD HISTORY
  if (ctx.threadHistory && ctx.threadHistory.length > 0) {
    const threadLines = ctx.threadHistory.map(
      (msg) =>
        `[${msg.direction.toUpperCase()}] From: ${msg.fromName} | Subject: ${msg.subject}\n${msg.bodyPreview.slice(0, 300)}${msg.bodyPreview.length > 300 ? "..." : ""}`
    );
    sections.push(`## THREAD HISTORY (oldest first)
${threadLines.join("\n---\n")}`);
  }

  // RECENT FINDINGS
  if (ctx.recentFindings && ctx.recentFindings.length > 0) {
    const findingLines = ctx.recentFindings
      .slice(0, 20)
      .map((f) => `- ${f.fieldLabel}: ${f.extractedValue} (${f.confidence}% confidence)`);
    sections.push(`## RECENT CASE FINDINGS
${findingLines.join("\n")}`);
  }

  // ORIGINAL EMAIL
  const senderName = ctx.email.fromAddress.name || ctx.email.fromAddress.email;
  sections.push(`## ORIGINAL EMAIL TO RESPOND TO
From: ${senderName} <${ctx.email.fromAddress.email}>
Subject: ${ctx.email.subject}
Intent: ${ctx.email.aiIntent || "unknown"}
Sentiment: ${ctx.email.aiSentiment || "unknown"}
Urgency: ${ctx.email.aiUrgency ?? "unknown"}/100

${ctx.email.bodyText || "(no body)"}`);

  // INSTRUCTIONS
  sections.push(`## INSTRUCTIONS
1. Draft a professional response addressing all points raised in the email
2. Be empathetic and acknowledge the sender's concerns or emotions
3. If urgency is high (>70), convey a sense of priority and promptness
4. If sentiment is frustrated/negative, start with acknowledgement and apology if appropriate
5. Reference specific matter details where relevant
6. Include appropriate sign-off with the sender's name
7. Do NOT include email headers (To, From, Subject) — just the body text
8. Keep the response concise but thorough
9. Use British English (e.g., "apologise" not "apologize", "organised" not "organized")`);

  return sections.join("\n\n");
}

// ---------------------------------------------------------------------------
// Generator
// ---------------------------------------------------------------------------

const RESPONSE_MODEL = process.env.EMAIL_RESPONSE_MODEL || "anthropic/claude-3.5-sonnet";

export async function generateEmailResponse(ctx: ResponseContext): Promise<GenerateResponseResult> {
  const prompt = buildResponsePrompt(ctx);

  const result: AiCallResult = await callAi({
    model: RESPONSE_MODEL,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
    maxTokens: 2048,
    timeoutMs: 60_000,
    maxRetries: 2,
  });

  return {
    response: result.content,
    tokensUsed: result.tokensUsed,
  };
}
