import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { PortalNav } from "@/components/portal/portal-nav";

// Mock usePathname
const mockPathname = vi.fn();
vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname(),
}));

describe("PortalNav", () => {
  it("renders all navigation items", () => {
    mockPathname.mockReturnValue("/portal/dashboard");
    render(<PortalNav />);

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("My Cases")).toBeInTheDocument();
    expect(screen.getByText("Documents")).toBeInTheDocument();
    expect(screen.getByText("Invoices")).toBeInTheDocument();
  });

  it("highlights active dashboard link", () => {
    mockPathname.mockReturnValue("/portal/dashboard");
    render(<PortalNav />);

    const dashboardLink = screen.getByText("Dashboard").closest("a");
    expect(dashboardLink).toHaveClass("text-primary");
  });

  it("highlights active matters link", () => {
    mockPathname.mockReturnValue("/portal/matters");
    render(<PortalNav />);

    const mattersLink = screen.getByText("My Cases").closest("a");
    expect(mattersLink).toHaveClass("text-primary");
  });

  it("highlights active link for nested routes", () => {
    mockPathname.mockReturnValue("/portal/matters/matter-123");
    render(<PortalNav />);

    const mattersLink = screen.getByText("My Cases").closest("a");
    expect(mattersLink).toHaveClass("text-primary");
  });

  it("does not highlight inactive links", () => {
    mockPathname.mockReturnValue("/portal/dashboard");
    render(<PortalNav />);

    const invoicesLink = screen.getByText("Invoices").closest("a");
    expect(invoicesLink).not.toHaveClass("text-primary");
    expect(invoicesLink).toHaveClass("text-muted-foreground");
  });
});
