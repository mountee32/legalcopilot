import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/middleware/withAuth", () => ({
  withAuth: (handler: any) => (request: any, ctx: any) =>
    handler(request, {
      ...ctx,
      user: { user: { id: "user-1", email: "test@test.com", name: "Test" } },
    }),
}));

vi.mock("@/lib/tenancy", () => ({
  getOrCreateFirmIdForUser: vi.fn(async () => "firm-1"),
}));

vi.mock("@/lib/db/tenant", () => ({
  withFirmDb: vi.fn(),
}));

describe("GET /api/email-imports", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("returns paginated imports list", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    vi.mocked(withFirmDb).mockImplementation(async (firmId, callback) => {
      return {
        imports: [
          {
            id: "imp-1",
            fromAddress: "test@example.com",
            subject: "Test email",
            status: "completed",
            receivedAt: new Date().toISOString(),
          },
        ],
        total: 1,
        page: 1,
        limit: 25,
      };
    });

    const { GET } = await import("@/app/api/email-imports/route");
    const request = new Request("http://localhost:3000/api/email-imports");
    const response = await GET(request, {} as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.imports).toHaveLength(1);
    expect(data.total).toBe(1);
    expect(data.page).toBe(1);
  });

  it("filters by status parameter", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    vi.mocked(withFirmDb).mockImplementation(async (firmId, callback) => {
      return { imports: [], total: 0, page: 1, limit: 25 };
    });

    const { GET } = await import("@/app/api/email-imports/route");
    const request = new Request("http://localhost:3000/api/email-imports?status=unmatched");
    const response = await GET(request, {} as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.imports).toHaveLength(0);
  });

  it("filters by matterId parameter", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    vi.mocked(withFirmDb).mockImplementation(async (firmId, callback) => {
      return {
        imports: [{ id: "imp-1", matterId: "matter-1" }],
        total: 1,
        page: 1,
        limit: 25,
      };
    });

    const { GET } = await import("@/app/api/email-imports/route");
    const request = new Request(
      "http://localhost:3000/api/email-imports?matterId=00000000-0000-0000-0000-000000000001"
    );
    const response = await GET(request, {} as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.imports).toHaveLength(1);
  });

  it("returns empty list when no imports exist", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    vi.mocked(withFirmDb).mockImplementation(async (firmId, callback) => {
      return { imports: [], total: 0, page: 1, limit: 25 };
    });

    const { GET } = await import("@/app/api/email-imports/route");
    const request = new Request("http://localhost:3000/api/email-imports");
    const response = await GET(request, {} as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.imports).toHaveLength(0);
    expect(data.total).toBe(0);
  });

  it("respects pagination parameters", async () => {
    const { withFirmDb } = await import("@/lib/db/tenant");
    vi.mocked(withFirmDb).mockImplementation(async (firmId, callback) => {
      return { imports: [], total: 50, page: 3, limit: 10 };
    });

    const { GET } = await import("@/app/api/email-imports/route");
    const request = new Request("http://localhost:3000/api/email-imports?page=3&limit=10");
    const response = await GET(request, {} as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.page).toBe(3);
    expect(data.limit).toBe(10);
  });
});
