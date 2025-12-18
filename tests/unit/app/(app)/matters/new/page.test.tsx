import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useRouter } from "next/navigation";
import NewMatterPage from "@/app/(app)/matters/new/page";
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

describe("NewMatterPage", () => {
  const mockPush = vi.fn();
  let originalFetch: typeof global.fetch;

  const mockClients = [
    {
      id: "client-1",
      type: "individual",
      firstName: "John",
      lastName: "Smith",
    },
    {
      id: "client-2",
      type: "company",
      companyName: "Acme Ltd",
    },
  ];

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

    // Default mock for clients fetch
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.toString().includes("/api/clients")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ clients: mockClients }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({}),
      });
    });
  });

  afterEach(() => {
    // Restore original fetch
    global.fetch = originalFetch;
  });

  it("renders form with all expected fields", async () => {
    render(<NewMatterPage />);

    expect(screen.getByText("New Case")).toBeInTheDocument();
    expect(screen.getByLabelText(/Client/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Title/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Practice Area/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Billing Type/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Create Case/ })).toBeInTheDocument();

    // Wait for clients to load
    await waitFor(() => {
      expect(screen.getByText("John Smith")).toBeInTheDocument();
    });
  });

  it("loads clients on mount", async () => {
    render(<NewMatterPage />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/clients?limit=100",
        expect.objectContaining({
          credentials: "include",
        })
      );
    });

    // Check that clients are displayed in the dropdown
    await waitFor(() => {
      expect(screen.getByText("John Smith")).toBeInTheDocument();
      expect(screen.getByText("Acme Ltd")).toBeInTheDocument();
    });
  });

  it("shows error toast when clients fail to load", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ message: "Failed to fetch clients" }),
    });

    render(<NewMatterPage />);

    await waitFor(() => {
      expect(toastHook.toast).toHaveBeenCalledWith({
        title: "Error",
        description: "Failed to load clients",
        variant: "destructive",
      });
    });
  });

  it("requires title, clientId, practiceArea, and billingType", async () => {
    render(<NewMatterPage />);

    await waitFor(() => {
      expect(screen.getByText("John Smith")).toBeInTheDocument();
    });

    const submitButton = screen.getByRole("button", { name: /Create Case/ });
    fireEvent.click(submitButton);

    // HTML5 validation should prevent submission
    const titleInput = screen.getByLabelText(/Title/) as HTMLInputElement;
    const clientSelect = screen.getByLabelText(/Client/) as HTMLSelectElement;
    const practiceAreaSelect = screen.getByLabelText(/Practice Area/) as HTMLSelectElement;
    const billingTypeSelect = screen.getByLabelText(/Billing Type/) as HTMLSelectElement;

    expect(titleInput.validity.valid).toBe(false);
    expect(clientSelect.validity.valid).toBe(false);
    expect(practiceAreaSelect.validity.valid).toBe(true); // has default value
    expect(billingTypeSelect.validity.valid).toBe(true); // has default value
  });

  it("successfully submits valid matter data", async () => {
    const mockMatter = {
      id: "matter-1",
      title: "Property Purchase",
      clientId: "client-1",
      practiceArea: "conveyancing",
      billingType: "hourly",
    };

    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.toString().includes("/api/clients")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ clients: mockClients }),
        });
      }
      if (url.toString().includes("/api/matters")) {
        return Promise.resolve({
          ok: true,
          json: async () => mockMatter,
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({}),
      });
    });

    render(<NewMatterPage />);

    await waitFor(() => {
      expect(screen.getByText("John Smith")).toBeInTheDocument();
    });

    // Fill in required fields
    fireEvent.change(screen.getByLabelText(/Client/), {
      target: { value: "client-1" },
    });
    fireEvent.change(screen.getByLabelText(/Title/), {
      target: { value: "Property Purchase" },
    });
    fireEvent.change(screen.getByLabelText(/Practice Area/), {
      target: { value: "conveyancing" },
    });
    fireEvent.change(screen.getByLabelText(/Billing Type/), {
      target: { value: "hourly" },
    });

    const submitButton = screen.getByRole("button", { name: /Create Case/ });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/matters",
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
        title: "Case created",
        description: "The case has been created successfully.",
      });
      expect(mockPush).toHaveBeenCalledWith("/matters/matter-1");
    });
  });

  it("shows error toast when API returns error", async () => {
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.toString().includes("/api/clients")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ clients: mockClients }),
        });
      }
      if (url.toString().includes("/api/matters")) {
        return Promise.resolve({
          ok: false,
          json: async () => ({ message: "Client not found" }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({}),
      });
    });

    render(<NewMatterPage />);

    await waitFor(() => {
      expect(screen.getByText("John Smith")).toBeInTheDocument();
    });

    // Fill in required fields
    fireEvent.change(screen.getByLabelText(/Client/), {
      target: { value: "client-1" },
    });
    fireEvent.change(screen.getByLabelText(/Title/), {
      target: { value: "Property Purchase" },
    });

    const submitButton = screen.getByRole("button", { name: /Create Case/ });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(toastHook.toast).toHaveBeenCalledWith({
        title: "Error",
        description: "Client not found",
        variant: "destructive",
      });
    });

    // Should not redirect on error
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("disables submit button while submitting", async () => {
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.toString().includes("/api/clients")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ clients: mockClients }),
        });
      }
      if (url.toString().includes("/api/matters")) {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: async () => ({ id: "matter-1" }),
            });
          }, 100);
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({}),
      });
    });

    render(<NewMatterPage />);

    await waitFor(() => {
      expect(screen.getByText("John Smith")).toBeInTheDocument();
    });

    // Fill in required fields
    fireEvent.change(screen.getByLabelText(/Client/), {
      target: { value: "client-1" },
    });
    fireEvent.change(screen.getByLabelText(/Title/), {
      target: { value: "Property Purchase" },
    });

    const submitButton = screen.getByRole("button", { name: /Create Case/ });
    fireEvent.click(submitButton);

    // Button should be disabled and show "Creating..."
    await waitFor(() => {
      expect(submitButton).toBeDisabled();
      expect(submitButton).toHaveTextContent("Creating...");
    });
  });

  it("navigates back to matters list when cancel is clicked", async () => {
    render(<NewMatterPage />);

    const cancelButton = screen.getByRole("button", { name: /Cancel/ });
    fireEvent.click(cancelButton);

    expect(mockPush).toHaveBeenCalledWith("/matters");
  });

  it("includes optional fields in submission when filled", async () => {
    const mockMatter = { id: "matter-1" };

    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.toString().includes("/api/clients")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ clients: mockClients }),
        });
      }
      if (url.toString().includes("/api/matters")) {
        return Promise.resolve({
          ok: true,
          json: async () => mockMatter,
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({}),
      });
    });

    render(<NewMatterPage />);

    await waitFor(() => {
      expect(screen.getByText("John Smith")).toBeInTheDocument();
    });

    // Fill in required fields
    fireEvent.change(screen.getByLabelText(/Client/), {
      target: { value: "client-1" },
    });
    fireEvent.change(screen.getByLabelText(/Title/), {
      target: { value: "Property Purchase" },
    });

    // Fill in optional fields
    fireEvent.change(screen.getByLabelText(/Description/), {
      target: { value: "Purchasing 123 High Street" },
    });
    fireEvent.change(screen.getByLabelText(/Hourly Rate/), {
      target: { value: "150.00" },
    });
    fireEvent.change(screen.getByLabelText(/Notes/), {
      target: { value: "Urgent deadline" },
    });

    const submitButton = screen.getByRole("button", { name: /Create Case/ });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
      const callArgs = vi
        .mocked(global.fetch)
        .mock.calls.find((call) => call[0].toString().includes("/api/matters"));
      expect(callArgs).toBeDefined();
      const body = JSON.parse(callArgs![1]?.body as string);

      expect(body.description).toBe("Purchasing 123 High Street");
      expect(body.hourlyRate).toBe("150.00");
      expect(body.notes).toBe("Urgent deadline");
    });
  });

  it("displays company name for company clients", async () => {
    render(<NewMatterPage />);

    await waitFor(() => {
      expect(screen.getByText("Acme Ltd")).toBeInTheDocument();
    });
  });

  it("displays full name for individual clients", async () => {
    render(<NewMatterPage />);

    await waitFor(() => {
      expect(screen.getByText("John Smith")).toBeInTheDocument();
    });
  });
});
