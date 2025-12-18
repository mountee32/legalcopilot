import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/probate/iht/calculate/route";

describe("POST /api/probate/iht/calculate", () => {
  it("should calculate IHT for estate within nil rate band", async () => {
    const request = new NextRequest("http://localhost:3000/api/probate/iht/calculate", {
      method: "POST",
      body: JSON.stringify({
        estateGrossValue: "300000.00",
        liabilities: "0.00",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.estateNetValue).toBe("300000.00");
    expect(data.nilRateBand).toBe("325000.00");
    expect(data.ihtPayable).toBe("0.00");
    expect(data.notes).toContain("No IHT payable");
  });

  it("should calculate IHT for estate above nil rate band", async () => {
    const request = new NextRequest("http://localhost:3000/api/probate/iht/calculate", {
      method: "POST",
      body: JSON.stringify({
        estateGrossValue: "500000.00",
        liabilities: "0.00",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.estateNetValue).toBe("500000.00");
    expect(data.nilRateBand).toBe("325000.00");
    // £500k - £325k = £175k taxable @ 40% = £70,000
    expect(data.taxableAmount).toBe("175000.00");
    expect(data.ihtPayable).toBe("70000.00");
    expect(data.effectiveRate).toBe("14.0"); // 70k/500k = 14%
    expect(data.notes).toContain("40%");
  });

  it("should deduct liabilities from gross estate", async () => {
    const request = new NextRequest("http://localhost:3000/api/probate/iht/calculate", {
      method: "POST",
      body: JSON.stringify({
        estateGrossValue: "500000.00",
        liabilities: "100000.00",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.estateNetValue).toBe("400000.00");
    // £400k - £325k = £75k taxable @ 40% = £30,000
    expect(data.taxableAmount).toBe("75000.00");
    expect(data.ihtPayable).toBe("30000.00");
  });

  it("should apply exemptions to reduce taxable amount", async () => {
    const request = new NextRequest("http://localhost:3000/api/probate/iht/calculate", {
      method: "POST",
      body: JSON.stringify({
        estateGrossValue: "500000.00",
        liabilities: "0.00",
        exemptions: "50000.00",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.estateNetValue).toBe("500000.00");
    // £500k - £50k exemptions = £450k taxable
    // £450k - £325k NRB = £125k @ 40% = £50,000
    expect(data.taxableAmount).toBe("125000.00");
    expect(data.ihtPayable).toBe("50000.00");
  });

  it("should apply reliefs to reduce taxable amount", async () => {
    const request = new NextRequest("http://localhost:3000/api/probate/iht/calculate", {
      method: "POST",
      body: JSON.stringify({
        estateGrossValue: "500000.00",
        liabilities: "0.00",
        reliefs: "100000.00",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    // £500k - £100k reliefs = £400k taxable
    // £400k - £325k NRB = £75k @ 40% = £30,000
    expect(data.taxableAmount).toBe("75000.00");
    expect(data.ihtPayable).toBe("30000.00");
  });

  it("should apply both exemptions and reliefs", async () => {
    const request = new NextRequest("http://localhost:3000/api/probate/iht/calculate", {
      method: "POST",
      body: JSON.stringify({
        estateGrossValue: "600000.00",
        liabilities: "50000.00",
        exemptions: "100000.00",
        reliefs: "50000.00",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.estateNetValue).toBe("550000.00");
    // Net £550k - £100k exemptions - £50k reliefs = £400k taxable
    // £400k - £325k NRB = £75k @ 40% = £30,000
    expect(data.taxableAmount).toBe("75000.00");
    expect(data.ihtPayable).toBe("30000.00");
  });

  it("should handle large estates correctly", async () => {
    const request = new NextRequest("http://localhost:3000/api/probate/iht/calculate", {
      method: "POST",
      body: JSON.stringify({
        estateGrossValue: "2000000.00",
        liabilities: "0.00",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.estateNetValue).toBe("2000000.00");
    // £2m - £325k NRB = £1,675k @ 40% = £670,000
    expect(data.taxableAmount).toBe("1675000.00");
    expect(data.ihtPayable).toBe("670000.00");
    expect(data.effectiveRate).toBe("33.5"); // 670k/2m = 33.5%
  });

  it("should return 0 IHT when exemptions exceed taxable estate", async () => {
    const request = new NextRequest("http://localhost:3000/api/probate/iht/calculate", {
      method: "POST",
      body: JSON.stringify({
        estateGrossValue: "200000.00",
        liabilities: "0.00",
        exemptions: "300000.00",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ihtPayable).toBe("0.00");
    expect(data.notes).toContain("No IHT payable");
  });

  it("should return 400 for invalid input", async () => {
    const request = new NextRequest("http://localhost:3000/api/probate/iht/calculate", {
      method: "POST",
      body: JSON.stringify({
        estateGrossValue: "invalid",
        liabilities: "0.00",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Validation failed");
  });

  it("should return 400 for missing required fields", async () => {
    const request = new NextRequest("http://localhost:3000/api/probate/iht/calculate", {
      method: "POST",
      body: JSON.stringify({
        estateGrossValue: "500000.00",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Validation failed");
  });
});
