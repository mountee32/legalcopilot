import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AddFromTemplateDialog } from "@/components/tasks";
import type { TaskTemplateWithItems } from "@/lib/api/schemas/task-templates";

// Mock toast
vi.mock("@/lib/hooks/use-toast", () => ({
  toast: vi.fn(),
}));

import { toast } from "@/lib/hooks/use-toast";

// Mock template data
const mockTemplate: TaskTemplateWithItems = {
  id: "template-1",
  firmId: "firm-1",
  name: "Freehold Purchase Standard",
  description: "Standard tasks for freehold purchase",
  practiceArea: "conveyancing",
  subType: "freehold_purchase",
  isActive: true,
  isDefault: true,
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
  createdById: "user-1",
  items: [
    {
      id: "item-1",
      templateId: "template-1",
      title: "Request Property Documents",
      description: "Obtain title deeds and search documents",
      mandatory: true,
      category: "regulatory",
      defaultPriority: "high",
      relativeDueDays: 7,
      dueDateAnchor: "matter_opened",
      assigneeRole: null,
      checklistItems: null,
      sortOrder: 0,
      createdAt: "2024-01-01T00:00:00Z",
    },
    {
      id: "item-2",
      templateId: "template-1",
      title: "Order Local Searches",
      description: null,
      mandatory: true,
      category: "regulatory",
      defaultPriority: "high",
      relativeDueDays: 3,
      dueDateAnchor: "matter_opened",
      assigneeRole: null,
      checklistItems: null,
      sortOrder: 1,
      createdAt: "2024-01-01T00:00:00Z",
    },
    {
      id: "item-3",
      templateId: "template-1",
      title: "Client Follow-up Call",
      description: "Optional follow-up with client",
      mandatory: false,
      category: "best_practice",
      defaultPriority: "low",
      relativeDueDays: 14,
      dueDateAnchor: "matter_opened",
      assigneeRole: null,
      checklistItems: null,
      sortOrder: 2,
      createdAt: "2024-01-01T00:00:00Z",
    },
  ],
};

const mockTemplatesList = [
  {
    id: "template-1",
    name: "Freehold Purchase Standard",
    description: "Standard tasks for freehold purchase",
    isDefault: true,
  },
  {
    id: "template-2",
    name: "Freehold Purchase Premium",
    description: "Extended tasks for premium service",
    isDefault: false,
  },
];

