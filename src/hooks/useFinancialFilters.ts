import type { FinancialFilters } from "@/hooks/useFinancial";

import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";

type FilterPreset = {
  monthsBack?: number;
  daysBack?: number;
  ytd?: boolean;
};

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

function buildDefaultFilters(preset: FilterPreset = {}): FinancialFilters {
  const end = new Date();
  const start = new Date();

  if (preset.ytd) {
    start.setUTCMonth(0, 1);
  } else if (typeof preset.daysBack === "number") {
    start.setDate(start.getDate() - preset.daysBack);
  } else {
    start.setMonth(start.getMonth() - (preset.monthsBack || 6));
  }

  return {
    startDate: toDateInputValue(start),
    endDate: toDateInputValue(end),
    category: "",
  };
}

export function useFinancialFilters(preset: FilterPreset = {}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const defaults = useMemo(
    () => buildDefaultFilters(preset),
    [preset.daysBack, preset.monthsBack, preset.ytd],
  );

  const filters: FinancialFilters = {
    startDate: searchParams.get("startDate") || defaults.startDate || "",
    endDate: searchParams.get("endDate") || defaults.endDate || "",
    category: searchParams.get("category") || "",
  };

  const setFilters = (next: FinancialFilters) => {
    const params = new URLSearchParams(searchParams);

    if (next.startDate) params.set("startDate", next.startDate);
    else params.delete("startDate");

    if (next.endDate) params.set("endDate", next.endDate);
    else params.delete("endDate");

    if (next.category) params.set("category", next.category);
    else params.delete("category");

    setSearchParams(params, { replace: true });
  };

  const resetFilters = () => {
    setFilters(defaults);
  };

  return {
    filters,
    setFilters,
    resetFilters,
  };
}
