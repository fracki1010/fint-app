import { useState } from "react";
import { FileDown } from "lucide-react";
import {
  FinancialEmptyState,
  FinancialErrorState,
  FinancialLoadingState,
} from "@/components/financial/FinancialState";
import { useFinancialProductAnalysis } from "@/hooks/useFinancial";
import { useFinancialFilters } from "@/hooks/useFinancialFilters";
import { downloadExport } from "@/utils/export";

const DIST_COLORS = [
  { dot: "bg-primary", text: "text-primary" },
  { dot: "bg-blue-400", text: "text-blue-400" },
  { dot: "bg-slate-400", text: "text-slate-400" },
  { dot: "bg-emerald-400", text: "text-emerald-400" },
];

function heatColor(value: number) {
  if (value >= 75) return "bg-primary";
  if (value >= 55) return "bg-primary/75";
  if (value >= 35) return "bg-primary/45";
  return "bg-primary/20";
}

function statusBadge(status: string) {
  if (status === "Optimo")
    return "inline-flex items-center rounded-full bg-success/15 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-success";
  if (status === "Escalando")
    return "inline-flex items-center rounded-full bg-primary/15 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-primary";
  return "inline-flex items-center rounded-full bg-warning/15 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-warning";
}

function buildConicGradient(distribution: Array<{ name: string; share: number }>) {
  const colors = ["var(--heroui-primary)", "#60a5fa", "#94a3b8", "#34d399"];
  let cursor = 0;
  const stops = distribution.map((item, i) => {
    const from = cursor;
    cursor += item.share;
    return `${colors[i % colors.length]} ${from}% ${cursor}%`;
  });
  return `conic-gradient(${stops.join(",")})`;
}

type TableTab = "todos" | "top10" | "bajo";

