import { useState } from "react";
import { Input } from "@heroui/input";
import { Switch } from "@heroui/switch";
import { PriceTier, PriceTierConfig } from "@shared/types";
import { Tags, Info } from "lucide-react";

interface PriceTierConfigSectionProps {
  config?: PriceTierConfig;
  onChange: (config: PriceTierConfig) => void;
}

const DEFAULT_CONFIG: PriceTierConfig = {
  retail: { name: "Minorista", enabled: true },
  wholesale: { name: "Mayorista", enabled: true },
  distributor: { name: "Distribuidor", enabled: true },
};

const TIER_ORDER: PriceTier[] = ["retail", "wholesale", "distributor"];

const TIER_LABELS: Record<PriceTier, { label: string; description: string; color: string }> = {
  retail: {
    label: "Minorista (Retail)",
    description: "Precio estándar para ventas al público general",
    color: "primary",
  },
  wholesale: {
    label: "Mayorista (Wholesale)",
    description: "Precio especial para compras al por mayor",
    color: "success",
  },
  distributor: {
    label: "Distribuidor (Distributor)",
    description: "Precio preferencial para distribuidores",
    color: "warning",
  },
};

export function PriceTierConfigSection({
  config = DEFAULT_CONFIG,
  onChange,
}: PriceTierConfigSectionProps) {
  const [localConfig, setLocalConfig] = useState<PriceTierConfig>({
    ...DEFAULT_CONFIG,
    ...config,
  });

  const handleNameChange = (tier: PriceTier, name: string) => {
    const updated = {
      ...localConfig,
      [tier]: { ...localConfig[tier], name },
    };
    setLocalConfig(updated);
    onChange(updated);
  };

  const handleEnabledChange = (tier: PriceTier, enabled: boolean) => {
    // Retail must always be enabled
    if (tier === "retail" && !enabled) return;

    const updated = {
      ...localConfig,
      [tier]: { ...localConfig[tier], enabled },
    };
    setLocalConfig(updated);
    onChange(updated);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-divider/10 bg-content2/30 p-4">
        <div className="flex items-center gap-2">
          <Tags size={18} className="text-primary" />
          <h3 className="text-sm font-bold text-foreground">Listas de Precios</h3>
        </div>
        <p className="mt-2 text-xs text-default-500">
          Configurá los nombres y habilitación de las listas de precios. 
          Los precios se asignan por producto y se aplican según la lista configurada para cada cliente.
        </p>
      </div>

      {/* Tier configurations */}
      <div className="space-y-4">
        {TIER_ORDER.map((tier) => {
          const tierConfig = localConfig[tier];
          const tierMeta = TIER_LABELS[tier];
          const isRetail = tier === "retail";

          return (
            <div
              key={tier}
              className={`rounded-2xl border p-4 transition-all ${
                tierConfig.enabled
                  ? `border-${tierMeta.color}/20 bg-${tierMeta.color}/5`
                  : "border-divider/30 bg-content2/20 opacity-60"
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full bg-${tierMeta.color}`}
                    />
                    <p className="text-sm font-semibold text-foreground">
                      {tierMeta.label}
                    </p>
                    {isRetail && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-default-500">
                    {tierMeta.description}
                  </p>
                </div>

                <Switch
                  isSelected={tierConfig.enabled}
                  onValueChange={(checked) => handleEnabledChange(tier, checked)}
                  isDisabled={isRetail}
                  size="sm"
                  aria-label={`Habilitar ${tierMeta.label}`}
                />
              </div>

              {tierConfig.enabled && (
                <div className="mt-4">
                  <Input
                    label="Nombre personalizado"
                    placeholder={TIER_LABELS[tier].label.split(" ")[0]}
                    value={tierConfig.name}
                    onChange={(e) => handleNameChange(tier, e.target.value)}
                    variant="bordered"
                    size="sm"
                    classNames={{
                      input: "text-sm",
                      label: "text-xs",
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Info note */}
      <div className="flex items-start gap-2 rounded-xl border border-divider/20 bg-content2/20 p-3">
        <Info size={14} className="mt-0.5 shrink-0 text-default-400" />
        <p className="text-xs text-default-500">
          <strong className="text-foreground">Nota:</strong> Los precios de cada lista se configuran 
          individualmente en cada producto. Los clientes sin lista asignada usarán automáticamente 
          los precios de Minorista.
        </p>
      </div>
    </div>
  );
}

export default PriceTierConfigSection;
