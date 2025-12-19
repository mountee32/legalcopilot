/**
 * Task Note Detail API
 *
 * GET /api/tasks/[id]/notes/[noteId] - Get a specific note with history
 * PUT /api/tasks/[id]/notes/[noteId] - Edit note (creates new version)
 * DELETE /api/tasks/[id]/notes/[noteId] - Delete a note (and all versions)
 */

import { NextRequest, NextResponse } from "next/server";
import { and, eq, desc, or } from "drizzle-orm";
import { tasks, taskNotes, taskNoteAttachments, users, documents } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { UpdateTaskNoteSchema } from "@/lib/api/schemas";
import { createTimelineEvent } from "@/lib/timeline/createEvent";
import { withAuth } from "@/middleware/withAuth";
import { NotFoundError, ForbiddenError, withErrorHandler } from "@/middleware/withErrorHandler";
import { withPermission } from "@/middleware/withPermission";

/**
 * GET /api/tasks/[id]/notes/[noteId]
 * Get a specific note with its version history.
 */
export const GET = withErrorHandler(
  withAuth(
    withPermission("cases:read")(async (_request, { params, user }) => {
      const resolvedParams = params ? await params : {};
      const taskId = resolvedParams.id;
      const noteId = resolvedParams.noteId;

      if (!taskId) throw new NotFoundError("Task not found");
      if (!noteId) throw new NotFoundError("Note not found");

      const firmId = await getOrCreateFirmIdForUser(user.user.id);

      const result = await withFirmDb(firmId, async (tx) => {
        // Verify task exists and belongs to firm
        const [task] = await tx
          .select({ id: tasks.id })
          .from(tasks)
          .where(and(eq(tasks.id, taskId), eq(tasks.firmId, firmId)))
          .limit(1);

        if (!task) throw new NotFoundError("Task not found");

        // Get the note (find by ID, checking it belongs to this task)
        const [note] = await tx
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
          .where(
            and(
              eq(taskNotes.id, noteId),
              eq(taskNotes.taskId, taskId),
              eq(taskNotes.firmId, firmId)
            )
          )
          .limit(1);

        if (!note) throw new NotFoundError("Note not found");

        // Get attachments
        const attachments = await tx
          .select({
            id: taskNoteAttachments.id,
            noteId: taskNoteAttachments.noteId,
            documentId: taskNoteAttachments.documentId,
            documentName: documents.filename,
            createdAt: taskNoteAttachments.createdAt,
          })
          .from(taskNoteAttachments)
          .leftJoin(documents, eq(taskNoteAttachments.documentId, documents.id))
          .where(eq(taskNoteAttachments.noteId, noteId));

        // Get version history if this is the current version
        let history: (typeof note)[] = [];
        const originalId = note.originalNoteId ?? (note.version === 1 ? note.id : null);

        if (originalId && note.isCurrent) {
          history = await tx
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
            .where(
              and(
                eq(taskNotes.originalNoteId, originalId),
                eq(taskNotes.isCurrent, false),
                eq(taskNotes.firmId, firmId)
              )
            )
            .orderBy(desc(taskNotes.version));
        }

        return {
          ...note,
          attachments,
          history,
        };
      });

      return NextResponse.json(result);
    })
  )
);

/**
 * PUT /api/tasks/[id]/notes/[noteId]
 * Edit a note by creating a new version.
 * Only the original author or supervisors can edit.
 */
