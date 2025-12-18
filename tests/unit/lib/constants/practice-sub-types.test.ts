import { describe, it, expect } from "vitest";
import {
  practiceAreaSubTypes,
  allSubTypes,
  taskTemplateCategories,
  isValidSubType,
  getSubTypesForPracticeArea,
  formatSubType,
} from "@/lib/constants/practice-sub-types";

describe("Practice Area Sub-Types", () => {
  it("has sub-types for all practice areas", () => {
    const practiceAreas = [
      "conveyancing",
      "litigation",
      "family",
      "probate",
      "employment",
      "immigration",
      "personal_injury",
      "commercial",
      "criminal",
      "ip",
      "insolvency",
      "other",
    ];

    for (const area of practiceAreas) {
      expect(practiceAreaSubTypes[area as keyof typeof practiceAreaSubTypes]).toBeDefined();
      expect(
        practiceAreaSubTypes[area as keyof typeof practiceAreaSubTypes].length
      ).toBeGreaterThan(0);
    }
  });

  it("all sub-types are non-empty strings", () => {
    for (const subType of allSubTypes) {
      expect(typeof subType).toBe("string");
      expect(subType.length).toBeGreaterThan(0);
    }
  });

  it("conveyancing has expected sub-types", () => {
    expect(practiceAreaSubTypes.conveyancing).toContain("freehold_purchase");
    expect(practiceAreaSubTypes.conveyancing).toContain("freehold_sale");
    expect(practiceAreaSubTypes.conveyancing).toContain("leasehold_purchase");
    expect(practiceAreaSubTypes.conveyancing).toContain("remortgage");
  });

  it("litigation has expected sub-types", () => {
    expect(practiceAreaSubTypes.litigation).toContain("contract_dispute");
    expect(practiceAreaSubTypes.litigation).toContain("debt_recovery");
    expect(practiceAreaSubTypes.litigation).toContain("professional_negligence");
  });
});

describe("Task Template Categories", () => {
  it("has all expected categories", () => {
    expect(taskTemplateCategories).toContain("regulatory");
    expect(taskTemplateCategories).toContain("legal");
    expect(taskTemplateCategories).toContain("firm_policy");
    expect(taskTemplateCategories).toContain("best_practice");
    expect(taskTemplateCategories).toHaveLength(4);
  });
});

describe("isValidSubType", () => {
  it("returns true for valid sub-type", () => {
    expect(isValidSubType("conveyancing", "freehold_purchase")).toBe(true);
    expect(isValidSubType("litigation", "contract_dispute")).toBe(true);
    expect(isValidSubType("family", "divorce_petition")).toBe(true);
  });

  it("returns false for invalid sub-type", () => {
    expect(isValidSubType("conveyancing", "invalid_type")).toBe(false);
    expect(isValidSubType("conveyancing", "divorce_petition")).toBe(false);
  });

  it("returns false for invalid practice area", () => {
    expect(isValidSubType("invalid_area", "freehold_purchase")).toBe(false);
  });
});

describe("getSubTypesForPracticeArea", () => {
  it("returns sub-types for valid practice area", () => {
    const subTypes = getSubTypesForPracticeArea("conveyancing");
    expect(subTypes).toContain("freehold_purchase");
    expect(subTypes.length).toBeGreaterThan(5);
  });

  it("returns empty array for invalid practice area", () => {
    const subTypes = getSubTypesForPracticeArea("invalid_area");
    expect(subTypes).toEqual([]);
  });
});

describe("formatSubType", () => {
  it("formats sub-type for display", () => {
    expect(formatSubType("freehold_purchase")).toBe("Freehold Purchase");
    expect(formatSubType("contract_dispute")).toBe("Contract Dispute");
    expect(formatSubType("road_traffic_accident")).toBe("Road Traffic Accident");
  });

  it("handles single word", () => {
    expect(formatSubType("general")).toBe("General");
  });
});
