import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { TemplateStatusCard } from "@/components/task-templates/template-status-card";
import type { TemplateStatusResponse, TaskTemplateItem } from "@/lib/api/schemas/task-templates";

// Mock status responses
const mockApplicationStatus: TemplateStatusResponse = {
  applications: [
    {
      id: "app-1",
      templateId: "template-1",
      templateName: "Freehold Purchase Standard",
      appliedAt: "2024-06-15T10:30:00Z",
      appliedById: "user-1",
      appliedByName: "Sarah Harrison",
      itemsApplied: [
        { templateItemId: "item-1", taskId: "task-1", wasModified: false, wasSkipped: false },
        { templateItemId: "item-2", taskId: "task-2", wasModified: false, wasSkipped: false },
        { templateItemId: "item-3", taskId: null, wasModified: false, wasSkipped: true },
      ],
    },
  ],
  skippedItems: [
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
    } as TaskTemplateItem,
  ],
  availableTemplates: [],
};

const mockNoApplicationStatus: TemplateStatusResponse = {
  applications: [],
  skippedItems: [],
  availableTemplates: [
    {
      id: "template-1",
      firmId: null,
      name: "Freehold Purchase Standard",
      description: "Standard tasks",
      practiceArea: "conveyancing",
      subType: "freehold_purchase",
      isDefault: true,
      isActive: true,
      createdById: null,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    },
  ],
};

const mockEmptyStatus: TemplateStatusResponse = {
  applications: [],
  skippedItems: [],
  availableTemplates: [],
};

