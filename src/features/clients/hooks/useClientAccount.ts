import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import api from "@shared/api/axios";
import { 
  ClientAccount, 
  ClientAccountEntry, 
  ClientEntryType,
  ClientAgingReport,
  AllClientsAgingReport,
  CreditStatus,
  PaymentAllocationResponse,
  PaymentAllocationRequest,
} from "@shared/types";

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

// Hook for fetching aging report for a specific client
export function useClientAging(clientId?: string) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["client-aging", clientId],
    enabled: Boolean(clientId),
    queryFn: async () => {
      const response = await api.get<ClientAgingReport>(`/clients/${clientId}/account/aging`);
      return response.data;
    },
    staleTime: 60_000,
  });

  return {
    aging: data || null,
    loading: isLoading,
    error: error?.message || null,
    refetch,
  };
}

// Hook for fetching aging report for all clients
export function useAllClientsAging() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["all-clients-aging"],
    queryFn: async () => {
      const response = await api.get<AllClientsAgingReport>("/clients/account/aging-report");
      return response.data;
    },
    staleTime: 60_000,
  });

  return {
    aging: data || null,
    loading: isLoading,
    error: error?.message || null,
    refetch,
  };
}

// Hook for fetching credit status for a client
export function useClientCreditStatus(clientId?: string) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["client-credit-status", clientId],
    enabled: Boolean(clientId),
    queryFn: async () => {
      const response = await api.get<CreditStatus>(`/clients/${clientId}/account/credit-status`);
      return response.data;
    },
    staleTime: 30_000,
  });

  return {
    creditStatus: data || null,
    loading: isLoading,
    error: error?.message || null,
    refetch,
  };
}

/**
 * Hook for allocating a payment to pending charges
 * 
 * Supports FIFO automatic allocation or manual allocation to specific charges.
 * Automatically invalidates relevant queries on success.
 * 
 * @param clientId - Client ID to allocate payment for
 * @returns Mutation hook for payment allocation
 * 
 * @example
 * const { mutateAsync: allocatePayment, isPending } = useAllocatePayment(clientId);
 * 
 * // FIFO allocation
 * await allocatePayment({
 *   amount: 1000,
 *   paymentMethod: 'cash',
 *   reference: 'REF-001'
 * });
 * 
 * @example
 * // Manual allocation
 * await allocatePayment({
 *   amount: 800,
 *   paymentMethod: 'transfer',
 *   allocations: [
 *     { entryId: 'charge-1', amount: 500 },
 *     { entryId: 'charge-2', amount: 300 }
 *   ]
 * });
 */
export function useAllocatePayment(clientId?: string) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (payload: PaymentAllocationRequest) => {
      const response = await api.post<PaymentAllocationResponse>(
        `/clients/${clientId}/account/allocate`,
        payload
      );
      return response.data;
    },
    onSuccess: () => {
      // Invalidate account and aging queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["client-account", clientId] });
      queryClient.invalidateQueries({ queryKey: ["client-aging", clientId] });
      queryClient.invalidateQueries({ queryKey: ["client-credit-status", clientId] });
    },
  });

  return {
    allocate: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    reset: mutation.reset,
  };
}
