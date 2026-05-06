import { CheckCircle2 } from "lucide-react";
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

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-success/15">
        <CheckCircle2 size={44} className="text-success" />
      </div>
      <h1 className="text-2xl font-bold text-foreground">Venta registrada</h1>
      <p className="mt-2 text-sm text-default-500">
        {successCount} producto(s) - {formatCurrency(successTotal, currency)}
      </p>
      {orderResult?.items && orderResult.items.length > 0 && (
        <div className="mt-4 max-w-sm w-full space-y-1.5">
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
      <div className="mt-6 flex gap-3">
        <button
          className="rounded-2xl bg-primary px-6 py-3 text-sm font-bold text-white shadow-lg shadow-primary/25"
          onClick={onNewSale}
        >
          Nueva venta
        </button>
        <button
          className="rounded-2xl border border-divider px-6 py-3 text-sm font-semibold text-default-600"
          onClick={onGoHome}
        >
          Volver al inicio
        </button>
      </div>
    </div>
  );
}
