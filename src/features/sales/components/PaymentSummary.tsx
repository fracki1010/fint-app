import { useState, useMemo } from "react";
import { Loader2, Printer, X, ChevronDown, ChevronUp } from "lucide-react";
import { PaymentMethod } from "@shared/types";
import { formatCurrency } from "@shared/utils/currency";
import { getPaymentLabel, getPaymentIcon } from "@features/sales/utils/payment";

function PaymentIcon({ method, size = 11 }: { method: PaymentMethod; size?: number }) {
  const Icon = getPaymentIcon(method);
  return <Icon width={size} height={size} />;
}

export interface PaymentSplit {
  method: PaymentMethod;
  amount: number;
}

interface PaymentSummaryProps {
  splits: PaymentSplit[];
  onSplitsChange: (splits: PaymentSplit[]) => void;
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

const CATEGORIES: { key: PaymentCategory; label: string; method: PaymentMethod }[] = [
  { key: "cash", label: "Efectivo", method: "cash" },
  { key: "card", label: "Tarjeta", method: "card" },
  { key: "transfer", label: "Transf.", method: "transfer" },
  { key: "other", label: "Otro", method: "other" },
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
  splits,
  onSplitsChange,
  subtotal,
  tax,
  total,
  currency,
  settings,
  onCheckout,
  isCreating,
  canFinalize,
}: PaymentSummaryProps) {
  const [mode, setMode] = useState<"simple" | "doble">("simple");
  const [expanded, setExpanded] = useState(false);
  const [expandedRow, setExpandedRow] = useState<Record<number, boolean>>({});

  const totalSplitAmount = useMemo(
    () => splits.reduce((sum, s) => sum + (s.amount || 0), 0),
    [splits],
  );
  const remaining = total - totalSplitAmount;

  // ── Simple mode: single payment method ──
  const primarySplit = splits[0] || { method: "cash" as PaymentMethod, amount: 0 };
  const category = getCategory(primarySplit.method);
  const subOptions = SUBCATEGORIES[category];

  const handleCategoryClick = (cat: PaymentCategory, method: PaymentMethod) => {
    if (mode === "simple") {
      // Simple mode: replace split
      onSplitsChange([{ method, amount: 0 }]);
      const opts = SUBCATEGORIES[cat];
      if (opts.length > 0 && opts.includes(primarySplit.method) && category === cat) {
        setExpanded(!expanded);
      } else if (opts.length > 0) {
        onSplitsChange([{ method: opts[0], amount: 0 }]);
        setExpanded(true);
      } else {
        setExpanded(false);
      }
    }
  };

  const handleAmountChange = (index: number, value: number) => {
    const updated = splits.map((s, i) =>
      i === index ? { ...s, amount: Math.max(0, value) } : s,
    );
    onSplitsChange(updated);
  };

  const handleSubSelect = (method: PaymentMethod) => {
    onSplitsChange([{ method, amount: total }]);
    setExpanded(false);
  };

  const getCashChange = (splitIndex: number): number => {
    const split = splits[splitIndex];
    if (!split || split.method !== "cash" || split.amount <= 0) return 0;
    const otherSplitsTotal = totalSplitAmount - split.amount;
    return Math.max(0, split.amount - total + otherSplitsTotal);
  };

  // ── Doble mode handlers ──

  const handleDobleCategoryClick = (index: number, cat: PaymentCategory) => {
    const opts = SUBCATEGORIES[cat];
    const method = opts.length > 0 ? opts[0] : (cat === "cash" ? "cash" : cat === "card" ? "card" : cat) as PaymentMethod;
    onSplitsChange(splits.map((s, i) => (i === index ? { ...s, method, amount: 0 } : s)));
    setExpandedRow((prev) => ({ ...prev, [index]: opts.length > 0 }));
  };

  const handleDobleSubSelect = (index: number, method: PaymentMethod) => {
    onSplitsChange(splits.map((s, i) => (i === index ? { ...s, method } : s)));
    setExpandedRow((prev) => ({ ...prev, [index]: false }));
  };

  const toggleMode = () => {
    if (mode === "simple") {
      const first = splits[0] || { method: "cash" as PaymentMethod, amount: 0 };
      onSplitsChange([first, { method: "cash" as PaymentMethod, amount: 0 }]);
      setMode("doble");
      setExpandedRow({});
    } else {
      onSplitsChange([splits[0] || { method: "cash" as PaymentMethod, amount: 0 }]);
      setMode("simple");
      setExpanded(false);
    }
  };

  const renderPaymentRow = (index: number) => {
    const split = splits[index];
    if (!split) return null;

    const rowCategory = getCategory(split.method);
    const rowSubOptions = SUBCATEGORIES[rowCategory];
    const isRowExpanded = expandedRow[index] || false;
    const cashChange = getCashChange(index);

    return (
      <div key={index} className="space-y-1.5 rounded-xl border border-divider/30 bg-content2/10 p-2.5">
        {/* Header */}
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-[9px] font-bold uppercase tracking-wider text-default-400">
            Pago {index + 1}
          </span>
          {index > 0 && (
            <button
              className="ml-auto flex h-4 w-4 items-center justify-center rounded text-default-400 hover:text-danger transition"
              onClick={() => {
                setMode("simple");
                onSplitsChange([splits[0]]);
                setExpandedRow({});
              }}
              title="Volver a pago simple"
            >
              <X size={9} />
            </button>
          )}
        </div>

        {/* Category buttons */}
        <div className="flex gap-1">
          {CATEGORIES.map(({ key, label, method }) => {
            const active = rowCategory === key;
            return (
              <button
                key={key}
                className={`flex flex-1 items-center justify-center gap-1 rounded-lg py-1.5 text-[10px] font-bold transition ${
                  active
                    ? "bg-primary text-white shadow-sm shadow-primary/25"
                    : "bg-content2/70 text-default-500 hover:bg-content2/90 active:scale-95"
                }`}
                onClick={() => handleDobleCategoryClick(index, key)}
              >
                <PaymentIcon method={method} size={9} />
                <span>{label}</span>
              </button>
            );
          })}
        </div>

        {/* Sub-options */}
        {rowSubOptions.length > 0 && (
          <div>
            <button
              className="flex w-full items-center justify-between rounded-lg bg-content2/50 px-2.5 py-1 text-[10px] font-semibold text-default-500"
              onClick={() => setExpandedRow((prev) => ({ ...prev, [index]: !isRowExpanded }))}
            >
              <span className="flex items-center gap-1">
                <PaymentIcon method={split.method} size={8} />
                {getPaymentLabel(split.method)}
              </span>
              {isRowExpanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
            </button>
            {isRowExpanded && (
              <div className="mt-1 grid grid-cols-3 gap-1">
                {rowSubOptions.map((method) => (
                  <button
                    key={method}
                    className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-semibold transition ${
                      split.method === method
                        ? "bg-primary/10 text-primary border border-primary/20"
                        : "bg-content2/30 text-default-500 hover:bg-content2/50 border border-transparent"
                    }`}
                    onClick={() => handleDobleSubSelect(index, method)}
                  >
                    <PaymentIcon method={method} size={8} />
                    <span>{getPaymentLabel(method, true)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Cash received or amount input */}
        {split.method === "cash" ? (
          <div className="flex items-center gap-2">
            <input
              className="corp-input flex-1 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold"
              placeholder="Efectivo recibido..."
              type="number"
              min="0"
              step="0.01"
              value={split.amount || ""}
              onChange={(e) => handleAmountChange(index, Number(e.target.value))}
            />
            {cashChange > 0 && (
              <div className="shrink-0 text-right">
                <p className="text-[9px] text-default-400">Cambio</p>
                <p className="text-[11px] font-bold text-success">{formatCurrency(cashChange, currency)}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold text-default-500 shrink-0">Monto</span>
            <input
              className="corp-input flex-1 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold"
              placeholder="0"
              type="number"
              min="0"
              step="0.01"
              value={split.amount || ""}
              onChange={(e) => handleAmountChange(index, Number(e.target.value))}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* ── SIMPLE MODE: Single payment ── */}
      {mode === "simple" ? (
        <>
          {/* Category buttons */}
          <div className="flex gap-1.5">
            {CATEGORIES.map(({ key, label, method }) => {
              const active = category === key;
              return (
                <button
                  key={key}
                  className={`flex flex-1 items-center justify-center gap-1 rounded-xl py-2 text-xs font-bold transition ${
                    active
                      ? "bg-primary text-white shadow-md shadow-primary/25 scale-105"
                      : "bg-content2/70 text-default-500 hover:bg-content2/90 active:scale-95"
                  }`}
                  onClick={() => handleCategoryClick(key, method)}
                >
                  <PaymentIcon method={method} size={11} />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>

          {/* Sub-options */}
          {subOptions.length > 0 && (
            <div className="overflow-hidden transition-all">
              <button
                className="flex w-full items-center justify-between rounded-xl bg-content2/50 px-3 py-1.5 text-[11px] font-semibold text-default-500"
                onClick={() => setExpanded(!expanded)}
              >
                <span className="flex items-center gap-1.5">
                  <PaymentIcon method={primarySplit.method} size={9} />
                  {getPaymentLabel(primarySplit.method)}
                </span>
                {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
              {expanded && (
                <div className="mt-1 grid grid-cols-3 gap-1">
                  {subOptions.map((method) => (
                    <button
                      key={method}
                      className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[11px] font-semibold transition ${
                        primarySplit.method === method
                          ? "bg-primary/10 text-primary border border-primary/20"
                          : "bg-content2/30 text-default-500 hover:bg-content2/50 border border-transparent"
                      }`}
                      onClick={() => handleSubSelect(method)}
                    >
                      <PaymentIcon method={method} size={9} />
                      <span>{getPaymentLabel(method, true)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Cash received */}
          {primarySplit.method === "cash" && (
            <div className="flex items-center gap-2">
              <input
                className="corp-input flex-1 rounded-xl px-3 py-2 text-xs font-semibold"
                placeholder="Efectivo recibido..."
                type="number"
                min="0"
                step="0.01"
                value={primarySplit.amount || ""}
                onChange={(e) => onSplitsChange([{ method: "cash", amount: Number(e.target.value) }])}
              />
              {primarySplit.amount > total && (
                <div className="shrink-0 text-right">
                  <p className="text-[10px] text-default-400">Cambio</p>
                  <p className="text-xs font-bold text-success">{formatCurrency(primarySplit.amount - total, currency)}</p>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <>
          {/* ── DOBLE MODE: Two independent payments ── */}
          {renderPaymentRow(0)}
          {renderPaymentRow(1)}

          {/* Remaining */}
          <div className={`flex items-center justify-between rounded-xl px-3 py-1.5 text-xs font-semibold ${
            remaining <= 0 ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
          }`}>
            <span>{remaining <= 0 ? "Cubierto" : "Falta:"}</span>
            <span>{remaining <= 0 ? "✅" : formatCurrency(remaining, currency)}</span>
          </div>
        </>
      )}

      {/* ── Toggle mode ── */}
      <button
        className="flex w-full items-center justify-center gap-1 text-[10px] font-semibold text-default-400 hover:text-primary transition"
        onClick={toggleMode}
      >
        {mode === "simple" ? "+ Pago doble" : "− Pago simple"}
      </button>

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
