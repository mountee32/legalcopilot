import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TaskFormDialog } from "@/components/tasks";
import type { Task } from "@/components/tasks";

// Mock toast
vi.mock("@/lib/hooks/use-toast", () => ({
  toast: vi.fn(),
}));

// Mock the useFirmMembers hook
vi.mock("@/lib/hooks/use-firm-members", () => ({
  useFirmMembers: () => ({
    data: {
      members: [
        { id: "user-1", name: "John Doe", email: "john@example.com" },
        { id: "user-2", name: "Jane Smith", email: "jane@example.com" },
      ],
    },
    isLoading: false,
  }),
}));

import { toast } from "@/lib/hooks/use-toast";

const mockTask: Task = {
  id: "task-1",
  title: "Existing Task",
  description: "Task description",
  priority: "high",
  status: "pending",
  dueDate: "2024-06-15T10:00:00.000Z",
  assigneeId: "user-1",
};

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe("TaskFormDialog", () => {
  const mockOnOpenChange = vi.fn();
  const mockOnSuccess = vi.fn();
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    fetchMock = vi.fn();
    global.fetch = fetchMock;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Dialog header", () => {
    it("shows 'Create Task' title when no task provided", () => {
      renderWithProviders(
        <TaskFormDialog open={true} onOpenChange={mockOnOpenChange} matterId="matter-1" />
      );

      // Both dialog title and submit button have "Create Task" - use heading role
      expect(screen.getByRole("heading", { name: "Create Task" })).toBeInTheDocument();
    });

    it("shows 'Edit Task' title when task is provided", () => {
      renderWithProviders(
        <TaskFormDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          matterId="matter-1"
          task={mockTask}
        />
      );

      expect(screen.getByRole("heading", { name: "Edit Task" })).toBeInTheDocument();
    });

    it("shows correct description for create mode", () => {
      renderWithProviders(
        <TaskFormDialog open={true} onOpenChange={mockOnOpenChange} matterId="matter-1" />
      );

      expect(screen.getByText("Add a new task to this matter.")).toBeInTheDocument();
    });

    it("shows correct description for edit mode", () => {
      renderWithProviders(
        <TaskFormDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          matterId="matter-1"
          task={mockTask}
        />
      );

      expect(screen.getByText("Update the task details below.")).toBeInTheDocument();
    });
  });

  describe("Form fields", () => {
    it("renders title input with required indicator", () => {
      renderWithProviders(
        <TaskFormDialog open={true} onOpenChange={mockOnOpenChange} matterId="matter-1" />
      );

      expect(screen.getByLabelText(/Title/)).toBeInTheDocument();
      expect(screen.getByText("*")).toBeInTheDocument();
    });

    it("renders description textarea", () => {
      renderWithProviders(
        <TaskFormDialog open={true} onOpenChange={mockOnOpenChange} matterId="matter-1" />
      );

      expect(screen.getByLabelText("Description")).toBeInTheDocument();
    });

    it("renders priority select", () => {
      renderWithProviders(
        <TaskFormDialog open={true} onOpenChange={mockOnOpenChange} matterId="matter-1" />
      );

      // Just verify the label exists - Radix Select internals are tested separately
      expect(screen.getByText("Priority")).toBeInTheDocument();
    });

    it("renders due date input", () => {
      renderWithProviders(
        <TaskFormDialog open={true} onOpenChange={mockOnOpenChange} matterId="matter-1" />
      );

      expect(screen.getByLabelText("Due Date")).toBeInTheDocument();
    });

    it("renders assignee select", () => {
      renderWithProviders(
        <TaskFormDialog open={true} onOpenChange={mockOnOpenChange} matterId="matter-1" />
      );

      // Just verify the label exists - Radix Select internals are tested separately
      expect(screen.getByText("Assignee")).toBeInTheDocument();
    });
  });

  describe("Edit mode pre-population", () => {
    it("populates title from existing task", () => {
      renderWithProviders(
        <TaskFormDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          matterId="matter-1"
          task={mockTask}
        />
      );

      const titleInput = screen.getByLabelText(/Title/) as HTMLInputElement;
      expect(titleInput.value).toBe("Existing Task");
    });

    it("populates description from existing task", () => {
      renderWithProviders(
        <TaskFormDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          matterId="matter-1"
          task={mockTask}
        />
      );

      const descriptionInput = screen.getByLabelText("Description") as HTMLTextAreaElement;
      expect(descriptionInput.value).toBe("Task description");
    });
  });

  describe("Validation", () => {
    it("shows error when title is empty on submit", async () => {
      renderWithProviders(
        <TaskFormDialog open={true} onOpenChange={mockOnOpenChange} matterId="matter-1" />
      );

      // Submit without filling title (use submit button specifically)
      fireEvent.click(screen.getByRole("button", { name: "Create Task" }));

      await waitFor(() => {
        expect(screen.getByText("Title is required")).toBeInTheDocument();
      });
    });

    it("does not submit when title is empty", async () => {
      renderWithProviders(
        <TaskFormDialog open={true} onOpenChange={mockOnOpenChange} matterId="matter-1" />
      );

      fireEvent.click(screen.getByRole("button", { name: "Create Task" }));

      await waitFor(() => {
        expect(fetchMock).not.toHaveBeenCalled();
      });
    });
  });

  describe("Create submission", () => {
    it("submits POST request for new task", async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: "new-task-1", title: "New Task" }),
      });

      renderWithProviders(
        <TaskFormDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          matterId="matter-1"
          onSuccess={mockOnSuccess}
        />
      );

      // Fill in title
      const titleInput = screen.getByLabelText(/Title/);
      fireEvent.change(titleInput, { target: { value: "New Task" } });

      // Submit
      fireEvent.click(screen.getByRole("button", { name: "Create Task" }));

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith(
          "/api/tasks",
          expect.objectContaining({
            method: "POST",
            body: expect.stringContaining("New Task"),
          })
        );
      });
    });

    it("includes matterId in create request", async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: "new-task-1" }),
      });

      renderWithProviders(
        <TaskFormDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          matterId="matter-123"
          onSuccess={mockOnSuccess}
        />
      );

      const titleInput = screen.getByLabelText(/Title/);
      fireEvent.change(titleInput, { target: { value: "New Task" } });
      fireEvent.click(screen.getByRole("button", { name: "Create Task" }));

      await waitFor(() => {
        const body = JSON.parse(fetchMock.mock.calls[0][1].body);
        expect(body.matterId).toBe("matter-123");
      });
    });

    it("shows success toast after creation", async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: "new-task-1" }),
      });

      renderWithProviders(
        <TaskFormDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          matterId="matter-1"
          onSuccess={mockOnSuccess}
        />
      );

      const titleInput = screen.getByLabelText(/Title/);
      fireEvent.change(titleInput, { target: { value: "New Task" } });
      fireEvent.click(screen.getByRole("button", { name: "Create Task" }));

      await waitFor(() => {
        expect(toast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: "Task created",
          })
        );
      });
    });

    it("calls onSuccess after successful creation", async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: "new-task-1" }),
      });

      renderWithProviders(
        <TaskFormDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          matterId="matter-1"
          onSuccess={mockOnSuccess}
        />
      );

      const titleInput = screen.getByLabelText(/Title/);
      fireEvent.change(titleInput, { target: { value: "New Task" } });
      fireEvent.click(screen.getByRole("button", { name: "Create Task" }));

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });

    it("closes dialog after successful creation", async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: "new-task-1" }),
      });

      renderWithProviders(
        <TaskFormDialog open={true} onOpenChange={mockOnOpenChange} matterId="matter-1" />
      );

      const titleInput = screen.getByLabelText(/Title/);
      fireEvent.change(titleInput, { target: { value: "New Task" } });
      fireEvent.click(screen.getByRole("button", { name: "Create Task" }));

      await waitFor(() => {
        expect(mockOnOpenChange).toHaveBeenCalledWith(false);
      });
    });
  });

  describe("Edit submission", () => {
    it("submits PATCH request for existing task", async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: "task-1", title: "Updated Task" }),
      });

      renderWithProviders(
        <TaskFormDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          matterId="matter-1"
          task={mockTask}
          onSuccess={mockOnSuccess}
        />
      );

      // Change title
      const titleInput = screen.getByLabelText(/Title/);
      fireEvent.change(titleInput, { target: { value: "Updated Task" } });

      // Submit
      fireEvent.click(screen.getByText("Save Changes"));

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith(
          "/api/tasks/task-1",
          expect.objectContaining({
            method: "PATCH",
          })
        );
      });
    });

    it("does not include matterId in edit request", async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: "task-1" }),
      });

      renderWithProviders(
        <TaskFormDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          matterId="matter-1"
          task={mockTask}
          onSuccess={mockOnSuccess}
        />
      );

      const titleInput = screen.getByLabelText(/Title/);
      fireEvent.change(titleInput, { target: { value: "Updated" } });
      fireEvent.click(screen.getByText("Save Changes"));

      await waitFor(() => {
        const body = JSON.parse(fetchMock.mock.calls[0][1].body);
        expect(body.matterId).toBeUndefined();
      });
    });

    it("shows success toast after update", async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: "task-1" }),
      });

      renderWithProviders(
        <TaskFormDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          matterId="matter-1"
          task={mockTask}
          onSuccess={mockOnSuccess}
        />
      );

      fireEvent.click(screen.getByText("Save Changes"));

      await waitFor(() => {
        expect(toast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: "Task updated",
          })
        );
      });
    });
  });

  describe("Error handling", () => {
    it("shows error toast on API failure", async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: "Server error" }),
      });

      renderWithProviders(
        <TaskFormDialog open={true} onOpenChange={mockOnOpenChange} matterId="matter-1" />
      );

      const titleInput = screen.getByLabelText(/Title/);
      fireEvent.change(titleInput, { target: { value: "New Task" } });
      fireEvent.click(screen.getByRole("button", { name: "Create Task" }));

      await waitFor(() => {
        expect(toast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: "Error",
            variant: "destructive",
          })
        );
      });
    });

    it("does not close dialog on error", async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: "Server error" }),
      });

      renderWithProviders(
        <TaskFormDialog open={true} onOpenChange={mockOnOpenChange} matterId="matter-1" />
      );

      const titleInput = screen.getByLabelText(/Title/);
      fireEvent.change(titleInput, { target: { value: "New Task" } });
      fireEvent.click(screen.getByRole("button", { name: "Create Task" }));

      await waitFor(() => {
        expect(toast).toHaveBeenCalled();
      });

      // Check that onOpenChange was NOT called with false
      expect(mockOnOpenChange).not.toHaveBeenCalledWith(false);
    });
  });

  describe("Cancel button", () => {
    it("calls onOpenChange(false) when Cancel clicked", () => {
      renderWithProviders(
        <TaskFormDialog open={true} onOpenChange={mockOnOpenChange} matterId="matter-1" />
      );

      fireEvent.click(screen.getByText("Cancel"));

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe("Form reset", () => {
    it("resets form when dialog reopens in create mode", async () => {
      const { rerender } = renderWithProviders(
        <TaskFormDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          matterId="matter-1"
          task={mockTask}
        />
      );

      // Form should have task data
      let titleInput = screen.getByLabelText(/Title/) as HTMLInputElement;
      expect(titleInput.value).toBe("Existing Task");

      // Close and reopen without task (create mode)
      rerender(
        <QueryClientProvider
          client={
            new QueryClient({
              defaultOptions: {
                queries: { retry: false },
                mutations: { retry: false },
              },
            })
          }
        >
          <TaskFormDialog open={false} onOpenChange={mockOnOpenChange} matterId="matter-1" />
        </QueryClientProvider>
      );

      rerender(
        <QueryClientProvider
          client={
            new QueryClient({
              defaultOptions: {
                queries: { retry: false },
                mutations: { retry: false },
              },
            })
          }
        >
          <TaskFormDialog open={true} onOpenChange={mockOnOpenChange} matterId="matter-1" />
        </QueryClientProvider>
      );

      // Form should be reset
      titleInput = screen.getByLabelText(/Title/) as HTMLInputElement;
      expect(titleInput.value).toBe("");
    });
  });
});
