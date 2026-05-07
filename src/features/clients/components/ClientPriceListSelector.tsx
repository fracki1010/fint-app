import { Tags } from "lucide-react";
import { PriceTier } from "@shared/types";
import { getTierDisplayName } from "@features/products/utils/priceResolver";

interface TierConfig {
  name: string;
  enabled: boolean;
}

interface ClientPriceListSelectorProps {
  value: PriceTier | undefined;
  tierConfig?: Record<PriceTier, TierConfig>;
  onChange: (tier: PriceTier) => void;
  error?: string;
}

const DEFAULT_TIER_CONFIG: Record<PriceTier, TierConfig> = {
  retail: { name: "Minorista", enabled: true },
  wholesale: { name: "Mayorista", enabled: true },
  distributor: { name: "Distribuidor", enabled: true },
};

const TIER_ORDER: PriceTier[] = ["retail", "wholesale", "distributor"];

const TIER_BADGE_COLORS: Record<PriceTier, string> = {
  retail: "bg-primary/10 text-primary border-primary/20",
  wholesale: "bg-success/10 text-success border-success/20",
  distributor: "bg-warning/10 text-warning border-warning/20",
};

export function ClientPriceListSelector({
  value = "retail",
  tierConfig,
  onChange,
  error,
}: ClientPriceListSelectorProps) {
  const config = tierConfig || DEFAULT_TIER_CONFIG;

  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-default-400">
        <Tags size={14} />
        Lista de precios
      </label>

      <div className="space-y-2 rounded-2xl border border-divider/30 bg-content1/30 p-4">
        <p className="text-sm text-default-500 mb-3">
          Seleccioná la lista de precios que se aplicará a este cliente por defecto.
        </p>

        <div className="grid grid-cols-1 gap-2">
          {TIER_ORDER.map((tier) => {
            const tierConf = config[tier];
            if (!tierConf?.enabled) return null;

            const isSelected = value === tier;
            const displayName = getTierDisplayName(tier, tierConf);

            return (
              <button
                key={tier}
                type="button"
                onClick={() => onChange(tier)}
                className={`flex items-center justify-between rounded-xl border px-4 py-3 transition-all ${
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-divider/30 bg-content2/30 hover:border-divider/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                      isSelected
                        ? "border-primary bg-primary"
                        : "border-divider"
                    }`}
                  >
                    {isSelected && (
                      <div className="h-2 w-2 rounded-full bg-white" />
                    )}
                  </div>
                  <span
                    className={`text-sm font-semibold ${
                      isSelected ? "text-foreground" : "text-default-600"
                    }`}
                  >
                    {displayName}
                  </span>
                </div>

                <span
                  className={`rounded-full border px-2.5 py-1 text-xs font-bold ${
                    TIER_BADGE_COLORS[tier]
                  }`}
                >
                  {tier === "retail" && "Default"}
                  {tier === "wholesale" && "Mayorista"}
                  {tier === "distributor" && "Distribución"}
                </span>
              </button>
            );
          })}
        </div>

        {/* Default indicator */}
        {value === "retail" && (
          <div className="mt-3 rounded-lg bg-content2/50 px-3 py-2 text-xs text-default-500">
            <span className="font-medium text-foreground">Minorista</span> es la lista
            por defecto para clientes sin asignación especial.
          </div>
        )}

        {/* Error message */}
        {error && (
          <p className="text-xs text-danger font-medium mt-2">{error}</p>
        )}
      </div>
    </div>
  );
}
