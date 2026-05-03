import { FileDown } from "lucide-react";
import { FinancialFilterBar } from "@/components/financial/FinancialFilterBar";
import {
  FinancialEmptyState,
  FinancialErrorState,
  FinancialLoadingState,
} from "@/components/financial/FinancialState";
import { useFinancialAccounting } from "@/hooks/useFinancial";
import { useFinancialFilters } from "@/hooks/useFinancialFilters";
import { downloadExport } from "@/utils/export";

function ledgerStatusBadge(status: string) {
  if (status === "Conciliado")
    return "inline-flex items-center rounded-full bg-success/15 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-success";
  if (status === "Pendiente")
    return "inline-flex items-center rounded-full bg-warning/15 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-warning";
  return "inline-flex items-center rounded-full bg-danger/15 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-danger";
}

function deltaColor(delta: string) {
  if (delta.startsWith("+") && !delta.startsWith("+0.0")) return "text-success";
  if (delta.startsWith("-")) return "text-danger";
  return "text-default-400";
}

export default function AccountingStatementsPage() {
  const { filters, setFilters, resetFilters } = useFinancialFilters({
    ytd: true,
  });
  const { data, loading, error } = useFinancialAccounting(filters);
  const categories = data?.availableCategories || [];
  const summary = data?.balanceSummary?.length
    ? data.balanceSummary.map((item) => ({
        label: item.label,
        value: `$${item.value.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`,
        delta: `${item.delta >= 0 ? "+" : ""}${item.delta.toFixed(1)}%`,
      }))
    : [];
  const ledger = data?.ledgerRows || [];
  const income = data?.incomeStatement || {
    netRevenueYtd: 0,
    grossMargin: 0,
    operatingExpenses: 0,
    ebitdaProxy: 0,
  };

  return (
    <section className="space-y-6 overflow-x-hidden">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-default-500">
            Resumen Financiero
          </p>
          <h1 className="mt-2 financial-page-title">
            Contabilidad y Estados
          </h1>
        </div>
        <button
          className="flex items-center gap-2 rounded-xl border border-divider/70 px-4 py-2 text-sm font-semibold text-default-600 transition-colors hover:bg-content2/60"
          onClick={resetFilters}
          type="button"
        >
          Reiniciar
        </button>
        <button
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          onClick={() => {
            downloadExport("accounting", {
              startDate: filters.startDate,
              endDate: filters.endDate,
              category: filters.category,
            }).catch(() => {});
          }}
          type="button"
        >
          <FileDown size={15} />
          Exportar
        </button>
      </div>

      <FinancialFilterBar
        categories={categories}
        filters={filters}
        hideHeader
        onChange={setFilters}
      />

      {loading && !data && <FinancialLoadingState />}
      {error && <FinancialErrorState message={error} />}
      {!loading &&
        !error &&
        data &&
        summary.length === 0 &&
        ledger.length === 0 && <FinancialEmptyState label="Contabilidad" />}

      <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <article className="financial-card">
          <div className="flex items-center justify-between">
            <h2 className="financial-section-title">Resumen de Balance</h2>
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              FY 2024 T3
            </span>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {summary.map((item) => (
              <div className="rounded-2xl border border-divider/70 p-4" key={item.label}>
                <p className="text-xs uppercase tracking-[0.12em] text-default-500">
                  {item.label}
                </p>
                <p className="mt-2 text-2xl font-semibold tracking-[-0.02em]">
                  {item.value}
                </p>
                <p className={`mt-1 text-xs font-medium ${deltaColor(item.delta)}`}>
                  {item.delta}
                </p>
              </div>
            ))}
          </div>
        </article>

        <article className="financial-card financial-card-accent">
          <p className="text-xs uppercase tracking-[0.14em] text-primary-100/80">
            Estado de Resultados
          </p>
          <p className="mt-4 text-4xl font-semibold tracking-[-0.03em] text-white">
            ${income.netRevenueYtd.toLocaleString("en-US", { maximumFractionDigits: 0 })}
          </p>
          <p className="mt-2 text-sm text-primary-100">Ingresos Netos YTD</p>
          <div className="mt-8 space-y-3 text-sm text-primary-100">
            <div className="flex justify-between">
              <span>Margen Bruto</span>
              <span className="font-semibold">{income.grossMargin.toFixed(1)}%</span>
            </div>
            <div className="h-2 rounded-full bg-white/20">
              <div
                className="h-full rounded-full bg-primary-200"
                style={{ width: `${Math.max(8, Math.min(100, income.grossMargin))}%` }}
              />
            </div>
            <div className="flex justify-between">
              <span>Gastos Operativos</span>
              <span className="font-semibold">
                ${income.operatingExpenses.toLocaleString("en-US", { maximumFractionDigits: 0 })}
              </span>
            </div>
            <div className="flex justify-between">
              <span>EBITDA Proyectado</span>
              <span className="font-semibold">
                ${income.ebitdaProxy.toLocaleString("en-US", { maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>
        </article>
      </div>

      <article className="financial-card">
        <h2 className="financial-section-title">Libro de Transacciones</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[820px]">
            <thead>
              <tr className="text-left text-xs uppercase tracking-[0.14em] text-default-500">
                <th className="pb-3 pr-4">Fecha</th>
                <th className="pb-3 pr-4">Descripción</th>
                <th className="pb-3 pr-4">Categoría</th>
                <th className="pb-3 pr-4">Ref ID</th>
                <th className="pb-3 pr-4 text-right">Débito (-)</th>
                <th className="pb-3 pr-4 text-right">Crédito (+)</th>
                <th className="pb-3 text-right">Estado</th>
              </tr>
            </thead>
            <tbody>
              {ledger.map((row) => (
                <tr className="border-t border-divider/70" key={row.refId}>
                  <td className="py-3 pr-4 text-sm text-default-500">{row.date}</td>
                  <td className="py-3 pr-4 text-sm font-medium">{row.description}</td>
                  <td className="py-3 pr-4 text-sm text-default-500">{row.category}</td>
                  <td className="py-3 pr-4 text-sm text-default-500">{row.refId}</td>
                  <td className="py-3 pr-4 text-right text-sm font-medium text-danger">
                    {row.debit !== "—" ? row.debit : <span className="text-default-400">—</span>}
                  </td>
                  <td className="py-3 pr-4 text-right text-sm font-medium">
                    {row.credit !== "—" ? row.credit : <span className="text-default-400">—</span>}
                  </td>
                  <td className="py-3 text-right">
                    <span className={ledgerStatusBadge(row.status)}>{row.status}</span>
                  </td>
                </tr>
              ))}
              {ledger.length === 0 && (
                <tr>
                  <td className="py-6 text-sm text-default-500" colSpan={7}>
                    No hay registros para los filtros seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}
