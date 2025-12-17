import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/middleware/withAuth", () => ({
  withAuth: (handler: any) => (request: any, ctx: any) =>
    handler(request, { ...ctx, user: { user: { id: "user-1" } } }),
}));

vi.mock("@/middleware/withPermission", () => ({
  withPermission: () => (handler: any) => handler,
}));

vi.mock("@/lib/tenancy", () => ({
  getOrCreateFirmIdForUser: vi.fn(async () => "firm-1"),
}));

vi.mock("@/lib/db/tenant", () => ({
  withFirmDb: vi.fn(),
}));

describe("Signature requests API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET returns list shape", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    vi.mocked(withFirmDb).mockResolvedValueOnce({ total: 1, rows: [{ id: "s1" }] } as any);

    const { GET } = await import("@/app/api/signature-requests/route");
    const request = new NextRequest("http://localhost/api/signature-requests?page=1&limit=20");
    const response = await GET(request as any, {} as any);
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(Array.isArray(json.requests)).toBe(true);
    expect(json.pagination.total).toBe(1);
  });

  it("POST creates request + approval", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    vi.mocked(withFirmDb).mockResolvedValueOnce({
      signatureRequest: {
        id: "s1",
        documentId: "d1",
        provider: "docusign",
        status: "pending_approval",
      },
      approvalRequestId: "a1",
    } as any);

    const { POST } = await import("@/app/api/signature-requests/route");
    const request = new NextRequest("http://localhost/api/signature-requests", {
      method: "POST",
      body: JSON.stringify({
        documentId: "123e4567-e89b-12d3-a456-426614174000",
        provider: "docusign",
        signers: [{ email: "signer@example.com" }],
      }),
    });
    const response = await POST(request as any, {} as any);
    expect(response.status).toBe(201);
    const json = await response.json();
    expect(json.signatureRequest).toBeTruthy();
    expect(json.approvalRequestId).toBe("a1");
  });
});
