import {
  ArrowDown,
  ArrowUp,
  Building2,
  Package,
  ShoppingCart,
  TriangleAlert,
  Wallet,
} from "lucide-react";

import { usePurchaseDashboard } from "@/hooks/usePurchaseDashboard";
import { useSettings } from "@/hooks/useSettings";
import { formatCurrency } from "@/utils/currency";

function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  trend,
  accent = false,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  trend?: { direction: "up" | "down" | "neutral"; label: string };
  accent?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-content1 p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-default-400">
          {label}
        </span>
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-xl ${accent ? "bg-primary/15 text-primary" : "bg-default-100 text-default-500"}`}
        >
          <Icon size={16} />
        </div>
      </div>
      <p className="text-2xl font-bold text-foreground leading-none">{value}</p>
      {sub && <p className="text-xs text-default-400">{sub}</p>}
      {trend && (
        <div
          className={`flex items-center gap-1 text-xs font-semibold ${
            trend.direction === "up"
              ? "text-danger"
              : trend.direction === "down"
                ? "text-success"
                : "text-default-400"
          }`}
        >
          {trend.direction === "up" ? (
            <ArrowUp size={12} />
          ) : trend.direction === "down" ? (
            <ArrowDown size={12} />
          ) : null}
          <span>{trend.label}</span>
        </div>
      )}
    </div>
  );
}

function TrendBar({
  labels,
  totals,
  currency,
}: {
  labels: string[];
  totals: number[];
  currency: string;
}) {
  const max = Math.max(...totals, 1);

  return (
    <div className="rounded-2xl border border-white/10 bg-content1 p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-default-400 mb-4">
        Gasto mensual (últimos 6 meses)
      </p>
      <div className="flex items-end gap-2 h-32">
        {labels.map((label, i) => {
          const pct = Math.round((totals[i] / max) * 100);
          const isLast = i === labels.length - 1;
          return (
            <div key={label} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-[9px] text-default-400 font-semibold">
                {totals[i] > 0 ? formatCurrency(totals[i], currency).replace(/\s/g, "") : ""}
              </span>
              <div className="w-full flex flex-col justify-end" style={{ height: "80px" }}>
                <div
                  className={`w-full rounded-t-md transition-all ${isLast ? "bg-primary" : "bg-primary/30"}`}
                  style={{ height: `${Math.max(pct, totals[i] > 0 ? 4 : 0)}%` }}
                />
              </div>
              <span className={`text-[9px] font-bold ${isLast ? "text-primary" : "text-default-400"}`}>
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatusBadge({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${color}`} />
        <span className="text-sm text-default-500">{label}</span>
      </div>
      <span className="text-sm font-bold text-foreground">{count}</span>
    </div>
  );
}

const STATUS_CONFIG = [
  { key: "RECEIVED", label: "Recibidas", color: "bg-success" },
  { key: "CONFIRMED", label: "Confirmadas", color: "bg-warning" },
  { key: "DRAFT", label: "Borrador", color: "bg-default-400" },
  { key: "CANCELLED", label: "Canceladas", color: "bg-danger" },
];

export default function PurchasesDashboard() {
  const { data, isLoading } = usePurchaseDashboard();
  const { settings } = useSettings();
  const currency = settings?.currency || "USD";

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center py-24 text-default-400 text-sm">
        Cargando dashboard...
      </div>
    );
  }

  const spendDiff = data.lastMonthSpend > 0
    ? ((data.thisMonthSpend - data.lastMonthSpend) / data.lastMonthSpend) * 100
    : null;

  const spendTrend = spendDiff === null
    ? undefined
    : {
        direction: (Math.abs(spendDiff) < 1 ? "neutral" : spendDiff > 0 ? "up" : "down") as "up" | "down" | "neutral",
        label: `${spendDiff > 0 ? "+" : ""}${spendDiff.toFixed(1)}% vs mes anterior`,
      };

  return (
    <div className="mx-auto max-w-2xl space-y-4 lg:max-w-4xl">
      <div>
        <h1 className="text-xl font-bold text-foreground">Dashboard de Compras</h1>
        <p className="text-sm text-default-400">Resumen de costos e inventario</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          label="Gasto este mes"
          value={formatCurrency(data.thisMonthSpend, currency)}
          sub={`Mes anterior: ${formatCurrency(data.lastMonthSpend, currency)}`}
          icon={ShoppingCart}
          trend={spendTrend}
          accent
        />
        <KpiCard
          label="Pendientes"
          value={String(data.pendingCount)}
          sub="órdenes confirmadas"
          icon={Package}
        />
        <KpiCard
          label="Valor inventario"
          value={formatCurrency(data.inventoryValue, currency)}
          sub="stock × costo referencia"
          icon={Wallet}
        />
        <KpiCard
          label="Stock bajo"
          value={String(data.lowStockCount)}
          sub="insumos bajo mínimo"
          icon={TriangleAlert}
          accent={data.lowStockCount > 0}
        />
      </div>

      <TrendBar labels={data.trend.labels} totals={data.trend.totals} currency={currency} />

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-content1 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-default-400 mb-3">
            Top proveedores
          </p>
          {data.topSuppliers.length === 0 ? (
            <p className="text-sm text-default-400 py-4 text-center">Sin datos</p>
          ) : (
            <div className="space-y-2">
              {data.topSuppliers.map((s) => {
                const max = data.topSuppliers[0]?.total || 1;
                const pct = Math.round((s.total / max) * 100);
                return (
                  <div key={s.supplierId} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <Building2 size={14} className="text-default-400 shrink-0" />
                        <span className="text-sm text-foreground truncate">{s.name}</span>
                      </div>
                      <span className="text-xs font-bold text-default-500 ml-2 shrink-0">
                        {formatCurrency(s.total, currency)}
                      </span>
                    </div>
                    <div className="h-1 w-full rounded-full bg-default-100">
                      <div
                        className="h-1 rounded-full bg-primary/60"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-content1 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-default-400 mb-3">
            Estado de órdenes
          </p>
          {STATUS_CONFIG.map((s) => (
            <StatusBadge
              key={s.key}
              label={s.label}
              count={data.statusBreakdown[s.key] || 0}
              color={s.color}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
