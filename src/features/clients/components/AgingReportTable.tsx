import { useState } from "react";
import { ChevronDown, ChevronUp, AlertCircle, Clock, Calendar } from "lucide-react";
import { ClientAgingReport, AllClientsAgingReport } from "@shared/types";
import { formatCurrency, formatCompactCurrency } from "@shared/utils/currency";

interface AgingReportTableProps {
  data: ClientAgingReport | AllClientsAgingReport;
  currency: string;
  viewMode?: "single" | "all";
}

const AGING_BUCKET_COLORS: Record<string, { bg: string; text: string; border: string; label: string }> = {
  current: { 
    bg: "bg-success/10", 
    text: "text-success", 
    border: "border-success/20",
    label: "Al día"
  },
  "1-30": { 
    bg: "bg-warning/10", 
    text: "text-warning", 
    border: "border-warning/20",
    label: "1-30 días"
  },
  "31-60": { 
    bg: "bg-orange-500/10", 
    text: "text-orange-500", 
    border: "border-orange-500/20",
    label: "31-60 días"
  },
  "61-90": { 
    bg: "bg-danger/10", 
    text: "text-danger", 
    border: "border-danger/20",
    label: "61-90 días"
  },
  "90+": { 
    bg: "bg-red-900/10", 
    text: "text-red-900", 
    border: "border-red-900/20",
    label: "90+ días"
  },
};

function getBucketColorClass(bucket: string, type: "bg" | "text" | "border") {
  const colors: Record<string, Record<string, string>> = {
    current: { bg: "bg-success/10", text: "text-success", border: "border-success/20" },
    "1-30": { bg: "bg-warning/10", text: "text-warning", border: "border-warning/20" },
    "31-60": { bg: "bg-orange-500/10", text: "text-orange-500", border: "border-orange-500/20" },
    "61-90": { bg: "bg-danger/10", text: "text-danger", border: "border-danger/20" },
    "90+": { bg: "bg-red-950/20", text: "text-red-700", border: "border-red-900/20" },
  };
  return colors[bucket]?.[type] || colors["current"][type];
}

