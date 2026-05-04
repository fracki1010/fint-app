import {
  ArrowDown,
  ArrowUp,
  Building2,
  Package,
  ShoppingCart,
  TriangleAlert,
  Wallet,
  TrendingUp,
  ListOrdered,
  BarChart3,
  CreditCard,
} from "lucide-react";
import { Link } from "react-router-dom";

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
  className = "",
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  trend?: { direction: "up" | "down" | "neutral"; label: string };
  accent?: boolean;
  className?: string;
}) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border border-divider/15 bg-gradient-to-br from-content1 to-content2/60 p-5 transition-all hover:shadow-md ${className}`}>
      {accent && (
        <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-blue-500/5" />
      )}
      <div className="relative">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-default-400">
            {label}
          </span>
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-xl ${
              accent
                ? "bg-gradient-to-br from-blue-500/15 to-blue-600/10 text-blue-500"
                : "bg-default-100 text-default-500"
            }`}
          >
            <Icon size={16} />
          </div>
        </div>
        <p className="mt-4 text-2xl font-bold font-mono text-foreground leading-none">{value}</p>
        {sub && <p className="mt-2 text-xs text-default-500">{sub}</p>}
        {trend && (
          <div
            className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ${
              trend.direction === "up"
                ? "bg-red-500/10 text-red-500"
                : trend.direction === "down"
                  ? "bg-emerald-500/10 text-emerald-500"
                  : "bg-default-100 text-default-500"
            }`}
          >
            {trend.direction === "up" ? (
              <ArrowUp size={11} />
            ) : trend.direction === "down" ? (
              <ArrowDown size={11} />
            ) : null}
            <span>{trend.label}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function TrendChart({
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
    <div className="rounded-2xl border border-divider/15 bg-gradient-to-br from-content1 to-content2/40 p-5">
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-default-400 mb-5">
        <BarChart3 size={14} />
        Gasto mensual (últimos 6 meses)
      </div>
      <div className="flex items-end gap-3 h-40">
        {labels.map((label, i) => {
          const pct = Math.round((totals[i] / max) * 100);
          const isLast = i === labels.length - 1;
          const isMax = totals[i] === max;
          return (
            <div key={label} className="flex flex-1 flex-col items-center gap-2 h-full justify-end">
              <span className={`text-[10px] font-mono font-bold transition-opacity ${
                isLast || isMax ? "text-foreground opacity-100" : "text-default-400 opacity-0 group-hover:opacity-100"
              }`}>
                {totals[i] > 0 ? formatCurrency(totals[i], currency).replace(/\s/g, "") : ""}
              </span>
              <div
                className={`w-full rounded-lg transition-all duration-500 ease-out ${
                  isLast
                    ? "bg-gradient-to-t from-blue-500 to-blue-400"
                    : isMax
                      ? "bg-gradient-to-t from-blue-500/70 to-blue-400/50"
                      : "bg-blue-500/20"
                }`}
                style={{ height: `${Math.max(pct, totals[i] > 0 ? 6 : 0)}%` }}
              />
              <span className={`text-[9px] font-bold ${
                isLast ? "text-blue-500" : "text-default-400"
              }`}>
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TopSuppliers({
  suppliers,
  currency,
}: {
  suppliers: { supplierId: string; name: string; total: number }[];
  currency: string;
}) {
  const max = suppliers.length > 0 ? suppliers[0].total : 1;

  return (
    <div className="rounded-2xl border border-divider/15 bg-gradient-to-br from-content1 to-content2/40 p-5">
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-default-400 mb-4">
        <Building2 size={14} />
        Top proveedores
      </div>
      {suppliers.length === 0 ? (
        <p className="py-8 text-center text-sm text-default-400">Sin datos de proveedores</p>
      ) : (
        <div className="space-y-3">
          {suppliers.map((s, i) => {
            const pct = Math.round((s.total / max) * 100);
            return (
              <div key={s.supplierId} className="group">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-default-100 text-[10px] font-bold text-default-500">
                      {i + 1}
                    </span>
                    <span className="text-sm font-semibold text-foreground truncate">{s.name}</span>
                  </div>
                  <span className="text-xs font-bold font-mono text-default-500 ml-3 shrink-0">
                    {formatCurrency(s.total, currency)}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-default-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500/60 to-blue-500 transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatusBreakdown({
  breakdown,
}: {
  breakdown: Record<string, number>;
}) {
  const STATUS_CONFIG = [
    { key: "RECEIVED", label: "Recibidas", color: "bg-emerald-500", bar: "bg-emerald-500" },
    { key: "CONFIRMED", label: "Confirmadas", color: "bg-blue-500", bar: "bg-blue-500" },
    { key: "DRAFT", label: "Borrador", color: "bg-amber-400", bar: "bg-amber-400" },
    { key: "CANCELLED", label: "Canceladas", color: "bg-red-500", bar: "bg-red-500" },
  ];

  const total = STATUS_CONFIG.reduce((sum, s) => sum + (breakdown[s.key] || 0), 0);

  return (
    <div className="rounded-2xl border border-divider/15 bg-gradient-to-br from-content1 to-content2/40 p-5">
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-default-400 mb-4">
        <ListOrdered size={14} />
        Estado de órdenes
      </div>

      {total > 0 && (
        <div className="mb-4 flex h-2.5 overflow-hidden rounded-full bg-default-100">
          {STATUS_CONFIG.map((s) => {
            const pct = Math.round(((breakdown[s.key] || 0) / total) * 100);
            if (pct === 0) return null;
            return (
              <div
                key={s.key}
                className={`${s.bar} transition-all`}
                style={{ width: `${pct}%` }}
              />
            );
          })}
        </div>
      )}

      <div className="space-y-2.5">
        {STATUS_CONFIG.map((s) => {
          const count = breakdown[s.key] || 0;
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          return (
            <div key={s.key} className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2.5">
                <span className={`h-2.5 w-2.5 rounded-full ${s.color}`} />
                <span className="text-sm text-default-500">{s.label}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="text-sm font-bold text-foreground">{count}</span>
                {total > 0 && (
                  <span className="text-[11px] font-mono text-default-400 min-w-[36px] text-right">{pct}%</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function PurchasesDashboard() {
  const { data, isLoading } = usePurchaseDashboard();
  const { settings } = useSettings();
  const currency = settings?.currency || "USD";

  if (isLoading || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-default-400">
        <div className="mb-3 h-10 w-10 animate-spin rounded-full border-2 border-default-200 border-t-blue-500" />
        <p className="text-sm font-medium">Cargando dashboard...</p>
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
    <div className="mx-auto max-w-2xl space-y-5 lg:max-w-4xl">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25">
          <TrendingUp size={18} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Dashboard de Compras</h1>
          <p className="text-sm text-default-500">Resumen de costos e inventario</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
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
          className={data.lowStockCount > 0 ? "border-amber-400/30" : ""}
        />
        <Link to="/supplier-account" className="block">
          <KpiCard
            label="Cuentas por pagar"
            value={formatCurrency(data.totalPayables, currency)}
            sub="saldo deudor proveedores"
            icon={CreditCard}
            accent={data.totalPayables > 0}
            className={data.totalPayables > 0 ? "border-danger/30 hover:border-danger/50" : "hover:border-primary/30"}
          />
        </Link>
      </div>

      <TrendChart labels={data.trend.labels} totals={data.trend.totals} currency={currency} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <TopSuppliers suppliers={data.topSuppliers} currency={currency} />
        <StatusBreakdown breakdown={data.statusBreakdown} />
      </div>
    </div>
  );
}
