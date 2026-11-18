import { AlertTriangle } from "lucide-react";
import { FinancialSkeleton } from "@shared/components/skeleton/screens";

export function FinancialLoadingState() {
  return <FinancialSkeleton />;
}

export function FinancialErrorState({ message }: { message: string }) {
  return (
    <div className="financial-card flex items-start gap-3 border-danger/30">
      <AlertTriangle className="financial-icon mt-0.5 text-danger" />
      <div>
        <p className="text-sm font-semibold text-danger">No se pudieron cargar los datos financieros</p>
        <p className="mt-1 text-sm text-default-500">{message}</p>
      </div>
    </div>
  );
}

export function FinancialEmptyState({ label }: { label: string }) {
  return (
    <div className="financial-card text-sm text-default-500">
      No hay datos disponibles para los filtros actuales en {label}.
    </div>
  );
}
