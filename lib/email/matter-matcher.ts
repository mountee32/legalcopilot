/**
 * Matter Matcher
 *
 * Matches inbound emails to matters using a strategy chain:
 *   1. Subject reference (MAT-XXXX-NNN pattern) — confidence 98
 *   2. Sender domain → client email → matter — confidence 70-85
 *   3. AI match (future) — confidence varies
 *
 * Short-circuits on the first match with confidence >= 80.
 */

import { eq, and, like, isNull } from "drizzle-orm";
import { matters, clients } from "@/lib/db/schema";

const CONFIDENCE_THRESHOLD = 80;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MatchInput {
  fromAddress: string;
  subject: string;
  bodyText?: string;
}

export interface MatchResult {
  matterId: string;
  method: "subject_reference" | "sender_domain" | "ai_match";
  confidence: number;
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

/**
 * Match an email to a matter. Returns null if no match found.
 * Strategy chain short-circuits on first match >= 80 confidence.
 */
export async function matchEmailToMatter(
  firmId: string,
  input: MatchInput,
  tx: any // Drizzle transaction
): Promise<MatchResult | null> {
  // Strategy 1: Subject reference
  const subjectMatch = await matchBySubjectReference(firmId, input.subject, tx);
  if (subjectMatch && subjectMatch.confidence >= CONFIDENCE_THRESHOLD) {
    return subjectMatch;
  }

  // Strategy 2: Sender domain
  const senderMatch = await matchBySenderDomain(firmId, input.fromAddress, tx);
  if (senderMatch && senderMatch.confidence >= CONFIDENCE_THRESHOLD) {
    return senderMatch;
  }

  // Return the best match below threshold if we have one, otherwise null
  if (subjectMatch) return subjectMatch;
  if (senderMatch) return senderMatch;

  return null;
}

// ---------------------------------------------------------------------------
// Strategy 1: Subject reference
// ---------------------------------------------------------------------------

/**
 * Look for matter reference patterns like MAT-XXXX-NNN in the subject line.
 * These are typically case numbers that staff include in correspondence.
 */
async function matchBySubjectReference(
  firmId: string,
  subject: string,
  tx: any
): Promise<MatchResult | null> {
  // Match patterns like MAT-DEMO-001, MAT-2024-123, REF-ABC-456
  const refPattern = /\b(MAT-[A-Z0-9]+-\d{3,})\b/i;
  const match = subject.match(refPattern);

  if (!match) return null;

  const reference = match[1].toUpperCase();

  const results = await tx
    .select({ id: matters.id })
    .from(matters)
    .where(and(eq(matters.firmId, firmId), eq(matters.reference, reference)))
    .limit(1);

  if (results.length === 0) return null;

  return {
    matterId: results[0].id,
    method: "subject_reference",
    confidence: 98,
  };
}

// ---------------------------------------------------------------------------
// Strategy 2: Sender domain
// ---------------------------------------------------------------------------

/**
 * Extract domain from sender, match against client emails, then find their active matters.
 * Multiple matches reduce confidence since we can't be sure which matter.
 */
async function matchBySenderDomain(
  firmId: string,
  fromAddress: string,
  tx: any
): Promise<MatchResult | null> {
  const emailAddr = fromAddress.toLowerCase();

  // First try exact email match on clients
  const exactClientMatches = await tx
    .select({ id: clients.id })
    .from(clients)
    .where(and(eq(clients.firmId, firmId), eq(clients.email, emailAddr)))
    .limit(5);

  if (exactClientMatches.length === 0) return null;

  // Find active matters for matched clients
  const clientIds = exactClientMatches.map((c: { id: string }) => c.id);

  // Query active matters for the first matched client
  const matterResults = await tx
    .select({ id: matters.id })
    .from(matters)
    .where(
      and(
        eq(matters.firmId, firmId),
        eq(matters.clientId, clientIds[0]),
        eq(matters.status, "active")
      )
    )
    .limit(5);

  if (matterResults.length === 0) return null;

  // Single active matter = higher confidence
  const confidence = matterResults.length === 1 ? 85 : 70;

  return {
    matterId: matterResults[0].id,
    method: "sender_domain",
    confidence,
  };
}
