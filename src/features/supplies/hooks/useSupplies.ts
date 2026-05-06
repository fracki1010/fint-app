import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import api from "@shared/api/axios";
import { Supply, SupplyMovement, SupplyMovementType, SupplyUnit, Product } from "@shared/types";

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

// ── Mappers ─────────────────────────────────────────────────────────

function mapProductToSupply(p: Product): Supply {
  return {
    _id: p._id,
    sku: p.sku ?? null,
    name: p.name,
    unit: (p.unitOfMeasure as SupplyUnit) || "unidad",
    currentStock: p.stock,
    minStock: p.minStock ?? 0,
    referenceCost: p.costPrice ?? 0,
    isActive: p.isActive ?? true,
    deletedAt: p.deletedAt ?? null,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
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
      const params: Record<string, string> = { type: "raw_material" };
      if (options?.includeInactive) {
        params.includeInactive = "true";
      }
      const response = await api.get<Product[]>("/products", { params });

      return response.data.map(mapProductToSupply);
    },
  });

  const createSupplyMutation = useMutation({
    mutationFn: async (data: CreateSupplyPayload) => {
      const productData = {
        name: data.name,
        sku: data.sku,
        unitOfMeasure: data.unit,
        stock: data.currentStock ?? 0,
        minStock: data.minStock ?? 0,
        costPrice: data.referenceCost ?? 0,
        type: "raw_material" as const,
        price: 0,
      };
      const response = await api.post<Product>("/products", productData);

      return mapProductToSupply(response.data);
    },
    onSuccess: (newSupply) => {
      queryClient.setQueryData(
        ["supplies", options?.includeInactive],
        (old: Supply[] = []) => [...old, newSupply],
      );
      queryClient.invalidateQueries({ queryKey: ["products"] });
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
      const productData: Record<string, unknown> = {};
      if (data.name !== undefined) productData.name = data.name;
      if (data.sku !== undefined) productData.sku = data.sku;
      if (data.unit !== undefined) productData.unitOfMeasure = data.unit;
      if (data.minStock !== undefined) productData.minStock = data.minStock;
      if (data.referenceCost !== undefined)
        productData.costPrice = data.referenceCost;
      const response = await api.put<Product>(`/products/${id}`, productData);

      return mapProductToSupply(response.data);
    },
    onSuccess: (updatedSupply) => {
      queryClient.setQueryData(
        ["supplies", options?.includeInactive],
        (old: Supply[] = []) =>
          old.map((s) => (s._id === updatedSupply._id ? updatedSupply : s)),
      );
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });

  const deleteSupplyMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/products/${id}`);

      return id;
    },
    onSuccess: (deletedId) => {
      queryClient.setQueryData(
        ["supplies", options?.includeInactive],
        (old: Supply[] = []) => old.filter((s) => s._id !== deletedId),
      );
      queryClient.invalidateQueries({ queryKey: ["products"] });
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
