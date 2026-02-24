import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/probate/estate-tax/calculate/route";

describe("POST /api/probate/estate-tax/calculate", () => {
  it("returns zero tax when adjusted base is below exemption", async () => {
    const request = new NextRequest("http://localhost:3000/api/probate/estate-tax/calculate", {
      method: "POST",
      body: JSON.stringify({
        estateGrossValue: "5000000.00",
        liabilities: "1000000.00",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.estateNetValue).toBe("4000000.00");
    expect(data.federalEstateTax).toBe("0.00");
    expect(data.stateEstateTax).toBe("0.00");
    expect(data.totalEstimatedTax).toBe("0.00");
  });

  it("calculates federal and state estimates from provided assumptions", async () => {
    const request = new NextRequest("http://localhost:3000/api/probate/estate-tax/calculate", {
      method: "POST",
      body: JSON.stringify({
        estateGrossValue: "20000000.00",
        liabilities: "2000000.00",
        deductions: "1000000.00",
        federalExemption: "13000000.00",
        federalRate: 0.4,
        state: "MA",
        stateExemption: "1000000.00",
        stateRate: 0.1,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.adjustedTaxBase).toBe("17000000.00");
    expect(data.federalTaxableAmount).toBe("4000000.00");
    expect(data.federalEstateTax).toBe("1600000.00");
    expect(data.stateTaxableAmount).toBe("16000000.00");
    expect(data.stateEstateTax).toBe("1600000.00");
    expect(data.totalEstimatedTax).toBe("3200000.00");
    expect(data.effectiveRate).toBe("16.00%");
  });

  it("returns 400 for invalid payload", async () => {
    const request = new NextRequest("http://localhost:3000/api/probate/estate-tax/calculate", {
      method: "POST",
      body: JSON.stringify({
        estateGrossValue: "invalid",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Validation failed");
  });
});
