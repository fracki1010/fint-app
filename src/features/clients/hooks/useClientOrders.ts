import { useQuery } from "@tanstack/react-query";
import api from "@shared/api/axios";
import { Order } from "@features/sales/hooks/useOrders";

export interface ClientOrdersPage {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function useClientOrders(
  clientId: string | undefined,
  page: number,
  enabled = true,
  limit = 10,
) {
  return useQuery({
    queryKey: ["client-orders", clientId, page, limit],
    enabled: Boolean(clientId) && enabled,
    staleTime: 30_000,
    queryFn: async () => {
      const response = await api.get<ClientOrdersPage>(`/clients/${clientId}/orders`, {
        params: { page, limit },
      });
      return response.data;
    },
  });
}