function SingleClientRow({ report, currency }: { report: ClientAgingReport; currency: string }) {
  const [expanded, setExpanded] = useState(false);

  const totalOverdue = 
    (report.buckets["1-30"] || 0) +
    (report.buckets["31-60"] || 0) +
    (report.buckets["61-90"] || 0) +
    (report.buckets["90+"] || 0);

  const hasOverdue = totalOverdue > 0;

  return (
    <div className="rounded-2xl border border-white/10 bg-content2 overflow-hidden">
      {/* Header Row */}
      <div className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${hasOverdue ? "bg-danger/10" : "bg-success/10"}`}>
              {hasOverdue ? (
                <AlertCircle className={hasOverdue ? "text-danger" : "text-success"} size={20} />
              ) : (
                <Clock className="text-success" size={20} />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{report.clientName}</h3>
              <p className="text-xs text-default-500">
                Total adeudado: {formatCurrency(report.totalOutstanding, currency)}
              </p>
            </div>
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            {expanded ? (
              <>
                <ChevronUp size={14} /> Ocultar detalle
              </>
            ) : (
              <>
                <ChevronDown size={14} /> Ver detalle
              </>
            )}
          </button>
        </div>

        {/* Bucket Summary */}
        <div className="mt-4 grid grid-cols-5 gap-2">
          {Object.entries(report.buckets).map(([bucket, amount]) => (
            <div 
              key={bucket}
              className={`rounded-xl border p-2 text-center ${getBucketColorClass(bucket, "border")} ${getBucketColorClass(bucket, "bg")}`}
            >
              <p className={`text-[10px] font-bold uppercase tracking-wider ${getBucketColorClass(bucket, "text")}`}>
                {AGING_BUCKET_COLORS[bucket]?.label || bucket}
              </p>
              <p className={`mt-1 text-sm font-bold ${getBucketColorClass(bucket, "text")}`}>
                {formatCompactCurrency(amount || 0, currency)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Expanded Detail */}
      {expanded && report.entries && report.entries.length > 0 && (
        <div className="border-t border-white/10 bg-content1/50 p-4">
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-default-500">
            Detalle de facturas
          </h4>
          <div className="space-y-2">
            {report.entries.flatMap((bucket) => 
              bucket.entries?.map((entry) => (
                <div 
                  key={entry._id}
                  className="flex items-center justify-between rounded-xl bg-content2/50 px-3 py-2"
                >
                  <div className="flex items-center gap-3">
                    <Calendar size={14} className="text-default-400" />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Vencimiento: {new Date(entry.dueDate).toLocaleDateString("es-AR")}
                      </p>
                      <p className="text-xs text-default-500">
                        Emisión: {new Date(entry.date).toLocaleDateString("es-AR")}
                        {entry.daysOverdue > 0 && ` · ${entry.daysOverdue} días vencido`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-foreground">
                      {formatCurrency(entry.remainingAmount, currency)}
                    </p>
                    <p className="text-xs text-default-500">
                      de {formatCurrency(entry.amount, currency)}
                    </p>
                  </div>
                </div>
              )) || []
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function AgingReportTable({ data, currency, viewMode = "single" }: AgingReportTableProps) {
  // Single client view
  if (viewMode === "single" && "clientId" in data) {
    return (
      <div className="space-y-4">
        <SingleClientRow report={data as ClientAgingReport} currency={currency} />
      </div>
    );
  }

  // All clients view
  const allData = data as AllClientsAgingReport;

  return (
    <div className="space-y-4">
      {/* Totals Summary */}
      <div className="rounded-2xl border border-white/10 bg-content2 p-4">
        <h3 className="mb-3 text-sm font-semibold text-foreground">Resumen General</h3>
        <div className="grid grid-cols-5 gap-2">
          {Object.entries(allData.totals)
            .filter(([key]) => key !== "totalOutstanding")
            .map(([bucket, amount]) => (
              <div 
                key={bucket}
                className={`rounded-xl border p-2 text-center ${getBucketColorClass(bucket, "border")} ${getBucketColorClass(bucket, "bg")}`}
              >
                <p className={`text-[10px] font-bold uppercase tracking-wider ${getBucketColorClass(bucket, "text")}`}>
                  {AGING_BUCKET_COLORS[bucket]?.label || bucket}
                </p>
                <p className={`mt-1 text-sm font-bold ${getBucketColorClass(bucket, "text")}`}>
                  {formatCompactCurrency(amount || 0, currency)}
                </p>
              </div>
            ))}
        </div>
        <div className="mt-3 flex items-center justify-between rounded-xl bg-content1/50 px-3 py-2">
          <span className="text-sm text-default-500">Total por cobrar</span>
          <span className="text-lg font-bold text-foreground">
            {formatCurrency(allData.totals.totalOutstanding, currency)}
          </span>
        </div>
      </div>

      {/* Client List */}
      <div className="space-y-3">
        {allData.clients.map((client) => (
          <div 
            key={client.clientId}
            className="rounded-xl border border-white/10 bg-content2 p-3"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <h4 className="font-semibold text-foreground">{client.clientName}</h4>
                {client.clientPhone && (
                  <p className="text-xs text-default-500">{client.clientPhone}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-foreground">
                  {formatCurrency(client.totalOutstanding, currency)}
                </p>
                {client.creditLimit && client.creditLimit > 0 && (
                  <p className="text-xs text-default-500">
                    Límite: {formatCurrency(client.creditLimit, currency)}
                  </p>
                )}
              </div>
            </div>
            {/* Mini bucket bars */}
            <div className="mt-2 flex h-2 overflow-hidden rounded-full">
              {Object.entries(client.buckets).map(([bucket, amount]) => {
                if (amount <= 0) return null;
                const percentage = (amount / client.totalOutstanding) * 100;
                return (
                  <div
                    key={bucket}
                    className={`${getBucketColorClass(bucket, "bg").replace("/10", "")}`}
                    style={{ width: `${percentage}%` }}
                    title={`${AGING_BUCKET_COLORS[bucket]?.label}: ${formatCurrency(amount, currency)}`}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AgingReportTable;
