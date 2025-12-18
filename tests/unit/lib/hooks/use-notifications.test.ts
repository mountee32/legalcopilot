import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";
import {
  useNotifications,
  useUnreadCount,
  useMarkRead,
  useMarkAllRead,
} from "@/lib/hooks/use-notifications";

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockNotificationsResponse = {
  notifications: [
    {
      id: "notif-1",
      type: "task_assigned",
      title: "New task assigned",
      body: "You have been assigned a task",
      read: false,
      link: "/tasks/1",
      createdAt: "2024-12-18T10:00:00Z",
    },
    {
      id: "notif-2",
      type: "email_received",
      title: "New email",
      body: "You received a new email",
      read: false,
      link: "/emails/1",
      createdAt: "2024-12-18T09:00:00Z",
    },
  ],
  pagination: {
    total: 5,
    page: 1,
    limit: 10,
    totalPages: 1,
  },
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

describe("useNotifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockImplementation((url: string) => {
      if (url.includes("/api/notifications")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockNotificationsResponse),
        });
      }
      return Promise.resolve({
        ok: false,
        status: 404,
      });
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches notifications with default options", async () => {
    const { result } = renderHook(() => useNotifications(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/notifications?limit=10&page=1"),
      expect.objectContaining({
        credentials: "include",
      })
    );
    expect(result.current.notifications).toHaveLength(2);
    expect(result.current.pagination?.total).toBe(5);
  });

  it("fetches notifications with custom options", async () => {
    const { result } = renderHook(
      () => useNotifications({ limit: 5, page: 2, read: false, type: "task_assigned" }),
      {
        wrapper: createWrapper(),
      }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("limit=5"), expect.any(Object));
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("page=2"), expect.any(Object));
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("read=false"),
      expect.any(Object)
    );
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("type=task_assigned"),
      expect.any(Object)
    );
  });

  it("returns loading state initially", () => {
    const { result } = renderHook(() => useNotifications(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
  });

  it("handles API errors gracefully", async () => {
    mockFetch.mockImplementation(() =>
      Promise.resolve({
        ok: false,
        status: 500,
      })
    );

    const { result } = renderHook(() => useNotifications(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isError).toBe(true);
    expect(result.current.notifications).toEqual([]);
  });
});

describe("useUnreadCount", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockNotificationsResponse),
      })
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches unread count", async () => {
    const { result } = renderHook(() => useUnreadCount(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current).toBe(5);
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("read=false"),
      expect.any(Object)
    );
  });

  it("returns 0 when no data", () => {
    const { result } = renderHook(() => useUnreadCount(), {
      wrapper: createWrapper(),
    });

    expect(result.current).toBe(0);
  });
});

describe("useMarkRead", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockImplementation((url: string, options: any) => {
      if (options?.method === "POST" && url.includes("/read")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockNotificationsResponse),
      });
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("marks notification as read", async () => {
    const { result } = renderHook(() => useMarkRead(), {
      wrapper: createWrapper(),
    });

    result.current.mutate("notif-1");

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/notifications/notif-1/read"),
      expect.objectContaining({
        method: "POST",
        credentials: "include",
      })
    );
  });

  it("handles mark read errors", async () => {
    mockFetch.mockImplementation(() =>
      Promise.resolve({
        ok: false,
        status: 500,
      })
    );

    const { result } = renderHook(() => useMarkRead(), {
      wrapper: createWrapper(),
    });

    result.current.mutate("notif-1");

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});

describe("useMarkAllRead", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockImplementation((url: string, options: any) => {
      if (options?.method === "POST" && url.includes("/read-all")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockNotificationsResponse),
      });
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("marks all notifications as read", async () => {
    const { result } = renderHook(() => useMarkAllRead(), {
      wrapper: createWrapper(),
    });

    result.current.mutate();

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/notifications/read-all"),
      expect.objectContaining({
        method: "POST",
        credentials: "include",
      })
    );
  });

  it("handles mark all read errors", async () => {
    mockFetch.mockImplementation(() =>
      Promise.resolve({
        ok: false,
        status: 500,
      })
    );

    const { result } = renderHook(() => useMarkAllRead(), {
      wrapper: createWrapper(),
    });

    result.current.mutate();

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});
