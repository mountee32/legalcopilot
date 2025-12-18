import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SearchItem } from "@/components/search/search-item";

describe("SearchItem", () => {
  it("renders matter item correctly", () => {
    render(<SearchItem type="matter" label="CONV-2024-042" sublabel="Property Purchase" />);

    expect(screen.getByText("CONV-2024-042")).toBeInTheDocument();
    expect(screen.getByText("Property Purchase")).toBeInTheDocument();
  });

  it("renders client item correctly", () => {
    render(
      <SearchItem
        type="client"
        label="John Smith"
        sublabel="john@example.com"
        snippet="Long-standing client..."
      />
    );

    expect(screen.getByText("John Smith")).toBeInTheDocument();
    expect(screen.getByText("john@example.com")).toBeInTheDocument();
    expect(screen.getByText("Long-standing client...")).toBeInTheDocument();
  });

  it("renders document item correctly", () => {
    render(<SearchItem type="document" label="contract.pdf" sublabel="CONV-2024-042" />);

    expect(screen.getByText("contract.pdf")).toBeInTheDocument();
    expect(screen.getByText("CONV-2024-042")).toBeInTheDocument();
  });

  it("renders without sublabel", () => {
    render(<SearchItem type="matter" label="CONV-2024-042" />);

    expect(screen.getByText("CONV-2024-042")).toBeInTheDocument();
    expect(screen.queryByText("Property Purchase")).not.toBeInTheDocument();
  });

  it("renders without snippet", () => {
    render(<SearchItem type="matter" label="CONV-2024-042" sublabel="Property Purchase" />);

    expect(screen.getByText("CONV-2024-042")).toBeInTheDocument();
    expect(screen.getByText("Property Purchase")).toBeInTheDocument();
  });

  it("calls onSelect when clicked", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(<SearchItem type="matter" label="CONV-2024-042" onSelect={onSelect} />);

    const item = screen.getByText("CONV-2024-042").closest("div");
    expect(item).toBeInTheDocument();

    if (item) {
      await user.click(item);
      expect(onSelect).toHaveBeenCalledTimes(1);
    }
  });

  it("displays correct icon for matter type", () => {
    const { container } = render(<SearchItem type="matter" label="Test" />);

    // Check for blue color class (matter color)
    expect(container.querySelector(".text-blue-600")).toBeInTheDocument();
  });

  it("displays correct icon for client type", () => {
    const { container } = render(<SearchItem type="client" label="Test" />);

    // Check for green color class (client color)
    expect(container.querySelector(".text-green-600")).toBeInTheDocument();
  });

  it("displays correct icon for document type", () => {
    const { container } = render(<SearchItem type="document" label="Test" />);

    // Check for orange color class (document color)
    expect(container.querySelector(".text-orange-600")).toBeInTheDocument();
  });

  it("truncates long snippets", () => {
    const longSnippet =
      "This is a very long snippet that should be truncated to two lines maximum using the line-clamp-2 class";

    const { container } = render(<SearchItem type="matter" label="Test" snippet={longSnippet} />);

    const snippetElement = screen.getByText(longSnippet);
    expect(snippetElement).toHaveClass("line-clamp-2");
  });
});
