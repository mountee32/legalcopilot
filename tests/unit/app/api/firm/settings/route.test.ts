import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/middleware/withAuth", () => ({
  withAuth: (handler: any) => (request: any, ctx: any) =>
    handler(request, { ...ctx, user: { user: { id: "user-1" } } }),
}));

vi.mock("@/lib/tenancy", () => ({
  getOrCreateFirmIdForUser: vi.fn(async () => "firm-1"),
}));

vi.mock("@/lib/auth/rbac", () => ({
  getUserPermissions: vi.fn(async () => ["firm:settings"]),
  hasPermission: (permissions: string[], required: string) => permissions.includes(required),
}));

const tx = {
  select: vi.fn(),
  from: vi.fn(),
  where: vi.fn(),
  limit: vi.fn(),
  update: vi.fn(),
  set: vi.fn(),
  returning: vi.fn(),
};

vi.mock("@/lib/db/tenant", () => ({
  withFirmDb: vi.fn(async (_firmId: string, fn: any) => fn(tx)),
}));

describe("Firm settings API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET returns settings", async () => {
    tx.select.mockReturnThis();
    tx.from.mockReturnThis();
    tx.where.mockReturnThis();
    tx.limit.mockResolvedValueOnce([
      { settings: { billing: { invoicePrefix: "INV" } }, updatedAt: new Date() },
    ]);

    const { GET } = await import("@/app/api/firm/settings/route");
    const response = await GET({} as any, {} as any);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.settings.billing.invoicePrefix).toBe("INV");
    expect(typeof json.updatedAt).toBe("string");
  });

  it("PATCH merges nested objects", async () => {
    tx.select.mockReturnThis();
    tx.from.mockReturnThis();
    tx.where.mockReturnThis();
    tx.limit
      .mockResolvedValueOnce([
        { settings: { billing: { invoicePrefix: "INV", defaultVatRate: 20 } } },
      ])
      .mockResolvedValueOnce([]);

    tx.update.mockReturnThis();
    tx.set.mockReturnThis();
    tx.returning.mockResolvedValueOnce([
      {
        settings: { billing: { invoicePrefix: "INV", defaultVatRate: 10 } },
        updatedAt: new Date(),
      },
    ]);

    const { PATCH } = await import("@/app/api/firm/settings/route");
    const request = new NextRequest("http://localhost/api/firm/settings", {
      method: "PATCH",
      body: JSON.stringify({ billing: { defaultVatRate: 10 } }),
    });

    const response = await PATCH(request as any, {} as any);
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json.settings.billing.invoicePrefix).toBe("INV");
    expect(json.settings.billing.defaultVatRate).toBe(10);
  });
});
