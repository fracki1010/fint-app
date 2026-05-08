import { useState } from "react";
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

export default function CartItem({
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
        {onTierChange && (
          <>
            <button
              className="mt-1 flex items-center gap-1.5 rounded-lg border border-dashed border-default-300 px-2 py-1 text-[11px] font-semibold text-default-500 hover:border-primary/40 hover:bg-primary/5 hover:text-primary transition-all"
              onClick={(e) => { e.stopPropagation(); setShowTierModal(true); }}
              title="Tocar para cambiar lista de precios"
            >
              <Tags size={12} className={item.priceTier && item.priceTier !== "retail" ? "text-warning" : ""} />
              <span className={item.priceTier && item.priceTier !== "retail" ? "text-warning" : ""}>
                {item.priceTier === "wholesale" ? "Mayorista" : item.priceTier === "distributor" ? "Distribuidor" : item.priceTier === "premium" ? "Premium" : item.priceTier === "especial" ? "Especial" : "Minorista"}
              </span>
              <ChevronDown size={10} className="opacity-60" />
            </button>

            {/* Tier selection modal */}
            {showTierModal && (
              <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/30 p-4" onClick={() => setShowTierModal(false)}>
                <div className="w-full max-w-xs rounded-2xl border border-divider/10 bg-content1 p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                  <p className="text-sm font-bold text-foreground mb-1">{item.product.name}</p>
                  {item.presentation && (
                    <p className="text-xs text-default-500 mb-3">{item.presentation.name}</p>
                  )}
                  <div className="space-y-2">
                    {(["retail", "wholesale", "distributor", "premium", "especial"] as PriceTier[]).map((tier) => {
                      const baseRetail = resolveProductPrice(item.product, "retail");
                      const tierBasePrice = resolveProductPrice(item.product, tier);
                      if (tierBasePrice <= 0) return null;
                      // For presentations, scale price by tier ratio
                      const price = item.presentation?.price
                        ? item.presentation.price * (baseRetail > 0 ? tierBasePrice / baseRetail : 1)
                        : tierBasePrice;
                      const active = (item.priceTier || "retail") === tier;
                      return (
                        <button
                          key={tier}
                          className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition ${
                            active ? "bg-primary/10 border border-primary/30" : "bg-content2/50 border border-transparent hover:bg-content2/80"
                          }`}
                          onClick={() => {
                            onTierChange(item.product._id, tier, item.presentation?._id);
                            setShowTierModal(false);
                          }}
                        >
                          <div className="flex-1">
                            <p className={`text-sm font-bold ${active ? "text-primary" : "text-foreground"}`}>
                              {tier === "retail" ? "Minorista" : tier === "wholesale" ? "Mayorista" : tier === "distributor" ? "Distribuidor" : tier === "premium" ? "Premium" : "Especial"}
                            </p>
                            <p className="text-xs text-default-500">
                              {tier === "retail" ? "Precio de lista común" : tier === "wholesale" ? "Volumen mayor" : tier === "distributor" ? "Distribución" : tier === "premium" ? "Lista premium" : "Precio especial"}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={`text-sm font-bold ${active ? "text-primary" : "text-foreground"}`}>
                              {formatCurrency(price, "ARS")}
                            </p>
                          </div>
                          {active && <Check size={16} className="text-primary" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <p className="mt-0.5 text-xs text-default-400">
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
