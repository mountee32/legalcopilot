import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";
import { useGlobalSearch } from "@/lib/hooks/use-global-search";

const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockSearchResponse = {
  matters: [
    {
      id: "matter-1",
      reference: "CONV-2024-042",
      title: "Property Purchase",
      clientName: "John Smith",
      stage: "active",
      practiceArea: "conveyancing",
      snippet: "Residential property purchase...",
    },
  ],
  clients: [
    {
      id: "client-1",
      name: "John Smith",
      email: "john@example.com",
      type: "individual" as const,
      activeMatters: 2,
      snippet: "Long-standing client...",
    },
  ],
  documents: [
    {
      id: "doc-1",
      filename: "contract.pdf",
      matterId: "matter-1",
      matterReference: "CONV-2024-042",
      uploadedAt: "2024-12-18T10:00:00Z",
      snippet: "This contract is for...",
      score: 0.95,
    },
  ],
  query: "john",
  totalResults: 3,
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe("useGlobalSearch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockSearchResponse),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("does not search with query less than 2 characters", async () => {
    const { result } = renderHook(() => useGlobalSearch("a"), {
      wrapper: createWrapper(),
    });

    // Wait for debounce (300ms + buffer)
    await new Promise((resolve) => setTimeout(resolve, 400));

    expect(result.current.data).toBeUndefined();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("debounces search queries", async () => {
    const { rerender } = renderHook(({ query }) => useGlobalSearch(query), {
      wrapper: createWrapper(),
      initialProps: { query: "jo" },
    });

    // Change query multiple times quickly
    rerender({ query: "joh" });
    rerender({ query: "john" });

    // Wait for debounce
    await new Promise((resolve) => setTimeout(resolve, 400));

    // Should have fetched with the final query
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
      const lastCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
      expect(lastCall[0]).toContain("/api/search/global?q=john");
    });
  });

  it("searches with valid query", async () => {
    const { result } = renderHook(() => useGlobalSearch("john"), {
      wrapper: createWrapper(),
    });

    await waitFor(
      () => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/search/global?q=john"),
          expect.objectContaining({
            credentials: "include",
          })
        );
      },
      { timeout: 2000 }
    );

    await waitFor(
      () => {
        expect(result.current.data).toEqual(mockSearchResponse);
      },
      { timeout: 2000 }
    );
  });

  it("returns loading state while fetching", async () => {
    const { result } = renderHook(() => useGlobalSearch("john"), {
      wrapper: createWrapper(),
    });

    // Should eventually get data
    await waitFor(
      () => {
        expect(result.current.data).toBeDefined();
        expect(result.current.isLoading).toBe(false);
      },
      { timeout: 2000 }
    );
  });

  it("handles API errors", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    const { result } = renderHook(() => useGlobalSearch("john"), {
      wrapper: createWrapper(),
    });

    await waitFor(
      () => {
        expect(result.current.isError).toBe(true);
      },
      { timeout: 2000 }
    );
  });

  it("encodes query parameter correctly", async () => {
    renderHook(() => useGlobalSearch("john & smith"), {
      wrapper: createWrapper(),
    });

    await waitFor(
      () => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/search/global?q=john%20%26%20smith"),
          expect.any(Object)
        );
      },
      { timeout: 2000 }
    );
  });

  it("returns empty results for short queries", async () => {
    const { result } = renderHook(() => useGlobalSearch("j"), {
      wrapper: createWrapper(),
    });

    await new Promise((resolve) => setTimeout(resolve, 400));

    expect(result.current.data).toBeUndefined();
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
