import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MobileNav } from "@/components/app-shell/mobile-nav";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/dashboard"),
}));

describe("MobileNav", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the mobile navigation", () => {
    render(<MobileNav />);
    expect(screen.getByTestId("mobile-nav")).toBeInTheDocument();
  });

  it("renders home, inbox, and cases nav items", () => {
    render(<MobileNav />);

    expect(screen.getByTestId("mobile-nav-home")).toBeInTheDocument();
    expect(screen.getByTestId("mobile-nav-inbox")).toBeInTheDocument();
    expect(screen.getByTestId("mobile-nav-cases")).toBeInTheDocument();
  });

  it("renders quick action button", () => {
    render(<MobileNav />);
    expect(screen.getByTestId("mobile-nav-quick-action")).toBeInTheDocument();
  });

  it("highlights active navigation item", () => {
    render(<MobileNav />);
    const homeItem = screen.getByTestId("mobile-nav-home");
    expect(homeItem).toHaveAttribute("data-active", "true");
  });

  it("does not highlight inactive items", () => {
    render(<MobileNav />);
    const inboxItem = screen.getByTestId("mobile-nav-inbox");
    expect(inboxItem).toHaveAttribute("data-active", "false");
  });
});
