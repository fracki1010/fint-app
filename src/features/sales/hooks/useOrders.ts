import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";

import api from "@shared/api/axios";
import { getErrorMessage } from "@shared/utils/errors";

export type SalesStatus = "Pendiente" | "Confirmada" | "Cancelada";
export type PaymentStatus = "Pendiente" | "Parcial" | "Pagado";
export type DeliveryStatus = "Pendiente" | "Preparando" | "Entregada";

export interface OrderItem {
  product: string;
  quantity: number;
  price: number;
  productId?: string;
  unitCostAtSale?: number;
}

export interface OrderMovement {
  _id: string;
  type: "ENTRADA" | "SALIDA" | "MERMA" | "AJUSTE";
  quantity: number;
  stockBefore: number;
  stockAfter: number;
  reason?: string;
  source: "WhatsApp" | "Dashboard" | "Sistema";
  createdAt: string;
  product?: {
    _id: string;
    name: string;
    sku?: string;
  };
}

export interface Order {
  _id: string;
  orderNumber?: string;
  client:
    | string
    | {
        _id: string;
        name?: string;
        phone?: string;
        taxId?: string;
        fiscalAddress?: string;
      };
  items: OrderItem[];
  totalAmount: number;
  status: "Pendiente" | "Pagado" | "Entregado" | "Confirmada" | "Cancelada";
  salesStatus: SalesStatus;
  paymentStatus: PaymentStatus;
  deliveryStatus: DeliveryStatus;
  notes?: string;
  source: "WhatsApp" | "Dashboard";
  stockApplied?: boolean;
  confirmedAt?: string | null;
  paidAt?: string | null;
  deliveredAt?: string | null;
  cancelledAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedOrdersResponse {
  orders: Order[];
  totalPages: number;
  currentPage: number;
  total: number;
  hasNextPage: boolean;
}

export interface OrderDetailResponse {
  order: Order;
  movements: OrderMovement[];
}

function normalizePaginatedOrdersResponse(
  data: PaginatedOrdersResponse | Order[],
  pageParam: number,
): PaginatedOrdersResponse {
  if (Array.isArray(data)) {
    return {
      orders: data,
      totalPages: 1,
      currentPage: pageParam,
      total: data.length,
      hasNextPage: false,
    };
  }

  return {
    orders: Array.isArray(data.orders) ? data.orders : [],
    totalPages: data.totalPages ?? 1,
    currentPage: data.currentPage ?? pageParam,
    total: data.total ?? data.orders?.length ?? 0,
    hasNextPage: data.hasNextPage ?? false,
  };
}

export function useOrders(options?: { enabled?: boolean }) {
  const queryClient = useQueryClient();

  const {
    data: orders = [],
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: ["orders"],
    enabled: options?.enabled ?? true,
    queryFn: async () => {
      const response = await api.get<Order[]>("/orders");

      return response.data;
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: async (orderData: Partial<Order>) => {
      const response = await api.post<Order>("/orders", orderData);

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["orders-infinite"] });
    },
  });

  const updateOrderMutation = useMutation({
    mutationFn: async ({
      id,
      orderData,
    }: {
      id: string;
      orderData: Partial<Order>;
    }) => {
      const response = await api.put<Order>(`/orders/${id}`, orderData);

      return response.data;
    },
    onSuccess: (updatedOrder) => {
      queryClient.setQueryData(["orders"], (old: Order[] = []) =>
        old.map((order) =>
          order._id === updatedOrder._id ? updatedOrder : order,
        ),
      );
      queryClient.invalidateQueries({ queryKey: ["order", updatedOrder._id] });
      queryClient.invalidateQueries({ queryKey: ["orders-infinite"] });
    },
  });

  const bulkCreateOrdersMutation = useMutation({
    mutationFn: async (ordersData: Partial<Order>[]) => {
      const response = await api.post<{ imported: number; failed: number; errors: Array<{ row: number; error: string }> }>("/orders/bulk", {
        orders: ordersData,
      });

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["orders-infinite"] });
    },
  });

  return {
    orders,
    loading,
    error: getErrorMessage(error, "No pudimos cargar las ventas."),
    createOrder: createOrderMutation.mutateAsync,
    updateOrder: updateOrderMutation.mutateAsync,
    bulkCreateOrders: bulkCreateOrdersMutation.mutateAsync,
    isCreating: createOrderMutation.isPending,
    isUpdating: updateOrderMutation.isPending,
    isBulkCreating: bulkCreateOrdersMutation.isPending,
  };
}

export function useInfiniteOrders(limit = 20) {
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["orders-infinite", limit],
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const response = await api.get<PaginatedOrdersResponse | Order[]>(
        "/orders",
        {
          params: { page: pageParam, limit },
        },
      );

      return normalizePaginatedOrdersResponse(response.data, pageParam);
    },
    getNextPageParam: (lastPage) =>
      lastPage.hasNextPage ? lastPage.currentPage + 1 : undefined,
  });

  const orders = data?.pages.flatMap((page) => page.orders) || [];
  const total = data?.pages[0]?.total || 0;

  return {
    orders,
    total,
    loading: isLoading,
    error: getErrorMessage(error, "No pudimos cargar las ventas."),
    fetchNextPage,
    hasNextPage: hasNextPage ?? false,
    isFetchingNextPage,
    refetch,
  };
}

export function useOrderDetail(id?: string) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["order", id],
    enabled: Boolean(id),
    queryFn: async () => {
      const response = await api.get<OrderDetailResponse | Order>(
        `/orders/${id}`,
      );

      if ("order" in response.data) {
        return response.data;
      }

      return { order: response.data, movements: [] };
    },
  });

  return {
    order: data?.order || null,
    movements: data?.movements || [],
    loading: isLoading,
    error: getErrorMessage(error, "No pudimos cargar el detalle de la venta."),
    refetch,
  };
}
