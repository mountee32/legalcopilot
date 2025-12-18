import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useRouter } from "next/navigation";
import NewTaskPage from "@/app/(app)/tasks/new/page";
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

describe("NewTaskPage", () => {
  const mockPush = vi.fn();
  let originalFetch: typeof global.fetch;

  const mockMatters = [
    { id: "matter-1", reference: "M-001", title: "Contract Review", clientName: "Client A" },
    { id: "matter-2", reference: "M-002", title: "Property Sale", clientName: "Client B" },
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

    // Mock matters fetch by default
    global.fetch = vi.fn().mockImplementation((url) => {
      if (typeof url === "string" && url.includes("/api/matters")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ matters: mockMatters }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });
  });

  afterEach(() => {
    // Restore original fetch
    global.fetch = originalFetch;
  });

  it("renders form with all expected fields", async () => {
    render(<NewTaskPage />);

    expect(screen.getByText("New Task")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByLabelText(/Matter/)).toBeInTheDocument();
    });

    expect(screen.getByLabelText(/Title/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Priority/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Due Date/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Create Task/ })).toBeInTheDocument();
  });

  it("loads matters into dropdown on mount", async () => {
    render(<NewTaskPage />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/matters?limit=100",
        expect.objectContaining({ credentials: "include" })
      );
    });

    const matterSelect = screen.getByLabelText(/Matter/) as HTMLSelectElement;
    await waitFor(() => {
      expect(matterSelect.options.length).toBe(3); // 1 placeholder + 2 matters
    });
  });

  it("shows error toast when matters fail to load", async () => {
    global.fetch = vi.fn().mockImplementation((url) => {
      if (typeof url === "string" && url.includes("/api/matters")) {
        return Promise.resolve({
          ok: false,
          json: async () => ({ message: "Failed to fetch" }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    render(<NewTaskPage />);

    await waitFor(() => {
      expect(toastHook.toast).toHaveBeenCalledWith({
        title: "Error",
        description: "Failed to load matters",
        variant: "destructive",
      });
    });
  });

  it("requires matterId and title fields", async () => {
    render(<NewTaskPage />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Matter/)).toBeInTheDocument();
    });

    const submitButton = screen.getByRole("button", { name: /Create Task/ });
    fireEvent.click(submitButton);

    // HTML5 validation should prevent submission
    const matterInput = screen.getByLabelText(/Matter/) as HTMLSelectElement;
    const titleInput = screen.getByLabelText(/Title/) as HTMLInputElement;

    expect(matterInput.validity.valid).toBe(false);
    expect(titleInput.validity.valid).toBe(false);
  });

  it("successfully submits valid task data", async () => {
    const mockTask = {
      id: "test-task-id",
      matterId: "matter-1",
      title: "Review contract",
      priority: "high",
    };

    global.fetch = vi.fn().mockImplementation((url) => {
      if (typeof url === "string" && url.includes("/api/matters")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ matters: mockMatters }),
        });
      }
      if (typeof url === "string" && url.includes("/api/tasks")) {
        return Promise.resolve({
          ok: true,
          json: async () => mockTask,
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    render(<NewTaskPage />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Matter/)).toBeInTheDocument();
    });

    // Fill in required fields
    fireEvent.change(screen.getByLabelText(/Matter/), {
      target: { value: "matter-1" },
    });
    fireEvent.change(screen.getByLabelText(/Title/), {
      target: { value: "Review contract" },
    });
    fireEvent.change(screen.getByLabelText(/Priority/), {
      target: { value: "high" },
    });

    const submitButton = screen.getByRole("button", { name: /Create Task/ });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/tasks",
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
        title: "Task created",
        description: "The task has been created successfully.",
      });
      expect(mockPush).toHaveBeenCalledWith("/tasks");
    });
  });

  it("includes optional fields in submission when filled", async () => {
    global.fetch = vi.fn().mockImplementation((url) => {
      if (typeof url === "string" && url.includes("/api/matters")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ matters: mockMatters }),
        });
      }
      if (typeof url === "string" && url.includes("/api/tasks")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ id: "test-id" }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    render(<NewTaskPage />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Matter/)).toBeInTheDocument();
    });

    // Fill in required fields
    fireEvent.change(screen.getByLabelText(/Matter/), {
      target: { value: "matter-1" },
    });
    fireEvent.change(screen.getByLabelText(/Title/), {
      target: { value: "Review contract" },
    });

    // Fill in optional fields
    fireEvent.change(screen.getByLabelText(/Description/), {
      target: { value: "Review the employment contract" },
    });
    fireEvent.change(screen.getByLabelText(/Due Date/), {
      target: { value: "2025-12-31T14:00" },
    });

    const submitButton = screen.getByRole("button", { name: /Create Task/ });
    fireEvent.click(submitButton);

    await waitFor(() => {
      const taskCalls = vi
        .mocked(global.fetch)
        .mock.calls.filter((call) => typeof call[0] === "string" && call[0].includes("/api/tasks"));
      expect(taskCalls.length).toBeGreaterThan(0);

      const body = JSON.parse(taskCalls[0][1]?.body as string);
      expect(body.description).toBe("Review the employment contract");
      expect(body.dueDate).toBe("2025-12-31T14:00");
    });
  });

  it("shows error toast when API returns error", async () => {
    global.fetch = vi.fn().mockImplementation((url) => {
      if (typeof url === "string" && url.includes("/api/matters")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ matters: mockMatters }),
        });
      }
      if (typeof url === "string" && url.includes("/api/tasks")) {
        return Promise.resolve({
          ok: false,
          json: async () => ({ message: "Matter not found" }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    render(<NewTaskPage />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Matter/)).toBeInTheDocument();
    });

    // Fill in required fields
    fireEvent.change(screen.getByLabelText(/Matter/), {
      target: { value: "matter-1" },
    });
    fireEvent.change(screen.getByLabelText(/Title/), {
      target: { value: "Review contract" },
    });

    const submitButton = screen.getByRole("button", { name: /Create Task/ });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(toastHook.toast).toHaveBeenCalledWith({
        title: "Error",
        description: "Matter not found",
        variant: "destructive",
      });
    });

    // Should not redirect on error
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("disables submit button while submitting", async () => {
    global.fetch = vi.fn().mockImplementation((url) => {
      if (typeof url === "string" && url.includes("/api/matters")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ matters: mockMatters }),
        });
      }
      if (typeof url === "string" && url.includes("/api/tasks")) {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: async () => ({ id: "test-id" }),
            });
          }, 100);
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    render(<NewTaskPage />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Matter/)).toBeInTheDocument();
    });

    // Fill in required fields
    fireEvent.change(screen.getByLabelText(/Matter/), {
      target: { value: "matter-1" },
    });
    fireEvent.change(screen.getByLabelText(/Title/), {
      target: { value: "Review contract" },
    });

    const submitButton = screen.getByRole("button", { name: /Create Task/ });
    fireEvent.click(submitButton);

    // Button should be disabled and show "Creating..."
    await waitFor(() => {
      expect(submitButton).toBeDisabled();
      expect(submitButton).toHaveTextContent("Creating...");
    });
  });

  it("navigates back to tasks list when cancel is clicked", async () => {
    render(<NewTaskPage />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Matter/)).toBeInTheDocument();
    });

    const cancelButton = screen.getByRole("button", { name: /Cancel/ });
    fireEvent.click(cancelButton);

    expect(mockPush).toHaveBeenCalledWith("/tasks");
  });

  it("defaults priority to medium", async () => {
    render(<NewTaskPage />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Matter/)).toBeInTheDocument();
    });

    const prioritySelect = screen.getByLabelText(/Priority/) as HTMLSelectElement;
    expect(prioritySelect.value).toBe("medium");
  });

  it("enforces title max length of 200 characters", async () => {
    render(<NewTaskPage />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Matter/)).toBeInTheDocument();
    });

    const titleInput = screen.getByLabelText(/Title/) as HTMLInputElement;
    expect(titleInput.maxLength).toBe(200);
  });

  it("enforces description max length of 10000 characters", async () => {
    render(<NewTaskPage />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Matter/)).toBeInTheDocument();
    });

    const descriptionInput = screen.getByLabelText(/Description/) as HTMLTextAreaElement;
    expect(descriptionInput.maxLength).toBe(10000);
  });
});
