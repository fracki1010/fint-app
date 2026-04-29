import api from "@/api/axios";
import { Purchase, PaymentCondition, PurchaseItem } from "@/types/purchases";

export interface PurchaseListParams {
  supplierId?: string;
  status?: Purchase["status"];
  from?: string;
  to?: string;
}

export interface PurchasePayload {
  supplierId: string;
  date: string;
  paymentCondition: PaymentCondition;
  subtotal: number;
  tax: number;
  total: number;
  notes?: string;
  items: PurchaseItem[];
}

export async function getPurchases(params?: PurchaseListParams) {
  const response = await api.get<Purchase[]>("/purchases", { params });

  return response.data;
}

export async function getPurchaseById(id: string) {
  const response = await api.get<Purchase>(`/purchases/${id}`);

  return response.data;
}

export async function createPurchase(payload: PurchasePayload) {
  const response = await api.post<Purchase>("/purchases", payload);

  return response.data;
}

export async function updatePurchase(id: string, payload: Partial<PurchasePayload>) {
  const response = await api.patch<Purchase>(`/purchases/${id}`, payload);

  return response.data;
}

export async function confirmPurchase(id: string) {
  const response = await api.post<Purchase>(`/purchases/${id}/confirm`);

  return response.data;
}

export async function receivePurchase(id: string) {
  const response = await api.post<Purchase>(`/purchases/${id}/receive`);

  return response.data;
}

export async function cancelPurchase(id: string) {
  const response = await api.post<Purchase>(`/purchases/${id}/cancel`);

  return response.data;
}
