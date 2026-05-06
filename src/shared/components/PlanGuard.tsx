import { usePlanFeatures, Feature } from "@shared/hooks/usePlanFeatures";
import UpgradeRequired from "@features/shared/pages/UpgradeRequired";

interface PlanGuardProps {
  feature: Feature;
  children: React.ReactNode;
}

export default function PlanGuard({ feature, children }: PlanGuardProps) {
  const { hasFeature } = usePlanFeatures();

  if (!hasFeature(feature)) {
    return <UpgradeRequired feature={feature} />;
  }

  return <>{children}</>;
}
