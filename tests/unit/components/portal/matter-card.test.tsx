import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MatterCard } from "@/components/portal/matter-card";
import type { Matter } from "@/lib/hooks/use-portal-matters";

const mockMatter: Matter = {
  id: "matter-1",
  reference: "CONV-2024-001",
  title: "Property Purchase",
  description: "Purchase of 123 Main Street",
  status: "active",
  practiceArea: "conveyancing",
  billingType: "fixed_fee",
  openedAt: "2024-01-01T00:00:00Z",
  closedAt: null,
  keyDeadline: "2024-12-31T00:00:00Z",
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
};

describe("MatterCard", () => {
  it("renders matter title and reference", () => {
    render(<MatterCard matter={mockMatter} />);

    expect(screen.getByText("Property Purchase")).toBeInTheDocument();
    expect(screen.getByText("Ref: CONV-2024-001")).toBeInTheDocument();
  });

  it("renders matter description", () => {
    render(<MatterCard matter={mockMatter} />);

    expect(screen.getByText("Purchase of 123 Main Street")).toBeInTheDocument();
  });

  it("renders status badge", () => {
    render(<MatterCard matter={mockMatter} />);

    expect(screen.getByText("active")).toBeInTheDocument();
  });

  it("renders practice area", () => {
    render(<MatterCard matter={mockMatter} />);

    expect(screen.getByText(/conveyancing/i)).toBeInTheDocument();
  });

  it("renders opened date", () => {
    render(<MatterCard matter={mockMatter} />);

    expect(screen.getByText(/Opened/)).toBeInTheDocument();
  });

  it("renders deadline when present", () => {
    render(<MatterCard matter={mockMatter} />);

    expect(screen.getByText(/Deadline/)).toBeInTheDocument();
    expect(screen.getByText(/31 Dec 2024/)).toBeInTheDocument();
  });

  it("does not render deadline when not present", () => {
    const matterWithoutDeadline = { ...mockMatter, keyDeadline: null };
    render(<MatterCard matter={matterWithoutDeadline} />);

    expect(screen.queryByText(/Deadline/)).not.toBeInTheDocument();
  });

  it("renders as a link to matter detail", () => {
    render(<MatterCard matter={mockMatter} />);

    const link = screen.getByText("Property Purchase").closest("a");
    expect(link).toHaveAttribute("href", "/portal/matters/matter-1");
  });

  it("handles missing description gracefully", () => {
    const matterWithoutDescription = { ...mockMatter, description: null };
    render(<MatterCard matter={matterWithoutDescription} />);

    expect(screen.getByText("Property Purchase")).toBeInTheDocument();
    expect(screen.queryByText("Purchase of 123 Main Street")).not.toBeInTheDocument();
  });
});