describe("TemplateStatusCard", () => {
  const mockOnAddSkippedTasks = vi.fn();
  const mockOnViewTemplate = vi.fn();
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    fetchMock = vi.fn();
    global.fetch = fetchMock;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Loading state", () => {
    it("shows loading skeleton initially", async () => {
      // Never resolve to keep loading
      fetchMock.mockReturnValue(new Promise(() => {}));

      render(<TemplateStatusCard matterId="matter-1" onAddSkippedTasks={mockOnAddSkippedTasks} />);

      // Skeleton should be visible
      const skeletons = document.querySelectorAll('[class*="animate-pulse"]');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe("Error handling", () => {
    it("renders nothing on error", async () => {
      fetchMock.mockRejectedValue(new Error("Network error"));

      const { container } = render(
        <TemplateStatusCard matterId="matter-1" onAddSkippedTasks={mockOnAddSkippedTasks} />
      );

      await waitFor(() => {
        // After error, the component should not render anything meaningful
        expect(container.querySelector('[class*="animate-pulse"]')).not.toBeInTheDocument();
      });

      // No error message shown - silently fails
      expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
    });
  });

  describe("No template applied", () => {
    it("renders nothing when no templates available at all", async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockEmptyStatus),
      });

      const { container } = render(
        <TemplateStatusCard matterId="matter-1" onAddSkippedTasks={mockOnAddSkippedTasks} />
      );

      await waitFor(() => {
        expect(container.querySelector('[class*="animate-pulse"]')).not.toBeInTheDocument();
      });

      expect(screen.queryByText("No task template applied")).not.toBeInTheDocument();
    });

    it("shows 'Apply Template' button when templates available but none applied", async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockNoApplicationStatus),
      });

      render(<TemplateStatusCard matterId="matter-1" onAddSkippedTasks={mockOnAddSkippedTasks} />);

      await waitFor(() => {
        expect(screen.getByText("No task template applied")).toBeInTheDocument();
      });

      expect(screen.getByText("Apply Template")).toBeInTheDocument();
    });

    it("calls onAddSkippedTasks when Apply Template clicked", async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockNoApplicationStatus),
      });

      render(<TemplateStatusCard matterId="matter-1" onAddSkippedTasks={mockOnAddSkippedTasks} />);

      await waitFor(() => {
        expect(screen.getByText("Apply Template")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Apply Template"));

      expect(mockOnAddSkippedTasks).toHaveBeenCalledTimes(1);
    });

    it("handles 404 response gracefully", async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 404,
      });

      const { container } = render(
        <TemplateStatusCard matterId="matter-1" onAddSkippedTasks={mockOnAddSkippedTasks} />
      );

      await waitFor(() => {
        expect(container.querySelector('[class*="animate-pulse"]')).not.toBeInTheDocument();
      });

      // Should not crash, just show nothing
      expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
    });
  });

  describe("Template applied", () => {
    it("shows template name when applied", async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockApplicationStatus),
      });

      render(<TemplateStatusCard matterId="matter-1" onAddSkippedTasks={mockOnAddSkippedTasks} />);

      await waitFor(() => {
        expect(screen.getByText("Template Applied")).toBeInTheDocument();
      });

      expect(screen.getByText("Freehold Purchase Standard")).toBeInTheDocument();
    });

    it("shows applied date formatted correctly", async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockApplicationStatus),
      });

      render(<TemplateStatusCard matterId="matter-1" onAddSkippedTasks={mockOnAddSkippedTasks} />);

      await waitFor(() => {
        // Date should be formatted as "15 Jun 2024" (en-GB locale)
        expect(screen.getByText("15 Jun 2024")).toBeInTheDocument();
      });
    });

    it("shows applied by user name", async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockApplicationStatus),
      });

      render(<TemplateStatusCard matterId="matter-1" onAddSkippedTasks={mockOnAddSkippedTasks} />);

      await waitFor(() => {
        expect(screen.getByText("Sarah Harrison")).toBeInTheDocument();
      });
    });

    it("does not show user name when not provided", async () => {
      const statusWithoutUser = {
        ...mockApplicationStatus,
        applications: [
          {
            ...mockApplicationStatus.applications[0],
            appliedByName: null,
          },
        ],
      };

      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(statusWithoutUser),
      });

      render(<TemplateStatusCard matterId="matter-1" onAddSkippedTasks={mockOnAddSkippedTasks} />);

      await waitFor(() => {
        expect(screen.getByText("Freehold Purchase Standard")).toBeInTheDocument();
      });

      // Should not show user section
      expect(screen.queryByText("Sarah Harrison")).not.toBeInTheDocument();
    });
  });

  describe("Skipped items", () => {
    it("shows 'Add Skipped' button when there are skipped items", async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockApplicationStatus),
      });

      render(<TemplateStatusCard matterId="matter-1" onAddSkippedTasks={mockOnAddSkippedTasks} />);

      await waitFor(() => {
        expect(screen.getByText(/Add Skipped \(1\)/)).toBeInTheDocument();
      });
    });

    it("calls onAddSkippedTasks when Add Skipped clicked", async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockApplicationStatus),
      });

      render(<TemplateStatusCard matterId="matter-1" onAddSkippedTasks={mockOnAddSkippedTasks} />);

      await waitFor(() => {
        expect(screen.getByText(/Add Skipped/)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Add Skipped/));

      expect(mockOnAddSkippedTasks).toHaveBeenCalledTimes(1);
    });

    it("does not show 'Add Skipped' when no skipped items", async () => {
      const statusWithoutSkipped = {
        ...mockApplicationStatus,
        skippedItems: [],
      };

      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(statusWithoutSkipped),
      });

      render(<TemplateStatusCard matterId="matter-1" onAddSkippedTasks={mockOnAddSkippedTasks} />);

      await waitFor(() => {
        expect(screen.getByText("Freehold Purchase Standard")).toBeInTheDocument();
      });

      expect(screen.queryByText(/Add Skipped/)).not.toBeInTheDocument();
    });
  });

  describe("View template button", () => {
    it("shows View button when onViewTemplate is provided", async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockApplicationStatus),
      });

      render(
        <TemplateStatusCard
          matterId="matter-1"
          onAddSkippedTasks={mockOnAddSkippedTasks}
          onViewTemplate={mockOnViewTemplate}
        />
      );

      await waitFor(() => {
        expect(screen.getByText("View")).toBeInTheDocument();
      });
    });

    it("calls onViewTemplate with templateId when View clicked", async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockApplicationStatus),
      });

      render(
        <TemplateStatusCard
          matterId="matter-1"
          onAddSkippedTasks={mockOnAddSkippedTasks}
          onViewTemplate={mockOnViewTemplate}
        />
      );

      await waitFor(() => {
        expect(screen.getByText("View")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("View"));

      expect(mockOnViewTemplate).toHaveBeenCalledWith("template-1");
    });

    it("does not show View button when onViewTemplate is not provided", async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockApplicationStatus),
      });

      render(<TemplateStatusCard matterId="matter-1" onAddSkippedTasks={mockOnAddSkippedTasks} />);

      await waitFor(() => {
        expect(screen.getByText("Freehold Purchase Standard")).toBeInTheDocument();
      });

      expect(screen.queryByText("View")).not.toBeInTheDocument();
    });
  });

  describe("Multiple applications", () => {
    it("shows only the first (most recent) application", async () => {
      const multiAppStatus = {
        ...mockApplicationStatus,
        applications: [
          mockApplicationStatus.applications[0],
          {
            ...mockApplicationStatus.applications[0],
            id: "app-2",
            templateName: "Older Template",
            appliedAt: "2024-05-01T00:00:00Z",
          },
        ],
      };

      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(multiAppStatus),
      });

      render(<TemplateStatusCard matterId="matter-1" onAddSkippedTasks={mockOnAddSkippedTasks} />);

      await waitFor(() => {
        expect(screen.getByText("Freehold Purchase Standard")).toBeInTheDocument();
      });

      expect(screen.queryByText("Older Template")).not.toBeInTheDocument();
    });
  });
});
