import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EmptyState } from "@/components/ui/empty-state";
import { Inbox } from "lucide-react";

describe("EmptyState", () => {
  it("renders with title only", () => {
    render(<EmptyState title="No items found" />);

    expect(screen.getByTestId("empty-state")).toBeInTheDocument();
    expect(screen.getByText("No items found")).toBeInTheDocument();
  });

  it("renders with title and description", () => {
    render(
      <EmptyState title="No items found" description="Try adding some items to get started." />
    );

    expect(screen.getByText("No items found")).toBeInTheDocument();
    expect(screen.getByText("Try adding some items to get started.")).toBeInTheDocument();
  });

  it("renders with icon", () => {
    render(<EmptyState title="No inbox items" icon={Inbox} />);

    expect(screen.getByTestId("empty-state")).toBeInTheDocument();
    // Icon should be rendered (SVG element)
    const container = screen.getByTestId("empty-state");
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("renders with action button", () => {
    render(<EmptyState title="No items found" action={<button>Add item</button>} />);

    expect(screen.getByRole("button", { name: /add item/i })).toBeInTheDocument();
  });

  it("applies custom className", () => {
    render(<EmptyState title="No items found" className="custom-class" />);

    expect(screen.getByTestId("empty-state")).toHaveClass("custom-class");
  });
});
