import { Minus, Plus, Trash2 } from "lucide-react";
import { QuickSaleItem } from "@shared/types";
import { InvalidStockItem } from "@features/products/utils/stock";
import { formatCurrency } from "@shared/utils/currency";

interface CartItemProps {
  item: QuickSaleItem;
  currency: string;
  available: number;
  error: InvalidStockItem | undefined;
  isWarning: boolean;
  itemPrice: number;
  onUpdateQuantity: (productId: string, quantity: number, presentationId?: string) => void;
  onRemove: (productId: string, presentationId?: string) => void;
}

export default function CartItem({
  item,
  currency,
  available,
  error,
  isWarning,
  itemPrice,
  onUpdateQuantity,
  onRemove,
}: CartItemProps) {
  const lowStock = available > 0 && available <= (item.product.minStock || 5);

  return (
    <div
      className={`flex items-center gap-3 rounded-2xl border p-3 ${
        error
          ? "border-danger/40 bg-danger/8"
          : isWarning
            ? "border-warning/30 bg-warning/8"
            : "border-divider/60 bg-content2/40"
      }`}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">
          {item.product.name}
          {item.presentation && (
            <span className="ml-1 text-xs font-normal text-default-400">
              ({item.presentation.name})
            </span>
          )}
        </p>
        <p className="text-xs text-default-400">
          {formatCurrency(itemPrice, currency)} c/u
        </p>
        <p
          className={`mt-0.5 text-[11px] font-semibold ${
            error ? "text-danger" : lowStock ? "text-warning" : "text-default-400"
          }`}
        >
          Stock: {available}
          {error && ` — ¡solo hay ${error.available}!`}
        </p>
      </div>
      <div className="flex items-center gap-1.5">
        <button
          className="flex h-7 w-7 items-center justify-center rounded-lg bg-content2 text-default-500 hover:text-danger"
          onClick={() =>
            onUpdateQuantity(
              item.product._id,
              +(item.quantity - (item.presentation ? 1 : 0.5)).toFixed(1),
              item.presentation?._id,
            )
          }
        >
          <Minus size={14} />
        </button>
        <input
          className={`flex h-7 w-14 items-center justify-center rounded-lg border border-divider/30 bg-transparent px-1 text-center text-sm font-bold outline-none focus:border-primary ${
            error ? "text-danger" : "text-foreground"
          }`}
          type="number"
          min="0"
          step={item.presentation ? "1" : "0.5"}
          value={item.quantity}
          onChange={(e) => {
            const val = parseFloat(e.target.value);
            if (!isNaN(val)) onUpdateQuantity(item.product._id, val, item.presentation?._id);
          }}
        />
        <button
          className="flex h-7 w-7 items-center justify-center rounded-lg bg-content2 text-default-500 hover:text-primary disabled:opacity-30"
          disabled={item.quantity >= available}
          onClick={() =>
            onUpdateQuantity(
              item.product._id,
              +(item.quantity + (item.presentation ? 1 : 0.5)).toFixed(1),
              item.presentation?._id,
            )
          }
        >
          <Plus size={14} />
        </button>
      </div>
      <div className="text-right">
        <p className="text-sm font-bold text-foreground">
          {formatCurrency(itemPrice * item.quantity, currency)}
        </p>
      </div>
      <button
        className="flex h-7 w-7 items-center justify-center rounded-lg text-default-400 hover:text-danger"
        onClick={() => onRemove(item.product._id, item.presentation?._id)}
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}
