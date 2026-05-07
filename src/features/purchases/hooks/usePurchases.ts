import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import api from "@shared/api/axios";
import { Purchase, PaymentMethod } from "@shared/types";

export interface PayPurchaseData {
  amount: number;
  paymentMethod: PaymentMethod;
  reference?: string;
  notes?: string;
}

// ── Payloads ────────────────────────────────────────────────────────

export interface CreatePurchaseItemPayload {
  productItemId: string;
  presentationId?: string;
  quantity: number;
  unitCost: number;
  lineTotal: number;
}

// ── Pure helpers ─────────────────────────────────────────────────────

export type LineItemInput = {
  itemKind: "supply" | "product";
  supplyId: string;
  productId: string;
  presentationId: string;
  quantity: string;
  unitCost: string;
};

export function buildPurchaseItemsPayload(items: LineItemInput[]): CreatePurchaseItemPayload[] {
  return items
    .filter((it) => {
      const qty = Number(it.quantity || 0);
      const cost = Number(it.unitCost || 0);
      const id = it.supplyId || it.productId;
      return id && qty > 0 && cost >= 0;
    })
    .map((it) => ({
      // All items go as productItemId since supplies are now Products (type=raw_material)
      productItemId: it.supplyId || it.productId,
      ...(it.presentationId ? { presentationId: it.presentationId } : {}),
      quantity: Number(it.quantity),
      unitCost: Number(it.unitCost),
      lineTotal: Number(it.quantity) * Number(it.unitCost),
    }));
}

export interface CreatePurchasePayload {
  supplierId: string;
  date: string;
  paymentCondition: "CASH" | "CREDIT";
  subtotal: number;
  tax: number;
  total: number;
  notes?: string;
  items: CreatePurchaseItemPayload[];
}

// ── usePurchases ────────────────────────────────────────────────────

export function usePurchases(options?: { enabled?: boolean }) {
  const queryClient = useQueryClient();

  const {
    data: purchases = [],
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: ["purchases"],
    enabled: options?.enabled ?? true,
    queryFn: async () => {
      const response = await api.get<Purchase[]>("/purchases");

      return response.data;
    },
  });

  const createPurchaseMutation = useMutation({
    mutationFn: async (data: CreatePurchasePayload) => {
      const response = await api.post<Purchase>("/purchases", data);

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
    },
  });

  const confirmPurchaseMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post<Purchase>(`/purchases/${id}/confirm`);

      return response.data;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(["purchases"], (old: Purchase[] = []) =>
        old.map((p) => (p._id === updated._id ? updated : p)),
      );
      queryClient.invalidateQueries({ queryKey: ["purchase", updated._id] });
    },
  });

  const receivePurchaseMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post<Purchase>(`/purchases/${id}/receive`);

      return response.data;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(["purchases"], (old: Purchase[] = []) =>
        old.map((p) => (p._id === updated._id ? updated : p)),
      );
      queryClient.invalidateQueries({ queryKey: ["purchase", updated._id] });
      // Receiving a purchase updates stock for both supplies and products
      queryClient.invalidateQueries({ queryKey: ["supplies"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["products-infinite"] });
      queryClient.invalidateQueries({ queryKey: ["product-search"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      // Also updates supplier account if CREDIT
      queryClient.invalidateQueries({ queryKey: ["supplier-account"] });
    },
  });

  const cancelPurchaseMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post<Purchase>(`/purchases/${id}/cancel`);

      return response.data;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(["purchases"], (old: Purchase[] = []) =>
        old.map((p) => (p._id === updated._id ? updated : p)),
      );
      queryClient.invalidateQueries({ queryKey: ["purchase", updated._id] });
    },
  });

  return {
    purchases,
    loading,
    error: error?.message || null,
    createPurchase: createPurchaseMutation.mutateAsync,
    confirmPurchase: confirmPurchaseMutation.mutateAsync,
    receivePurchase: receivePurchaseMutation.mutateAsync,
    cancelPurchase: cancelPurchaseMutation.mutateAsync,
    isCreating: createPurchaseMutation.isPending,
    isConfirming: confirmPurchaseMutation.isPending,
    isReceiving: receivePurchaseMutation.isPending,
    isCancelling: cancelPurchaseMutation.isPending,
  };
}

// ── usePayPurchase ─────────────────────────────────────────────────

export function usePayPurchase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: PayPurchaseData }) => {
      const response = await api.post(`/purchases/${id}/pay`, data);
      return response.data;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
      if (result?.data?._id) {
        queryClient.invalidateQueries({ queryKey: ["purchase", result.data._id] });
      }
      queryClient.invalidateQueries({ queryKey: ["supplier-account"] });
    },
  });
}

// ── usePurchaseDetail ───────────────────────────────────────────────

export function usePurchaseDetail(id?: string) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["purchase", id],
    enabled: Boolean(id),
    queryFn: async () => {
      const response = await api.get<Purchase>(`/purchases/${id}`);

      return response.data;
    },
  });

  return {
    purchase: data || null,
    loading: isLoading,
    error: error?.message || null,
    refetch,
  };
}
