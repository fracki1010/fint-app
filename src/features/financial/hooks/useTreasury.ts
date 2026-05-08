import { useQuery } from "@tanstack/react-query";

import api from "@shared/api/axios";
import type {
  TreasuryCashFlow,
  TreasuryOverview,
} from "@shared/types";

export function useTreasuryOverview(from?: string, to?: string) {
  const query = useQuery({
    queryKey: ["treasury", "overview", { from, to }],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (from) params.from = from;
      if (to) params.to = to;

      const response = await api.get<TreasuryOverview>(
        "/treasury/overview",
        { params },
      );

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

export function useTreasuryCashFlow(
  from?: string,
  to?: string,
  groupBy?: string,
) {
  const query = useQuery({
    queryKey: ["treasury", "cash-flow", { from, to, groupBy }],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (from) params.from = from;
      if (to) params.to = to;
      if (groupBy) params.groupBy = groupBy;

      const response = await api.get<TreasuryCashFlow>(
        "/treasury/cash-flow",
        { params },
      );

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
