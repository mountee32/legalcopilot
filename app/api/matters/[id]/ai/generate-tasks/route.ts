import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { generateText } from "ai";
import { z } from "zod";
import { approvalRequests, matters } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { GenerateTasksSchema } from "@/lib/api/schemas";
import { openrouter, models } from "@/lib/ai/openrouter";
import { withAuth } from "@/middleware/withAuth";
import { NotFoundError, ValidationError, withErrorHandler } from "@/middleware/withErrorHandler";
import { withPermission } from "@/middleware/withPermission";

const ProposedTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  dueDate: z.string().datetime().optional(),
});

const ModelResponseSchema = z.object({
  tasks: z.array(ProposedTaskSchema).min(1).max(20),
});

export const POST = withErrorHandler(
  withAuth(
    withPermission("ai:use")(async (request: NextRequest, { params, user }) => {
      const matterId = params?.id;
      if (!matterId) throw new NotFoundError("Matter not found");

      const body = await request.json().catch(() => ({}));
      const { goal } = GenerateTasksSchema.parse(body);

      if (!process.env.OPENROUTER_API_KEY) {
        throw new ValidationError("OPENROUTER_API_KEY is not configured");
      }

      const firmId = await getOrCreateFirmIdForUser(user.user.id);

      const approval = await withFirmDb(firmId, async (tx) => {
        const [matter] = await tx
          .select({ id: matters.id, title: matters.title, practiceArea: matters.practiceArea })
          .from(matters)
          .where(and(eq(matters.id, matterId), eq(matters.firmId, firmId)))
          .limit(1);
        if (!matter) throw new NotFoundError("Matter not found");

        const prompt = [
          "You are Legal Copilot.",
          "Generate a short actionable task list for the given legal matter.",
          'Return JSON only in the shape: {"tasks":[{"title":"...","description":"...","priority":"...","dueDate":"..."}]}',
          "Do not include any tasks that send external communications or change billing without explicit human review.",
          "",
          `MATTER_TITLE: ${matter.title}`,
          `PRACTICE_AREA: ${matter.practiceArea}`,
          goal ? `GOAL: ${goal}` : "",
        ]
          .filter(Boolean)
          .join("\n");

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

        const parsed = ModelResponseSchema.safeParse(json);
        if (!parsed.success) {
          throw new ValidationError("Model did not return valid JSON tasks");
        }

        const summary = `Create ${parsed.data.tasks.length} task(s) for matter`;

        const [approval] = await tx
          .insert(approvalRequests)
          .values({
            firmId,
            sourceType: "ai",
            sourceId: user.user.id,
            action: "task.create",
            summary,
            proposedPayload: { matterId, tasks: parsed.data.tasks },
            entityType: "matter",
            entityId: matterId,
            aiMetadata: { model: "claude-3-5-sonnet" },
          })
          .returning();

        return approval;
      });

      return NextResponse.json(approval, { status: 201 });
    })
  )
);
