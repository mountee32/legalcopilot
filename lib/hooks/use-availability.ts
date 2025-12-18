"use client";

import { useQuery } from "@tanstack/react-query";

interface AvailableSlot {
  startAt: string;
  endAt: string;
  appointmentTypeId: string;
  assignedTo: string | null;
}

interface AvailabilityResponse {
  slots: AvailableSlot[];
}

interface UseAvailabilityOptions {
  firmSlug: string;
  appointmentTypeId: string;
  startDate: string;
  endDate: string;
  userId?: string;
  enabled?: boolean;
}

export function useAvailability(options: UseAvailabilityOptions) {
  const { firmSlug, appointmentTypeId, startDate, endDate, userId, enabled = true } = options;

  const query = useQuery({
    queryKey: ["availability", { firmSlug, appointmentTypeId, startDate, endDate, userId }],
    queryFn: async () => {
      const params = new URLSearchParams({
        appointmentTypeId,
        startDate,
        endDate,
      });
      if (userId) params.set("userId", userId);

      const res = await fetch(`/api/public/booking/firms/${firmSlug}/availability?${params}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch availability");
      return res.json() as Promise<AvailabilityResponse>;
    },
    enabled: enabled && !!firmSlug && !!appointmentTypeId && !!startDate && !!endDate,
    staleTime: 30_000, // 30 seconds - slots can change quickly
  });

  return {
    slots: query.data?.slots ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}

interface UsePublicAppointmentTypesOptions {
  firmSlug: string;
  enabled?: boolean;
}

export function usePublicAppointmentTypes(options: UsePublicAppointmentTypesOptions) {
  const { firmSlug, enabled = true } = options;

  const query = useQuery({
    queryKey: ["public-appointment-types", { firmSlug }],
    queryFn: async () => {
      const res = await fetch(`/api/public/booking/firms/${firmSlug}/types`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch appointment types");
      return res.json();
    },
    enabled: enabled && !!firmSlug,
    staleTime: 60_000,
  });

  return {
    appointmentTypes: query.data?.appointmentTypes ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
