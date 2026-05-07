import { PriceTier } from "@shared/types";
import { getTierDisplayName } from "@features/products/utils/priceResolver";
import { Tags } from "lucide-react";

interface TierBadgeProps {
  tier: PriceTier;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  tierConfig?: Record<PriceTier, { name: string; enabled: boolean }>;
}

const TIER_BADGE_COLORS: Record<PriceTier, string> = {
  retail: "bg-primary/10 text-primary border-primary/20",
  wholesale: "bg-success/10 text-success border-success/20",
  distributor: "bg-warning/10 text-warning border-warning/20",
};

const TIER_ORDER_LABELS: Record<PriceTier, string> = {
  retail: "Minorista",
  wholesale: "Mayorista",
  distributor: "Distribuidor",
};

const SIZE_CLASSES = {
  sm: "px-2 py-0.5 text-[10px]",
  md: "px-2.5 py-1 text-xs",
  lg: "px-3 py-1.5 text-sm",
};

export function TierBadge({
  tier,
  size = "md",
  showIcon = true,
  tierConfig,
}: TierBadgeProps) {
  const displayName = tierConfig?.[tier]?.name || getTierDisplayName(tier);
  const orderLabel = TIER_ORDER_LABELS[tier];

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-semibold ${TIER_BADGE_COLORS[tier]} ${SIZE_CLASSES[size]}`}
    >
      {showIcon && <Tags size={size === "sm" ? 10 : size === "lg" ? 14 : 12} />}
      <span>{displayName}</span>
      {tier !== "retail" && (
        <span className="opacity-60">· {orderLabel}</span>
      )}
    </span>
  );
}

export function TierBadgeSimple({
  tier,
  size = "sm",
  tierConfig,
}: Omit<TierBadgeProps, "showIcon">) {
  const displayName = tierConfig?.[tier]?.name || getTierDisplayName(tier);

  return (
    <span
      className={`inline-flex items-center rounded-full border font-semibold ${TIER_BADGE_COLORS[tier]} ${SIZE_CLASSES[size]}`}
    >
      {displayName}
    </span>
  );
}

export default TierBadge;
