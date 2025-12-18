import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ApprovalQueueCard, type ApprovalItem } from "@/components/dashboard/approval-queue-card";

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
    CheckCircle: createMockIcon("CheckCircle"),
    XCircle: createMockIcon("XCircle"),
    Mail: createMockIcon("Mail"),
    Clock: createMockIcon("Clock"),
    ArrowRight: createMockIcon("ArrowRight"),
    Sparkles: createMockIcon("Sparkles"),
  };
});

const mockApprovals: ApprovalItem[] = [
  {
    id: "1",
    action: "send_email",
    summary: "Reply to John Smith re: completion date",
    confidence: 94,
    matterId: "CONV-2024-042",
  },
  {
    id: "2",
    action: "time_entry",
    summary: "2.5 hrs - Contract review",
    confidence: 87,
    matterId: "CONV-2024-042",
  },
  {
    id: "3",
    action: "stage_change",
    summary: "Move to Defence Filed",
    confidence: 65,
    matterId: "LIT-2024-031",
  },
];

describe("ApprovalQueueCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the card with title", () => {
    render(<ApprovalQueueCard approvals={[]} total={0} />);

    expect(screen.getByTestId("approval-queue-card")).toBeInTheDocument();
    expect(screen.getByText("Approval Queue")).toBeInTheDocument();
  });

  it("shows empty state when no approvals", () => {
    render(<ApprovalQueueCard approvals={[]} total={0} />);

    expect(screen.getByTestId("approval-queue-empty")).toBeInTheDocument();
    expect(screen.getByText("No pending approvals")).toBeInTheDocument();
  });

  it("renders list of approvals", () => {
    render(<ApprovalQueueCard approvals={mockApprovals} total={3} />);

    expect(screen.getByTestId("approval-queue-list")).toBeInTheDocument();
    expect(screen.getByText("Reply to John Smith re: completion date")).toBeInTheDocument();
    expect(screen.getByText("2.5 hrs - Contract review")).toBeInTheDocument();
    expect(screen.getByText("Move to Defence Filed")).toBeInTheDocument();
  });

  it("shows total count badge", () => {
    render(<ApprovalQueueCard approvals={mockApprovals} total={7} />);

    expect(screen.getByText("7")).toBeInTheDocument();
  });

  it("displays confidence badges with correct values", () => {
    render(<ApprovalQueueCard approvals={mockApprovals} total={3} />);

    expect(screen.getByTestId("confidence-badge-1")).toHaveTextContent("94%");
    expect(screen.getByTestId("confidence-badge-2")).toHaveTextContent("87%");
    expect(screen.getByTestId("confidence-badge-3")).toHaveTextContent("65%");
  });

  it("calls onApprove when approve button clicked", () => {
    const onApprove = vi.fn();
    render(<ApprovalQueueCard approvals={mockApprovals} total={3} onApprove={onApprove} />);

    fireEvent.click(screen.getByTestId("approve-btn-1"));
    expect(onApprove).toHaveBeenCalledWith("1");
  });

  it("calls onReject when reject button clicked", () => {
    const onReject = vi.fn();
    render(<ApprovalQueueCard approvals={mockApprovals} total={3} onReject={onReject} />);

    fireEvent.click(screen.getByTestId("reject-btn-2"));
    expect(onReject).toHaveBeenCalledWith("2");
  });

  it("shows View All link", () => {
    render(<ApprovalQueueCard approvals={mockApprovals} total={3} />);

    const viewAllLink = screen.getByTestId("view-all-approvals-link");
    expect(viewAllLink).toBeInTheDocument();
    expect(viewAllLink).toHaveAttribute("href", "/inbox");
  });

  it("shows Approve High Confidence link when high confidence items exist", () => {
    render(<ApprovalQueueCard approvals={mockApprovals} total={3} />);

    const highConfLink = screen.getByTestId("approve-high-confidence-link");
    expect(highConfLink).toBeInTheDocument();
    expect(highConfLink).toHaveTextContent("Approve High Confidence (1)");
  });

  it("shows loading skeleton when isLoading", () => {
    render(<ApprovalQueueCard approvals={[]} total={0} isLoading />);

    expect(screen.getByTestId("approval-queue-card-loading")).toBeInTheDocument();
  });

  it("displays matter ID when present", () => {
    render(<ApprovalQueueCard approvals={mockApprovals} total={3} />);

    // Use getAllByText since multiple items can have the same matter ID
    const convMatters = screen.getAllByText("CONV-2024-042");
    expect(convMatters.length).toBeGreaterThan(0);
    expect(screen.getByText("LIT-2024-031")).toBeInTheDocument();
  });
});
