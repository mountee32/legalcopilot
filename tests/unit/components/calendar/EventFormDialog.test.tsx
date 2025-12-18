import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { EventFormDialog } from "@/components/calendar/EventFormDialog";

// Mock ResizeObserver
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("EventFormDialog", () => {
  const mockOnOpenChange = vi.fn();

  beforeAll(() => {
    global.ResizeObserver = ResizeObserverMock as any;
  });

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it("renders when open is true", () => {
    render(<EventFormDialog open={true} onOpenChange={mockOnOpenChange} />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText("Create New Event")).toBeInTheDocument();
    expect(screen.getByLabelText(/Title/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Event Type/)).toBeInTheDocument();
  });

  it("does not render when open is false", () => {
    render(<EventFormDialog open={false} onOpenChange={mockOnOpenChange} />, {
      wrapper: createWrapper(),
    });

    expect(screen.queryByText("Create New Event")).not.toBeInTheDocument();
  });

  it("displays required field indicators", () => {
    render(<EventFormDialog open={true} onOpenChange={mockOnOpenChange} />, {
      wrapper: createWrapper(),
    });

    const requiredMarkers = screen.getAllByText("*");
    expect(requiredMarkers.length).toBeGreaterThan(0);
  });

  it("shows validation errors for empty required fields", async () => {
    const user = userEvent.setup();

    render(<EventFormDialog open={true} onOpenChange={mockOnOpenChange} />, {
      wrapper: createWrapper(),
    });

    const submitButton = screen.getByRole("button", { name: /Create Event/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Title is required")).toBeInTheDocument();
    });
  });

  it("enforces title max length with input attribute", async () => {
    render(<EventFormDialog open={true} onOpenChange={mockOnOpenChange} />, {
      wrapper: createWrapper(),
    });

    const titleInput = screen.getByLabelText(/Title/) as HTMLInputElement;
    expect(titleInput.maxLength).toBe(200);
  });

  it("requires start date", async () => {
    const user = userEvent.setup();

    render(<EventFormDialog open={true} onOpenChange={mockOnOpenChange} />, {
      wrapper: createWrapper(),
    });

    const titleInput = screen.getByLabelText(/Title/);
    await user.type(titleInput, "Test Event");

    const submitButton = screen.getByRole("button", { name: /Create Event/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Start date is required")).toBeInTheDocument();
    });
  });

  it("requires start time when not all-day", async () => {
    const user = userEvent.setup();

    render(<EventFormDialog open={true} onOpenChange={mockOnOpenChange} />, {
      wrapper: createWrapper(),
    });

    const titleInput = screen.getByLabelText(/Title/);
    await user.type(titleInput, "Test Event");

    const startDateInput = screen.getByLabelText(/Start Date/);
    await user.type(startDateInput, "2025-01-15");

    const submitButton = screen.getByRole("button", { name: /Create Event/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Start time is required")).toBeInTheDocument();
    });
  });

  it("does not require start time for all-day events", async () => {
    const user = userEvent.setup();

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: "event-1" }),
    } as Response);

    render(<EventFormDialog open={true} onOpenChange={mockOnOpenChange} />, {
      wrapper: createWrapper(),
    });

    const titleInput = screen.getByLabelText(/Title/);
    await user.type(titleInput, "Test Event");

    const startDateInput = screen.getByLabelText(/Start Date/);
    await user.type(startDateInput, "2025-01-15");

    const allDayCheckbox = screen.getByLabelText(/All day event/);
    await user.click(allDayCheckbox);

    const submitButton = screen.getByRole("button", { name: /Create Event/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/calendar",
        expect.objectContaining({
          method: "POST",
        })
      );
    });
  });

  it("submits form with valid data", async () => {
    const user = userEvent.setup();

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: "event-1" }),
    } as Response);

    render(<EventFormDialog open={true} onOpenChange={mockOnOpenChange} />, {
      wrapper: createWrapper(),
    });

    await user.type(screen.getByLabelText(/Title/), "Test Meeting");
    await user.type(screen.getByLabelText(/Start Date/), "2025-01-15");
    await user.type(screen.getByLabelText(/Start Time/), "14:00");

    const submitButton = screen.getByRole("button", { name: /Create Event/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/calendar",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: expect.stringContaining("Test Meeting"),
        })
      );
    });
  });

  it("allows selecting event type", async () => {
    const user = userEvent.setup();

    render(<EventFormDialog open={true} onOpenChange={mockOnOpenChange} />, {
      wrapper: createWrapper(),
    });

    const eventTypeSelect = screen.getByLabelText(/Event Type/);
    await user.selectOptions(eventTypeSelect, "hearing");

    expect(eventTypeSelect).toHaveValue("hearing");
  });

  it("allows selecting priority", async () => {
    const user = userEvent.setup();

    render(<EventFormDialog open={true} onOpenChange={mockOnOpenChange} />, {
      wrapper: createWrapper(),
    });

    const prioritySelect = screen.getByLabelText(/Priority/);
    await user.selectOptions(prioritySelect, "critical");

    expect(prioritySelect).toHaveValue("critical");
  });

  it("shows loading state during submission", async () => {
    const user = userEvent.setup();

    vi.mocked(global.fetch).mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: async () => ({ id: "event-1" }),
            } as Response);
          }, 100);
        })
    );

    render(<EventFormDialog open={true} onOpenChange={mockOnOpenChange} />, {
      wrapper: createWrapper(),
    });

    await user.type(screen.getByLabelText(/Title/), "Test Event");
    await user.type(screen.getByLabelText(/Start Date/), "2025-01-15");
    await user.type(screen.getByLabelText(/Start Time/), "14:00");

    const submitButton = screen.getByRole("button", { name: /Create Event/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Creating.../)).toBeInTheDocument();
    });
  });

  it("handles cancel button click", async () => {
    const user = userEvent.setup();

    render(<EventFormDialog open={true} onOpenChange={mockOnOpenChange} />, {
      wrapper: createWrapper(),
    });

    const cancelButton = screen.getByRole("button", { name: /Cancel/i });
    await user.click(cancelButton);

    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it("resets form after successful submission", async () => {
    const user = userEvent.setup();

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: "event-1" }),
    } as Response);

    render(<EventFormDialog open={true} onOpenChange={mockOnOpenChange} />, {
      wrapper: createWrapper(),
    });

    const titleInput = screen.getByLabelText(/Title/) as HTMLInputElement;
    await user.type(titleInput, "Test Event");
    await user.type(screen.getByLabelText(/Start Date/), "2025-01-15");
    await user.type(screen.getByLabelText(/Start Time/), "14:00");

    const submitButton = screen.getByRole("button", { name: /Create Event/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });
});
