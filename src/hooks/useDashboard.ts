import { useQuery } from "@tanstack/react-query";

import api from "@/api/axios";

export interface DashboardSummary {
  generatedAt: string;
  sales: {
    todaySales: number;
    monthSales: number;
    collectedMonth: number;
    averageTicket: number;
    totalOrdersMonth: number;
  };
  operations: {
    pendingOrders: number;
    confirmedOrders: number;
    paidOrders: number;
    deliveredOrders: number;
    cancelledOrders: number;
    totalOrders: number;
  };
  inventory: {
    totalProducts: number;
    lowStockCount: number;
    stockValue: number;
    lowStockProducts: Array<{
      _id: string;
      name: string;
      sku?: string | null;
      stock: number;
      minStock: number;
      unitOfMeasure?: string;
    }>;
  };
  customers: {
    totalClients: number;
    activeClients: number;
    customersWithDebt: number;
    totalDebt: number;
  };
  topProducts: Array<{
    productId?: string | null;
    name: string;
    sku?: string | null;
    quantitySold: number;
    revenue: number;
  }>;
  recentOrders: Array<{
    _id: string;
    orderNumber?: string | null;
    clientName: string;
    totalAmount: number;
    status: string;
    salesStatus: string;
    paymentStatus: string;
    deliveryStatus: string;
    createdAt: string;
  }>;
  recentMovements: Array<{
    _id: string;
    type: "ENTRADA" | "SALIDA" | "MERMA" | "AJUSTE";
    productName: string;
    sku?: string | null;
    quantity: number;
    reason?: string;
    createdAt: string;
  }>;
}

export function useDashboard() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: async () => {
      const response = await api.get<DashboardSummary>("/dashboard/summary");

      return response.data;
    },
    staleTime: 60_000,
  });

  return {
    dashboard: data || null,
    loading: isLoading,
    error: error?.message || null,
    refetch,
  };
}
