import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/probate/iht/calculate/route";

describe("POST /api/probate/iht/calculate", () => {
  it("returns 410 because the endpoint is retired in the US pivot", async () => {
    const request = new NextRequest("http://localhost:3000/api/probate/iht/calculate", {
      method: "POST",
      body: JSON.stringify({
        estateGrossValue: "3000000.00",
        liabilities: "0.00",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(410);
    expect(data.error).toBe("Endpoint retired");
    expect(data.code).toBe("ENDPOINT_RETIRED");
    expect(data.message).toContain("UK IHT calculator endpoint");
  });

  it("returns 410 even when payload is missing fields", async () => {
    const request = new NextRequest("http://localhost:3000/api/probate/iht/calculate", {
      method: "POST",
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(410);
    expect(data.code).toBe("ENDPOINT_RETIRED");
  });
});
