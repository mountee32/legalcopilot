import { describe, it, expect } from "vitest";
import { calculateRiskScore, type RiskResult } from "@/lib/pipeline/risk-score";

describe("calculateRiskScore", () => {
  it("returns score 0 and empty factors for no findings", () => {
    const result = calculateRiskScore([]);
    expect(result).toEqual({ score: 0, factors: [] });
  });

  it("calculates critical pending factor", () => {
    const findings = [
      { status: "pending", impact: "critical", confidence: "0.900" },
      { status: "pending", impact: "critical", confidence: "0.850" },
    ];
    const result = calculateRiskScore(findings);
    const factor = result.factors.find((f) => f.key === "critical_pending");
    expect(factor).toBeDefined();
    expect(factor!.contribution).toBe(30); // 2 * 15 = 30
  });

  it("caps critical pending factor at 30", () => {
    const findings = Array(5)
      .fill(null)
      .map(() => ({ status: "pending", impact: "critical", confidence: "0.900" }));
    const result = calculateRiskScore(findings);
    const factor = result.factors.find((f) => f.key === "critical_pending");
    expect(factor!.contribution).toBe(30); // 5 * 15 = 75, capped at 30
  });

  it("calculates conflict factor", () => {
    const findings = [
      { status: "conflict", impact: "medium", confidence: "0.800" },
      { status: "conflict", impact: "high", confidence: "0.700" },
    ];
    const result = calculateRiskScore(findings);
    const factor = result.factors.find((f) => f.key === "conflicts");
    expect(factor).toBeDefined();
    expect(factor!.contribution).toBe(24); // 2 * 12 = 24
  });

  it("caps conflict factor at 25", () => {
    const findings = Array(5)
      .fill(null)
      .map(() => ({ status: "conflict", impact: "medium", confidence: "0.900" }));
    const result = calculateRiskScore(findings);
    const factor = result.factors.find((f) => f.key === "conflicts");
    expect(factor!.contribution).toBe(25); // 5 * 12 = 60, capped at 25
  });

  it("calculates high-impact ratio factor", () => {
    const findings = [
      { status: "accepted", impact: "high", confidence: "0.950" },
      { status: "accepted", impact: "critical", confidence: "0.900" },
      { status: "accepted", impact: "low", confidence: "0.990" },
      { status: "accepted", impact: "info", confidence: "0.990" },
    ];
    const result = calculateRiskScore(findings);
    const factor = result.factors.find((f) => f.key === "high_impact_ratio");
    expect(factor).toBeDefined();
    expect(factor!.contribution).toBe(10); // 2/4 * 20 = 10
  });

  it("calculates low confidence factor at < 0.75", () => {
    const findings = [
      { status: "accepted", impact: "low", confidence: "0.600" },
      { status: "accepted", impact: "low", confidence: "0.650" },
    ];
    const result = calculateRiskScore(findings);
    const factor = result.factors.find((f) => f.key === "low_confidence");
    expect(factor!.contribution).toBe(15); // avg 0.625 < 0.75
  });

  it("calculates low confidence factor at < 0.85", () => {
    const findings = [
      { status: "accepted", impact: "low", confidence: "0.800" },
      { status: "accepted", impact: "low", confidence: "0.800" },
    ];
    const result = calculateRiskScore(findings);
    const factor = result.factors.find((f) => f.key === "low_confidence");
    expect(factor!.contribution).toBe(8); // avg 0.80 < 0.85
  });

  it("has no confidence factor when avg >= 0.85", () => {
    const findings = [
      { status: "accepted", impact: "low", confidence: "0.950" },
      { status: "accepted", impact: "low", confidence: "0.900" },
    ];
    const result = calculateRiskScore(findings);
    const factor = result.factors.find((f) => f.key === "low_confidence");
    expect(factor).toBeUndefined();
  });

  it("calculates unresolved pending factor", () => {
    const findings = [
      { status: "pending", impact: "low", confidence: "0.900" },
      { status: "pending", impact: "medium", confidence: "0.900" },
      { status: "pending", impact: "low", confidence: "0.900" },
    ];
    const result = calculateRiskScore(findings);
    const factor = result.factors.find((f) => f.key === "unresolved_pending");
    expect(factor!.contribution).toBe(6); // 3 * 2 = 6
  });

  it("caps unresolved pending factor at 10", () => {
    const findings = Array(10)
      .fill(null)
      .map(() => ({ status: "pending", impact: "low", confidence: "0.950" }));
    const result = calculateRiskScore(findings);
    const factor = result.factors.find((f) => f.key === "unresolved_pending");
    expect(factor!.contribution).toBe(10); // 10 * 2 = 20, capped at 10
  });

  it("combines all factors for a high score", () => {
    const findings = [
      { status: "pending", impact: "critical", confidence: "0.600" },
      { status: "conflict", impact: "high", confidence: "0.650" },
      { status: "pending", impact: "high", confidence: "0.700" },
    ];
    const result = calculateRiskScore(findings);
    expect(result.score).toBeGreaterThan(50);
    expect(result.factors.length).toBeGreaterThanOrEqual(3);
  });

  it("caps total score at 100", () => {
    const findings = [
      ...Array(3).fill({ status: "pending", impact: "critical", confidence: "0.300" }),
      ...Array(3).fill({ status: "conflict", impact: "critical", confidence: "0.300" }),
    ];
    const result = calculateRiskScore(findings);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it("produces low score when all findings are accepted", () => {
    const findings = [
      { status: "accepted", impact: "low", confidence: "0.950" },
      { status: "accepted", impact: "medium", confidence: "0.920" },
      { status: "accepted", impact: "low", confidence: "0.980" },
    ];
    const result = calculateRiskScore(findings);
    // No pending, no conflicts — only factors would be high_impact_ratio (low)
    expect(result.score).toBeLessThan(10);
  });

  it("handles zero confidence values gracefully", () => {
    const findings = [{ status: "pending", impact: "medium", confidence: "0.000" }];
    const result = calculateRiskScore(findings);
    expect(result.score).toBeGreaterThan(0);
    const factor = result.factors.find((f) => f.key === "low_confidence");
    expect(factor).toBeDefined();
    expect(factor!.contribution).toBe(15);
  });

  it("includes human-readable detail in each factor", () => {
    const findings = [{ status: "pending", impact: "critical", confidence: "0.700" }];
    const result = calculateRiskScore(findings);
    for (const factor of result.factors) {
      expect(factor.detail).toBeTruthy();
      expect(typeof factor.detail).toBe("string");
    }
  });
});
