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
  universalKpis: {
    salesNet: {
      today: number;
      month: number;
      year: number;
      previousMonth: number;
    };
    grossProfit: {
      month: number;
      year: number;
    };
    grossMarginPct: {
      month: number;
      year: number;
    };
    averageTicket: {
      month: number;
      orderCountMonth: number;
    };
    growth: {
      salesMonthVsPreviousMonthPct: number;
    };
    customers: {
      newThisMonth: number;
      returningThisMonth: number;
    };
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
  purchasing: {
    lowStockSupplies: Array<{
      _id: string;
      name: string;
      sku?: string | null;
      currentStock: number;
      minStock: number;
      unit: string;
    }>;
    lowStockSuppliesCount: number;
    totalPayables: number;
    lastReceivedPurchase: {
      _id: string;
      supplierName: string;
      total: number;
      itemCount: number;
      receivedAt: string;
    } | null;
  };
}

export interface DashboardOptionalKpis {
  generatedAt: string;
  meta: {
    startDate: string;
    endDate: string;
    periodDays: number;
  };
  inventoryRotation: {
    ratio: number;
    cogs: number;
    averageStockValue: number;
    method: "snapshot_average" | "current_stock_proxy";
    snapshotCount: number;
  };
  salesByCategory: Array<{
    category: string;
    revenue: number;
    sharePct: number;
  }>;
  salesByHour: Array<{
    hour: string;
    revenue: number;
  }>;
  salesByWeekday: Array<{
    weekday: string;
    revenue: number;
  }>;
  topProductsByVolume: Array<{
    productName: string;
    sku?: string | null;
    category: string;
    quantitySold: number;
    revenue: number;
    grossProfit: number;
    grossMarginPct: number;
  }>;
  topProductsByMargin: Array<{
    productName: string;
    sku?: string | null;
    category: string;
    quantitySold: number;
    revenue: number;
    grossProfit: number;
    grossMarginPct: number;
  }>;
  topClients: Array<{
    clientId?: string | null;
    clientName: string;
    revenue: number;
    orders: number;
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

export interface DailySale {
  date: string;
  revenue: number;
  orders: number;
  averageTicket: number;
}

export function useDailySales(days = 14) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard-daily-sales", days],
    queryFn: async () => {
      const response = await api.get("/dashboard/daily-sales", {
        params: { days },
      });
      return response.data;
    },
    staleTime: 60_000,
  });

  return {
    sales: (data?.sales as DailySale[]) || [],
    days: data?.days || days,
    loading: isLoading,
    error: error?.message || null,
  };
}

export function useDashboardOptionalKpis(days = 90) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["dashboard-optional-kpis", days],
    queryFn: async () => {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

      const toIsoDate = (date: Date) => date.toISOString().slice(0, 10);

      const response = await api.get<DashboardOptionalKpis>(
        "/dashboard/optional-kpis",
        {
          params: {
            startDate: toIsoDate(startDate),
            endDate: toIsoDate(endDate),
          },
        },
      );

      return response.data;
    },
    staleTime: 60_000,
  });

  return {
    optionalKpis: data || null,
    loading: isLoading,
    error: error?.message || null,
    refetch,
  };
}
