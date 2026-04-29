import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { useAppToast } from "@/components/AppToast";
import { FinancialFilterBar } from "@/components/financial/FinancialFilterBar";
import {
  FinancialEmptyState,
  FinancialErrorState,
  FinancialLoadingState,
} from "@/components/financial/FinancialState";
import {
  FinancialProjectionScenarioInput,
  FinancialProjectionsResponse,
  useApplyFinancialProjectionModel,
  useFinancialProjections,
} from "@/hooks/useFinancial";
import { useFinancialFilters } from "@/hooks/useFinancialFilters";
import { getErrorMessage } from "@/utils/errors";

const REGION_OPTIONS: Array<FinancialProjectionScenarioInput["marketExpansion"]> =
  ["EMEA", "APAC", "LATAM"];

function normalizeRegion(value?: string): FinancialProjectionScenarioInput["marketExpansion"] {
  if (value === "EMEA" || value === "APAC" || value === "LATAM") {
    return value;
  }

  return "LATAM";
}

export default function SpeculationsProjectionsPage() {
  const { filters, setFilters, resetFilters } = useFinancialFilters({
    monthsBack: 12,
  });
  const { data, loading, error } = useFinancialProjections(filters);
  const { applyModel, isApplying } = useApplyFinancialProjectionModel(filters);
  const { showToast } = useAppToast();
  const [appliedData, setAppliedData] =
    useState<FinancialProjectionsResponse | null>(null);
  const [scenario, setScenario] = useState<FinancialProjectionScenarioInput>({
    salesGrowth: 0,
    productionCosts: 0,
    marketExpansion: "LATAM",
  });

  useEffect(() => {
    if (!data?.whatIf) return;

    setScenario({
      salesGrowth: Number(data.whatIf.salesGrowth || 0),
      productionCosts: Number(data.whatIf.productionCosts || 0),
      marketExpansion: normalizeRegion(data.whatIf.marketExpansion),
    });
  }, [data?.generatedAt]);

  useEffect(() => {
    setAppliedData(null);
  }, [filters.startDate, filters.endDate, filters.category]);

  const currentData = appliedData || data;
  const categories = currentData?.availableCategories || data?.availableCategories || [];
  const comparison = currentData?.projectionComparison || [];
  const comparisonMax = Math.max(
    ...comparison.map((item) => item.baseline || 0),
    ...comparison.map((item) => item.scenario || 0),
    1,
  );
  const targetLiquidity = currentData?.targetLiquidity || { amount: 0, baselineDelta: 0 };
  const risk = currentData?.riskAssessment || {
    label: "Moderado",
    level: 3,
    description: "No hay datos para proyecciones.",
  };
  const volatilityRows = currentData?.marketVolatility || [];

  const handleApplyModel = async () => {
    try {
      const response = await applyModel(scenario);
      setAppliedData(response);
      showToast({
        variant: "success",
        message: "Proyeccion recalculada con el escenario actual.",
      });
    } catch (applyError) {
      showToast({
        variant: "error",
        message: getErrorMessage(
          applyError,
          "No pudimos aplicar el modelo de proyecciones.",
        ),
      });
    }
  };

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
        comparison.length === 0 &&
        volatilityRows.length === 0 && <FinancialEmptyState label="Proyecciones" />}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="financial-page-title">
            Especulaciones y Proyecciones
          </h1>
          <p className="financial-page-subtitle max-w-2xl">
            Modelado de requerimientos de capital segun volatilidad de mercado y
            elasticidad interna de produccion.
          </p>
        </div>
        <button
          className="rounded-2xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          disabled={isApplying}
          type="button"
          onClick={() => void handleApplyModel()}
        >
          <span className="flex items-center gap-2">
            {isApplying && <Loader2 className="financial-icon animate-spin" />}
            {isApplying ? "Aplicando..." : "Aplicar Modelo IA"}
          </span>
        </button>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_2fr]">
        <article className="financial-card border-l-4 border-l-primary">
          <h2 className="financial-section-title">Constructor de Escenarios</h2>
          <div className="mt-5 space-y-5">
            <div>
              <div className="flex justify-between text-sm">
                <span>Crecimiento de Ventas</span>
                <strong className="text-success">
                  {scenario.salesGrowth >= 0 ? "+" : ""}
                  {scenario.salesGrowth.toFixed(1)}%
                </strong>
              </div>
              <input
                className="mt-2 w-full"
                max={50}
                min={-30}
                step={0.5}
                type="range"
                value={scenario.salesGrowth}
                onChange={(e) =>
                  setScenario((prev) => ({
                    ...prev,
                    salesGrowth: Number(e.target.value),
                  }))
                }
              />
            </div>
            <div>
              <div className="flex justify-between text-sm">
                <span>Costos de Produccion</span>
                <strong
                  className={
                    scenario.productionCosts > 0 ? "text-danger" : "text-success"
                  }
                >
                  {scenario.productionCosts >= 0 ? "+" : ""}
                  {scenario.productionCosts.toFixed(1)}%
                </strong>
              </div>
              <input
                className="mt-2 w-full"
                max={45}
                min={-30}
                step={0.5}
                type="range"
                value={scenario.productionCosts}
                onChange={(e) =>
                  setScenario((prev) => ({
                    ...prev,
                    productionCosts: Number(e.target.value),
                  }))
                }
              />
            </div>
            <div>
              <p className="text-sm text-default-500">Expansion de Mercado</p>
              <div className="mt-2 flex gap-2">
                {REGION_OPTIONS.map((region) => (
                  <button
                    className={
                      region === scenario.marketExpansion
                        ? "rounded-lg bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground"
                        : "rounded-lg border border-divider/70 px-3 py-1 text-xs font-semibold text-default-500"
                    }
                    key={region}
                    type="button"
                    onClick={() =>
                      setScenario((prev) => ({ ...prev, marketExpansion: region }))
                    }
                  >
                    {region}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </article>

        <article className="financial-card">
          <h2 className="financial-section-title">Proyeccion de Flujo de Caja</h2>
          <p className="mt-1 text-sm text-default-500">
            Comparacion de escenario base vs modelo aplicado (12 meses futuros).
          </p>
          <div className="mt-4 flex items-center gap-4 text-xs">
            <span className="inline-flex items-center gap-2 text-default-500">
              <span className="h-2.5 w-2.5 rounded-full bg-default-400" />
              Base
            </span>
            <span className="inline-flex items-center gap-2 text-primary">
              <span className="h-2.5 w-2.5 rounded-full bg-primary" />
              Escenario aplicado
            </span>
          </div>
          <div className="mt-5 overflow-x-auto">
            {comparison.length > 0 ? (
              <div className="min-w-[640px]">
                <svg className="h-72 w-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                  <polyline
                    fill="none"
                    points={comparison
                      .map((point, index) => {
                        const x = comparison.length > 1 ? (index / (comparison.length - 1)) * 100 : 0;
                        const y = 100 - (point.baseline / comparisonMax) * 90;

                        return `${x},${y}`;
                      })
                      .join(" ")}
                    stroke="rgb(148 163 184)"
                    strokeWidth="1.8"
                  />
                  <polyline
                    fill="none"
                    points={comparison
                      .map((point, index) => {
                        const x = comparison.length > 1 ? (index / (comparison.length - 1)) * 100 : 0;
                        const y = 100 - (point.scenario / comparisonMax) * 90;

                        return `${x},${y}`;
                      })
                      .join(" ")}
                    stroke="rgb(45 212 191)"
                    strokeWidth="2.6"
                  />
                </svg>
                <div className="mt-2 grid grid-cols-6 gap-2 text-[10px] uppercase text-default-500 md:grid-cols-12">
                  {comparison.map((point) => (
                    <span className="truncate" key={point.month}>
                      {point.month}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <p className="py-10 text-sm text-default-500">
                Sin puntos de proyeccion para los filtros seleccionados.
              </p>
            )}
          </div>
          {comparison.length > 0 && (
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-divider/70 p-3">
                <p className="text-xs uppercase tracking-[0.12em] text-default-500">
                  Mes inicial
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  ${comparison[0].scenario.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                </p>
              </div>
              <div className="rounded-2xl border border-divider/70 p-3">
                <p className="text-xs uppercase tracking-[0.12em] text-default-500">
                  Mes final
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  ${comparison[comparison.length - 1].scenario.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                </p>
              </div>
              <div className="rounded-2xl border border-divider/70 p-3">
                <p className="text-xs uppercase tracking-[0.12em] text-default-500">
                  Diferencia vs base
                </p>
                <p className="mt-1 text-sm font-semibold text-primary">
                  {comparison[comparison.length - 1].baseline > 0
                    ? `${(
                        ((comparison[comparison.length - 1].scenario -
                          comparison[comparison.length - 1].baseline) /
                          comparison[comparison.length - 1].baseline) *
                        100
                      ).toFixed(1)}%`
                    : "0.0%"}
                </p>
              </div>
            </div>
          )}
        </article>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_2fr]">
        <article className="financial-card border-l-4 border-l-warning">
          <p className="text-xs uppercase tracking-[0.14em] text-default-500">
            Evaluacion de Riesgo
          </p>
          <p className="mt-2 text-4xl font-semibold tracking-[-0.03em] text-warning">
            {risk.label}
          </p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-warning">
            Nivel {risk.level}
          </p>
          <p className="mt-2 text-sm text-default-500">{risk.description}</p>
        </article>

        <article className="financial-card">
          <h2 className="financial-section-title">
            Indice de Volatilidad de Mercado
          </h2>
          <p className="mt-2 text-sm text-default-500">
            Liquidez objetivo $
            {targetLiquidity.amount.toLocaleString("en-US", { maximumFractionDigits: 2 })}
            M {" · "}
            {targetLiquidity.baselineDelta >= 0 ? "+" : ""}
            {targetLiquidity.baselineDelta.toLocaleString("en-US", {
              maximumFractionDigits: 2,
            })}
            M vs baseline
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[620px]">
              <thead>
                <tr className="text-left text-xs uppercase tracking-[0.14em] text-default-500">
                  <th className="pb-3">Segmento</th>
                  <th className="pb-3">Volatilidad</th>
                  <th className="pb-3">Impacto</th>
                  <th className="pb-3">Accion</th>
                </tr>
              </thead>
              <tbody>
                {volatilityRows.map((row) => (
                  <tr className="border-t border-divider/70" key={row.segment}>
                    <td className="py-3 text-sm font-medium">{row.segment}</td>
                    <td className="py-3 text-sm">{row.volatility}</td>
                    <td
                      className={`py-3 text-sm ${
                        row.impact === "Severo"
                          ? "text-danger"
                          : row.impact === "Minimo"
                            ? "text-success"
                            : "text-warning"
                      }`}
                    >
                      {row.impact}
                    </td>
                    <td
                      className={`py-3 text-sm ${
                        row.action === "Cubrir Ahora"
                          ? "text-primary"
                          : "text-default-500"
                      }`}
                    >
                      {row.action}
                    </td>
                  </tr>
                ))}
                {volatilityRows.length === 0 && (
                  <tr>
                    <td className="py-6 text-sm text-default-500" colSpan={4}>
                      Sin datos de volatilidad para los filtros seleccionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>
      </div>
    </section>
  );
}
