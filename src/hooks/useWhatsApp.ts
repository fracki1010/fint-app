import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import api from "@/api/axios";

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
    refetchInterval: 4000,
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
