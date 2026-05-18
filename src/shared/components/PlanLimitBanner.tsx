import { Clock } from "lucide-react";
import { usePlanFeatures } from "@shared/hooks/usePlanFeatures";

export default function PlanLimitBanner() {
  const { isTrial, trialDaysLeft } = usePlanFeatures();

  // Solo mostrar trial próximo a vencer, no limites excedidos
  if (isTrial && trialDaysLeft <= 3) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-yellow-500/20 bg-yellow-500/10 px-4 py-2.5 text-xs font-semibold text-yellow-400">
        <Clock size={14} />
        <span>
          Tu período de prueba finaliza en {trialDaysLeft} {trialDaysLeft === 1 ? "día" : "días"}.
        </span>
      </div>
    );
  }

  return null;
}
