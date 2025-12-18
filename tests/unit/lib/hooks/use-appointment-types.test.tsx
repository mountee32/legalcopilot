import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import {
  useAppointmentTypes,
  useCreateAppointmentType,
  useDeleteAppointmentType,
} from "@/lib/hooks/use-appointment-types";

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

describe("useAppointmentTypes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch appointment types successfully", async () => {
    const mockResponse = {
      appointmentTypes: [
        {
          id: "type-1",
          name: "Initial Consultation",
          description: "First meeting",
          duration: 30,
          isActive: true,
        },
      ],
      pagination: { total: 1, page: 1, limit: 50, totalPages: 1 },
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const { result } = renderHook(() => useAppointmentTypes(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.appointmentTypes).toHaveLength(1);
    expect(result.current.appointmentTypes[0].name).toBe("Initial Consultation");
  });

  it("should handle fetch errors", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as Response);

    const { result } = renderHook(() => useAppointmentTypes(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.appointmentTypes).toHaveLength(0);
  });
});

describe("useCreateAppointmentType", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create appointment type successfully", async () => {
    const mockType = {
      id: "new-type",
      name: "Follow-up Consultation",
      duration: 15,
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockType,
    } as Response);

    const { result } = renderHook(() => useCreateAppointmentType(), {
      wrapper: createWrapper(),
    });

    let createdType;
    await waitFor(async () => {
      createdType = await result.current.mutateAsync({
        name: "Follow-up Consultation",
        duration: 15,
      });
    });

    expect(createdType).toEqual(mockType);
    expect(fetch).toHaveBeenCalledWith(
      "/api/booking/appointment-types",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
    );
  });

  it("should handle creation errors", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 400,
    } as Response);

    const { result } = renderHook(() => useCreateAppointmentType(), {
      wrapper: createWrapper(),
    });

    await expect(
      result.current.mutateAsync({
        name: "Test",
        duration: 30,
      })
    ).rejects.toThrow();
  });
});

describe("useDeleteAppointmentType", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should delete appointment type successfully", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    } as Response);

    const { result } = renderHook(() => useDeleteAppointmentType(), {
      wrapper: createWrapper(),
    });

    await waitFor(async () => {
      await result.current.mutateAsync("type-1");
    });

    expect(fetch).toHaveBeenCalledWith(
      "/api/booking/appointment-types/type-1",
      expect.objectContaining({
        method: "DELETE",
      })
    );
  });
});
