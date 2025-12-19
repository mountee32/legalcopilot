import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SkippedTasksDialog } from "@/components/task-templates/skipped-tasks-dialog";
import type { TemplateStatusResponse, TaskTemplateItem } from "@/lib/api/schemas/task-templates";

// Mock toast
vi.mock("@/lib/hooks/use-toast", () => ({
  toast: vi.fn(),
}));

import { toast } from "@/lib/hooks/use-toast";

// Mock data
const mockSkippedItem1: TaskTemplateItem = {
  id: "item-1",
  templateId: "template-1",
  title: "Welcome Call",
  description: "Optional welcome call to client",
  mandatory: false,
  category: "best_practice",
  defaultPriority: "low",
  relativeDueDays: 7,
  dueDateAnchor: "matter_opened",
  assigneeRole: null,
  checklistItems: null,
  sortOrder: 0,
  createdAt: "2024-01-01T00:00:00Z",
};

const mockSkippedItem2: TaskTemplateItem = {
  id: "item-2",
  templateId: "template-1",
  title: "Client Feedback Survey",
  description: null,
  mandatory: false,
  category: "firm_policy",
  defaultPriority: "medium",
  relativeDueDays: null,
  dueDateAnchor: null,
  assigneeRole: null,
  checklistItems: null,
  sortOrder: 1,
  createdAt: "2024-01-01T00:00:00Z",
};

const mockStatus: TemplateStatusResponse = {
  applications: [
    {
      id: "app-1",
      templateId: "template-1",
      templateName: "Freehold Purchase Standard",
      appliedAt: "2024-06-15T10:30:00Z",
      appliedById: "user-1",
      appliedByName: "Sarah Harrison",
      itemsApplied: [
        { templateItemId: "item-1", taskId: null, wasModified: false, wasSkipped: true },
        { templateItemId: "item-2", taskId: null, wasModified: false, wasSkipped: true },
      ],
    },
  ],
  skippedItems: [mockSkippedItem1, mockSkippedItem2],
  availableTemplates: [],
};

const mockEmptyStatus: TemplateStatusResponse = {
  applications: [
    {
      id: "app-1",
      templateId: "template-1",
      templateName: "Freehold Purchase Standard",
      appliedAt: "2024-06-15T10:30:00Z",
      appliedById: "user-1",
      appliedByName: "Sarah Harrison",
      itemsApplied: [],
    },
  ],
  skippedItems: [],
  availableTemplates: [],
};

