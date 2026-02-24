import { describe, it, expect } from "vitest";
import { POST } from "@/app/api/estate/account/route";

describe("POST /api/estate/account", () => {
  it("returns 401 when unauthenticated", async () => {
    const request = new Request("http://localhost:3000/api/estate/account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        matterId: "00000000-0000-4000-a000-000000000001",
      }),
    });

    const response = await POST(request, { params: {} } as any);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBeDefined();
  });
});
