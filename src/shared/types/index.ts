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
  cost?: number;
  equivalentQty: number;
  isActive?: boolean;
  priceTiers?: PriceTiers;
}

export type PriceTier = "retail" | "wholesale" | "distributor" | "premium" | "especial";

export interface PriceTiers {
  retail?: number;
  wholesale?: number;
  distributor?: number;
  premium?: number;
  especial?: number;
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
  defaultPresentationId?: string;
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
export type PaymentCondition = "CASH" | "CREDIT" | "CREDIT_15" | "CREDIT_30" | "CREDIT_45" | "CREDIT_60" | "CREDIT_90";

export interface PurchaseItem {
  supply?: Supply | string;
  product?: Product | string;
  presentationId?: string;
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
  receiptIds?: string[];
  createdBy?: string | null;
  receivedAt?: string | null;
  cancelledAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ReceiptItem {
  product: string | Product;
  presentationId?: string;
  quantity: number;
  remittedQty?: number;
  differenceReason?: "falta" | "sobra" | "dañado" | "sustitución" | "otro" | "";
  notes?: string;
  unitCost: number;
  lineTotal: number;
}

export interface Receipt {
  _id: string;
  purchase: string;
  date: string;
  notes?: string;
  items: ReceiptItem[];
  createdBy?: string;
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
  // Reconciliation fields
  dueDate?: string | null;
  remainingAmount?: number | null;
  status?: "pending" | "partial" | "paid" | "cancelled" | null;
  allocations?: Array<{
    entryId: string;
    amount: number;
    date: string;
  }>;
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

// ── Bill of Materials ────────────────────────────────────────────────

export interface BomIngredient {
    /** @deprecated Use `product` instead */
  supply?: Supply | string;
  product?: Product | string;
  presentationId?: string;
  quantity: number;
}

export interface BillOfMaterial {
  _id: string;
  name: string;
  product?: Product | string | null;
  presentationId?: string;
  yieldQuantity: number;
  ingredients: BomIngredient[];
  notes?: string;
  isActive: boolean;
  deletedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

/** @deprecated Use BillOfMaterial instead */
export type Recipe = BillOfMaterial;
/** @deprecated Use BomIngredient instead */
export type RecipeIngredient = BomIngredient;

export type PaymentMethod =
  | "cash" | "card" | "mercadopago" | "transfer"
  | "naranja_x" | "uala" | "brubank" | "santander"
  | "supervielle" | "frances" | "bna" | "prex" | "cocos" | "galicia"
  | "lemon" | "astropay" | "modo"
  | "check" | "other";

export interface QuickSaleItem {
  product: Product;
  presentation?: Presentation;
  quantity: number;
  priceTier?: PriceTier;
}

export interface ProduceResult {
  billOfMaterial: { _id: string; name: string };
  /** @deprecated Use `billOfMaterial` instead */
  recipe: { _id: string; name: string };
  batchesProduced: number;
  unitsProduced: number;
  ingredientsUsed: number;
}

export interface ProductionLog {
  _id: string;
  billOfMaterial: string;
  billOfMaterialName: string;
  /** @deprecated Use `billOfMaterial` instead */
  recipe: string;
  /** @deprecated Use `billOfMaterialName` instead */
  recipeName: string;
  batchesProduced: number;
  unitsProduced: number;
  notes?: string;
  producedBy?: string | null;
  createdAt?: string;
}

// ── Settings ──────────────────────────────────────────────────────────

export interface PriceTierConfig {
  retail: { name: string; enabled: boolean; percentage?: number };
  wholesale: { name: string; enabled: boolean; percentage?: number };
  distributor: { name: string; enabled: boolean; percentage?: number };
  premium?: { name: string; enabled: boolean; percentage?: number };
  especial?: { name: string; enabled: boolean; percentage?: number };
}

export const DEFAULT_TIER_PERCENTAGES: Record<PriceTier, number> = {
  retail: 100,
  wholesale: 85,
  distributor: 75,
  premium: 120,
  especial: 90,
};

// ── Inventory Snapshots ─────────────────────────────────────────────────
export interface InventorySnapshotItem {
  productId: string;
  productName: string;
  sku: string;
  stock: number;
  costPrice: number;
  stockValue: number;
}

export interface InventorySnapshot {
  _id: string;
  snapshotDate: string;
  stockValue: number;
  productCount: number;
  items?: InventorySnapshotItem[];
  triggeredBy: "manual" | "auto_close";
  createdAt: string;
}

export interface InventorySnapshotListResponse {
  snapshots: InventorySnapshot[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
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

// ── Treasury / Cash Management ───────────────────────────────────────

export interface TreasuryOverview {
  moneyIn: {
    total: number;
    byMethod: Record<string, number>;
    transactionCount: number;
  };
  moneyOut: {
    total: number;
    byMethod: Record<string, number>;
    transactionCount: number;
  };
  netCashFlow: number;
  balances: {
    bankAccounts: Array<{
      _id: string;
      name: string;
      bank: string;
      currentBalance: number;
    }>;
    cashInRegister: number;
    totalBalance: number;
  };
}

export interface CashFlowPoint {
  period: string;
  moneyIn: number;
  moneyOut: number;
  net: number;
}

export interface TreasuryCashFlow {
  series: CashFlowPoint[];
  totals: {
    moneyIn: number;
    moneyOut: number;
    net: number;
  };
}

// ── Cost Centers ──────────────────────────────────────────────────────

export interface CostCenter {
  _id: string;
  name: string;
  description?: string;
  isActive: boolean;
}

export interface CostCenterReportRow {
  _id: string | null;
  name: string;
  revenue: number;
  orderCount: number;
  costs: number;
  purchaseCount: number;
  margin: number;
}

export interface CostCenterReport {
  rows: CostCenterReportRow[];
  totals: {
    revenue: number;
    costs: number;
    margin: number;
  };
  dateRange: { from: string; to: string };
}

// ── Quotes / Presupuestos ──────────────────────────────────────────────

export type QuoteStatus = "DRAFT" | "SENT" | "ACCEPTED" | "CONVERTED" | "REJECTED";

export interface QuoteItem {
  product: string;
  productId?: string;
  presentationId?: string;
  quantity: number;
  price: number;
  lineTotal: number;
}

export interface Quote {
  _id: string;
  quoteNumber: string;
  client: { _id: string; name?: string; phone?: string } | string;
  date: string;
  expirationDate?: string;
  status: QuoteStatus;
  items: QuoteItem[];
  subtotal: number;
  tax: number;
  total: number;
  notes?: string;
  createdBy?: { _id: string; fullName: string };
  convertedToOrder?: string;
  createdAt: string;
}

// ── Payment Orders (Órdenes de Pago) ─────────────────────────────────

export interface PaymentOrderItem {
  purchase: string;
  amount: number;
}

export interface PaymentOrder {
  _id: string;
  supplier: { _id: string; name: string; taxId?: string } | string;
  date: string;
  paymentMethod: string;
  reference: string;
  notes: string;
  status: "DRAFT" | "PAID" | "CANCELLED";
  items: PaymentOrderItem[];
  total: number;
  paidAt?: string;
  createdAt: string;
  createdBy?: { _id: string; fullName: string };
}

export interface CreateQuoteRequest {
  client: string;
  date: string;
  expirationDate?: string;
  items: { product: string; productId?: string; quantity: number; price: number; lineTotal: number }[];
  subtotal: number;
  tax: number;
  total: number;
  notes?: string;
}

// ── IVA Reports (Libro IVA) ──────────────────────────────────────────

export interface IvaReportPeriod {
  period: string;
  netAmount: number;
  tax: number;
  total: number;
  count: number;
}

export interface IvaReportDetail {
  date: string;
  supplier?: { name: string; taxId?: string };
  client?: { name: string; taxId?: string };
  netAmount: number;
  tax: number;
  total: number;
  purchaseId?: string;
  orderId?: string;
}

export interface IvaReport {
  periods: IvaReportPeriod[];
  totals: { netAmount: number; tax: number; total: number };
  details: IvaReportDetail[];
  dateRange: { from: string; to: string };
}
