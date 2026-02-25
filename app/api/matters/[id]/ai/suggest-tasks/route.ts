/**
 * POST /api/matters/[id]/ai/suggest-tasks
 *
 * Uses AI to analyze matter context (findings, client info, practice area)
 * and suggest actionable tasks. Returns suggestions without creating anything —
 * the user reviews and selects which to create via /create-suggested-tasks.
 */

import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { openrouter, models } from "@/lib/ai/openrouter";
import { buildGenerationContext } from "@/lib/generation/context-builder";
import { SuggestTasksRequestSchema, SuggestTasksResponseSchema } from "@/lib/api/schemas";
import { withAuth } from "@/middleware/withAuth";
import { NotFoundError, ValidationError, withErrorHandler } from "@/middleware/withErrorHandler";
import { withPermission } from "@/middleware/withPermission";

export const POST = withErrorHandler(
  withAuth(
    withPermission("ai:use")(async (request: NextRequest, { params, user }) => {
      const matterId = params ? (await params).id : undefined;
      if (!matterId) throw new NotFoundError("Matter not found");

      if (!process.env.OPENROUTER_API_KEY) {
        throw new ValidationError("OPENROUTER_API_KEY is not configured");
      }

      const body = await request.json().catch(() => ({}));
      const data = SuggestTasksRequestSchema.parse(body);

      const firmId = await getOrCreateFirmIdForUser(user.user.id);

      const result = await withFirmDb(firmId, async (tx) => {
        const ctx = await buildGenerationContext(firmId, matterId, tx);

        const findingsSummary =
          Object.entries(ctx.findingsByCategory)
            .flatMap(([cat, entries]) =>
              entries.slice(0, 5).map((e) => `- [${cat}] ${e.label}: ${e.value} (${e.status})`)
            )
            .slice(0, 20)
            .join("\n") || "No findings extracted yet.";

        const statusSummary = Object.entries(ctx.statusCounts)
          .filter(([, count]) => count > 0)
          .map(([status, count]) => `${status}: ${count}`)
          .join(", ");

        const prompt = [
          "You are Legal Copilot, an AI assistant for UK law firms.",
          "Analyse the matter context below and suggest 3–8 actionable tasks for the fee earner.",
          "Return ONLY valid JSON matching this shape:",
          '{"suggestions":[{"title":"...","description":"...","priority":"medium","dueInDays":7,"rationale":"..."}]}',
          "",
          "Rules:",
          "- Priority must be one of: low, medium, high, urgent",
          "- dueInDays is calendar days from today (0-365, omit if no clear deadline)",
          "- rationale: concise (1 sentence) citing specific case facts",
          "- title max 200 chars, description max 300 chars",
          "- Focus on next actions: reviews, follow-ups, filings, client communications",
          "- Do not suggest sending emails or changing billing without review",
          "",
          `MATTER: ${ctx.matter.reference} — ${ctx.matter.title}`,
          `PRACTICE AREA: ${ctx.matter.practiceArea}`,
          `STATUS: ${ctx.matter.status}`,
          `CLIENT: ${ctx.client.name} (${ctx.client.type})`,
          `TODAY: ${ctx.today}`,
          "",
          "EXTRACTED FINDINGS:",
          findingsSummary,
          statusSummary ? `\nFINDINGS STATUS: ${statusSummary}` : "",
          data.goal ? `\nGOAL: ${data.goal}` : "",
        ]
          .filter(Boolean)
          .join("\n");

        const aiResult = await generateText({
          model: openrouter(models["claude-3-5-sonnet"]),
          prompt,
        });

        let parsed: unknown;
        try {
          const raw = aiResult.text
            .replace(/```json?\n?/g, "")
            .replace(/```/g, "")
            .trim();
          parsed = JSON.parse(raw);
        } catch {
          throw new ValidationError("AI did not return valid JSON");
        }

        const validated = SuggestTasksResponseSchema.safeParse(parsed);
        if (!validated.success) {
          throw new ValidationError("AI response did not match expected schema");
        }

        return validated.data;
      });

      return NextResponse.json(result);
    })
  )
);
