import { useState } from "react";
import { Link } from "react-router-dom";
import { 
  Wallet, 
  AlertCircle, 
  ChevronRight,
  Clock,
  AlertTriangle
} from "lucide-react";
import { ReceivablesSummary } from "@shared/types";
import { formatCurrency, formatCompactCurrency } from "@shared/utils/currency";

interface ReceivablesSummaryCardProps {
  data: ReceivablesSummary | null;
  currency: string;
  loading?: boolean;
}

const AGING_BUCKET_COLORS: Record<string, string> = {
  current: "bg-success",
  "1-30": "bg-warning",
  "31-60": "bg-orange-500",
  "61-90": "bg-danger",
  "90+": "bg-red-900",
};

export function ReceivablesSummaryCard({ data, currency, loading }: ReceivablesSummaryCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  if (loading) {
    return (
      <div className="app-panel rounded-[28px] p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-5 w-5 animate-pulse rounded bg-content2" />
          <div className="h-5 w-32 animate-pulse rounded bg-content2" />
        </div>
        <div className="space-y-3">
          <div className="h-16 animate-pulse rounded-xl bg-content2" />
          <div className="h-8 animate-pulse rounded-xl bg-content2" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="app-panel rounded-[28px] p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="section-kicker">Cuentas por Cobrar</h2>
          <Wallet className="text-primary" size={18} />
        </div>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-content2/50">
            <Wallet className="text-default-400" size={28} />
          </div>
          <p className="mt-3 text-sm text-default-500">No hay datos disponibles</p>
        </div>
      </div>
    );
  }

  const { summary, agingSummary, topOverdueClients, creditAlerts } = data;
  const hasOverdue = summary.overdueAmount > 0;
  const hasAlerts = creditAlerts.length > 0;

  // Calculate percentages for the bar
  const total = agingSummary.totalOutstanding || 1; // Avoid division by zero
  const bucketPercentages = {
    current: (agingSummary.current / total) * 100,
    "1-30": (agingSummary["1-30"] / total) * 100,
    "31-60": (agingSummary["31-60"] / total) * 100,
    "61-90": (agingSummary["61-90"] / total) * 100,
    "90+": (agingSummary["90+"] / total) * 100,
  };

  return (
    <div className="app-panel rounded-[28px] p-5">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="section-kicker">Cuentas por Cobrar</h2>
          {hasAlerts && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white">
              {creditAlerts.length}
            </span>
          )}
        </div>
        <Link 
          to="/client-account"
          className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
        >
          Ver cuentas
          <ChevronRight size={14} />
        </Link>
      </div>

      {/* Main Amount */}
      <div className="mb-4 flex items-center gap-3">
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
          hasOverdue ? "bg-warning/10" : "bg-success/10"
        }`}>
          {hasOverdue ? (
            <AlertCircle className="text-warning" size={24} />
          ) : (
            <Wallet className="text-success" size={24} />
          )}
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground">
            {formatCurrency(summary.totalReceivables, currency)}
          </p>
          <p className="text-xs text-default-500">
            {summary.totalEntries} facturas pendientes
          </p>
        </div>
      </div>

      {/* Aging Distribution Bar */}
      {summary.totalReceivables > 0 && (
        <div className="mb-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs text-default-500">Distribución por antigüedad</span>
            {hasOverdue && (
              <span className="text-xs font-semibold text-danger">
                {formatCurrency(summary.overdueAmount, currency)} vencido
              </span>
            )}
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-content2 flex">
            {Object.entries(bucketPercentages).map(([bucket, percentage]) => {
              if (percentage <= 0) return null;
              return (
                <div
                  key={bucket}
                  className={`${AGING_BUCKET_COLORS[bucket]} h-full transition-all`}
                  style={{ width: `${percentage}%` }}
                  title={`${bucket}: ${percentage.toFixed(1)}%`}
                />
              );
            })}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {Object.entries(agingSummary)
              .filter(([key]) => key !== "totalOutstanding")
              .filter(([, value]) => value > 0)
              .map(([bucket, value]) => (
                <div key={bucket} className="flex items-center gap-1">
                  <div className={`h-2 w-2 rounded-full ${AGING_BUCKET_COLORS[bucket]}`} />
                  <span className="text-[10px] text-default-500">
                    {bucket === "current" ? "Al día" : bucket}:
                  </span>
                  <span className="text-[10px] font-semibold text-foreground">
                    {formatCompactCurrency(value, currency)}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Expandable Details */}
      {((topOverdueClients && topOverdueClients.length > 0) || (creditAlerts && creditAlerts.length > 0)) && (
        <>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex w-full items-center justify-between rounded-xl bg-content2/50 px-3 py-2 text-xs font-semibold text-default-600 hover:bg-content2 transition"
          >
            <span>Detalles</span>
            <span className="flex items-center gap-1">
              {showDetails ? "Ocultar" : "Ver más"}
              <ChevronRight size={14} className={`transition-transform ${showDetails ? "rotate-90" : ""}`} />
            </span>
          </button>

          {showDetails && (
            <div className="mt-3 space-y-3">
              {/* Overdue Clients */}
              {topOverdueClients && topOverdueClients.length > 0 && (
                <div>
                  <h4 className="mb-2 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-default-500">
                    <Clock size={12} />
                    Clientes con más vencido
                  </h4>
                  <div className="space-y-1">
                    {topOverdueClients.slice(0, 3).map((client) => (
                      <div 
                        key={client.clientId}
                        className="flex items-center justify-between rounded-lg bg-content2/30 px-3 py-2"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-foreground">
                            {client.clientName}
                          </p>
                          <p className="text-[10px] text-default-500">
                            {client.daysOverdue} días · {client.overdueCount} facturas
                          </p>
                        </div>
                        <span className="text-sm font-bold text-danger">
                          {formatCompactCurrency(client.overdueAmount, currency)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Credit Alerts */}
              {creditAlerts && creditAlerts.length > 0 && (
                <div>
                  <h4 className="mb-2 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-danger">
                    <AlertTriangle size={12} />
                    Alertas de crédito
                  </h4>
                  <div className="space-y-1">
                    {creditAlerts.slice(0, 3).map((alert) => (
                      <div 
                        key={alert.clientId}
                        className="flex items-center justify-between rounded-lg bg-danger/5 px-3 py-2"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-foreground">
                            {alert.clientName}
                          </p>
                          <p className="text-[10px] text-default-500">
                            {alert.utilizationPercentage.toFixed(0)}% de límite usado
                          </p>
                        </div>
                        <span className={`text-sm font-bold ${
                          alert.status === "over_limit" ? "text-danger" : "text-warning"
                        }`}>
                          {formatCompactCurrency(alert.currentBalance, currency)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default ReceivablesSummaryCard;
