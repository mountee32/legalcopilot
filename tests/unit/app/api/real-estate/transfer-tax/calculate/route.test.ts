import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/real-estate/transfer-tax/calculate/route";

describe("POST /api/real-estate/transfer-tax/calculate", () => {
  it("estimates transfer tax using state baseline rate", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/real-estate/transfer-tax/calculate",
      {
        method: "POST",
        body: JSON.stringify({
          salePrice: "1000000.00",
          state: "ca",
        }),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.state).toBe("CA");
    expect(data.stateRate).toBe("0.11%");
    expect(data.totalTransferTax).toBe("1100.00");
    expect(data.effectiveRate).toBe("0.11%");
  });

  it("supports override and local rates", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/real-estate/transfer-tax/calculate",
      {
        method: "POST",
        body: JSON.stringify({
          salePrice: "500000.00",
          state: "NY",
          transferType: "refinance",
          overrideStateRate: 0.005,
          countyRate: 0.001,
          cityRate: 0.002,
        }),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.stateRate).toBe("0.50%");
    expect(data.countyRate).toBe("0.10%");
    expect(data.cityRate).toBe("0.20%");
    expect(data.totalTransferTax).toBe("4000.00");
    expect(data.effectiveRate).toBe("0.80%");
  });

  it("returns 400 for invalid input", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/real-estate/transfer-tax/calculate",
      {
        method: "POST",
        body: JSON.stringify({
          salePrice: "invalid",
          state: "CA",
        }),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Validation failed");
  });
});
