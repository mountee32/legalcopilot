import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PortalHeader } from "@/components/portal/portal-header";

// Mock usePortalAuth
const mockLogout = vi.fn();
vi.mock("@/lib/hooks/use-portal-auth", () => ({
  usePortalAuth: () => ({
    logout: mockLogout,
    isAuthenticated: true,
    isLoading: false,
    sessionToken: "test-token",
    clientId: "client-1",
    expiresAt: new Date(Date.now() + 1000).toISOString(),
  }),
}));

describe("PortalHeader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the portal header with logo", () => {
    render(<PortalHeader />);

    expect(screen.getByText("Legal Copilot")).toBeInTheDocument();
  });

  it("renders sign out button", () => {
    render(<PortalHeader />);

    expect(screen.getByRole("button", { name: /sign out/i })).toBeInTheDocument();
  });

  it("calls logout when sign out button is clicked", () => {
    render(<PortalHeader />);

    const signOutButton = screen.getByRole("button", { name: /sign out/i });
    fireEvent.click(signOutButton);

    expect(mockLogout).toHaveBeenCalledTimes(1);
  });
});
