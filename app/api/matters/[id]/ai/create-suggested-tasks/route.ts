/**
 * POST /api/matters/[id]/ai/create-suggested-tasks
 *
 * Bulk-creates tasks from AI suggestions. The user has already reviewed
 * and selected which suggestions to create — this is the execution step.
 */

import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { matters, tasks } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { withAuth } from "@/middleware/withAuth";
import { NotFoundError, withErrorHandler } from "@/middleware/withErrorHandler";
import { withPermission } from "@/middleware/withPermission";
import { CreateSuggestedTasksSchema } from "@/lib/api/schemas";
import { createTimelineEvent } from "@/lib/timeline/createEvent";

export const POST = withErrorHandler(
  withAuth(
    withPermission("cases:write")(async (request: NextRequest, { params, user }) => {
      const matterId = params ? (await params).id : undefined;
      if (!matterId) throw new NotFoundError("Matter not found");

      const firmId = await getOrCreateFirmIdForUser(user.user.id);
      const body = await request.json();
      const data = CreateSuggestedTasksSchema.parse(body);

      const created = await withFirmDb(firmId, async (tx) => {
        const [matter] = await tx
          .select({ id: matters.id })
          .from(matters)
          .where(and(eq(matters.id, matterId), eq(matters.firmId, firmId)))
          .limit(1);

        if (!matter) throw new NotFoundError("Matter not found");

        const now = new Date();
        const taskValues = data.tasks.map((t) => ({
          firmId,
          matterId,
          title: t.title,
          description: t.description ?? null,
          priority: t.priority ?? "medium",
          status: "pending" as const,
          dueDate: t.dueInDays != null ? new Date(now.getTime() + t.dueInDays * 86_400_000) : null,
          assigneeId: t.assigneeId ?? null,
          createdById: user.user.id,
          aiGenerated: true,
          aiSource: "matter" as const,
          source: "ai" as const,
          sourceEntityType: "matter",
          sourceEntityId: matterId,
        }));

        const inserted = await tx.insert(tasks).values(taskValues).returning();

        await createTimelineEvent(tx, {
          firmId,
          matterId,
          type: "ai_tasks_suggested",
          title: `Created ${inserted.length} AI-suggested task(s)`,
          actorType: "user",
          actorId: user.user.id,
          entityType: "matter",
          entityId: matterId,
          occurredAt: now,
          metadata: { count: inserted.length, taskIds: inserted.map((t) => t.id) },
        });

        return inserted;
      });

      return NextResponse.json({ tasks: created }, { status: 201 });
    })
  )
);
