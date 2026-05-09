import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, FileText, Receipt } from "lucide-react";

import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";
import { Chip } from "@heroui/chip";

import {
  FinancialEmptyState,
  FinancialErrorState,
  FinancialLoadingState,
} from "@features/financial/components/FinancialState";
import { useIvaPurchases, useIvaSales } from "@features/financial/hooks/useIvaReports";
import { formatCurrency } from "@shared/utils/currency";
import { formatDateShort } from "@shared/utils/date";
import type { IvaReport, IvaReportPeriod, IvaReportDetail } from "@shared/types";

/* ── Types ──────────────────────────────────────────────────────────── */

type Tab = "purchases" | "sales";

/* ── Date helpers ───────────────────────────────────────────────────── */

function getMonthBoundaries() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");

  return {
    from: `${y}-${m}-01`,
    to: now.toISOString().slice(0, 10),
    inputValue: `${y}-${m}`,
  };
}

function monthInputToFrom(v: string) {
  return `${v}-01`;
}

function monthInputToTo(v: string) {
  const [y, m] = v.split("-").map(Number);
  const lastDay = new Date(y, m, 0).getDate();
  return `${v}-${String(lastDay).padStart(2, "0")}`;
}

/* ── Summary cards ──────────────────────────────────────────────────── */

function SummaryCards({ data }: { data: IvaReport }) {
  const { totals } = data;

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <article className="financial-card">
        <p className="text-xs uppercase tracking-[0.18em] text-default-500">
          Neto total
        </p>
        <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-foreground">
          {formatCurrency(totals.netAmount, "ARS")}
        </p>
      </article>
      <article className="financial-card">
        <p className="text-xs uppercase tracking-[0.18em] text-default-500">
          IVA total
        </p>
        <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-primary">
          {formatCurrency(totals.tax, "ARS")}
        </p>
      </article>
      <article className="financial-card">
        <p className="text-xs uppercase tracking-[0.18em] text-default-500">
          Total facturado
        </p>
        <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-foreground">
          {formatCurrency(totals.total, "ARS")}
        </p>
      </article>
    </div>
  );
}

/* ── Period label formatter ─────────────────────────────────────────── */

function formatPeriod(period: string): string {
  const [y, m] = period.split("-").map(Number);
  const date = new Date(y, m - 1);
  return date.toLocaleDateString("es-AR", {
    month: "long",
    year: "numeric",
  });
}

/* ── Expandable period row ──────────────────────────────────────────── */

