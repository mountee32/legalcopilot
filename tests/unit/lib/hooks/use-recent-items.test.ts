import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useRecentItems, type RecentItem } from "@/lib/hooks/use-recent-items";

const STORAGE_KEY = "legal-copilot-recent-items";

describe("useRecentItems", () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("initializes with empty array when no stored items", () => {
    const { result } = renderHook(() => useRecentItems());

    expect(result.current.items).toEqual([]);
  });

  it("loads items from localStorage on mount", () => {
    const storedItems: RecentItem[] = [
      {
        type: "matter",
        id: "1",
        label: "CONV-2024-042",
        sublabel: "Property Purchase",
        href: "/matters/1",
      },
    ];

    localStorage.setItem(STORAGE_KEY, JSON.stringify(storedItems));

    const { result } = renderHook(() => useRecentItems());

    expect(result.current.items).toEqual(storedItems);
  });

  it("adds a recent item to the list", () => {
    const { result } = renderHook(() => useRecentItems());

    const newItem: RecentItem = {
      type: "matter",
      id: "1",
      label: "CONV-2024-042",
      sublabel: "Property Purchase",
      href: "/matters/1",
    };

    act(() => {
      result.current.addRecentItem(newItem);
    });

    expect(result.current.items).toEqual([newItem]);
    expect(localStorage.getItem(STORAGE_KEY)).toBe(JSON.stringify([newItem]));
  });

  it("adds new item to the front of the list", () => {
    const { result } = renderHook(() => useRecentItems());

    const item1: RecentItem = {
      type: "matter",
      id: "1",
      label: "CONV-2024-042",
      href: "/matters/1",
    };

    const item2: RecentItem = {
      type: "client",
      id: "2",
      label: "John Smith",
      href: "/clients/2",
    };

    act(() => {
      result.current.addRecentItem(item1);
      result.current.addRecentItem(item2);
    });

    expect(result.current.items[0]).toEqual(item2);
    expect(result.current.items[1]).toEqual(item1);
  });

  it("removes duplicate items when adding", () => {
    const { result } = renderHook(() => useRecentItems());

    const item: RecentItem = {
      type: "matter",
      id: "1",
      label: "CONV-2024-042",
      href: "/matters/1",
    };

    const otherItem: RecentItem = {
      type: "client",
      id: "2",
      label: "John Smith",
      href: "/clients/2",
    };

    act(() => {
      result.current.addRecentItem(item);
      result.current.addRecentItem(otherItem);
      result.current.addRecentItem(item); // Add same item again
    });

    expect(result.current.items).toHaveLength(2);
    expect(result.current.items[0]).toEqual(item); // Should be at front
    expect(result.current.items[1]).toEqual(otherItem);
  });

  it("limits items to maximum of 10", () => {
    const { result } = renderHook(() => useRecentItems());

    // Add 12 items
    act(() => {
      for (let i = 1; i <= 12; i++) {
        result.current.addRecentItem({
          type: "matter",
          id: String(i),
          label: `Matter ${i}`,
          href: `/matters/${i}`,
        });
      }
    });

    expect(result.current.items).toHaveLength(10);
    expect(result.current.items[0].id).toBe("12"); // Most recent
    expect(result.current.items[9].id).toBe("3"); // 10th item
  });

  it("distinguishes items by type and id", () => {
    const { result } = renderHook(() => useRecentItems());

    const matterItem: RecentItem = {
      type: "matter",
      id: "1",
      label: "Matter 1",
      href: "/matters/1",
    };

    const clientItem: RecentItem = {
      type: "client",
      id: "1", // Same ID but different type
      label: "Client 1",
      href: "/clients/1",
    };

    act(() => {
      result.current.addRecentItem(matterItem);
      result.current.addRecentItem(clientItem);
    });

    expect(result.current.items).toHaveLength(2);
    expect(result.current.items.find((i) => i.type === "matter")).toBeDefined();
    expect(result.current.items.find((i) => i.type === "client")).toBeDefined();
  });

  it("clears all recent items", () => {
    const { result } = renderHook(() => useRecentItems());

    const item: RecentItem = {
      type: "matter",
      id: "1",
      label: "CONV-2024-042",
      href: "/matters/1",
    };

    act(() => {
      result.current.addRecentItem(item);
    });

    expect(result.current.items).toHaveLength(1);

    act(() => {
      result.current.clearRecentItems();
    });

    expect(result.current.items).toEqual([]);
    expect(localStorage.getItem(STORAGE_KEY)).toBe("[]");
  });

  it("handles corrupted localStorage data gracefully", () => {
    localStorage.setItem(STORAGE_KEY, "invalid json");

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { result } = renderHook(() => useRecentItems());

    expect(result.current.items).toEqual([]);
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it("persists items across hook instances", () => {
    const item: RecentItem = {
      type: "matter",
      id: "1",
      label: "CONV-2024-042",
      href: "/matters/1",
    };

    // First hook instance
    const { result: result1 } = renderHook(() => useRecentItems());

    act(() => {
      result1.current.addRecentItem(item);
    });

    // Second hook instance
    const { result: result2 } = renderHook(() => useRecentItems());

    expect(result2.current.items).toEqual([item]);
  });
});
