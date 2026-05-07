import { useState } from "react";
import {
  Loader2,
  ShoppingBag,
  ArrowUpRight,
  Building2,
  Calendar,
  Receipt,
  PackageCheck,
  FileText,
  Clock,
  BadgeCheck,
  Truck,
  Ban,
  CreditCard,
  CheckCircle2,
  XCircle,
  DollarSign,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Purchase, PurchaseStatus, PaymentCondition, PaymentStatus } from "@shared/types";
import { formatCurrency } from "@shared/utils/currency";
import { formatDateShort } from "@shared/utils/date";
import type { PayPurchaseData } from "@features/purchases/hooks/usePurchases";

// ── Constants ──────────────────────────────────────────────────────────

const STATUS_LABELS: Record<PurchaseStatus, string> = {
  DRAFT: "Borrador",
  CONFIRMED: "Confirmada",
  RECEIVED: "Recibida",
  CANCELLED: "Cancelada",
};

const STATUS_COLORS: Record<PurchaseStatus, string> = {
  DRAFT: "bg-amber-400/15 text-amber-500 dark:text-amber-400",
  CONFIRMED: "bg-blue-500/15 text-blue-500 dark:text-blue-400",
  RECEIVED: "bg-emerald-500/15 text-emerald-500 dark:text-emerald-400",
  CANCELLED: "bg-red-500/15 text-red-500 dark:text-red-400",
};

const STATUS_DOTS: Record<PurchaseStatus, string> = {
  DRAFT: "bg-amber-400",
  CONFIRMED: "bg-blue-500",
  RECEIVED: "bg-emerald-500",
  CANCELLED: "bg-red-500",
};

const PAYMENT_LABELS: Record<PaymentCondition, string> = {
  CASH: "Contado",
  CREDIT: "Crédito 30d",
};

const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: "Pendiente",
  PAID: "Pagado",
  PARTIAL: "Parcial",
};

const PAYMENT_STATUS_COLORS: Record<PaymentStatus, string> = {
  PENDING: "bg-gray-500/15 text-gray-500 dark:text-gray-400",
  PAID: "bg-emerald-500/15 text-emerald-500 dark:text-emerald-400",
  PARTIAL: "bg-amber-500/15 text-amber-500 dark:text-amber-400",
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: "Efectivo",
  card: "Tarjeta",
  transfer: "Transferencia",
  mercadopago: "Mercado Pago",
  check: "Cheque",
  other: "Otro",
};

// ── Helpers ─────────────────────────────────────────────────────────────

function getSupplierName(supplier: string | { _id: string; name?: string; company?: string }) {
  if (typeof supplier === "object" && supplier) {
    return supplier.company || supplier.name || "Proveedor desconocido";
  }
  return "Proveedor desconocido";
}

function getSupplierId(supplier: string | { _id: string; name?: string; company?: string }): string | null {
  if (typeof supplier === "object" && supplier) {
    return supplier._id;
  }
  return null;
}

function getSupplyName(supply: string | { _id: string; name?: string; sku?: string | null }) {
  if (typeof supply === "object" && supply) {
    return supply.name || "Insumo";
  }
  return "Insumo";
}

function getProductName(product: string | { _id: string; name?: string; sku?: string | null }) {
  if (typeof product === "object" && product) {
    return product.name || "Producto";
  }
  return "Producto";
}

function getItemName(item: { supply?: any; product?: any }) {
  if (item.product) return getProductName(item.product);
  return getSupplyName(item.supply as any);
}

function formatId(id: string) {
  return `#${id.slice(-6).toUpperCase()}`;
}

// ── Props ───────────────────────────────────────────────────────────────

interface PurchaseDetailPanelProps {
  purchase: Purchase | null;
  loading: boolean;
  currency: string;
  isHeaderCompact: boolean;
  isConfirming: boolean;
  isReceiving: boolean;
  isCancelling: boolean;
  isPaying: boolean;
  onBack: () => void;
  onConfirm: () => void;
  onReceive: () => void;
  onCancel: () => void;
  onPay: (data: PayPurchaseData) => void;
}

// ── Component ───────────────────────────────────────────────────────────

