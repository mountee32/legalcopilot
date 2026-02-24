import { describe, it, expect, vi } from "vitest";

vi.mock("bullmq", () => ({
  Queue: vi.fn(),
  Worker: vi.fn(() => ({ on: vi.fn() })),
}));

vi.mock("@/lib/queue/pipeline", () => ({
  advanceToNextStage: vi.fn(),
  STAGE_CONFIG: { reconcile: { concurrency: 5 } },
}));

vi.mock("@/lib/db", () => ({ db: {} }));
vi.mock("@/lib/db/schema", () => ({}));
vi.mock("@/lib/pipeline/taxonomy-loader", () => ({ loadPackById: vi.fn() }));

import { valuesMatch, reconcileFinding } from "@/lib/queue/workers/reconcile";

describe("valuesMatch", () => {
  it("matches exact values", () => {
    expect(valuesMatch("John Smith", "John Smith", "exact")).toBe(true);
  });

  it("rejects different exact values", () => {
    expect(valuesMatch("John Smith", "Jane Smith", "exact")).toBe(false);
  });

  it("matches fuzzy_text with different casing and punctuation", () => {
    expect(valuesMatch("ACME Corp.", "acme corp", "fuzzy_text")).toBe(true);
  });

  it("rejects different fuzzy_text values", () => {
    expect(valuesMatch("Acme Corp", "Beta Inc", "fuzzy_text")).toBe(false);
  });

  it("matches fuzzy_number within 1% tolerance", () => {
    expect(valuesMatch("$1,000.00", "$1,005.00", "fuzzy_number")).toBe(true);
  });

  it("rejects numbers outside 1% tolerance", () => {
    expect(valuesMatch("$1,000.00", "$1,050.00", "fuzzy_number")).toBe(false);
  });

  it("matches dates on the same calendar day", () => {
    expect(valuesMatch("2025-01-15", "2025-01-15T08:30:00Z", "date_range")).toBe(true);
  });

  it("rejects different dates", () => {
    expect(valuesMatch("2025-01-15", "2025-01-16", "date_range")).toBe(false);
  });

  it("falls back to exact match for semantic mode", () => {
    expect(valuesMatch("some value", "some value", "semantic")).toBe(true);
  });
});

describe("reconcileFinding", () => {
  it("returns auto_applied for new finding above threshold", () => {
    const result = reconcileFinding("John Smith", null, 0.95, undefined);
    expect(result.status).toBe("auto_applied");
    expect(result.existingValue).toBeNull();
  });

  it("returns pending for new finding below default threshold", () => {
    const result = reconcileFinding("John Smith", null, 0.7, undefined);
    expect(result.status).toBe("pending");
  });

  it("returns auto_applied when existing value matches (confirmed)", () => {
    const result = reconcileFinding("John Smith", "john smith", 0.9, undefined);
    expect(result.status).toBe("auto_applied");
    expect(result.existingValue).toBe("john smith");
  });

  it("returns conflict when existing value differs", () => {
    const result = reconcileFinding("John Smith", "Jane Doe", 0.9, undefined);
    expect(result.status).toBe("conflict");
    expect(result.existingValue).toBe("Jane Doe");
  });

  it("respects rule auto-apply threshold", () => {
    const rule = {
      id: "r-1",
      packId: "p-1",
      fieldKey: "claim_number",
      caseFieldMapping: "matter.claimNumber",
      conflictDetectionMode: "exact" as const,
      autoApplyThreshold: "0.950",
      requiresHumanReview: false,
      createdAt: new Date(),
    };

    // Below rule threshold
    expect(reconcileFinding("CLM-001", null, 0.9, rule).status).toBe("pending");
    // Above rule threshold
    expect(reconcileFinding("CLM-001", null, 0.96, rule).status).toBe("auto_applied");
  });

  it("forces pending when requiresHumanReview is true", () => {
    const rule = {
      id: "r-1",
      packId: "p-1",
      fieldKey: "diagnosis",
      caseFieldMapping: "matter.diagnosis",
      conflictDetectionMode: "fuzzy_text" as const,
      autoApplyThreshold: "0.800",
      requiresHumanReview: true,
      createdAt: new Date(),
    };

    const result = reconcileFinding("Disc herniation", null, 0.99, rule);
    expect(result.status).toBe("pending");
  });
});
