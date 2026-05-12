import { useEffect, useState } from "react";
import { DollarSign, TrendingUp, AlertCircle, Package } from "lucide-react";
import { PriceTiers, PriceTier } from "@shared/types";
import { formatCompactCurrency } from "@shared/utils/currency";
import { calculateMargin, getTierDisplayName } from "../utils/priceResolver";

interface TierConfig {
  name: string;
  enabled: boolean;
  percentage?: number;
}

interface ProductTierPriceInputProps {
  priceTiers: PriceTiers;
  costPrice: number;
  currency: string;
  tierConfig?: Record<PriceTier, TierConfig>;
  onChange: (tier: PriceTier, value: string) => void;
  errors?: Partial<Record<PriceTier, string>>;
  /** Presentations to use as reference for loading prices */
  presentations?: Array<{ _id?: string; name: string; price?: number; equivalentQty: number; unitOfMeasure?: string; isActive?: boolean }>;
}

const DEFAULT_TIER_CONFIG: Record<PriceTier, TierConfig> = {
  retail: { name: "Minorista", enabled: true, percentage: 100 },
  wholesale: { name: "Mayorista", enabled: true, percentage: 85 },
  distributor: { name: "Distribuidor", enabled: true, percentage: 75 },
  premium: { name: "Premium", enabled: true, percentage: 120 },
  especial: { name: "Especial", enabled: true, percentage: 90 },
};

const TIER_ORDER: PriceTier[] = ["retail", "wholesale", "distributor", "premium", "especial"];

const TIER_COLORS: Record<PriceTier, string> = {
  retail: "text-primary",
  wholesale: "text-success",
  distributor: "text-warning",
  premium: "text-secondary",
  especial: "text-danger",
};

const TIER_BG_COLORS: Record<PriceTier, string> = {
  retail: "bg-primary/10",
  wholesale: "bg-success/10",
  distributor: "bg-warning/10",
  premium: "bg-secondary/10",
  especial: "bg-danger/10",
};

