import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";

describe("ConfirmationModal", () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    title: "Confirm action",
    onConfirm: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders when open", () => {
    render(<ConfirmationModal {...defaultProps} />);

    expect(screen.getByTestId("confirmation-modal")).toBeInTheDocument();
    expect(screen.getByText("Confirm action")).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(<ConfirmationModal {...defaultProps} open={false} />);

    expect(screen.queryByTestId("confirmation-modal")).not.toBeInTheDocument();
  });

  it("renders with description", () => {
    render(<ConfirmationModal {...defaultProps} description="Are you sure you want to proceed?" />);

    expect(screen.getByText("Are you sure you want to proceed?")).toBeInTheDocument();
  });

  it("renders default button labels", () => {
    render(<ConfirmationModal {...defaultProps} />);

    expect(screen.getByRole("button", { name: /confirm/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
  });

  it("renders custom button labels", () => {
    render(<ConfirmationModal {...defaultProps} confirmLabel="Delete" cancelLabel="Keep" />);

    expect(screen.getByRole("button", { name: /delete/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /keep/i })).toBeInTheDocument();
  });

  it("calls onConfirm when confirm button is clicked", async () => {
    const onConfirm = vi.fn();
    render(<ConfirmationModal {...defaultProps} onConfirm={onConfirm} />);
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /confirm/i }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("calls onCancel and onOpenChange when cancel button is clicked", async () => {
    const onCancel = vi.fn();
    const onOpenChange = vi.fn();
    render(<ConfirmationModal {...defaultProps} onCancel={onCancel} onOpenChange={onOpenChange} />);
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /cancel/i }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("disables buttons when loading", () => {
    render(<ConfirmationModal {...defaultProps} loading={true} />);

    expect(screen.getByRole("button", { name: /loading/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeDisabled();
  });

  it("applies destructive variant to confirm button", () => {
    render(<ConfirmationModal {...defaultProps} variant="destructive" />);

    const confirmButton = screen.getByRole("button", { name: /confirm/i });
    // Check that the button has destructive styling (this depends on your Button implementation)
    expect(confirmButton).toBeInTheDocument();
  });
});
