import { useState } from "react";
import { X, Filter, Calendar, Search, ArrowDownUp } from "lucide-react";

import { ClientEntryType } from "@shared/types";

export interface AccountFilters {
  types: ClientEntryType[];
  dateFrom: string;
  dateTo: string;
  paymentMethod: string;
  minAmount: string;
  maxAmount: string;
  search: string;
  sortBy: "date" | "amount";
  sortOrder: "desc" | "asc";
}

export const defaultFilters: AccountFilters = {
  types: [],
  dateFrom: "",
  dateTo: "",
  paymentMethod: "",
  minAmount: "",
  maxAmount: "",
  search: "",
  sortBy: "date",
  sortOrder: "desc",
};

const ENTRY_TYPE_OPTIONS: { value: ClientEntryType; label: string; color: string }[] = [
  { value: "CHARGE", label: "Cargo", color: "bg-danger/15 text-danger" },
  { value: "PAYMENT", label: "Cobro", color: "bg-success/15 text-success" },
  { value: "CREDIT_NOTE", label: "Nota de Crédito", color: "bg-primary/15 text-primary" },
  { value: "DEBIT_NOTE", label: "Nota de Débito", color: "bg-warning/15 text-warning" },
];

interface AccountEntryFiltersProps {
  filters: AccountFilters;
  onChange: (filters: AccountFilters) => void;
  isOpen: boolean;
  onToggle: () => void;
  currency: string;
}

export function AccountEntryFilters({
  filters,
  onChange,
  isOpen,
  onToggle,
  currency,
}: AccountEntryFiltersProps) {
  const [localFilters, setLocalFilters] = useState<AccountFilters>(filters);

  const handleApply = () => {
    onChange(localFilters);
  };

  const handleReset = () => {
    setLocalFilters(defaultFilters);
    onChange(defaultFilters);
  };

  const toggleType = (type: ClientEntryType) => {
    setLocalFilters((prev) => ({
      ...prev,
      types: prev.types.includes(type)
        ? prev.types.filter((t) => t !== type)
        : [...prev.types, type],
    }));
  };

  const updateFilter = <K extends keyof AccountFilters>(key: K, value: AccountFilters[K]) => {
    setLocalFilters((prev) => ({ ...prev, [key]: value }));
  };

  const activeFiltersCount = [
    filters.types.length > 0,
    filters.dateFrom,
    filters.dateTo,
    filters.paymentMethod,
    filters.minAmount,
    filters.maxAmount,
    filters.search,
  ].filter(Boolean).length;

  return (
    <div className="space-y-3">
      {/* Search and Toggle */}
      <div className="flex gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-white/10 bg-content2 px-3 py-2">
          <Search className="shrink-0 text-default-400" size={16} />
          <input
            className="min-w-0 flex-1 bg-transparent text-sm text-foreground placeholder:text-default-400 focus:outline-none"
            placeholder="Buscar por referencia o notas..."
            value={localFilters.search}
            onChange={(e) => updateFilter("search", e.target.value)}
            onBlur={handleApply}
            onKeyDown={(e) => e.key === "Enter" && handleApply()}
          />
          {localFilters.search && (
            <button
              className="text-default-400 hover:text-foreground"
              onClick={() => {
                updateFilter("search", "");
                onChange({ ...filters, search: "" });
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>
        <button
          className={`flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition ${
            isOpen || activeFiltersCount > 0
              ? "border-primary bg-primary/10 text-primary"
              : "border-white/10 bg-content2 text-default-500 hover:text-foreground"
          }`}
          onClick={onToggle}
        >
          <Filter size={16} />
          <span className="hidden sm:inline">Filtros</span>
          {activeFiltersCount > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {activeFiltersCount}
            </span>
          )}
        </button>
      </div>

      {/* Expanded Filters */}
      {isOpen && (
        <div className="rounded-2xl border border-white/10 bg-content2 p-4 space-y-4">
          {/* Types */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-default-500">
              Tipo de Movimiento
            </p>
            <div className="flex flex-wrap gap-2">
              {ENTRY_TYPE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    localFilters.types.includes(option.value)
                      ? option.color
                      : "bg-content1 text-default-500 hover:text-foreground"
                  }`}
                  onClick={() => toggleType(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-default-500">
                <Calendar size={12} />
                Desde
              </label>
              <input
                className="w-full rounded-xl border border-white/10 bg-content1 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                type="date"
                value={localFilters.dateFrom}
                onChange={(e) => updateFilter("dateFrom", e.target.value)}
                onBlur={handleApply}
              />
            </div>
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-default-500">
                <Calendar size={12} />
                Hasta
              </label>
              <input
                className="w-full rounded-xl border border-white/10 bg-content1 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                type="date"
                value={localFilters.dateTo}
                onChange={(e) => updateFilter("dateTo", e.target.value)}
                onBlur={handleApply}
              />
            </div>
          </div>

          {/* Amount Range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-default-500">
                Monto mínimo ({currency})
              </label>
              <input
                className="w-full rounded-xl border border-white/10 bg-content1 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                min="0"
                placeholder="0.00"
                step="0.01"
                type="number"
                value={localFilters.minAmount}
                onChange={(e) => updateFilter("minAmount", e.target.value)}
                onBlur={handleApply}
              />
            </div>
            <div>
              <label className="mb-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-default-500">
                Monto máximo ({currency})
              </label>
              <input
                className="w-full rounded-xl border border-white/10 bg-content1 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                min="0"
                placeholder="0.00"
                step="0.01"
                type="number"
                value={localFilters.maxAmount}
                onChange={(e) => updateFilter("maxAmount", e.target.value)}
                onBlur={handleApply}
              />
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="mb-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-default-500">
              Método de Pago
            </label>
            <input
              className="w-full rounded-xl border border-white/10 bg-content1 px-3 py-2 text-sm text-foreground placeholder:text-default-400 focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="Ej: Transferencia, Efectivo..."
              type="text"
              value={localFilters.paymentMethod}
              onChange={(e) => updateFilter("paymentMethod", e.target.value)}
              onBlur={handleApply}
            />
          </div>

          {/* Sort */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-default-500">
              <ArrowDownUp size={12} />
              Ordenar por
            </label>
            <div className="flex gap-2">
              <select
                className="flex-1 rounded-xl border border-white/10 bg-content1 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                value={localFilters.sortBy}
                onChange={(e) => updateFilter("sortBy", e.target.value as "date" | "amount")}
                onBlur={handleApply}
              >
                <option value="date">Fecha</option>
                <option value="amount">Monto</option>
              </select>
              <select
                className="flex-1 rounded-xl border border-white/10 bg-content1 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                value={localFilters.sortOrder}
                onChange={(e) => updateFilter("sortOrder", e.target.value as "desc" | "asc")}
                onBlur={handleApply}
              >
                <option value="desc">Mayor primero</option>
                <option value="asc">Menor primero</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2 border-t border-white/10">
            <button
              className="flex-1 rounded-xl bg-content1 border border-white/10 py-2.5 text-xs font-semibold text-default-500 transition hover:text-foreground"
              onClick={handleReset}
            >
              Limpiar filtros
            </button>
            <button
              className="flex-1 rounded-xl bg-primary py-2.5 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90"
              onClick={handleApply}
            >
              Aplicar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