function PeriodRow({
  period,
  details,
  isExpanded,
  onToggle,
}: {
  period: IvaReportPeriod;
  details: IvaReportDetail[];
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const periodDetails = details.filter((d) => {
    const dPeriod = d.date.slice(0, 7);
    return dPeriod === period.period;
  });

  return (
    <>
      <TableRow
        key={period.period}
        className="cursor-pointer transition-colors hover:bg-content2/40"
        onClick={onToggle}
      >
        <TableCell>
          <button
            type="button"
            className="flex items-center gap-2 text-sm font-medium text-foreground"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-default-400" />
            ) : (
              <ChevronRight className="h-4 w-4 text-default-400" />
            )}
            {formatPeriod(period.period)}
          </button>
        </TableCell>
        <TableCell className="text-right font-mono tabular-nums">
          {formatCurrency(period.netAmount, "ARS")}
        </TableCell>
        <TableCell className="text-right font-mono tabular-nums text-primary">
          {formatCurrency(period.tax, "ARS")}
        </TableCell>
        <TableCell className="text-right font-mono tabular-nums">
          {formatCurrency(period.total, "ARS")}
        </TableCell>
        <TableCell className="text-center">
          <Chip size="sm" variant="flat">
            {period.count} {period.count === 1 ? "comp." : "comps."}
          </Chip>
        </TableCell>
      </TableRow>
      {isExpanded && periodDetails.length > 0 && (
        <TableRow>
          <TableCell colSpan={5} className="bg-content2/30 p-0">
            <div className="px-6 py-4">
              <DetailTable details={periodDetails} />
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

/* ── Detail table ───────────────────────────────────────────────────── */

function DetailTable({ details }: { details: IvaReportDetail[] }) {
  const hasTaxId = details.some(
    (d) => d.supplier?.taxId || d.client?.taxId,
  );

  return (
    <Table aria-label="Detalle del período" removeWrapper size="sm">
      <TableHeader>
        <TableColumn>FECHA</TableColumn>
        <TableColumn>RAZÓN SOCIAL</TableColumn>
        {hasTaxId && <TableColumn>CUIT</TableColumn>}
        <TableColumn align="end">NETO</TableColumn>
        <TableColumn align="end">IVA</TableColumn>
        <TableColumn align="end">TOTAL</TableColumn>
      </TableHeader>
      <TableBody items={details} emptyContent="Sin movimientos en este período">
        {(detail) => {
          const entity = detail.supplier ?? detail.client;
          return (
            <TableRow key={`${detail.date}-${detail.purchaseId ?? detail.orderId ?? Math.random()}`}>
              <TableCell className="text-xs text-default-600">
                {formatDateShort(detail.date)}
              </TableCell>
              <TableCell className="text-sm font-medium">
                {entity?.name ?? "-"}
              </TableCell>
              {hasTaxId && (
                <TableCell className="font-mono text-xs text-default-500">
                  {entity?.taxId ? (
                    <Chip size="sm" variant="flat" color="default">
                      {entity.taxId}
                    </Chip>
                  ) : (
                    "-"
                  )}
                </TableCell>
              )}
              <TableCell className="text-right font-mono text-xs tabular-nums">
                {formatCurrency(detail.netAmount, "ARS")}
              </TableCell>
              <TableCell className="text-right font-mono text-xs tabular-nums text-primary">
                {formatCurrency(detail.tax, "ARS")}
              </TableCell>
              <TableCell className="text-right font-mono text-xs tabular-nums font-semibold">
                {formatCurrency(detail.total, "ARS")}
              </TableCell>
            </TableRow>
          );
        }}
      </TableBody>
    </Table>
  );
}

/* ── Tab content ────────────────────────────────────────────────────── */

function ReportTab({ tab }: { tab: Tab }) {
  const initial = useMemo(getMonthBoundaries, []);
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const [fromInput, setFromInput] = useState(initial.inputValue);
  const [toInput, setToInput] = useState(initial.inputValue);
  const [expandedPeriod, setExpandedPeriod] = useState<string | null>(null);

  const purchases = useIvaPurchases(tab === "purchases" ? from : undefined, tab === "purchases" ? to : undefined);
  const sales = useIvaSales(tab === "sales" ? from : undefined, tab === "sales" ? to : undefined);

  const query = tab === "purchases" ? purchases : sales;
  const { data, loading, error } = query;

  const handleFromChange = (value: string) => {
    setFromInput(value);
    setFrom(monthInputToFrom(value));
  };

  const handleToChange = (value: string) => {
    setToInput(value);
    setTo(monthInputToTo(value));
  };

  const togglePeriod = (period: string) => {
    setExpandedPeriod((prev) => (prev === period ? null : period));
  };

  const emptyLabel = tab === "purchases" ? "IVA Compras" : "IVA Ventas";

  return (
    <section className="space-y-6">
      {/* Date Range Picker */}
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-default-500">
            Desde
          </label>
          <input
            className="rounded-xl border border-divider/60 bg-transparent px-4 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"
            type="month"
            value={fromInput}
            onChange={(e) => handleFromChange(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-default-500">
            Hasta
          </label>
          <input
            className="rounded-xl border border-divider/60 bg-transparent px-4 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"
            type="month"
            value={toInput}
            onChange={(e) => handleToChange(e.target.value)}
          />
        </div>
      </div>

      {/* Loading state */}
      {loading && !data && <FinancialLoadingState />}

      {/* Error state */}
      {error && !loading && <FinancialErrorState message={error} />}

      {/* Empty state */}
      {!loading && !error && data && data.periods.length === 0 && (
        <FinancialEmptyState label={emptyLabel} />
      )}

      {/* Data */}
      {data && data.periods.length > 0 && (
        <>
          <SummaryCards data={data} />

          {/* Periods Table */}
          <div className="app-panel rounded-[28px] p-5">
            <div>
              <p className="section-kicker">Resumen por período</p>
            </div>
              <Table aria-label="Períodos" removeWrapper>
                <TableHeader>
                  <TableColumn>PERÍODO</TableColumn>
                  <TableColumn align="end">NETO</TableColumn>
                  <TableColumn align="end">IVA</TableColumn>
                  <TableColumn align="end">TOTAL</TableColumn>
                  <TableColumn align="center">COMPROBANTES</TableColumn>
                </TableHeader>
                <TableBody items={data.periods}>
                  {(period) => (
                    <PeriodRow
                      key={period.period}
                      period={period}
                      details={data.details}
                      isExpanded={expandedPeriod === period.period}
                      onToggle={() => togglePeriod(period.period)}
                    />
                  )}
                </TableBody>
              </Table>

              {/* Totals row */}
              <div className="flex items-center justify-between border-t border-divider/60 px-4 py-3 text-sm font-semibold">
                <span>TOTALES</span>
                <div className="flex items-center gap-6">
                  <span className="w-28 text-right font-mono tabular-nums">
                    {formatCurrency(data.totals.netAmount, "ARS")}
                  </span>
                  <span className="w-28 text-right font-mono tabular-nums text-primary">
                    {formatCurrency(data.totals.tax, "ARS")}
                  </span>
                  <span className="w-28 text-right font-mono tabular-nums">
                    {formatCurrency(data.totals.total, "ARS")}
                  </span>
                  <span className="w-24 text-center text-default-500">
                    {data.periods.reduce((s, p) => s + p.count, 0)} comp.
                  </span>
                </div>
              </div>
          </div>
        </>
      )}
    </section>
  );
}

/* ── Page component ─────────────────────────────────────────────────── */

export default function IvaReports() {
  const [activeTab, setActiveTab] = useState<Tab>("purchases");

  const tabs: { key: Tab; label: string; icon: typeof FileText }[] = [
    { key: "purchases", label: "IVA Compras", icon: Receipt },
    { key: "sales", label: "IVA Ventas", icon: FileText },
  ];

  return (
    <section className="space-y-6 overflow-x-hidden">
      {/* Header */}
      <div>
        <h1 className="financial-page-title">Libro IVA</h1>
        <p className="financial-page-subtitle">
          Registro de IVA compras y ventas por período.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-content2/60 p-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
                isActive
                  ? "bg-background text-foreground shadow-sm"
                  : "text-default-500 hover:text-default-700"
              }`}
              onClick={() => setActiveTab(tab.key)}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Active tab content */}
      <ReportTab key={activeTab} tab={activeTab} />
    </section>
  );
}
