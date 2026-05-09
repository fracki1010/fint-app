import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import api from "@shared/api/axios";
import { BillOfMaterial, ProduceResult, ProductionLog } from "@shared/types";

export interface BomIngredientPayload {
  product: string;
  quantity: number;
}

export interface CreateBillOfMaterialPayload {
  name: string;
  productId?: string | null;
  yieldQuantity?: number;
  ingredients?: BomIngredientPayload[];
  notes?: string;
}

export interface UpdateBillOfMaterialPayload {
  name?: string;
  productId?: string | null;
  yieldQuantity?: number;
  ingredients?: BomIngredientPayload[];
  notes?: string;
}

export interface ProducePayload {
  quantity: number;
  notes?: string;
}

export function useProductionLogs(options?: { billOfMaterialId?: string; limit?: number; enabled?: boolean }) {
  const { data: logs = [], isLoading: loading, error, refetch } = useQuery({
    queryKey: ["production-logs", options?.billOfMaterialId, options?.limit],
    enabled: options?.enabled ?? true,
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (options?.billOfMaterialId) params.billOfMaterialId = options.billOfMaterialId;
      if (options?.limit) params.limit = String(options.limit);
      const response = await api.get<ProductionLog[]>("/bill-of-materials/production-logs", { params });
      return response.data;
    },
  });
  return { logs, loading, error: error?.message || null, refetch };
}

export function useBillOfMaterials(options?: { enabled?: boolean }) {
  const queryClient = useQueryClient();

  const {
    data: billOfMaterials = [],
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: ["bill-of-materials"],
    enabled: options?.enabled ?? true,
    queryFn: async () => {
      const response = await api.get<BillOfMaterial[]>("/bill-of-materials");
      return response.data;
    },
  });

  const createBillOfMaterialMutation = useMutation({
    mutationFn: async (data: CreateBillOfMaterialPayload) => {
      const response = await api.post<BillOfMaterial>("/bill-of-materials", data);
      return response.data;
    },
    onSuccess: (newBom) => {
      queryClient.setQueryData(["bill-of-materials"], (old: BillOfMaterial[] = []) => [
        ...old,
        newBom,
      ]);
    },
  });

  const updateBillOfMaterialMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateBillOfMaterialPayload }) => {
      const response = await api.patch<BillOfMaterial>(`/bill-of-materials/${id}`, data);
      return response.data;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(["bill-of-materials"], (old: BillOfMaterial[] = []) =>
        old.map((r) => (r._id === updated._id ? updated : r)),
      );
    },
  });

  const deleteBillOfMaterialMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/bill-of-materials/${id}`);
      return id;
    },
    onSuccess: (deletedId) => {
      queryClient.setQueryData(["bill-of-materials"], (old: BillOfMaterial[] = []) =>
        old.filter((r) => r._id !== deletedId),
      );
    },
  });

  const produceBillOfMaterialMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ProducePayload }) => {
      const response = await api.post<ProduceResult>(`/bill-of-materials/${id}/produce`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplies"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["production-logs"] });
    },
  });

  return {
    billOfMaterials,
    loading,
    error: error?.message || null,
    createBillOfMaterial: createBillOfMaterialMutation.mutateAsync,
    updateBillOfMaterial: updateBillOfMaterialMutation.mutateAsync,
    deleteBillOfMaterial: deleteBillOfMaterialMutation.mutateAsync,
    produceBillOfMaterial: produceBillOfMaterialMutation.mutateAsync,
    isCreating: createBillOfMaterialMutation.isPending,
    isUpdating: updateBillOfMaterialMutation.isPending,
    isDeleting: deleteBillOfMaterialMutation.isPending,
    isProducing: produceBillOfMaterialMutation.isPending,
  };
}
