export type SupplyUnit = "kg" | "g" | "lt" | "ml" | "u";

export type SupplyMovementType = "IN" | "OUT" | "ADJUST";

export interface SupplyItem {
  _id: string;
  name: string;
  sku?: string;
  unit: SupplyUnit;
  currentStock: number;
  minStock: number;
  referenceCost?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface SupplyStockMovement {
  _id: string;
  supplyItemId: string;
  type: SupplyMovementType;
  quantity: number;
  reason: string;
  sourceType?: string;
  sourceId?: string;
  createdBy?: string;
  createdAt?: string;
}
