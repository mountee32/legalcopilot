import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { TemplateSelector } from "@/components/task-templates/template-selector";
import type { TaskTemplateWithItems } from "@/lib/api/schemas/task-templates";

// Mock template data
const mockTemplate: TaskTemplateWithItems = {
  id: "template-1",
  firmId: null,
  name: "Freehold Purchase Standard",
  description: "Standard tasks for freehold purchase",
  practiceArea: "conveyancing",
  subType: "freehold_purchase",
  isDefault: true,
  isActive: true,
  createdById: null,
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
  items: [
    {
      id: "item-1",
      templateId: "template-1",
      title: "AML Check",
      description: null,
      mandatory: true,
      category: "regulatory",
      defaultPriority: "high",
      relativeDueDays: 3,
      dueDateAnchor: "matter_opened",
      assigneeRole: null,
      checklistItems: null,
      sortOrder: 0,
      createdAt: "2024-01-01T00:00:00Z",
    },
    {
      id: "item-2",
      templateId: "template-1",
      title: "Client Care Letter",
      description: null,
      mandatory: true,
      category: "regulatory",
      defaultPriority: "high",
      relativeDueDays: 1,
      dueDateAnchor: "matter_opened",
      assigneeRole: null,
      checklistItems: null,
      sortOrder: 1,
      createdAt: "2024-01-01T00:00:00Z",
    },
    {
      id: "item-3",
      templateId: "template-1",
      title: "Welcome Call",
      description: "Optional welcome call",
      mandatory: false,
      category: "best_practice",
      defaultPriority: "low",
      relativeDueDays: 7,
      dueDateAnchor: "matter_opened",
      assigneeRole: null,
      checklistItems: null,
      sortOrder: 2,
      createdAt: "2024-01-01T00:00:00Z",
    },
  ],
};

const mockTemplateList = {
  templates: [{ ...mockTemplate, items: undefined }],
  pagination: { page: 1, pageSize: 20, total: 1 },
};

const mockMultipleTemplates = {
  templates: [
    { ...mockTemplate, items: undefined },
    {
      id: "template-2",
      firmId: null,
      name: "Express Conveyancing",
      description: "Streamlined process",
      practiceArea: "conveyancing",
      subType: "freehold_purchase",
      isDefault: false,
      isActive: true,
      createdById: null,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    },
  ],
  pagination: { page: 1, pageSize: 20, total: 2 },
};

