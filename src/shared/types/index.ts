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

export interface Supplier {
  _id: string;
  name: string;
  company?: string;
  taxId?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  isActive?: boolean;
  deletedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Presentation {
  _id: string;
  sku?: string;
  barcode?: string;
  name: string;
  unitOfMeasure: string;
  price: number;
  equivalentQty: number;
  isActive?: boolean;
}

export interface Product {
  _id: string;
  sku?: string;
  barcode?: string;
  name: string;
  description?: string;
  price: number;
  costPrice?: number;
  stock: number;
  minStock?: number;
  category?: string;
  categories?: string[];
  unitOfMeasure?: string;
  type?: "raw_material" | "finished" | "both";
  purchaseUnit?: string;
  purchaseEquivalentQty?: number;
  costLocked?: boolean;
  presentations?: Presentation[];
  matchedPresentation?: Presentation;
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

/** @deprecated Use `Product` with `type: "raw_material"` instead */
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

/** @deprecated Use `StockMovement` instead */
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
  supply?: Supply | string;
  product?: Product | string;
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

// ── Cuenta Corriente Cliente ──────────────────────────────────────────

export type ClientEntryType = "CHARGE" | "PAYMENT" | "CREDIT_NOTE" | "DEBIT_NOTE";

export interface ClientAccountEntry {
  _id: string;
  client: string;
  date: string;
  type: ClientEntryType;
  amount: number;
  sign: 1 | -1;
  order?: string | null;
  paymentMethod: string;
  reference: string;
  notes: string;
  createdBy?: string | null;
  createdAt?: string;
}

export interface ClientAccount {
  entries: ClientAccountEntry[];
  balance: number;
}

// ── Equipo ────────────────────────────────────────────────────────────

export type UserRole = "admin" | "ventas" | "deposito" | "contabilidad" | "lectura";

export interface TeamMember {
  _id: string;
  fullName: string;
  email: string;
  role: UserRole;
  roleLabel: string;
  isActive: boolean;
  lastLoginAt?: string | null;
  createdAt?: string;
}

// ── Recetas ───────────────────────────────────────────────────────────

export interface RecipeIngredient {
    /** @deprecated Use `product` instead */
  supply?: Supply | string;
  product?: Product | string;
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

export type PaymentMethod = "cash" | "card" | "transfer";

export interface QuickSaleItem {
  product: Product;
  presentation?: Presentation;
  quantity: number;
}

export interface ProduceResult {
  recipe: { _id: string; name: string };
  batchesProduced: number;
  unitsProduced: number;
  ingredientsUsed: number;
}

export interface ProductionLog {
  _id: string;
  recipe: string;
  recipeName: string;
  batchesProduced: number;
  unitsProduced: number;
  notes?: string;
  producedBy?: string | null;
  createdAt?: string;
}

// ── Bulk Import Types ─────────────────────────────────────────────────

export * from "./bulkImport";
