/**
 * Unit tests for DocumentMetadataEditor component
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  DocumentMetadataEditor,
  type DocumentMetadata,
} from "@/components/documents/document-metadata-editor";

describe("DocumentMetadataEditor", () => {
  const defaultData: DocumentMetadata = {
    title: "Test Document",
    type: "contract",
    documentDate: "2024-01-15",
    aiSummary: "This is a test summary",
    extractedParties: [
      { name: "John Doe", role: "Buyer" },
      { name: "Jane Smith", role: "Seller" },
    ],
    extractedDates: [{ label: "Signing Date", date: "2024-01-20" }],
  };

  it("should render with initial data", () => {
    const onChange = vi.fn();
    render(<DocumentMetadataEditor data={defaultData} onChange={onChange} />);

    expect(screen.getByDisplayValue("Test Document")).toBeInTheDocument();
    expect(screen.getByDisplayValue("2024-01-15")).toBeInTheDocument();
    expect(screen.getByDisplayValue("This is a test summary")).toBeInTheDocument();
  });

  it("should display extracted parties", () => {
    const onChange = vi.fn();
    render(<DocumentMetadataEditor data={defaultData} onChange={onChange} />);

    expect(screen.getByDisplayValue("John Doe")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Buyer")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Jane Smith")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Seller")).toBeInTheDocument();
  });

  it("should display extracted dates", () => {
    const onChange = vi.fn();
    render(<DocumentMetadataEditor data={defaultData} onChange={onChange} />);

    expect(screen.getByDisplayValue("Signing Date")).toBeInTheDocument();
    expect(screen.getByDisplayValue("2024-01-20")).toBeInTheDocument();
  });

  it("should call onChange when title is updated", () => {
    const onChange = vi.fn();
    render(<DocumentMetadataEditor data={defaultData} onChange={onChange} />);

    const titleInput = screen.getByDisplayValue("Test Document");
    fireEvent.change(titleInput, { target: { value: "New Title" } });

    expect(onChange).toHaveBeenCalled();
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];
    expect(lastCall.title).toBe("New Title");
  });

  it("should call onChange when summary is updated", () => {
    const onChange = vi.fn();
    render(<DocumentMetadataEditor data={defaultData} onChange={onChange} />);

    const summaryInput = screen.getByDisplayValue("This is a test summary");
    fireEvent.change(summaryInput, { target: { value: "Updated summary" } });

    expect(onChange).toHaveBeenCalled();
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];
    expect(lastCall.aiSummary).toBe("Updated summary");
  });

  it("should add a new party when Add Party is clicked", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<DocumentMetadataEditor data={defaultData} onChange={onChange} />);

    const addButton = screen.getByRole("button", { name: /add party/i });
    await user.click(addButton);

    expect(onChange).toHaveBeenCalled();
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];
    expect(lastCall.extractedParties).toHaveLength(3);
    expect(lastCall.extractedParties[2]).toEqual({ name: "", role: "" });
  });

  it("should remove a party when delete is clicked", () => {
    const onChange = vi.fn();
    render(<DocumentMetadataEditor data={defaultData} onChange={onChange} />);

    // Find all delete buttons (trash icons) - there are 2 for parties and 1 for dates = 3 total
    // The first 2 are for parties
    const allButtons = screen.getAllByRole("button");
    const deleteButtons = allButtons.filter(
      (btn) => btn.querySelector('[class*="lucide-trash"]') !== null
    );

    // Click the first party's delete button
    fireEvent.click(deleteButtons[0]);

    expect(onChange).toHaveBeenCalled();
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];
    expect(lastCall.extractedParties).toHaveLength(1);
    expect(lastCall.extractedParties[0].name).toBe("Jane Smith");
  });

  it("should add a new date when Add Date is clicked", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<DocumentMetadataEditor data={defaultData} onChange={onChange} />);

    const addButton = screen.getByRole("button", { name: /add date/i });
    await user.click(addButton);

    expect(onChange).toHaveBeenCalled();
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];
    expect(lastCall.extractedDates).toHaveLength(2);
    expect(lastCall.extractedDates[1]).toEqual({ label: "", date: "" });
  });

  it("should update party name when edited", () => {
    const onChange = vi.fn();
    render(<DocumentMetadataEditor data={defaultData} onChange={onChange} />);

    const nameInput = screen.getByDisplayValue("John Doe");
    fireEvent.change(nameInput, { target: { value: "Robert Brown" } });

    expect(onChange).toHaveBeenCalled();
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];
    expect(lastCall.extractedParties[0].name).toBe("Robert Brown");
  });

  it("should update party role when edited", () => {
    const onChange = vi.fn();
    render(<DocumentMetadataEditor data={defaultData} onChange={onChange} />);

    const roleInput = screen.getByDisplayValue("Buyer");
    fireEvent.change(roleInput, { target: { value: "Tenant" } });

    expect(onChange).toHaveBeenCalled();
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];
    expect(lastCall.extractedParties[0].role).toBe("Tenant");
  });

  it("should show empty state for parties when none exist", () => {
    const onChange = vi.fn();
    const dataWithNoParties = { ...defaultData, extractedParties: [] };
    render(<DocumentMetadataEditor data={dataWithNoParties} onChange={onChange} />);

    expect(screen.getByText(/no parties extracted/i)).toBeInTheDocument();
  });

  it("should show empty state for dates when none exist", () => {
    const onChange = vi.fn();
    const dataWithNoDates = { ...defaultData, extractedDates: [] };
    render(<DocumentMetadataEditor data={dataWithNoDates} onChange={onChange} />);

    expect(screen.getByText(/no dates extracted/i)).toBeInTheDocument();
  });
});
