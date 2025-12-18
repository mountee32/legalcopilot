"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Notification } from "@/lib/db/schema";

interface NotificationsResponse {
  notifications: Notification[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface UseNotificationsOptions {
  limit?: number;
  page?: number;
  read?: boolean;
  type?: string;
}

export function useNotifications(options: UseNotificationsOptions = {}) {
  const { limit = 10, page = 1, read, type } = options;

  const query = useQuery({
    queryKey: ["notifications", { limit, page, read, type }],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: limit.toString(),
        page: page.toString(),
      });
      if (typeof read === "boolean") params.set("read", read.toString());
      if (type) params.set("type", type);

      const res = await fetch(`/api/notifications?${params}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch notifications");
      return res.json() as Promise<NotificationsResponse>;
    },
    refetchInterval: 30_000, // Refetch every 30 seconds
    staleTime: 10_000,
  });

  const unreadCount = useUnreadCount();

  return {
    notifications: query.data?.notifications ?? [],
    pagination: query.data?.pagination,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    unreadCount,
  };
}

export function useUnreadCount() {
  const query = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: async () => {
      const res = await fetch("/api/notifications?read=false&limit=1", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch unread count");
      const data = (await res.json()) as NotificationsResponse;
      return data.pagination.total;
    },
    refetchInterval: 30_000,
    staleTime: 10_000,
  });

  return query.data ?? 0;
}

export function useMarkRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const res = await fetch(`/api/notifications/${notificationId}/read`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to mark notification as read");
      return res.json();
    },
    onSuccess: () => {
      // Invalidate all notification queries to refetch
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useMarkAllRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/notifications/read-all", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to mark all notifications as read");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
