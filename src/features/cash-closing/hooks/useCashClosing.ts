import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@shared/api/axios';
import {
  CashClosing,
  ZReport,
  OpenClosingRequest,
  OpenClosingResponse,
  CloseClosingRequest,
  CloseClosingResponse,
  ReopenClosingResponse,
  ListClosingsResponse,
  GetZReportResponse,
} from '../types/cashClosing';

const CASH_CLOSING_KEY = 'cash-closing';

// Hook to get the currently open cash closing
export function useCurrentClosing() {
  const {
    data: closing,
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: [CASH_CLOSING_KEY, 'current'],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: CashClosing | null }>(
        '/cash-closing/current'
      );
      return response.data.data;
    },
  });

  const hasOpenClosing = !!closing && closing.status === 'open';

  return {
    closing,
    hasOpenClosing,
    loading,
    error: error?.message || null,
    refetch,
  };
}

// Hook to get a specific cash closing by ID
export function useClosing(closingId: string) {
  const {
    data: closing,
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: [CASH_CLOSING_KEY, closingId],
    enabled: !!closingId,
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: CashClosing }>(
        `/cash-closing/${closingId}`
      );
      return response.data.data;
    },
  });

  return {
    closing,
    loading,
    error: error?.message || null,
    refetch,
  };
}

// Hook to list cash closings with pagination
export function useClosings(options: { page?: number; limit?: number; status?: string } = {}) {
  const { page = 1, limit = 20, status } = options;

  const {
    data,
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: [CASH_CLOSING_KEY, 'list', { page, limit, status }],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('page', String(page));
      params.append('limit', String(limit));
      if (status) params.append('status', status);

      const response = await api.get<ListClosingsResponse>(`/cash-closing?${params}`);
      return response.data;
    },
  });

  return {
    closings: data?.data || [],
    pagination: data?.pagination,
    loading,
    error: error?.message || null,
    refetch,
  };
}

// Hook to get Z-Report for a closing
export function useZReport(closingId: string) {
  const {
    data: report,
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: [CASH_CLOSING_KEY, 'report', closingId],
    enabled: !!closingId,
    queryFn: async () => {
      const response = await api.get<GetZReportResponse>(`/cash-closing/${closingId}/report`);
      return response.data.data;
    },
  });

  return {
    report,
    loading,
    error: error?.message || null,
    refetch,
  };
}

// Hook to get preview of the current open cash closing (real-time data)
export function useOpenClosingPreview(enabled: boolean = true) {
  const {
    data: preview,
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: [CASH_CLOSING_KEY, 'preview'],
    enabled,
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: ZReport | null }>(
        '/cash-closing/preview'
      );
      return response.data.data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  return {
    preview,
    loading,
    error: error?.message || null,
    refetch,
  };
}

// Hook to open a new cash closing
export function useOpenClosing() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: OpenClosingRequest) => {
      const response = await api.post<OpenClosingResponse>('/cash-closing/open', data);
      return response.data.data;
    },
    onSuccess: () => {
      // Invalidate current closing query
      queryClient.invalidateQueries({ queryKey: [CASH_CLOSING_KEY, 'current'] });
      // Invalidate list query
      queryClient.invalidateQueries({ queryKey: [CASH_CLOSING_KEY, 'list'] });
    },
  });

  return {
    openClosing: mutation.mutateAsync,
    isOpening: mutation.isPending,
    error: mutation.error?.message || null,
  };
}

// Hook to close a cash closing
export function useCloseClosing() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ closingId, data }: { closingId: string; data: CloseClosingRequest }) => {
      const response = await api.post<CloseClosingResponse>(`/cash-closing/${closingId}/close`, data);
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      // Invalidate current closing
      queryClient.invalidateQueries({ queryKey: [CASH_CLOSING_KEY, 'current'] });
      // Invalidate specific closing
      queryClient.invalidateQueries({ queryKey: [CASH_CLOSING_KEY, variables.closingId] });
      // Invalidate list
      queryClient.invalidateQueries({ queryKey: [CASH_CLOSING_KEY, 'list'] });
      // Invalidate Z-Report
      queryClient.invalidateQueries({ queryKey: [CASH_CLOSING_KEY, 'report', variables.closingId] });
    },
  });

  return {
    closeClosing: mutation.mutateAsync,
    isClosing: mutation.isPending,
    error: mutation.error?.message || null,
  };
}

// Hook to reopen a cash closing
export function useReopenClosing() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ closingId, reason }: { closingId: string; reason: string }) => {
      const response = await api.post<ReopenClosingResponse>(`/cash-closing/${closingId}/reopen`, {
        reason,
      });
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      // Invalidate specific closing
      queryClient.invalidateQueries({ queryKey: [CASH_CLOSING_KEY, variables.closingId] });
      // Invalidate list
      queryClient.invalidateQueries({ queryKey: [CASH_CLOSING_KEY, 'list'] });
      // Invalidate Z-Report
      queryClient.invalidateQueries({ queryKey: [CASH_CLOSING_KEY, 'report', variables.closingId] });
    },
  });

  return {
    reopenClosing: mutation.mutateAsync,
    isReopening: mutation.isPending,
    error: mutation.error?.message || null,
  };
}
