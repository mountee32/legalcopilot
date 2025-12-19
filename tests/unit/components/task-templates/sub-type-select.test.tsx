import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SubTypeSelect } from "@/components/task-templates/sub-type-select";

describe("SubTypeSelect", () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders with default placeholder when practice area has sub-types", () => {
    render(<SubTypeSelect practiceArea="conveyancing" value={undefined} onChange={mockOnChange} />);

    expect(screen.getByRole("combobox")).toBeInTheDocument();
    expect(screen.getByText("Select case type...")).toBeInTheDocument();
  });

  it("renders 'Select practice area first' when practice area has no sub-types", () => {
    render(<SubTypeSelect practiceArea="unknown" value={undefined} onChange={mockOnChange} />);

    expect(screen.getByText("Select practice area first")).toBeInTheDocument();
  });

  it("renders sub-types for conveyancing practice area", () => {
    render(<SubTypeSelect practiceArea="conveyancing" value={undefined} onChange={mockOnChange} />);

    expect(screen.getByText("Freehold Purchase")).toBeInTheDocument();
    expect(screen.getByText("Freehold Sale")).toBeInTheDocument();
    expect(screen.getByText("Leasehold Purchase")).toBeInTheDocument();
    expect(screen.getByText("Remortgage")).toBeInTheDocument();
  });

  it("renders sub-types for family practice area", () => {
    render(<SubTypeSelect practiceArea="family" value={undefined} onChange={mockOnChange} />);

    expect(screen.getByText("Divorce Petition")).toBeInTheDocument();
    expect(screen.getByText("Financial Settlement")).toBeInTheDocument();
    expect(screen.getByText("Child Arrangements")).toBeInTheDocument();
  });

  it("renders sub-types for litigation practice area", () => {
    render(<SubTypeSelect practiceArea="litigation" value={undefined} onChange={mockOnChange} />);

    expect(screen.getByText("Contract Dispute")).toBeInTheDocument();
    expect(screen.getByText("Debt Recovery")).toBeInTheDocument();
  });

  it("calls onChange when a sub-type is selected", () => {
    render(<SubTypeSelect practiceArea="conveyancing" value={undefined} onChange={mockOnChange} />);

    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "freehold_purchase" } });

    expect(mockOnChange).toHaveBeenCalledWith("freehold_purchase");
  });

  it("displays the selected value", () => {
    render(
      <SubTypeSelect
        practiceArea="conveyancing"
        value="freehold_purchase"
        onChange={mockOnChange}
      />
    );

    const select = screen.getByRole("combobox") as HTMLSelectElement;
    expect(select.value).toBe("freehold_purchase");
  });

  it("is disabled when disabled prop is true", () => {
    render(
      <SubTypeSelect
        practiceArea="conveyancing"
        value={undefined}
        onChange={mockOnChange}
        disabled={true}
      />
    );

    const select = screen.getByRole("combobox");
    expect(select).toBeDisabled();
  });

  it("is disabled when practice area has no sub-types", () => {
    render(<SubTypeSelect practiceArea="invalid" value={undefined} onChange={mockOnChange} />);

    const select = screen.getByRole("combobox");
    expect(select).toBeDisabled();
  });

  it("has required attribute when required prop is true", () => {
    render(
      <SubTypeSelect
        practiceArea="conveyancing"
        value={undefined}
        onChange={mockOnChange}
        required={true}
      />
    );

    const select = screen.getByRole("combobox");
    expect(select).toHaveAttribute("required");
  });

  it("uses custom id when provided", () => {
    render(
      <SubTypeSelect
        practiceArea="conveyancing"
        value={undefined}
        onChange={mockOnChange}
        id="custom-id"
      />
    );

    expect(document.getElementById("custom-id")).toBeInTheDocument();
  });

  it("applies custom className when provided", () => {
    render(
      <SubTypeSelect
        practiceArea="conveyancing"
        value={undefined}
        onChange={mockOnChange}
        className="custom-class"
      />
    );

    const select = screen.getByRole("combobox");
    expect(select).toHaveClass("custom-class");
  });

  it("handles empty string value as undefined", () => {
    render(<SubTypeSelect practiceArea="conveyancing" value="" onChange={mockOnChange} />);

    const select = screen.getByRole("combobox") as HTMLSelectElement;
    expect(select.value).toBe("");
  });

  it("updates when practice area changes", () => {
    const { rerender } = render(
      <SubTypeSelect practiceArea="conveyancing" value={undefined} onChange={mockOnChange} />
    );

    expect(screen.getByText("Freehold Purchase")).toBeInTheDocument();

    rerender(<SubTypeSelect practiceArea="family" value={undefined} onChange={mockOnChange} />);

    expect(screen.getByText("Divorce Petition")).toBeInTheDocument();
    expect(screen.queryByText("Freehold Purchase")).not.toBeInTheDocument();
  });

  it("formats sub-types with proper capitalization", () => {
    render(
      <SubTypeSelect practiceArea="personal_injury" value={undefined} onChange={mockOnChange} />
    );

    expect(screen.getByText("Road Traffic Accident")).toBeInTheDocument();
    expect(screen.getByText("Employer Liability")).toBeInTheDocument();
    expect(screen.getByText("Clinical Negligence")).toBeInTheDocument();
  });
});
