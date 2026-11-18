import { useEffect } from "react";
import { formatCurrency } from "@shared/utils/currency";

interface OrderResultItem {
  productName?: string;
  product?: string;
  quantity: number;
  price?: number;
}

interface OrderResult {
  items?: OrderResultItem[];
  totalAmount?: number;
}

interface SaleSuccessScreenProps {
  orderResult: OrderResult | null | undefined;
  itemCount: number;
  total: number;
  currency: string;
  onNewSale: () => void;
  onGoHome: () => void;
}

export default function SaleSuccessScreen({
  orderResult,
  itemCount,
  total,
  currency,
  onNewSale,
  onGoHome,
}: SaleSuccessScreenProps) {
  const successCount = orderResult?.items?.length || itemCount;
  const successTotal = orderResult?.totalAmount || total;

  // One short tap on devices that support it; silent everywhere else.
  useEffect(() => {
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      navigator.vibrate(30);
    }
  }, []);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-6 pb-24 text-center">
      <div className="sale-check-ring mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-success/15">
        <svg aria-hidden="true" className="h-11 w-11 text-success" viewBox="0 0 48 48">
          <path
            className="sale-check-mark"
            d="M14 25 L21 32 L34 18"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="3.5"
          />
        </svg>
      </div>

      <div className="sale-fade-up">
        <h1 className="text-2xl font-bold text-foreground">Venta registrada</h1>
        <p className="mt-2 text-sm text-default-500">
          {successCount} producto(s) - {formatCurrency(successTotal, currency)}
        </p>
      </div>

      {orderResult?.items && orderResult.items.length > 0 && (
        <div className="sale-fade-up mt-4 max-w-sm w-full space-y-1.5">
          {orderResult.items.map((item, i) => (
            <div
              key={i}
              className="flex items-center justify-between text-xs text-default-500 bg-content2/30 rounded-xl px-4 py-2"
            >
              <span className="truncate font-medium text-foreground">
                {item.productName || item.product}
              </span>
              <span className="tabular-nums">
                {item.quantity} × {formatCurrency(item.price || 0, currency)}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="sale-fade-up mt-6 flex gap-3">
        <button
          className="rounded-2xl bg-primary px-6 py-3 text-sm font-bold text-white shadow-lg shadow-primary/25 transition active:scale-95"
          onClick={onNewSale}
          type="button"
        >
          Nueva venta
        </button>
        <button
          className="rounded-2xl border border-divider px-6 py-3 text-sm font-semibold text-default-600 transition active:scale-95"
          onClick={onGoHome}
          type="button"
        >
          Volver al inicio
        </button>
      </div>
    </div>
  );
}
