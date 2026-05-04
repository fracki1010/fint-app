import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/api/axios";

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
  maxProducts: number | "Infinity";
  maxOrdersPerMonth: number | "Infinity";
  features: string[];
  isCurrent: boolean;
}

export function useTenantPlan() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["tenant", "plan"],
    queryFn: async () => {
      const response = await api.get("/api/tenant/plan");
      return response.data;
    },
  });

  return {
    plan: data?.plan as TenantPlanInfo | undefined,
    availablePlans: (data?.availablePlans as AvailablePlan[]) || [],
    loading: isLoading,
    error: error?.message || null,
  };
}

export function useChangePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (plan: string) => {
      const response = await api.post("/api/tenant/change-plan", { plan });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant", "plan"] });
      queryClient.invalidateQueries({ queryKey: ["auth"] });
    },
  });
}
