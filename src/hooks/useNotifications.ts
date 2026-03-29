import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import api, { AUTH_TOKEN_STORAGE_KEY } from "@/api/axios";

export interface NotificationItem {
  _id: string;
  type: "info" | "success" | "warning" | "error";
  title: string;
  message: string;
  metadata?: Record<string, unknown> | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface NotificationResponse {
  notifications: NotificationItem[];
  unreadCount: number;
}

const QUERY_KEY = ["notifications"];

export function useNotifications() {
  const queryClient = useQueryClient();
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)
      : null;

  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const response = await api.get<NotificationResponse>("/notifications");

      return response.data;
    },
    staleTime: 10_000,
  });

  useEffect(() => {
    if (!token) return;

    const baseUrl = (api.defaults.baseURL || "").toString().replace(/\/+$/, "");

    if (!baseUrl) return;

    const source = new EventSource(
      `${baseUrl}/notifications/stream?token=${encodeURIComponent(token)}`,
    );

    source.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);

        if (payload.event !== "notification:new" || !payload.notification)
          return;

        queryClient.setQueryData<NotificationResponse>(QUERY_KEY, (current) => {
          if (!current) {
            return { notifications: [payload.notification], unreadCount: 1 };
          }

          const alreadyExists = current.notifications.some(
            (notification) => notification._id === payload.notification._id,
          );

          if (alreadyExists) return current;

          return {
            notifications: [
              payload.notification,
              ...current.notifications,
            ].slice(0, 50),
            unreadCount: current.unreadCount + 1,
          };
        });
      } catch {
        // Ignoramos eventos no parseables
      }
    };

    return () => {
      source.close();
    };
  }, [queryClient, token]);

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/notifications/${id}/read`);

      return id;
    },
    onSuccess: (id) => {
      queryClient.setQueryData<NotificationResponse>(QUERY_KEY, (current) => {
        if (!current) return current;
        const notifications = current.notifications.map((item) =>
          item._id === id
            ? { ...item, isRead: true, readAt: new Date().toISOString() }
            : item,
        );
        const unreadCount = notifications.filter((item) => !item.isRead).length;

        return { notifications, unreadCount };
      });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      await api.patch("/notifications/read-all");
    },
    onSuccess: () => {
      queryClient.setQueryData<NotificationResponse>(QUERY_KEY, (current) => {
        if (!current) return current;

        return {
          notifications: current.notifications.map((item) => ({
            ...item,
            isRead: true,
            readAt: new Date().toISOString(),
          })),
          unreadCount: 0,
        };
      });
    },
  });

  return {
    notifications: query.data?.notifications || [],
    unreadCount: query.data?.unreadCount || 0,
    loading: query.isLoading,
    error: query.error?.message || null,
    markAsRead: markAsReadMutation.mutateAsync,
    markAllAsRead: markAllAsReadMutation.mutateAsync,
  };
}
