import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@shared/api/axios';
import type {
  BankAccount,
  BankTransaction,
  CreateBankAccountRequest,
  UpdateBankAccountRequest,
  CreateBankTransactionRequest,
  UpdateBankTransactionRequest,
  BankTransactionFilters,
  CsvPreviewData,
  CsvImportData,
  ReconciliationData,
  ConfirmReconciliationResult,
  MatchTransactionRequest,
  ApiResponse,
  ApiListResponse,
  ApiMessageResponse,
} from '../types/banking';

const BANKING_KEY = 'banking';

// ── Bank Account Hooks ──

/**
 * Hook to list all bank accounts for the current tenant
 */
export function useBankAccounts() {
  return useQuery({
    queryKey: [BANKING_KEY, 'accounts'],
    queryFn: async () => {
      const response = await api.get<ApiListResponse<BankAccount>>('/banking/accounts');
      return response.data.data;
    },
  });
}

/**
 * Hook to get a single bank account by ID
 */
export function useBankAccount(accountId: string | undefined) {
  return useQuery({
    queryKey: [BANKING_KEY, 'accounts', accountId],
    enabled: !!accountId,
    queryFn: async () => {
      const response = await api.get<ApiResponse<BankAccount>>(`/banking/accounts/${accountId}`);
      return response.data.data;
    },
  });
}

/**
 * Hook to create a new bank account
 */
export function useCreateBankAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateBankAccountRequest) => {
      const response = await api.post<ApiResponse<BankAccount>>('/banking/accounts', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BANKING_KEY, 'accounts'] });
    },
  });
}

/**
 * Hook to update a bank account
 */
export function useUpdateBankAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ accountId, data }: { accountId: string; data: UpdateBankAccountRequest }) => {
      const response = await api.put<ApiResponse<BankAccount>>(`/banking/accounts/${accountId}`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BANKING_KEY, 'accounts'] });
    },
  });
}

/**
 * Hook to toggle a bank account's active status
 */
export function useToggleBankAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (accountId: string) => {
      const response = await api.patch<ApiMessageResponse & { data: BankAccount }>(
        `/banking/accounts/${accountId}/toggle`,
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BANKING_KEY, 'accounts'] });
    },
  });
}

// ── Bank Transaction Hooks ──

/**
 * Hook to list transactions for a bank account with optional filters
 */
export function useBankTransactions(
  accountId: string | undefined,
  filters?: BankTransactionFilters,
) {
  const queryParams = new URLSearchParams();
  if (accountId) queryParams.set('bankAccount', accountId);
  if (filters?.dateFrom) queryParams.set('dateFrom', filters.dateFrom);
  if (filters?.dateTo) queryParams.set('dateTo', filters.dateTo);
  if (filters?.status) queryParams.set('status', filters.status);
  if (filters?.type) queryParams.set('type', filters.type);

  const queryString = queryParams.toString();

  return useQuery({
    queryKey: [BANKING_KEY, 'transactions', queryString],
    enabled: !!accountId,
    queryFn: async () => {
      const response = await api.get<ApiListResponse<BankTransaction>>(
        `/banking/transactions?${queryString}`,
      );
      return response.data.data;
    },
  });
}

/**
 * Hook to create a new bank transaction manually
 */
export function useCreateBankTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateBankTransactionRequest) => {
      const response = await api.post<ApiResponse<BankTransaction>>(
        '/banking/transactions',
        data,
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BANKING_KEY, 'transactions'] });
    },
  });
}

/**
 * Hook to update a bank transaction
 */
export function useUpdateBankTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      transactionId,
      data,
    }: {
      transactionId: string;
      data: UpdateBankTransactionRequest;
    }) => {
      const response = await api.put<ApiResponse<BankTransaction>>(
        `/banking/transactions/${transactionId}`,
        data,
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BANKING_KEY, 'transactions'] });
    },
  });
}

// ── CSV Import Hooks ──

/**
 * Hook to preview a CSV file (parse only, no insert)
 */
export function usePreviewCsv(accountId: string) {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post<ApiResponse<CsvPreviewData>>(
        `/banking/accounts/${accountId}/import-preview`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        },
      );
      return response.data.data;
    },
    onSuccess: () => {
      // Don't invalidate queries here — preview is a read-only parse
    },
  });
}

/**
 * Hook to confirm CSV import (parse + bulk insert)
 */
export function useImportCsv(accountId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post<ApiResponse<CsvImportData>>(
        `/banking/accounts/${accountId}/import`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        },
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BANKING_KEY, 'transactions'] });
      queryClient.invalidateQueries({ queryKey: [BANKING_KEY, 'accounts'] });
    },
  });
}

// ── Reconciliation Hooks ──

/**
 * Hook to fetch reconciliation data for a bank account within a date range
 */
export function useReconciliationData(
  accountId: string | undefined,
  dateFrom: string,
  dateTo: string,
) {
  const queryParams = new URLSearchParams();
  if (dateFrom) queryParams.set('dateFrom', dateFrom);
  if (dateTo) queryParams.set('dateTo', dateTo);

  const queryString = queryParams.toString();

  return useQuery({
    queryKey: [BANKING_KEY, 'reconciliation', accountId, dateFrom, dateTo],
    enabled: !!accountId && !!dateFrom && !!dateTo,
    queryFn: async () => {
      const response = await api.get<ApiResponse<ReconciliationData>>(
        `/banking/accounts/${accountId}/reconciliation?${queryString}`,
      );
      return response.data.data;
    },
  });
}

/**
 * Hook to match a bank transaction to an internal record
 */
export function useMatchTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      transactionId,
      data,
    }: {
      transactionId: string;
      data: MatchTransactionRequest;
    }) => {
      const response = await api.put<ApiResponse<BankTransaction>>(
        `/banking/transactions/${transactionId}/match`,
        data,
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BANKING_KEY, 'reconciliation'] });
      queryClient.invalidateQueries({ queryKey: [BANKING_KEY, 'transactions'] });
      queryClient.invalidateQueries({ queryKey: [BANKING_KEY, 'accounts'] });
    },
  });
}

/**
 * Hook to unmatch a reconciled bank transaction
 */
export function useUnmatchTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (transactionId: string) => {
      const response = await api.put<ApiResponse<BankTransaction>>(
        `/banking/transactions/${transactionId}/unmatch`,
        {},
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BANKING_KEY, 'reconciliation'] });
      queryClient.invalidateQueries({ queryKey: [BANKING_KEY, 'transactions'] });
      queryClient.invalidateQueries({ queryKey: [BANKING_KEY, 'accounts'] });
    },
  });
}

/**
 * Hook to confirm reconciliation for a bank account
 */
export function useConfirmReconciliation(accountId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (endDate: string) => {
      const response = await api.post<ApiResponse<ConfirmReconciliationResult>>(
        `/banking/accounts/${accountId}/confirm-reconciliation`,
        { endDate },
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BANKING_KEY, 'accounts'] });
      queryClient.invalidateQueries({ queryKey: [BANKING_KEY, 'reconciliation'] });
      queryClient.invalidateQueries({ queryKey: [BANKING_KEY, 'transactions'] });
    },
  });
}
