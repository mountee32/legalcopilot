import { describe, it, expect } from "vitest";
import { parseMoney, formatMoney, roundMoney } from "@/lib/billing/money";

describe("Edge cases - Money", () => {
  it("formats zero correctly", () => {
    expect(formatMoney(0)).toBe("0.00");
    expect(parseMoney("0.00")).toBe(0);
  });

  it("preserves precision for common floating point cases", () => {
    expect(roundMoney(0.1 + 0.2)).toBe(0.3);
    expect(formatMoney(roundMoney(0.1 + 0.2))).toBe("0.30");
  });

  it("throws on invalid money strings", () => {
    expect(() => parseMoney("not-a-number")).toThrow("Invalid money amount");
    expect(() => formatMoney(Number.NaN)).toThrow("Invalid money amount");
  });

  it("handles negative values deterministically", () => {
    expect(parseMoney("-1.50")).toBe(-1.5);
    expect(formatMoney(-1.5)).toBe("-1.50");
    expect(roundMoney(-1.005)).toBe(-1);
  });
});
