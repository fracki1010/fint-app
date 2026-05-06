import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import api from "@shared/api/axios";
import { ClientAccount, ClientAccountEntry, ClientEntryType } from "@shared/types";

export interface CreateClientPaymentPayload {
  date: string;
  amount: number;
  paymentMethod?: string;
  reference?: string;
  notes?: string;
}

export interface CreateClientEntryPayload {
  date: string;
  type: Exclude<ClientEntryType, "PAYMENT">;
  amount: number;
  orderId?: string;
  paymentMethod?: string;
  reference?: string;
  notes?: string;
}

export function useClientAccount(clientId?: string) {
  const queryClient = useQueryClient();

  const { data, isLoading: loading, error, refetch } = useQuery({
    queryKey: ["client-account", clientId],
    enabled: Boolean(clientId),
    queryFn: async () => {
      const response = await api.get<ClientAccount>(`/clients/${clientId}/account`);
      return response.data;
    },
  });

  const createPaymentMutation = useMutation({
    mutationFn: async (payload: CreateClientPaymentPayload) => {
      const response = await api.post<ClientAccountEntry>(
        `/clients/${clientId}/account/payment`,
        payload,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-account", clientId] });
    },
  });

  const createEntryMutation = useMutation({
    mutationFn: async (payload: CreateClientEntryPayload) => {
      const response = await api.post<ClientAccountEntry>(
        `/clients/${clientId}/account/entry`,
        payload,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-account", clientId] });
    },
  });

  const deleteEntryMutation = useMutation({
    mutationFn: async (entryId: string) => {
      await api.delete(`/clients/${clientId}/account/entries/${entryId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-account", clientId] });
    },
  });

  return {
    entries: data?.entries ?? [],
    balance: data?.balance ?? 0,
    loading,
    error: error?.message ?? null,
    refetch,
    createPayment: createPaymentMutation.mutateAsync,
    isCreatingPayment: createPaymentMutation.isPending,
    createEntry: createEntryMutation.mutateAsync,
    isCreatingEntry: createEntryMutation.isPending,
    deleteEntry: deleteEntryMutation.mutateAsync,
    isDeletingEntry: deleteEntryMutation.isPending,
  };
}
