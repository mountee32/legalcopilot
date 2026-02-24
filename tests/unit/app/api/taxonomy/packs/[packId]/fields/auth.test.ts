import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/taxonomy/packs/[packId]/fields/route";

describe("POST /api/taxonomy/packs/[packId]/fields auth", () => {
  it("returns 401 when request is unauthenticated", async () => {
    const request = new NextRequest("http://localhost:3000/api/taxonomy/packs/pack-1/fields", {
      method: "POST",
      body: JSON.stringify({
        categoryId: "11111111-1111-4111-a111-111111111111",
        key: "mmi_date",
        label: "MMI Date",
        dataType: "date",
      }),
    });
    const response = await POST(request, {
      params: Promise.resolve({ packId: "pack-1" }),
    } as any);

    expect(response.status).toBe(401);
  });
});
