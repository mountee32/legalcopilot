import { describe, it, expect } from "vitest";
import { POST } from "@/app/api/real-estate/searches/order/route";

describe("POST /api/real-estate/searches/order", () => {
  it("returns 401 when unauthenticated", async () => {
    const request = new Request("http://localhost:3000/api/real-estate/searches/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        matterId: "00000000-0000-4000-a000-000000000001",
        searchType: "local",
        provider: "CoreLogic",
      }),
    });

    const response = await POST(request, { params: {} } as any);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBeDefined();
  });
});
