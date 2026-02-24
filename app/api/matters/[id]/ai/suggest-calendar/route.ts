import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { generateText } from "ai";
import { approvalRequests, matters } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { openrouter, models } from "@/lib/ai/openrouter";
import { CalendarAISuggestRequestSchema } from "@/lib/api/schemas";
import { withAuth } from "@/middleware/withAuth";
import { NotFoundError, ValidationError, withErrorHandler } from "@/middleware/withErrorHandler";
import { withPermission } from "@/middleware/withPermission";
import { z } from "zod";

const SuggestedEventsSchema = z.object({
  events: z
    .array(
      z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        eventType: z
          .enum([
            "hearing",
            "deadline",
            "meeting",
            "reminder",
            "limitation_date",
            "filing_deadline",
            "other",
          ])
          .optional(),
        startAt: z.string().datetime(),
        endAt: z.string().datetime().optional(),
        allDay: z.boolean().optional(),
        priority: z.enum(["low", "medium", "high", "critical"]).optional(),
      })
    )
    .max(20),
});

export const POST = withErrorHandler(
  withAuth(
    withPermission("ai:use")(
      withPermission("calendar:write")(async (request: NextRequest, { params, user }) => {
        const matterId = params ? (await params).id : undefined;
        if (!matterId) throw new NotFoundError("Matter not found");

        if (!process.env.OPENROUTER_API_KEY) {
          throw new ValidationError("OPENROUTER_API_KEY is not configured");
        }

        const body = await request.json().catch(() => ({}));
        const data = CalendarAISuggestRequestSchema.parse(body);

        const firmId = await getOrCreateFirmIdForUser(user.user.id);

        const approval = await withFirmDb(firmId, async (tx) => {
          const [matter] = await tx
            .select({ id: matters.id, title: matters.title, reference: matters.reference })
            .from(matters)
            .where(and(eq(matters.id, matterId), eq(matters.firmId, firmId)))
            .limit(1);

          if (!matter) throw new NotFoundError("Matter not found");

          const prompt = [
            "You are Legal Copilot.",
            "Extract actionable calendar events/deadlines from the provided text for a US legal matter.",
            "Return JSON only with shape:",
            `{"events":[{"title":"...","description":"...","eventType":"deadline","startAt":"2024-12-17T10:30:00Z","endAt":"...","allDay":false,"priority":"high"}]}`,
            "Rules:",
            "- Only propose events that are explicitly stated (or tightly implied by explicit dates) in the text.",
            "- Prefer UTC ISO 8601 for timestamps; if time is unknown, set allDay=true and use 09:00Z.",
            "- Keep list small (<= 10).",
            "",
            `MATTER: ${matter.reference} — ${matter.title}`,
            "TEXT:",
            data.text.slice(0, 20_000),
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

          const parsed = SuggestedEventsSchema.safeParse(json);
          if (!parsed.success) throw new ValidationError("Model did not return valid JSON");

          const events = parsed.data.events.map((e) => ({
            title: e.title,
            description: e.description ?? null,
            eventType: e.eventType ?? "other",
            startAt: e.startAt,
            endAt: e.endAt ?? null,
            allDay: e.allDay ?? false,
            priority: e.priority ?? "medium",
          }));

          const [row] = await tx
            .insert(approvalRequests)
            .values({
              firmId,
              sourceType: "ai",
              sourceId: user.user.id,
              action: "calendar_event.create",
              summary: `Create ${events.length} calendar event(s) for matter`,
              proposedPayload: { matterId, events },
              entityType: "matter",
              entityId: matterId,
              aiMetadata: { model: models["claude-3-5-sonnet"] },
              updatedAt: new Date(),
            })
            .returning();

          if (!row) throw new ValidationError("Failed to create approval request");
          return row;
        });

        return NextResponse.json(approval, { status: 201 });
      })
    )
  )
);
