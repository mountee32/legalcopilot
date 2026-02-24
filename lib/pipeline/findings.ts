/**
 * Pipeline Findings Utilities
 *
 * Dedup, confidence scoring, and impact classification helpers
 * for pipeline extraction results.
 */

import type { TaxonomyField } from "@/lib/db/schema";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RawFinding {
  categoryKey: string;
  fieldKey: string;
  value: string;
  sourceQuote?: string;
  confidence: number;
}

export interface ProcessedFinding extends RawFinding {
  label: string;
  impact: "critical" | "high" | "medium" | "low" | "info";
  isDuplicate: boolean;
}

// ---------------------------------------------------------------------------
// Dedup
// ---------------------------------------------------------------------------

/**
 * Deduplicate findings from overlapping chunks.
 *
 * Two findings are considered duplicates if they share the same fieldKey
 * and have similar values. When duplicates are found, keep the one with
 * higher confidence.
 */
export function deduplicateFindings(findings: RawFinding[]): RawFinding[] {
  const seen = new Map<string, RawFinding>();

  for (const finding of findings) {
    const key = `${finding.categoryKey}:${finding.fieldKey}`;
    const normalizedValue = normalizeValue(finding.value);
    const dedupKey = `${key}:${normalizedValue}`;

    const existing = seen.get(dedupKey);
    if (!existing || finding.confidence > existing.confidence) {
      seen.set(dedupKey, finding);
    }
  }

  return Array.from(seen.values());
}

/**
 * Normalize a value for dedup comparison. Trims whitespace, lowercases,
 * and removes common noise characters.
 */
function normalizeValue(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[.,;:!?'"]/g, "")
    .replace(/\s+/g, " ");
}

// ---------------------------------------------------------------------------
// Impact classification
// ---------------------------------------------------------------------------

/** Critical field keys that affect case outcomes or deadlines */
const CRITICAL_FIELD_PATTERNS = [
  /statute.*limitation/i,
  /limitation.*date/i,
  /deadline/i,
  /filing.*date/i,
  /injury.*date/i,
  /incident.*date/i,
  /death.*date/i,
  /damages.*total/i,
  /settlement.*amount/i,
];

/** High impact field keys */
const HIGH_IMPACT_PATTERNS = [
  /claimant/i,
  /defendant/i,
  /plaintiff/i,
  /respondent/i,
  /employer/i,
  /insured/i,
  /policy.*number/i,
  /claim.*number/i,
  /cause.*action/i,
  /liability/i,
  /diagnosis/i,
];

/**
 * Classify the impact of a finding based on its field key and the
 * taxonomy field configuration.
 */
export function classifyImpact(
  finding: RawFinding,
  field?: TaxonomyField
): "critical" | "high" | "medium" | "low" | "info" {
  const fullKey = `${finding.categoryKey}_${finding.fieldKey}`;

  // Check critical patterns
  if (CRITICAL_FIELD_PATTERNS.some((p) => p.test(fullKey) || p.test(finding.fieldKey))) {
    return "critical";
  }

  // Check high-impact patterns
  if (HIGH_IMPACT_PATTERNS.some((p) => p.test(fullKey) || p.test(finding.fieldKey))) {
    return "high";
  }

  // If field requires human review, treat as high
  if (field?.requiresHumanReview) {
    return "high";
  }

  // Low confidence = higher impact (needs attention)
  if (finding.confidence < 0.5) {
    return "high";
  }

  if (finding.confidence < 0.7) {
    return "medium";
  }

  return "medium";
}

/**
 * Process raw findings: label them, classify impact, and mark duplicates.
 */
export function processFindings(
  rawFindings: RawFinding[],
  fieldMap: Map<string, TaxonomyField>
): ProcessedFinding[] {
  const deduped = deduplicateFindings(rawFindings);
  const dedupedKeys = new Set(
    deduped.map((f) => `${f.categoryKey}:${f.fieldKey}:${normalizeValue(f.value)}`)
  );

  return rawFindings.map((finding) => {
    const field = fieldMap.get(`${finding.categoryKey}:${finding.fieldKey}`);
    const normalizedKey = `${finding.categoryKey}:${finding.fieldKey}:${normalizeValue(finding.value)}`;
    const isKept = dedupedKeys.has(normalizedKey);

    return {
      ...finding,
      label: field?.label || finding.fieldKey,
      impact: classifyImpact(finding, field),
      isDuplicate: !isKept,
    };
  });
}
