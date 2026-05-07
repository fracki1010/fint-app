import { useMemo } from "react";
import { useAuth } from "@features/auth/hooks/useAuth";

export type Feature =
  | "financial_center"
  | "recipes"
  | "advanced_reports"
  | "api_access"
  | "supplier_account"
  | "client_account"
  | "team_management"
  | "unlimited_products"
  | "unlimited_orders"
  | "banking";

const FEATURE_MATRIX: Record<string, Feature[]> = {
  essential: [],
  business: ["financial_center", "recipes", "supplier_account", "client_account", "team_management", "unlimited_products", "unlimited_orders", "banking"],
  enterprise: [
    "financial_center",
    "recipes",
    "advanced_reports",
    "api_access",
    "supplier_account",
    "client_account",
    "team_management",
    "unlimited_products",
    "unlimited_orders",
    "banking",
  ],
};

export function usePlanFeatures() {
  const { user } = useAuth();
  const tenant = user?.tenant;
  const plan = tenant?.plan || "essential";
  const features = tenant?.enabledFeatures ?? FEATURE_MATRIX[plan] ?? [];
  const limits = tenant?.limits;
  const usage = tenant?.usage;

  const hasFeature = (feature: Feature) => {
    return features.includes(feature);
  };

  const isTrial = useMemo(() => {
    if (!tenant?.trialEndsAt) return false;
    return new Date(tenant.trialEndsAt) > new Date();
  }, [tenant?.trialEndsAt]);

  const trialDaysLeft = useMemo(() => {
    if (!tenant?.trialEndsAt) return 0;
    const diff = new Date(tenant.trialEndsAt).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [tenant?.trialEndsAt]);

  const limitStatus = useMemo(() => {
    if (!limits || !usage) return null;

    const isUnlimited = (max: number | null | undefined) =>
      max === null || max === undefined || max === -1 || max === Infinity || max === 0;

    const checkLimit = (current: number, max: number | null | undefined) => {
      if (isUnlimited(max)) return { percentage: 0, status: "ok" as const };
      const safeMax = Number(max);
      if (!Number.isFinite(safeMax) || safeMax <= 0) return { percentage: 0, status: "ok" as const };
      const percentage = Math.round((current / safeMax) * 100);
      return {
        percentage,
        status: percentage >= 100 ? "exceeded" : percentage >= 90 ? "warning" : "ok",
      };
    };

    return {
      users: checkLimit(usage.currentUsers ?? 0, limits.maxUsers),
      products: checkLimit(usage.currentProducts ?? 0, limits.maxProducts),
      orders: checkLimit(usage.ordersThisMonth ?? 0, limits.maxOrdersPerMonth),
    };
  }, [limits, usage]);

  const anyLimitWarning = useMemo(() => {
    if (!limitStatus) return false;
    return Object.values(limitStatus).some((l) => l.status === "warning" || l.status === "exceeded");
  }, [limitStatus]);

  const anyLimitExceeded = useMemo(() => {
    if (!limitStatus) return false;
    return Object.values(limitStatus).some((l) => l.status === "exceeded");
  }, [limitStatus]);

  return {
    plan,
    features,
    hasFeature,
    isTrial,
    trialDaysLeft,
    limits,
    usage,
    limitStatus,
    anyLimitWarning,
    anyLimitExceeded,
    tenant,
  };
}
