import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { usePortalMatters, usePortalMatter } from "@/lib/hooks/use-portal-matters";
import * as usePortalAuth from "@/lib/hooks/use-portal-auth";

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockMattersResponse = {
  success: true,
  matters: [
    {
      id: "matter-1",
      reference: "CONV-2024-001",
      title: "Property Purchase",
      description: "Purchase of 123 Main St",
      status: "active",
      practiceArea: "conveyancing",
      billingType: "fixed_fee",
      openedAt: "2024-01-01T00:00:00Z",
      closedAt: null,
      keyDeadline: "2024-12-31T00:00:00Z",
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    },
  ],
  count: 1,
};

const mockMatterDetailResponse = {
  success: true,
  matter: {
    id: "matter-1",
    reference: "CONV-2024-001",
    title: "Property Purchase",
    description: "Purchase of 123 Main St",
    status: "active",
    practiceArea: "conveyancing",
    billingType: "fixed_fee",
    openedAt: "2024-01-01T00:00:00Z",
    closedAt: null,
    keyDeadline: "2024-12-31T00:00:00Z",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    feeEarner: {
      id: "user-1",
      name: "Jane Solicitor",
      email: "jane@example.com",
    },
  },
};

describe("usePortalMatters", () => {
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

  it("fetches matters when authenticated", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockMattersResponse,
    });

    const { result } = renderHook(() => usePortalMatters());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockFetch).toHaveBeenCalledWith("/api/portal/matters", {
      headers: {
        Authorization: "Bearer test-token",
      },
    });
    expect(result.current.matters).toHaveLength(1);
    expect(result.current.matters[0].id).toBe("matter-1");
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

    const { result } = renderHook(() => usePortalMatters());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockFetch).not.toHaveBeenCalled();
    expect(result.current.matters).toEqual([]);
  });

  it("handles API errors", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Failed to fetch matters" }),
    });

    const { result } = renderHook(() => usePortalMatters());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe("Failed to fetch matters");
    expect(result.current.matters).toEqual([]);
  });

  it("handles network errors", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() => usePortalMatters());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe("Network error");
  });
});

describe("usePortalMatter", () => {
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

  it("fetches matter detail when authenticated", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockMatterDetailResponse,
    });

    const { result } = renderHook(() => usePortalMatter("matter-1"));

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockFetch).toHaveBeenCalledWith("/api/portal/matters/matter-1", {
      headers: {
        Authorization: "Bearer test-token",
      },
    });
    expect(result.current.matter).toBeTruthy();
    expect(result.current.matter?.id).toBe("matter-1");
    expect(result.current.matter?.feeEarner?.name).toBe("Jane Solicitor");
    expect(result.current.error).toBe(null);
  });

  it("does not fetch without matterId", async () => {
    const { result } = renderHook(() => usePortalMatter(""));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockFetch).not.toHaveBeenCalled();
    expect(result.current.matter).toBe(null);
  });

  it("handles API errors", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Matter not found" }),
    });

    const { result } = renderHook(() => usePortalMatter("matter-1"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe("Matter not found");
    expect(result.current.matter).toBe(null);
  });
});
