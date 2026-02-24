import { describe, it, expect } from "vitest";
import { valuesMatch, calculateMetrics, formatReport } from "@tests/eval/metrics";
import type { ClassificationResult, ExtractionResult } from "@tests/eval/types";

describe("valuesMatch (eval)", () => {
  it("matches exact values", () => {
    expect(valuesMatch("John Smith", "John Smith")).toBe(true);
  });

  it("matches normalized text (case + punctuation)", () => {
    expect(valuesMatch("ACME Corp.", "acme corp")).toBe(true);
  });

  it("matches partial containment", () => {
    expect(valuesMatch("Dr. Robert K. Chen, MD", "Robert K. Chen")).toBe(true);
  });

  it("matches same calendar dates", () => {
    expect(valuesMatch("2025-01-15", "2025-01-15T00:00:00Z")).toBe(true);
  });

  it("matches numbers within 1%", () => {
    expect(valuesMatch("$1,413.46", "1413.46")).toBe(true);
  });

  it("rejects different values", () => {
    expect(valuesMatch("John Smith", "Jane Doe")).toBe(false);
  });
});

describe("calculateMetrics", () => {
  it("computes correct classification accuracy", () => {
    const classResults: ClassificationResult[] = [
      { docId: "1", expectedType: "med", predictedType: "med", confidence: 0.9, correct: true },
      { docId: "2", expectedType: "wage", predictedType: "wage", confidence: 0.8, correct: true },
      { docId: "3", expectedType: "claim", predictedType: "med", confidence: 0.6, correct: false },
    ];

    const metrics = calculateMetrics(classResults, []);
    expect(metrics.classification.accuracy).toBeCloseTo(2 / 3);
    expect(metrics.classification.correct).toBe(2);
    expect(metrics.classification.total).toBe(3);
  });

  it("computes extraction precision/recall/F1", () => {
    const extResults: ExtractionResult[] = [
      // True positive
      {
        docId: "1",
        categoryKey: "c",
        fieldKey: "name",
        expectedValue: "John",
        extractedValue: "John",
        confidence: 0.9,
        matched: true,
        required: true,
      },
      // False positive (extracted but wrong)
      {
        docId: "1",
        categoryKey: "c",
        fieldKey: "dob",
        expectedValue: "1985",
        extractedValue: "1986",
        confidence: 0.7,
        matched: false,
        required: false,
      },
      // False negative (not extracted)
      {
        docId: "1",
        categoryKey: "c",
        fieldKey: "phone",
        expectedValue: "555",
        extractedValue: null,
        confidence: 0,
        matched: false,
        required: false,
      },
    ];

    const metrics = calculateMetrics([], extResults);
    // TP=1, FP=1, FN=1
    expect(metrics.extraction.truePositives).toBe(1);
    expect(metrics.extraction.falsePositives).toBe(1);
    expect(metrics.extraction.falseNegatives).toBe(1);
    expect(metrics.extraction.precision).toBeCloseTo(0.5);
    expect(metrics.extraction.recall).toBeCloseTo(0.5);
    expect(metrics.extraction.f1).toBeCloseTo(0.5);
  });

  it("computes per-field breakdown", () => {
    const extResults: ExtractionResult[] = [
      {
        docId: "1",
        categoryKey: "c",
        fieldKey: "name",
        expectedValue: "John",
        extractedValue: "John",
        confidence: 0.9,
        matched: true,
        required: true,
      },
      {
        docId: "2",
        categoryKey: "c",
        fieldKey: "name",
        expectedValue: "Jane",
        extractedValue: "Jane",
        confidence: 0.85,
        matched: true,
        required: true,
      },
      {
        docId: "3",
        categoryKey: "c",
        fieldKey: "name",
        expectedValue: "Bob",
        extractedValue: null,
        confidence: 0,
        matched: false,
        required: true,
      },
    ];

    const metrics = calculateMetrics([], extResults);
    expect(metrics.fieldBreakdown["c:name"]).toBeDefined();
    expect(metrics.fieldBreakdown["c:name"].expected).toBe(3);
    expect(metrics.fieldBreakdown["c:name"].found).toBe(2);
    expect(metrics.fieldBreakdown["c:name"].matched).toBe(2);
    expect(metrics.fieldBreakdown["c:name"].recall).toBeCloseTo(2 / 3);
    expect(metrics.fieldBreakdown["c:name"].precision).toBe(1);
  });

  it("handles empty inputs", () => {
    const metrics = calculateMetrics([], []);
    expect(metrics.totalDocuments).toBe(0);
    expect(metrics.classification.accuracy).toBe(0);
    expect(metrics.extraction.f1).toBe(0);
  });
});

describe("formatReport", () => {
  it("produces a readable string", () => {
    const metrics = calculateMetrics(
      [{ docId: "1", expectedType: "med", predictedType: "med", confidence: 0.9, correct: true }],
      [
        {
          docId: "1",
          categoryKey: "c",
          fieldKey: "name",
          expectedValue: "John",
          extractedValue: "John",
          confidence: 0.9,
          matched: true,
          required: true,
        },
      ]
    );

    const report = formatReport(metrics, "workers-comp");
    expect(report).toContain("workers-comp");
    expect(report).toContain("Accuracy");
    expect(report).toContain("F1 Score");
  });
});
