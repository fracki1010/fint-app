import { SVGProps } from "react";

export type IconSvgProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

export interface Client {
  _id: string;
  name: string;
  phone: string;
  taxId?: string;
  /** @deprecated: Use account balance from entries */
  debt?: number;
  creditLimit?: number;
  email?: string;
  address?: string;
  fiscalAddress?: string;
  company?: string;
  notes?: string;
  priceList?: PriceTier;
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

export type PriceTier = "retail" | "wholesale" | "distributor";

export interface PriceTiers {
  retail?: number;
  wholesale?: number;
  distributor?: number;
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
  priceTiers?: PriceTiers;
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

export type PaymentStatus = "PENDING" | "PAID" | "PARTIAL";

export interface Purchase {
  _id: string;
  supplier: Client | string;
  date: string;
  status: PurchaseStatus;
  paymentCondition: PaymentCondition;
  paymentStatus?: PaymentStatus;
  paymentMethod?: string;
  paidAt?: string | null;
  paidAmount?: number;
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
  totalDebt?: number;
  totalPaid?: number;
  aging?: {
    current: number;
    days30: number;
    days60: number;
    days90plus: number;
  };
  pendingPurchases?: Array<{
    _id: string;
    date: string;
    total: number;
    paidAmount?: number;
    paymentStatus: string;
    paymentCondition: string;
    status: string;
  }>;
}

// ── Cuenta Corriente Cliente ──────────────────────────────────────────

export type ClientEntryType = "CHARGE" | "PAYMENT" | "CREDIT_NOTE" | "DEBIT_NOTE";

export type ClientEntryStatus = "pending" | "partial" | "paid" | "cancelled";

export interface Allocation {
  entryId: string;
  amount: number;
  date: string;
}

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
  // --- Reconciliation Fields (PR 1: Core Reconciliation) ---
  dueDate?: string | null;
  remainingAmount?: number | null;
  status?: ClientEntryStatus | null;
  allocations?: Allocation[];
}

export interface ClientAccount {
  entries: ClientAccountEntry[];
  balance: number;
}

// --- Payment Allocation Types ---

export interface PaymentAllocationRequest {
  amount: number;
  paymentMethod?: string;
  reference?: string;
  notes?: string;
  allocations?: { entryId: string; amount: number }[];
}

export interface PaymentAllocationResponse {
  success: boolean;
  paymentEntry: ClientAccountEntry;
  allocations: Allocation[];
  affectedCharges: {
    entryId: string;
    amount: number;
    previousRemaining: number;
    newRemaining: number;
    status: ClientEntryStatus;
  }[];
  unallocatedAmount: number;
}

export interface ClientBalanceResponse {
  clientId: string;
  balance: number;
  formattedBalance: string;
}

export interface PendingChargesResponse {
  clientId: string;
  charges: (ClientAccountEntry & {
    remainingAmount: number;
    allocatedAmount: number;
  })[];
  totalPending: number;
}

// ── Aging Types ──────────────────────────────────────────────────────────

export interface AgingBucket {
  bucket: "current" | "1-30" | "31-60" | "61-90" | "90+";
  total: number;
  count: number;
  entries: Array<{
    _id: string;
    date: string;
    dueDate: string;
    amount: number;
    remainingAmount: number;
    daysOverdue: number;
  }>;
}

export interface ClientAgingReport {
  clientId: string;
  clientName: string;
  clientPhone?: string;
  creditLimit?: number;
  totalOutstanding: number;
  buckets: {
    current: number;
    "1-30": number;
    "31-60": number;
    "61-90": number;
    "90+": number;
  };
  entries: AgingBucket[];
  generatedAt: string;
}

export interface AllClientsAgingReport {
  clients: Array<{
    clientId: string;
    clientName: string;
    clientPhone?: string;
    creditLimit?: number;
    totalOutstanding: number;
    buckets: {
      current: number;
      "1-30": number;
      "31-60": number;
      "61-90": number;
      "90+": number;
    };
  }>;
  totals: {
    current: number;
    "1-30": number;
    "31-60": number;
    "61-90": number;
    "90+": number;
    totalOutstanding: number;
  };
  generatedAt: string;
}

export interface CreditStatus {
  clientId: string;
  clientName: string;
  creditLimit: number;
  currentBalance: number;
  remainingCredit: number | null;
  utilizationPercentage: number;
  status: "ok" | "near_limit" | "over_limit" | "no_limit";
  isNearLimit: boolean;
  isOverLimit: boolean;
}

export interface ReceivablesSummary {
  summary: {
    totalReceivables: number;
    totalEntries: number;
    overdueAmount: number;
    currentAmount: number;
  };
  agingSummary: {
    current: number;
    "1-30": number;
    "31-60": number;
    "61-90": number;
    "90+": number;
    totalOutstanding: number;
  };
  topOverdueClients: Array<{
    clientId: string;
    clientName: string;
    clientPhone: string;
    overdueAmount: number;
    overdueCount: number;
    oldestDueDate: string;
    daysOverdue: number;
  }>;
  creditAlerts: Array<{
    clientId: string;
    clientName: string;
    creditLimit: number;
    currentBalance: number;
    utilizationPercentage: number;
    status: "near_limit" | "over_limit";
  }>;
  generatedAt: string;
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

export type PaymentMethod = "cash" | "card" | "transfer" | "mercadopago" | "check" | "other";

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

// ── Settings ──────────────────────────────────────────────────────────

export interface PriceTierConfig {
  retail: { name: string; enabled: boolean };
  wholesale: { name: string; enabled: boolean };
  distributor: { name: string; enabled: boolean };
}

// ── Bulk Import Types ─────────────────────────────────────────────────

export * from "./bulkImport";

// ── Voucher Types ──────────────────────────────────────────────────────

export type VoucherType = 'invoice' | 'delivery_note' | 'receipt';
export type VoucherStatus = 'active' | 'voided';

export interface Voucher {
  _id: string;
  order: string;
  type: VoucherType;
  number: string;
  sequentialNumber: number;
  filePath: string;
  fileUrl?: string;
  status: VoucherStatus;
  voidReason?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface VoucherCounter {
  _id: string;
  tenant: string;
  type: VoucherType;
  prefix: string;
  lastNumber: number;
  year: number;
}
