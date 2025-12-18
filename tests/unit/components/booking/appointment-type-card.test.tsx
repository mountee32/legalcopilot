import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AppointmentTypeCard } from "@/components/booking/appointment-type-card";

describe("AppointmentTypeCard", () => {
  const defaultProps = {
    id: "type-1",
    name: "Initial Consultation",
    description: "First meeting with a solicitor",
    practiceArea: "conveyancing",
    duration: 30,
  };

  it("should render appointment type information", () => {
    render(<AppointmentTypeCard {...defaultProps} />);

    expect(screen.getByText("Initial Consultation")).toBeInTheDocument();
    expect(screen.getByText("First meeting with a solicitor")).toBeInTheDocument();
    expect(screen.getByText("30 mins")).toBeInTheDocument();
    expect(screen.getByText("conveyancing")).toBeInTheDocument();
  });

  it("should render without description", () => {
    render(<AppointmentTypeCard {...defaultProps} description={null} />);

    expect(screen.getByText("Initial Consultation")).toBeInTheDocument();
    expect(screen.queryByText("First meeting with a solicitor")).not.toBeInTheDocument();
  });

  it("should render without practice area", () => {
    render(<AppointmentTypeCard {...defaultProps} practiceArea={null} />);

    expect(screen.getByText("Initial Consultation")).toBeInTheDocument();
    expect(screen.queryByText("conveyancing")).not.toBeInTheDocument();
  });

  it("should show selected state", () => {
    const { container } = render(<AppointmentTypeCard {...defaultProps} selected={true} />);

    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain("ring-amber-600");
  });

  it("should call onClick when clicked", () => {
    const onClick = vi.fn();
    render(<AppointmentTypeCard {...defaultProps} onClick={onClick} />);

    const card = screen.getByText("Initial Consultation").closest("div");
    if (card) {
      fireEvent.click(card);
    }

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("should apply custom className", () => {
    const { container } = render(
      <AppointmentTypeCard {...defaultProps} className="custom-class" />
    );

    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain("custom-class");
  });
});
