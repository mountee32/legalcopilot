import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useCreateBooking } from "@/lib/hooks/use-create-booking";

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

describe("useCreateBooking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create booking successfully", async () => {
    const mockResponse = {
      success: true,
      bookingId: "booking-123",
      message: "Booking created successfully",
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const { result } = renderHook(() => useCreateBooking("firm-123"), {
      wrapper: createWrapper(),
    });

    let booking;
    await waitFor(async () => {
      booking = await result.current.mutateAsync({
        appointmentTypeId: "type-1",
        startAt: "2025-01-15T09:00:00Z",
        clientName: "John Smith",
        clientEmail: "john@example.com",
        clientPhone: "+44 20 1234 5678",
        notes: "Looking for advice on conveyancing",
      });
    });

    expect(booking).toEqual(mockResponse);
    expect(fetch).toHaveBeenCalledWith(
      "/api/public/booking/firms/firm-123/bookings",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
    );
  });

  it("should handle booking errors with custom message", async () => {
    const errorResponse = {
      error: "Time slot not available",
      message: "This time slot is already booked",
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 409,
      json: async () => errorResponse,
    } as Response);

    const { result } = renderHook(() => useCreateBooking("firm-123"), {
      wrapper: createWrapper(),
    });

    await expect(
      result.current.mutateAsync({
        appointmentTypeId: "type-1",
        startAt: "2025-01-15T09:00:00Z",
        clientName: "John Smith",
        clientEmail: "john@example.com",
      })
    ).rejects.toThrow("This time slot is already booked");
  });

  it("should handle generic errors", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({}),
    } as Response);

    const { result } = renderHook(() => useCreateBooking("firm-123"), {
      wrapper: createWrapper(),
    });

    await expect(
      result.current.mutateAsync({
        appointmentTypeId: "type-1",
        startAt: "2025-01-15T09:00:00Z",
        clientName: "John Smith",
        clientEmail: "john@example.com",
      })
    ).rejects.toThrow("Failed to create booking");
  });

  it("should include optional fields", async () => {
    const mockResponse = {
      success: true,
      bookingId: "booking-123",
      message: "Booking created successfully",
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const { result } = renderHook(() => useCreateBooking("firm-123"), {
      wrapper: createWrapper(),
    });

    await waitFor(async () => {
      await result.current.mutateAsync({
        appointmentTypeId: "type-1",
        startAt: "2025-01-15T09:00:00Z",
        clientName: "John Smith",
        clientEmail: "john@example.com",
        clientPhone: "+44 20 1234 5678",
        notes: "Some notes",
        captchaToken: "captcha-token",
      });
    });

    const callBody = JSON.parse(vi.mocked(fetch).mock.calls[0][1]?.body as string);
    expect(callBody).toMatchObject({
      clientPhone: "+44 20 1234 5678",
      notes: "Some notes",
      captchaToken: "captcha-token",
    });
  });
});
