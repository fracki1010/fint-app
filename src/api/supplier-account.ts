import api from "@/api/axios";
import { SupplierAccountEntry, SupplierAccountEntryType } from "@/types/supplier-account";

export interface SupplierStatementParams {
  from?: string;
  to?: string;
}

export interface SupplierPaymentPayload {
  date: string;
  amount: number;
  paymentMethod?: string;
  reference?: string;
  notes?: string;
}

export interface SupplierEntryPayload {
  date: string;
  type: SupplierAccountEntryType;
  amount: number;
  purchaseId?: string;
  paymentMethod?: string;
  reference?: string;
  notes?: string;
}

export interface SupplierAccountResponse {
  entries: SupplierAccountEntry[];
  balance: number;
}

export async function getSupplierAccount(supplierId: string) {
  const response = await api.get<SupplierAccountResponse>(
    `/suppliers/${supplierId}/account`,
  );

  return response.data;
}

export async function createSupplierPayment(
  supplierId: string,
  payload: SupplierPaymentPayload,
) {
  const response = await api.post<SupplierAccountEntry>(
    `/suppliers/${supplierId}/account/payment`,
    payload,
  );

  return response.data;
}

export async function createSupplierAccountEntry(
  supplierId: string,
  payload: SupplierEntryPayload,
) {
  const response = await api.post<SupplierAccountEntry>(
    `/suppliers/${supplierId}/account/entry`,
    payload,
  );

  return response.data;
}

export async function getSupplierStatement(
  supplierId: string,
  params?: SupplierStatementParams,
) {
  const response = await api.get<SupplierAccountResponse>(
    `/suppliers/${supplierId}/account/statement`,
    { params },
  );

  return response.data;
}
