import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { UploadDocumentDialog } from "@/components/documents/UploadDocumentDialog";

global.fetch = vi.fn();

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("UploadDocumentDialog", () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({
        matters: [
          { id: "matter-1", reference: "MAT001", title: "Matter One" },
          { id: "matter-2", reference: "MAT002", title: "Matter Two" },
        ],
      }),
    } as Response);
  });

  it("renders when open", () => {
    render(<UploadDocumentDialog {...defaultProps} />, { wrapper: createWrapper() });

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/Add a new document to a matter/)).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(<UploadDocumentDialog {...defaultProps} open={false} />, { wrapper: createWrapper() });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders all form fields", async () => {
    render(<UploadDocumentDialog {...defaultProps} />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByLabelText(/Matter/)).toBeInTheDocument();
    });

    expect(screen.getByLabelText(/Document Title/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Document Type/)).toBeInTheDocument();
    expect(screen.getByLabelText(/File \(optional\)/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Document Date \(optional\)/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Recipient \(optional\)/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Sender \(optional\)/)).toBeInTheDocument();
  });

  it("shows required field indicators", () => {
    render(<UploadDocumentDialog {...defaultProps} />, { wrapper: createWrapper() });

    const requiredFields = screen.getAllByText("*");
    expect(requiredFields).toHaveLength(3);
  });

  it("loads matters from API", async () => {
    render(<UploadDocumentDialog {...defaultProps} />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/matters?limit=1000", {
        credentials: "include",
      });
    });
  });

  it("disables submit button when required fields are empty", async () => {
    render(<UploadDocumentDialog {...defaultProps} />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("Upload Document", { selector: "button" })).toBeDisabled();
    });
  });

  it("disables submit button initially when required fields are empty", async () => {
    render(<UploadDocumentDialog {...defaultProps} />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByLabelText(/Matter/)).toBeInTheDocument();
    });

    const submitButton = screen.getByRole("button", { name: /Upload Document/ });
    expect(submitButton).toBeDisabled();
  });

  it("has submit button with correct type", async () => {
    render(<UploadDocumentDialog {...defaultProps} />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByLabelText(/Matter/)).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: /Upload Document/ })).toHaveAttribute(
      "type",
      "submit"
    );
  });

  it("accepts text input in title field", async () => {
    render(<UploadDocumentDialog {...defaultProps} />, { wrapper: createWrapper() });
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getByLabelText(/Document Title/)).toBeInTheDocument();
    });

    const titleInput = screen.getByLabelText(/Document Title/) as HTMLInputElement;
    await user.type(titleInput, "Test Document");

    expect(titleInput.value).toBe("Test Document");
  });

  it("calls onOpenChange when cancel is clicked", async () => {
    const onOpenChange = vi.fn();
    render(<UploadDocumentDialog {...defaultProps} onOpenChange={onOpenChange} />, {
      wrapper: createWrapper(),
    });
    const user = userEvent.setup();

    const cancelButton = screen.getByRole("button", { name: /Cancel/ });
    await user.click(cancelButton);

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("resets form when dialog closes", async () => {
    render(<UploadDocumentDialog {...defaultProps} />, { wrapper: createWrapper() });
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getByLabelText(/Document Title/)).toBeInTheDocument();
    });

    const titleInput = screen.getByLabelText(/Document Title/) as HTMLInputElement;
    await user.type(titleInput, "Test");

    const cancelButton = screen.getByRole("button", { name: /Cancel/ });
    await user.click(cancelButton);

    expect(titleInput.value).toBe("");
  });

  it("enforces max length on title field", () => {
    render(<UploadDocumentDialog {...defaultProps} />, { wrapper: createWrapper() });

    const titleInput = screen.getByLabelText(/Document Title/) as HTMLInputElement;
    expect(titleInput).toHaveAttribute("maxLength", "200");
  });

  it("displays file information when file is selected", async () => {
    render(<UploadDocumentDialog {...defaultProps} />, { wrapper: createWrapper() });
    const user = userEvent.setup();

    const file = new File(["test content"], "test.pdf", { type: "application/pdf" });
    const fileInput = screen.getByLabelText(/File \(optional\)/);

    await user.upload(fileInput, file);

    await waitFor(() => {
      expect(screen.getByText(/test.pdf/)).toBeInTheDocument();
    });
  });
});
