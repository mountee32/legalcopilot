/**
 * Document factory for creating test documents
 */
import { db } from "@/lib/db";
import { documents } from "@/lib/db/schema";
import { randomUUID } from "crypto";

export type DocumentType =
  | "letter_in"
  | "letter_out"
  | "email_in"
  | "email_out"
  | "contract"
  | "court_form"
  | "evidence"
  | "note"
  | "id_document"
  | "financial"
  | "other";

export type DocumentStatus = "draft" | "pending_review" | "approved" | "sent" | "archived";

export interface DocumentFactoryOptions {
  id?: string;
  firmId: string;
  matterId: string;
  title?: string;
  type?: DocumentType;
  status?: DocumentStatus;
  filename?: string;
  mimeType?: string;
  fileSize?: number;
  createdBy?: string | null;
  aiSummary?: string | null;
  extractedText?: string | null;
}

export interface TestDocument {
  id: string;
  firmId: string;
  matterId: string;
  title: string;
  type: string;
  status: string;
  filename: string | null;
  mimeType: string | null;
}

/**
 * Create a test document in the database
 */
export async function createDocument(options: DocumentFactoryOptions): Promise<TestDocument> {
  const id = options.id || randomUUID();
  const suffix = Date.now().toString(36);

  const documentData = {
    id,
    firmId: options.firmId,
    matterId: options.matterId,
    title: options.title || `Test Document ${suffix}`,
    type: options.type || "other",
    status: options.status || "draft",
    filename: options.filename || `test-file-${suffix}.pdf`,
    mimeType: options.mimeType || "application/pdf",
    fileSize: options.fileSize || 1024,
    createdBy: options.createdBy ?? null,
    aiSummary: options.aiSummary ?? null,
    extractedText: options.extractedText ?? null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const [document] = await db.insert(documents).values(documentData).returning();

  return {
    id: document.id,
    firmId: document.firmId,
    matterId: document.matterId,
    title: document.title,
    type: document.type,
    status: document.status,
    filename: document.filename,
    mimeType: document.mimeType,
  };
}

/**
 * Build document data without inserting into database
 */
export function buildDocumentData(
  firmId: string,
  matterId: string,
  options: Partial<DocumentFactoryOptions> = {}
): Record<string, unknown> {
  const suffix = Date.now().toString(36);

  return {
    firmId,
    matterId,
    title: options.title || `Test Document ${suffix}`,
    type: options.type || "other",
    status: options.status || "draft",
    filename: options.filename || `test-file-${suffix}.pdf`,
    mimeType: options.mimeType || "application/pdf",
  };
}

/**
 * Create a letter document
 */
export async function createLetter(
  firmId: string,
  matterId: string,
  direction: "in" | "out",
  options: Partial<DocumentFactoryOptions> = {}
): Promise<TestDocument> {
  return createDocument({
    ...options,
    firmId,
    matterId,
    type: direction === "in" ? "letter_in" : "letter_out",
    title:
      options.title ||
      `Letter ${direction === "in" ? "Received" : "Sent"} ${Date.now().toString(36)}`,
  });
}

/**
 * Create a contract document
 */
export async function createContract(
  firmId: string,
  matterId: string,
  options: Partial<DocumentFactoryOptions> = {}
): Promise<TestDocument> {
  return createDocument({
    ...options,
    firmId,
    matterId,
    type: "contract",
    title: options.title || `Contract ${Date.now().toString(36)}`,
  });
}