export function ProductTierPriceInput({
  priceTiers,
  costPrice,
  currency,
  tierConfig,
  onChange,
  errors,
  presentations,
}: ProductTierPriceInputProps) {
  const config = tierConfig || DEFAULT_TIER_CONFIG;
  const [selectedPresIdx, setSelectedPresIdx] = useState<number | null>(null);

  const hasCostPrice = costPrice !== undefined && costPrice > 0;
  const activePres = presentations?.filter(p => p.isActive !== false) || [];
  const pres = selectedPresIdx !== null ? activePres[selectedPresIdx] : null;

  // ── Auto-replicar retail → otros tiers por porcentaje ──
  useEffect(() => {
    const retail = priceTiers?.retail;
    if (!retail || retail <= 0) return;

    TIER_ORDER.forEach((tier) => {
      if (tier === "retail") return;
      const tierConf = config[tier];
      if (!tierConf?.enabled || !tierConf.percentage) return;
      // Solo auto-completar si está vacío (no sobreescribir manuales)
      const current = priceTiers?.[tier];
      if (current != null && current > 0) return;
      const suggested = retail * (tierConf.percentage / 100);
      onChange(tier, suggested.toFixed(2));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [priceTiers?.retail]);

  // Convert base tier price → presentation price for display
  // Same formula as QuickSale: presTierPrice = pres.price * (tierPrice / retailPrice)
  const displayValue = (tier: PriceTier): string => {
    if (!pres || !pres.price || pres.price <= 0 || !priceTiers?.retail) return priceTiers?.[tier]?.toString() || "";
    const baseVal = priceTiers?.[tier];
    if (baseVal == null) return "";
    return (pres.price * (baseVal / priceTiers.retail)).toFixed(2);
  };

  // Convert entered presentation price → base tier price for saving
  // Uses the same ratio as QuickSale: presTierPrice = pres.price * (tierPrice / retailPrice)
  // So: baseTierPrice = enteredPresPrice * (retailPrice / pres.price)
  const handleTierChange = (tier: PriceTier, rawValue: string) => {
    if (!pres || !pres.price || pres.price <= 0 || !priceTiers?.retail) {
      onChange(tier, rawValue);
      return;
    }
    const numVal = parseFloat(rawValue);
    if (isNaN(numVal) || rawValue === "") {
      onChange(tier, "");
    } else {
      const conversionFactor = priceTiers.retail / pres.price;
      onChange(tier, (numVal * conversionFactor).toFixed(2));
    }
  };

  return (
    <div className="space-y-4">
      {/* Header + Presentation selector */}
      <div className="flex items-center justify-between gap-2 text-xs font-bold uppercase tracking-[0.16em] text-default-400">
        <div className="flex items-center gap-2">
          <DollarSign size={14} />
          Precios por lista
        </div>
        {activePres.length > 0 && (
          <div className="flex items-center gap-2">
            <label className="text-[9px] font-semibold text-default-400 uppercase tracking-wider">Cargar desde:</label>
            <select
              className="rounded-lg border border-divider/30 bg-content1 px-2.5 py-1.5 text-[11px] font-semibold text-foreground"
              value={selectedPresIdx !== null ? selectedPresIdx : ""}
              onChange={(e) => setSelectedPresIdx(e.target.value !== "" ? Number(e.target.value) : null)}
            >
              <option value="">Precio base</option>
              {activePres.map((p, i) => (
                <option key={p._id} value={i}>{p.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {pres && (
        <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2">
          <Package size={14} className="text-primary" />
          <span className="text-xs text-default-600">
            Cargando precios para <strong className="text-foreground">{pres.name}</strong> — <span className="text-primary font-semibold">Precio base: {formatCompactCurrency(pres.price ?? 0, currency)}</span>
          </span>
        </div>
      )}

      <div className="space-y-3 rounded-2xl border border-divider/30 bg-content1/30 p-4">
        {TIER_ORDER.map((tier) => {
          const tierConf = config[tier];
          if (!tierConf?.enabled) return null;

          const value = displayValue(tier);
          const price = parseFloat(value) || 0;
          const margin = hasCostPrice ? calculateMargin(price, costPrice) : 0;
          const isValid = !errors?.[tier];
          const isProfitable = margin > 0;

          return (
            <div key={tier} className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <label className="flex items-center gap-2 min-w-0">
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${TIER_BG_COLORS[tier]} ${TIER_COLORS[tier]}`}
                  >
                    <DollarSign size={14} />
                  </span>
                  <span className="text-sm font-semibold text-foreground">
                    {getTierDisplayName(tier, tierConf)}
                  </span>
                  {!value && tier !== "retail" && tierConf?.percentage && (
                    <span className="text-[10px] text-default-400 ml-1">
                      ({tierConf.percentage}%)
                    </span>
                  )}
                </label>

                <div className="flex items-center gap-2 flex-1 max-w-[220px]">
                  {!value && tier !== "retail" && tierConf?.percentage && (
                    <button
                      type="button"
                      className="shrink-0 rounded-lg bg-primary/10 px-2 py-1.5 text-[10px] font-semibold text-primary hover:bg-primary/20 transition-colors"
                      onClick={() => {
                        const retailPrice = priceTiers?.retail;
                        if (retailPrice && retailPrice > 0) {
                          const suggested = pres && pres.price
                            ? pres.price * (retailPrice / priceTiers.retail!) * (tierConf.percentage! / 100)
                            : retailPrice * (tierConf.percentage! / 100);
                          handleTierChange(tier, suggested.toFixed(2));
                        }
                      }}
                      title={`Auto-calcular: ${tierConf.percentage}% de Minorista`}
                    >
                      Sugerir
                    </button>
                  )}
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-default-400">
                      {currency === "USD" ? "$" : "$"}
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={value}
                      onChange={(e) => handleTierChange(tier, e.target.value)}
                      placeholder="0.00"
                      className={`corp-input w-full rounded-xl pl-6 pr-3 py-2.5 text-sm text-right ${
                        !isValid ? "border-danger" : ""
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Margin display */}
              {hasCostPrice && price > 0 && (
                <div className="flex items-center justify-between rounded-lg bg-content2/50 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp
                      size={14}
                      className={isProfitable ? "text-success" : "text-danger"}
                    />
                    <span className="text-xs text-default-500">Margen:</span>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-sm font-semibold ${
                        isProfitable ? "text-success" : "text-danger"
                      }`}
                    >
                      {margin.toFixed(1)}%
                    </span>
                    <span className="text-xs text-default-400 ml-2">
                      ({formatCompactCurrency(price - costPrice, currency)})
                    </span>
                  </div>
                </div>
              )}

              {/* Warning for below cost */}
              {hasCostPrice && price > 0 && price < costPrice && (
                <div className="flex items-center gap-2 rounded-lg bg-danger/10 px-3 py-2 text-danger">
                  <AlertCircle size={14} />
                  <span className="text-xs font-medium">
                    Precio menor al costo ({formatCompactCurrency(costPrice, currency)})
                  </span>
                </div>
              )}

              {/* Error message */}
              {errors?.[tier] && (
                <p className="text-xs text-danger font-medium">{errors[tier]}</p>
              )}
            </div>
          );
        })}

        {/* Helper text */}
        <div className="pt-2 border-t border-divider/30">
          <p className="text-xs text-default-500">
            Dejá en blanco los precios que no apliquen. El sistema usará el precio base como respaldo.
          </p>
        </div>
      </div>
    </div>
  );
}