describe("SkippedTasksDialog", () => {
  const mockOnOpenChange = vi.fn();
  const mockOnTasksAdded = vi.fn();
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    fetchMock = vi.fn();
    global.fetch = fetchMock;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Closed state", () => {
    it("does not fetch when dialog is closed", () => {
      render(
        <SkippedTasksDialog open={false} onOpenChange={mockOnOpenChange} matterId="matter-1" />
      );

      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe("Loading state", () => {
    it("shows loading skeleton when fetching", async () => {
      fetchMock.mockReturnValue(new Promise(() => {}));

      render(
        <SkippedTasksDialog open={true} onOpenChange={mockOnOpenChange} matterId="matter-1" />
      );

      const skeletons = document.querySelectorAll('[class*="animate-pulse"]');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe("Dialog header", () => {
    it("renders dialog title", async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockStatus),
      });

      render(
        <SkippedTasksDialog open={true} onOpenChange={mockOnOpenChange} matterId="matter-1" />
      );

      await waitFor(() => {
        expect(screen.getByText("Add Tasks from Template")).toBeInTheDocument();
      });
    });

    it("shows template name in description", async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockStatus),
      });

      render(
        <SkippedTasksDialog open={true} onOpenChange={mockOnOpenChange} matterId="matter-1" />
      );

      await waitFor(() => {
        expect(
          screen.getByText(/Tasks from "Freehold Purchase Standard" that were not initially added/)
        ).toBeInTheDocument();
      });
    });
  });

  describe("Empty state", () => {
    it("shows completion message when no skipped items", async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockEmptyStatus),
      });

      render(
        <SkippedTasksDialog open={true} onOpenChange={mockOnOpenChange} matterId="matter-1" />
      );

      await waitFor(() => {
        expect(screen.getByText("All template tasks have been added!")).toBeInTheDocument();
      });
    });
  });

  describe("Task list", () => {
    it("displays skipped items with titles", async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockStatus),
      });

      render(
        <SkippedTasksDialog open={true} onOpenChange={mockOnOpenChange} matterId="matter-1" />
      );

      await waitFor(() => {
        expect(screen.getByText("Welcome Call")).toBeInTheDocument();
        expect(screen.getByText("Client Feedback Survey")).toBeInTheDocument();
      });
    });

    it("displays item descriptions when present", async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockStatus),
      });

      render(
        <SkippedTasksDialog open={true} onOpenChange={mockOnOpenChange} matterId="matter-1" />
      );

      await waitFor(() => {
        expect(screen.getByText("Optional welcome call to client")).toBeInTheDocument();
      });
    });

    it("displays category badges", async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockStatus),
      });

      render(
        <SkippedTasksDialog open={true} onOpenChange={mockOnOpenChange} matterId="matter-1" />
      );

      await waitFor(() => {
        expect(screen.getByText("Best Practice")).toBeInTheDocument();
        expect(screen.getByText("Firm Policy")).toBeInTheDocument();
      });
    });

    it("displays relative due date info when present", async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockStatus),
      });

      render(
        <SkippedTasksDialog open={true} onOpenChange={mockOnOpenChange} matterId="matter-1" />
      );

      await waitFor(() => {
        expect(screen.getByText(/Due: 7 days from/)).toBeInTheDocument();
      });
    });

    it("shows selection count", async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockStatus),
      });

      render(
        <SkippedTasksDialog open={true} onOpenChange={mockOnOpenChange} matterId="matter-1" />
      );

      await waitFor(() => {
        expect(screen.getByText("0 of 2 selected")).toBeInTheDocument();
      });
    });
  });

  describe("Selection behavior", () => {
    it("toggles item selection on checkbox click", async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockStatus),
      });

      render(
        <SkippedTasksDialog open={true} onOpenChange={mockOnOpenChange} matterId="matter-1" />
      );

      await waitFor(() => {
        expect(screen.getByText("Welcome Call")).toBeInTheDocument();
      });

      const checkboxes = screen.getAllByRole("checkbox");
      fireEvent.click(checkboxes[0]);

      expect(screen.getByText("1 of 2 selected")).toBeInTheDocument();
    });

    it("select all selects all available items", async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockStatus),
      });

      render(
        <SkippedTasksDialog open={true} onOpenChange={mockOnOpenChange} matterId="matter-1" />
      );

      await waitFor(() => {
        expect(screen.getByText("Select all")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Select all"));

      expect(screen.getByText("2 of 2 selected")).toBeInTheDocument();
    });

    it("deselect all clears selection", async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockStatus),
      });

      render(
        <SkippedTasksDialog open={true} onOpenChange={mockOnOpenChange} matterId="matter-1" />
      );

      await waitFor(() => {
        expect(screen.getByText("Select all")).toBeInTheDocument();
      });

      // Select all first
      fireEvent.click(screen.getByText("Select all"));
      expect(screen.getByText("2 of 2 selected")).toBeInTheDocument();

      // Then deselect all
      fireEvent.click(screen.getByText("Deselect all"));
      expect(screen.getByText("0 of 2 selected")).toBeInTheDocument();
    });

    it("shows 'Add Selected' button when items selected", async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockStatus),
      });

      render(
        <SkippedTasksDialog open={true} onOpenChange={mockOnOpenChange} matterId="matter-1" />
      );

      await waitFor(() => {
        expect(screen.getByText("Welcome Call")).toBeInTheDocument();
      });

      // No button initially
      expect(screen.queryByText(/Add Selected/)).not.toBeInTheDocument();

      // Select an item
      const checkboxes = screen.getAllByRole("checkbox");
      fireEvent.click(checkboxes[0]);

      // Button should appear
      expect(screen.getByText("Add Selected (1)")).toBeInTheDocument();
    });
  });

  describe("Add single task", () => {
    it("adds single task when Add button clicked", async () => {
      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockStatus),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ tasksCreated: 1, tasksSkipped: 0, tasks: [] }),
        });

      render(
        <SkippedTasksDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          matterId="matter-1"
          onTasksAdded={mockOnTasksAdded}
        />
      );

      await waitFor(() => {
        expect(screen.getByText("Welcome Call")).toBeInTheDocument();
      });

      const addButtons = screen.getAllByRole("button", { name: /Add/i });
      // First "Add" button is for the first item
      fireEvent.click(addButtons[0]);

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith(
          "/api/matters/matter-1/apply-template",
          expect.objectContaining({
            method: "POST",
            body: JSON.stringify({
              templateId: "template-1",
              selectedItemIds: ["item-1"],
            }),
          })
        );
      });

      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Task added",
        })
      );

      expect(mockOnTasksAdded).toHaveBeenCalled();
    });
  });

  describe("Add selected tasks", () => {
    it("adds multiple selected tasks", async () => {
      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockStatus),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ tasksCreated: 2, tasksSkipped: 0, tasks: [] }),
        });

      render(
        <SkippedTasksDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          matterId="matter-1"
          onTasksAdded={mockOnTasksAdded}
        />
      );

      await waitFor(() => {
        expect(screen.getByText("Select all")).toBeInTheDocument();
      });

      // Select all
      fireEvent.click(screen.getByText("Select all"));

      // Click Add Selected
      fireEvent.click(screen.getByText("Add Selected (2)"));

      await waitFor(() => {
        expect(fetchMock).toHaveBeenLastCalledWith(
          "/api/matters/matter-1/apply-template",
          expect.objectContaining({
            method: "POST",
            body: expect.stringContaining("selectedItemIds"),
          })
        );
      });

      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Tasks added",
          description: "2 task(s) added to the matter.",
        })
      );

      expect(mockOnTasksAdded).toHaveBeenCalled();
    });
  });

  describe("Close button", () => {
    it("calls onOpenChange when Close clicked", async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockStatus),
      });

      render(
        <SkippedTasksDialog open={true} onOpenChange={mockOnOpenChange} matterId="matter-1" />
      );

      await waitFor(() => {
        expect(screen.getByText("Welcome Call")).toBeInTheDocument();
      });

      // Find the Close button (not the X button which also has sr-only "Close")
      const closeButtons = screen.getAllByRole("button", { name: /Close/i });
      // The main Close button is the one with just "Close" text (not the X icon)
      const mainCloseButton = closeButtons.find((btn) => btn.textContent === "Close");
      expect(mainCloseButton).toBeTruthy();
      fireEvent.click(mainCloseButton!);

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe("Error handling", () => {
    it("shows error toast on fetch failure", async () => {
      fetchMock.mockRejectedValue(new Error("Network error"));

      render(
        <SkippedTasksDialog open={true} onOpenChange={mockOnOpenChange} matterId="matter-1" />
      );

      await waitFor(() => {
        expect(toast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: "Error",
            variant: "destructive",
          })
        );
      });
    });

    it("shows error toast when add task fails", async () => {
      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockStatus),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
        });

      render(
        <SkippedTasksDialog open={true} onOpenChange={mockOnOpenChange} matterId="matter-1" />
      );

      await waitFor(() => {
        expect(screen.getByText("Welcome Call")).toBeInTheDocument();
      });

      const addButtons = screen.getAllByRole("button", { name: /Add/i });
      fireEvent.click(addButtons[0]);

      await waitFor(() => {
        expect(toast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: "Error",
            variant: "destructive",
          })
        );
      });
    });
  });

  describe("Auto-close behavior", () => {
    it("closes dialog when all items have been added", async () => {
      // Start with single item
      const singleItemStatus: TemplateStatusResponse = {
        ...mockStatus,
        skippedItems: [mockSkippedItem1],
      };

      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(singleItemStatus),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ tasksCreated: 1, tasksSkipped: 0, tasks: [] }),
        });

      render(
        <SkippedTasksDialog open={true} onOpenChange={mockOnOpenChange} matterId="matter-1" />
      );

      await waitFor(() => {
        expect(screen.getByText("Welcome Call")).toBeInTheDocument();
      });

      // Select the item
      const checkbox = screen.getByRole("checkbox");
      fireEvent.click(checkbox);

      // Add selected
      fireEvent.click(screen.getByText("Add Selected (1)"));

      await waitFor(() => {
        expect(mockOnOpenChange).toHaveBeenCalledWith(false);
      });
    });
  });

  describe("Items removed after adding", () => {
    it("removes item from list after adding", async () => {
      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockStatus),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ tasksCreated: 1, tasksSkipped: 0, tasks: [] }),
        });

      render(
        <SkippedTasksDialog open={true} onOpenChange={mockOnOpenChange} matterId="matter-1" />
      );

      await waitFor(() => {
        expect(screen.getByText("Welcome Call")).toBeInTheDocument();
      });

      // Add the first item
      const addButtons = screen.getAllByRole("button", { name: /Add/i });
      fireEvent.click(addButtons[0]);

      await waitFor(() => {
        // Item should be removed from the list (shows only 1 of 1 now)
        expect(screen.getByText("0 of 1 selected")).toBeInTheDocument();
      });
    });
  });
});
