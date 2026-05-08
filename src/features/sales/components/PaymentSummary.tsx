import { useState } from "react";
import { Loader2, Printer, ChevronDown, ChevronUp } from "lucide-react";
import { PaymentMethod } from "@shared/types";
import { formatCurrency } from "@shared/utils/currency";
import { getPaymentLabel, getPaymentIcon } from "@features/sales/utils/payment";

function PaymentIcon({ method, size = 16 }: { method: PaymentMethod; size?: number }) {
  const Icon = getPaymentIcon(method);
  return <Icon size={size} />;
}

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

type PaymentCategory = "cash" | "card" | "transfer" | "other";

const CATEGORIES: { key: PaymentCategory; label: string }[] = [
  { key: "cash", label: "Efectivo" },
  { key: "card", label: "Tarjeta" },
  { key: "transfer", label: "Transferencia" },
  { key: "other", label: "Otro" },
];

const CARD_OPTIONS: PaymentMethod[] = ["card"];
const TRANSFER_OPTIONS: PaymentMethod[] = [
  "mercadopago", "naranja_x", "uala", "brubank", "santander",
  "supervielle", "frances", "bna", "prex", "cocos", "galicia",
  "lemon", "astropay", "modo", "transfer",
];
const OTHER_OPTIONS: PaymentMethod[] = ["check", "other"];

function getCategory(method: PaymentMethod): PaymentCategory {
  if (method === "cash") return "cash";
  if (method === "card") return "card";
  if (["mercadopago", "naranja_x", "uala", "brubank", "santander", "supervielle", "frances", "bna", "prex", "cocos", "galicia", "lemon", "astropay", "modo", "transfer"].includes(method)) return "transfer";
  return "other";
}

const SUBCATEGORIES: Record<PaymentCategory, PaymentMethod[]> = {
  cash: [],
  card: CARD_OPTIONS,
  transfer: TRANSFER_OPTIONS,
  other: OTHER_OPTIONS,
};

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
  const category = getCategory(paymentMethod);
  const subOptions = SUBCATEGORIES[category];
  const [expanded, setExpanded] = useState(false);

  const handleCategoryClick = (cat: PaymentCategory) => {
    const options = SUBCATEGORIES[cat];
    if (options.length === 0) {
      // No sub-options, select directly
      onChangeMethod(cat);
    } else if (options.includes(paymentMethod) && category === cat) {
      // Same category, just toggle expansion
      setExpanded(!expanded);
    } else {
      // Select first sub-option and expand
      onChangeMethod(options[0]);
      setExpanded(true);
    }
  };

  const handleSubSelect = (method: PaymentMethod) => {
    onChangeMethod(method);
    setExpanded(false);
  };

  return (
    <>
      {/* Category selector */}
      <div className="flex gap-2">
        {CATEGORIES.map(({ key, label }) => (
          <button
            key={key}
            className={`flex flex-1 flex-col items-center gap-1 rounded-xl py-2.5 text-xs font-bold transition ${
              category === key
                ? "bg-primary text-white shadow-md shadow-primary/25 scale-105"
                : "bg-content2/70 text-default-500 hover:bg-content2/90 active:scale-95"
            }`}
            onClick={() => handleCategoryClick(key)}
          >
            <PaymentIcon method={key as PaymentMethod} size={18} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Sub-options (tarjetas / transferencias) */}
      {subOptions.length > 0 && (
        <div className="overflow-hidden transition-all">
          <button
            className="flex w-full items-center justify-between rounded-xl bg-content2/50 px-3 py-2 text-xs font-semibold text-default-500"
            onClick={() => setExpanded(!expanded)}
          >
            <span>
              <PaymentIcon method={paymentMethod} /> {getPaymentLabel(paymentMethod)}
            </span>
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {expanded && (
            <div className="mt-1.5 grid grid-cols-3 gap-1.5">
              {subOptions.map((method) => (
                <button
                  key={method}
                  className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                    paymentMethod === method
                      ? "bg-primary/10 text-primary border border-primary/30"
                      : "bg-content2/30 text-default-500 hover:bg-content2/50 border border-transparent"
                  }`}
                  onClick={() => handleSubSelect(method)}
                >
            <PaymentIcon method={method} size={15} />
            <span>{getPaymentLabel(method, true)}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

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

      {/* Selected method badge */}
      <div className="flex items-center justify-between text-xs text-default-400">
        <span>Método:</span>
        <span className="font-semibold text-foreground">
          <PaymentIcon method={paymentMethod} /> {getPaymentLabel(paymentMethod)}
        </span>
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
