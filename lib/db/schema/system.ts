/**
 * System & Infrastructure Schema
 *
 * Background jobs, file uploads, and other system-level tables.
 *
 * @see docs/backend-design.md Section 8 for infrastructure details
 */

import { pgTable, text, timestamp, uuid, jsonb } from "drizzle-orm/pg-core";
import { users } from "./users";

/**
 * Background job queue tracking.
 * Used alongside BullMQ for job status persistence.
 *
 * Job types include: email sending, document processing,
 * AI summarization, report generation, etc.
 */
export const jobs = pgTable("jobs", {
  id: uuid("id").primaryKey().defaultRandom(),

  /** Job type identifier (e.g., "email:send", "document:process") */
  name: text("name").notNull(),

  /** Job payload - varies by job type */
  data: jsonb("data"),

  /**
   * Job status lifecycle:
   * pending → processing → completed|failed
   */
  status: text("status").notNull().default("pending"),

  /** Result data on completion */
  result: jsonb("result"),

  /** Error message if job failed */
  error: text("error"),

  /** Number of retry attempts */
  attempts: text("attempts").default("0"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),

  /** When job finished (success or failure) */
  completedAt: timestamp("completed_at"),
});

/**
 * File uploads stored in MinIO.
 * Tracks metadata for all uploaded files.
 */
export const uploads = pgTable("uploads", {
  id: uuid("id").primaryKey().defaultRandom(),

  /** User who uploaded (null if system-generated) */
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),

  /** Storage filename (UUID-based) */
  filename: text("filename").notNull(),

  /** Original filename from upload */
  originalName: text("original_name").notNull(),

  /** MIME type (e.g., "application/pdf") */
  mimeType: text("mime_type").notNull(),

  /** File size in bytes */
  size: text("size").notNull(),

  /** MinIO bucket name */
  bucket: text("bucket").notNull(),

  /** Path within bucket */
  path: text("path").notNull(),

  /** Pre-signed or public URL */
  url: text("url").notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Type exports
export type Job = typeof jobs.$inferSelect;
export type NewJob = typeof jobs.$inferInsert;
export type Upload = typeof uploads.$inferSelect;
export type NewUpload = typeof uploads.$inferInsert;
