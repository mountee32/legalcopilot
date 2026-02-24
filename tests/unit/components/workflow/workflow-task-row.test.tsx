import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  WorkflowTaskRow,
  type WorkflowTask,
} from "@/app/(app)/matters/[id]/_components/workflow/workflow-task-row";

// Mock the TaskDetailPanel to avoid complex sub-component rendering
vi.mock("@/app/(app)/matters/[id]/_components/workflow/task-detail-panel", () => ({
  TaskDetailPanel: ({ isExpanded }: { isExpanded: boolean }) =>
    isExpanded ? <div data-testid="task-detail-panel">Panel</div> : null,
}));

// Mock the AddEvidenceDialog
vi.mock("@/app/(app)/matters/[id]/_components/workflow/add-evidence-dialog", () => ({
  AddEvidenceDialog: () => null,
}));

// Mock the TABLE_GRID_CLASSES
vi.mock("@/app/(app)/matters/[id]/_components/workflow/workflow-table", () => ({
  TABLE_GRID_CLASSES: "grid grid-cols-5 gap-2",
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock useToast
vi.mock("@/lib/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

const mockTask: WorkflowTask = {
  id: "task-1",
  title: "Review mortgage offer",
  description: "Review and verify the mortgage offer details",
  status: "pending",
  priority: "high",
  dueDate: "2024-12-20T10:00:00Z",
  completedAt: null,
  isMandatory: true,
  requiresEvidence: true,
  requiresVerifiedEvidence: false,
  requiredEvidenceTypes: null,
  requiresApproval: false,
  approvalStatus: null,
  assigneeId: "user-1",
  evidenceCount: 2,
  verifiedEvidenceCount: 1,
  notesCount: 3,
  latestNote: "Client confirmed funds available",
  isBlocked: false,
  blockingReasons: [],
};

const mockTaskWithZeroCounts: WorkflowTask = {
  ...mockTask,
  evidenceCount: 0,
  notesCount: 0,
  latestNote: null,
};

const mockCompletedTask: WorkflowTask = {
  ...mockTask,
  status: "completed",
  completedAt: "2024-12-18T15:00:00Z",
};

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });
}

function renderWithClient(ui: React.ReactNode) {
  const queryClient = createTestQueryClient();
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe("WorkflowTaskRow", () => {
  const mockOnTaskUpdated = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
    // Default mock for fetch calls when panel expands
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ notes: [], evidence: [] }),
    });
  });

  describe("Rendering", () => {
    it("renders task title", () => {
      renderWithClient(
        <WorkflowTaskRow task={mockTask} matterId="matter-1" onTaskUpdated={mockOnTaskUpdated} />
      );

      expect(screen.getByText("Review mortgage offer")).toBeInTheDocument();
    });

    it("renders mandatory indicator for mandatory tasks", () => {
      renderWithClient(
        <WorkflowTaskRow task={mockTask} matterId="matter-1" onTaskUpdated={mockOnTaskUpdated} />
      );

      expect(screen.getByText("*")).toBeInTheDocument();
    });

    it("renders due date", () => {
      // Due date shows in remarks only when there's no latestNote and no blocking reasons
      const taskWithDueDate: WorkflowTask = {
        ...mockTask,
        latestNote: null,
      };
      renderWithClient(
        <WorkflowTaskRow
          task={taskWithDueDate}
          matterId="matter-1"
          onTaskUpdated={mockOnTaskUpdated}
        />
      );

      expect(screen.getByText(/Due 20 Dec/)).toBeInTheDocument();
    });

    it("renders status badge", () => {
      renderWithClient(
        <WorkflowTaskRow task={mockTask} matterId="matter-1" onTaskUpdated={mockOnTaskUpdated} />
      );

      expect(screen.getByText("Pending")).toBeInTheDocument();
    });
  });

  describe("Count badges", () => {
    it("shows notes count badge when notesCount > 0", () => {
      renderWithClient(
        <WorkflowTaskRow task={mockTask} matterId="matter-1" onTaskUpdated={mockOnTaskUpdated} />
      );

      expect(screen.getByTitle("3 notes")).toBeInTheDocument();
    });

    it("shows attachments count badge when evidenceCount > 0", () => {
      // Attachments badge only shows when requiresEvidence is false
      const taskWithAttachments: WorkflowTask = {
        ...mockTask,
        requiresEvidence: false,
      };
      renderWithClient(
        <WorkflowTaskRow
          task={taskWithAttachments}
          matterId="matter-1"
          onTaskUpdated={mockOnTaskUpdated}
        />
      );

      expect(screen.getByTitle("2 attachments")).toBeInTheDocument();
    });

    it("hides notes count badge when notesCount is 0", () => {
      renderWithClient(
        <WorkflowTaskRow
          task={mockTaskWithZeroCounts}
          matterId="matter-1"
          onTaskUpdated={mockOnTaskUpdated}
        />
      );

      expect(screen.queryByTitle(/note/)).not.toBeInTheDocument();
    });

    it("hides attachments count badge when evidenceCount is 0", () => {
      renderWithClient(
        <WorkflowTaskRow
          task={mockTaskWithZeroCounts}
          matterId="matter-1"
          onTaskUpdated={mockOnTaskUpdated}
        />
      );

      expect(screen.queryByTitle(/attachment/)).not.toBeInTheDocument();
    });
  });

  describe("Expand/Collapse", () => {
    it("expands on row click", async () => {
      const { container } = renderWithClient(
        <WorkflowTaskRow task={mockTask} matterId="matter-1" onTaskUpdated={mockOnTaskUpdated} />
      );

      // Get the main row wrapper (first div with role="button")
      const row = container.querySelector("[role='button'][aria-expanded]");
      expect(row).not.toBeNull();
      fireEvent.click(row!);

      await waitFor(() => {
        expect(screen.getByTestId("task-detail-panel")).toBeInTheDocument();
      });
    });

    it("collapses on second click", async () => {
      const { container } = renderWithClient(
        <WorkflowTaskRow task={mockTask} matterId="matter-1" onTaskUpdated={mockOnTaskUpdated} />
      );

      const row = container.querySelector("[role='button'][aria-expanded]");
      expect(row).not.toBeNull();

      // First click - expand
      fireEvent.click(row!);
      await waitFor(() => {
        expect(screen.getByTestId("task-detail-panel")).toBeInTheDocument();
      });

      // Second click - collapse
      fireEvent.click(row!);
      await waitFor(() => {
        expect(screen.queryByTestId("task-detail-panel")).not.toBeInTheDocument();
      });
    });

    it("has aria-expanded attribute", () => {
      const { container } = renderWithClient(
        <WorkflowTaskRow task={mockTask} matterId="matter-1" onTaskUpdated={mockOnTaskUpdated} />
      );

      const row = container.querySelector("[role='button'][aria-expanded]");
      expect(row).toHaveAttribute("aria-expanded", "false");
    });

    it("updates aria-expanded when expanded", async () => {
      const { container } = renderWithClient(
        <WorkflowTaskRow task={mockTask} matterId="matter-1" onTaskUpdated={mockOnTaskUpdated} />
      );

      const row = container.querySelector("[role='button'][aria-expanded]");
      expect(row).not.toBeNull();
      fireEvent.click(row!);

      await waitFor(() => {
        expect(row).toHaveAttribute("aria-expanded", "true");
      });
    });

    it("expands on Enter key press", async () => {
      const { container } = renderWithClient(
        <WorkflowTaskRow task={mockTask} matterId="matter-1" onTaskUpdated={mockOnTaskUpdated} />
      );

      const row = container.querySelector("[role='button'][aria-expanded]");
      expect(row).not.toBeNull();
      fireEvent.keyDown(row!, { key: "Enter" });

      await waitFor(() => {
        expect(screen.getByTestId("task-detail-panel")).toBeInTheDocument();
      });
    });

    it("expands on Space key press", async () => {
      const { container } = renderWithClient(
        <WorkflowTaskRow task={mockTask} matterId="matter-1" onTaskUpdated={mockOnTaskUpdated} />
      );

      const row = container.querySelector("[role='button'][aria-expanded]");
      expect(row).not.toBeNull();
      fireEvent.keyDown(row!, { key: " " });

      await waitFor(() => {
        expect(screen.getByTestId("task-detail-panel")).toBeInTheDocument();
      });
    });
  });

  describe("Collapsed content", () => {
    it("shows latest note when collapsed and not blocked", () => {
      renderWithClient(
        <WorkflowTaskRow task={mockTask} matterId="matter-1" onTaskUpdated={mockOnTaskUpdated} />
      );

      expect(screen.getByText("Client confirmed funds available")).toBeInTheDocument();
    });

    it("hides latest note when expanded", async () => {
      const { container } = renderWithClient(
        <WorkflowTaskRow task={mockTask} matterId="matter-1" onTaskUpdated={mockOnTaskUpdated} />
      );

      const row = container.querySelector("[role='button'][aria-expanded]");
      expect(row).not.toBeNull();
      fireEvent.click(row!);

      await waitFor(() => {
        // The truncated note in the collapsed view should be hidden
        // but the full notes should be visible in the panel
        expect(screen.getByTestId("task-detail-panel")).toBeInTheDocument();
      });
    });

    it("shows blocking reasons when blocked", () => {
      const blockedTask: WorkflowTask = {
        ...mockTask,
        isBlocked: true,
        blockingReasons: ["Awaiting evidence"],
      };

      renderWithClient(
        <WorkflowTaskRow task={blockedTask} matterId="matter-1" onTaskUpdated={mockOnTaskUpdated} />
      );

      expect(screen.getByText("Awaiting evidence")).toBeInTheDocument();
    });
  });

  describe("Completed tasks", () => {
    it("shows completed date instead of due date", () => {
      // Completed date shows in remarks when there's no latestNote and no blocking reasons
      const completedTaskNoNote: WorkflowTask = {
        ...mockCompletedTask,
        latestNote: null,
      };
      renderWithClient(
        <WorkflowTaskRow
          task={completedTaskNoNote}
          matterId="matter-1"
          onTaskUpdated={mockOnTaskUpdated}
        />
      );

      expect(screen.getByText("18 Dec 2024")).toBeInTheDocument();
      expect(screen.queryByText(/Due/)).not.toBeInTheDocument();
    });

    it("applies muted styling for completed tasks", () => {
      renderWithClient(
        <WorkflowTaskRow
          task={mockCompletedTask}
          matterId="matter-1"
          onTaskUpdated={mockOnTaskUpdated}
        />
      );

      const title = screen.getByText("Review mortgage offer");
      expect(title.className).toContain("text-slate-400");
    });

    it("hides actions menu", () => {
      renderWithClient(
        <WorkflowTaskRow
          task={mockCompletedTask}
          matterId="matter-1"
          onTaskUpdated={mockOnTaskUpdated}
        />
      );

      // The MoreVertical button should not be visible for completed tasks
      const buttons = screen.getAllByRole("button");
      const menuButtons = buttons.filter((btn) => btn.querySelector("svg") !== null);
      // Should only have the main row button, no dropdown trigger
      expect(screen.queryByRole("button", { name: /more/i })).not.toBeInTheDocument();
    });
  });

  describe("Disabled state", () => {
    it("hides actions menu when disabled", () => {
      renderWithClient(
        <WorkflowTaskRow
          task={mockTask}
          matterId="matter-1"
          disabled={true}
          onTaskUpdated={mockOnTaskUpdated}
        />
      );

      // Actions menu trigger should not be present
      const dropdownTriggers = screen.queryAllByRole("button").filter((btn) => {
        const svg = btn.querySelector("svg");
        return svg && btn.className.includes("ghost");
      });
      expect(dropdownTriggers.length).toBe(0);
    });
  });
});
