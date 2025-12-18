import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { generateText } from "ai";
import { emails, matters } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { openrouter, models } from "@/lib/ai/openrouter";
import { withAuth } from "@/middleware/withAuth";
import { NotFoundError, ValidationError, withErrorHandler } from "@/middleware/withErrorHandler";
import { withPermission } from "@/middleware/withPermission";

const ProcessedEmailSchema = z.object({
  intent: z
    .enum([
      "request_information",
      "provide_information",
      "request_action",
      "status_update",
      "complaint",
      "deadline",
      "confirmation",
      "general",
    ])
    .optional(),
  sentiment: z.enum(["positive", "neutral", "negative", "frustrated"]).optional(),
  urgency: z.number().int().min(1).max(5).optional(),
  summary: z.string().optional(),
  suggestedResponse: z.string().optional(),
  suggestedTasks: z.array(z.string()).optional(),
  matchedMatterId: z.string().uuid().nullable().optional(),
  matchConfidence: z.number().int().min(0).max(100).optional(),
});

export const POST = withErrorHandler(
  withAuth(
    withPermission("ai:use")(async (_request, { params, user }) => {
      const id = params ? (await params).id : undefined;
      if (!id) throw new NotFoundError("Email not found");

      if (!process.env.OPENROUTER_API_KEY) {
        throw new ValidationError("OPENROUTER_API_KEY is not configured");
      }

      const firmId = await getOrCreateFirmIdForUser(user.user.id);

      const updated = await withFirmDb(firmId, async (tx) => {
        const [email] = await tx
          .select({
            id: emails.id,
            subject: emails.subject,
            bodyText: emails.bodyText,
            bodyHtml: emails.bodyHtml,
            matterId: emails.matterId,
          })
          .from(emails)
          .where(and(eq(emails.id, id), eq(emails.firmId, firmId)))
          .limit(1);

        if (!email) throw new NotFoundError("Email not found");

        const candidates = await tx
          .select({ id: matters.id, reference: matters.reference, title: matters.title })
          .from(matters)
          .where(eq(matters.firmId, firmId))
          .orderBy(matters.createdAt)
          .limit(30);

        const candidateText = candidates
          .map((m) => `- id: ${m.id}\n  reference: ${m.reference}\n  title: ${m.title}`)
          .join("\n");

        const content = email.bodyText ?? email.bodyHtml ?? "";

        const prompt = [
          "You are Legal Copilot.",
          "Analyze the email and return JSON only with the following shape (omit fields you can't infer):",
          `{"intent":"...","sentiment":"...","urgency":1,"summary":"...","suggestedResponse":"...","suggestedTasks":["..."],"matchedMatterId":"...","matchConfidence":0}`,
          "Pick matchedMatterId only from the candidates list if confident; otherwise set null.",
          "",
          "CANDIDATE_MATTERS:",
          candidateText || "(none)",
          "",
          `EMAIL_SUBJECT: ${email.subject}`,
          "EMAIL_BODY:",
          content.slice(0, 20_000),
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

        const parsed = ProcessedEmailSchema.safeParse(json);
        if (!parsed.success) {
          throw new ValidationError("Model did not return valid JSON");
        }

        const p = parsed.data;

        const [row] = await tx
          .update(emails)
          .set({
            aiProcessed: true,
            aiProcessedAt: new Date(),
            aiIntent: p.intent ?? null,
            aiSentiment: p.sentiment ?? null,
            aiUrgency: p.urgency ?? null,
            aiSummary: p.summary ?? null,
            aiSuggestedResponse: p.suggestedResponse ?? null,
            aiSuggestedTasks: p.suggestedTasks ?? null,
            aiMatchedMatterId: p.matchedMatterId ?? null,
            aiMatchConfidence: p.matchConfidence ?? null,
            updatedAt: new Date(),
          })
          .where(and(eq(emails.id, id), eq(emails.firmId, firmId)))
          .returning();

        return row ?? null;
      });

      if (!updated) throw new NotFoundError("Email not found");
      return NextResponse.json({ success: true, email: updated });
    })
  )
);
