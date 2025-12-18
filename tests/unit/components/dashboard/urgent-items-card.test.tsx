import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { UrgentItemsCard, type UrgentItem } from "@/components/dashboard/urgent-items-card";

// Mock lucide-react icons
vi.mock("lucide-react", () => {
  const createMockIcon = (name: string) => {
    const MockIcon = ({ className }: { className?: string }) => (
      <svg data-testid={`icon-${name}`} className={className} />
    );
    MockIcon.displayName = name;
    return MockIcon;
  };

  return {
    AlertTriangle: createMockIcon("AlertTriangle"),
    Calendar: createMockIcon("Calendar"),
    FileWarning: createMockIcon("FileWarning"),
    Clock: createMockIcon("Clock"),
  };
});

const mockUrgentItems: UrgentItem[] = [
  {
    id: "1",
    type: "limitation",
    title: "Limitation expires - Smith v Jones",
    description: "2 days remaining",
    href: "/matters/123",
  },
  {
    id: "2",
    type: "overdue",
    title: "Invoice overdue 30d",
    description: "ABC Corp - £4,250",
    href: "/billing/invoices/456",
  },
  {
    id: "3",
    type: "alert",
    title: "Client frustrated",
    description: "Email from Mrs Davis re: delays",
  },
];

describe("UrgentItemsCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the card with title", () => {
    render(<UrgentItemsCard items={[]} />);

    expect(screen.getByTestId("urgent-items-card")).toBeInTheDocument();
    expect(screen.getByText("Urgent Items")).toBeInTheDocument();
  });

  it("shows empty state when no items", () => {
    render(<UrgentItemsCard items={[]} />);

    expect(screen.getByTestId("urgent-items-empty")).toBeInTheDocument();
    expect(screen.getByText("Nothing urgent right now")).toBeInTheDocument();
  });

  it("renders list of urgent items", () => {
    render(<UrgentItemsCard items={mockUrgentItems} />);

    expect(screen.getByTestId("urgent-items-list")).toBeInTheDocument();
    expect(screen.getByText("Limitation expires - Smith v Jones")).toBeInTheDocument();
    expect(screen.getByText("Invoice overdue 30d")).toBeInTheDocument();
    expect(screen.getByText("Client frustrated")).toBeInTheDocument();
  });

  it("shows descriptions when present", () => {
    render(<UrgentItemsCard items={mockUrgentItems} />);

    expect(screen.getByText("2 days remaining")).toBeInTheDocument();
    expect(screen.getByText("ABC Corp - £4,250")).toBeInTheDocument();
    expect(screen.getByText("Email from Mrs Davis re: delays")).toBeInTheDocument();
  });

  it("renders items with links when href provided", () => {
    render(<UrgentItemsCard items={mockUrgentItems} />);

    // Items with href should be wrapped in links
    const limitationItem = screen.getByTestId("urgent-item-1");
    const linkElement = limitationItem.querySelector("a");
    expect(linkElement).toHaveAttribute("href", "/matters/123");

    const overdueItem = screen.getByTestId("urgent-item-2");
    const overdueLink = overdueItem.querySelector("a");
    expect(overdueLink).toHaveAttribute("href", "/billing/invoices/456");
  });

  it("renders items without links when no href", () => {
    render(<UrgentItemsCard items={mockUrgentItems} />);

    const alertItem = screen.getByTestId("urgent-item-3");
    const linkElement = alertItem.querySelector("a");
    expect(linkElement).toBeNull();
  });

  it("shows loading skeleton when isLoading", () => {
    render(<UrgentItemsCard items={[]} isLoading />);

    expect(screen.getByTestId("urgent-items-card-loading")).toBeInTheDocument();
  });
});
