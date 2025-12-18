import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BookingConfirmation } from "@/components/booking/booking-confirmation";

describe("BookingConfirmation", () => {
  const defaultProps = {
    bookingId: "booking-123",
    appointmentTypeName: "Initial Consultation",
    startAt: "2025-01-15T09:00:00Z",
    endAt: "2025-01-15T09:30:00Z",
    clientName: "John Smith",
    clientEmail: "john@example.com",
  };

  it("should render booking confirmation details", () => {
    render(<BookingConfirmation {...defaultProps} />);

    expect(screen.getByText("Booking Confirmed")).toBeInTheDocument();
    expect(screen.getByText("Initial Consultation")).toBeInTheDocument();
    expect(screen.getByText("John Smith")).toBeInTheDocument();
    expect(screen.getAllByText("john@example.com")).toHaveLength(2); // Email appears twice
    expect(screen.getByText("booking-123")).toBeInTheDocument();
  });

  it("should display custom message", () => {
    render(<BookingConfirmation {...defaultProps} message="Your appointment has been scheduled" />);

    expect(screen.getByText("Your appointment has been scheduled")).toBeInTheDocument();
  });

  it("should display default message when not provided", () => {
    render(<BookingConfirmation {...defaultProps} />);

    expect(
      screen.getByText(
        "Booking created successfully. You will receive a confirmation email shortly."
      )
    ).toBeInTheDocument();
  });

  it("should render date and time correctly", () => {
    render(<BookingConfirmation {...defaultProps} />);

    // Check that date is rendered (format depends on locale)
    expect(screen.getByText(/wednesday|january/i)).toBeInTheDocument();
  });

  it("should calculate and display duration", () => {
    render(<BookingConfirmation {...defaultProps} />);

    expect(screen.getByText("30 minutes")).toBeInTheDocument();
  });

  it("should display email confirmation notice", () => {
    render(<BookingConfirmation {...defaultProps} />);

    expect(screen.getByText(/a confirmation email has been sent to/i)).toBeInTheDocument();
    expect(screen.getAllByText("john@example.com")).toHaveLength(2); // Email appears twice
  });

  it("should render close button when onClose provided", () => {
    const onClose = vi.fn();
    render(<BookingConfirmation {...defaultProps} onClose={onClose} />);

    const closeButton = screen.getByRole("button", { name: /close/i });
    expect(closeButton).toBeInTheDocument();

    fireEvent.click(closeButton);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("should not render close button when onClose not provided", () => {
    render(<BookingConfirmation {...defaultProps} />);

    expect(screen.queryByRole("button", { name: /close/i })).not.toBeInTheDocument();
  });

  it("should display success icon", () => {
    const { container } = render(<BookingConfirmation {...defaultProps} />);

    // Check for the success checkmark icon
    const successIcon = container.querySelector(".text-green-400");
    expect(successIcon).toBeInTheDocument();
  });
});
