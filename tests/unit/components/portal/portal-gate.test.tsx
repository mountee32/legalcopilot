import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { PortalGate } from "@/components/portal/portal-gate";
import * as usePortalAuth from "@/lib/hooks/use-portal-auth";

// Mock useRouter
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: () => "/portal/dashboard",
}));

describe("PortalGate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading state when checking authentication", () => {
    vi.spyOn(usePortalAuth, "usePortalAuth").mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
      sessionToken: null,
      clientId: null,
      expiresAt: null,
      logout: vi.fn(),
    });

    render(
      <PortalGate>
        <div>Protected Content</div>
      </PortalGate>
    );

    expect(screen.getByTestId("portal-gate-loading")).toBeInTheDocument();
    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
  });

  it("renders children when authenticated", async () => {
    vi.spyOn(usePortalAuth, "usePortalAuth").mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      sessionToken: "test-token",
      clientId: "client-1",
      expiresAt: new Date(Date.now() + 1000).toISOString(),
      logout: vi.fn(),
    });

    render(
      <PortalGate>
        <div>Protected Content</div>
      </PortalGate>
    );

    expect(screen.getByText("Protected Content")).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("redirects to login when not authenticated", async () => {
    vi.spyOn(usePortalAuth, "usePortalAuth").mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      sessionToken: null,
      clientId: null,
      expiresAt: null,
      logout: vi.fn(),
    });

    render(
      <PortalGate>
        <div>Protected Content</div>
      </PortalGate>
    );

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/portal/login");
    });

    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
  });
});
