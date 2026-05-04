import { Navigate } from "react-router-dom";
import { usePlanFeatures, Feature } from "@/hooks/usePlanFeatures";

interface PlanGuardProps {
  feature: Feature;
  children: React.ReactNode;
  fallback?: string;
}

export default function PlanGuard({ feature, children, fallback = "/" }: PlanGuardProps) {
  const { hasFeature } = usePlanFeatures();

  if (!hasFeature(feature)) {
    return <Navigate to={fallback} replace />;
  }

  return <>{children}</>;
}
