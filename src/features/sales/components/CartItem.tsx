import { useState, memo } from "react";
import { Minus, Plus, Trash2, Tags, Check, ChevronDown } from "lucide-react";
import { QuickSaleItem, PriceTier } from "@shared/types";
import { InvalidStockItem } from "@features/products/utils/stock";
import { formatCurrency } from "@shared/utils/currency";
import { resolveProductPrice } from "@features/products/utils/priceResolver";

interface CartItemProps {
  item: QuickSaleItem;
  currency: string;
  available: number;
  error: InvalidStockItem | undefined;
  isWarning: boolean;
  itemPrice: number;
  onUpdateQuantity: (productId: string, quantity: number, presentationId?: string) => void;
  onRemove: (productId: string, presentationId?: string) => void;
  onTierChange?: (productId: string, tier: PriceTier, presentationId?: string) => void;
}

const TIER_ORDER: PriceTier[] = ["retail", "wholesale", "distributor", "premium", "especial"];

const TIER_LABEL: Record<PriceTier, string> = {
  retail: "Minorista",
  wholesale: "Mayorista",
  distributor: "Distribuidor",
  premium: "Premium",
  especial: "Especial",
};

const TIER_HINT: Record<PriceTier, string> = {
  retail: "Precio de lista común",
  wholesale: "Volumen mayor",
  distributor: "Distribución",
  premium: "Lista premium",
  especial: "Precio especial",
};

function CartItemRaw({
  item,
  currency,
  available,
  error,
  isWarning,
  itemPrice,
  onUpdateQuantity,
  onRemove,
  onTierChange,
}: CartItemProps) {
  const [showTierModal, setShowTierModal] = useState(false);
  const lowStock = available > 0 && available <= (item.product.minStock || 5);
  const currentTier = item.priceTier || "retail";
  const tierIsCustom = currentTier !== "retail";
  const step = item.presentation ? 1 : 0.5;

  return (
    <div
      className={`rounded-2xl border p-3.5 ${
        error
          ? "border-danger/40 bg-danger/8"
          : isWarning
            ? "border-warning/30 bg-warning/8"
            : "border-divider/60 bg-content2/40"
      }`}
    >
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-snug text-foreground">
            {item.product.name}
            {item.presentation && (
              <span className="ml-1 text-xs font-normal text-default-500">({item.presentation.name})</span>
            )}
          </p>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
            {onTierChange && (
              <button
                className={`flex min-h-7 items-center gap-1 rounded-lg border border-dashed px-2 text-[11px] font-semibold transition-all ${
                  tierIsCustom
                    ? "border-warning/50 text-warning"
                    : "border-default-300 text-default-500 hover:border-primary/40 hover:text-primary"
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowTierModal(true);
                }}
                title="Cambiar lista de precios"
                type="button"
              >
                <Tags size={12} />
                {TIER_LABEL[currentTier]}
                <ChevronDown size={10} className="opacity-60" />
              </button>
            )}
            <span className="text-xs text-default-500">{formatCurrency(itemPrice, currency)} c/u</span>
          </div>

          <p
            className={`mt-1 text-[11px] font-semibold ${
              error ? "text-danger" : lowStock ? "text-warning" : "text-default-500"
            }`}
          >
            Stock {available}
            {error && ` · solo hay ${error.available}`}
          </p>
        </div>

        <button
          aria-label={`Quitar ${item.product.name}`}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-default-400 transition hover:bg-danger/10 hover:text-danger"
          onClick={() => onRemove(item.product._id, item.presentation?._id)}
          type="button"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-1 rounded-xl border border-divider/60 bg-content1/60 p-1">
          <button
            aria-label="Restar"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-default-500 transition hover:bg-content2 hover:text-danger"
            onClick={() =>
              onUpdateQuantity(item.product._id, +(item.quantity - step).toFixed(1), item.presentation?._id)
            }
            type="button"
          >
            <Minus size={16} />
          </button>
          <input
            aria-label="Cantidad"
            className={`h-9 w-16 rounded-lg bg-transparent text-center text-sm font-bold tabular-nums outline-none focus:ring-2 focus:ring-primary/40 ${
              error ? "text-danger" : "text-foreground"
            }`}
            inputMode="decimal"
            min="0"
            step={item.presentation ? "1" : "0.5"}
            type="number"
            value={item.quantity}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              if (!isNaN(val)) onUpdateQuantity(item.product._id, val, item.presentation?._id);
            }}
          />
          <button
            aria-label="Sumar"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-default-500 transition hover:bg-content2 hover:text-primary disabled:opacity-30"
            disabled={item.quantity >= available}
            onClick={() =>
              onUpdateQuantity(item.product._id, +(item.quantity + step).toFixed(1), item.presentation?._id)
            }
            type="button"
          >
            <Plus size={16} />
          </button>
        </div>

        <p className="text-base font-bold tabular-nums text-foreground">
          {formatCurrency(itemPrice * item.quantity, currency)}
        </p>
      </div>

      {showTierModal && onTierChange && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/30 p-4"
          onClick={() => setShowTierModal(false)}
        >
          <div
            className="w-full max-w-xs rounded-2xl border border-divider/10 bg-content1 p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="mb-1 text-sm font-bold text-foreground">{item.product.name}</p>
            {item.presentation && <p className="mb-3 text-xs text-default-500">{item.presentation.name}</p>}
            <div className="space-y-2">
              {TIER_ORDER.map((tier) => {
                const baseRetail = resolveProductPrice(item.product, "retail");
                const tierBasePrice = resolveProductPrice(item.product, tier);
                if (tierBasePrice <= 0) return null;
                const price = item.presentation?.price
                  ? item.presentation.price * (baseRetail > 0 ? tierBasePrice / baseRetail : 1)
                  : tierBasePrice;
                const active = currentTier === tier;

                return (
                  <button
                    key={tier}
                    className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition ${
                      active
                        ? "border border-primary/30 bg-primary/10"
                        : "border border-transparent bg-content2/50 hover:bg-content2/80"
                    }`}
                    onClick={() => {
                      onTierChange(item.product._id, tier, item.presentation?._id);
                      setShowTierModal(false);
                    }}
                    type="button"
                  >
                    <div className="flex-1">
                      <p className={`text-sm font-bold ${active ? "text-primary" : "text-foreground"}`}>
                        {TIER_LABEL[tier]}
                      </p>
                      <p className="text-xs text-default-500">{TIER_HINT[tier]}</p>
                    </div>
                    <p className={`text-sm font-bold tabular-nums ${active ? "text-primary" : "text-foreground"}`}>
                      {formatCurrency(price, currency)}
                    </p>
                    {active && <Check size={16} className="text-primary" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const CartItem = memo(CartItemRaw);
export default CartItem;
