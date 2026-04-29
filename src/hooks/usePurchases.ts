import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  cancelPurchase,
  confirmPurchase,
  createPurchase,
  getPurchaseById,
  getPurchases,
  receivePurchase,
  updatePurchase,
  type PurchaseListParams,
  type PurchasePayload,
} from "@/api/purchases";

const PURCHASES_QUERY_KEY = ["purchases"] as const;

export function usePurchases(params?: PurchaseListParams, options?: { enabled?: boolean }) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [...PURCHASES_QUERY_KEY, params],
    enabled: options?.enabled ?? true,
    queryFn: () => getPurchases(params),
  });

  const invalidatePurchases = () =>
    queryClient.invalidateQueries({ queryKey: PURCHASES_QUERY_KEY });

  const createMutation = useMutation({
    mutationFn: (payload: PurchasePayload) => createPurchase(payload),
    onSuccess: invalidatePurchases,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<PurchasePayload> }) =>
      updatePurchase(id, payload),
    onSuccess: (_, variables) => {
      invalidatePurchases();
      queryClient.invalidateQueries({ queryKey: ["purchase", variables.id] });
    },
  });

  const confirmMutation = useMutation({
    mutationFn: (id: string) => confirmPurchase(id),
    onSuccess: (_, id) => {
      invalidatePurchases();
      queryClient.invalidateQueries({ queryKey: ["purchase", id] });
    },
  });

  const receiveMutation = useMutation({
    mutationFn: (id: string) => receivePurchase(id),
    onSuccess: (_, id) => {
      invalidatePurchases();
      queryClient.invalidateQueries({ queryKey: ["purchase", id] });
      queryClient.invalidateQueries({ queryKey: ["supplies"] });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => cancelPurchase(id),
    onSuccess: (_, id) => {
      invalidatePurchases();
      queryClient.invalidateQueries({ queryKey: ["purchase", id] });
    },
  });

  return {
    purchases: query.data ?? [],
    loading: query.isLoading,
    error: query.error?.message ?? null,
    refetch: query.refetch,
    createPurchase: createMutation.mutateAsync,
    updatePurchase: updateMutation.mutateAsync,
    confirmPurchase: confirmMutation.mutateAsync,
    receivePurchase: receiveMutation.mutateAsync,
    cancelPurchase: cancelMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isConfirming: confirmMutation.isPending,
    isReceiving: receiveMutation.isPending,
    isCancelling: cancelMutation.isPending,
  };
}

export function usePurchaseDetail(id?: string) {
  const query = useQuery({
    queryKey: ["purchase", id],
    enabled: Boolean(id),
    queryFn: () => getPurchaseById(id as string),
  });

  return {
    purchase: query.data ?? null,
    loading: query.isLoading,
    error: query.error?.message ?? null,
    refetch: query.refetch,
  };
}
