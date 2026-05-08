import { useMemo, useState } from "react";
import {
  Search,
  Plus,
  Loader2,
  FileText,
  ChevronRight,
  Calendar,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Select, SelectItem } from "@heroui/select";

import { useQuotes, type QuoteFilters } from "@features/quotes/hooks/useQuotes";
import type { QuoteStatus } from "@shared/types";
import { useIsDesktop } from "@shared/hooks/useIsDesktop";
import { formatCurrency } from "@shared/utils/currency";
import { formatDateShort } from "@shared/utils/date";
import { PaginationBar } from "@shared/components/PaginationBar";

// ── Status helpers ───────────────────────────────────────────────────

const STATUS_LABELS: Record<QuoteStatus, string> = {
  DRAFT: "Borrador",
  SENT: "Enviado",
  ACCEPTED: "Aceptado",
  CONVERTED: "Convertido",
  REJECTED: "Rechazado",
};

const STATUS_COLORS: Record<QuoteStatus, string> = {
  DRAFT: "bg-default-200/60 text-default-600 dark:text-default-400",
  SENT: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  ACCEPTED: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  CONVERTED: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
  REJECTED: "bg-red-500/15 text-red-600 dark:text-red-400",
};

const STATUS_DOTS: Record<QuoteStatus, string> = {
  DRAFT: "bg-default-400",
  SENT: "bg-blue-500",
  ACCEPTED: "bg-emerald-500",
  CONVERTED: "bg-violet-500",
  REJECTED: "bg-red-500",
};

const AVATAR_COLORS = [
  "from-blue-500/20 to-blue-600/10 text-blue-600 dark:text-blue-400",
  "from-emerald-500/20 to-emerald-600/10 text-emerald-600 dark:text-emerald-400",
  "from-amber-500/20 to-amber-600/10 text-amber-600 dark:text-amber-400",
  "from-violet-500/20 to-violet-600/10 text-violet-600 dark:text-violet-400",
  "from-rose-500/20 to-rose-600/10 text-rose-600 dark:text-rose-400",
];

function getClientName(client: { _id: string; name?: string; phone?: string } | string): string {
  if (typeof client === "object" && client) {
    return client.name || "Cliente sin nombre";
  }
  return "Cliente sin nombre";
}

function clientInitials(name: string) {
  const words = name.split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function avatarColor(name: string) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffff;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

// ── Status filter options ────────────────────────────────────────────

const STATUS_FILTERS: { key: QuoteStatus | "all"; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "DRAFT", label: "Borrador" },
  { key: "SENT", label: "Enviado" },
  { key: "ACCEPTED", label: "Aceptado" },
  { key: "CONVERTED", label: "Convertido" },
  { key: "REJECTED", label: "Rechazado" },
];

// ── Page component ───────────────────────────────────────────────────

