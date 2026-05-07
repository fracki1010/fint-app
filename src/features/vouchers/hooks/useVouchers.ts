import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import api from "@shared/api/axios";
import {
  VoucherType,
  GenerateVouchersRequest,
  GenerateVouchersResponse,
  VoidVoucherRequest,
  VoidVoucherResponse,
  VouchersByOrderResponse,
} from "../types/voucher";

const VOUCHERS_KEY = "vouchers";

export function useVouchers(orderId?: string) {
  // Get vouchers for order
  const {
    data: vouchers = [],
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: [VOUCHERS_KEY, orderId],
    enabled: Boolean(orderId),
    queryFn: async () => {
      const response = await api.get<VouchersByOrderResponse>(
        `/orders/${orderId}/vouchers`
      );
      return response.data.vouchers;
    },
  });

  return {
    vouchers,
    loading,
    error: error?.message || null,
    refetch,
  };
}

export function useGenerateVouchers() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({
      orderId,
      data,
    }: {
      orderId: string;
      data: GenerateVouchersRequest;
    }) => {
      const response = await api.post<GenerateVouchersResponse>(
        `/orders/${orderId}/vouchers`,
        data
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      // Invalidate vouchers for this order
      queryClient.invalidateQueries({
        queryKey: [VOUCHERS_KEY, variables.orderId],
      });
      // Also invalidate the order itself as it may have updated voucher references
      queryClient.invalidateQueries({
        queryKey: ["order", variables.orderId],
      });
    },
  });

  return {
    generateVouchers: mutation.mutateAsync,
    isGenerating: mutation.isPending,
    error: mutation.error?.message || null,
  };
}

export function useVoidVoucher() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({
      voucherId,
      reason,
    }: {
      voucherId: string;
      reason: string;
    }) => {
      const response = await api.post<VoidVoucherResponse>(
        `/vouchers/${voucherId}/void`,
        { reason } as VoidVoucherRequest
      );
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate vouchers for the order this voucher belongs to
      const orderId = data.voucher.order;
      queryClient.invalidateQueries({
        queryKey: [VOUCHERS_KEY, orderId],
      });
      // Invalidate specific voucher query if exists
      queryClient.invalidateQueries({
        queryKey: [VOUCHERS_KEY, "detail", data.voucher._id],
      });
    },
  });

  return {
    voidVoucher: mutation.mutateAsync,
    isVoiding: mutation.isPending,
    error: mutation.error?.message || null,
  };
}

export function useDownloadVoucher() {
  const downloadVoucher = async (voucherId: string, filename?: string) => {
    const response = await api.get(`/vouchers/${voucherId}/download`, {
      responseType: "blob",
    });

    // Create a download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename || `comprobante-${voucherId}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  return {
    downloadVoucher,
  };
}

export function useNextVoucherNumber(type: VoucherType) {
  const { data, isLoading, error } = useQuery({
    queryKey: [VOUCHERS_KEY, "next-number", type],
    queryFn: async () => {
      const response = await api.get<{
        nextNumber: string;
        sequentialNumber: number;
      }>(`/vouchers/next-number`, {
        params: { type },
      });
      return response.data;
    },
    staleTime: 30000, // 30 seconds - numbers can change quickly
  });

  return {
    nextNumber: data?.nextNumber || null,
    sequentialNumber: data?.sequentialNumber || null,
    loading: isLoading,
    error: error?.message || null,
  };
}
