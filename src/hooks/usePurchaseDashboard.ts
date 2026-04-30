import { useQuery } from "@tanstack/react-query";

import api from "@/api/axios";

export interface PurchaseDashboard {
  thisMonthSpend: number;
  lastMonthSpend: number;
  pendingCount: number;
  inventoryValue: number;
  lowStockCount: number;
  statusBreakdown: Record<string, number>;
  trend: { labels: string[]; totals: number[] };
  topSuppliers: { supplierId: string; name: string; total: number }[];
}

export function usePurchaseDashboard() {
  return useQuery({
    queryKey: ["purchases-dashboard"],
    queryFn: async () => {
      const response = await api.get<PurchaseDashboard>("/purchases/dashboard");
      return response.data;
    },
    staleTime: 2 * 60 * 1000,
  });
}
