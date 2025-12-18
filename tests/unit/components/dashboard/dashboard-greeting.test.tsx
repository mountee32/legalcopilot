import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { DashboardGreeting } from "@/components/dashboard/dashboard-greeting";

// Mock auth provider
vi.mock("@/components/providers/auth-provider", () => ({
  useAuth: vi.fn(() => ({
    session: {
      user: {
        id: "test-user-id",
        name: "Jane Smith",
        email: "jane@example.com",
      },
    },
    isLoading: false,
    isAuthenticated: true,
  })),
}));

describe("DashboardGreeting", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the greeting with user's first name", () => {
    const testDate = new Date("2024-12-18T10:00:00");
    render(<DashboardGreeting date={testDate} />);

    expect(screen.getByTestId("dashboard-greeting")).toBeInTheDocument();
    expect(screen.getByText(/Good morning, Jane/)).toBeInTheDocument();
  });

  it("shows the correct date format", () => {
    const testDate = new Date("2024-12-18T10:00:00");
    render(<DashboardGreeting date={testDate} />);

    expect(screen.getByTestId("dashboard-date")).toHaveTextContent("Wed 18 Dec 2024");
  });

  it("shows 'Good morning' before noon", () => {
    const morningDate = new Date("2024-12-18T09:00:00");
    render(<DashboardGreeting date={morningDate} />);

    expect(screen.getByText(/Good morning/)).toBeInTheDocument();
  });

  it("shows 'Good afternoon' between noon and 5pm", () => {
    const afternoonDate = new Date("2024-12-18T14:00:00");
    render(<DashboardGreeting date={afternoonDate} />);

    expect(screen.getByText(/Good afternoon/)).toBeInTheDocument();
  });

  it("shows 'Good evening' after 5pm", () => {
    const eveningDate = new Date("2024-12-18T18:00:00");
    render(<DashboardGreeting date={eveningDate} />);

    expect(screen.getByText(/Good evening/)).toBeInTheDocument();
  });
});
