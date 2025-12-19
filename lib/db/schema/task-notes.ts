/**
 * Task Notes Schema
 *
 * Notes are commentary attached to tasks.
 * Immutable with edit history preserved. Visibility controlled.
 *
 * @see backlog/dev/FEAT-enhanced-task-model.md for design specification
 */

import {
  pgTable,
  text,
  timestamp,
  uuid,
  pgEnum,
  boolean,
  integer,
  index,
} from "drizzle-orm/pg-core";
import { firms } from "./firms";
import { users } from "./users";
import { documents } from "./documents";

/**
 * Visibility level for notes.
 * - internal: Staff only (default)
 * - client_visible: Visible in client portal
 */
export const noteVisibilityEnum = pgEnum("note_visibility", ["internal", "client_visible"]);

/**
 * Task notes with versioning.
 * Notes are never deleted - edits create new versions.
 * Only the current version (isCurrent=true) is shown by default.
 */
export const taskNotes = pgTable(
  "task_notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    firmId: uuid("firm_id")
      .notNull()
      .references(() => firms.id, { onDelete: "cascade" }),

    /**
     * Task this note belongs to.
     * Note: Forward reference - tasks table imports are circular.
     * We use uuid without reference here; integrity enforced at app layer.
     */
    taskId: uuid("task_id").notNull(),

    /** Rich text content (HTML from limited editor) */
    content: text("content").notNull(),

    /** Visibility level */
    visibility: noteVisibilityEnum("visibility").notNull().default("internal"),

    /** User who created/edited this note version */
    authorId: uuid("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),

    /**
     * If this is an edit, reference to original note.
     * Null for original notes; set to original note ID for edits.
     */
    originalNoteId: uuid("original_note_id"),

    /** Edit version number (1 = original, 2 = first edit, etc.) */
    version: integer("version").notNull().default(1),

    /** Is this the current (latest) version? */
    isCurrent: boolean("is_current").notNull().default(true),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    /** Index for finding notes by task */
    taskIdx: index("task_notes_task_idx").on(t.taskId),
    /** Index for finding note history by original */
    originalIdx: index("task_notes_original_idx").on(t.originalNoteId),
    /** Index for finding current notes by firm */
    firmCurrentIdx: index("task_notes_firm_current_idx").on(t.firmId, t.isCurrent),
  })
);

/**
 * Attachments on notes (separate from evidence).
 * Allows attaching documents to notes for context.
 */
export const taskNoteAttachments = pgTable(
  "task_note_attachments",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    /** Note this attachment belongs to */
    noteId: uuid("note_id")
      .notNull()
      .references(() => taskNotes.id, { onDelete: "cascade" }),

    /** Linked document */
    documentId: uuid("document_id")
      .notNull()
      .references(() => documents.id, { onDelete: "cascade" }),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    /** Index for finding attachments by note */
    noteIdx: index("task_note_attachments_note_idx").on(t.noteId),
  })
);

// Type exports
export type TaskNote = typeof taskNotes.$inferSelect;
export type NewTaskNote = typeof taskNotes.$inferInsert;

export type TaskNoteAttachment = typeof taskNoteAttachments.$inferSelect;
export type NewTaskNoteAttachment = typeof taskNoteAttachments.$inferInsert;
