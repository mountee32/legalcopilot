/**
 * Conflict Check factory for creating test conflict checks
 */
import { db } from "@/lib/db";
import { conflictChecks } from "@/lib/db/schema";
import { randomUUID } from "crypto";

export type ConflictCheckStatus = "pending" | "clear" | "conflict" | "waived";

export interface ConflictCheckFactoryOptions {
  id?: string;
  firmId: string;
  matterId: string;
  searchTerms?: Record<string, unknown>;
  results?: Record<string, unknown>;
  status?: ConflictCheckStatus;
  decidedBy?: string | null;
  decidedAt?: Date | null;
  decisionReason?: string | null;
  waiverReason?: string | null;
  createdById?: string | null;
}

export interface TestConflictCheck {
  id: string;
  firmId: string;
  matterId: string;
  searchTerms: Record<string, unknown> | null;
  results: Record<string, unknown> | null;
  status: string;
  decidedBy: string | null;
  decidedAt: Date | null;
  decisionReason: string | null;
  waiverReason: string | null;
  createdById: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Create a test conflict check in the database
 */
export async function createConflictCheck(
  options: ConflictCheckFactoryOptions
): Promise<TestConflictCheck> {
  const id = options.id || randomUUID();

  const conflictData = {
    id,
    firmId: options.firmId,
    matterId: options.matterId,
    searchTerms: options.searchTerms || null,
    results: options.results || null,
    status: options.status || "pending",
    decidedBy: options.decidedBy ?? null,
    decidedAt: options.decidedAt ?? null,
    decisionReason: options.decisionReason ?? null,
    waiverReason: options.waiverReason ?? null,
    createdById: options.createdById ?? null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const [conflictCheck] = await db.insert(conflictChecks).values(conflictData).returning();

  return {
    id: conflictCheck.id,
    firmId: conflictCheck.firmId,
    matterId: conflictCheck.matterId,
    searchTerms: conflictCheck.searchTerms as Record<string, unknown> | null,
    results: conflictCheck.results as Record<string, unknown> | null,
    status: conflictCheck.status,
    decidedBy: conflictCheck.decidedBy,
    decidedAt: conflictCheck.decidedAt,
    decisionReason: conflictCheck.decisionReason,
    waiverReason: conflictCheck.waiverReason,
    createdById: conflictCheck.createdById,
    createdAt: conflictCheck.createdAt,
    updatedAt: conflictCheck.updatedAt,
  };
}

/**
 * Create a pending conflict check
 */
export async function createPendingConflictCheck(
  firmId: string,
  matterId: string,
  searchTerms: Record<string, unknown>,
  options: Partial<ConflictCheckFactoryOptions> = {}
): Promise<TestConflictCheck> {
  return createConflictCheck({
    ...options,
    firmId,
    matterId,
    searchTerms,
    status: "pending",
  });
}

/**
 * Create a cleared conflict check (no conflicts found)
 */
export async function createClearedConflictCheck(
  firmId: string,
  matterId: string,
  decidedBy: string,
  options: Partial<ConflictCheckFactoryOptions> = {}
): Promise<TestConflictCheck> {
  return createConflictCheck({
    ...options,
    firmId,
    matterId,
    status: "clear",
    decidedBy,
    decidedAt: new Date(),
    decisionReason: options.decisionReason || "No conflicts detected",
  });
}

/**
 * Create a conflict check with detected conflicts
 */
export async function createConflictedCheck(
  firmId: string,
  matterId: string,
  conflictMatches: Record<string, unknown>[],
  options: Partial<ConflictCheckFactoryOptions> = {}
): Promise<TestConflictCheck> {
  return createConflictCheck({
    ...options,
    firmId,
    matterId,
    status: "conflict",
    results: { matches: conflictMatches },
  });
}

/**
 * Create a waived conflict check
 */
export async function createWaivedConflictCheck(
  firmId: string,
  matterId: string,
  decidedBy: string,
  waiverReason: string,
  options: Partial<ConflictCheckFactoryOptions> = {}
): Promise<TestConflictCheck> {
  return createConflictCheck({
    ...options,
    firmId,
    matterId,
    status: "waived",
    decidedBy,
    decidedAt: new Date(),
    waiverReason,
  });
}
