import api from "@/api/axios";
import { SupplyItem, SupplyStockMovement, SupplyMovementType } from "@/types/supplies";

export interface SupplyListParams {
  search?: string;
  active?: boolean;
}

export interface SupplyPayload {
  name: string;
  sku?: string;
  unit: SupplyItem["unit"];
  currentStock?: number;
  minStock?: number;
  referenceCost?: number;
  isActive?: boolean;
}

export interface SupplyMovementPayload {
  type: SupplyMovementType;
  quantity: number;
  reason: string;
  sourceType?: string;
  sourceId?: string;
}

export async function getSupplies(params?: SupplyListParams) {
  const response = await api.get<SupplyItem[]>("/supplies", { params });

  return response.data;
}

export async function createSupply(payload: SupplyPayload) {
  const response = await api.post<SupplyItem>("/supplies", payload);

  return response.data;
}

export async function updateSupply(id: string, payload: Partial<SupplyPayload>) {
  const response = await api.patch<SupplyItem>(`/supplies/${id}`, payload);

  return response.data;
}

export async function getSupplyMovements(supplyItemId: string) {
  const response = await api.get<SupplyStockMovement[]>(
    `/supplies/${supplyItemId}/movements`,
  );

  return response.data;
}

export async function createSupplyMovement(
  supplyItemId: string,
  payload: SupplyMovementPayload,
) {
  const response = await api.post<SupplyStockMovement>(
    `/supplies/${supplyItemId}/movements`,
    payload,
  );

  return response.data;
}
