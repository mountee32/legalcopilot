/**
 * Task Notes API
 *
 * GET  /api/tasks/[id]/notes - List notes for a task
 * POST /api/tasks/[id]/notes - Create a new note
 */

import { NextRequest, NextResponse } from "next/server";
import { and, eq, desc, sql } from "drizzle-orm";
import { tasks, taskNotes, taskNoteAttachments, users, documents } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { CreateTaskNoteSchema, TaskNoteQuerySchema } from "@/lib/api/schemas";
import { createTimelineEvent } from "@/lib/timeline/createEvent";
import { withAuth } from "@/middleware/withAuth";
import { NotFoundError, ValidationError, withErrorHandler } from "@/middleware/withErrorHandler";
import { withPermission } from "@/middleware/withPermission";

/**
 * GET /api/tasks/[id]/notes
 * List notes for a task with pagination.
 */
export const GET = withErrorHandler(
  withAuth(
    withPermission("cases:read")(async (request: NextRequest, { params, user }) => {
      const taskId = params ? (await params).id : undefined;
      if (!taskId) throw new NotFoundError("Task not found");

      const firmId = await getOrCreateFirmIdForUser(user.user.id);
      const searchParams = Object.fromEntries(request.nextUrl.searchParams);
      const query = TaskNoteQuerySchema.parse(searchParams);

      const result = await withFirmDb(firmId, async (tx) => {
        // Verify task exists and belongs to firm
        const [task] = await tx
          .select({ id: tasks.id })
          .from(tasks)
          .where(and(eq(tasks.id, taskId), eq(tasks.firmId, firmId)))
          .limit(1);

        if (!task) throw new NotFoundError("Task not found");

        // Build where conditions
        const conditions = [eq(taskNotes.taskId, taskId), eq(taskNotes.firmId, firmId)];

        // Filter by current version only unless history requested
        if (!query.includeHistory) {
          conditions.push(eq(taskNotes.isCurrent, true));
        }

        // Filter by visibility if specified
        if (query.visibility) {
          conditions.push(eq(taskNotes.visibility, query.visibility));
        }

        const where = and(...conditions);

        // Get total count
        const [countRow] = await tx
          .select({ total: sql<number>`count(*)` })
          .from(taskNotes)
          .where(where);

        const total = Number(countRow?.total ?? 0);
        const offset = (query.page - 1) * query.limit;

        // Get notes with author info
        const notes = await tx
          .select({
            id: taskNotes.id,
            taskId: taskNotes.taskId,
            content: taskNotes.content,
            visibility: taskNotes.visibility,
            authorId: taskNotes.authorId,
            authorName: users.name,
            originalNoteId: taskNotes.originalNoteId,
            version: taskNotes.version,
            isCurrent: taskNotes.isCurrent,
            createdAt: taskNotes.createdAt,
          })
          .from(taskNotes)
          .leftJoin(users, eq(taskNotes.authorId, users.id))
          .where(where)
          .orderBy(desc(taskNotes.createdAt))
          .limit(query.limit)
          .offset(offset);

        const totalPages = Math.ceil(total / query.limit);

        return {
          notes,
          pagination: {
            page: query.page,
            limit: query.limit,
            total,
            totalPages,
            hasNext: query.page < totalPages,
            hasPrev: query.page > 1,
          },
        };
      });

      return NextResponse.json(result);
    })
  )
);

/**
 * POST /api/tasks/[id]/notes
 * Create a new note on a task.
 */
export const POST = withErrorHandler(
  withAuth(
    withPermission("cases:write")(async (request: NextRequest, { params, user }) => {
      const taskId = params ? (await params).id : undefined;
      if (!taskId) throw new NotFoundError("Task not found");

      const firmId = await getOrCreateFirmIdForUser(user.user.id);
      const body = await request.json();
      const data = CreateTaskNoteSchema.parse(body);

      const result = await withFirmDb(firmId, async (tx) => {
        // Verify task exists and belongs to firm
        const [task] = await tx
          .select({ id: tasks.id, matterId: tasks.matterId })
          .from(tasks)
          .where(and(eq(tasks.id, taskId), eq(tasks.firmId, firmId)))
          .limit(1);

        if (!task) throw new NotFoundError("Task not found");

        // Validate attachment document IDs if provided
        if (data.attachmentIds && data.attachmentIds.length > 0) {
          const docs = await tx
            .select({ id: documents.id })
            .from(documents)
            .where(and(eq(documents.firmId, firmId)));

          const validDocIds = new Set(docs.map((d) => d.id));
          const invalidIds = data.attachmentIds.filter((id) => !validDocIds.has(id));

          if (invalidIds.length > 0) {
            throw new ValidationError(`Invalid document IDs: ${invalidIds.join(", ")}`);
          }
        }

        // Create the note
        const [note] = await tx
          .insert(taskNotes)
          .values({
            firmId,
            taskId,
            content: data.content,
            visibility: data.visibility,
            authorId: user.user.id,
            version: 1,
            isCurrent: true,
          })
          .returning();

        // Create attachments if provided
        if (data.attachmentIds && data.attachmentIds.length > 0) {
          await tx.insert(taskNoteAttachments).values(
            data.attachmentIds.map((documentId) => ({
              noteId: note.id,
              documentId,
            }))
          );
        }

        // Create timeline event
        await createTimelineEvent(tx, {
          firmId,
          matterId: task.matterId,
          type: "note_added",
          title: "Note added to task",
          actorType: "user",
          actorId: user.user.id,
          entityType: "task_note",
          entityId: note.id,
          metadata: {
            taskId,
            visibility: data.visibility,
          },
          occurredAt: new Date(),
        });

        // Fetch attachments for response
        const attachments =
          data.attachmentIds && data.attachmentIds.length > 0
            ? await tx
                .select({
                  id: taskNoteAttachments.id,
                  noteId: taskNoteAttachments.noteId,
                  documentId: taskNoteAttachments.documentId,
                  documentName: documents.filename,
                  createdAt: taskNoteAttachments.createdAt,
                })
                .from(taskNoteAttachments)
                .leftJoin(documents, eq(taskNoteAttachments.documentId, documents.id))
                .where(eq(taskNoteAttachments.noteId, note.id))
            : [];

        return {
          ...note,
          attachments,
        };
      });

      return NextResponse.json(result, { status: 201 });
    })
  )
);