describe("AddFromTemplateDialog", () => {
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
        <AddFromTemplateDialog
          open={false}
          onOpenChange={mockOnOpenChange}
          matterId="matter-1"
          practiceArea="conveyancing"
          subType="freehold_purchase"
        />
      );

      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe("Dialog header", () => {
    it("renders dialog title", async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ templates: mockTemplatesList }),
      });

      render(
        <AddFromTemplateDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          matterId="matter-1"
          practiceArea="conveyancing"
          subType="freehold_purchase"
        />
      );

      expect(screen.getByText("Add Tasks from Template")).toBeInTheDocument();
    });

    it("shows description when practice area and subType provided", async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ templates: mockTemplatesList }),
      });

      render(
        <AddFromTemplateDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          matterId="matter-1"
          practiceArea="conveyancing"
          subType="freehold_purchase"
        />
      );

      expect(
        screen.getByText("Select tasks from available templates for this case type.")
      ).toBeInTheDocument();
    });

    it("shows message when practice area missing", () => {
      render(
        <AddFromTemplateDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          matterId="matter-1"
          practiceArea=""
          subType="freehold_purchase"
        />
      );

      expect(screen.getByText("Set the case type to see available templates.")).toBeInTheDocument();
    });

    it("shows message when subType missing", () => {
      render(
        <AddFromTemplateDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          matterId="matter-1"
          practiceArea="conveyancing"
          subType={undefined}
        />
      );

      expect(screen.getByText("Set the case type to see available templates.")).toBeInTheDocument();
    });
  });

  describe("Loading state", () => {
    it("shows loading skeleton when fetching", async () => {
      fetchMock.mockReturnValue(new Promise(() => {})); // Never resolves

      render(
        <AddFromTemplateDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          matterId="matter-1"
          practiceArea="conveyancing"
          subType="freehold_purchase"
        />
      );

      const skeletons = document.querySelectorAll('[class*="animate-pulse"]');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe("Empty state", () => {
    it("shows no templates message when none available", async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ templates: [] }),
      });

      render(
        <AddFromTemplateDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          matterId="matter-1"
          practiceArea="conveyancing"
          subType="freehold_purchase"
        />
      );

      await waitFor(() => {
        expect(screen.getByText("No templates available for this case type.")).toBeInTheDocument();
      });
    });
  });

  describe("Template loading", () => {
    it("auto-selects default template when available", async () => {
      // First call returns template list, second returns full template
      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ templates: mockTemplatesList }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockTemplate),
        });

      render(
        <AddFromTemplateDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          matterId="matter-1"
          practiceArea="conveyancing"
          subType="freehold_purchase"
        />
      );

      await waitFor(() => {
        // Template should be loaded and items displayed
        expect(screen.getByText("Request Property Documents")).toBeInTheDocument();
      });
    });

    it("auto-selects only template when just one available", async () => {
      const singleTemplateList = [mockTemplatesList[0]];

      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ templates: singleTemplateList }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockTemplate),
        });

      render(
        <AddFromTemplateDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          matterId="matter-1"
          practiceArea="conveyancing"
          subType="freehold_purchase"
        />
      );

      await waitFor(() => {
        expect(screen.getByText("Request Property Documents")).toBeInTheDocument();
      });
    });
  });

  describe("Template preview", () => {
    it("displays template items after loading", async () => {
      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ templates: mockTemplatesList }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockTemplate),
        });

      render(
        <AddFromTemplateDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          matterId="matter-1"
          practiceArea="conveyancing"
          subType="freehold_purchase"
        />
      );

      await waitFor(() => {
        expect(screen.getByText("Request Property Documents")).toBeInTheDocument();
        expect(screen.getByText("Order Local Searches")).toBeInTheDocument();
        expect(screen.getByText("Client Follow-up Call")).toBeInTheDocument();
      });
    });

    it("pre-selects mandatory items", async () => {
      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ templates: [mockTemplatesList[0]] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockTemplate),
        });

      render(
        <AddFromTemplateDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          matterId="matter-1"
          practiceArea="conveyancing"
          subType="freehold_purchase"
        />
      );

      await waitFor(() => {
        // Check that the Add button shows count of mandatory items (2)
        expect(screen.getByRole("button", { name: /Add 2 Tasks?/i })).toBeInTheDocument();
      });
    });
  });

  describe("Apply template", () => {
    it("calls apply-template API when Apply clicked", async () => {
      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ templates: [mockTemplatesList[0]] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockTemplate),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ tasksCreated: 2, tasksSkipped: 0, tasks: [] }),
        });

      render(
        <AddFromTemplateDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          matterId="matter-1"
          practiceArea="conveyancing"
          subType="freehold_purchase"
          onTasksAdded={mockOnTasksAdded}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /Add 2 Tasks?/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole("button", { name: /Add 2 Tasks?/i }));

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith(
          "/api/matters/matter-1/apply-template",
          expect.objectContaining({
            method: "POST",
            body: expect.stringContaining("template-1"),
          })
        );
      });
    });

    it("shows success toast after applying template", async () => {
      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ templates: [mockTemplatesList[0]] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockTemplate),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ tasksCreated: 2, tasksSkipped: 0, tasks: [] }),
        });

      render(
        <AddFromTemplateDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          matterId="matter-1"
          practiceArea="conveyancing"
          subType="freehold_purchase"
          onTasksAdded={mockOnTasksAdded}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /Add 2 Tasks?/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole("button", { name: /Add 2 Tasks?/i }));

      await waitFor(() => {
        expect(toast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: "Tasks added",
          })
        );
      });
    });

    it("calls onTasksAdded after successful application", async () => {
      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ templates: [mockTemplatesList[0]] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockTemplate),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ tasksCreated: 2, tasksSkipped: 0, tasks: [] }),
        });

      render(
        <AddFromTemplateDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          matterId="matter-1"
          practiceArea="conveyancing"
          subType="freehold_purchase"
          onTasksAdded={mockOnTasksAdded}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /Add 2 Tasks?/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole("button", { name: /Add 2 Tasks?/i }));

      await waitFor(() => {
        expect(mockOnTasksAdded).toHaveBeenCalled();
      });
    });

    it("closes dialog after successful application", async () => {
      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ templates: [mockTemplatesList[0]] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockTemplate),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ tasksCreated: 2, tasksSkipped: 0, tasks: [] }),
        });

      render(
        <AddFromTemplateDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          matterId="matter-1"
          practiceArea="conveyancing"
          subType="freehold_purchase"
        />
      );

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /Add 2 Tasks?/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole("button", { name: /Add 2 Tasks?/i }));

      await waitFor(() => {
        expect(mockOnOpenChange).toHaveBeenCalledWith(false);
      });
    });
  });

  describe("Error handling", () => {
    it("shows error toast when template fetch fails", async () => {
      fetchMock.mockRejectedValue(new Error("Network error"));

      render(
        <AddFromTemplateDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          matterId="matter-1"
          practiceArea="conveyancing"
          subType="freehold_purchase"
        />
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

    it("shows error toast when apply fails", async () => {
      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ templates: [mockTemplatesList[0]] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockTemplate),
        })
        .mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve({ error: "Failed to apply" }),
        });

      render(
        <AddFromTemplateDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          matterId="matter-1"
          practiceArea="conveyancing"
          subType="freehold_purchase"
        />
      );

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /Add 2 Tasks?/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole("button", { name: /Add 2 Tasks?/i }));

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

  describe("Cancel button", () => {
    it("calls onOpenChange(false) when Cancel clicked", async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ templates: [] }),
      });

      render(
        <AddFromTemplateDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          matterId="matter-1"
          practiceArea="conveyancing"
          subType="freehold_purchase"
        />
      );

      await waitFor(() => {
        expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe("Disabled states", () => {
    it("disables Apply button when no items selected", async () => {
      // Create a template with only optional items
      const optionalOnlyTemplate = {
        ...mockTemplate,
        items: [mockTemplate.items[2]], // Only optional item
      };

      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ templates: [mockTemplatesList[0]] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(optionalOnlyTemplate),
        });

      render(
        <AddFromTemplateDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          matterId="matter-1"
          practiceArea="conveyancing"
          subType="freehold_purchase"
        />
      );

      await waitFor(() => {
        expect(screen.getByText("Client Follow-up Call")).toBeInTheDocument();
      });

      // Button should show "Add 0 Tasks" and be disabled
      const addButton = screen.getByRole("button", { name: /Add 0 Tasks?/i });
      expect(addButton).toBeDisabled();
    });

    it("disables Apply button when no template selected", async () => {
      // Return templates but don't auto-select (no default, multiple templates)
      const noDefaultTemplates = mockTemplatesList.map((t) => ({ ...t, isDefault: false }));

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ templates: noDefaultTemplates }),
      });

      render(
        <AddFromTemplateDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          matterId="matter-1"
          practiceArea="conveyancing"
          subType="freehold_purchase"
        />
      );

      await waitFor(() => {
        expect(screen.getByText("Select Template")).toBeInTheDocument();
      });

      // Button should be disabled (shows Add 0 Tasks)
      const addButton = screen.getByRole("button", { name: /Add 0 Tasks?/i });
      expect(addButton).toBeDisabled();
    });
  });
});
