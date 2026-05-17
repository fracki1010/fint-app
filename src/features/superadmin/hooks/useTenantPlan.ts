import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@shared/api/axios";

export interface TenantPlanInfo {
  current: string;
  complements: string[];
  status: string;
  limits: {
    maxUsers: number;
    maxProducts: number;
    maxOrdersPerMonth: number;
  };
  usage: {
    currentUsers: number;
    currentProducts: number;
    ordersThisMonth: number;
  };
  usagePercentages: {
    users: number;
    products: number;
    orders: number;
  };
  billing?: {
    email?: string;
    paymentStatus?: string;
  };
  trialEndsAt?: string;
}

export interface AvailableComplement {
  id: string;
  name: string;
  price: number;
  features: string[];
  limits?: {
    maxUsers?: number;
    maxProducts?: number;
    maxOrdersPerMonth?: number;
  };
}

function normalizePlanInfo(plan: any): TenantPlanInfo | undefined {
  if (!plan) return undefined;
  return {
    current: plan.current || "app_base",
    complements: plan.complements || [],
    status: plan.status || "active",
    limits: {
      maxUsers: plan.limits?.maxUsers ?? 1,
      maxProducts: plan.limits?.maxProducts ?? 200,
      maxOrdersPerMonth: plan.limits?.maxOrdersPerMonth ?? 500,
    },
    usage: {
      currentUsers: plan.usage?.currentUsers ?? 0,
      currentProducts: plan.usage?.currentProducts ?? 0,
      ordersThisMonth: plan.usage?.ordersThisMonth ?? 0,
    },
    usagePercentages: {
      users: plan.usagePercentages?.users ?? 0,
      products: plan.usagePercentages?.products ?? 0,
      orders: plan.usagePercentages?.orders ?? 0,
    },
    billing: plan.billing || undefined,
    trialEndsAt: plan.trialEndsAt || undefined,
  };
}

export function useTenantPlan() {
  const { data, isLoading, error, isError } = useQuery({
    queryKey: ["tenant", "plan"],
    queryFn: async () => {
      const response = await api.get("/tenant/plan");
      return response.data;
    },
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  return {
    plan: normalizePlanInfo(data?.plan),
    availableComplements: (data?.availableComplements as AvailableComplement[]) || [],
    loading: isLoading,
    error: isError ? (error?.message || "Error al cargar el plan") : null,
  };
}

export function useActivateComplements() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (complements: string[]) => {
      const response = await api.post("/tenant/activate-complements", { complements });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant", "plan"] });
      queryClient.invalidateQueries({ queryKey: ["auth"] });
    },
  });
}
