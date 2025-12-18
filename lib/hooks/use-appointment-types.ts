"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { AppointmentType } from "@/lib/db/schema";

interface AppointmentTypesResponse {
  appointmentTypes: AppointmentType[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

interface UseAppointmentTypesOptions {
  limit?: number;
  page?: number;
}

export function useAppointmentTypes(options: UseAppointmentTypesOptions = {}) {
  const { limit = 50, page = 1 } = options;

  const query = useQuery({
    queryKey: ["appointment-types", { limit, page }],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: limit.toString(),
        page: page.toString(),
      });

      const res = await fetch(`/api/booking/appointment-types?${params}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch appointment types");
      return res.json() as Promise<AppointmentTypesResponse>;
    },
    staleTime: 60_000,
  });

  return {
    appointmentTypes: query.data?.appointmentTypes ?? [],
    pagination: query.data?.pagination,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}

export function useCreateAppointmentType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      description?: string;
      practiceArea?: string;
      duration: number;
      bufferAfter?: number;
      isActive?: boolean;
      maxAdvanceBookingDays?: number;
      minNoticeHours?: number;
      settings?: Record<string, unknown>;
    }) => {
      const res = await fetch("/api/booking/appointment-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create appointment type");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointment-types"] });
    },
  });
}

export function useUpdateAppointmentType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<{
        name: string;
        description?: string;
        practiceArea?: string;
        duration: number;
        bufferAfter?: number;
        isActive?: boolean;
        maxAdvanceBookingDays?: number;
        minNoticeHours?: number;
        settings?: Record<string, unknown>;
      }>;
    }) => {
      const res = await fetch(`/api/booking/appointment-types/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update appointment type");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointment-types"] });
    },
  });
}

export function useDeleteAppointmentType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/booking/appointment-types/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete appointment type");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointment-types"] });
    },
  });
}
