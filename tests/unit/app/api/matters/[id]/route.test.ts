import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock middleware and dependencies
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

vi.mock("@/lib/timeline/createEvent", () => ({
  createTimelineEvent: vi.fn(),
}));

const validUuid = "123e4567-e89b-12d3-a456-426614174000";

describe("Matters API - GET /api/matters/:id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns matter by ID", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const mockMatter = {
      id: validUuid,
      reference: "MAT-001",
      title: "Property Purchase",
      practiceArea: "conveyancing",
      status: "active",
      clientId: "client-1",
    };
    vi.mocked(withFirmDb).mockResolvedValueOnce(mockMatter as any);

    const { GET } = await import("@/app/api/matters/[id]/route");
    const request = new NextRequest(`http://localhost/api/matters/${validUuid}`);
    const response = await GET(request as any, { params: { id: validUuid } } as any);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.id).toBe(validUuid);
    expect(json.title).toBe("Property Purchase");
  });

  it("returns 404 for non-existent matter", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    vi.mocked(withFirmDb).mockResolvedValueOnce(null as any);

    const { GET } = await import("@/app/api/matters/[id]/route");
    const request = new NextRequest(`http://localhost/api/matters/${validUuid}`);
    const response = await GET(request as any, { params: { id: validUuid } } as any);

    expect(response.status).toBe(404);
  });

  it("returns 404 when id is not provided", async () => {
    const { GET } = await import("@/app/api/matters/[id]/route");
    const request = new NextRequest("http://localhost/api/matters/");
    const response = await GET(request as any, { params: {} } as any);

    expect(response.status).toBe(404);
  });
});

describe("Matters API - PATCH /api/matters/:id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates matter fields successfully", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const mockMatter = {
      id: validUuid,
      title: "Updated Title",
      status: "on_hold",
      notes: "Updated via test",
    };
    vi.mocked(withFirmDb).mockResolvedValueOnce(mockMatter as any);

    const { PATCH } = await import("@/app/api/matters/[id]/route");
    const request = new NextRequest(`http://localhost/api/matters/${validUuid}`, {
      method: "PATCH",
      body: JSON.stringify({
        title: "Updated Title",
        status: "on_hold",
        notes: "Updated via test",
      }),
    });

    const response = await PATCH(request as any, { params: { id: validUuid } } as any);
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json.title).toBe("Updated Title");
    expect(json.status).toBe("on_hold");
    expect(json.notes).toBe("Updated via test");
  });

  it("returns 404 for non-existent matter", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    vi.mocked(withFirmDb).mockResolvedValueOnce(null as any);

    const { PATCH } = await import("@/app/api/matters/[id]/route");
    const request = new NextRequest(`http://localhost/api/matters/${validUuid}`, {
      method: "PATCH",
      body: JSON.stringify({ title: "New Title" }),
    });

    const response = await PATCH(request as any, { params: { id: validUuid } } as any);
    expect(response.status).toBe(404);
  });

  it("validates status enum", async () => {
    const { PATCH } = await import("@/app/api/matters/[id]/route");
    const request = new NextRequest(`http://localhost/api/matters/${validUuid}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "invalid_status" }),
    });

    const response = await PATCH(request as any, { params: { id: validUuid } } as any);
    expect([400, 500]).toContain(response.status);
  });

  it("allows partial updates", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const mockMatter = { id: validUuid, notes: "Only notes updated" };
    vi.mocked(withFirmDb).mockResolvedValueOnce(mockMatter as any);

    const { PATCH } = await import("@/app/api/matters/[id]/route");
    const request = new NextRequest(`http://localhost/api/matters/${validUuid}`, {
      method: "PATCH",
      body: JSON.stringify({ notes: "Only notes updated" }),
    });

    const response = await PATCH(request as any, { params: { id: validUuid } } as any);
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json.notes).toBe("Only notes updated");
  });

  it("updates billing information", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const mockMatter = {
      id: validUuid,
      billingType: "fixed_fee",
      fixedFee: "10000.00",
      hourlyRate: null,
    };
    vi.mocked(withFirmDb).mockResolvedValueOnce(mockMatter as any);

    const { PATCH } = await import("@/app/api/matters/[id]/route");
    const request = new NextRequest(`http://localhost/api/matters/${validUuid}`, {
      method: "PATCH",
      body: JSON.stringify({
        billingType: "fixed_fee",
        fixedFee: "10000.00",
      }),
    });

    const response = await PATCH(request as any, { params: { id: validUuid } } as any);
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json.billingType).toBe("fixed_fee");
    expect(json.fixedFee).toBe("10000.00");
  });
});

describe("Matters API - DELETE /api/matters/:id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("soft deletes matter successfully (sets status to archived)", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const mockMatter = { id: validUuid, status: "archived" };
    vi.mocked(withFirmDb).mockResolvedValueOnce(mockMatter as any);

    const { DELETE } = await import("@/app/api/matters/[id]/route");
    const request = new NextRequest(`http://localhost/api/matters/${validUuid}`, {
      method: "DELETE",
    });

    const response = await DELETE(request as any, { params: { id: validUuid } } as any);
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json.success).toBe(true);
  });

  it("returns 404 for non-existent matter", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    vi.mocked(withFirmDb).mockResolvedValueOnce(null as any);

    const { DELETE } = await import("@/app/api/matters/[id]/route");
    const request = new NextRequest(`http://localhost/api/matters/${validUuid}`, {
      method: "DELETE",
    });

    const response = await DELETE(request as any, { params: { id: validUuid } } as any);
    expect(response.status).toBe(404);
  });

  it("returns 404 when id is not provided", async () => {
    const { DELETE } = await import("@/app/api/matters/[id]/route");
    const request = new NextRequest("http://localhost/api/matters/", {
      method: "DELETE",
    });

    const response = await DELETE(request as any, { params: {} } as any);
    expect(response.status).toBe(404);
  });
});
