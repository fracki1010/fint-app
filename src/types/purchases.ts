export type PurchaseStatus =
  | "DRAFT"
  | "CONFIRMED"
  | "RECEIVED"
  | "CANCELLED";

export type PaymentCondition = "CASH" | "CREDIT";

export interface PurchaseItem {
  _id?: string;
  supplyItemId: string;
  quantity: number;
  unitCost: number;
  lineTotal: number;
}

export interface Purchase {
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
  createdAt?: string;
  updatedAt?: string;
}
