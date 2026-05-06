import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import api from "@shared/api/axios";
import {
  SupplierAccount,
  SupplierAccountEntry,
  SupplierEntryType,
} from "@shared/types";

// ── Payloads ────────────────────────────────────────────────────────

export interface CreatePaymentPayload {
  date: string;
  amount: number;
  paymentMethod?: string;
  reference?: string;
  notes?: string;
}

export interface CreateAccountEntryPayload {
  date: string;
  type: Exclude<SupplierEntryType, "PAYMENT">;
  amount: number;
  purchaseId?: string;
  paymentMethod?: string;
  reference?: string;
  notes?: string;
}

// ── useSupplierAccount ──────────────────────────────────────────────

export function useSupplierAccount(supplierId?: string) {
  const queryClient = useQueryClient();

  const {
    data,
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["supplier-account", supplierId],
    enabled: Boolean(supplierId),
    queryFn: async () => {
      const response = await api.get<SupplierAccount>(
        `/suppliers/${supplierId}/account`,
      );

      return response.data;
    },
  });

  const createPaymentMutation = useMutation({
    mutationFn: async (payload: CreatePaymentPayload) => {
      const response = await api.post<SupplierAccountEntry>(
        `/suppliers/${supplierId}/account/payment`,
        payload,
      );

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["supplier-account", supplierId],
      });
      queryClient.invalidateQueries({
        queryKey: ["supplier-statement", supplierId],
      });
    },
  });

  const createEntryMutation = useMutation({
    mutationFn: async (payload: CreateAccountEntryPayload) => {
      const response = await api.post<SupplierAccountEntry>(
        `/suppliers/${supplierId}/account/entry`,
        payload,
      );

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["supplier-account", supplierId],
      });
      queryClient.invalidateQueries({
        queryKey: ["supplier-statement", supplierId],
      });
    },
  });

  return {
    entries: data?.entries || [],
    balance: data?.balance || 0,
    loading,
    error: error?.message || null,
    refetch,
    createPayment: createPaymentMutation.mutateAsync,
    createEntry: createEntryMutation.mutateAsync,
    isCreatingPayment: createPaymentMutation.isPending,
    isCreatingEntry: createEntryMutation.isPending,
  };
}

// ── useSupplierStatement ────────────────────────────────────────────

export function useSupplierStatement(
  supplierId?: string,
  from?: string,
  to?: string,
) {
  const {
    data,
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["supplier-statement", supplierId, from, to],
    enabled: Boolean(supplierId),
    queryFn: async () => {
      const params: Record<string, string> = {};

      if (from) params.from = from;
      if (to) params.to = to;

      const response = await api.get<SupplierAccount>(
        `/suppliers/${supplierId}/account/statement`,
        { params },
      );

      return response.data;
    },
  });

  return {
    entries: data?.entries || [],
    balance: data?.balance || 0,
    loading,
    error: error?.message || null,
    refetch,
  };
}