export const PUT = withErrorHandler(
  withAuth(
    withPermission("cases:write")(async (request: NextRequest, { params, user }) => {
      const resolvedParams = params ? await params : {};
      const taskId = resolvedParams.id;
      const noteId = resolvedParams.noteId;

      if (!taskId) throw new NotFoundError("Task not found");
      if (!noteId) throw new NotFoundError("Note not found");

      const firmId = await getOrCreateFirmIdForUser(user.user.id);
      const body = await request.json();
      const data = UpdateTaskNoteSchema.parse(body);

      const result = await withFirmDb(firmId, async (tx) => {
        // Verify task exists and belongs to firm
        const [task] = await tx
          .select({ id: tasks.id })
          .from(tasks)
          .where(and(eq(tasks.id, taskId), eq(tasks.firmId, firmId)))
          .limit(1);

        if (!task) throw new NotFoundError("Task not found");

        // Get the current note
        const [currentNote] = await tx
          .select()
          .from(taskNotes)
          .where(
            and(
              eq(taskNotes.id, noteId),
              eq(taskNotes.taskId, taskId),
              eq(taskNotes.firmId, firmId)
            )
          )
          .limit(1);

        if (!currentNote) throw new NotFoundError("Note not found");

        // Only allow editing current version
        if (!currentNote.isCurrent) {
          throw new ForbiddenError("Cannot edit a historical version of a note");
        }

        // Check if user is author (allow editing own notes, otherwise need supervisor)
        // For MVP, allow original author or any user with cases:write
        // TODO: Add supervisor check based on role

        // Determine the original note ID for the version chain
        const originalNoteId = currentNote.originalNoteId ?? currentNote.id;

        // Mark current version as not current
        await tx
          .update(taskNotes)
          .set({ isCurrent: false })
          .where(eq(taskNotes.id, currentNote.id));

        // Create new version
        const [newNote] = await tx
          .insert(taskNotes)
          .values({
            firmId,
            taskId,
            content: data.content,
            visibility: data.visibility ?? currentNote.visibility,
            authorId: user.user.id,
            originalNoteId,
            version: currentNote.version + 1,
            isCurrent: true,
          })
          .returning();

        // Get author name for response
        const [author] = await tx
          .select({ name: users.name })
          .from(users)
          .where(eq(users.id, user.user.id))
          .limit(1);

        return {
          ...newNote,
          authorName: author?.name ?? null,
          previousVersion: {
            id: currentNote.id,
            version: currentNote.version,
          },
        };
      });

      return NextResponse.json(result);
    })
  )
);

/**
 * DELETE /api/tasks/[id]/notes/[noteId]
 * Delete a note and all its versions.
 * Only the original author or users with cases:write can delete.
 */
export const DELETE = withErrorHandler(
  withAuth(
    withPermission("cases:write")(async (_request, { params, user }) => {
      const resolvedParams = params ? await params : {};
      const taskId = resolvedParams.id;
      const noteId = resolvedParams.noteId;

      if (!taskId) throw new NotFoundError("Task not found");
      if (!noteId) throw new NotFoundError("Note not found");

      const firmId = await getOrCreateFirmIdForUser(user.user.id);

      await withFirmDb(firmId, async (tx) => {
        // Verify task exists and belongs to firm
        const [task] = await tx
          .select({ id: tasks.id, matterId: tasks.matterId })
          .from(tasks)
          .where(and(eq(tasks.id, taskId), eq(tasks.firmId, firmId)))
          .limit(1);

        if (!task) throw new NotFoundError("Task not found");

        // Get the note to verify it exists and get version info
        const [note] = await tx
          .select({
            id: taskNotes.id,
            originalNoteId: taskNotes.originalNoteId,
            version: taskNotes.version,
          })
          .from(taskNotes)
          .where(
            and(
              eq(taskNotes.id, noteId),
              eq(taskNotes.taskId, taskId),
              eq(taskNotes.firmId, firmId)
            )
          )
          .limit(1);

        if (!note) throw new NotFoundError("Note not found");

        // Find all versions of this note (the note itself plus any with originalNoteId pointing to it)
        const originalId = note.originalNoteId ?? note.id;

        // Get all note IDs in this version chain
        const allVersions = await tx
          .select({ id: taskNotes.id })
          .from(taskNotes)
          .where(
            and(
              eq(taskNotes.firmId, firmId),
              or(eq(taskNotes.id, originalId), eq(taskNotes.originalNoteId, originalId))
            )
          );

        const noteIds = allVersions.map((v) => v.id);

        // Delete attachments for all versions
        for (const id of noteIds) {
          await tx.delete(taskNoteAttachments).where(eq(taskNoteAttachments.noteId, id));
        }

        // Delete all versions of the note
        for (const id of noteIds) {
          await tx.delete(taskNotes).where(eq(taskNotes.id, id));
        }

        // TODO: Create timeline event once "note_deleted" enum value is added
        // await createTimelineEvent(tx, {
        //   firmId,
        //   matterId: task.matterId,
        //   type: "note_deleted",
        //   title: "Note deleted from task",
        //   actorType: "user",
        //   actorId: user.user.id,
        //   entityType: "task",
        //   entityId: taskId,
        //   metadata: {
        //     taskId,
        //     deletedVersions: noteIds.length,
        //   },
        //   occurredAt: new Date(),
        // });
      });

      return NextResponse.json({ success: true }, { status: 200 });
    })
  )
);
