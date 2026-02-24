/**
 * AI Pipeline Evaluation — Metric Calculations
 *
 * Computes precision, recall, F1, and accuracy from eval results.
 */

import type { ClassificationResult, ExtractionResult, EvalMetrics } from "./types";

/**
 * Normalize a value for fuzzy matching during evaluation.
 */
function normalizeForMatch(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[.,;:!?'"()\-\/\\]/g, "")
    .replace(/\s+/g, " ");
}

/**
 * Check if an extracted value matches the expected gold value.
 * Uses fuzzy matching for text, exact matching for dates/numbers.
 */
export function valuesMatch(extracted: string, expected: string): boolean {
  // Exact match
  if (extracted.trim() === expected.trim()) return true;

  // Normalized text match
  if (normalizeForMatch(extracted) === normalizeForMatch(expected)) return true;

  // Check if extracted contains expected (partial match for longer text)
  if (
    normalizeForMatch(extracted).includes(normalizeForMatch(expected)) ||
    normalizeForMatch(expected).includes(normalizeForMatch(extracted))
  ) {
    return true;
  }

  // Date matching — compare ISO date portions
  const dateA = new Date(extracted);
  const dateB = new Date(expected);
  if (
    !isNaN(dateA.getTime()) &&
    !isNaN(dateB.getTime()) &&
    dateA.toISOString().slice(0, 10) === dateB.toISOString().slice(0, 10)
  ) {
    return true;
  }

  // Number matching — within 1%
  const numA = parseFloat(extracted.replace(/[,$%]/g, ""));
  const numB = parseFloat(expected.replace(/[,$%]/g, ""));
  if (!isNaN(numA) && !isNaN(numB)) {
    return Math.abs(numA - numB) <= Math.max(Math.abs(numA), Math.abs(numB)) * 0.01;
  }

  return false;
}

/**
 * Calculate aggregate evaluation metrics from results.
 */
export function calculateMetrics(
  classificationResults: ClassificationResult[],
  extractionResults: ExtractionResult[]
): EvalMetrics {
  // Classification
  const correct = classificationResults.filter((r) => r.correct).length;
  const avgClassConfidence =
    classificationResults.length > 0
      ? classificationResults.reduce((s, r) => s + r.confidence, 0) / classificationResults.length
      : 0;

  // Extraction
  const truePositives = extractionResults.filter((r) => r.matched).length;
  const falsePositives = extractionResults.filter(
    (r) => r.extractedValue !== null && !r.matched
  ).length;
  const falseNegatives = extractionResults.filter((r) => r.extractedValue === null).length;

  const precision =
    truePositives + falsePositives > 0 ? truePositives / (truePositives + falsePositives) : 0;
  const recall =
    truePositives + falseNegatives > 0 ? truePositives / (truePositives + falseNegatives) : 0;
  const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;

  const extractedWithValues = extractionResults.filter((r) => r.extractedValue !== null);
  const avgExtConfidence =
    extractedWithValues.length > 0
      ? extractedWithValues.reduce((s, r) => s + r.confidence, 0) / extractedWithValues.length
      : 0;

  // Per-field breakdown
  const fieldBreakdown: EvalMetrics["fieldBreakdown"] = {};
  for (const r of extractionResults) {
    const key = `${r.categoryKey}:${r.fieldKey}`;
    if (!fieldBreakdown[key]) {
      fieldBreakdown[key] = { expected: 0, found: 0, matched: 0, precision: 0, recall: 0 };
    }
    fieldBreakdown[key].expected++;
    if (r.extractedValue !== null) fieldBreakdown[key].found++;
    if (r.matched) fieldBreakdown[key].matched++;
  }

  // Calculate per-field precision/recall
  for (const fb of Object.values(fieldBreakdown)) {
    fb.precision = fb.found > 0 ? fb.matched / fb.found : 0;
    fb.recall = fb.expected > 0 ? fb.matched / fb.expected : 0;
  }

  return {
    totalDocuments: classificationResults.length,
    classification: {
      correct,
      total: classificationResults.length,
      accuracy: classificationResults.length > 0 ? correct / classificationResults.length : 0,
      avgConfidence: avgClassConfidence,
    },
    extraction: {
      truePositives,
      falsePositives,
      falseNegatives,
      precision,
      recall,
      f1,
      avgConfidence: avgExtConfidence,
    },
    fieldBreakdown,
  };
}

/**
 * Format metrics into a human-readable report string.
 */
export function formatReport(metrics: EvalMetrics, packKey: string): string {
  const lines: string[] = [
    `\n${"=".repeat(60)}`,
    `Pipeline Evaluation Report — ${packKey}`,
    `${"=".repeat(60)}`,
    ``,
    `Documents evaluated: ${metrics.totalDocuments}`,
    ``,
    `--- Classification ---`,
    `Accuracy: ${(metrics.classification.accuracy * 100).toFixed(1)}% (${metrics.classification.correct}/${metrics.classification.total})`,
    `Avg Confidence: ${(metrics.classification.avgConfidence * 100).toFixed(1)}%`,
    ``,
    `--- Extraction ---`,
    `Precision: ${(metrics.extraction.precision * 100).toFixed(1)}%`,
    `Recall:    ${(metrics.extraction.recall * 100).toFixed(1)}%`,
    `F1 Score:  ${(metrics.extraction.f1 * 100).toFixed(1)}%`,
    `Avg Confidence: ${(metrics.extraction.avgConfidence * 100).toFixed(1)}%`,
    ``,
    `TP: ${metrics.extraction.truePositives} | FP: ${metrics.extraction.falsePositives} | FN: ${metrics.extraction.falseNegatives}`,
    ``,
  ];

  // Per-field breakdown
  const fields = Object.entries(metrics.fieldBreakdown);
  if (fields.length > 0) {
    lines.push(`--- Per-Field Breakdown ---`);
    lines.push(`${"Field".padEnd(40)} P       R       E/F/M`);
    for (const [key, fb] of fields) {
      lines.push(
        `${key.padEnd(40)} ${(fb.precision * 100).toFixed(0).padStart(3)}%    ${(fb.recall * 100).toFixed(0).padStart(3)}%    ${fb.expected}/${fb.found}/${fb.matched}`
      );
    }
  }

  lines.push(`\n${"=".repeat(60)}`);
  return lines.join("\n");
}
