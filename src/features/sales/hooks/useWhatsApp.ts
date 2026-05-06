import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import api from "@shared/api/axios";

export interface WhatsAppStatus {
  status: string;
  hasQr: boolean;
  qrCodeDataUrl: string | null;
  lastError: string | null;
  lastEventAt: string | null;
  isClientActive: boolean;
}

export function useWhatsApp() {
  const queryClient = useQueryClient();
  const ACTIVE_POLLING_STATUSES = new Set([
    "starting",
    "stopping",
    "qr_ready",
    "ready",
  ]);

  const {
    data: whatsappStatus,
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["whatsapp-status"],
    queryFn: async () => {
      const response = await api.get<WhatsAppStatus>("/whatsapp/status");

      return response.data;
    },
    refetchInterval: (query) => {
      const status = (query.state.data as WhatsAppStatus | undefined)?.status;

      if (!status) return 4000;
      if (status === "stopped") return false;
      if (ACTIVE_POLLING_STATUSES.has(status)) return 4000;
      return 15000;
    },
  });

  const startMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post<WhatsAppStatus>("/whatsapp/start");

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-status"] });
    },
  });

  const stopMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post<WhatsAppStatus>("/whatsapp/stop");

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-status"] });
    },
  });

  const restartMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post<WhatsAppStatus>("/whatsapp/restart");

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-status"] });
    },
  });

  return {
    whatsappStatus,
    loading,
    error: error?.message || null,
    refetchStatus: refetch,
    startWhatsApp: startMutation.mutateAsync,
    stopWhatsApp: stopMutation.mutateAsync,
    restartWhatsApp: restartMutation.mutateAsync,
    isStarting: startMutation.isPending,
    isStopping: stopMutation.isPending,
    isRestarting: restartMutation.isPending,
  };
}
