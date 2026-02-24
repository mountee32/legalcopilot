import { describe, it, expect } from "vitest";
import { deduplicateFindings, classifyImpact, processFindings } from "@/lib/pipeline/findings";

describe("deduplicateFindings", () => {
  it("removes duplicate findings keeping highest confidence", () => {
    const findings = [
      { categoryKey: "claimant", fieldKey: "name", value: "John Smith", confidence: 0.8 },
      { categoryKey: "claimant", fieldKey: "name", value: "John Smith", confidence: 0.95 },
      { categoryKey: "claimant", fieldKey: "name", value: "john smith", confidence: 0.7 }, // same normalized
    ];

    const deduped = deduplicateFindings(findings);
    expect(deduped).toHaveLength(1);
    expect(deduped[0].confidence).toBe(0.95);
  });

  it("keeps findings with different values for same field", () => {
    const findings = [
      { categoryKey: "dates", fieldKey: "injury_date", value: "2025-01-15", confidence: 0.9 },
      { categoryKey: "dates", fieldKey: "injury_date", value: "2025-03-20", confidence: 0.85 },
    ];

    const deduped = deduplicateFindings(findings);
    expect(deduped).toHaveLength(2);
  });

  it("keeps findings for different fields", () => {
    const findings = [
      { categoryKey: "claimant", fieldKey: "name", value: "John Smith", confidence: 0.9 },
      { categoryKey: "claimant", fieldKey: "dob", value: "1985-03-15", confidence: 0.85 },
    ];

    const deduped = deduplicateFindings(findings);
    expect(deduped).toHaveLength(2);
  });

  it("handles empty input", () => {
    expect(deduplicateFindings([])).toEqual([]);
  });

  it("normalizes punctuation and case for dedup", () => {
    const findings = [
      { categoryKey: "info", fieldKey: "employer", value: "Acme Corp.", confidence: 0.8 },
      { categoryKey: "info", fieldKey: "employer", value: "acme corp", confidence: 0.9 },
    ];

    const deduped = deduplicateFindings(findings);
    expect(deduped).toHaveLength(1);
    expect(deduped[0].confidence).toBe(0.9);
  });
});

describe("classifyImpact", () => {
  it("classifies deadline-related fields as critical", () => {
    expect(
      classifyImpact({
        categoryKey: "dates",
        fieldKey: "statute_of_limitation_date",
        value: "2025",
        confidence: 0.9,
      })
    ).toBe("critical");

    expect(
      classifyImpact({
        categoryKey: "dates",
        fieldKey: "filing_date",
        value: "2025",
        confidence: 0.9,
      })
    ).toBe("critical");

    expect(
      classifyImpact({
        categoryKey: "injury",
        fieldKey: "injury_date",
        value: "2025",
        confidence: 0.9,
      })
    ).toBe("critical");
  });

  it("classifies party-related fields as high", () => {
    expect(
      classifyImpact({
        categoryKey: "parties",
        fieldKey: "claimant_name",
        value: "Smith",
        confidence: 0.9,
      })
    ).toBe("high");

    expect(
      classifyImpact({
        categoryKey: "parties",
        fieldKey: "defendant_name",
        value: "Jones",
        confidence: 0.9,
      })
    ).toBe("high");
  });

  it("classifies low-confidence findings as high impact", () => {
    expect(
      classifyImpact({
        categoryKey: "other",
        fieldKey: "some_field",
        value: "value",
        confidence: 0.3,
      })
    ).toBe("high");
  });

  it("classifies medium-confidence generic fields as medium", () => {
    expect(
      classifyImpact({
        categoryKey: "other",
        fieldKey: "some_field",
        value: "value",
        confidence: 0.75,
      })
    ).toBe("medium");
  });

  it("respects requiresHumanReview field flag", () => {
    const field = { requiresHumanReview: true } as any;
    expect(
      classifyImpact(
        { categoryKey: "other", fieldKey: "some_field", value: "value", confidence: 0.9 },
        field
      )
    ).toBe("high");
  });
});

describe("processFindings", () => {
  it("labels findings from field map", () => {
    const fieldMap = new Map([["claimant:name", { label: "Claimant Full Name" } as any]]);

    const processed = processFindings(
      [{ categoryKey: "claimant", fieldKey: "name", value: "John", confidence: 0.9 }],
      fieldMap
    );

    expect(processed[0].label).toBe("Claimant Full Name");
  });

  it("falls back to fieldKey when no label in map", () => {
    const processed = processFindings(
      [{ categoryKey: "claimant", fieldKey: "name", value: "John", confidence: 0.9 }],
      new Map()
    );

    expect(processed[0].label).toBe("name");
  });
});
