/**
 * Unit tests for AnalysisReview component
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  AnalysisReview,
  AnalysisResult,
  ReviewFormData,
} from "@/components/documents/analysis-review";

const mockAnalysis: AnalysisResult = {
  suggestedTitle: "Contract for Sale",
  documentType: "contract",
  documentDate: "2024-01-15",
  parties: [
    { name: "John Doe", role: "Buyer" },
    { name: "Jane Smith", role: "Seller" },
  ],
  keyDates: [{ label: "Completion Date", date: "2024-02-15" }],
  summary: "A contract for the sale of property.",
  confidence: 92,
  confidenceLevel: "green",
};

const mockFormData: ReviewFormData = {
  title: "Contract for Sale",
  type: "contract",
  documentDate: "2024-01-15",
  summary: "A contract for the sale of property.",
};

describe("AnalysisReview", () => {
  it("renders confidence badge", () => {
    render(
      <AnalysisReview analysis={mockAnalysis} formData={mockFormData} onFormChange={vi.fn()} />
    );

    expect(screen.getByText("92%")).toBeInTheDocument();
    expect(screen.getByText("AI Confidence")).toBeInTheDocument();
  });

  it("renders form with pre-filled values", () => {
    render(
      <AnalysisReview analysis={mockAnalysis} formData={mockFormData} onFormChange={vi.fn()} />
    );

    const titleInput = screen.getByLabelText(/Document Title/i);
    expect(titleInput).toHaveValue("Contract for Sale");

    const dateInput = screen.getByLabelText(/Document Date/i);
    expect(dateInput).toHaveValue("2024-01-15");
  });

  it("calls onFormChange when title is edited", () => {
    const onFormChange = vi.fn();
    render(
      <AnalysisReview analysis={mockAnalysis} formData={mockFormData} onFormChange={onFormChange} />
    );

    const titleInput = screen.getByLabelText(/Document Title/i);
    fireEvent.change(titleInput, { target: { value: "New Title" } });

    expect(onFormChange).toHaveBeenCalledWith({
      ...mockFormData,
      title: "New Title",
    });
  });

  it("renders extracted parties", () => {
    render(
      <AnalysisReview analysis={mockAnalysis} formData={mockFormData} onFormChange={vi.fn()} />
    );

    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("Buyer")).toBeInTheDocument();
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    expect(screen.getByText("Seller")).toBeInTheDocument();
  });

  it("renders key dates", () => {
    render(
      <AnalysisReview analysis={mockAnalysis} formData={mockFormData} onFormChange={vi.fn()} />
    );

    expect(screen.getByText("Completion Date")).toBeInTheDocument();
    expect(screen.getByText("2024-02-15")).toBeInTheDocument();
  });

  it("toggles summary visibility", () => {
    render(
      <AnalysisReview analysis={mockAnalysis} formData={mockFormData} onFormChange={vi.fn()} />
    );

    // Summary should be hidden by default
    expect(screen.queryByRole("textbox", { name: /summary/i })).not.toBeInTheDocument();

    // Click to expand
    const summaryButton = screen.getByRole("button", { name: /Summary/i });
    fireEvent.click(summaryButton);

    // Now summary textarea should be visible
    const textarea = screen.getByPlaceholderText(/Document summary/i);
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveValue("A contract for the sale of property.");
  });

  it("does not render parties section when empty", () => {
    const analysisNoParties = { ...mockAnalysis, parties: [] };
    render(
      <AnalysisReview analysis={analysisNoParties} formData={mockFormData} onFormChange={vi.fn()} />
    );

    expect(screen.queryByText("Extracted Parties")).not.toBeInTheDocument();
  });

  it("does not render key dates section when empty", () => {
    const analysisNoDates = { ...mockAnalysis, keyDates: [] };
    render(
      <AnalysisReview analysis={analysisNoDates} formData={mockFormData} onFormChange={vi.fn()} />
    );

    expect(screen.queryByText("Key Dates")).not.toBeInTheDocument();
  });
});
