import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useAvailability, usePublicAppointmentTypes } from "@/lib/hooks/use-availability";

// Mock fetch
global.fetch = vi.fn();

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("useAvailability", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch available slots successfully", async () => {
    const mockResponse = {
      slots: [
        {
          startAt: "2025-01-15T09:00:00Z",
          endAt: "2025-01-15T09:30:00Z",
          appointmentTypeId: "type-1",
          assignedTo: null,
        },
        {
          startAt: "2025-01-15T10:00:00Z",
          endAt: "2025-01-15T10:30:00Z",
          appointmentTypeId: "type-1",
          assignedTo: null,
        },
      ],
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const { result } = renderHook(
      () =>
        useAvailability({
          firmSlug: "firm-123",
          appointmentTypeId: "type-1",
          startDate: "2025-01-15T00:00:00Z",
          endDate: "2025-01-16T00:00:00Z",
        }),
      {
        wrapper: createWrapper(),
      }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.slots).toHaveLength(2);
    expect(result.current.slots[0].startAt).toBe("2025-01-15T09:00:00Z");
  });

  it("should not fetch when disabled", async () => {
    const { result } = renderHook(
      () =>
        useAvailability({
          firmSlug: "firm-123",
          appointmentTypeId: "type-1",
          startDate: "2025-01-15T00:00:00Z",
          endDate: "2025-01-16T00:00:00Z",
          enabled: false,
        }),
      {
        wrapper: createWrapper(),
      }
    );

    expect(fetch).not.toHaveBeenCalled();
    expect(result.current.slots).toHaveLength(0);
  });

  it("should handle fetch errors", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 404,
    } as Response);

    const { result } = renderHook(
      () =>
        useAvailability({
          firmSlug: "firm-123",
          appointmentTypeId: "type-1",
          startDate: "2025-01-15T00:00:00Z",
          endDate: "2025-01-16T00:00:00Z",
        }),
      {
        wrapper: createWrapper(),
      }
    );

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.slots).toHaveLength(0);
  });
});

describe("usePublicAppointmentTypes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch public appointment types successfully", async () => {
    const mockResponse = {
      appointmentTypes: [
        {
          id: "type-1",
          name: "Initial Consultation",
          duration: 30,
          practiceArea: "conveyancing",
        },
      ],
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const { result } = renderHook(
      () =>
        usePublicAppointmentTypes({
          firmSlug: "firm-123",
        }),
      {
        wrapper: createWrapper(),
      }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.appointmentTypes).toHaveLength(1);
    expect(result.current.appointmentTypes[0].name).toBe("Initial Consultation");
  });

  it("should not fetch when disabled", async () => {
    const { result } = renderHook(
      () =>
        usePublicAppointmentTypes({
          firmSlug: "firm-123",
          enabled: false,
        }),
      {
        wrapper: createWrapper(),
      }
    );

    expect(fetch).not.toHaveBeenCalled();
    expect(result.current.appointmentTypes).toHaveLength(0);
  });
});
