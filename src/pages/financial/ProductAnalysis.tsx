import { FinancialFilterBar } from "@/components/financial/FinancialFilterBar";
import {
  FinancialEmptyState,
  FinancialErrorState,
  FinancialLoadingState,
} from "@/components/financial/FinancialState";
import { useFinancialProductAnalysis } from "@/hooks/useFinancial";
import { useFinancialFilters } from "@/hooks/useFinancialFilters";

function heatColor(value: number) {
  if (value >= 75) return "bg-primary";
  if (value >= 55) return "bg-primary/75";
  if (value >= 35) return "bg-primary/45";

  return "bg-primary/20";
}

export default function ProductAnalysisPage() {
  const { filters, setFilters, resetFilters } = useFinancialFilters({
    daysBack: 28,
  });
  const { data, loading, error } = useFinancialProductAnalysis(filters);
  const categories = data?.availableCategories || [];
  const heatmapValues = data?.heatmap?.length ? data.heatmap : [];
  const distribution = data?.salesDistribution || [];
  const topProducts = data?.topProducts?.length
    ? data.topProducts.map((item) => ({
        name: item.name,
        category: item.category,
        netMargin: `${item.netMargin.toFixed(1)}%`,
        roi: `${item.roi.toFixed(1)}x`,
        volume: item.volume.toLocaleString("en-US"),
        status: item.status,
      }))
    : [];

  return (
    <section className="space-y-6 overflow-x-hidden">
      <FinancialFilterBar
        categories={categories}
        filters={filters}
        onChange={setFilters}
        onReset={resetFilters}
      />
      {loading && !data && <FinancialLoadingState />}
      {error && <FinancialErrorState message={error} />}
      {!loading &&
        !error &&
        data &&
        topProducts.length === 0 &&
        distribution.length === 0 && <FinancialEmptyState label="Analisis" />}

      <div>
        <h1 className="financial-page-title">Analisis de Productos</h1>
        <p className="financial-page-subtitle">
          Desglose en tiempo real de margenes, ROI y distribucion por categoria.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_2fr]">
        <article className="financial-card">
          <h2 className="financial-section-title">Distribucion de Ventas</h2>
          <div className="mx-auto mt-6 h-44 w-44 rounded-full bg-[conic-gradient(var(--heroui-primary)_0_64%,rgb(34_197_94)_64%_86%,rgb(148_163_184)_86%_100%)] p-5">
            <div className="flex h-full w-full items-center justify-center rounded-full bg-content1">
              <div className="text-center">
                <p className="text-3xl font-semibold tracking-[-0.03em]">
                  {distribution.reduce((sum, item) => sum + item.share, 0)}%
                </p>
                <p className="text-xs uppercase tracking-[0.14em] text-default-500">
                  Mezcla por Categoria
                </p>
              </div>
            </div>
          </div>
          <div className="mt-6 space-y-2 text-sm">
            {distribution.map((item) => (
              <div key={item.name} className="flex justify-between">
                <span>{item.name}</span>
                <strong>{item.share}%</strong>
              </div>
            ))}
            {distribution.length === 0 && (
              <p className="text-sm text-default-500">
                Sin distribucion para los filtros.
              </p>
            )}
          </div>
        </article>

        <article className="financial-card">
          <h2 className="financial-section-title">Mapa de Intensidad</h2>
          <p className="mt-1 text-sm text-default-500">
            Frecuencia de demanda por linea de producto.
          </p>
          <div className="mt-6 space-y-3">
            {heatmapValues.map((row, rowIndex) => (
              <div key={`row-${rowIndex}`} className="grid grid-cols-7 gap-2">
                {row.map((cell, index) => (
                  <div
                    key={`cell-${rowIndex}-${index}`}
                    className={`h-9 rounded-md ${heatColor(cell)}`}
                  />
                ))}
              </div>
            ))}
            {heatmapValues.length === 0 && (
              <p className="text-sm text-default-500">
                Sin datos de intensidad.
              </p>
            )}
          </div>
        </article>
      </div>

      <article className="financial-card">
        <h2 className="financial-section-title">
          Productos con Mejor Rendimiento
        </h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[860px]">
            <thead>
              <tr className="text-left text-xs uppercase tracking-[0.14em] text-default-500">
                <th className="pb-3">Producto</th>
                <th className="pb-3">Categoria</th>
                <th className="pb-3">Margen Neto</th>
                <th className="pb-3">ROI</th>
                <th className="pb-3">Volumen</th>
                <th className="pb-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.map((row) => (
                <tr key={row.name} className="border-t border-divider/70">
                  <td className="py-3 text-sm font-medium">{row.name}</td>
                  <td className="py-3 text-sm text-default-500">
                    {row.category}
                  </td>
                  <td className="py-3 text-sm">{row.netMargin}</td>
                  <td className="py-3 text-sm font-semibold text-primary">
                    {row.roi}
                  </td>
                  <td className="py-3 text-sm">{row.volume}</td>
                  <td className="py-3">
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
              {topProducts.length === 0 && (
                <tr>
                  <td className="py-6 text-sm text-default-500" colSpan={6}>
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