export default function ProductAnalysisPage() {
  const { filters, setFilters } = useFinancialFilters({ daysBack: 28 });
  const { data, loading, error } = useFinancialProductAnalysis(filters);
  const [tab, setTab] = useState<TableTab>("todos");

  const categories = data?.availableCategories || [];
  const heatmapValues = data?.heatmap?.length ? data.heatmap : [];
  const distribution = data?.salesDistribution || [];
  const kpis = data?.kpis || { stockRotation: 0, avgMargin: 0, activeSkus: 0 };

  const allProducts = data?.allProducts || [];
  const topProducts = data?.topProducts || [];

  const tableRows = (() => {
    const source =
      tab === "top10"
        ? topProducts
        : tab === "bajo"
          ? allProducts.filter((p) => p.status === "Revisar")
          : allProducts;
    return source.map((item) => ({
      name: item.name,
      category: item.category,
      netMargin: `${item.netMargin.toFixed(1)}%`,
      roi: `${item.roi.toFixed(1)}x`,
      volume: item.volume.toLocaleString("en-US"),
      status: item.status,
    }));
  })();

  const totalShare = distribution.reduce((sum, item) => sum + item.share, 0);
  const conicStyle = distribution.length > 0 ? buildConicGradient(distribution) : undefined;

  const kpiCards = [
    {
      icon: "↻",
      label: "Rotación de Stock",
      value: kpis.stockRotation.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
      unit: "veces/mes",
      badge: "+12.5%",
      badgeColor: "text-success",
    },
    {
      icon: "↗",
      label: "Rentabilidad Promedio",
      value: `${kpis.avgMargin.toFixed(1)}%`,
      unit: "",
      badge: "+4.2%",
      badgeColor: "text-success",
    },
    {
      icon: "◈",
      label: "SKUs Activos",
      value: kpis.activeSkus.toLocaleString("en-US"),
      unit: "",
      badge: "Estable",
      badgeColor: "text-primary",
    },
  ];

  return (
    <section className="space-y-6 overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="financial-page-title">Análisis de Productos</h1>
          <p className="mt-1 text-sm text-default-500">
            Desglose en tiempo real de márgenes, ROI y distribución por categoría.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-xl border border-divider/70 bg-content1 px-3 py-2 text-sm text-default-600">
            <span className="text-primary">🗓</span>
            <input
              className="bg-transparent text-sm outline-none"
              type="date"
              value={filters.startDate || ""}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            />
            <span className="text-default-400">–</span>
            <input
              className="bg-transparent text-sm outline-none"
              type="date"
              value={filters.endDate || ""}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            />
          </div>
          <select
            className="rounded-xl border border-divider/70 bg-content1 px-3 py-2 text-sm text-default-600 outline-none"
            value={filters.category || ""}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
          >
            <option value="">Todas las Categorías</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <button
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            onClick={() => {
              downloadExport("product-analysis", {
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
      </div>

      {loading && !data && <FinancialLoadingState />}
      {error && <FinancialErrorState message={error} />}
      {!loading && !error && data && tableRows.length === 0 && distribution.length === 0 && (
        <FinancialEmptyState label="Analisis" />
      )}

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {kpiCards.map((card) => (
          <article className="financial-card" key={card.label}>
            <div className="flex items-start justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-content2 text-lg text-primary">
                {card.icon}
              </div>
              <span className={`text-xs font-semibold ${card.badgeColor}`}>{card.badge}</span>
            </div>
            <p className="mt-4 text-xs uppercase tracking-[0.12em] text-default-500">{card.label}</p>
            <p className="mt-1 text-3xl font-semibold tracking-[-0.02em]">
              {card.value}
              {card.unit && (
                <span className="ml-1 text-base font-normal text-default-500">{card.unit}</span>
              )}
            </p>
          </article>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid gap-4 xl:grid-cols-[1fr_2fr]">
        {/* Distribución de Ventas */}
        <article className="financial-card">
          <h2 className="financial-section-title">Distribución de Ventas</h2>
          <p className="mt-1 text-sm text-default-500">Participación por línea de negocio principal.</p>
          <div className="mx-auto mt-6 flex h-44 w-44 items-center justify-center rounded-full p-5"
            style={{ background: conicStyle || "conic-gradient(var(--heroui-primary) 0% 100%)" }}>
            <div className="flex h-full w-full items-center justify-center rounded-full bg-content1">
              <div className="text-center">
                <p className="text-3xl font-semibold tracking-[-0.03em]">{totalShare}%</p>
                <p className="text-[10px] uppercase tracking-[0.14em] text-default-500">
                  Mezcla por<br />Categoría
                </p>
              </div>
            </div>
          </div>
          <div className="mt-6 space-y-2 text-sm">
            {distribution.map((item, i) => (
              <div className="flex items-center justify-between" key={item.name}>
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${DIST_COLORS[i % DIST_COLORS.length].dot}`} />
                  <span className="text-default-600">{item.name}</span>
                </div>
                <strong>{item.share}%</strong>
              </div>
            ))}
            {distribution.length === 0 && (
              <p className="text-sm text-default-500">Sin distribución para los filtros.</p>
            )}
          </div>
        </article>

        {/* Mapa de Intensidad */}
        <article className="financial-card">
          <h2 className="financial-section-title">Mapa de Intensidad</h2>
          <p className="mt-1 text-sm text-default-500">
            Frecuencia de demanda por línea de producto.
          </p>
          <div className="mt-6 space-y-2.5">
            {heatmapValues.map((row, rowIndex) => (
              <div className="grid grid-cols-7 gap-2" key={`row-${rowIndex}`}>
                {row.map((cell, index) => (
                  <div
                    className={`h-10 rounded-lg ${heatColor(cell)}`}
                    key={`cell-${rowIndex}-${index}`}
                  />
                ))}
              </div>
            ))}
            {heatmapValues.length === 0 && (
              <p className="text-sm text-default-500">Sin datos de intensidad.</p>
            )}
          </div>
          {heatmapValues.length > 0 && (
            <div className="mt-4 flex items-center justify-end gap-2 text-xs text-default-500">
              <span>BAJA DEMANDA</span>
              <div className="flex gap-1">
                <span className="h-3 w-5 rounded bg-primary/20" />
                <span className="h-3 w-5 rounded bg-primary/45" />
                <span className="h-3 w-5 rounded bg-primary/75" />
                <span className="h-3 w-5 rounded bg-primary" />
              </div>
              <span>ALTA DEMANDA</span>
            </div>
          )}
        </article>
      </div>

      {/* Tabla productos */}
      <article className="financial-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="financial-section-title">Productos con Mejor Rendimiento</h2>
          <div className="flex items-center gap-1 rounded-xl border border-divider/70 p-1">
            {(["todos", "top10", "bajo"] as TableTab[]).map((t) => {
              const label = t === "todos" ? "Todos" : t === "top10" ? "Top 10" : "Bajo Rendimiento";
              return (
                <button
                  key={t}
                  className={`rounded-lg px-3 py-1 text-xs font-semibold transition-colors ${
                    tab === t
                      ? "bg-content2 text-foreground"
                      : "text-default-500 hover:text-default-700"
                  }`}
                  onClick={() => setTab(t)}
                  type="button"
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[860px]">
            <thead>
              <tr className="text-left text-xs uppercase tracking-[0.14em] text-default-500">
                <th className="pb-3 pr-4">Producto</th>
                <th className="pb-3 pr-4">Categoría</th>
                <th className="pb-3 pr-4">Margen Neto</th>
                <th className="pb-3 pr-4">ROI</th>
                <th className="pb-3 pr-4">Volumen</th>
                <th className="pb-3 pr-4">Estado</th>
                <th className="pb-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row) => (
                <tr className="border-t border-divider/70" key={row.name}>
                  <td className="py-3 pr-4 text-sm font-medium">{row.name}</td>
                  <td className="py-3 pr-4 text-sm text-default-500">{row.category}</td>
                  <td className="py-3 pr-4 text-sm">{row.netMargin}</td>
                  <td className="py-3 pr-4 text-sm font-semibold text-primary">{row.roi}</td>
                  <td className="py-3 pr-4 text-sm">{row.volume}</td>
                  <td className="py-3 pr-4">
                    <span className={statusBadge(row.status)}>{row.status}</span>
                  </td>
                  <td className="py-3 text-right">
                    <button
                      className="rounded-lg border border-divider/70 px-2 py-1 text-xs text-default-500 hover:bg-content2/60"
                      type="button"
                    >
                      •••
                    </button>
                  </td>
                </tr>
              ))}
              {tableRows.length === 0 && (
                <tr>
                  <td className="py-6 text-sm text-default-500" colSpan={7}>
                    No hay productos para los filtros seleccionados.
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
