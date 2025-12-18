import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";
import { useDashboardData } from "@/lib/hooks/use-dashboard-data";

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockApprovalResponse = {
  approvals: [
    {
      id: "1",
      action: "send_email",
      summary: "Reply to John Smith",
      status: "pending",
      aiMetadata: { confidence: 94 },
      matterId: "CONV-2024-042",
      createdAt: "2024-12-18T10:00:00Z",
    },
  ],
  pagination: { total: 5 },
};

const mockTasksResponse = {
  tasks: [
    {
      id: "1",
      title: "Review contract",
      status: "pending",
      priority: "high",
      dueDate: new Date().toISOString().split("T")[0], // Today
      matterId: "CONV-2024-042",
    },
  ],
  pagination: { total: 8 },
};

const mockCalendarResponse = {
  events: [
    {
      id: "1",
      title: "Client Call",
      eventType: "meeting",
      startAt: "2024-12-18T09:00:00Z",
      matterId: "CONV-2024-042",
    },
  ],
};

const mockMattersResponse = {
  matters: [{ id: "1", status: "active" }],
  pagination: { total: 47 },
};

const mockInvoicesResponse = {
  invoices: [{ id: "1", status: "overdue", total: "1500.00" }],
  pagination: { total: 4 },
};

const mockNotificationsResponse = {
  notifications: [
    {
      id: "1",
      type: "deadline_reminder",
      title: "Deadline approaching",
      body: "CONV-2024-042",
      read: false,
      entityType: "matter",
      entityId: "123",
      createdAt: "2024-12-18T08:00:00Z",
    },
  ],
  pagination: { total: 3 },
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

describe("useDashboardData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockImplementation((url: string) => {
      if (url.includes("/api/approvals")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockApprovalResponse),
        });
      }
      if (url.includes("/api/tasks")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockTasksResponse),
        });
      }
      if (url.includes("/api/calendar")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockCalendarResponse),
        });
      }
      if (url.includes("/api/matters")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockMattersResponse),
        });
      }
      if (url.includes("/api/invoices")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockInvoicesResponse),
        });
      }
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

  it("fetches data from all endpoints", async () => {
    const { result } = renderHook(() => useDashboardData(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/approvals"),
      expect.any(Object)
    );
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/tasks"),
      expect.any(Object)
    );
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/calendar"),
      expect.any(Object)
    );
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/matters"),
      expect.any(Object)
    );
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/invoices"),
      expect.any(Object)
    );
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/notifications"),
      expect.any(Object)
    );
  });

  it("returns loading state initially", () => {
    const { result } = renderHook(() => useDashboardData(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
  });

  it("returns transformed approvals data", async () => {
    const { result } = renderHook(() => useDashboardData(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data.approvals).toHaveLength(1);
    expect(result.current.data.approvals[0]).toEqual({
      id: "1",
      action: "send_email",
      summary: "Reply to John Smith",
      confidence: 94,
      entityType: undefined,
      matterId: "CONV-2024-042",
    });
    expect(result.current.data.approvalsTotal).toBe(5);
  });

  it("returns calendar events", async () => {
    const { result } = renderHook(() => useDashboardData(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data.calendarEvents).toHaveLength(1);
    expect(result.current.data.calendarEvents[0].title).toBe("Client Call");
  });

  it("returns firm metrics", async () => {
    const { result } = renderHook(() => useDashboardData(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data.activeCases).toBe(47);
    expect(result.current.data.overdueInvoices).toBe(4);
    expect(result.current.data.wipValue).toBe(1500);
  });

  it("returns urgent items from notifications", async () => {
    const { result } = renderHook(() => useDashboardData(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data.urgentItems).toHaveLength(1);
    expect(result.current.data.urgentItems[0].type).toBe("deadline");
    expect(result.current.data.urgentItems[0].href).toBe("/matters/123");
  });

  it("handles API errors gracefully", async () => {
    mockFetch.mockImplementation(() =>
      Promise.resolve({
        ok: false,
        status: 500,
      })
    );

    const { result } = renderHook(() => useDashboardData(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isError).toBe(true);
  });
});
