import type { FinancialFilters } from "@features/financial/hooks/useFinancial";

export function FinancialFilterBar({
  filters,
  categories,
  onChange,
  onReset,
  hideHeader,
}: {
  filters: FinancialFilters;
  categories: string[];
  onChange: (next: FinancialFilters) => void;
  onReset?: () => void;
  hideHeader?: boolean;
}) {
  return (
    <div className="financial-card">
      {!hideHeader && (
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-default-500">
            Filtros Financieros
          </p>
          {onReset && (
            <button
              className="rounded-lg border border-divider/70 px-3 py-1 text-xs font-semibold text-default-600 transition-colors hover:bg-content2/60"
              onClick={onReset}
              type="button"
            >
              Reiniciar
            </button>
          )}
        </div>
      )}
      <div className="grid gap-3 md:grid-cols-3">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-default-500">
            Fecha Inicio
          </span>
          <input
            className="corp-input w-full rounded-xl px-3 py-2 text-sm"
            type="date"
            value={filters.startDate || ""}
            onChange={(e) => onChange({ ...filters, startDate: e.target.value })}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-default-500">
            Fecha Fin
          </span>
          <input
            className="corp-input w-full rounded-xl px-3 py-2 text-sm"
            type="date"
            value={filters.endDate || ""}
            onChange={(e) => onChange({ ...filters, endDate: e.target.value })}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-default-500">
            Categoria
          </span>
          <select
            className="corp-input w-full rounded-xl px-3 py-2 text-sm"
            value={filters.category || ""}
            onChange={(e) => onChange({ ...filters, category: e.target.value })}
          >
            <option value="">Todas las Categorias</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}

export type { FinancialFilters };
