import { DollarSign, TrendingUp, AlertCircle } from "lucide-react";
import { PriceTiers, PriceTier } from "@shared/types";
import { formatCompactCurrency } from "@shared/utils/currency";
import { calculateMargin, getTierDisplayName } from "../utils/priceResolver";

interface TierConfig {
  name: string;
  enabled: boolean;
}

interface ProductTierPriceInputProps {
  priceTiers: PriceTiers;
  costPrice: number;
  currency: string;
  tierConfig?: Record<PriceTier, TierConfig>;
  onChange: (tier: PriceTier, value: string) => void;
  errors?: Partial<Record<PriceTier, string>>;
}

const DEFAULT_TIER_CONFIG: Record<PriceTier, TierConfig> = {
  retail: { name: "Minorista", enabled: true },
  wholesale: { name: "Mayorista", enabled: true },
  distributor: { name: "Distribuidor", enabled: true },
};

const TIER_ORDER: PriceTier[] = ["retail", "wholesale", "distributor"];

const TIER_COLORS: Record<PriceTier, string> = {
  retail: "text-primary",
  wholesale: "text-success",
  distributor: "text-warning",
};

const TIER_BG_COLORS: Record<PriceTier, string> = {
  retail: "bg-primary/10",
  wholesale: "bg-success/10",
  distributor: "bg-warning/10",
};

export function ProductTierPriceInput({
  priceTiers,
  costPrice,
  currency,
  tierConfig,
  onChange,
  errors,
}: ProductTierPriceInputProps) {
  const config = tierConfig || DEFAULT_TIER_CONFIG;

  const hasCostPrice = costPrice !== undefined && costPrice > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-default-400">
        <DollarSign size={14} />
        Precios por lista
      </div>

      <div className="space-y-3 rounded-2xl border border-divider/30 bg-content1/30 p-4">
        {TIER_ORDER.map((tier) => {
          const tierConf = config[tier];
          if (!tierConf?.enabled) return null;

          const value = priceTiers?.[tier]?.toString() || "";
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
                </label>

                <div className="flex items-center gap-2 flex-1 max-w-[180px]">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-default-400">
                      {currency === "USD" ? "$" : "$"}
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={value}
                      onChange={(e) => onChange(tier, e.target.value)}
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
