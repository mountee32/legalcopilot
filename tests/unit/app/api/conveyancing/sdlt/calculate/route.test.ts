import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/conveyancing/sdlt/calculate/route";

describe("POST /api/conveyancing/sdlt/calculate", () => {
  it("should calculate SDLT for standard purchase under threshold", async () => {
    const request = new NextRequest("http://localhost:3000/api/conveyancing/sdlt/calculate", {
      method: "POST",
      body: JSON.stringify({
        purchasePrice: "200000.00",
        propertyType: "freehold",
        isFirstTimeBuyer: false,
        isAdditionalProperty: false,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.sdltAmount).toBe("0.00");
    expect(data.breakdown).toHaveLength(1);
    expect(data.breakdown[0].rate).toBe("0.0%");
  });

  it("should calculate SDLT for purchase over £250k", async () => {
    const request = new NextRequest("http://localhost:3000/api/conveyancing/sdlt/calculate", {
      method: "POST",
      body: JSON.stringify({
        purchasePrice: "300000.00",
        propertyType: "freehold",
        isFirstTimeBuyer: false,
        isAdditionalProperty: false,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    // £250k @ 0% + £50k @ 5% = £2,500
    expect(data.sdltAmount).toBe("2500.00");
    expect(data.breakdown).toHaveLength(2);
    expect(data.breakdown[1].rate).toBe("5.0%");
  });

  it("should apply first-time buyer relief for property under £425k", async () => {
    const request = new NextRequest("http://localhost:3000/api/conveyancing/sdlt/calculate", {
      method: "POST",
      body: JSON.stringify({
        purchasePrice: "400000.00",
        propertyType: "freehold",
        isFirstTimeBuyer: true,
        isAdditionalProperty: false,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.sdltAmount).toBe("0.00");
    expect(data.notes).toContain("first-time buyer");
  });

  it("should apply first-time buyer relief for property between £425k and £625k", async () => {
    const request = new NextRequest("http://localhost:3000/api/conveyancing/sdlt/calculate", {
      method: "POST",
      body: JSON.stringify({
        purchasePrice: "500000.00",
        propertyType: "freehold",
        isFirstTimeBuyer: true,
        isAdditionalProperty: false,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    // £425k @ 0% + £75k @ 5% = £3,750
    expect(data.sdltAmount).toBe("3750.00");
    expect(data.notes).toContain("First-time buyer");
  });

  it("should apply 3% surcharge for additional property", async () => {
    const request = new NextRequest("http://localhost:3000/api/conveyancing/sdlt/calculate", {
      method: "POST",
      body: JSON.stringify({
        purchasePrice: "300000.00",
        propertyType: "freehold",
        isFirstTimeBuyer: false,
        isAdditionalProperty: true,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    // £250k @ 3% + £50k @ 8% = £7,500 + £4,000 = £11,500
    expect(data.sdltAmount).toBe("11500.00");
    expect(data.notes).toContain("Additional property");
    expect(data.breakdown[0].rate).toBe("3.0%"); // 0% + 3% surcharge
    expect(data.breakdown[1].rate).toBe("8.0%"); // 5% + 3% surcharge
  });

  it("should calculate SDLT for high-value property", async () => {
    const request = new NextRequest("http://localhost:3000/api/conveyancing/sdlt/calculate", {
      method: "POST",
      body: JSON.stringify({
        purchasePrice: "2000000.00",
        propertyType: "freehold",
        isFirstTimeBuyer: false,
        isAdditionalProperty: false,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    // £250k @ 0% + £675k @ 5% + £575k @ 10% + £500k @ 12%
    // = 0 + £33,750 + £57,500 + £60,000 = £151,250
    expect(data.sdltAmount).toBe("151250.00");
    expect(data.breakdown).toHaveLength(4);
  });

  it("should return 400 for invalid input", async () => {
    const request = new NextRequest("http://localhost:3000/api/conveyancing/sdlt/calculate", {
      method: "POST",
      body: JSON.stringify({
        purchasePrice: "invalid",
        propertyType: "freehold",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Validation failed");
  });

  it("should return 400 for missing required fields", async () => {
    const request = new NextRequest("http://localhost:3000/api/conveyancing/sdlt/calculate", {
      method: "POST",
      body: JSON.stringify({
        propertyType: "freehold",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Validation failed");
  });
});
