import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import api from "@shared/api/axios";
import { PaymentOrder } from "@shared/types";

export interface PaymentOrderFilters {
  from?: string;
  to?: string;
  supplier?: string;
  status?: string;
}

export interface CreatePaymentOrderPayload {
  supplierId: string;
  date: string;
  paymentMethod: string;
  reference?: string;
  notes?: string;
  items: { purchaseId: string; amount: number }[];
  total: number;
}

export type UpdatePaymentOrderPayload = Partial<CreatePaymentOrderPayload>;

// ── usePaymentOrders (list) ─────────────────────────────────────────

export function usePaymentOrders(filters?: PaymentOrderFilters) {
  const queryKey = ["payment-orders", filters];

  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      const params: Record<string, string> = {};

      if (filters?.from) params.from = filters.from;
      if (filters?.to) params.to = filters.to;
      if (filters?.supplier) params.supplier = filters.supplier;
      if (filters?.status) params.status = filters.status;

      const response = await api.get<PaymentOrder[]>("/payment-orders", {
        params,
      });

      return response.data;
    },
  });

  return {
    paymentOrders: data || [],
    loading: isLoading,
    error: error?.message || null,
  };
}

// ── usePaymentOrder (single) ────────────────────────────────────────

export function usePaymentOrder(id?: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["payment-order", id],
    enabled: Boolean(id),
    queryFn: async () => {
      const response = await api.get<PaymentOrder>(`/payment-orders/${id}`);

      return response.data;
    },
  });

  return {
    paymentOrder: data || null,
    loading: isLoading,
    error: error?.message || null,
  };
}

// ── useCreatePaymentOrder ───────────────────────────────────────────

export function useCreatePaymentOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreatePaymentOrderPayload) => {
      const response = await api.post<PaymentOrder>("/payment-orders", payload);

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-orders"] });
    },
  });
}

// ── useUpdatePaymentOrder ───────────────────────────────────────────

export function useUpdatePaymentOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdatePaymentOrderPayload;
    }) => {
      const response = await api.put<PaymentOrder>(
        `/payment-orders/${id}`,
        data,
      );

      return response.data;
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["payment-orders"] });
      queryClient.setQueryData(["payment-order", updated._id], updated);
    },
  });
}

// ── useDeletePaymentOrder ───────────────────────────────────────────

export function useDeletePaymentOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/payment-orders/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-orders"] });
    },
  });
}

// ── useApplyPaymentOrder ────────────────────────────────────────────

export function useApplyPaymentOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post<PaymentOrder>(
        `/payment-orders/${id}/apply`,
      );

      return response.data;
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["payment-orders"] });
      queryClient.setQueryData(["payment-order", updated._id], updated);
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
      queryClient.invalidateQueries({ queryKey: ["supplier-account"] });
    },
  });
}
