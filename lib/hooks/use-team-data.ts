"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  TeamCapacity,
  TeamWorkload,
  LeaveRequest,
  CreateLeaveRequest,
} from "@/lib/api/schemas/team";

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status}`);
  }
  return res.json();
}

async function postJSON<T>(url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    throw new Error(`Failed to POST ${url}: ${res.status}`);
  }
  return res.json();
}

export function useTeamData(startDate?: string, endDate?: string) {
  const params = new URLSearchParams();
  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);
  const qs = params.toString() ? `?${params}` : "";

  const capacityQuery = useQuery({
    queryKey: ["team", "capacity", startDate, endDate],
    queryFn: () => fetchJSON<TeamCapacity>(`/api/team/capacity${qs}`),
    staleTime: 60_000,
  });

  const workloadQuery = useQuery({
    queryKey: ["team", "workload", startDate, endDate],
    queryFn: () => fetchJSON<TeamWorkload>(`/api/team/workload${qs}`),
    staleTime: 60_000,
  });

  return {
    capacity: capacityQuery.data,
    workload: workloadQuery.data,
    isLoading: capacityQuery.isLoading || workloadQuery.isLoading,
    isError: capacityQuery.isError || workloadQuery.isError,
    refetch: () => {
      capacityQuery.refetch();
      workloadQuery.refetch();
    },
  };
}

export function useLeaveRequests(status?: string) {
  const params = new URLSearchParams();
  if (status && status !== "all") params.set("status", status);
  const qs = params.toString() ? `?${params}` : "";

  return useQuery({
    queryKey: ["team", "leave", status],
    queryFn: () =>
      fetchJSON<{ leaveRequests: LeaveRequest[]; pagination: { total: number } }>(
        `/api/team/leave${qs}`
      ),
    staleTime: 30_000,
  });
}

export function useCreateLeave() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateLeaveRequest) => postJSON("/api/team/leave", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team", "leave"] });
    },
  });
}

export function useApproveLeave() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => postJSON(`/api/team/leave/${id}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team", "leave"] });
    },
  });
}

export function useRejectLeave() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => postJSON(`/api/team/leave/${id}/reject`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team", "leave"] });
    },
  });
}
