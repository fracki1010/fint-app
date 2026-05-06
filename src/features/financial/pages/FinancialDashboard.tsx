import { useMemo, useState } from "react";
import { AlertTriangle, Bolt, FileDown } from "lucide-react";

import { FinancialFilterBar } from "@features/financial/components/FinancialFilterBar";
import {
  FinancialEmptyState,
  FinancialErrorState,
  FinancialLoadingState,
} from "@features/financial/components/FinancialState";
import { useFinancialOverview } from "@features/financial/hooks/useFinancial";
import { useFinancialFilters } from "@features/financial/hooks/useFinancialFilters";
import { downloadExport } from "@shared/utils/export";

function statusTone(status: string) {
  if (status === "Verificado") return "text-success";
  if (status === "Pendiente") return "text-warning";

  return "text-danger";
}

export default function FinancialDashboardPage() {
  const { filters, setFilters, resetFilters } = useFinancialFilters({
    monthsBack: 6,
  });
  const { data, loading, error } = useFinancialOverview(filters);
  const categories = data?.availableCategories || [];
  const [exporting, setExporting] = useState(false);

  const kpis = useMemo(
    () =>
      (data?.kpis || []).map((item) => ({
        ...item,
        value:
          item.label === "Margen Neto"
            ? `${item.value.toFixed(1)}%`
            : `$${item.value.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`,
        delta:
          item.label === "Margen Neto"
            ? "Margen operativo"
            : `${item.delta >= 0 ? "+" : ""}${item.delta.toFixed(1)}% vs periodo anterior`,
      })),
    [data?.kpis],
  );
  const monthly = data?.monthlyRevenue || [];
  const categoryShares = data?.salesByCategory || [];
  const transactions = data?.recentTransactions || [];
  const insights = data?.systemInsights || [];

  return (
    <section className="space-y-6 overflow-x-hidden">
      <FinancialFilterBar
        categories={categories}
        filters={filters}
        onChange={setFilters}
        onReset={resetFilters}
      />

      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="financial-page-title">Panel Financiero</h1>
          <p className="financial-page-subtitle">
            Vision consolidada de ingresos, categorias y alertas operativas.
          </p>
        </div>
        <button
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          disabled={exporting}
          onClick={() => {
            setExporting(true);
            downloadExport("sales", {
              startDate: filters.startDate,
              endDate: filters.endDate,
              category: filters.category,
            })
              .catch(() => {})
              .finally(() => setExporting(false));
          }}
          type="button"
        >
          <FileDown size={15} />
          {exporting ? "Exportando..." : "Exportar"}
        </button>
      </div>

      {loading && !data && <FinancialLoadingState />}
      {error && <FinancialErrorState message={error} />}
      {!loading &&
        !error &&
        data &&
        kpis.length === 0 &&
        monthly.length === 0 &&
        transactions.length === 0 && <FinancialEmptyState label="Panel" />}

      <div className="grid gap-4 lg:grid-cols-3">
        {kpis.map((kpi, index) => (
          <article
            key={kpi.label}
            className={`financial-card ${index === 0 ? "financial-card-accent" : ""}`}
          >
            <p className="text-xs uppercase tracking-[0.18em] text-default-500">
              {kpi.label}
            </p>
            <p className="mt-3 text-3xl font-semibold tracking-[-0.03em]">
              {kpi.value}
            </p>
            <p
              className={`mt-2 text-sm ${
                kpi.tone === "positive"
                  ? "text-success"
                  : kpi.tone === "negative"
                    ? "text-danger"
                    : "text-primary"
              }`}
            >
              {kpi.delta}
            </p>
          </article>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <article className="financial-card">
          <h2 className="financial-section-title">
            Flujo de Ingresos Mensual
          </h2>
          <p className="mt-1 text-sm text-default-500">
            Seguimiento de rendimiento entre unidades de negocio.
          </p>
          <div className="mt-6 grid h-64 grid-cols-6 items-end gap-3">
            {monthly.map((point) => (
              <div className="flex flex-col items-center gap-2" key={point.month}>
                <div
                  className="w-full rounded-t-xl bg-primary/35"
                  style={{
                    height: `${Math.max(
                      8,
                      Math.round(
                        ((point.value || 0) /
                          Math.max(...monthly.map((p) => p.value || 0), 1)) *
                          100,
                      ),
                    )}%`,
                  }}
                />
                <span className="text-xs text-default-500">{point.month}</span>
              </div>
            ))}
            {monthly.length === 0 && (
              <div className="col-span-6 text-sm text-default-500">
                Sin datos mensuales para los filtros seleccionados.
              </div>
            )}
          </div>
        </article>

        <article className="financial-card">
          <h2 className="financial-section-title">
            Ventas por Categoria
          </h2>
          <div className="mt-6 space-y-4">
            {categoryShares.map((segment) => (
              <div key={segment.name}>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-foreground">{segment.name}</span>
                  <span className="text-sm font-semibold">{segment.share}%</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-primary/12">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${segment.share}%` }}
                  />
                </div>
              </div>
            ))}
            {categoryShares.length === 0 && (
              <p className="text-sm text-default-500">Sin datos por categoria.</p>
            )}
          </div>
        </article>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <article className="financial-card">
          <h2 className="financial-section-title">
            Transacciones Recientes
          </h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[560px]">
              <thead>
                <tr className="text-left text-xs uppercase tracking-[0.16em] text-default-500">
                  <th className="pb-3">Cliente</th>
                  <th className="pb-3">Fecha</th>
                  <th className="pb-3">Estado</th>
                  <th className="pb-3 text-right">Monto</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((item) => (
                  <tr className="border-t border-divider/60" key={item.id}>
                    <td className="py-3 text-sm font-medium">{item.recipient}</td>
                    <td className="py-3 text-sm text-default-500">{item.date}</td>
                    <td className={`py-3 text-sm font-medium ${statusTone(item.status)}`}>
                      {item.status}
                    </td>
                    <td className="py-3 text-right text-sm font-semibold">
                      {item.amount}
                    </td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr>
                    <td className="py-6 text-sm text-default-500" colSpan={4}>
                      Sin transacciones para los filtros seleccionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>

        <article className="financial-card">
          <div className="flex items-center justify-between">
            <h2 className="financial-section-title">
              Alertas del Sistema
            </h2>
            <span className="rounded-full bg-danger/12 px-3 py-1 text-xs font-semibold text-danger">
              Accion Requerida
            </span>
          </div>

          <div className="mt-5 space-y-3">
            {insights.map((insight) => (
              <div
                className={`rounded-2xl border p-4 ${
                  insight.severity === "danger"
                    ? "border-danger/30 bg-danger/5"
                    : "border-warning/30 bg-warning/5"
                }`}
                key={insight.id}
              >
                <div className="flex items-start gap-3">
                  {insight.severity === "danger" ? (
                    <AlertTriangle className="financial-icon mt-1 text-danger" />
                  ) : (
                    <Bolt className="financial-icon mt-1 text-warning" />
                  )}
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {insight.title}
                    </p>
                    <p className="mt-1 text-sm text-default-500">
                      {insight.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {insights.length === 0 && (
              <p className="text-sm text-default-500">Sin alertas activas.</p>
            )}
          </div>
        </article>
      </div>
    </section>
  );
}
