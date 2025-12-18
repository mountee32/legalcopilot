import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BookingForm } from "@/components/booking/booking-form";

describe("BookingForm", () => {
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  it("should render all form fields", () => {
    render(<BookingForm onSubmit={mockOnSubmit} />);

    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/additional notes/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /confirm booking/i })).toBeInTheDocument();
  });

  it("should submit form with valid data", async () => {
    const user = userEvent.setup();
    render(<BookingForm onSubmit={mockOnSubmit} />);

    await user.type(screen.getByLabelText(/full name/i), "John Smith");
    await user.type(screen.getByLabelText(/email address/i), "john@example.com");
    await user.type(screen.getByLabelText(/phone number/i), "+44 20 1234 5678");
    await user.type(screen.getByLabelText(/additional notes/i), "Need conveyancing advice");

    await user.click(screen.getByRole("button", { name: /confirm booking/i }));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled();
      const callArgs = mockOnSubmit.mock.calls[0][0];
      expect(callArgs).toMatchObject({
        clientName: "John Smith",
        clientEmail: "john@example.com",
        clientPhone: "+44 20 1234 5678",
        notes: "Need conveyancing advice",
      });
    });
  });

  it("should show validation errors for required fields", async () => {
    const user = userEvent.setup();
    render(<BookingForm onSubmit={mockOnSubmit} />);

    await user.click(screen.getByRole("button", { name: /confirm booking/i }));

    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it("should not submit with invalid email", async () => {
    const user = userEvent.setup();
    render(<BookingForm onSubmit={mockOnSubmit} />);

    await user.type(screen.getByLabelText(/full name/i), "John Smith");
    await user.type(screen.getByLabelText(/email address/i), "invalid-email");

    await user.click(screen.getByRole("button", { name: /confirm booking/i }));

    // HTML5 email validation or Zod validation should prevent submission
    // Give a small delay for any async validation
    await new Promise((r) => setTimeout(r, 100));
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it("should disable form fields when submitting", () => {
    render(<BookingForm onSubmit={mockOnSubmit} isSubmitting={true} />);

    expect(screen.getByLabelText(/full name/i)).toBeDisabled();
    expect(screen.getByLabelText(/email address/i)).toBeDisabled();
    expect(screen.getByLabelText(/phone number/i)).toBeDisabled();
    expect(screen.getByLabelText(/additional notes/i)).toBeDisabled();
    expect(screen.getByRole("button", { name: /submitting/i })).toBeDisabled();
  });

  it("should display error message", () => {
    render(<BookingForm onSubmit={mockOnSubmit} error="This time slot is no longer available" />);

    expect(screen.getByText("This time slot is no longer available")).toBeInTheDocument();
  });

  it("should submit form with only required fields", async () => {
    const user = userEvent.setup();
    render(<BookingForm onSubmit={mockOnSubmit} />);

    await user.type(screen.getByLabelText(/full name/i), "Jane Doe");
    await user.type(screen.getByLabelText(/email address/i), "jane@example.com");

    await user.click(screen.getByRole("button", { name: /confirm booking/i }));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled();
      const callArgs = mockOnSubmit.mock.calls[0][0];
      expect(callArgs).toMatchObject({
        clientName: "Jane Doe",
        clientEmail: "jane@example.com",
      });
    });
  });
});
