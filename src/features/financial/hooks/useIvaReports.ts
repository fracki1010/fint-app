import { useQuery } from "@tanstack/react-query";

import api from "@shared/api/axios";
import type { IvaReport } from "@shared/types";

export function useIvaPurchases(from?: string, to?: string) {
  const query = useQuery({
    queryKey: ["iva", "purchases", { from, to }],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (from) params.from = from;
      if (to) params.to = to;

      const response = await api.get<IvaReport>("/reports/iva-purchases", {
        params,
      });

      return response.data;
    },
    staleTime: 60_000,
  });

  return {
    data: query.data ?? null,
    loading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error?.message ?? null,
  };
}

export function useIvaSales(from?: string, to?: string) {
  const query = useQuery({
    queryKey: ["iva", "sales", { from, to }],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (from) params.from = from;
      if (to) params.to = to;

      const response = await api.get<IvaReport>("/reports/iva-sales", {
        params,
      });

      return response.data;
    },
    staleTime: 60_000,
  });

  return {
    data: query.data ?? null,
    loading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error?.message ?? null,
  };
}
