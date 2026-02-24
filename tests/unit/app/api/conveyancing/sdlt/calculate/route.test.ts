import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/conveyancing/sdlt/calculate/route";

describe("POST /api/conveyancing/sdlt/calculate", () => {
  it("returns 410 because the endpoint is retired in the US pivot", async () => {
    const request = new NextRequest("http://localhost:3000/api/conveyancing/sdlt/calculate", {
      method: "POST",
      body: JSON.stringify({
        purchasePrice: "350000.00",
        propertyType: "freehold",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(410);
    expect(data.error).toBe("Endpoint retired");
    expect(data.code).toBe("ENDPOINT_RETIRED");
    expect(data.message).toContain("UK SDLT calculator endpoint");
  });

  it("returns 410 even with invalid payload", async () => {
    const request = new NextRequest("http://localhost:3000/api/conveyancing/sdlt/calculate", {
      method: "POST",
      body: JSON.stringify({
        purchasePrice: "invalid",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(410);
    expect(data.code).toBe("ENDPOINT_RETIRED");
  });
});
