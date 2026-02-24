import { describe, it, expect, vi } from "vitest";

vi.mock("bullmq", () => ({
  Queue: vi.fn(),
  Worker: vi.fn(() => ({ on: vi.fn() })),
}));

vi.mock("@/lib/queue/pipeline", () => ({
  advanceToNextStage: vi.fn(),
  STAGE_CONFIG: { actions: { concurrency: 5 } },
}));

vi.mock("@/lib/db", () => ({ db: {} }));
vi.mock("@/lib/db/schema", () => ({}));
vi.mock("@/lib/pipeline/taxonomy-loader", () => ({ loadPackById: vi.fn() }));

import { evaluateTrigger, processTriggers } from "@/lib/queue/workers/actions";

describe("evaluateTrigger", () => {
  it("matches 'exists' when findings present", () => {
    const findingsMap = new Map([
      ["injury_details:injury_date", [{ value: "2025-01-15", confidence: 0.9 }]],
    ]);

    const result = evaluateTrigger(
      { fieldKey: "injury_date", categoryKey: "injury_details", operator: "exists" },
      findingsMap
    );
    expect(result.matched).toBe(true);
    expect(result.matchedFinding?.value).toBe("2025-01-15");
  });

  it("does not match 'exists' when findings absent", () => {
    const findingsMap = new Map<string, { value: string; confidence: number }[]>();
    const result = evaluateTrigger(
      { fieldKey: "injury_date", categoryKey: "injury_details", operator: "exists" },
      findingsMap
    );
    expect(result.matched).toBe(false);
  });

  it("matches 'equals' when value matches", () => {
    const findingsMap = new Map([
      ["employer_info:employer_contested", [{ value: "true", confidence: 0.9 }]],
    ]);

    const result = evaluateTrigger(
      {
        fieldKey: "employer_contested",
        categoryKey: "employer_info",
        operator: "equals",
        value: "true",
      },
      findingsMap
    );
    expect(result.matched).toBe(true);
  });

  it("does not match 'equals' when value differs", () => {
    const findingsMap = new Map([
      ["employer_info:employer_contested", [{ value: "false", confidence: 0.9 }]],
    ]);

    const result = evaluateTrigger(
      {
        fieldKey: "employer_contested",
        categoryKey: "employer_info",
        operator: "equals",
        value: "true",
      },
      findingsMap
    );
    expect(result.matched).toBe(false);
  });

  it("matches 'contains' with case-insensitive substring", () => {
    const findingsMap = new Map([
      ["medical_treatment:diagnosis", [{ value: "Lumbar disc herniation L4-L5", confidence: 0.9 }]],
    ]);

    const result = evaluateTrigger(
      {
        fieldKey: "diagnosis",
        categoryKey: "medical_treatment",
        operator: "contains",
        value: "herniation",
      },
      findingsMap
    );
    expect(result.matched).toBe(true);
  });

  it("matches 'gt' for numeric values above threshold", () => {
    const findingsMap = new Map([
      ["benefits_compensation:settlement_amount", [{ value: "$137,500.00", confidence: 0.95 }]],
    ]);

    const result = evaluateTrigger(
      {
        fieldKey: "settlement_amount",
        categoryKey: "benefits_compensation",
        operator: "gt",
        value: 100000,
      },
      findingsMap
    );
    expect(result.matched).toBe(true);
  });

  it("does not match 'gt' for values below threshold", () => {
    const findingsMap = new Map([
      ["benefits_compensation:settlement_amount", [{ value: "$50,000.00", confidence: 0.95 }]],
    ]);

    const result = evaluateTrigger(
      {
        fieldKey: "settlement_amount",
        categoryKey: "benefits_compensation",
        operator: "gt",
        value: 100000,
      },
      findingsMap
    );
    expect(result.matched).toBe(false);
  });

  it("matches 'date_within_days' for dates within range", () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 15);
    const findingsMap = new Map([
      [
        "medical_treatment:mmi_date",
        [{ value: futureDate.toISOString().slice(0, 10), confidence: 0.9 }],
      ],
    ]);

    const result = evaluateTrigger(
      {
        fieldKey: "mmi_date",
        categoryKey: "medical_treatment",
        operator: "date_within_days",
        value: 30,
      },
      findingsMap
    );
    expect(result.matched).toBe(true);
  });

  it("falls back to fieldKey lookup when full key not found", () => {
    const findingsMap = new Map([["injury_date", [{ value: "2025-01-15", confidence: 0.9 }]]]);

    const result = evaluateTrigger({ fieldKey: "injury_date", operator: "exists" }, findingsMap);
    expect(result.matched).toBe(true);
  });
});

describe("processTriggers", () => {
  it("returns matched triggers with finding data", () => {
    const triggers = [
      {
        id: "t-1",
        packId: "p-1",
        triggerType: "deadline" as const,
        name: "Statute Alert",
        description: null,
        triggerCondition: {
          fieldKey: "statute_of_limitation_date",
          categoryKey: "injury_details",
          operator: "exists",
        },
        actionTemplate: {
          actionType: "create_deadline",
          title: "SOL Deadline",
        },
        jurisdictionSpecific: false,
        jurisdictionRules: null,
        isDeterministic: true,
        createdAt: new Date(),
      },
    ];

    const findingsMap = new Map([
      ["injury_details:statute_of_limitation_date", [{ value: "2027-01-15", confidence: 0.9 }]],
    ]);

    const results = processTriggers(triggers, findingsMap);
    expect(results).toHaveLength(1);
    expect(results[0].trigger.name).toBe("Statute Alert");
    expect(results[0].matchedFinding?.value).toBe("2027-01-15");
  });

  it("skips triggers without matching findings", () => {
    const triggers = [
      {
        id: "t-1",
        packId: "p-1",
        triggerType: "alert" as const,
        name: "Denial Alert",
        description: null,
        triggerCondition: {
          fieldKey: "employer_contested",
          categoryKey: "employer_info",
          operator: "equals",
          value: "true",
        },
        actionTemplate: { actionType: "flag_risk", title: "Denial" },
        jurisdictionSpecific: false,
        jurisdictionRules: null,
        isDeterministic: true,
        createdAt: new Date(),
      },
    ];

    const findingsMap = new Map<string, { value: string; confidence: number }[]>();
    const results = processTriggers(triggers, findingsMap);
    expect(results).toHaveLength(0);
  });

  it("skips triggers with missing triggerCondition fieldKey", () => {
    const triggers = [
      {
        id: "t-1",
        packId: "p-1",
        triggerType: "alert" as const,
        name: "Bad trigger",
        description: null,
        triggerCondition: { operator: "exists" }, // missing fieldKey
        actionTemplate: { actionType: "flag_risk", title: "Test" },
        jurisdictionSpecific: false,
        jurisdictionRules: null,
        isDeterministic: true,
        createdAt: new Date(),
      },
    ];

    const findingsMap = new Map([["some:field", [{ value: "x", confidence: 0.9 }]]]);

    const results = processTriggers(triggers, findingsMap);
    expect(results).toHaveLength(0);
  });
});
