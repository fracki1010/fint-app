import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import api from "@/api/axios";

export interface StockMovement {
  _id: string;
  product: {
    _id: string;
    name: string;
    sku: string;
  };
  type: "ENTRADA" | "SALIDA" | "MERMA" | "AJUSTE";
  quantity: number;
  stockBefore: number;
  stockAfter: number;
  reason?: string;
  order?: any;
  source: "WhatsApp" | "Dashboard" | "Sistema";
  createdAt: string;
  updatedAt: string;
}

export interface StockMovementDetail extends Omit<StockMovement, "product"> {
  product: StockMovement["product"] & {
    description?: string;
    price?: number;
    costPrice?: number;
    stock?: number;
    minStock?: number;
    category?: string;
    categories?: string[];
    unitOfMeasure?: string;
    createdAt?: string;
    updatedAt?: string;
  };
  order?: {
    _id: string;
    items?: Array<{
      product: string;
      quantity: number;
      price: number;
    }>;
    totalAmount?: number;
    source?: string;
    salesStatus?: string;
    paymentStatus?: string;
    deliveryStatus?: string;
    createdAt?: string;
    client?: {
      _id: string;
      name?: string;
      phone?: string;
      email?: string;
      company?: string;
      taxId?: string;
      address?: string;
      fiscalAddress?: string;
      notes?: string;
    };
  };
}

export function useStockMovements(
  filters?: {
    product?: string;
    type?: string;
    source?: string;
    page?: number;
    limit?: number;
    datePreset?: "today" | "7" | "30" | "90";
    dateFrom?: string;
    dateTo?: string;
  },
  options?: { enabled?: boolean },
) {
  const queryClient = useQueryClient();

  const {
    data,
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["stockMovements", filters],
    enabled: options?.enabled ?? true,
    queryFn: async () => {
      const params = new URLSearchParams();

      if (filters?.product) params.append("product", filters.product);
      if (filters?.type) params.append("type", filters.type);
      if (filters?.source) params.append("source", filters.source);
      if (filters?.page) params.append("page", filters.page.toString());
      if (filters?.limit) params.append("limit", filters.limit.toString());
      if (filters?.datePreset) params.append("datePreset", filters.datePreset);
      if (filters?.dateFrom) params.append("dateFrom", filters.dateFrom);
      if (filters?.dateTo) params.append("dateTo", filters.dateTo);

      const response = await api.get<{
        movements: StockMovement[];
        totalPages: number;
        currentPage: number;
        total: number;
      }>(`/stock-movements?${params}`);

      return response.data;
    },
  });

  const createMovementMutation = useMutation({
    mutationFn: async (movementData: {
      product: string;
      type: "ENTRADA" | "SALIDA" | "MERMA" | "AJUSTE";
      quantity: number;
      reason?: string;
      order?: string;
      source?: "WhatsApp" | "Dashboard" | "Sistema";
    }) => {
      const response = await api.post<StockMovement>(
        "/stock-movements",
        movementData,
      );

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stockMovements"] });
      queryClient.invalidateQueries({ queryKey: ["products"] }); // Invalidar productos porque el stock cambia
    },
  });

  return {
    movements: data?.movements || [],
    totalPages: data?.totalPages || 0,
    currentPage: data?.currentPage || 1,
    total: data?.total || 0,
    loading,
    error: error?.message || null,
    refetch,
    createMovement: createMovementMutation.mutateAsync,
    isCreating: createMovementMutation.isPending,
  };
}

export function useStockMovementDetail(movementId?: string) {
  const {
    data,
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["stockMovementDetail", movementId],
    enabled: Boolean(movementId),
    queryFn: async () => {
      const response = await api.get<{ movement: StockMovementDetail }>(
        `/stock-movements/${movementId}`,
      );

      return response.data;
    },
  });

  return {
    movement: data?.movement || null,
    loading,
    error: error?.message || null,
    refetch,
  };
}
