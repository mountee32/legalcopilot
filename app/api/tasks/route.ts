import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, sql } from "drizzle-orm";
import { matters, tasks } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { CreateTaskSchema, TaskQuerySchema } from "@/lib/api/schemas";
import { createTimelineEvent } from "@/lib/timeline/createEvent";
import { createNotification } from "@/lib/notifications/create";
import { withAuth } from "@/middleware/withAuth";
import { NotFoundError, withErrorHandler } from "@/middleware/withErrorHandler";
import { withPermission } from "@/middleware/withPermission";

export const GET = withErrorHandler(
  withAuth(
    withPermission("cases:read")(async (request: NextRequest, { user }) => {
      const url = new URL(request.url);
      const query = TaskQuerySchema.parse(Object.fromEntries(url.searchParams.entries()));

      const firmId = await getOrCreateFirmIdForUser(user.user.id);
      const offset = (query.page - 1) * query.limit;

      const whereClauses = [eq(tasks.firmId, firmId)];
      if (query.matterId) whereClauses.push(eq(tasks.matterId, query.matterId));
      if (query.assigneeId) whereClauses.push(eq(tasks.assigneeId, query.assigneeId));
      if (query.status) whereClauses.push(eq(tasks.status, query.status));
      if (query.priority) whereClauses.push(eq(tasks.priority, query.priority));
      if (query.aiGenerated !== undefined)
        whereClauses.push(eq(tasks.aiGenerated, query.aiGenerated));

      const where = and(...whereClauses);

      const { total, rows } = await withFirmDb(firmId, async (tx) => {
        const [countRow] = await tx
          .select({ total: sql<number>`count(*)` })
          .from(tasks)
          .where(where);

        const rows = await tx
          .select()
          .from(tasks)
          .where(where)
          .orderBy(desc(tasks.createdAt))
          .limit(query.limit)
          .offset(offset);

        return { total: Number(countRow?.total ?? 0), rows };
      });

      const totalPages = Math.max(1, Math.ceil(total / query.limit));

      return NextResponse.json({
        tasks: rows,
        pagination: {
          page: query.page,
          limit: query.limit,
          total,
          totalPages,
          hasNext: query.page < totalPages,
          hasPrev: query.page > 1,
        },
      });
    })
  )
);

export const POST = withErrorHandler(
  withAuth(
    withPermission("cases:write")(async (request: NextRequest, { user }) => {
      const firmId = await getOrCreateFirmIdForUser(user.user.id);
      const body = await request.json();
      const data = CreateTaskSchema.parse(body);

      const task = await withFirmDb(firmId, async (tx) => {
        const [matter] = await tx
          .select({ id: matters.id })
          .from(matters)
          .where(and(eq(matters.id, data.matterId), eq(matters.firmId, firmId)))
          .limit(1);

        if (!matter) throw new NotFoundError("Matter not found");

        const [task] = await tx
          .insert(tasks)
          .values({
            firmId,
            matterId: data.matterId,
            title: data.title,
            description: data.description ?? null,
            assigneeId: data.assigneeId ?? null,
            createdById: user.user.id,
            priority: data.priority ?? "medium",
            status: "pending",
            dueDate: data.dueDate ? new Date(data.dueDate) : null,
            checklistItems: data.checklistItems ?? null,
            tags: data.tags ?? null,
          })
          .returning();

        await createTimelineEvent(tx, {
          firmId,
          matterId: task.matterId,
          type: "task_created",
          title: "Task created",
          actorType: "user",
          actorId: user.user.id,
          entityType: "task",
          entityId: task.id,
          occurredAt: new Date(),
          metadata: { priority: task.priority, assigneeId: task.assigneeId },
        });

        if (data.assigneeId && data.assigneeId !== user.user.id) {
          await createNotification(tx, {
            firmId,
            userId: data.assigneeId,
            type: "task_assigned",
            title: `You've been assigned: ${task.title}`,
            body: task.description ?? undefined,
            link: `/matters/${task.matterId}?tab=tasks`,
            metadata: { taskId: task.id, matterId: task.matterId },
          });
        }

        return task;
      });

      return NextResponse.json(task, { status: 201 });
    })
  )
);
