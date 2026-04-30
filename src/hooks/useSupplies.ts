import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import api from "@/api/axios";
import { Supply, SupplyMovement, SupplyMovementType } from "@/types";

// ── Payloads ────────────────────────────────────────────────────────

export interface CreateSupplyPayload {
  name: string;
  sku?: string;
  unit: string;
  currentStock?: number;
  minStock?: number;
  referenceCost?: number;
}

export interface UpdateSupplyPayload {
  name?: string;
  sku?: string;
  unit?: string;
  minStock?: number;
  referenceCost?: number;
}

export interface CreateSupplyMovementPayload {
  type: SupplyMovementType;
  quantity: number;
  reason?: string;
  sourceType?: string;
  sourceId?: string;
}

// ── useSupplies ─────────────────────────────────────────────────────

export function useSupplies(options?: {
  enabled?: boolean;
  includeInactive?: boolean;
}) {
  const queryClient = useQueryClient();

  const {
    data: supplies = [],
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: ["supplies", options?.includeInactive],
    enabled: options?.enabled ?? true,
    queryFn: async () => {
      const params = options?.includeInactive
        ? { includeInactive: "true" }
        : {};
      const response = await api.get<Supply[]>("/supplies", { params });

      return response.data;
    },
  });

  const createSupplyMutation = useMutation({
    mutationFn: async (data: CreateSupplyPayload) => {
      const response = await api.post<Supply>("/supplies", data);

      return response.data;
    },
    onSuccess: (newSupply) => {
      queryClient.setQueryData(
        ["supplies", options?.includeInactive],
        (old: Supply[] = []) => [...old, newSupply],
      );
    },
  });

  const updateSupplyMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateSupplyPayload;
    }) => {
      const response = await api.patch<Supply>(`/supplies/${id}`, data);

      return response.data;
    },
    onSuccess: (updatedSupply) => {
      queryClient.setQueryData(
        ["supplies", options?.includeInactive],
        (old: Supply[] = []) =>
          old.map((s) => (s._id === updatedSupply._id ? updatedSupply : s)),
      );
    },
  });

  const deleteSupplyMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/supplies/${id}`);

      return id;
    },
    onSuccess: (deletedId) => {
      queryClient.setQueryData(
        ["supplies", options?.includeInactive],
        (old: Supply[] = []) => old.filter((s) => s._id !== deletedId),
      );
    },
  });

  return {
    supplies,
    loading,
    error: error?.message || null,
    createSupply: createSupplyMutation.mutateAsync,
    updateSupply: updateSupplyMutation.mutateAsync,
    deleteSupply: deleteSupplyMutation.mutateAsync,
    isCreating: createSupplyMutation.isPending,
    isUpdating: updateSupplyMutation.isPending,
    isDeleting: deleteSupplyMutation.isPending,
  };
}

// ── useSupplyMovements ──────────────────────────────────────────────

export function useSupplyMovements(supplyId?: string) {
  const queryClient = useQueryClient();

  const {
    data: movements = [],
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["supply-movements", supplyId],
    enabled: Boolean(supplyId),
    queryFn: async () => {
      const response = await api.get<SupplyMovement[]>(
        `/supplies/${supplyId}/movements`,
      );

      return response.data;
    },
  });

  const createMovementMutation = useMutation({
    mutationFn: async (data: CreateSupplyMovementPayload) => {
      const response = await api.post<SupplyMovement>(
        `/supplies/${supplyId}/movements`,
        data,
      );

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["supply-movements", supplyId],
      });
      // Refresh supplies list to update currentStock
      queryClient.invalidateQueries({ queryKey: ["supplies"] });
    },
  });

  return {
    movements,
    loading,
    error: error?.message || null,
    refetch,
    createMovement: createMovementMutation.mutateAsync,
    isCreating: createMovementMutation.isPending,
  };
}
