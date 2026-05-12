import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@shared/api/axios";
import type { Receipt } from "@shared/types";

export function useReceipts(purchaseId?: string) {
  return useQuery({
    queryKey: ["receipts", purchaseId],
    queryFn: async () => {
      const response = await api.get<Receipt[]>(`/purchases/${purchaseId}/receipts`);
      return response.data;
    },
    enabled: Boolean(purchaseId),
  });
}

export function useCreateReceipt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      purchaseId,
      data,
    }: {
      purchaseId: string;
      data: {
        date?: string;
        notes?: string;
        items: Array<{
          product: string;
          presentationId?: string;
          quantity: number;
          remittedQty?: number;
          differenceReason?: string;
          notes?: string;
          unitCost: number;
        }>;
      };
    }) => {
      const response = await api.post<Receipt>(
        `/purchases/${purchaseId}/receipts`,
        data,
      );
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["receipts", variables.purchaseId] });
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
      queryClient.invalidateQueries({ queryKey: ["purchase", variables.purchaseId] });
    },
  });
}
