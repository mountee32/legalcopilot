import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FindingsPanel } from "@/components/pipeline/findings-panel";

const mockFindings = [
  {
    id: "f-1",
    categoryKey: "claimant_info",
    fieldKey: "claimant_name",
    label: "Claimant Full Name",
    value: "John Smith",
    sourceQuote: "Patient: John Smith",
    confidence: "0.950",
    impact: "high",
    status: "pending",
    existingValue: null,
  },
  {
    id: "f-2",
    categoryKey: "claimant_info",
    fieldKey: "date_of_birth",
    label: "Date of Birth",
    value: "1985-03-15",
    sourceQuote: null,
    confidence: "0.850",
    impact: "medium",
    status: "auto_applied",
    existingValue: null,
  },
  {
    id: "f-3",
    categoryKey: "injury_details",
    fieldKey: "injury_date",
    label: "Date of Injury",
    value: "2025-01-15",
    sourceQuote: null,
    confidence: "0.900",
    impact: "critical",
    status: "conflict",
    existingValue: "2025-01-16",
  },
];

describe("FindingsPanel", () => {
  it("renders empty state when no findings", () => {
    render(<FindingsPanel findings={[]} />);
    expect(screen.getByText("No findings extracted yet")).toBeDefined();
  });

  it("shows total findings count", () => {
    render(<FindingsPanel findings={mockFindings} />);
    expect(screen.getByText("Findings (3)")).toBeDefined();
  });

  it("shows pending count badge", () => {
    render(<FindingsPanel findings={mockFindings} />);
    expect(screen.getByText("1 pending")).toBeDefined();
  });

  it("shows conflict count badge", () => {
    render(<FindingsPanel findings={mockFindings} />);
    expect(screen.getByText("1 conflicts")).toBeDefined();
  });

  it("groups findings by category", () => {
    render(<FindingsPanel findings={mockFindings} />);
    expect(screen.getByText("claimant info")).toBeDefined();
    expect(screen.getByText("injury details")).toBeDefined();
  });

  it("shows finding values", () => {
    render(<FindingsPanel findings={mockFindings} />);
    expect(screen.getByText("John Smith")).toBeDefined();
    expect(screen.getByText("1985-03-15")).toBeDefined();
  });

  it("calls onResolve when accept button clicked", () => {
    const onResolve = vi.fn();
    render(<FindingsPanel findings={mockFindings} onResolve={onResolve} />);

    // Expand the pending finding to see buttons
    const findingLabel = screen.getByText("Claimant Full Name");
    fireEvent.click(findingLabel);

    const acceptBtn = screen.getByText("Accept");
    fireEvent.click(acceptBtn);

    expect(onResolve).toHaveBeenCalledWith("f-1", "accepted");
  });
});
