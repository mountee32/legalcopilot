import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { withFirmDb } from "@/lib/db/tenant";
import { NotFoundError, ValidationError } from "@/middleware/withErrorHandler";

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

vi.mock("@/lib/db/tenant");

vi.mock("@/lib/billing/payment-link", () => ({
  generatePaymentToken: vi.fn(() => "test-token-123"),
  calculateExpiry: vi.fn(() => new Date("2025-12-21T00:00:00Z")),
}));

describe("POST /api/invoices/[id]/pay-link", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("generates payment link for valid invoice", async () => {
    vi.mocked(withFirmDb).mockImplementationOnce(async (firmId: string, callback: any) => {
      return callback({
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([
          {
            id: "inv-1",
            status: "sent",
            paymentLinkToken: null,
            paymentLinkExpiresAt: null,
          },
        ]),
        update: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([
          {
            id: "inv-1",
            token: "test-token-123",
            expiresAt: new Date("2025-12-21T00:00:00Z"),
          },
        ]),
      });
    });

    const { POST } = await import("@/app/api/invoices/[id]/pay-link/route");
    const request = new NextRequest("http://localhost/api/invoices/inv-1/pay-link", {
      method: "POST",
    });
    const response = await POST(
      request as any,
      {
        params: Promise.resolve({ id: "inv-1" }),
      } as any
    );

    expect(response.status).toBe(201);
    const json = await response.json();
    expect(json.paymentUrl).toContain("/public/pay/test-token-123");
    expect(json.token).toBe("test-token-123");
    expect(json.expiresAt).toBeDefined();
  });

  it("returns 404 for non-existent invoice", async () => {
    vi.mocked(withFirmDb).mockImplementationOnce(async (firmId: string, callback: any) => {
      return callback({
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      });
    });

    const { POST } = await import("@/app/api/invoices/[id]/pay-link/route");
    const request = new NextRequest("http://localhost/api/invoices/invalid/pay-link", {
      method: "POST",
    });

    const response = await POST(
      request as any,
      {
        params: Promise.resolve({ id: "invalid" }),
      } as any
    );
    expect(response.status).toBe(404);
  });

  it("validates invoice status before generating link", async () => {
    vi.mocked(withFirmDb).mockImplementationOnce(async (firmId: string, callback: any) => {
      return callback({
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([
          {
            id: "paid-inv",
            status: "paid",
            paymentLinkToken: null,
            paymentLinkExpiresAt: null,
          },
        ]),
      });
    });

    const { POST } = await import("@/app/api/invoices/[id]/pay-link/route");
    const request = new NextRequest("http://localhost/api/invoices/paid-inv/pay-link", {
      method: "POST",
    });

    const response = await POST(
      request as any,
      {
        params: Promise.resolve({ id: "paid-inv" }),
      } as any
    );
    expect(response.status).toBe(400);
  });

  it("includes token expiration in response", async () => {
    const expiryDate = new Date("2025-12-21T00:00:00Z");

    vi.mocked(withFirmDb).mockImplementationOnce(async (firmId: string, callback: any) => {
      return callback({
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([
          {
            id: "inv-1",
            status: "sent",
            paymentLinkToken: null,
            paymentLinkExpiresAt: null,
          },
        ]),
        update: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([
          {
            id: "inv-1",
            token: "test-token-123",
            expiresAt: expiryDate,
          },
        ]),
      });
    });

    const { POST } = await import("@/app/api/invoices/[id]/pay-link/route");
    const request = new NextRequest("http://localhost/api/invoices/inv-1/pay-link", {
      method: "POST",
    });
    const response = await POST(
      request as any,
      {
        params: Promise.resolve({ id: "inv-1" }),
      } as any
    );

    const json = await response.json();
    expect(json.expiresAt).toBe(expiryDate.toISOString());
  });
});
