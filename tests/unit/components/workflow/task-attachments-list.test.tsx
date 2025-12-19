import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  TaskAttachmentsList,
  type EvidenceAttachment,
} from "@/app/(app)/matters/[id]/_components/workflow/task-attachments-list";

const mockAttachments: EvidenceAttachment[] = [
  {
    id: "ev-1",
    type: "proof_of_funds",
    description: "Mortgage offer letter",
    documentId: "doc-1",
    documentName: "Mortgage_Offer_2024.pdf",
    addedByName: "Sarah Harrison",
    addedAt: "2024-12-14T10:00:00Z",
    verifiedAt: "2024-12-15T09:00:00Z",
  },
  {
    id: "ev-2",
    type: "source_of_wealth",
    description: "Bank statements",
    documentId: "doc-2",
    documentName: "Bank_Statement.pdf",
    addedByName: "Tom Richards",
    addedAt: "2024-12-10T14:30:00Z",
    verifiedAt: null,
  },
];

describe("TaskAttachmentsList", () => {
  const mockOnAddEvidence = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering attachments", () => {
    it("renders list of attachments", () => {
      render(
        <TaskAttachmentsList attachments={mockAttachments} onAddEvidence={mockOnAddEvidence} />
      );

      expect(screen.getByText("Mortgage_Offer_2024.pdf")).toBeInTheDocument();
      expect(screen.getByText("Bank_Statement.pdf")).toBeInTheDocument();
    });

    it("shows evidence type badge", () => {
      render(
        <TaskAttachmentsList attachments={mockAttachments} onAddEvidence={mockOnAddEvidence} />
      );

      expect(screen.getByText("Proof Of Funds")).toBeInTheDocument();
      expect(screen.getByText("Source Of Wealth")).toBeInTheDocument();
    });

    it("shows added by name and date", () => {
      render(
        <TaskAttachmentsList attachments={mockAttachments} onAddEvidence={mockOnAddEvidence} />
      );

      expect(screen.getByText(/Added by Sarah Harrison/)).toBeInTheDocument();
      expect(screen.getByText(/14 Dec 2024/)).toBeInTheDocument();
    });

    it("shows 'Unknown' when added by name is null", () => {
      const attachmentWithNullAuthor: EvidenceAttachment[] = [
        { ...mockAttachments[0], addedByName: null },
      ];
      render(
        <TaskAttachmentsList
          attachments={attachmentWithNullAuthor}
          onAddEvidence={mockOnAddEvidence}
        />
      );

      expect(screen.getByText(/Added by Unknown/)).toBeInTheDocument();
    });

    it("falls back to description when document name is null", () => {
      const attachmentWithNullDocName: EvidenceAttachment[] = [
        { ...mockAttachments[0], documentName: null },
      ];
      render(
        <TaskAttachmentsList
          attachments={attachmentWithNullDocName}
          onAddEvidence={mockOnAddEvidence}
        />
      );

      expect(screen.getByText("Mortgage offer letter")).toBeInTheDocument();
    });
  });

  describe("Verification status", () => {
    it("shows 'Verified' for verified evidence", () => {
      render(
        <TaskAttachmentsList attachments={[mockAttachments[0]]} onAddEvidence={mockOnAddEvidence} />
      );

      expect(screen.getByText("Verified")).toBeInTheDocument();
    });

    it("shows 'Pending' for unverified evidence", () => {
      render(
        <TaskAttachmentsList attachments={[mockAttachments[1]]} onAddEvidence={mockOnAddEvidence} />
      );

      expect(screen.getByText("Pending")).toBeInTheDocument();
    });
  });

  describe("Download button", () => {
    it("renders download link when documentId is present", () => {
      render(
        <TaskAttachmentsList attachments={[mockAttachments[0]]} onAddEvidence={mockOnAddEvidence} />
      );

      const downloadLink = screen.getByRole("link", { name: /Download/i });
      expect(downloadLink).toBeInTheDocument();
      expect(downloadLink).toHaveAttribute("href", "/api/documents/doc-1/download");
    });

    it("does not render download link when documentId is null", () => {
      const attachmentWithNoDoc: EvidenceAttachment[] = [
        { ...mockAttachments[0], documentId: null },
      ];
      render(
        <TaskAttachmentsList attachments={attachmentWithNoDoc} onAddEvidence={mockOnAddEvidence} />
      );

      expect(screen.queryByRole("link", { name: /Download/i })).not.toBeInTheDocument();
    });
  });

  describe("Empty state", () => {
    it("shows empty state message when no attachments", () => {
      render(<TaskAttachmentsList attachments={[]} onAddEvidence={mockOnAddEvidence} />);

      expect(
        screen.getByText("No attachments yet. Add evidence to support task completion.")
      ).toBeInTheDocument();
    });

    it("does not show attachments container when empty", () => {
      render(<TaskAttachmentsList attachments={[]} onAddEvidence={mockOnAddEvidence} />);

      expect(screen.queryByText("Mortgage_Offer_2024.pdf")).not.toBeInTheDocument();
    });
  });

  describe("Add Evidence button", () => {
    it("renders Add Evidence button", () => {
      render(
        <TaskAttachmentsList attachments={mockAttachments} onAddEvidence={mockOnAddEvidence} />
      );

      expect(screen.getByRole("button", { name: /Add Evidence/i })).toBeInTheDocument();
    });

    it("calls onAddEvidence when button is clicked", () => {
      render(
        <TaskAttachmentsList attachments={mockAttachments} onAddEvidence={mockOnAddEvidence} />
      );

      fireEvent.click(screen.getByRole("button", { name: /Add Evidence/i }));

      expect(mockOnAddEvidence).toHaveBeenCalledTimes(1);
    });

    it("shows Add Evidence button in empty state", () => {
      render(<TaskAttachmentsList attachments={[]} onAddEvidence={mockOnAddEvidence} />);

      expect(screen.getByRole("button", { name: /Add Evidence/i })).toBeInTheDocument();
    });
  });

  describe("Section header", () => {
    it("renders Attachments header", () => {
      render(
        <TaskAttachmentsList attachments={mockAttachments} onAddEvidence={mockOnAddEvidence} />
      );

      expect(screen.getByText("Attachments")).toBeInTheDocument();
    });
  });
});
