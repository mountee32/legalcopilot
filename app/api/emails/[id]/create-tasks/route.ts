import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { emails, tasks, users } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { withAuth } from "@/middleware/withAuth";
import { NotFoundError, ValidationError, withErrorHandler } from "@/middleware/withErrorHandler";
import { withPermission } from "@/middleware/withPermission";
import { CreateEmailTasksSchema } from "@/lib/api/schemas/emails";
import { createTimelineEvent } from "@/lib/timeline/createEvent";

export const POST = withErrorHandler(
  withAuth(
    withPermission("emails:write")(async (request: NextRequest, { params, user }) => {
      const id = params ? (await params).id : undefined;
      if (!id) throw new NotFoundError("Email not found");

      const firmId = await getOrCreateFirmIdForUser(user.user.id);
      const body = await request.json();
      const data = CreateEmailTasksSchema.parse(body);

      const created = await withFirmDb(firmId, async (tx) => {
        // Load email
        const [email] = await tx
          .select({ id: emails.id, matterId: emails.matterId })
          .from(emails)
          .where(and(eq(emails.id, id), eq(emails.firmId, firmId)))
          .limit(1);

        if (!email) throw new NotFoundError("Email not found");
        if (!email.matterId)
          throw new ValidationError("Email must be linked to a matter to create tasks");

        // Validate assignees belong to firm
        const assigneeIds = [
          ...new Set(
            data.tasks.map((t) => t.assigneeId).filter((id): id is string => typeof id === "string")
          ),
        ];

        if (assigneeIds.length > 0) {
          const firmUsers = await tx
            .select({ id: users.id })
            .from(users)
            .where(and(eq(users.firmId, firmId)));

          const firmUserIds = new Set(firmUsers.map((u) => u.id));
          const invalidIds = assigneeIds.filter((id) => !firmUserIds.has(id));
          if (invalidIds.length > 0)
            throw new ValidationError(`Invalid assigneeId(s): ${invalidIds.join(", ")}`);
        }

        // Create tasks
        const now = new Date();
        const taskValues = data.tasks.map((t) => {
          const dueDate = t.dueInDays ? new Date(now.getTime() + t.dueInDays * 86400000) : null;

          return {
            firmId,
            matterId: email.matterId!,
            title: t.title,
            description: t.description ?? null,
            priority: t.priority ?? "medium",
            status: "pending",
            dueDate,
            assigneeId: t.assigneeId ?? null,
            createdById: user.user.id,
            aiGenerated: true,
            aiSource: "email" as const,
            sourceEntityType: "email",
            sourceEntityId: email.id,
          };
        });

        const inserted = await tx.insert(tasks).values(taskValues).returning();

        // Create timeline event
        await createTimelineEvent(tx, {
          firmId,
          matterId: email.matterId!,
          type: "task_created",
          title: `Created ${inserted.length} task(s) from email`,
          actorType: "user",
          actorId: user.user.id,
          entityType: "email",
          entityId: email.id,
          occurredAt: now,
          metadata: { count: inserted.length, taskIds: inserted.map((t) => t.id) },
        });

        return inserted;
      });

      return NextResponse.json({ tasks: created }, { status: 201 });
    })
  )
);
