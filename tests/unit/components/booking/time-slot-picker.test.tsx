import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TimeSlotPicker } from "@/components/booking/time-slot-picker";

describe("TimeSlotPicker", () => {
  const mockSlots = [
    {
      startAt: "2025-01-15T09:00:00Z",
      endAt: "2025-01-15T09:30:00Z",
      appointmentTypeId: "type-1",
      assignedTo: null,
    },
    {
      startAt: "2025-01-15T10:00:00Z",
      endAt: "2025-01-15T10:30:00Z",
      appointmentTypeId: "type-1",
      assignedTo: null,
    },
    {
      startAt: "2025-01-15T14:00:00Z",
      endAt: "2025-01-15T14:30:00Z",
      appointmentTypeId: "type-1",
      assignedTo: null,
    },
    {
      startAt: "2025-01-15T18:00:00Z",
      endAt: "2025-01-15T18:30:00Z",
      appointmentTypeId: "type-1",
      assignedTo: null,
    },
  ];

  it("should render time slots grouped by period", () => {
    render(<TimeSlotPicker slots={mockSlots} selectedSlot={null} onSlotSelect={vi.fn()} />);

    expect(screen.getByText("Morning")).toBeInTheDocument();
    expect(screen.getByText("Afternoon")).toBeInTheDocument();
    expect(screen.getByText("Evening")).toBeInTheDocument();
  });

  it("should show loading state", () => {
    render(
      <TimeSlotPicker slots={[]} selectedSlot={null} onSlotSelect={vi.fn()} isLoading={true} />
    );

    // Check for loading spinner
    const spinner = document.querySelector(".animate-spin");
    expect(spinner).toBeInTheDocument();
  });

  it("should show empty state when no slots available", () => {
    render(<TimeSlotPicker slots={[]} selectedSlot={null} onSlotSelect={vi.fn()} />);

    expect(screen.getByText("No available time slots for this date")).toBeInTheDocument();
  });

  it("should show custom empty message", () => {
    render(
      <TimeSlotPicker
        slots={[]}
        selectedSlot={null}
        onSlotSelect={vi.fn()}
        emptyMessage="Custom message"
      />
    );

    expect(screen.getByText("Custom message")).toBeInTheDocument();
  });

  it("should call onSlotSelect when slot is clicked", () => {
    const onSlotSelect = vi.fn();
    render(<TimeSlotPicker slots={mockSlots} selectedSlot={null} onSlotSelect={onSlotSelect} />);

    const firstSlot = screen.getByText("09:00");
    fireEvent.click(firstSlot);

    expect(onSlotSelect).toHaveBeenCalledWith(mockSlots[0]);
  });

  it("should highlight selected slot", () => {
    const { rerender } = render(
      <TimeSlotPicker slots={mockSlots} selectedSlot={mockSlots[0]} onSlotSelect={vi.fn()} />
    );

    const selectedButton = screen.getByText("09:00").closest("button");
    expect(selectedButton?.className).toContain("bg-amber-600");

    // Change selection
    rerender(
      <TimeSlotPicker slots={mockSlots} selectedSlot={mockSlots[1]} onSlotSelect={vi.fn()} />
    );

    const newSelectedButton = screen.getByText("10:00").closest("button");
    expect(newSelectedButton?.className).toContain("bg-amber-600");
  });

  it("should not render period headers with no slots", () => {
    const afternoonOnlySlots = [mockSlots[2]];

    render(
      <TimeSlotPicker slots={afternoonOnlySlots} selectedSlot={null} onSlotSelect={vi.fn()} />
    );

    expect(screen.queryByText("Morning")).not.toBeInTheDocument();
    expect(screen.getByText("Afternoon")).toBeInTheDocument();
    expect(screen.queryByText("Evening")).not.toBeInTheDocument();
  });
});
