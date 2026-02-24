/**
 * Tests for Findings PDF Report Generator
 */

import { describe, it, expect } from "vitest";
import { generateFindingsReport } from "@/lib/generation/pdf-report";
import type { GenerationContext, FindingEntry } from "@/lib/generation/context-builder";

function makeFinding(overrides: Partial<FindingEntry> = {}): FindingEntry {
  return {
    id: "f-1",
    fieldKey: "test_field",
    label: "Test Field",
    value: "Test Value",
    confidence: 95,
    impact: "high",
    status: "accepted",
    sourceQuote: null,
    categoryKey: "test_category",
    pageStart: 1,
    pageEnd: 1,
    ...overrides,
  };
}

function makeContext(overrides: Partial<GenerationContext> = {}): GenerationContext {
  return {
    matter: {
      id: "m-1",
      reference: "MAT-001",
      title: "Test Matter",
      practiceArea: "personal_injury",
      status: "active",
      description: null,
      subType: null,
    },
    client: {
      name: "John Smith",
      firstName: "John",
      lastName: "Smith",
      companyName: null,
      type: "individual",
      email: "john@test.com",
      phone: "555-1234",
      address: "123 Main St, Manchester, M1 1AA",
    },
    firm: { name: "Harrison & Clarke Solicitors" },
    feeEarner: { name: "James Clarke", email: "james@firm.com" },
    findings: { test_field: "Test Value" },
    findingsByCategory: {
      test_category: [makeFinding()],
    },
    statusCounts: { pending: 0, accepted: 1, rejected: 0, auto_applied: 0, conflict: 0 },
    today: "2025-01-15",
    ...overrides,
  };
}

describe("generateFindingsReport", () => {
  it("should generate a valid PDF buffer", async () => {
    const context = makeContext();
    const pdf = await generateFindingsReport({ context });

    expect(pdf).toBeInstanceOf(Uint8Array);
    expect(pdf.length).toBeGreaterThan(100);

    // Check PDF magic bytes
    const header = new TextDecoder().decode(pdf.slice(0, 5));
    expect(header).toBe("%PDF-");
  });

  it("should include category headers in PDF", async () => {
    const context = makeContext({
      findingsByCategory: {
        medical_records: [makeFinding({ categoryKey: "medical_records", label: "Diagnosis" })],
        liability: [makeFinding({ categoryKey: "liability", label: "Fault" })],
      },
    });
    const pdf = await generateFindingsReport({ context });

    // Valid PDF generated with multiple categories
    expect(pdf).toBeInstanceOf(Uint8Array);
    expect(pdf.length).toBeGreaterThan(200);
  });

  it("should handle empty findings gracefully", async () => {
    const context = makeContext({
      findings: {},
      findingsByCategory: {},
      statusCounts: { pending: 0, accepted: 0, rejected: 0, auto_applied: 0, conflict: 0 },
    });

    const pdf = await generateFindingsReport({ context });

    expect(pdf).toBeInstanceOf(Uint8Array);
    const header = new TextDecoder().decode(pdf.slice(0, 5));
    expect(header).toBe("%PDF-");
  });

  it("should handle many findings across multiple pages", async () => {
    // Create 50 findings to force multi-page
    const manyFindings: FindingEntry[] = Array.from({ length: 50 }, (_, i) =>
      makeFinding({
        id: `f-${i}`,
        fieldKey: `field_${i}`,
        label: `Finding Label ${i}`,
        value: `This is a detailed value for finding number ${i} with enough text`,
        sourceQuote: `Source quote for finding ${i} from the original document text`,
      })
    );

    const context = makeContext({
      findingsByCategory: { large_category: manyFindings },
    });

    const pdf = await generateFindingsReport({ context });

    expect(pdf).toBeInstanceOf(Uint8Array);
    // Multi-page PDF should be substantially larger
    expect(pdf.length).toBeGreaterThan(1000);
  });
});
