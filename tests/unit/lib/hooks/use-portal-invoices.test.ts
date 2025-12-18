import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { usePortalInvoices } from "@/lib/hooks/use-portal-invoices";
import * as usePortalAuth from "@/lib/hooks/use-portal-auth";

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockInvoicesResponse = {
  success: true,
  invoices: [
    {
      invoice: {
        id: "invoice-1",
        invoiceNumber: "INV-2024-001",
        status: "sent",
        invoiceDate: "2024-01-01T00:00:00Z",
        dueDate: "2024-01-31T00:00:00Z",
        subtotal: "1000.00",
        vatAmount: "200.00",
        vatRate: "20",
        total: "1200.00",
        paidAmount: "0.00",
        balanceDue: "1200.00",
        sentAt: "2024-01-01T00:00:00Z",
        viewedAt: null,
        paidAt: null,
        createdAt: "2024-01-01T00:00:00Z",
      },
      matter: {
        id: "matter-1",
        reference: "CONV-2024-001",
        title: "Property Purchase",
      },
    },
  ],
  count: 1,
};

describe("usePortalInvoices", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(usePortalAuth, "usePortalAuth").mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      sessionToken: "test-token",
      clientId: "client-1",
      expiresAt: new Date(Date.now() + 1000).toISOString(),
      logout: vi.fn(),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches invoices when authenticated", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockInvoicesResponse,
    });

    const { result } = renderHook(() => usePortalInvoices());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockFetch).toHaveBeenCalledWith("/api/portal/invoices", {
      headers: {
        Authorization: "Bearer test-token",
      },
    });
    expect(result.current.invoices).toHaveLength(1);
    expect(result.current.invoices[0].invoice.id).toBe("invoice-1");
    expect(result.current.invoices[0].matter?.title).toBe("Property Purchase");
    expect(result.current.error).toBe(null);
  });

  it("does not fetch when not authenticated", async () => {
    vi.spyOn(usePortalAuth, "usePortalAuth").mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      sessionToken: null,
      clientId: null,
      expiresAt: null,
      logout: vi.fn(),
    });

    const { result } = renderHook(() => usePortalInvoices());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockFetch).not.toHaveBeenCalled();
    expect(result.current.invoices).toEqual([]);
  });

  it("handles API errors", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Failed to fetch invoices" }),
    });

    const { result } = renderHook(() => usePortalInvoices());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe("Failed to fetch invoices");
    expect(result.current.invoices).toEqual([]);
  });

  it("handles network errors", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() => usePortalInvoices());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe("Network error");
  });
});
