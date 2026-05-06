import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@shared/api/axios";

export interface TenantPlanInfo {
  current: string;
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

export interface AvailablePlan {
  id: string;
  name: string;
  price: number;
  maxUsers: number;
  maxProducts: number;
  maxOrdersPerMonth: number;
  features: string[];
  isCurrent: boolean;
}

function normalizePlanInfo(plan: any): TenantPlanInfo | undefined {
  if (!plan) return undefined;
  return {
    current: plan.current || "essential",
    status: plan.status || "active",
    limits: {
      maxUsers: plan.limits?.maxUsers ?? 3,
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
    availablePlans: (data?.availablePlans as AvailablePlan[]) || [],
    loading: isLoading,
    error: isError ? (error?.message || "Error al cargar el plan") : null,
  };
}

export function useChangePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (plan: string) => {
      const response = await api.post("/tenant/change-plan", { plan });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant", "plan"] });
      queryClient.invalidateQueries({ queryKey: ["auth"] });
    },
  });
}
