import { describe, it, expect } from "vitest";
import { workersCompSeed } from "@tests/fixtures/taxonomy-seeds/workers-comp";

describe("Workers' Comp Taxonomy Seed", () => {
  it("has a valid pack with correct practice area", () => {
    expect(workersCompSeed.pack.key).toBe("workers-comp");
    expect(workersCompSeed.pack.practiceArea).toBe("workers_compensation");
    expect(workersCompSeed.pack.isSystem).toBe(true);
    expect(workersCompSeed.pack.isActive).toBe(true);
  });

  it("has 5 categories", () => {
    expect(workersCompSeed.categories).toHaveLength(5);
    const keys = workersCompSeed.categories.map((c) => c.key);
    expect(keys).toContain("claimant_info");
    expect(keys).toContain("injury_details");
    expect(keys).toContain("employer_info");
    expect(keys).toContain("medical_treatment");
    expect(keys).toContain("benefits_compensation");
  });

  it("has ~42 fields across all categories", () => {
    expect(workersCompSeed.fields.length).toBeGreaterThanOrEqual(40);
    expect(workersCompSeed.fields.length).toBeLessThanOrEqual(50);
  });

  it("all fields reference a valid category", () => {
    const categoryIds = new Set(workersCompSeed.categories.map((c) => c.id));
    for (const field of workersCompSeed.fields) {
      expect(categoryIds.has(field.categoryId!)).toBe(true);
    }
  });

  it("has 25+ document types", () => {
    expect(workersCompSeed.documentTypes.length).toBeGreaterThanOrEqual(25);
  });

  it("document type activated categories reference valid category keys", () => {
    const catKeys = new Set(workersCompSeed.categories.map((c) => c.key));
    for (const dt of workersCompSeed.documentTypes) {
      const activated = dt.activatedCategories as string[];
      for (const key of activated) {
        expect(catKeys.has(key)).toBe(true);
      }
    }
  });

  it("has action triggers with valid structure", () => {
    expect(workersCompSeed.triggers.length).toBeGreaterThanOrEqual(5);
    for (const trigger of workersCompSeed.triggers) {
      expect(trigger.triggerCondition).toBeDefined();
      expect(trigger.actionTemplate).toBeDefined();
      const cond = trigger.triggerCondition as { fieldKey: string; operator: string };
      expect(cond.fieldKey).toBeDefined();
      expect(cond.operator).toBeDefined();
    }
  });

  it("has reconciliation rules mapping to real field keys", () => {
    expect(workersCompSeed.reconciliationRules.length).toBeGreaterThanOrEqual(8);
    const fieldKeys = new Set(workersCompSeed.fields.map((f) => f.key));
    for (const rule of workersCompSeed.reconciliationRules) {
      expect(fieldKeys.has(rule.fieldKey)).toBe(true);
    }
  });

  it("has prompt templates for classification and extraction", () => {
    expect(workersCompSeed.promptTemplates.length).toBeGreaterThanOrEqual(2);
    const types = workersCompSeed.promptTemplates.map((t) => t.templateType);
    expect(types).toContain("classification");
    expect(types).toContain("extraction");
  });

  it("all IDs are unique", () => {
    const allIds = [
      workersCompSeed.pack.id,
      ...workersCompSeed.categories.map((c) => c.id),
      ...workersCompSeed.fields.map((f) => f.id!),
      ...workersCompSeed.documentTypes.map((d) => d.id!),
      ...workersCompSeed.triggers.map((t) => t.id),
      ...workersCompSeed.reconciliationRules.map((r) => r.id),
      ...workersCompSeed.promptTemplates.map((p) => p.id!),
    ];
    const uniqueIds = new Set(allIds);
    expect(uniqueIds.size).toBe(allIds.length);
  });
});
