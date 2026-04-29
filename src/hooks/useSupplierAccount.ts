import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createSupplierAccountEntry,
  createSupplierPayment,
  getSupplierAccount,
  getSupplierStatement,
  type SupplierEntryPayload,
  type SupplierPaymentPayload,
  type SupplierStatementParams,
} from "@/api/supplier-account";

const SUPPLIER_ACCOUNT_QUERY_KEY = ["supplierAccount"] as const;

export function useSupplierAccount(supplierId?: string, options?: { enabled?: boolean }) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [...SUPPLIER_ACCOUNT_QUERY_KEY, supplierId],
    enabled: Boolean(supplierId) && (options?.enabled ?? true),
    queryFn: () => getSupplierAccount(supplierId as string),
  });

  const invalidateSupplierAccount = (id: string) => {
    queryClient.invalidateQueries({ queryKey: [...SUPPLIER_ACCOUNT_QUERY_KEY, id] });
    queryClient.invalidateQueries({ queryKey: ["supplierAccountStatement", id] });
  };

  const paymentMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: SupplierPaymentPayload;
    }) => createSupplierPayment(id, payload),
    onSuccess: (_, variables) => {
      invalidateSupplierAccount(variables.id);
    },
  });

  const entryMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: SupplierEntryPayload;
    }) => createSupplierAccountEntry(id, payload),
    onSuccess: (_, variables) => {
      invalidateSupplierAccount(variables.id);
    },
  });

  return {
    entries: query.data?.entries ?? [],
    balance: query.data?.balance ?? 0,
    loading: query.isLoading,
    error: query.error?.message ?? null,
    refetch: query.refetch,
    createSupplierPayment: paymentMutation.mutateAsync,
    createSupplierAccountEntry: entryMutation.mutateAsync,
    isCreatingPayment: paymentMutation.isPending,
    isCreatingEntry: entryMutation.isPending,
  };
}

export function useSupplierStatement(
  supplierId?: string,
  params?: SupplierStatementParams,
  options?: { enabled?: boolean },
) {
  const query = useQuery({
    queryKey: ["supplierAccountStatement", supplierId, params],
    enabled: Boolean(supplierId) && (options?.enabled ?? true),
    queryFn: () => getSupplierStatement(supplierId as string, params),
  });

  return {
    entries: query.data?.entries ?? [],
    balance: query.data?.balance ?? 0,
    loading: query.isLoading,
    error: query.error?.message ?? null,
    refetch: query.refetch,
  };
}
