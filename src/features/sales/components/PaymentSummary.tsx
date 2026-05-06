import { DollarSign, Loader2, Printer } from "lucide-react";
import { PaymentMethod } from "@shared/types";
import { formatCurrency } from "@shared/utils/currency";
import { getPaymentLabel, getPaymentEmoji } from "@features/sales/utils/payment";

interface PaymentSummaryProps {
  paymentMethod: PaymentMethod;
  onChangeMethod: (method: PaymentMethod) => void;
  cashReceived: number;
  onCashChange: (value: number) => void;
  change: number;
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  settings?: { taxRate?: number } | null;
  onCheckout: () => void;
  isCreating: boolean;
  canFinalize: boolean;
}

export default function PaymentSummary({
  paymentMethod,
  onChangeMethod,
  cashReceived,
  onCashChange,
  change,
  subtotal,
  tax,
  total,
  currency,
  settings,
  onCheckout,
  isCreating,
  canFinalize,
}: PaymentSummaryProps) {
  return (
    <>
      {/* Payment method selector */}
      <div className="flex gap-2">
        {(["cash", "card", "transfer"] as PaymentMethod[]).map((method) => (
          <button
            key={method}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition ${
              paymentMethod === method
                ? "bg-primary text-white shadow-md shadow-primary/25"
                : "bg-content2/70 text-default-500"
            }`}
            onClick={() => onChangeMethod(method)}
          >
            {method === "cash" && <DollarSign size={14} />}
            {getPaymentEmoji(method)}
            {getPaymentLabel(method)}
          </button>
        ))}
      </div>

      {/* Cash received input */}
      {paymentMethod === "cash" && (
        <div className="flex items-center gap-3">
          <input
            className="corp-input flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold"
            placeholder="Efectivo recibido..."
            type="number"
            min="0"
            step="0.01"
            value={cashReceived || ""}
            onChange={(e) => onCashChange(Number(e.target.value))}
          />
          {change > 0 && (
            <div className="shrink-0 text-right">
              <p className="text-[11px] text-default-400">Cambio</p>
              <p className="text-sm font-bold text-success">
                {formatCurrency(change, currency)}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Totals */}
      <div className="space-y-1 text-sm">
        <div className="flex items-center justify-between text-default-500">
          <span>Subtotal</span>
          <span>{formatCurrency(subtotal, currency)}</span>
        </div>
        <div className="flex items-center justify-between text-default-500">
          <span>IVA {settings?.taxRate || 0}%</span>
          <span>{formatCurrency(tax, currency)}</span>
        </div>
        <div className="flex items-center justify-between border-t border-divider/60 pt-2 text-base font-bold text-foreground">
          <span>TOTAL</span>
          <span className="text-primary">{formatCurrency(total, currency)}</span>
        </div>
      </div>

      {/* Checkout button */}
      <button
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-primary/25 transition hover:opacity-90 disabled:opacity-40"
        disabled={!canFinalize || isCreating}
        onClick={onCheckout}
      >
        {isCreating ? (
          <Loader2 className="animate-spin" size={18} />
        ) : (
          <Printer size={18} />
        )}
        {isCreating
          ? "Registrando..."
          : `Cobrar ${formatCurrency(total, currency)}`}
      </button>
    </>
  );
}
