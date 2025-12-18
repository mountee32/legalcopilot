import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useRouter } from "next/navigation";
import NewClientPage from "@/app/(app)/clients/new/page";
import * as toastHook from "@/lib/hooks/use-toast";

// Mock Next.js router
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

// Mock toast
vi.mock("@/lib/hooks/use-toast", async () => {
  const actual = await vi.importActual("@/lib/hooks/use-toast");
  return {
    ...actual,
    toast: vi.fn(),
  };
});

describe("NewClientPage", () => {
  const mockPush = vi.fn();
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({
      push: mockPush,
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
    });

    // Store original fetch
    originalFetch = global.fetch;
  });

  afterEach(() => {
    // Restore original fetch
    global.fetch = originalFetch;
  });

  it("renders form with all expected fields for individual type", () => {
    render(<NewClientPage />);

    expect(screen.getByText("New Client")).toBeInTheDocument();
    expect(screen.getByLabelText(/Client Type/)).toBeInTheDocument();
    expect(screen.getByLabelText(/First Name/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Last Name/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Create Client/ })).toBeInTheDocument();
  });

  it("shows company fields when type is changed to company", async () => {
    render(<NewClientPage />);

    const typeSelect = screen.getByLabelText(/Client Type/);
    fireEvent.change(typeSelect, { target: { value: "company" } });

    await waitFor(() => {
      expect(screen.getByLabelText(/Company Name/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Company Number/)).toBeInTheDocument();
    });

    // Individual fields should not be present
    expect(screen.queryByLabelText(/First Name/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Last Name/)).not.toBeInTheDocument();
  });

  it("shows appropriate fields for trust type", async () => {
    render(<NewClientPage />);

    const typeSelect = screen.getByLabelText(/Client Type/);
    fireEvent.change(typeSelect, { target: { value: "trust" } });

    await waitFor(() => {
      expect(screen.getByLabelText(/Name/)).toBeInTheDocument();
    });

    // Individual fields should not be present
    expect(screen.queryByLabelText(/First Name/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Last Name/)).not.toBeInTheDocument();
  });

  it("requires firstName and lastName for individual type", async () => {
    render(<NewClientPage />);

    const emailInput = screen.getByLabelText(/Email/);
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });

    const submitButton = screen.getByRole("button", { name: /Create Client/ });
    fireEvent.click(submitButton);

    // HTML5 validation should prevent submission
    const firstNameInput = screen.getByLabelText(/First Name/) as HTMLInputElement;
    const lastNameInput = screen.getByLabelText(/Last Name/) as HTMLInputElement;

    expect(firstNameInput.validity.valid).toBe(false);
    expect(lastNameInput.validity.valid).toBe(false);
  });

  it("requires companyName for company type", async () => {
    render(<NewClientPage />);

    const typeSelect = screen.getByLabelText(/Client Type/);
    fireEvent.change(typeSelect, { target: { value: "company" } });

    await waitFor(() => {
      expect(screen.getByLabelText(/Company Name/)).toBeInTheDocument();
    });

    const emailInput = screen.getByLabelText(/Email/);
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });

    const submitButton = screen.getByRole("button", { name: /Create Client/ });
    fireEvent.click(submitButton);

    // HTML5 validation should prevent submission
    const companyNameInput = screen.getByLabelText(/Company Name/) as HTMLInputElement;
    expect(companyNameInput.validity.valid).toBe(false);
  });

  it("successfully submits valid individual client data", async () => {
    const mockClient = {
      id: "test-client-id",
      type: "individual",
      firstName: "John",
      lastName: "Smith",
      email: "john@example.com",
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockClient,
    });

    render(<NewClientPage />);

    // Fill in required fields
    fireEvent.change(screen.getByLabelText(/First Name/), {
      target: { value: "John" },
    });
    fireEvent.change(screen.getByLabelText(/Last Name/), {
      target: { value: "Smith" },
    });
    fireEvent.change(screen.getByLabelText(/Email/), {
      target: { value: "john@example.com" },
    });

    const submitButton = screen.getByRole("button", { name: /Create Client/ });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/clients",
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        })
      );
    });

    await waitFor(() => {
      expect(toastHook.toast).toHaveBeenCalledWith({
        title: "Client created",
        description: "The client has been created successfully.",
      });
      expect(mockPush).toHaveBeenCalledWith("/clients/test-client-id");
    });
  });

  it("successfully submits valid company client data", async () => {
    const mockClient = {
      id: "test-company-id",
      type: "company",
      companyName: "Acme Ltd",
      email: "contact@acme.com",
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockClient,
    });

    render(<NewClientPage />);

    // Change to company type
    fireEvent.change(screen.getByLabelText(/Client Type/), {
      target: { value: "company" },
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/Company Name/)).toBeInTheDocument();
    });

    // Fill in required fields
    fireEvent.change(screen.getByLabelText(/Company Name/), {
      target: { value: "Acme Ltd" },
    });
    fireEvent.change(screen.getByLabelText(/Email/), {
      target: { value: "contact@acme.com" },
    });

    const submitButton = screen.getByRole("button", { name: /Create Client/ });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(toastHook.toast).toHaveBeenCalledWith({
        title: "Client created",
        description: "The client has been created successfully.",
      });
      expect(mockPush).toHaveBeenCalledWith("/clients/test-company-id");
    });
  });

  it("shows error toast when API returns error", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ message: "Email already exists" }),
    });

    render(<NewClientPage />);

    // Fill in required fields
    fireEvent.change(screen.getByLabelText(/First Name/), {
      target: { value: "John" },
    });
    fireEvent.change(screen.getByLabelText(/Last Name/), {
      target: { value: "Smith" },
    });
    fireEvent.change(screen.getByLabelText(/Email/), {
      target: { value: "john@example.com" },
    });

    const submitButton = screen.getByRole("button", { name: /Create Client/ });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(toastHook.toast).toHaveBeenCalledWith({
        title: "Error",
        description: "Email already exists",
        variant: "destructive",
      });
    });

    // Should not redirect on error
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("disables submit button while submitting", async () => {
    global.fetch = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: async () => ({ id: "test-id" }),
            });
          }, 100);
        })
    );

    render(<NewClientPage />);

    // Fill in required fields
    fireEvent.change(screen.getByLabelText(/First Name/), {
      target: { value: "John" },
    });
    fireEvent.change(screen.getByLabelText(/Last Name/), {
      target: { value: "Smith" },
    });
    fireEvent.change(screen.getByLabelText(/Email/), {
      target: { value: "john@example.com" },
    });

    const submitButton = screen.getByRole("button", { name: /Create Client/ });
    fireEvent.click(submitButton);

    // Button should be disabled and show "Creating..."
    await waitFor(() => {
      expect(submitButton).toBeDisabled();
      expect(submitButton).toHaveTextContent("Creating...");
    });
  });

  it("navigates back to clients list when cancel is clicked", () => {
    render(<NewClientPage />);

    const cancelButton = screen.getByRole("button", { name: /Cancel/ });
    fireEvent.click(cancelButton);

    expect(mockPush).toHaveBeenCalledWith("/clients");
  });

  it("includes optional fields in submission when filled", async () => {
    const mockClient = { id: "test-id" };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockClient,
    });

    render(<NewClientPage />);

    // Fill in required fields
    fireEvent.change(screen.getByLabelText(/First Name/), {
      target: { value: "John" },
    });
    fireEvent.change(screen.getByLabelText(/Last Name/), {
      target: { value: "Smith" },
    });
    fireEvent.change(screen.getByLabelText(/Email/), {
      target: { value: "john@example.com" },
    });

    // Fill in optional fields
    fireEvent.change(screen.getByLabelText(/Phone/), {
      target: { value: "020 1234 5678" },
    });
    fireEvent.change(screen.getByLabelText(/Address Line 1/), {
      target: { value: "123 High Street" },
    });
    fireEvent.change(screen.getByLabelText(/City/), {
      target: { value: "London" },
    });
    fireEvent.change(screen.getByLabelText(/Postcode/), {
      target: { value: "SW1A 1AA" },
    });

    const submitButton = screen.getByRole("button", { name: /Create Client/ });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
      const callArgs = vi.mocked(global.fetch).mock.calls[0];
      const body = JSON.parse(callArgs[1]?.body as string);

      expect(body.phone).toBe("020 1234 5678");
      expect(body.addressLine1).toBe("123 High Street");
      expect(body.city).toBe("London");
      expect(body.postcode).toBe("SW1A 1AA");
    });
  });
});
