import { describe, it, expect } from "vitest";
import { PATCH } from "@/app/api/matters/[id]/real-estate/route";

describe("PATCH /api/matters/[id]/real-estate", () => {
  it("returns 401 when unauthenticated", async () => {
    const request = new Request("http://localhost:3000/api/matters/mat-123/real-estate", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        purchasePrice: "500000.00",
      }),
    });

    const response = await PATCH(request, {
      params: Promise.resolve({ id: "mat-123" }),
    } as any);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBeDefined();
  });
});
