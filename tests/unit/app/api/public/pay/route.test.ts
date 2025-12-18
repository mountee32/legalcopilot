import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/db", () => ({
  db: {
    transaction: vi.fn(),
  },
}));

vi.mock("@/lib/billing/payment-link", () => ({
  isPaymentLinkValid: vi.fn(),
}));

describe("GET /api/public/pay/[token]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns invoice details for valid token", async () => {
    const { db } = await import("@/lib/db");
    const { isPaymentLinkValid } = await import("@/lib/billing/payment-link");

    vi.mocked(isPaymentLinkValid).mockReturnValue(true);
    vi.mocked(db.transaction).mockResolvedValueOnce({
      invoiceNumber: "INV-2024-001",
      invoiceDate: "2024-12-01",
      dueDate: "2024-12-15",
      total: "1000.00",
      balanceDue: "1000.00",
      status: "sent",
      firmName: "Test Law Firm",
      firmEmail: "billing@testfirm.com",
      clientName: "Test Client",
      items: [
        { description: "Legal consultation", amount: "500.00" },
        { description: "Document review", amount: "500.00" },
      ],
    } as any);

    const { GET } = await import("@/app/api/public/pay/[token]/route");
    const request = new NextRequest("http://localhost/api/public/pay/test-token-123");
    const response = await GET(
      request as any,
      {
        params: { token: "test-token-123" },
      } as any
    );

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.invoiceNumber).toBe("INV-2024-001");
    expect(json.total).toBe("1000.00");
    expect(json.firmName).toBe("Test Law Firm");
    expect(json.items).toHaveLength(2);
  });

  it("returns 404 for invalid token", async () => {
    const { db } = await import("@/lib/db");
    const NotFoundError = (await import("@/middleware/withErrorHandler")).NotFoundError;

    vi.mocked(db.transaction).mockImplementationOnce(() => {
      throw new NotFoundError("Payment link not found");
    });

    const { GET } = await import("@/app/api/public/pay/[token]/route");
    const request = new NextRequest("http://localhost/api/public/pay/invalid-token");

    const response = await GET(request as any, { params: { token: "invalid-token" } } as any);
    expect(response.status).toBe(404);
  });

  it("validates payment link expiration", async () => {
    const { db } = await import("@/lib/db");
    const { isPaymentLinkValid } = await import("@/lib/billing/payment-link");
    const ValidationError = (await import("@/middleware/withErrorHandler")).ValidationError;

    vi.mocked(isPaymentLinkValid).mockReturnValue(false);
    vi.mocked(db.transaction).mockImplementationOnce(() => {
      throw new ValidationError("Payment link has expired");
    });

    const { GET } = await import("@/app/api/public/pay/[token]/route");
    const request = new NextRequest("http://localhost/api/public/pay/expired-token");

    const response = await GET(request as any, { params: { token: "expired-token" } } as any);
    expect(response.status).toBe(400);
  });

  it("does not expose sensitive firm data", async () => {
    const { db } = await import("@/lib/db");
    const { isPaymentLinkValid } = await import("@/lib/billing/payment-link");

    vi.mocked(isPaymentLinkValid).mockReturnValue(true);
    vi.mocked(db.transaction).mockResolvedValueOnce({
      invoiceNumber: "INV-2024-001",
      invoiceDate: "2024-12-01",
      dueDate: "2024-12-15",
      total: "1000.00",
      balanceDue: "1000.00",
      status: "sent",
      firmName: "Test Law Firm",
      firmEmail: "billing@testfirm.com",
      clientName: "Test Client",
      items: [],
    } as any);

    const { GET } = await import("@/app/api/public/pay/[token]/route");
    const request = new NextRequest("http://localhost/api/public/pay/test-token");
    const response = await GET(
      request as any,
      {
        params: { token: "test-token" },
      } as any
    );

    const json = await response.json();
    // Should not expose firmId, clientId, or other internal data
    expect(json.firmId).toBeUndefined();
    expect(json.clientId).toBeUndefined();
    expect(json.paymentLinkToken).toBeUndefined();
  });

  it("includes line items in response", async () => {
    const { db } = await import("@/lib/db");
    const { isPaymentLinkValid } = await import("@/lib/billing/payment-link");

    vi.mocked(isPaymentLinkValid).mockReturnValue(true);
    vi.mocked(db.transaction).mockResolvedValueOnce({
      invoiceNumber: "INV-2024-001",
      invoiceDate: "2024-12-01",
      dueDate: "2024-12-15",
      total: "1500.00",
      balanceDue: "1500.00",
      status: "sent",
      firmName: "Test Law Firm",
      firmEmail: "billing@testfirm.com",
      clientName: "Test Client",
      items: [
        { description: "Court appearance", amount: "750.00" },
        { description: "Research", amount: "500.00" },
        { description: "Document preparation", amount: "250.00" },
      ],
    } as any);

    const { GET } = await import("@/app/api/public/pay/[token]/route");
    const request = new NextRequest("http://localhost/api/public/pay/test-token");
    const response = await GET(
      request as any,
      {
        params: { token: "test-token" },
      } as any
    );

    const json = await response.json();
    expect(json.items).toHaveLength(3);
    expect(json.items[0].description).toBe("Court appearance");
    expect(json.items[0].amount).toBe("750.00");
  });
});