export default function QuotesPage() {
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<QuoteStatus | "all">("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const DESKTOP_PAGE_SIZE = 15;
  const [desktopPage, setDesktopPage] = useState(1);

  const filters: QuoteFilters = useMemo(() => {
    const f: QuoteFilters = {};
    if (statusFilter !== "all") f.status = statusFilter;
    if (dateFrom) f.dateFrom = dateFrom;
    if (dateTo) f.dateTo = dateTo;
    if (isDesktop) {
      f.page = desktopPage;
      f.limit = DESKTOP_PAGE_SIZE;
    }
    return f;
  }, [statusFilter, dateFrom, dateTo, desktopPage, isDesktop]);

  const { quotes, loading, totalPages, currentPage, total } = useQuotes(filters);

  // Client-side search filter for mobile (no pagination in mobile)
  const filteredQuotes = useMemo(() => {
    if (!searchQuery) return quotes;
    const q = searchQuery.toLowerCase();
    return quotes.filter((qte) => {
      const name = getClientName(qte.client).toLowerCase();
      return name.includes(q) || qte.quoteNumber.toLowerCase().includes(q);
    });
  }, [quotes, searchQuery]);

  // Reset page on filter change
  const handleFilterChange = () => {
    setDesktopPage(1);
  };

  const clearFilters = () => {
    setStatusFilter("all");
    setDateFrom("");
    setDateTo("");
    setSearchQuery("");
    setDesktopPage(1);
  };

  const hasActiveFilters = statusFilter !== "all" || dateFrom || dateTo || searchQuery;

  const displayQuotes = isDesktop ? filteredQuotes : filteredQuotes;

  // ── Desktop layout ─────────────────────────────────────────────
  if (isDesktop) {
    return (
      <div className="flex h-full w-full flex-col">
        {/* Header */}
        <header className="page-header flex shrink-0 items-center justify-between gap-4">
          <div>
            <p className="section-kicker">Operaciones</p>
            <h1 className="page-title mt-0.5">Presupuestos</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              className="flex items-center gap-2 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(59,130,246,0.30)] transition-all hover:shadow-[0_8px_24px_rgba(59,130,246,0.40)] hover:scale-[1.02] active:scale-[0.98]"
              onClick={() => navigate("/quotes/new")}
            >
              <Plus size={16} strokeWidth={2.5} />
              Nuevo Presupuesto
            </button>
          </div>
        </header>

        <div className="flex-1 p-6 space-y-5">
          {/* Filter bar */}
          <div className="financial-card !p-4">
            <div className="flex flex-wrap items-end gap-4">
              <div className="min-w-[180px] flex-1">
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.14em] text-default-500">
                  Estado
                </label>
                <Select
                  aria-label="Filtrar por estado"
                  classNames={{
                    trigger: "min-h-[42px] rounded-xl border-divider/25 bg-content2/40 text-sm text-foreground data-[focus=true]:border-blue-500/50",
                    value: "text-foreground",
                    popoverContent: "bg-content1 text-foreground",
                  }}
                  selectedKeys={[statusFilter]}
                  variant="bordered"
                  onSelectionChange={(keys) => {
                    const val = Array.from(keys)[0] as string;
                    setStatusFilter(val as QuoteStatus | "all");
                    handleFilterChange();
                  }}
                >
                  {STATUS_FILTERS.map((f) => (
                    <SelectItem key={f.key}>{f.label}</SelectItem>
                  ))}
                </Select>
              </div>

              <div className="min-w-[160px]">
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.14em] text-default-500">
                  <Calendar size={12} className="inline mr-1" />
                  Desde
                </label>
                <input
                  className="corp-input w-full rounded-xl px-3 py-2.5 text-sm"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => { setDateFrom(e.target.value); handleFilterChange(); }}
                />
              </div>

              <div className="min-w-[160px]">
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.14em] text-default-500">
                  <Calendar size={12} className="inline mr-1" />
                  Hasta
                </label>
                <input
                  className="corp-input w-full rounded-xl px-3 py-2.5 text-sm"
                  type="date"
                  value={dateTo}
                  onChange={(e) => { setDateTo(e.target.value); handleFilterChange(); }}
                />
              </div>

              <div className="min-w-[200px] flex-1">
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.14em] text-default-500">
                  <Search size={12} className="inline mr-1" />
                  Cliente
                </label>
                <input
                  className="corp-input w-full rounded-xl px-3 py-2.5 text-sm"
                  placeholder="Buscar cliente..."
                  type="text"
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); handleFilterChange(); }}
                />
              </div>

              {hasActiveFilters && (
                <button
                  className="flex items-center gap-1 rounded-xl px-3 py-2.5 text-xs font-semibold text-default-500 hover:text-foreground transition-colors"
                  onClick={clearFilters}
                >
                  <X size={14} />
                  Limpiar
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="financial-card !p-0 overflow-hidden">
            <div className="overflow-x-auto">
              {loading && quotes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-default-400">
                  <Loader2 className="mb-3 animate-spin" size={28} />
                  <p className="text-sm font-medium">Cargando presupuestos...</p>
                </div>
              ) : displayQuotes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-default-100">
                    <FileText className="text-default-300" size={28} />
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    {hasActiveFilters ? "Sin resultados" : "Crea tu primer presupuesto"}
                  </p>
                  <p className="mt-1 text-xs text-default-500">
                    {hasActiveFilters
                      ? "No se encontraron presupuestos con los filtros aplicados."
                      : "Usa el botón Nuevo Presupuesto para empezar."}
                  </p>
                </div>
              ) : (
                <table className="w-full min-w-[800px]">
                  <thead>
                    <tr className="text-left text-[10px] font-bold uppercase tracking-[0.16em] text-default-400">
                      <th className="px-5 pb-3 pt-4">Número</th>
                      <th className="px-4 pb-3 pt-4">Cliente</th>
                      <th className="px-4 pb-3 pt-4">Fecha</th>
                      <th className="px-4 pb-3 pt-4">Vencimiento</th>
                      <th className="px-4 pb-3 pt-4">Estado</th>
                      <th className="px-4 pb-3 pt-4 text-right">Total</th>
                      <th className="px-5 pb-3 pt-4 text-right w-16" />
                    </tr>
                  </thead>
                  <tbody>
                    {displayQuotes.map((quote) => {
                      const name = getClientName(quote.client);
                      return (
                        <tr
                          key={quote._id}
                          className="group cursor-pointer border-t border-divider/10 transition-colors hover:bg-blue-500/5"
                          onClick={() => navigate(`/quotes/${quote._id}`)}
                        >
                          <td className="px-5 py-4">
                            <span className="text-sm font-bold font-mono text-blue-500">
                              {quote.quoteNumber}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-[11px] font-bold ${avatarColor(name)}`}>
                                {clientInitials(name)}
                              </div>
                              <span className="text-sm font-semibold text-foreground">{name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-sm font-mono text-default-500">{formatDateShort(quote.date)}</span>
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-sm font-mono text-default-500">
                              {quote.expirationDate ? formatDateShort(quote.expirationDate) : "—"}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.08em] ${STATUS_COLORS[quote.status]}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOTS[quote.status]}`} />
                              {STATUS_LABELS[quote.status]}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <span className="text-sm font-bold font-mono text-foreground">
                              {formatCurrency(quote.total)}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <ChevronRight size={15} className="text-default-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            <PaginationBar
              from={(currentPage - 1) * DESKTOP_PAGE_SIZE + 1}
              label={`Mostrando ${displayQuotes.length} de ${total} presupuestos`}
              page={currentPage}
              to={Math.min(currentPage * DESKTOP_PAGE_SIZE, total)}
              total={total}
              totalPages={totalPages}
              onNext={() => setDesktopPage((p) => p + 1)}
              onPage={(p) => setDesktopPage(p)}
              onPrev={() => setDesktopPage((p) => p - 1)}
            />
          </div>
        </div>
      </div>
    );
  }

  // ── Mobile layout ──────────────────────────────────────────────
  return (
    <div className="flex h-full w-full flex-col pb-28">
      <header className="app-topbar px-6 pt-6 pb-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="section-kicker">Operaciones</div>
            <h1 className="mt-2 text-[28px] font-bold tracking-[-0.03em] text-foreground">
              Presupuestos
            </h1>
          </div>
          <button
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25"
            onClick={() => navigate("/quotes/new")}
          >
            <Plus size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="relative mt-4">
          <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-default-400" size={18} />
          <input
            className="corp-input w-full rounded-2xl py-3.5 pl-11 pr-4 text-sm text-foreground"
            placeholder="Buscar por cliente o número..."
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </header>

      {/* Filter chips */}
      <div className="flex items-center gap-2 px-6 pb-3 overflow-x-auto no-scrollbar">
        <Select
          aria-label="Filtrar por estado"
          classNames={{
            trigger: "min-h-[36px] rounded-full border-divider/25 bg-content2/40 text-xs text-foreground data-[focus=true]:border-blue-500/50",
            value: "text-foreground text-xs",
            popoverContent: "bg-content1 text-foreground",
          }}
          selectedKeys={[statusFilter]}
          variant="bordered"
          onSelectionChange={(keys) => {
            const val = Array.from(keys)[0] as string;
            setStatusFilter(val as QuoteStatus | "all");
          }}
        >
          {STATUS_FILTERS.map((f) => (
            <SelectItem key={f.key}>{f.label}</SelectItem>
          ))}
        </Select>

        <div className="flex gap-1">
          <input
            className="corp-input rounded-full px-3 py-1.5 text-[11px] w-[130px]"
            type="date"
            value={dateFrom}
            placeholder="Desde"
            onChange={(e) => setDateFrom(e.target.value)}
          />
          <input
            className="corp-input rounded-full px-3 py-1.5 text-[11px] w-[130px]"
            type="date"
            value={dateTo}
            placeholder="Hasta"
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>

        {hasActiveFilters && (
          <button
            className="shrink-0 rounded-full border border-divider/20 px-3 py-1.5 text-[11px] font-semibold text-default-500"
            onClick={clearFilters}
          >
            <X size={12} className="inline" /> Limpiar
          </button>
        )}
      </div>

      {/* List */}
      <div className="flex-1 space-y-3 px-6 pb-28">
        {loading && quotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-divider/10 bg-content2/40 py-16 text-default-400">
            <Loader2 className="mb-3 animate-spin" size={32} />
            <p className="text-sm font-medium">Cargando presupuestos...</p>
          </div>
        ) : displayQuotes.length > 0 ? (
          displayQuotes.map((quote, i) => {
            const name = getClientName(quote.client);
            return (
              <button
                key={quote._id}
                className="group relative flex w-full items-start justify-between rounded-2xl border border-divider/15 bg-gradient-to-br from-content1 to-content2/40 p-4 text-left transition-all hover:border-blue-500/25 hover:shadow-md active:scale-[0.99]"
                onClick={() => navigate(`/quotes/${quote._id}`)}
                style={{ animationDelay: `${i * 30}ms` }}
              >
                <div className="flex items-start gap-4">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${avatarColor(name)}`}>
                    <FileText size={20} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-[15px] font-bold text-foreground truncate max-w-[180px]">
                      {name}
                    </h3>
                    <p className="mt-0.5 text-[10px] font-mono uppercase tracking-[0.12em] text-default-400">
                      {quote.quoteNumber} · {formatDateShort(quote.date)}
                    </p>
                    <div className="mt-2 flex gap-2 flex-wrap">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.06em] ${STATUS_COLORS[quote.status]}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOTS[quote.status]}`} />
                        {STATUS_LABELS[quote.status]}
                      </span>
                      {quote.expirationDate && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-default-100 px-2.5 py-1 text-[9px] font-bold text-default-500">
                          <Calendar size={10} />
                          Vence: {formatDateShort(quote.expirationDate)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0 ml-3">
                  <p className="text-base font-bold font-mono text-foreground">
                    {formatCurrency(quote.total)}
                  </p>
                  <ChevronRight size={15} className="text-default-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </button>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-divider/10 bg-content2/40 py-16">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-default-100">
              <FileText className="text-default-300" size={28} />
            </div>
            <p className="text-sm font-semibold text-foreground">
              {hasActiveFilters ? "Sin resultados" : "Crea tu primer presupuesto"}
            </p>
            <p className="mt-1 text-xs text-default-500">
              {hasActiveFilters
                ? "No se encontraron presupuestos con los filtros aplicados."
                : "Usa el botón + para empezar."}
            </p>
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        className="fixed bottom-[100px] right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-[0_16px_34px_rgba(59,130,246,0.35)] transition-all hover:scale-105 active:scale-95 hover:shadow-[0_16px_40px_rgba(59,130,246,0.45)]"
        onClick={() => navigate("/quotes/new")}
      >
        <Plus size={26} strokeWidth={2.5} />
      </button>
    </div>
  );
}