export default function PurchaseDetailPanel({
  purchase: selectedPurchase,
  loading: detailLoading,
  currency,
  isHeaderCompact,
  isConfirming,
  isReceiving,
  isCancelling,
  isPaying,
  onBack,
  onConfirm,
  onReceive,
  onCancel,
  onPay,
}: PurchaseDetailPanelProps) {
  const [showPayModal, setShowPayModal] = useState(false);

  const remaining = selectedPurchase
    ? Math.max(0, selectedPurchase.total - (selectedPurchase.paidAmount || 0))
    : 0;

  const [payData, setPayData] = useState<PayPurchaseData>({
    amount: remaining,
    paymentMethod: "transfer",
  });
  const status = selectedPurchase?.status;

  if (!selectedPurchase) {
    return (
      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col bg-background pb-28 font-sans lg:max-w-4xl lg:pb-8">
        <header
          className={`app-topbar sticky top-0 z-30 transition-all duration-300 ${
            isHeaderCompact ? "px-4 pb-3 pt-3" : "px-6 pb-4 pt-6"
          }`}
        >
          <button
            className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-default-500 hover:text-foreground transition-colors"
            onClick={onBack}
          >
            <ArrowUpRight className="rotate-180" size={14} />
            Volver
          </button>
        </header>
        <div className="flex-1 px-6 pb-28">
          {detailLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-default-400">
              <Loader2 className="mb-4 animate-spin" size={32} />
              <p className="text-sm font-medium">Cargando detalle...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20">
              <ShoppingBag className="mb-4 text-default-300" size={48} />
              <p className="text-sm font-semibold text-foreground">Compra no encontrada</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col bg-background pb-28 font-sans lg:max-w-4xl lg:pb-8">
      <header
        className={`app-topbar sticky top-0 z-30 transition-all duration-300 ${
          isHeaderCompact ? "px-4 pb-3 pt-3" : "px-6 pb-4 pt-6"
        }`}
      >
        <button
          className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-default-500 hover:text-foreground transition-colors"
          onClick={onBack}
        >
          <ArrowUpRight className="rotate-180" size={14} />
          Volver
        </button>
        <p className={`section-kicker transition-all duration-200 ${isHeaderCompact ? "mt-1 text-[10px] opacity-80" : "mt-3 opacity-100"}`}>
          Detalle de Compra
        </p>
        <h1 className={`font-bold tracking-[-0.03em] text-foreground transition-all duration-300 ${
          isHeaderCompact ? "mt-1 text-xl" : "mt-2 text-[28px]"
        }`}>
          {formatId(selectedPurchase._id)}
        </h1>
      </header>

      <div className="flex-1 px-6 pb-28">
        <div className="space-y-5 pt-4">
          {/* Status & payment badges */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.1em] ${STATUS_COLORS[selectedPurchase.status]}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOTS[selectedPurchase.status]}`} />
              {STATUS_LABELS[selectedPurchase.status]}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-default-100 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-default-600">
              <CreditCard size={12} />
              {PAYMENT_LABELS[selectedPurchase.paymentCondition]}
            </span>
            {selectedPurchase.paymentStatus && (
              <span className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.1em] ${PAYMENT_STATUS_COLORS[selectedPurchase.paymentStatus]}`}>
                <DollarSign size={12} />
                {PAYMENT_STATUS_LABELS[selectedPurchase.paymentStatus]}
              </span>
            )}
          </div>

          {/* KPI cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-divider/15 bg-gradient-to-br from-content1 to-content2/60 p-5">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-default-400">
                <Building2 size={13} />
                Proveedor
              </div>
              {(() => {
                const supplierId = getSupplierId(selectedPurchase.supplier);
                const supplierName = getSupplierName(selectedPurchase.supplier);
                return supplierId ? (
                  <Link
                    className="mt-3 block text-lg font-bold text-foreground hover:text-primary transition-colors"
                    to={`/supplier-account/${supplierId}`}
                  >
                    {supplierName}
                    <span className="ml-1.5 text-[10px] font-normal text-primary opacity-0 hover:opacity-100 transition-opacity">→ Ver cuenta</span>
                  </Link>
                ) : (
                  <p className="mt-3 text-lg font-bold text-foreground">{supplierName}</p>
                );
              })()}
              <div className="mt-2 flex items-center gap-1.5 text-[11px] text-default-500">
                <Calendar size={11} />
                {formatDateShort(selectedPurchase.date)}
              </div>
            </div>
            <div className="rounded-2xl border border-blue-500/15 bg-gradient-to-br from-blue-500/5 to-blue-600/5 p-5">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-default-400">
                <Receipt size={13} />
                Importe Total
              </div>
              <p className="mt-3 text-2xl font-bold font-mono text-foreground">
                {formatCurrency(selectedPurchase.total, currency)}
              </p>
              <p className="mt-2 text-[11px] text-default-500">
                {selectedPurchase.items.length} item{selectedPurchase.items.length !== 1 ? "s" : ""}
                {" · "}{formatCurrency(selectedPurchase.subtotal, currency)} subtotal
              </p>
            </div>
          </div>

          {/* Items */}
          <div className="rounded-2xl border border-divider/15 bg-gradient-to-br from-content1 to-content2/40 p-5">
            <h3 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-default-500">
              <PackageCheck size={13} />
              Items de la compra
            </h3>
            <div className="mt-4 space-y-2">
              {selectedPurchase.items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-xl bg-content2/50 px-4 py-3 transition-colors hover:bg-content2/80"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {getItemName(item)}
                    </p>
                    <p className="mt-0.5 text-xs text-default-500 font-mono">
                      {item.quantity} × {formatCurrency(item.unitCost, currency)}
                    </p>
                  </div>
                  <p className="ml-4 text-sm font-bold font-mono text-foreground">
                    {formatCurrency(item.lineTotal, currency)}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-1.5 border-t border-divider/10 pt-4 text-sm">
              <div className="flex justify-between text-default-500">
                <span>Subtotal</span>
                <span className="font-mono font-semibold text-foreground">
                  {formatCurrency(selectedPurchase.subtotal, currency)}
                </span>
              </div>
              <div className="flex justify-between text-default-500">
                <span>Impuesto</span>
                <span className="font-mono font-semibold text-foreground">
                  {formatCurrency(selectedPurchase.tax, currency)}
                </span>
              </div>
              <div className="flex justify-between border-t border-divider/10 pt-1.5 text-base font-bold text-foreground">
                <span>Total</span>
                <span className="font-mono">{formatCurrency(selectedPurchase.total, currency)}</span>
              </div>
            </div>
          </div>

          {/* Payment info */}
          {(selectedPurchase.paymentMethod || (selectedPurchase.paidAmount && selectedPurchase.paidAmount > 0) || selectedPurchase.paymentStatus === "PARTIAL") && (
            <div className="rounded-2xl border border-divider/15 bg-gradient-to-br from-content1 to-content2/40 p-5">
              <h3 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-default-500">
                <DollarSign size={13} />
                Información de pago
              </h3>
              <div className="mt-3 space-y-2">
                {selectedPurchase.paymentMethod && (
                  <div className="flex justify-between text-sm">
                    <span className="text-default-500">Método</span>
                    <span className="font-semibold text-foreground capitalize">
                      {PAYMENT_METHOD_LABELS[selectedPurchase.paymentMethod] || selectedPurchase.paymentMethod}
                    </span>
                  </div>
                )}
                {(selectedPurchase.paidAmount || 0) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-default-500">Pagado</span>
                    <span className="font-semibold font-mono text-foreground">
                      {formatCurrency(selectedPurchase.paidAmount || 0, currency)}
                    </span>
                  </div>
                )}
                {selectedPurchase.paymentStatus === "PARTIAL" && (
                  <div className="flex justify-between text-sm">
                    <span className="text-default-500">Saldo pendiente</span>
                    <span className="font-semibold font-mono text-amber-500">
                      {formatCurrency(selectedPurchase.total - (selectedPurchase.paidAmount || 0), currency)}
                    </span>
                  </div>
                )}
                {selectedPurchase.paidAt && (
                  <div className="flex justify-between text-sm">
                    <span className="text-default-500">Pagado el</span>
                    <span className="font-semibold text-foreground">
                      {formatDateShort(selectedPurchase.paidAt)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          {selectedPurchase.notes && (
            <div className="rounded-2xl border border-divider/15 bg-gradient-to-br from-content1 to-content2/40 p-5">
              <h3 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-default-500">
                <FileText size={13} />
                Notas
              </h3>
              <p className="mt-3 text-sm text-default-600 leading-relaxed">{selectedPurchase.notes}</p>
            </div>
          )}

          {/* Timeline history */}
          <div className="rounded-2xl border border-divider/15 bg-gradient-to-br from-content1 to-content2/40 p-5">
            <h3 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-default-500">
              <Clock size={13} />
              Historial
            </h3>
            <div className="mt-4 space-y-0">
              {selectedPurchase.createdAt && (
                <div className="flex gap-4 pb-4 relative">
                  <div className="flex flex-col items-center">
                    <div className="z-10 flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/15 text-blue-500">
                      <FileText size={13} />
                    </div>
                    <div className="mt-0 w-px flex-1 bg-divider/20" />
                  </div>
                  <div className="pb-2">
                    <p className="text-sm font-semibold text-foreground">Orden creada</p>
                    <p className="mt-0.5 text-xs text-default-500">
                      {new Date(selectedPurchase.createdAt).toLocaleString("es-AR", {
                        day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              )}
              {selectedPurchase.status === "CONFIRMED" && selectedPurchase.createdAt && (
                <div className="flex gap-4 pb-4 relative">
                  <div className="flex flex-col items-center">
                    <div className="z-10 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-500">
                      <BadgeCheck size={13} />
                    </div>
                    <div className="mt-0 w-px flex-1 bg-divider/20" />
                  </div>
                  <div className="pb-2">
                    <p className="text-sm font-semibold text-foreground">Compra confirmada</p>
                    <p className="mt-0.5 text-xs text-blue-500 font-medium">Pendiente de recepción</p>
                  </div>
                </div>
              )}
              {selectedPurchase.receivedAt && (
                <div className="flex gap-4 pb-4 relative">
                  <div className="flex flex-col items-center">
                    <div className="z-10 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-500">
                      <Truck size={13} />
                    </div>
                    <div className="mt-0 w-px flex-1 bg-divider/20" />
                  </div>
                  <div className="pb-2">
                    <p className="text-sm font-semibold text-foreground">Mercadería recibida</p>
                    <p className="mt-0.5 text-xs text-default-500">
                      {new Date(selectedPurchase.receivedAt).toLocaleString("es-AR", {
                        day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              )}
              {selectedPurchase.cancelledAt && (
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="z-10 flex h-8 w-8 items-center justify-center rounded-full bg-red-500/15 text-red-500">
                      <Ban size={13} />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Compra cancelada</p>
                    <p className="mt-0.5 text-xs text-default-500">
                      {new Date(selectedPurchase.cancelledAt).toLocaleString("es-AR", {
                        day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Contextual actions */}
          <div className="flex gap-3 pt-1">
            {status === "DRAFT" && (
              <>
                <button
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-500/25 disabled:opacity-50 hover:shadow-blue-500/35 transition-all"
                  disabled={isConfirming}
                  onClick={onConfirm}
                >
                  {isConfirming ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                  Confirmar
                </button>
                <button
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-red-500/25 disabled:opacity-50 hover:shadow-red-500/35 transition-all"
                  disabled={isCancelling}
                  onClick={onCancel}
                >
                  {isCancelling ? <Loader2 className="animate-spin" size={18} /> : <XCircle size={18} />}
                  Cancelar
                </button>
              </>
            )}
            {status === "CONFIRMED" && (
              <>
                <button
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/25 disabled:opacity-50 hover:shadow-emerald-500/35 transition-all"
                  disabled={isReceiving}
                  onClick={onReceive}
                >
                  {isReceiving ? <Loader2 className="animate-spin" size={18} /> : <PackageCheck size={18} />}
                  Recibir
                </button>
                <button
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-red-500/25 disabled:opacity-50 hover:shadow-red-500/35 transition-all"
                  disabled={isCancelling}
                  onClick={onCancel}
                >
                  {isCancelling ? <Loader2 className="animate-spin" size={18} /> : <XCircle size={18} />}
                  Cancelar
                </button>
              </>
            )}
            {status === "RECEIVED" && selectedPurchase?.paymentStatus !== "PAID" && (
              <button
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/25 disabled:opacity-50 hover:shadow-emerald-500/35 transition-all"
                disabled={isPaying}
                onClick={() => {
                  setPayData({ amount: remaining, paymentMethod: "transfer" });
                  setShowPayModal(true);
                }}
              >
                {isPaying ? <Loader2 className="animate-spin" size={18} /> : <DollarSign size={18} />}
                Registrar Pago
              </button>
            )}
            {status === "RECEIVED" && selectedPurchase?.paymentStatus === "PAID" && (
              <div className="flex-1 rounded-2xl border border-divider/20 bg-emerald-500/10 px-4 py-3.5 text-center text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 size={14} className="inline mr-1" />
                Compra pagada
              </div>
            )}
            {status === "CANCELLED" && (
              <div className="flex-1 rounded-2xl border border-divider/20 bg-content2/40 px-4 py-3.5 text-center text-xs text-default-500">
                Esta compra ya fue cancelada y no admite más acciones.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Pay Modal ──────────────────────────────────────────── */}
      {showPayModal && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center">
          <div className="w-full max-w-sm rounded-t-2xl bg-content1 p-6 shadow-2xl sm:rounded-2xl">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-default-400">Compras</p>
                <h3 className="mt-1 text-lg font-semibold text-foreground">Registrar Pago</h3>
              </div>
              <button
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-divider/20 text-default-400 hover:text-foreground transition-colors"
                onClick={() => setShowPayModal(false)}
              >
                <X size={15} />
              </button>
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-default-500">
                  Monto *
                </span>
                <input
                  className="corp-input w-full rounded-2xl px-4 py-3 text-sm font-mono"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={payData.amount}
                  onChange={(e) =>
                    setPayData((prev) => ({ ...prev, amount: Number(e.target.value) }))
                  }
                />
                <p className="mt-1 text-[11px] text-default-400">
                  Saldo pendiente: {formatCurrency(remaining, currency)}
                </p>
              </label>

              <label className="block">
                <span className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-default-500">
                  Método de pago *
                </span>
                <select
                  className="corp-input w-full rounded-2xl px-4 py-3 text-sm"
                  value={payData.paymentMethod}
                  onChange={(e) =>
                    setPayData((prev) => ({ ...prev, paymentMethod: e.target.value as PayPurchaseData["paymentMethod"] }))
                  }
                >
                  <option value="cash">Efectivo</option>
                  <option value="card">Tarjeta</option>
                  <option value="transfer">Transferencia</option>
                  <option value="mercadopago">Mercado Pago</option>
                  <option value="check">Cheque</option>
                  <option value="other">Otro</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-default-500">
                  Referencia
                </span>
                <input
                  className="corp-input w-full rounded-2xl px-4 py-3 text-sm"
                  type="text"
                  placeholder="N° de comprobante, recibo..."
                  value={payData.reference || ""}
                  onChange={(e) =>
                    setPayData((prev) => ({ ...prev, reference: e.target.value }))
                  }
                />
              </label>

              <label className="block">
                <span className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-default-500">
                  Notas
                </span>
                <textarea
                  className="corp-input min-h-[64px] w-full rounded-2xl px-4 py-3 text-sm resize-none"
                  placeholder="Observaciones del pago..."
                  value={payData.notes || ""}
                  onChange={(e) =>
                    setPayData((prev) => ({ ...prev, notes: e.target.value }))
                  }
                />
              </label>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                className="flex-1 rounded-2xl border border-divider/20 px-4 py-3 text-sm font-semibold text-default-600 hover:bg-content2/60 transition-colors"
                onClick={() => setShowPayModal(false)}
              >
                Cancelar
              </button>
              <button
                className="flex-1 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/25 disabled:opacity-50 hover:shadow-emerald-500/35 transition-all"
                disabled={isPaying || !payData.amount || payData.amount <= 0}
                onClick={() => {
                  onPay(payData);
                  setShowPayModal(false);
                }}
              >
                <span className="flex items-center justify-center gap-2">
                  {isPaying && <Loader2 className="animate-spin" size={18} />}
                  Confirmar Pago
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
