import { SVGProps } from "react";

export type IconSvgProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

export interface Client {
  _id: string;
  name: string;
  phone: string;
  taxId?: string;
  debt?: number;
  email?: string;
  address?: string;
  fiscalAddress?: string;
  company?: string;
  notes?: string;
  isActive?: boolean;
  deletedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Product {
  _id: string;
  sku?: string;
  name: string;
  description?: string;
  price: number;
  costPrice?: number;
  stock: number;
  minStock?: number;
  category?: string;
  categories?: string[];
  unitOfMeasure?: string;
  isActive?: boolean;
  deletedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

// ── Insumos (Supplies) ──────────────────────────────────────────────

export type SupplyUnit =
  | "unidad"
  | "kg"
  | "g"
  | "litro"
  | "ml"
  | "metro"
  | "caja"
  | "paquete";

export interface Supply {
  _id: string;
  sku?: string | null;
  name: string;
  unit: SupplyUnit;
  currentStock: number;
  minStock: number;
  referenceCost: number;
  isActive: boolean;
  deletedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export type SupplyMovementType = "IN" | "OUT" | "ADJUST";

export interface SupplyMovement {
  _id: string;
  supply: Supply | string;
  type: SupplyMovementType;
  quantity: number;
  stockBefore: number;
  stockAfter: number;
  reason: string;
  sourceType: string;
  sourceId?: string | null;
  createdBy?: string | null;
  createdAt?: string;
}

// ── Compras (Purchases) ─────────────────────────────────────────────

export type PurchaseStatus = "DRAFT" | "CONFIRMED" | "RECEIVED" | "CANCELLED";
export type PaymentCondition = "CASH" | "CREDIT";

export interface PurchaseItem {
  supply: Supply | string;
  quantity: number;
  unitCost: number;
  lineTotal: number;
}

export interface Purchase {
  _id: string;
  supplier: Client | string;
  date: string;
  status: PurchaseStatus;
  paymentCondition: PaymentCondition;
  subtotal: number;
  tax: number;
  total: number;
  notes: string;
  items: PurchaseItem[];
  createdBy?: string | null;
  receivedAt?: string | null;
  cancelledAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

// ── Cuenta Corriente Proveedor (Debe / Haber) ───────────────────────

export type SupplierEntryType =
  | "CHARGE"
  | "PAYMENT"
  | "CREDIT_NOTE"
  | "DEBIT_NOTE";

export interface SupplierAccountEntry {
  _id: string;
  supplier: string;
  date: string;
  type: SupplierEntryType;
  amount: number;
  sign: 1 | -1;
  purchase?: string | null;
  paymentMethod: string;
  reference: string;
  notes: string;
  createdBy?: string | null;
  createdAt?: string;
}

export interface SupplierAccount {
  entries: SupplierAccountEntry[];
  balance: number;
}

// ── Recetas ───────────────────────────────────────────────────────────

export interface RecipeIngredient {
  supply: Supply | string;
  quantity: number;
}

export interface Recipe {
  _id: string;
  name: string;
  product?: Product | string | null;
  yieldQuantity: number;
  ingredients: RecipeIngredient[];
  notes?: string;
  isActive: boolean;
  deletedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProduceResult {
  recipe: { _id: string; name: string };
  batchesProduced: number;
  unitsProduced: number;
  ingredientsUsed: number;
}
