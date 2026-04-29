import { AlertTriangle, Loader2 } from "lucide-react";

export function FinancialLoadingState() {
  return (
    <div className="financial-card flex min-h-44 items-center justify-center gap-3">
      <Loader2 className="financial-icon animate-spin text-primary" />
      <span className="text-sm text-default-500">
        Cargando datos financieros...
      </span>
    </div>
  );
}

export function FinancialErrorState({ message }: { message: string }) {
  return (
    <div className="financial-card flex items-start gap-3 border-danger/30">
      <AlertTriangle className="financial-icon mt-0.5 text-danger" />
      <div>
        <p className="text-sm font-semibold text-danger">
          No se pudieron cargar los datos financieros
        </p>
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
