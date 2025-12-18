import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { usePortalAuth } from "@/lib/hooks/use-portal-auth";

// Mock useRouter
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe("usePortalAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("should initialize with unauthenticated state when no session exists", async () => {
    const { result } = renderHook(() => usePortalAuth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.sessionToken).toBe(null);
    expect(result.current.clientId).toBe(null);
  });

  it("should initialize with authenticated state when valid session exists", async () => {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    localStorage.setItem("portal_session_token", "test-token-123");
    localStorage.setItem("portal_session_expires", expiresAt);
    localStorage.setItem("portal_client_id", "client-123");

    const { result } = renderHook(() => usePortalAuth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.sessionToken).toBe("test-token-123");
    expect(result.current.clientId).toBe("client-123");
    expect(result.current.expiresAt).toBe(expiresAt);
  });

  it("should clear expired session on mount", async () => {
    const expiresAt = new Date(Date.now() - 1000).toISOString(); // Expired 1 second ago
    localStorage.setItem("portal_session_token", "test-token-123");
    localStorage.setItem("portal_session_expires", expiresAt);
    localStorage.setItem("portal_client_id", "client-123");

    const { result } = renderHook(() => usePortalAuth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(localStorage.getItem("portal_session_token")).toBe(null);
    expect(localStorage.getItem("portal_session_expires")).toBe(null);
    expect(localStorage.getItem("portal_client_id")).toBe(null);
  });

  it("should logout and clear session", async () => {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    localStorage.setItem("portal_session_token", "test-token-123");
    localStorage.setItem("portal_session_expires", expiresAt);
    localStorage.setItem("portal_client_id", "client-123");

    const { result } = renderHook(() => usePortalAuth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAuthenticated).toBe(true);

    act(() => {
      result.current.logout();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.sessionToken).toBe(null);
    expect(localStorage.getItem("portal_session_token")).toBe(null);
    expect(mockPush).toHaveBeenCalledWith("/portal/login");
  });

  it("should handle missing token but present expiry", async () => {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    localStorage.setItem("portal_session_expires", expiresAt);
    localStorage.setItem("portal_client_id", "client-123");

    const { result } = renderHook(() => usePortalAuth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAuthenticated).toBe(false);
  });

  it("should handle missing clientId", async () => {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    localStorage.setItem("portal_session_token", "test-token-123");
    localStorage.setItem("portal_session_expires", expiresAt);

    const { result } = renderHook(() => usePortalAuth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAuthenticated).toBe(false);
  });
});
