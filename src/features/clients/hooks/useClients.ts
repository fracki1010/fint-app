import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import api from "@shared/api/axios";
import { Client, PriceTier } from "@shared/types";
import { Order } from "@features/sales/hooks/useOrders";

export interface PaginatedClientsResponse {
  clients: Client[];
  totalPages: number;
  currentPage: number;
  total: number;
  hasNextPage: boolean;
}

export interface ClientDetailResponse {
  client: Client;
  orders: Order[];
  metrics: {
    totalOrders: number;
    totalSpent: number;
    pendingOrders: number;
    deliveredOrders: number;
    lastOrderAt: string | null;
  };
}

function normalizePaginatedClientsResponse(
  data: PaginatedClientsResponse | Client[],
  pageParam: number,
): PaginatedClientsResponse {
  if (Array.isArray(data)) {
    return {
      clients: data,
      totalPages: 1,
      currentPage: pageParam,
      total: data.length,
      hasNextPage: false,
    };
  }

  return {
    clients: Array.isArray(data.clients) ? data.clients : [],
    totalPages: data.totalPages ?? 1,
    currentPage: data.currentPage ?? pageParam,
    total: data.total ?? data.clients?.length ?? 0,
    hasNextPage: data.hasNextPage ?? false,
  };
}

export function useClients(options?: { enabled?: boolean }) {
  const queryClient = useQueryClient();

  const {
    data: clients = [],
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: ["clients"],
    enabled: options?.enabled ?? true,
    queryFn: async () => {
      const response = await api.get<Client[]>("/clients");

      return response.data;
    },
  });

  const createClientMutation = useMutation({
    mutationFn: async (clientData: Partial<Client>) => {
      const response = await api.post<Client>("/clients", clientData);

      return response.data;
    },
    onSuccess: (newClient) => {
      queryClient.setQueryData(["clients"], (old: Client[] = []) => [
        ...old,
        newClient,
      ]);
      queryClient.invalidateQueries({ queryKey: ["clients-infinite"] });
    },
  });

  const updateClientMutation = useMutation({
    mutationFn: async ({
      id,
      clientData,
    }: {
      id: string;
      clientData: Partial<Client>;
    }) => {
      const response = await api.put<Client>(`/clients/${id}`, clientData);

      return response.data;
    },
    onSuccess: (updatedClient) => {
      queryClient.setQueryData(["clients"], (old: Client[] = []) =>
        old.map((client) =>
          client._id === updatedClient._id ? updatedClient : client,
        ),
      );
      queryClient.invalidateQueries({
        queryKey: ["client", updatedClient._id],
      });
      queryClient.invalidateQueries({ queryKey: ["clients-infinite"] });
    },
  });

  const deleteClientMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/clients/${id}`);

      return id;
    },
    onSuccess: (deletedId) => {
      queryClient.setQueryData(["clients"], (old: Client[] = []) =>
        old.filter((client) => client._id !== deletedId),
      );
      queryClient.invalidateQueries({ queryKey: ["client", deletedId] });
      queryClient.invalidateQueries({ queryKey: ["clients-infinite"] });
    },
  });

  return {
    clients,
    loading,
    error: error?.message || null,
    createClient: createClientMutation.mutateAsync,
    updateClient: updateClientMutation.mutateAsync,
    deleteClient: deleteClientMutation.mutateAsync,
    isCreating: createClientMutation.isPending,
    isUpdating: updateClientMutation.isPending,
    isDeleting: deleteClientMutation.isPending,
  };
}

export function useInfiniteClients(limit = 20) {
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["clients-infinite", limit],
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const response = await api.get<PaginatedClientsResponse | Client[]>(
        "/clients",
        {
          params: { page: pageParam, limit },
        },
      );

      return normalizePaginatedClientsResponse(response.data, pageParam);
    },
    getNextPageParam: (lastPage) =>
      lastPage.hasNextPage ? lastPage.currentPage + 1 : undefined,
  });

  const clients = data?.pages.flatMap((page) => page.clients) || [];
  const total = data?.pages[0]?.total || 0;

  return {
    clients,
    total,
    loading: isLoading,
    error: error?.message || null,
    fetchNextPage,
    hasNextPage: hasNextPage ?? false,
    isFetchingNextPage,
  };
}

export function useClientDetail(id?: string) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["client", id],
    enabled: Boolean(id),
    queryFn: async () => {
      const response = await api.get<ClientDetailResponse | Client>(
        `/clients/${id}`,
      );

      if ("client" in response.data) {
        return response.data;
      }

      return {
        client: response.data,
        orders: [],
        metrics: {
          totalOrders: 0,
          totalSpent: 0,
          pendingOrders: 0,
          deliveredOrders: 0,
          lastOrderAt: null,
        },
      };
    },
  });

  return {
    client: data?.client || null,
    orders: data?.orders || [],
    metrics: data?.metrics || null,
    loading: isLoading,
    error: error?.message || null,
    refetch,
  };
}