describe("TemplateSelector", () => {
  const mockOnTemplateChange = vi.fn();
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    fetchMock = vi.fn();
    global.fetch = fetchMock;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Initial render", () => {
    it("renders nothing when practiceArea is empty", () => {
      const { container } = render(
        <TemplateSelector
          practiceArea=""
          subType="freehold_purchase"
          onTemplateChange={mockOnTemplateChange}
        />
      );

      expect(container).toBeEmptyDOMElement();
    });

    it("renders nothing when subType is undefined", () => {
      const { container } = render(
        <TemplateSelector
          practiceArea="conveyancing"
          subType={undefined}
          onTemplateChange={mockOnTemplateChange}
        />
      );

      expect(container).toBeEmptyDOMElement();
    });
  });

  describe("Loading state", () => {
    it("shows loading state while fetching templates", async () => {
      // Never resolve the fetch to keep it loading
      fetchMock.mockReturnValue(new Promise(() => {}));

      render(
        <TemplateSelector
          practiceArea="conveyancing"
          subType="freehold_purchase"
          onTemplateChange={mockOnTemplateChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/Loading templates/i)).toBeInTheDocument();
      });
    });
  });

  describe("No templates", () => {
    it("shows message when no templates available", async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({ templates: [], pagination: { page: 1, pageSize: 20, total: 0 } }),
      });

      render(
        <TemplateSelector
          practiceArea="conveyancing"
          subType="unknown_type"
          onTemplateChange={mockOnTemplateChange}
        />
      );

      await waitFor(() => {
        expect(
          screen.getByText(/No task templates available for this case type/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe("Template display", () => {
    it("auto-selects default template and shows preview", async () => {
      // First call - list templates
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTemplateList),
      });
      // Second call - load full template
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTemplate),
      });

      render(
        <TemplateSelector
          practiceArea="conveyancing"
          subType="freehold_purchase"
          onTemplateChange={mockOnTemplateChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByText("Task Template")).toBeInTheDocument();
      });

      // Template should be auto-expanded and showing task count
      await waitFor(() => {
        expect(screen.getByText("(3 tasks)")).toBeInTheDocument();
      });
    });

    it("calls onTemplateChange with mandatory item IDs when template loads", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTemplateList),
      });
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTemplate),
      });

      render(
        <TemplateSelector
          practiceArea="conveyancing"
          subType="freehold_purchase"
          onTemplateChange={mockOnTemplateChange}
        />
      );

      await waitFor(() => {
        expect(mockOnTemplateChange).toHaveBeenCalledWith({
          templateId: "template-1",
          selectedItemIds: ["item-1", "item-2"], // Only mandatory items
        });
      });
    });
  });

  describe("Expand/collapse", () => {
    it("toggles template preview visibility", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTemplateList),
      });
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTemplate),
      });

      render(
        <TemplateSelector
          practiceArea="conveyancing"
          subType="freehold_purchase"
          onTemplateChange={mockOnTemplateChange}
        />
      );

      // Wait for template to load and be expanded by default
      await waitFor(() => {
        expect(screen.getByText("AML Check")).toBeInTheDocument();
      });

      // Click to collapse
      const headerButton = screen.getByRole("button", { name: /Task Template/i });
      fireEvent.click(headerButton);

      // Preview should be hidden
      expect(screen.queryByText("AML Check")).not.toBeInTheDocument();

      // Click to expand again
      fireEvent.click(headerButton);

      // Preview should be visible
      await waitFor(() => {
        expect(screen.getByText("AML Check")).toBeInTheDocument();
      });
    });
  });

  describe("Multiple templates", () => {
    it("shows 'Use a different template' link when multiple templates available", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockMultipleTemplates),
      });
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTemplate),
      });

      render(
        <TemplateSelector
          practiceArea="conveyancing"
          subType="freehold_purchase"
          onTemplateChange={mockOnTemplateChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByText("Use a different template")).toBeInTheDocument();
      });
    });

    it("shows template list when clicking 'Use a different template'", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockMultipleTemplates),
      });
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTemplate),
      });

      render(
        <TemplateSelector
          practiceArea="conveyancing"
          subType="freehold_purchase"
          onTemplateChange={mockOnTemplateChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByText("Use a different template")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Use a different template"));

      await waitFor(() => {
        expect(screen.getByText("Select a template:")).toBeInTheDocument();
        expect(screen.getByText("Freehold Purchase Standard")).toBeInTheDocument();
        expect(screen.getByText("Express Conveyancing")).toBeInTheDocument();
        expect(screen.getByText("(Default)")).toBeInTheDocument();
      });
    });

    it("switches to selected template", async () => {
      const mockTemplate2: TaskTemplateWithItems = {
        ...mockTemplate,
        id: "template-2",
        name: "Express Conveyancing",
        isDefault: false,
        items: [mockTemplate.items[0]], // Only one item
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockMultipleTemplates),
      });
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTemplate),
      });

      render(
        <TemplateSelector
          practiceArea="conveyancing"
          subType="freehold_purchase"
          onTemplateChange={mockOnTemplateChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByText("Use a different template")).toBeInTheDocument();
      });

      // Open template list
      fireEvent.click(screen.getByText("Use a different template"));

      // Mock the second template fetch
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTemplate2),
      });

      await waitFor(() => {
        expect(screen.getByText("Express Conveyancing")).toBeInTheDocument();
      });

      // Select different template
      fireEvent.click(screen.getByText("Express Conveyancing"));

      await waitFor(() => {
        expect(mockOnTemplateChange).toHaveBeenLastCalledWith({
          templateId: "template-2",
          selectedItemIds: ["item-1"],
        });
      });
    });

    it("hides template list when Cancel is clicked", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockMultipleTemplates),
      });
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTemplate),
      });

      render(
        <TemplateSelector
          practiceArea="conveyancing"
          subType="freehold_purchase"
          onTemplateChange={mockOnTemplateChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByText("Use a different template")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Use a different template"));

      await waitFor(() => {
        expect(screen.getByText("Cancel")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Cancel"));

      expect(screen.queryByText("Select a template:")).not.toBeInTheDocument();
    });
  });

  describe("Selection changes", () => {
    it("notifies parent when selection changes", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTemplateList),
      });
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTemplate),
      });

      render(
        <TemplateSelector
          practiceArea="conveyancing"
          subType="freehold_purchase"
          onTemplateChange={mockOnTemplateChange}
        />
      );

      // Wait for template to load
      await waitFor(() => {
        expect(screen.getByText("Welcome Call")).toBeInTheDocument();
      });

      // Find and click the optional task checkbox
      const optionalCheckbox = screen.getByLabelText("Select Welcome Call");
      fireEvent.click(optionalCheckbox);

      // Should now include the optional item
      await waitFor(() => {
        expect(mockOnTemplateChange).toHaveBeenLastCalledWith(
          expect.objectContaining({
            templateId: "template-1",
            selectedItemIds: expect.arrayContaining(["item-1", "item-2", "item-3"]),
          })
        );
      });
    });
  });

  describe("Practice area changes", () => {
    it("clears selection when practice area changes", async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({ templates: [], pagination: { page: 1, pageSize: 20, total: 0 } }),
      });

      const { rerender } = render(
        <TemplateSelector
          practiceArea="conveyancing"
          subType="freehold_purchase"
          onTemplateChange={mockOnTemplateChange}
        />
      );

      await waitFor(() => {
        expect(mockOnTemplateChange).toHaveBeenCalledWith(null);
      });

      mockOnTemplateChange.mockClear();

      // Change practice area
      rerender(
        <TemplateSelector
          practiceArea="family"
          subType="divorce_petition"
          onTemplateChange={mockOnTemplateChange}
        />
      );

      await waitFor(() => {
        expect(mockOnTemplateChange).toHaveBeenCalledWith(null);
      });
    });
  });

  describe("Error handling", () => {
    it("handles fetch error gracefully", async () => {
      fetchMock.mockRejectedValue(new Error("Network error"));

      render(
        <TemplateSelector
          practiceArea="conveyancing"
          subType="freehold_purchase"
          onTemplateChange={mockOnTemplateChange}
        />
      );

      // Should show no templates message after error
      await waitFor(() => {
        expect(
          screen.getByText(/No task templates available for this case type/i)
        ).toBeInTheDocument();
      });
    });

    it("handles non-ok response", async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 500,
      });

      render(
        <TemplateSelector
          practiceArea="conveyancing"
          subType="freehold_purchase"
          onTemplateChange={mockOnTemplateChange}
        />
      );

      await waitFor(() => {
        expect(
          screen.getByText(/No task templates available for this case type/i)
        ).toBeInTheDocument();
      });
    });
  });
});
