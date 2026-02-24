import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/taxonomy/packs/[packId]/fork/route";

describe("POST /api/taxonomy/packs/[packId]/fork auth", () => {
  it("returns 401 when request is unauthenticated", async () => {
    const request = new NextRequest("http://localhost:3000/api/taxonomy/packs/pack-1/fork", {
      method: "POST",
      body: JSON.stringify({}),
    });
    const response = await POST(request, {
      params: Promise.resolve({ packId: "pack-1" }),
    } as any);

    expect(response.status).toBe(401);
  });
});
