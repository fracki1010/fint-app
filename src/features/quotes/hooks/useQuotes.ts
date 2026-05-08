import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import api from "@shared/api/axios";
import type { Quote, CreateQuoteRequest, QuoteStatus } from "@shared/types";

// ── Response types ───────────────────────────────────────────────────

interface PaginatedQuotesResponse {
  quotes: Quote[];
  totalPages: number;
  currentPage: number;
  total: number;
  hasNextPage: boolean;
}

interface ConvertResponse {
  quote: Quote;
  order: { _id: string };
}

// ── Query key factory ────────────────────────────────────────────────

export const quoteKeys = {
  all: ["quotes"] as const,
  list: (filters?: Record<string, string>) => ["quotes", "list", filters] as const,
  detail: (id: string) => ["quotes", id] as const,
};

// ── List hooks ──────────────────────────────────────────────────────

export interface QuoteFilters {
  status?: QuoteStatus | "";
  dateFrom?: string;
  dateTo?: string;
  client?: string;
  page?: number;
  limit?: number;
}

function normalizeQuotesResponse(data: PaginatedQuotesResponse | { quotes: Quote[] }): PaginatedQuotesResponse {
  if ("totalPages" in data) {
    return {
      quotes: data.quotes ?? [],
      totalPages: data.totalPages ?? 1,
      currentPage: data.currentPage ?? 1,
      total: data.total ?? data.quotes?.length ?? 0,
      hasNextPage: data.hasNextPage ?? false,
    };
  }
  return {
    quotes: data.quotes ?? [],
    totalPages: 1,
    currentPage: 1,
    total: data.quotes?.length ?? 0,
    hasNextPage: false,
  };
}

export function useQuotes(filters?: QuoteFilters) {
  const queryParams: Record<string, string> = {};

  if (filters?.status) queryParams.status = filters.status;
  if (filters?.dateFrom) queryParams.dateFrom = filters.dateFrom;
  if (filters?.dateTo) queryParams.dateTo = filters.dateTo;
  if (filters?.client) queryParams.client = filters.client;
  if (filters?.page) queryParams.page = String(filters.page);
  if (filters?.limit) queryParams.limit = String(filters.limit);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: quoteKeys.list(queryParams),
    queryFn: async () => {
      const response = await api.get<PaginatedQuotesResponse | { quotes: Quote[] }>(
        "/quotes",
        { params: queryParams },
      );
      return normalizeQuotesResponse(response.data);
    },
  });

  return {
    quotes: data?.quotes ?? [],
    totalPages: data?.totalPages ?? 1,
    currentPage: data?.currentPage ?? 1,
    total: data?.total ?? 0,
    hasNextPage: data?.hasNextPage ?? false,
    loading: isLoading,
    error: error?.message || null,
    refetch,
  };
}

// ── Detail hook ──────────────────────────────────────────────────────

export function useQuote(id?: string) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: quoteKeys.detail(id ?? ""),
    enabled: Boolean(id),
    queryFn: async () => {
      const response = await api.get<Quote>(`/quotes/${id}`);
      return response.data;
    },
  });

  return {
    quote: data ?? null,
    loading: isLoading,
    error: error?.message || null,
    refetch,
  };
}

// ── Create mutation ─────────────────────────────────────────────────

export function useCreateQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateQuoteRequest) => {
      const response = await api.post<Quote>("/quotes", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quoteKeys.all });
    },
  });
}

// ── Update mutation ─────────────────────────────────────────────────

export function useUpdateQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateQuoteRequest> }) => {
      const response = await api.put<Quote>(`/quotes/${id}`, data);
      return response.data;
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: quoteKeys.all });
      queryClient.invalidateQueries({ queryKey: quoteKeys.detail(updated._id) });
    },
  });
}

// ── Delete mutation ─────────────────────────────────────────────────

export function useDeleteQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/quotes/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quoteKeys.all });
    },
  });
}

// ── Send mutation (DRAFT → SENT) ────────────────────────────────────

export function useSendQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post<Quote>(`/quotes/${id}/send`);
      return response.data;
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: quoteKeys.all });
      queryClient.invalidateQueries({ queryKey: quoteKeys.detail(updated._id) });
    },
  });
}

// ── Accept mutation (SENT → ACCEPTED) ───────────────────────────────

export function useAcceptQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post<Quote>(`/quotes/${id}/accept`);
      return response.data;
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: quoteKeys.all });
      queryClient.invalidateQueries({ queryKey: quoteKeys.detail(updated._id) });
    },
  });
}

// ── Reject mutation (DRAFT/SENT → REJECTED) ─────────────────────────

export function useRejectQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post<Quote>(`/quotes/${id}/reject`);
      return response.data;
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: quoteKeys.all });
      queryClient.invalidateQueries({ queryKey: quoteKeys.detail(updated._id) });
    },
  });
}

// ── Convert to Order mutation (ACCEPTED → CONVERTED) ────────────────

export function useConvertToOrder() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post<ConvertResponse>(`/quotes/${id}/convert`);
      return response.data;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: quoteKeys.all });
      queryClient.invalidateQueries({ queryKey: quoteKeys.detail(result.quote._id) });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      // Navigate to the created order
      navigate(`/sales/${result.order._id}`);
    },
  });
}
