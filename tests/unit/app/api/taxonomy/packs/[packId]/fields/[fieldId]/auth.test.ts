import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { PUT } from "@/app/api/taxonomy/packs/[packId]/fields/[fieldId]/route";

describe("PUT /api/taxonomy/packs/[packId]/fields/[fieldId] auth", () => {
  it("returns 401 when request is unauthenticated", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/taxonomy/packs/pack-1/fields/field-1",
      {
        method: "PUT",
        body: JSON.stringify({
          label: "Updated",
        }),
      }
    );
    const response = await PUT(request, {
      params: Promise.resolve({ packId: "pack-1", fieldId: "field-1" }),
    } as any);

    expect(response.status).toBe(401);
  });
});
