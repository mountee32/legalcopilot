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

const validUuid = "123e4567-e89b-12d3-a456-426614174000";

describe("Clients API - GET /api/clients/:id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns client by ID", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const mockClient = {
      id: validUuid,
      reference: "CLI-001",
      firstName: "John",
      lastName: "Doe",
      type: "individual",
      email: "john@example.com",
    };
    vi.mocked(withFirmDb).mockResolvedValueOnce(mockClient as any);

    const { GET } = await import("@/app/api/clients/[id]/route");
    const request = new NextRequest(`http://localhost/api/clients/${validUuid}`);
    const response = await GET(request as any, { params: { id: validUuid } } as any);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.id).toBe(validUuid);
    expect(json.firstName).toBe("John");
  });

  it("returns 404 for non-existent client", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    vi.mocked(withFirmDb).mockResolvedValueOnce(null as any);

    const { GET } = await import("@/app/api/clients/[id]/route");
    const request = new NextRequest(`http://localhost/api/clients/${validUuid}`);
    const response = await GET(request as any, { params: { id: validUuid } } as any);

    expect(response.status).toBe(404);
  });

  it("returns 404 when id is not provided", async () => {
    const { GET } = await import("@/app/api/clients/[id]/route");
    const request = new NextRequest("http://localhost/api/clients/");
    const response = await GET(request as any, { params: {} } as any);

    expect(response.status).toBe(404);
  });
});

describe("Clients API - PATCH /api/clients/:id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates client fields successfully", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const mockClient = {
      id: validUuid,
      firstName: "John",
      lastName: "Smith", // Updated
      phone: "+44 123 456 7890", // Updated
    };
    vi.mocked(withFirmDb).mockResolvedValueOnce(mockClient as any);

    const { PATCH } = await import("@/app/api/clients/[id]/route");
    const request = new NextRequest(`http://localhost/api/clients/${validUuid}`, {
      method: "PATCH",
      body: JSON.stringify({
        lastName: "Smith",
        phone: "+44 123 456 7890",
      }),
    });

    const response = await PATCH(request as any, { params: { id: validUuid } } as any);
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json.lastName).toBe("Smith");
    expect(json.phone).toBe("+44 123 456 7890");
  });

  it("returns 404 for non-existent client", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    vi.mocked(withFirmDb).mockResolvedValueOnce(null as any);

    const { PATCH } = await import("@/app/api/clients/[id]/route");
    const request = new NextRequest(`http://localhost/api/clients/${validUuid}`, {
      method: "PATCH",
      body: JSON.stringify({ lastName: "Smith" }),
    });

    const response = await PATCH(request as any, { params: { id: validUuid } } as any);
    expect(response.status).toBe(404);
  });

  it("returns 400 for invalid email format in update", async () => {
    const { PATCH } = await import("@/app/api/clients/[id]/route");
    const request = new NextRequest(`http://localhost/api/clients/${validUuid}`, {
      method: "PATCH",
      body: JSON.stringify({ email: "invalid-email" }),
    });

    const response = await PATCH(request as any, { params: { id: validUuid } } as any);
    expect(response.status).toBe(400);
  });

  it("allows partial updates", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const mockClient = { id: validUuid, notes: "Updated notes" };
    vi.mocked(withFirmDb).mockResolvedValueOnce(mockClient as any);

    const { PATCH } = await import("@/app/api/clients/[id]/route");
    const request = new NextRequest(`http://localhost/api/clients/${validUuid}`, {
      method: "PATCH",
      body: JSON.stringify({ notes: "Updated notes" }),
    });

    const response = await PATCH(request as any, { params: { id: validUuid } } as any);
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json.notes).toBe("Updated notes");
  });
});

describe("Clients API - DELETE /api/clients/:id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("soft deletes client successfully (sets status to archived)", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    const mockClient = { id: validUuid, status: "archived" };
    vi.mocked(withFirmDb).mockResolvedValueOnce(mockClient as any);

    const { DELETE } = await import("@/app/api/clients/[id]/route");
    const request = new NextRequest(`http://localhost/api/clients/${validUuid}`, {
      method: "DELETE",
    });

    const response = await DELETE(request as any, { params: { id: validUuid } } as any);
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json.success).toBe(true);
  });

  it("returns 404 for non-existent client", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    vi.mocked(withFirmDb).mockResolvedValueOnce(null as any);

    const { DELETE } = await import("@/app/api/clients/[id]/route");
    const request = new NextRequest(`http://localhost/api/clients/${validUuid}`, {
      method: "DELETE",
    });

    const response = await DELETE(request as any, { params: { id: validUuid } } as any);
    expect(response.status).toBe(404);
  });

  it("returns 404 when id is not provided", async () => {
    const { DELETE } = await import("@/app/api/clients/[id]/route");
    const request = new NextRequest("http://localhost/api/clients/", {
      method: "DELETE",
    });

    const response = await DELETE(request as any, { params: {} } as any);
    expect(response.status).toBe(404);
  });
});
