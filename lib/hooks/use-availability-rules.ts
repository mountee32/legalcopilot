"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { AvailabilityRule } from "@/lib/db/schema";

interface AvailabilityRulesResponse {
  availabilityRules: AvailabilityRule[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

interface UseAvailabilityRulesOptions {
  limit?: number;
  page?: number;
}

export function useAvailabilityRules(options: UseAvailabilityRulesOptions = {}) {
  const { limit = 100, page = 1 } = options;

  const query = useQuery({
    queryKey: ["availability-rules", { limit, page }],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: limit.toString(),
        page: page.toString(),
      });

      const res = await fetch(`/api/booking/availability-rules?${params}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch availability rules");
      return res.json() as Promise<AvailabilityRulesResponse>;
    },
    staleTime: 60_000,
  });

  return {
    availabilityRules: query.data?.availabilityRules ?? [],
    pagination: query.data?.pagination,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}

export function useCreateAvailabilityRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      userId?: string;
      dayOfWeek?: number;
      startTime?: string;
      endTime?: string;
      specificDate?: string;
      isUnavailable?: boolean;
      appointmentTypeId?: string;
    }) => {
      const res = await fetch("/api/booking/availability-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create availability rule");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["availability-rules"] });
      queryClient.invalidateQueries({ queryKey: ["availability"] });
    },
  });
}

export function useUpdateAvailabilityRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<{
        userId?: string | null;
        dayOfWeek?: number | null;
        startTime?: string | null;
        endTime?: string | null;
        specificDate?: string | null;
        isUnavailable?: boolean;
        appointmentTypeId?: string | null;
      }>;
    }) => {
      const res = await fetch(`/api/booking/availability-rules/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update availability rule");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["availability-rules"] });
      queryClient.invalidateQueries({ queryKey: ["availability"] });
    },
  });
}

export function useDeleteAvailabilityRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/booking/availability-rules/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete availability rule");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["availability-rules"] });
      queryClient.invalidateQueries({ queryKey: ["availability"] });
    },
  });
}
