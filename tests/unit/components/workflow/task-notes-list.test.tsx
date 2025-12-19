import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  TaskNotesList,
  type TaskNote,
} from "@/app/(app)/matters/[id]/_components/workflow/task-notes-list";

const mockNotes: TaskNote[] = [
  {
    id: "note-1",
    content: "Client confirmed funds in place",
    visibility: "internal",
    authorName: "Sarah Harrison",
    createdAt: "2024-12-15T10:00:00Z",
  },
  {
    id: "note-2",
    content: "Waiting for mortgage offer letter",
    visibility: "client_visible",
    authorName: "James Clarke",
    createdAt: "2024-12-12T14:30:00Z",
  },
];

describe("TaskNotesList", () => {
  const mockOnAddNote = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering notes", () => {
    it("renders list of notes", () => {
      render(<TaskNotesList notes={mockNotes} onAddNote={mockOnAddNote} />);

      expect(screen.getByText("Client confirmed funds in place")).toBeInTheDocument();
      expect(screen.getByText("Waiting for mortgage offer letter")).toBeInTheDocument();
    });

    it("shows author name for each note", () => {
      render(<TaskNotesList notes={mockNotes} onAddNote={mockOnAddNote} />);

      expect(screen.getByText("Sarah Harrison")).toBeInTheDocument();
      expect(screen.getByText("James Clarke")).toBeInTheDocument();
    });

    it("shows formatted date for each note", () => {
      render(<TaskNotesList notes={mockNotes} onAddNote={mockOnAddNote} />);

      expect(screen.getByText("15 Dec 2024")).toBeInTheDocument();
      expect(screen.getByText("12 Dec 2024")).toBeInTheDocument();
    });

    it("shows 'Unknown' when author name is null", () => {
      const noteWithNullAuthor: TaskNote[] = [{ ...mockNotes[0], authorName: null }];
      render(<TaskNotesList notes={noteWithNullAuthor} onAddNote={mockOnAddNote} />);

      expect(screen.getByText("Unknown")).toBeInTheDocument();
    });
  });

  describe("Visibility badges", () => {
    it("shows 'Internal' badge for internal visibility", () => {
      render(<TaskNotesList notes={[mockNotes[0]]} onAddNote={mockOnAddNote} />);

      expect(screen.getByText("Internal")).toBeInTheDocument();
    });

    it("shows 'Client Visible' badge for client_visible visibility", () => {
      render(<TaskNotesList notes={[mockNotes[1]]} onAddNote={mockOnAddNote} />);

      expect(screen.getByText("Client Visible")).toBeInTheDocument();
    });
  });

  describe("Empty state", () => {
    it("shows empty state message when no notes", () => {
      render(<TaskNotesList notes={[]} onAddNote={mockOnAddNote} />);

      expect(
        screen.getByText("No notes yet. Add a note to track progress or share updates.")
      ).toBeInTheDocument();
    });

    it("does not show notes container when empty", () => {
      render(<TaskNotesList notes={[]} onAddNote={mockOnAddNote} />);

      expect(screen.queryByText("Client confirmed funds in place")).not.toBeInTheDocument();
    });
  });

  describe("Add Note button", () => {
    it("renders Add Note button", () => {
      render(<TaskNotesList notes={mockNotes} onAddNote={mockOnAddNote} />);

      expect(screen.getByRole("button", { name: /Add Note/i })).toBeInTheDocument();
    });

    it("calls onAddNote when button is clicked", () => {
      render(<TaskNotesList notes={mockNotes} onAddNote={mockOnAddNote} />);

      fireEvent.click(screen.getByRole("button", { name: /Add Note/i }));

      expect(mockOnAddNote).toHaveBeenCalledTimes(1);
    });

    it("shows Add Note button in empty state", () => {
      render(<TaskNotesList notes={[]} onAddNote={mockOnAddNote} />);

      expect(screen.getByRole("button", { name: /Add Note/i })).toBeInTheDocument();
    });
  });

  describe("Section header", () => {
    it("renders Notes header", () => {
      render(<TaskNotesList notes={mockNotes} onAddNote={mockOnAddNote} />);

      expect(screen.getByText("Notes")).toBeInTheDocument();
    });
  });
});
