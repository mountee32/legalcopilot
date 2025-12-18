import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { AuthGate } from "@/components/auth/auth-gate";

// Mock next/navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: vi.fn(() => "/dashboard"),
}));

// Mock Better Auth client
const mockUseSession = vi.fn();
vi.mock("@/lib/auth/client", () => ({
  useSession: () => mockUseSession(),
}));

describe("AuthGate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading state while session is pending", () => {
    mockUseSession.mockReturnValue({
      data: null,
      isPending: true,
    });

    render(
      <AuthGate>
        <div>Protected content</div>
      </AuthGate>
    );

    expect(screen.getByTestId("auth-gate-loading")).toBeInTheDocument();
    expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
  });

  it("renders children when authenticated", () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: "test-user-id",
          name: "Test User",
          email: "test@example.com",
        },
      },
      isPending: false,
    });

    render(
      <AuthGate>
        <div>Protected content</div>
      </AuthGate>
    );

    expect(screen.getByText("Protected content")).toBeInTheDocument();
  });

  it("redirects to login when not authenticated", async () => {
    mockUseSession.mockReturnValue({
      data: null,
      isPending: false,
    });

    render(
      <AuthGate>
        <div>Protected content</div>
      </AuthGate>
    );

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/login?redirect=%2Fdashboard");
    });
  });

  it("does not render children when redirecting", () => {
    mockUseSession.mockReturnValue({
      data: null,
      isPending: false,
    });

    render(
      <AuthGate>
        <div>Protected content</div>
      </AuthGate>
    );

    expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
  });
});
