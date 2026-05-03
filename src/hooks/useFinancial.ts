import { useMutation, useQuery } from "@tanstack/react-query";

import api from "@/api/axios";

type KpiTone = "positive" | "negative" | "neutral" | "warning";
export type FinancialFilters = {
  startDate?: string;
  endDate?: string;
  category?: string;
};

type FilterMeta = {
  startDate: string;
  endDate: string;
  category: string;
};

export interface FinancialOverviewResponse {
  generatedAt: string;
  meta: FilterMeta;
  availableCategories: string[];
  kpis: Array<{
    label: string;
    value: number;
    delta: number;
    tone: KpiTone;
  }>;
  monthlyRevenue: Array<{ month: string; value: number }>;
  salesByCategory: Array<{ name: string; share: number }>;
  recentTransactions: Array<{
    id: string;
    recipient: string;
    date: string;
    status: "Verificado" | "Pendiente" | "Observado";
    amount: string;
  }>;
  systemInsights: Array<{
    id: string;
    title: string;
    description: string;
    severity: "warning" | "danger";
  }>;
}

export interface FinancialAccountingResponse {
  generatedAt: string;
  meta: FilterMeta;
  availableCategories: string[];
  balanceSummary: Array<{ label: string; value: number; delta: number }>;
  incomeStatement: {
    netRevenueYtd: number;
    grossMargin: number;
    operatingExpenses: number;
    ebitdaProxy: number;
  };
  ledgerRows: Array<{
    date: string;
    description: string;
    category: string;
    refId: string;
    debit: string;
    credit: string;
    status: "Conciliado" | "Pendiente" | "Observado";
  }>;
}

export interface FinancialProductAnalysisResponse {
  generatedAt: string;
  meta: FilterMeta;
  availableCategories: string[];
  salesDistribution: Array<{ name: string; share: number }>;
  heatmap: number[][];
  topProducts: Array<{
    name: string;
    category: string;
    netMargin: number;
    roi: number;
    volume: number;
    status: string;
  }>;
  allProducts: Array<{
    name: string;
    category: string;
    netMargin: number;
    roi: number;
    volume: number;
    status: string;
  }>;
  kpis: {
    stockRotation: number;
    avgMargin: number;
    activeSkus: number;
  };
}

export interface FinancialProjectionsResponse {
  generatedAt: string;
  meta: FilterMeta;
  availableCategories: string[];
  whatIf: {
    salesGrowth: number;
    productionCosts: number;
    marketExpansion: string;
  };
  forecastSeries: Array<{ month: string; value: number }>;
  projectionComparison: Array<{
    month: string;
    baseline: number;
    scenario: number;
  }>;
  targetLiquidity: {
    amount: number;
    baselineDelta: number;
  };
  riskAssessment: {
    label: string;
    level: number;
    description: string;
  };
  marketVolatility: Array<{
    segment: string;
    volatility: string;
    impact: string;
    action: string;
  }>;
}

export type FinancialProjectionScenarioInput = {
  salesGrowth: number;
  productionCosts: number;
  marketExpansion: "EMEA" | "APAC" | "LATAM";
};

function buildParams(filters?: FinancialFilters) {
  const params: Record<string, string> = {};

  if (filters?.startDate) params.startDate = filters.startDate;
  if (filters?.endDate) params.endDate = filters.endDate;
  if (filters?.category) params.category = filters.category;

  return params;
}

export function useFinancialOverview(filters?: FinancialFilters) {
  const query = useQuery({
    queryKey: ["financial-overview", filters],
    queryFn: async () => {
      const response = await api.get<FinancialOverviewResponse>(
        "/financial/overview",
        {
          params: buildParams(filters),
        },
      );

      return response.data;
    },
    staleTime: 60_000,
  });

  return {
    data: query.data || null,
    loading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error?.message || null,
  };
}

export function useFinancialAccounting(filters?: FinancialFilters) {
  const query = useQuery({
    queryKey: ["financial-accounting", filters],
    queryFn: async () => {
      const response = await api.get<FinancialAccountingResponse>(
        "/financial/accounting",
        {
          params: buildParams(filters),
        },
      );

      return response.data;
    },
    staleTime: 60_000,
  });

  return {
    data: query.data || null,
    loading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error?.message || null,
  };
}

export function useFinancialProductAnalysis(filters?: FinancialFilters) {
  const query = useQuery({
    queryKey: ["financial-analysis", filters],
    queryFn: async () => {
      const response = await api.get<FinancialProductAnalysisResponse>(
        "/financial/analysis",
        {
          params: buildParams(filters),
        },
      );

      return response.data;
    },
    staleTime: 60_000,
  });

  return {
    data: query.data || null,
    loading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error?.message || null,
  };
}

export function useFinancialProjections(filters?: FinancialFilters) {
  const query = useQuery({
    queryKey: ["financial-projections", filters],
    queryFn: async () => {
      const response = await api.get<FinancialProjectionsResponse>(
        "/financial/projections",
        {
          params: buildParams(filters),
        },
      );

      return response.data;
    },
    staleTime: 60_000,
  });

  return {
    data: query.data || null,
    loading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error?.message || null,
  };
}

export function useApplyFinancialProjectionModel(filters?: FinancialFilters) {
  const mutation = useMutation({
    mutationFn: async (scenario: FinancialProjectionScenarioInput) => {
      const response = await api.post<FinancialProjectionsResponse>(
        "/financial/projections/apply",
        scenario,
        {
          params: buildParams(filters),
        },
      );

      return response.data;
    },
  });

  return {
    applyModel: mutation.mutateAsync,
    isApplying: mutation.isPending,
    error: mutation.error?.message || null,
  };
}
