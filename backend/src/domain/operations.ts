export type SupplyMovementType = "IN" | "OUT" | "ADJUST";

export type PaymentCondition = "CASH" | "CREDIT";
export type PurchaseStatus = "DRAFT" | "CONFIRMED" | "RECEIVED" | "CANCELLED";

export type SupplierAccountEntryType =
  | "CHARGE"
  | "PAYMENT"
  | "CREDIT_NOTE"
  | "DEBIT_NOTE";

export type SupplyItem = {
  _id: string;
  name: string;
  sku?: string;
  unit: string;
  currentStock: number;
  minStock: number;
  referenceCost?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type SupplyStockMovement = {
  _id: string;
  supplyItemId: string;
  type: SupplyMovementType;
  quantity: number;
  reason: string;
  sourceType?: string;
  sourceId?: string;
  createdBy?: string;
  createdAt: string;
};

export type PurchaseItem = {
  _id: string;
  supplyItemId: string;
  quantity: number;
  unitCost: number;
  lineTotal: number;
};

export type Purchase = {
  _id: string;
  supplierId: string;
  date: string;
  status: PurchaseStatus;
  paymentCondition: PaymentCondition;
  subtotal: number;
  tax: number;
  total: number;
  notes?: string;
  items: PurchaseItem[];
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
};

export type SupplierAccountEntry = {
  _id: string;
  supplierId: string;
  date: string;
  type: SupplierAccountEntryType;
  amount: number;
  sign: 1 | -1;
  purchaseId?: string;
  paymentMethod?: string;
  reference?: string;
  notes?: string;
  createdBy?: string;
  createdAt: string;
};
