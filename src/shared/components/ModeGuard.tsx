import { Navigate } from "react-router-dom";
import { useExperienceMode, ExperienceMode } from "@shared/hooks/useExperienceMode";
import { useAppToast } from "@features/notifications/components/AppToast";

const MODE_RANK: Record<ExperienceMode, number> = {
  simple: 0,
  intermediate: 1,
  full: 2,
};

interface ModeGuardProps {
  children: React.ReactNode;
  minMode: ExperienceMode;
}

export default function ModeGuard({ children, minMode }: ModeGuardProps) {
  const { mode } = useExperienceMode();
  const { showToast } = useAppToast();

  const currentRank = MODE_RANK[mode] ?? 0;
  const requiredRank = MODE_RANK[minMode] ?? 0;

  if (currentRank < requiredRank) {
    showToast({ variant: "warning", message: "No disponible en este modo" });
    return <Navigate replace to="/" />;
  }

  return <>{children}</>;
}
