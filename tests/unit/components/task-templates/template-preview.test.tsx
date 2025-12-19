import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TemplatePreview } from "@/components/task-templates/template-preview";
import type { TaskTemplateWithItems, TaskTemplateItem } from "@/lib/api/schemas/task-templates";

// Mock template item factory
function createMockItem(overrides: Partial<TaskTemplateItem> = {}): TaskTemplateItem {
  return {
    id: `item-${Math.random().toString(36).slice(2, 9)}`,
    templateId: "template-1",
    title: "Test Task",
    description: null,
    mandatory: false,
    category: "best_practice",
    defaultPriority: "medium",
    relativeDueDays: null,
    dueDateAnchor: null,
    assigneeRole: null,
    checklistItems: null,
    sortOrder: 0,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

// Mock template factory
function createMockTemplate(overrides: Partial<TaskTemplateWithItems> = {}): TaskTemplateWithItems {
  return {
    id: "template-1",
    firmId: null,
    name: "Test Template",
    description: null,
    practiceArea: "conveyancing",
    subType: "freehold_purchase",
    isDefault: true,
    isActive: true,
    createdById: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    items: [],
    ...overrides,
  };
}

describe("TemplatePreview", () => {
  const mockOnSelectionChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Loading state", () => {
    it("renders loading skeleton when loading is true", () => {
      render(
        <TemplatePreview
          template={null}
          selectedItemIds={[]}
          onSelectionChange={mockOnSelectionChange}
          loading={true}
        />
      );

      // Skeleton components should be present
      const skeletons = document.querySelectorAll('[class*="animate-pulse"]');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe("Empty state", () => {
    it("renders empty state when template is null and not loading", () => {
      render(
        <TemplatePreview
          template={null}
          selectedItemIds={[]}
          onSelectionChange={mockOnSelectionChange}
          loading={false}
        />
      );

      expect(screen.getByText("No template available for this case type")).toBeInTheDocument();
    });
  });

  describe("Template display", () => {
    it("renders template name and task count", () => {
      const template = createMockTemplate({
        name: "Freehold Purchase Standard",
        items: [createMockItem({ id: "1" }), createMockItem({ id: "2" })],
      });

      render(
        <TemplatePreview
          template={template}
          selectedItemIds={[]}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      expect(screen.getByText("Freehold Purchase Standard")).toBeInTheDocument();
      expect(screen.getByText("2 tasks")).toBeInTheDocument();
    });

    it("separates mandatory and optional tasks", () => {
      const template = createMockTemplate({
        items: [
          createMockItem({ id: "1", title: "Mandatory Task", mandatory: true }),
          createMockItem({ id: "2", title: "Optional Task", mandatory: false }),
        ],
      });

      render(
        <TemplatePreview
          template={template}
          selectedItemIds={[]}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      expect(screen.getByText(/Mandatory Tasks \(1\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Optional Tasks \(1\)/i)).toBeInTheDocument();
      expect(screen.getByText("Mandatory Task")).toBeInTheDocument();
      expect(screen.getByText("Optional Task")).toBeInTheDocument();
    });
  });

  describe("Category badges", () => {
    it("renders regulatory category with lock icon", () => {
      const template = createMockTemplate({
        items: [createMockItem({ id: "1", title: "AML Check", category: "regulatory" })],
      });

      render(
        <TemplatePreview
          template={template}
          selectedItemIds={[]}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      expect(screen.getByText("Regulatory")).toBeInTheDocument();
    });

    it("renders legal category with lock icon", () => {
      const template = createMockTemplate({
        items: [createMockItem({ id: "1", title: "SDLT Return", category: "legal" })],
      });

      render(
        <TemplatePreview
          template={template}
          selectedItemIds={[]}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      expect(screen.getByText("Legal")).toBeInTheDocument();
    });

    it("renders firm_policy category", () => {
      const template = createMockTemplate({
        items: [createMockItem({ id: "1", category: "firm_policy" })],
      });

      render(
        <TemplatePreview
          template={template}
          selectedItemIds={[]}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      expect(screen.getByText("Firm Policy")).toBeInTheDocument();
    });

    it("renders best_practice category", () => {
      const template = createMockTemplate({
        items: [createMockItem({ id: "1", category: "best_practice" })],
      });

      render(
        <TemplatePreview
          template={template}
          selectedItemIds={[]}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      expect(screen.getByText("Best Practice")).toBeInTheDocument();
    });
  });

  describe("Task item details", () => {
    it("renders task description when present", () => {
      const template = createMockTemplate({
        items: [
          createMockItem({
            id: "1",
            title: "Task with Description",
            description: "This is a detailed description",
          }),
        ],
      });

      render(
        <TemplatePreview
          template={template}
          selectedItemIds={[]}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      expect(screen.getByText("This is a detailed description")).toBeInTheDocument();
    });

    it("renders priority badge for non-medium priorities", () => {
      const template = createMockTemplate({
        items: [createMockItem({ id: "1", defaultPriority: "high" })],
      });

      render(
        <TemplatePreview
          template={template}
          selectedItemIds={[]}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      expect(screen.getByText("high")).toBeInTheDocument();
    });

    it("does not render priority badge for medium priority", () => {
      const template = createMockTemplate({
        items: [createMockItem({ id: "1", defaultPriority: "medium" })],
      });

      render(
        <TemplatePreview
          template={template}
          selectedItemIds={[]}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      expect(screen.queryByText("medium")).not.toBeInTheDocument();
    });

    it("renders relative due date info when present", () => {
      const template = createMockTemplate({
        items: [
          createMockItem({
            id: "1",
            relativeDueDays: 14,
            dueDateAnchor: "matter_opened",
          }),
        ],
      });

      render(
        <TemplatePreview
          template={template}
          selectedItemIds={[]}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      expect(screen.getByText(/Due: 14 days from/)).toBeInTheDocument();
    });
  });

  describe("Selection behavior", () => {
    it("calls onSelectionChange when optional task is toggled on", () => {
      const template = createMockTemplate({
        items: [createMockItem({ id: "opt-1", mandatory: false })],
      });

      render(
        <TemplatePreview
          template={template}
          selectedItemIds={[]}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      const checkbox = screen.getByRole("checkbox");
      fireEvent.click(checkbox);

      expect(mockOnSelectionChange).toHaveBeenCalledWith(["opt-1"]);
    });

    it("calls onSelectionChange when optional task is toggled off", () => {
      const template = createMockTemplate({
        items: [createMockItem({ id: "opt-1", mandatory: false })],
      });

      render(
        <TemplatePreview
          template={template}
          selectedItemIds={["opt-1"]}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      const checkbox = screen.getByRole("checkbox");
      fireEvent.click(checkbox);

      expect(mockOnSelectionChange).toHaveBeenCalledWith([]);
    });

    it("mandatory tasks cannot be toggled", () => {
      const template = createMockTemplate({
        items: [createMockItem({ id: "mand-1", mandatory: true })],
      });

      render(
        <TemplatePreview
          template={template}
          selectedItemIds={[]}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      // Mandatory tasks show CheckSquare icon instead of checkbox
      expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    });
  });

  describe("Select all / Deselect all", () => {
    it("select all selects all optional items plus mandatory", () => {
      const template = createMockTemplate({
        items: [
          createMockItem({ id: "mand-1", mandatory: true }),
          createMockItem({ id: "opt-1", mandatory: false }),
          createMockItem({ id: "opt-2", mandatory: false }),
        ],
      });

      render(
        <TemplatePreview
          template={template}
          selectedItemIds={["mand-1"]}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      const selectAllButton = screen.getByText("Select all");
      fireEvent.click(selectAllButton);

      expect(mockOnSelectionChange).toHaveBeenCalledWith(["mand-1", "opt-1", "opt-2"]);
    });

    it("deselect all keeps only mandatory items", () => {
      const template = createMockTemplate({
        items: [
          createMockItem({ id: "mand-1", mandatory: true }),
          createMockItem({ id: "opt-1", mandatory: false }),
          createMockItem({ id: "opt-2", mandatory: false }),
        ],
      });

      render(
        <TemplatePreview
          template={template}
          selectedItemIds={["mand-1", "opt-1", "opt-2"]}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      const deselectAllButton = screen.getByText("Deselect all");
      fireEvent.click(deselectAllButton);

      expect(mockOnSelectionChange).toHaveBeenCalledWith(["mand-1"]);
    });
  });

  describe("Task count summary", () => {
    it("shows correct count of tasks to be created", () => {
      const template = createMockTemplate({
        items: [
          createMockItem({ id: "mand-1", mandatory: true }),
          createMockItem({ id: "mand-2", mandatory: true }),
          createMockItem({ id: "opt-1", mandatory: false }),
          createMockItem({ id: "opt-2", mandatory: false }),
        ],
      });

      render(
        <TemplatePreview
          template={template}
          selectedItemIds={["opt-1"]}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      // 2 mandatory + 1 selected optional = 3 tasks
      expect(screen.getByText(/3 tasks will be created/)).toBeInTheDocument();
    });

    it("shows only mandatory count when no optional selected", () => {
      const template = createMockTemplate({
        items: [
          createMockItem({ id: "mand-1", mandatory: true }),
          createMockItem({ id: "opt-1", mandatory: false }),
        ],
      });

      render(
        <TemplatePreview
          template={template}
          selectedItemIds={[]}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      // 1 mandatory + 0 selected optional = 1 task
      expect(screen.getByText(/1 tasks will be created/)).toBeInTheDocument();
    });
  });

  describe("Edge cases", () => {
    it("handles template with only mandatory tasks", () => {
      const template = createMockTemplate({
        items: [
          createMockItem({ id: "mand-1", mandatory: true }),
          createMockItem({ id: "mand-2", mandatory: true }),
        ],
      });

      render(
        <TemplatePreview
          template={template}
          selectedItemIds={[]}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      expect(screen.getByText(/Mandatory Tasks \(2\)/i)).toBeInTheDocument();
      expect(screen.queryByText(/Optional Tasks/i)).not.toBeInTheDocument();
    });

    it("handles template with only optional tasks", () => {
      const template = createMockTemplate({
        items: [
          createMockItem({ id: "opt-1", mandatory: false }),
          createMockItem({ id: "opt-2", mandatory: false }),
        ],
      });

      render(
        <TemplatePreview
          template={template}
          selectedItemIds={[]}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      expect(screen.queryByText(/Mandatory Tasks/i)).not.toBeInTheDocument();
      expect(screen.getByText(/Optional Tasks \(2\)/i)).toBeInTheDocument();
    });

    it("handles template with empty items array", () => {
      const template = createMockTemplate({
        items: [],
      });

      render(
        <TemplatePreview
          template={template}
          selectedItemIds={[]}
          onSelectionChange={mockOnSelectionChange}
        />
      );

      expect(screen.getByText("Test Template")).toBeInTheDocument();
      expect(screen.getByText("0 tasks")).toBeInTheDocument();
    });
  });
});
