import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@shared/api/axios";
import type { CashMovement, CashMovementResponse } from "@shared/types";

export function useCashMovements(params?: {
  from?: string;
  to?: string;
  category?: string;
  type?: string;
  limit?: number;
  page?: number;
}) {
  return useQuery({
    queryKey: ["cash-movements", params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.from) searchParams.set("from", params.from);
      if (params?.to) searchParams.set("to", params.to);
      if (params?.category) searchParams.set("category", params.category);
      if (params?.type) searchParams.set("type", params.type);
      if (params?.limit) searchParams.set("limit", String(params.limit));
      if (params?.page) searchParams.set("page", String(params.page));

      const response = await api.get<CashMovementResponse>(
        `/cash-movements?${searchParams.toString()}`,
      );
      return response.data;
    },
  });
}

export function useCreateCashMovement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      date: string;
      type: "income" | "expense";
      category: string;
      amount: number;
      description?: string;
    }) => {
      const response = await api.post<CashMovement>("/cash-movements", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cash-movements"] });
      queryClient.invalidateQueries({ queryKey: ["treasury"] });
    },
  });
}

export function useDeleteCashMovement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/cash-movements/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cash-movements"] });
      queryClient.invalidateQueries({ queryKey: ["treasury"] });
    },
  });
}
