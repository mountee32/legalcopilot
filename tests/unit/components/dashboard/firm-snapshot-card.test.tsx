import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { FirmSnapshotCard } from "@/components/dashboard/firm-snapshot-card";

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
    Briefcase: createMockIcon("Briefcase"),
    PoundSterling: createMockIcon("PoundSterling"),
    AlertCircle: createMockIcon("AlertCircle"),
    TrendingUp: createMockIcon("TrendingUp"),
  };
});

describe("FirmSnapshotCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the card with title", () => {
    render(
      <FirmSnapshotCard
        activeCases={47}
        wipValue={124500}
        collectedMTD={45200}
        overdueInvoices={4}
      />
    );

    expect(screen.getByTestId("firm-snapshot-card")).toBeInTheDocument();
    expect(screen.getByText("Firm Snapshot")).toBeInTheDocument();
  });

  it("displays active cases count", () => {
    render(
      <FirmSnapshotCard
        activeCases={47}
        wipValue={124500}
        collectedMTD={45200}
        overdueInvoices={4}
      />
    );

    expect(screen.getByTestId("metric-active-cases")).toBeInTheDocument();
    expect(screen.getByText("47")).toBeInTheDocument();
  });

  it("displays WIP value formatted as currency", () => {
    render(
      <FirmSnapshotCard
        activeCases={47}
        wipValue={124500}
        collectedMTD={45200}
        overdueInvoices={4}
      />
    );

    expect(screen.getByTestId("metric-wip-value")).toBeInTheDocument();
    expect(screen.getByText("£124,500")).toBeInTheDocument();
  });

  it("displays collected MTD formatted as currency", () => {
    render(
      <FirmSnapshotCard
        activeCases={47}
        wipValue={124500}
        collectedMTD={45200}
        overdueInvoices={4}
      />
    );

    expect(screen.getByTestId("metric-collected-mtd")).toBeInTheDocument();
    expect(screen.getByText("£45,200")).toBeInTheDocument();
  });

  it("displays overdue invoices count", () => {
    render(
      <FirmSnapshotCard
        activeCases={47}
        wipValue={124500}
        collectedMTD={45200}
        overdueInvoices={4}
      />
    );

    expect(screen.getByTestId("metric-overdue-invoices")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
  });

  it("applies warning style when overdue invoices > 0", () => {
    render(
      <FirmSnapshotCard
        activeCases={47}
        wipValue={124500}
        collectedMTD={45200}
        overdueInvoices={4}
      />
    );

    const overdueElement = screen.getByTestId("metric-overdue-invoices");
    const valueElement = overdueElement.querySelector(".text-destructive");
    expect(valueElement).toBeInTheDocument();
  });

  it("does not apply warning style when overdue invoices is 0", () => {
    render(
      <FirmSnapshotCard
        activeCases={47}
        wipValue={124500}
        collectedMTD={45200}
        overdueInvoices={0}
      />
    );

    const overdueElement = screen.getByTestId("metric-overdue-invoices");
    // Find the p element with the count
    const valueElement = overdueElement.querySelector("p");
    expect(valueElement).not.toHaveClass("text-destructive");
  });

  it("handles zero values correctly", () => {
    render(<FirmSnapshotCard activeCases={0} wipValue={0} collectedMTD={0} overdueInvoices={0} />);

    // Multiple zeros will be present (active cases and overdue invoices)
    const zeros = screen.getAllByText("0");
    expect(zeros.length).toBe(2); // active cases and overdue invoices
    // WIP and collected MTD show as £0
    const poundZeros = screen.getAllByText("£0");
    expect(poundZeros.length).toBe(2);
  });

  it("formats large numbers correctly", () => {
    render(
      <FirmSnapshotCard
        activeCases={1000}
        wipValue={1250000}
        collectedMTD={985000}
        overdueInvoices={25}
      />
    );

    // Check the active cases metric specifically
    const activeCasesMetric = screen.getByTestId("metric-active-cases");
    expect(activeCasesMetric).toHaveTextContent("1,000");

    const wipMetric = screen.getByTestId("metric-wip-value");
    expect(wipMetric).toHaveTextContent("£1,250,000");

    const collectedMetric = screen.getByTestId("metric-collected-mtd");
    expect(collectedMetric).toHaveTextContent("£985,000");
  });

  it("shows loading skeleton when isLoading", () => {
    render(
      <FirmSnapshotCard
        activeCases={0}
        wipValue={0}
        collectedMTD={0}
        overdueInvoices={0}
        isLoading
      />
    );

    expect(screen.getByTestId("firm-snapshot-card-loading")).toBeInTheDocument();
  });
});
