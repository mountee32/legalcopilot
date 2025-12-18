import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Command } from "cmdk";
import { SearchResults } from "@/components/search/search-results";
import type {
  MatterSearchResult,
  ClientSearchResult,
  DocumentSearchResult,
} from "@/lib/hooks/use-global-search";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Wrapper component to provide Command context
function CommandWrapper({ children }: { children: React.ReactNode }) {
  return <Command>{children}</Command>;
}

const mockMatters: MatterSearchResult[] = [
  {
    id: "matter-1",
    reference: "CONV-2024-042",
    title: "Property Purchase",
    clientName: "John Smith",
    stage: "active",
    practiceArea: "conveyancing",
    snippet: "Residential property purchase...",
  },
];

const mockClients: ClientSearchResult[] = [
  {
    id: "client-1",
    name: "John Smith",
    email: "john@example.com",
    type: "individual",
    activeMatters: 2,
    snippet: "Long-standing client...",
  },
];

const mockDocuments: DocumentSearchResult[] = [
  {
    id: "doc-1",
    filename: "contract.pdf",
    matterId: "matter-1",
    matterReference: "CONV-2024-042",
    uploadedAt: "2024-12-18T10:00:00Z",
    snippet: "This contract is for...",
    score: 0.95,
  },
];

describe("SearchResults", () => {
  it("renders loading state", () => {
    render(<SearchResults isLoading={true} />, { wrapper: CommandWrapper });

    // Check for skeleton loading elements
    const skeletons = document.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renders empty state when no results", () => {
    render(<SearchResults matters={[]} clients={[]} documents={[]} />, { wrapper: CommandWrapper });

    expect(screen.getByText("No results found")).toBeInTheDocument();
    expect(screen.getByText("Try a different search term")).toBeInTheDocument();
  });

  it("renders matter results", () => {
    render(<SearchResults matters={mockMatters} />, { wrapper: CommandWrapper });

    expect(screen.getByText(/CONV-2024-042 - Property Purchase/)).toBeInTheDocument();
    expect(screen.getByText(/John Smith/)).toBeInTheDocument();
    expect(screen.getByText(/conveyancing/)).toBeInTheDocument();
    expect(screen.getByText(/active/)).toBeInTheDocument();
  });

  it("renders client results", () => {
    render(<SearchResults clients={mockClients} />, { wrapper: CommandWrapper });

    expect(screen.getByText("John Smith")).toBeInTheDocument();
    expect(screen.getByText(/john@example.com/)).toBeInTheDocument();
    expect(screen.getByText(/2 active matters/)).toBeInTheDocument();
  });

  it("renders document results", () => {
    render(<SearchResults documents={mockDocuments} />, { wrapper: CommandWrapper });

    expect(screen.getByText("contract.pdf")).toBeInTheDocument();
    expect(screen.getByText(/CONV-2024-042/)).toBeInTheDocument();
  });

  it("renders all result types together", () => {
    render(
      <SearchResults matters={mockMatters} clients={mockClients} documents={mockDocuments} />,
      { wrapper: CommandWrapper }
    );

    expect(screen.getByText("Matters")).toBeInTheDocument();
    expect(screen.getByText("Clients")).toBeInTheDocument();
    expect(screen.getByText("Documents")).toBeInTheDocument();
  });

  it("handles singular matter count in client results", () => {
    const clientWithOneMatter: ClientSearchResult[] = [
      {
        ...mockClients[0],
        activeMatters: 1,
      },
    ];

    render(<SearchResults clients={clientWithOneMatter} />, { wrapper: CommandWrapper });

    expect(screen.getByText(/1 active matter/)).toBeInTheDocument();
  });

  it("calls onSelect when result is clicked", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(<SearchResults matters={mockMatters} onSelect={onSelect} />, {
      wrapper: CommandWrapper,
    });

    const matterItem = screen.getByText(/CONV-2024-042 - Property Purchase/);
    await user.click(matterItem);

    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("renders only matters group when only matters provided", () => {
    render(<SearchResults matters={mockMatters} />, { wrapper: CommandWrapper });

    expect(screen.getByText("Matters")).toBeInTheDocument();
    expect(screen.queryByText("Clients")).not.toBeInTheDocument();
    expect(screen.queryByText("Documents")).not.toBeInTheDocument();
  });

  it("renders only clients group when only clients provided", () => {
    render(<SearchResults clients={mockClients} />, { wrapper: CommandWrapper });

    expect(screen.getByText("Clients")).toBeInTheDocument();
    expect(screen.queryByText("Matters")).not.toBeInTheDocument();
    expect(screen.queryByText("Documents")).not.toBeInTheDocument();
  });

  it("renders only documents group when only documents provided", () => {
    render(<SearchResults documents={mockDocuments} />, { wrapper: CommandWrapper });

    expect(screen.getByText("Documents")).toBeInTheDocument();
    expect(screen.queryByText("Matters")).not.toBeInTheDocument();
    expect(screen.queryByText("Clients")).not.toBeInTheDocument();
  });

  it("scrolls results when exceeding max height", () => {
    const manyMatters = Array.from({ length: 20 }, (_, i) => ({
      ...mockMatters[0],
      id: `matter-${i}`,
      reference: `CONV-2024-${i}`,
    }));

    const { container } = render(<SearchResults matters={manyMatters} />, {
      wrapper: CommandWrapper,
    });

    const scrollContainer = container.querySelector(".overflow-y-auto");
    expect(scrollContainer).toBeInTheDocument();
    expect(scrollContainer).toHaveClass("max-h-[400px]");
  });
});
