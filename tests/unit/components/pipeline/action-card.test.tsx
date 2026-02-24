import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ActionsPanel } from "@/components/pipeline/action-card";

const mockActions = [
  {
    id: "a-1",
    actionType: "create_deadline",
    title: "Statute of Limitations Deadline",
    description: "Filing deadline approaching — verify jurisdiction rules",
    priority: 0,
    status: "pending",
    isDeterministic: "true",
  },
  {
    id: "a-2",
    actionType: "flag_risk",
    title: "Data conflict: Claimant Name",
    description: 'Extracted "John Smith" conflicts with existing "Jon Smith"',
    priority: 1,
    status: "pending",
    isDeterministic: "true",
  },
  {
    id: "a-3",
    actionType: "create_task",
    title: "Review Impairment Rating",
    description: null,
    priority: 2,
    status: "accepted",
    isDeterministic: "true",
  },
];

describe("ActionsPanel", () => {
  it("renders empty state when no actions", () => {
    render(<ActionsPanel actions={[]} />);
    expect(screen.getByText("No actions generated")).toBeDefined();
  });

  it("shows total actions count", () => {
    render(<ActionsPanel actions={mockActions} />);
    expect(screen.getByText("Actions (3)")).toBeDefined();
  });

  it("shows action titles", () => {
    render(<ActionsPanel actions={mockActions} />);
    expect(screen.getByText("Statute of Limitations Deadline")).toBeDefined();
    expect(screen.getByText("Data conflict: Claimant Name")).toBeDefined();
  });

  it("shows priority badges", () => {
    render(<ActionsPanel actions={mockActions} />);
    expect(screen.getByText("Urgent")).toBeDefined();
    expect(screen.getByText("High")).toBeDefined();
  });

  it("shows Rule badge for deterministic actions", () => {
    render(<ActionsPanel actions={mockActions} />);
    const ruleBadges = screen.getAllByText("Rule");
    expect(ruleBadges.length).toBeGreaterThanOrEqual(2);
  });

  it("calls onResolve when accept clicked", () => {
    const onResolve = vi.fn();
    render(<ActionsPanel actions={mockActions} onResolve={onResolve} />);

    const acceptBtns = screen.getAllByText("Accept");
    fireEvent.click(acceptBtns[0]);

    expect(onResolve).toHaveBeenCalledWith("a-1", "accepted");
  });

  it("separates resolved actions", () => {
    render(<ActionsPanel actions={mockActions} />);
    expect(screen.getByText("Resolved")).toBeDefined();
  });
});
