import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TaskCard, type Task } from "@/components/tasks";

const mockTask: Task = {
  id: "task-1",
  title: "Review Contract",
  description: "Review the employment contract for compliance",
  priority: "high",
  status: "pending",
  dueDate: "2024-06-15T10:00:00Z",
  assigneeId: "user-1",
};

const mockCompletedTask: Task = {
  ...mockTask,
  id: "task-2",
  status: "completed",
};

const mockCancelledTask: Task = {
  ...mockTask,
  id: "task-3",
  status: "cancelled",
};

const mockInProgressTask: Task = {
  ...mockTask,
  id: "task-4",
  status: "in_progress",
};

describe("TaskCard", () => {
  const mockOnEdit = vi.fn();
  const mockOnComplete = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders task title", () => {
      render(
        <TaskCard
          task={mockTask}
          onEdit={mockOnEdit}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText("Review Contract")).toBeInTheDocument();
    });

    it("renders task description when present", () => {
      render(
        <TaskCard
          task={mockTask}
          onEdit={mockOnEdit}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText("Review the employment contract for compliance")).toBeInTheDocument();
    });

    it("renders due date when present", () => {
      render(
        <TaskCard
          task={mockTask}
          onEdit={mockOnEdit}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText(/Due:/)).toBeInTheDocument();
      expect(screen.getByText(/15 Jun 2024/)).toBeInTheDocument();
    });

    it("does not render due date when null", () => {
      render(
        <TaskCard
          task={{ ...mockTask, dueDate: null }}
          onEdit={mockOnEdit}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.queryByText(/Due:/)).not.toBeInTheDocument();
    });

    it("does not render description when null", () => {
      render(
        <TaskCard
          task={{ ...mockTask, description: null }}
          onEdit={mockOnEdit}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      expect(
        screen.queryByText("Review the employment contract for compliance")
      ).not.toBeInTheDocument();
    });
  });

  describe("Priority badges", () => {
    it.each([
      ["urgent", "bg-red-100"],
      ["high", "bg-orange-100"],
      ["medium", "bg-yellow-100"],
      ["low", "bg-slate-100"],
    ])("shows correct color for %s priority", (priority, expectedClass) => {
      render(
        <TaskCard
          task={{ ...mockTask, priority: priority as Task["priority"] }}
          onEdit={mockOnEdit}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      const badge = screen.getByText(priority);
      expect(badge.className).toContain(expectedClass);
    });
  });

  describe("Status display", () => {
    it("shows status badge", () => {
      render(
        <TaskCard
          task={mockTask}
          onEdit={mockOnEdit}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText("pending")).toBeInTheDocument();
    });

    it("shows 'in progress' for in_progress status", () => {
      render(
        <TaskCard
          task={mockInProgressTask}
          onEdit={mockOnEdit}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText("in progress")).toBeInTheDocument();
    });

    it("applies strikethrough for completed tasks", () => {
      render(
        <TaskCard
          task={mockCompletedTask}
          onEdit={mockOnEdit}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      const title = screen.getByText("Review Contract");
      expect(title.className).toContain("line-through");
    });

    it("applies strikethrough for cancelled tasks", () => {
      render(
        <TaskCard
          task={mockCancelledTask}
          onEdit={mockOnEdit}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      const title = screen.getByText("Review Contract");
      expect(title.className).toContain("line-through");
    });

    it("applies muted styling for cancelled tasks", () => {
      const { container } = render(
        <TaskCard
          task={mockCancelledTask}
          onEdit={mockOnEdit}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      const card = container.firstChild;
      expect(card).toHaveClass("opacity-60");
    });
  });

  describe("Click interactions", () => {
    it("calls onEdit when card is clicked", () => {
      render(
        <TaskCard
          task={mockTask}
          onEdit={mockOnEdit}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      const card = screen.getByRole("button", { name: /Edit task: Review Contract/i });
      fireEvent.click(card);

      expect(mockOnEdit).toHaveBeenCalledWith(mockTask);
    });

    it("calls onEdit when Enter key is pressed", () => {
      render(
        <TaskCard
          task={mockTask}
          onEdit={mockOnEdit}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      const card = screen.getByRole("button", { name: /Edit task: Review Contract/i });
      fireEvent.keyDown(card, { key: "Enter" });

      expect(mockOnEdit).toHaveBeenCalledWith(mockTask);
    });

    it("does not call onEdit for cancelled tasks", () => {
      const { container } = render(
        <TaskCard
          task={mockCancelledTask}
          onEdit={mockOnEdit}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      // Cancelled tasks have tabIndex=-1 and clicking should not trigger onEdit
      const card = container.firstChild as HTMLElement;
      fireEvent.click(card);

      expect(mockOnEdit).not.toHaveBeenCalled();
    });
  });

  describe("Dropdown menu actions", () => {
    it("shows dropdown menu trigger for pending tasks", () => {
      render(
        <TaskCard
          task={mockTask}
          onEdit={mockOnEdit}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByRole("button", { name: /Task actions/i })).toBeInTheDocument();
    });

    it("shows dropdown menu trigger for in-progress tasks", () => {
      render(
        <TaskCard
          task={mockInProgressTask}
          onEdit={mockOnEdit}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByRole("button", { name: /Task actions/i })).toBeInTheDocument();
    });

    it("hides dropdown menu trigger for completed tasks", () => {
      render(
        <TaskCard
          task={mockCompletedTask}
          onEdit={mockOnEdit}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.queryByRole("button", { name: /Task actions/i })).not.toBeInTheDocument();
    });

    it("hides dropdown menu trigger for cancelled tasks", () => {
      render(
        <TaskCard
          task={mockCancelledTask}
          onEdit={mockOnEdit}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.queryByRole("button", { name: /Task actions/i })).not.toBeInTheDocument();
    });

    // Note: Testing Radix UI dropdown menu items requires more complex setup
    // because they render in a portal. The key functionality (trigger visibility,
    // disabled state) is tested above. Full interaction tests would require
    // userEvent and/or additional portal setup.
  });

  describe("Loading state", () => {
    it("disables dropdown button when isUpdating is true", () => {
      render(
        <TaskCard
          task={mockTask}
          onEdit={mockOnEdit}
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
          isUpdating={true}
        />
      );

      const button = screen.getByRole("button", { name: /Task actions/i });
      expect(button).toBeDisabled();
    });
  });
});
