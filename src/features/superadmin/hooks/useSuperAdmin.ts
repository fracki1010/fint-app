import { useQuery } from "@tanstack/react-query";
import api from "@shared/api/axios";

export interface Tenant {
  _id: string;
  name: string;
  plan: "essential" | "business" | "enterprise";
  status: "active" | "suspended" | "cancelled";
  isActive: boolean;
  limits: {
    maxUsers: number;
    maxProducts: number;
    maxOrdersPerMonth: number;
  };
  billing: {
    email?: string;
    subscriptionStartedAt?: string;
    paymentStatus: string;
  };
  metadata: {
    source: string;
    notes?: string;
    createdBy?: string;
  };
  usage: {
    currentUsers: number;
    currentProducts: number;
    ordersThisMonth: number;
  };
  enabledFeatures: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TenantStats {
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
}

export interface UsagePercentages {
  users: number;
  products: number;
}

export function useTenants(filters?: {
  page?: number;
  limit?: number;
  plan?: string;
  status?: string;
  search?: string;
}) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["superadmin", "tenants", filters],
    queryFn: async () => {
      const response = await api.get("/superadmin/tenants", { params: filters });
      return response.data;
    },
  });

  return {
    tenants: (data?.tenants as Tenant[]) || [],
    pagination: data?.pagination || { total: 0, page: 1, pages: 0, limit: 20 },
    loading: isLoading,
    error: error?.message || null,
  };
}

export function useTenant(id?: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["superadmin", "tenant", id],
    enabled: !!id,
    queryFn: async () => {
      const response = await api.get(`/superadmin/tenants/${id}`);
      return response.data;
    },
  });

  return {
    tenant: data?.tenant as Tenant | undefined,
    adminUser: data?.adminUser,
    settings: data?.settings as { supportEmail?: string } | undefined,
    stats: (data?.stats as TenantStats) || { totalUsers: 0, totalProducts: 0, totalOrders: 0 },
    usagePercentages: (data?.usagePercentages as UsagePercentages) || { users: 0, products: 0 },
    loading: isLoading,
    error: error?.message || null,
  };
}

export interface Analytics {
  overview: {
    totalTenants: number;
    activeTenants: number;
    suspendedTenants: number;
    cancelledTenants: number;
    newThisMonth: number;
  };
  plans: Record<string, { count: number; percentage: number }>;
  revenue: {
    mrr: number;
    arr: number;
  };
}

export function useSuperAdminAnalytics() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["superadmin", "analytics"],
    queryFn: async () => {
      const response = await api.get("/superadmin/analytics");
      return response.data;
    },
  });

  return {
    analytics: data?.analytics as Analytics | undefined,
    loading: isLoading,
    error: error?.message || null,
  };
}

export interface AuditLogEntry {
  _id: string;
  action: string;
  admin: {
    _id: string;
    fullName: string;
    email: string;
  };
  tenant?: {
    _id: string;
    name: string;
    plan: string;
  };
  details: Record<string, any>;
  ip: string;
  timestamp: string;
}

export function useAuditLogs(filters?: {
  page?: number;
  limit?: number;
  action?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["superadmin", "audit", filters],
    queryFn: async () => {
      const response = await api.get("/superadmin/audit", { params: filters });
      return response.data;
    },
  });

  return {
    logs: (data?.logs as AuditLogEntry[]) || [],
    pagination: data?.pagination || { total: 0, page: 1, pages: 0, limit: 50 },
    loading: isLoading,
    error: error?.message || null,
  };
}
