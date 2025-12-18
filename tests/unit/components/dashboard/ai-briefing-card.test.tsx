import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { AIBriefingCard } from "@/components/dashboard/ai-briefing-card";

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
    RefreshCw: createMockIcon("RefreshCw"),
    Sparkles: createMockIcon("Sparkles"),
  };
});

describe("AIBriefingCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the card with title", () => {
    render(<AIBriefingCard taskCount={5} emailCount={12} meetingCount={2} />);

    expect(screen.getByTestId("ai-briefing-card")).toBeInTheDocument();
    expect(screen.getByText("AI Briefing")).toBeInTheDocument();
  });

  it("displays task count", () => {
    render(<AIBriefingCard taskCount={5} emailCount={12} meetingCount={2} />);

    expect(screen.getByTestId("briefing-tasks")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText(/tasks need attention/)).toBeInTheDocument();
  });

  it("displays email count", () => {
    render(<AIBriefingCard taskCount={5} emailCount={12} meetingCount={2} />);

    expect(screen.getByTestId("briefing-emails")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText(/emails processed/)).toBeInTheDocument();
  });

  it("displays meeting count", () => {
    render(<AIBriefingCard taskCount={5} emailCount={12} meetingCount={2} />);

    expect(screen.getByTestId("briefing-meetings")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText(/meetings scheduled/)).toBeInTheDocument();
  });

  it("handles zero counts", () => {
    render(<AIBriefingCard taskCount={0} emailCount={0} meetingCount={0} />);

    // All three metrics will show 0
    const zeros = screen.getAllByText("0");
    expect(zeros.length).toBe(3);
  });

  it("has a disabled refresh button", () => {
    render(<AIBriefingCard taskCount={5} emailCount={12} meetingCount={2} />);

    const refreshButton = screen.getByRole("button", { name: /refresh/i });
    expect(refreshButton).toBeDisabled();
  });

  it("shows loading skeleton when isLoading", () => {
    render(<AIBriefingCard taskCount={0} emailCount={0} meetingCount={0} isLoading />);

    expect(screen.getByTestId("ai-briefing-card-loading")).toBeInTheDocument();
  });
});
