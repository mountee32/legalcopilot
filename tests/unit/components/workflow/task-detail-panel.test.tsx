import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TaskDetailPanel } from "@/app/(app)/matters/[id]/_components/workflow/task-detail-panel";

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockNotes = {
  notes: [
    {
      id: "note-1",
      content: "Test note content",
      visibility: "internal",
      authorName: "Test Author",
      createdAt: "2024-12-15T10:00:00Z",
    },
  ],
};

const mockEvidence = {
  evidence: [
    {
      id: "ev-1",
      type: "proof_of_funds",
      description: "Test evidence",
      documentId: "doc-1",
      documentName: "test.pdf",
      addedByName: "Test Author",
      addedAt: "2024-12-14T10:00:00Z",
      verifiedAt: "2024-12-15T09:00:00Z",
    },
  ],
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

describe("TaskDetailPanel", () => {
  const mockOnAddNote = vi.fn();
  const mockOnAddEvidence = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
  });

  describe("When collapsed", () => {
    it("renders nothing when isExpanded is false", () => {
      renderWithClient(
        <TaskDetailPanel
          taskId="task-1"
          isExpanded={false}
          onAddNote={mockOnAddNote}
          onAddEvidence={mockOnAddEvidence}
        />
      );

      expect(screen.queryByTestId("task-detail-panel")).not.toBeInTheDocument();
    });

    it("does not fetch data when collapsed", () => {
      renderWithClient(
        <TaskDetailPanel
          taskId="task-1"
          isExpanded={false}
          onAddNote={mockOnAddNote}
          onAddEvidence={mockOnAddEvidence}
        />
      );

      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe("When expanded", () => {
    it("renders the panel when isExpanded is true", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockNotes),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockEvidence),
        });

      renderWithClient(
        <TaskDetailPanel
          taskId="task-1"
          isExpanded={true}
          onAddNote={mockOnAddNote}
          onAddEvidence={mockOnAddEvidence}
        />
      );

      expect(screen.getByTestId("task-detail-panel")).toBeInTheDocument();
    });

    it("fetches notes and evidence when expanded", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockNotes),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockEvidence),
        });

      renderWithClient(
        <TaskDetailPanel
          taskId="task-1"
          isExpanded={true}
          onAddNote={mockOnAddNote}
          onAddEvidence={mockOnAddEvidence}
        />
      );

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith("/api/tasks/task-1/notes", expect.any(Object));
        expect(mockFetch).toHaveBeenCalledWith("/api/tasks/task-1/evidence", expect.any(Object));
      });
    });

    it("renders notes section when loaded", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockNotes),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockEvidence),
        });

      renderWithClient(
        <TaskDetailPanel
          taskId="task-1"
          isExpanded={true}
          onAddNote={mockOnAddNote}
          onAddEvidence={mockOnAddEvidence}
        />
      );

      await waitFor(() => {
        expect(screen.getByText("Notes")).toBeInTheDocument();
        expect(screen.getByText("Test note content")).toBeInTheDocument();
      });
    });

    it("renders attachments section when loaded", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockNotes),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockEvidence),
        });

      renderWithClient(
        <TaskDetailPanel
          taskId="task-1"
          isExpanded={true}
          onAddNote={mockOnAddNote}
          onAddEvidence={mockOnAddEvidence}
        />
      );

      await waitFor(() => {
        expect(screen.getByText("Attachments")).toBeInTheDocument();
        expect(screen.getByText("test.pdf")).toBeInTheDocument();
      });
    });
  });

  describe("Loading state", () => {
    it("shows skeleton UI while loading", async () => {
      // Never resolve the fetch to keep it in loading state
      mockFetch.mockImplementation(() => new Promise(() => {}));

      renderWithClient(
        <TaskDetailPanel
          taskId="task-1"
          isExpanded={true}
          onAddNote={mockOnAddNote}
          onAddEvidence={mockOnAddEvidence}
        />
      );

      // Skeleton should be present (has animate-pulse class)
      const panel = screen.getByTestId("task-detail-panel");
      expect(panel).toBeInTheDocument();
    });
  });

  describe("Error state", () => {
    it("shows error message when fetch fails", async () => {
      mockFetch.mockRejectedValue(new Error("Network error"));

      renderWithClient(
        <TaskDetailPanel
          taskId="task-1"
          isExpanded={true}
          onAddNote={mockOnAddNote}
          onAddEvidence={mockOnAddEvidence}
        />
      );

      await waitFor(() => {
        expect(
          screen.getByText("Failed to load task details. Please try again.")
        ).toBeInTheDocument();
      });
    });

    it("shows error when API returns non-ok response", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: "Not found" }),
      });

      renderWithClient(
        <TaskDetailPanel
          taskId="task-1"
          isExpanded={true}
          onAddNote={mockOnAddNote}
          onAddEvidence={mockOnAddEvidence}
        />
      );

      await waitFor(() => {
        expect(
          screen.getByText("Failed to load task details. Please try again.")
        ).toBeInTheDocument();
      });
    });
  });

  describe("Empty state", () => {
    it("shows empty notes message when no notes", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ notes: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ evidence: [] }),
        });

      renderWithClient(
        <TaskDetailPanel
          taskId="task-1"
          isExpanded={true}
          onAddNote={mockOnAddNote}
          onAddEvidence={mockOnAddEvidence}
        />
      );

      await waitFor(() => {
        expect(
          screen.getByText("No notes yet. Add a note to track progress or share updates.")
        ).toBeInTheDocument();
      });
    });

    it("shows empty attachments message when no evidence", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ notes: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ evidence: [] }),
        });

      renderWithClient(
        <TaskDetailPanel
          taskId="task-1"
          isExpanded={true}
          onAddNote={mockOnAddNote}
          onAddEvidence={mockOnAddEvidence}
        />
      );

      await waitFor(() => {
        expect(
          screen.getByText("No attachments yet. Add evidence to support task completion.")
        ).toBeInTheDocument();
      });
    });
  });
});
