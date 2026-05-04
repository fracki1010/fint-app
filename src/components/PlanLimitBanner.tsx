import { AlertTriangle, Clock, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { usePlanFeatures } from "@/hooks/usePlanFeatures";

export default function PlanLimitBanner() {
  const { isTrial, trialDaysLeft, limitStatus, anyLimitWarning, anyLimitExceeded } = usePlanFeatures();

  if (isTrial && trialDaysLeft <= 3) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-yellow-500/20 bg-yellow-500/10 px-4 py-2.5 text-xs font-semibold text-yellow-400">
        <Clock size={14} />
        <span>
          Tu período de prueba finaliza en {trialDaysLeft} {trialDaysLeft === 1 ? "día" : "días"}.
        </span>
        <Link to="/admin/company" className="ml-auto flex items-center gap-1 underline underline-offset-2 hover:text-yellow-300">
          Actualizar plan <ArrowUpRight size={12} />
        </Link>
      </div>
    );
  }

  if (anyLimitExceeded) {
    const exceeded = [];
    if (limitStatus?.users?.status === "exceeded") exceeded.push("usuarios");
    if (limitStatus?.products?.status === "exceeded") exceeded.push("productos");
    if (limitStatus?.orders?.status === "exceeded") exceeded.push("ventas mensuales");

    return (
      <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-xs font-semibold text-red-400">
        <AlertTriangle size={14} />
        <span>
          Has excedido el límite de {exceeded.join(", ")}. Actualiza tu plan para continuar sin restricciones.
        </span>
        <Link to="/admin/company" className="ml-auto flex items-center gap-1 underline underline-offset-2 hover:text-red-300">
          Actualizar <ArrowUpRight size={12} />
        </Link>
      </div>
    );
  }

  if (anyLimitWarning) {
    const warnings = [];
    if (limitStatus?.users?.status === "warning") warnings.push(`usuarios (${limitStatus.users.percentage}%)`);
    if (limitStatus?.products?.status === "warning") warnings.push(`productos (${limitStatus.products.percentage}%)`);
    if (limitStatus?.orders?.status === "warning") warnings.push(`ventas mensuales (${limitStatus.orders.percentage}%)`);

    return (
      <div className="flex items-center gap-2 rounded-xl border border-orange-500/20 bg-orange-500/10 px-4 py-2.5 text-xs font-semibold text-orange-400">
        <AlertTriangle size={14} />
        <span>
          Estás cerca del límite de {warnings.join(", ")}.
        </span>
        <Link to="/admin/company" className="ml-auto flex items-center gap-1 underline underline-offset-2 hover:text-orange-300">
          Actualizar <ArrowUpRight size={12} />
        </Link>
      </div>
    );
  }

  return null;
}
