import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/taxonomy/packs/route";

describe("GET /api/taxonomy/packs auth", () => {
  it("returns 401 when request is unauthenticated", async () => {
    const request = new NextRequest("http://localhost:3000/api/taxonomy/packs");
    const response = await GET(request, {} as any);

    expect(response.status).toBe(401);
  });
});
