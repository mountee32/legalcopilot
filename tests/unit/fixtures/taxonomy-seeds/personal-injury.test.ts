import { describe, it, expect } from "vitest";
import { personalInjurySeed } from "@tests/fixtures/taxonomy-seeds/personal-injury";

describe("Personal Injury Taxonomy Pack Seed", () => {
  it("has correct pack metadata", () => {
    expect(personalInjurySeed.pack.name).toBe("Personal Injury");
    expect(personalInjurySeed.pack.practiceArea).toBe("personal_injury");
    expect(personalInjurySeed.pack.isSystem).toBe(true);
    expect(personalInjurySeed.pack.version).toBe("1.0.0");
  });

  it("has 5 categories", () => {
    expect(personalInjurySeed.categories).toHaveLength(5);
    const keys = personalInjurySeed.categories.map((c) => c.key);
    expect(keys).toContain("plaintiff_info");
    expect(keys).toContain("incident_details");
    expect(keys).toContain("defendant_info");
    expect(keys).toContain("medical_treatment");
    expect(keys).toContain("damages_calculation");
  });

  it("has 39 fields total", () => {
    expect(personalInjurySeed.fields).toHaveLength(39);
  });

  it("has 21 document types", () => {
    expect(personalInjurySeed.documentTypes).toHaveLength(21);
  });

  it("has 5 action triggers", () => {
    expect(personalInjurySeed.triggers).toHaveLength(5);
  });

  it("has 8 reconciliation rules", () => {
    expect(personalInjurySeed.reconciliationRules).toHaveLength(8);
  });

  it("has 2 prompt templates", () => {
    expect(personalInjurySeed.promptTemplates).toHaveLength(2);
    const types = personalInjurySeed.promptTemplates.map((t) => t.templateType);
    expect(types).toContain("classification");
    expect(types).toContain("extraction");
  });

  it("all field IDs are unique", () => {
    const ids = personalInjurySeed.fields.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("all document type keys are unique", () => {
    const keys = personalInjurySeed.documentTypes.map((d) => d.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("document types reference valid categories", () => {
    const categoryKeys = new Set(personalInjurySeed.categories.map((c) => c.key));
    for (const dt of personalInjurySeed.documentTypes) {
      for (const catKey of dt.activatedCategories as string[]) {
        expect(categoryKeys.has(catKey)).toBe(true);
      }
    }
  });
});
