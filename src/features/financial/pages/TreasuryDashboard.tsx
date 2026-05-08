import { useMemo, useState } from "react";
import { Chip } from "@heroui/chip";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from "@heroui/table";
import {
  ArrowUpDown,
  Banknote,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";

import {
  FinancialEmptyState,
  FinancialErrorState,
  FinancialLoadingState,
} from "@features/financial/components/FinancialState";
import { useTreasuryCashFlow, useTreasuryOverview } from "@features/financial/hooks/useTreasury";
import { formatCurrency } from "@shared/utils/currency";

/* ── helpers ─────────────────────────────────────────────────────────── */

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

function methodLabel(method: string): string {
  const map: Record<string, string> = {
    cash: "Efectivo",
    card: "Tarjeta",
    transfer: "Transferencia",
    mercadopago: "Mercado Pago",
    check: "Cheque",
    other: "Otros",
  };

  return map[method] ?? method;
}

/* ── Payment method table ────────────────────────────────────────────── */

function MethodTable({
  title,
  data,
  total,
}: {
  title: string;
  data: Record<string, number>;
  total: number;
}) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);

  return (
    <Card className="flex-1">
      <CardHeader>
        <p className="text-sm font-bold text-foreground">{title}</p>
      </CardHeader>
      <CardBody>
        <Table aria-label={title} removeWrapper>
          <TableHeader>
            <TableColumn>MÉTODO</TableColumn>
            <TableColumn align="end">MONTO</TableColumn>
          </TableHeader>
          <TableBody items={entries} emptyContent="Sin datos">
            {(entry) => (
              <TableRow key={entry[0]}>
                <TableCell>
                  <Chip
                    color={
                      entry[0] === "cash" ? "success" :
                      entry[0] === "card" ? "primary" :
                      entry[0] === "transfer" ? "secondary" :
                      entry[0] === "mercadopago" ? "warning" : "default"
                    }
                    variant="flat"
                    size="sm"
                  >
                    {methodLabel(entry[0])}
                  </Chip>
                </TableCell>
                <TableCell>
                  <span className="font-semibold tabular-nums">{formatCurrency(entry[1], "ARS")}</span>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <div className="mt-3 flex justify-between border-t border-divider/60 pt-3 text-sm font-bold">
          <span>Total</span>
          <span className="tabular-nums">{formatCurrency(total, "ARS")}</span>
        </div>
      </CardBody>
    </Card>
  );
}

/* ── Bank account card ───────────────────────────────────────────────── */

function BankAccountCard({
  name,
  bank,
  balance,
}: {
  name: string;
  bank: string;
  balance: number;
}) {
  return (
    <Card className="flex-1">
      <CardBody>
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">{name}</p>
            <p className="truncate text-xs text-default-500">{bank}</p>
          </div>
          <p className="ml-4 shrink-0 text-right text-sm font-bold tabular-nums text-foreground">
            {formatCurrency(balance, "ARS")}
          </p>
        </div>
      </CardBody>
    </Card>
  );
}

/* ── Page component ──────────────────────────────────────────────────── */

export default function TreasuryDashboard() {
  const initial = useMemo(getMonthBoundaries, []);
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const [fromInput, setFromInput] = useState(initial.inputValue);
  const [toInput, setToInput] = useState(initial.inputValue);

  const overview = useTreasuryOverview(from, to);
  const cashFlow = useTreasuryCashFlow(from, to, "month");

  const handleFromChange = (value: string) => {
    setFromInput(value);
    setFrom(monthInputToFrom(value));
  };

  const handleToChange = (value: string) => {
    setToInput(value);
    setTo(monthInputToTo(value));
  };

  const loading = overview.loading || cashFlow.loading;
  const error = overview.error || cashFlow.error;
  const hasData =
    overview.data &&
    (overview.data.moneyIn.total > 0 ||
      overview.data.moneyOut.total > 0 ||
      overview.data.balances.totalBalance > 0);

  /* ── Chart bars ──────────────────────────────────────────────────── */

  const series = cashFlow.data?.series ?? [];
  const maxIn = Math.max(...series.map((s) => s.moneyIn), 0);
  const maxOut = Math.max(...series.map((s) => s.moneyOut), 0);
  const chartMax = Math.max(maxIn, maxOut, 1);

  return (
    <section className="space-y-6 overflow-x-hidden">
      {/* Header */}
      <div>
        <h1 className="financial-page-title">Tesorería</h1>
        <p className="financial-page-subtitle">
          Visión consolidada de ingresos, egresos, flujo de caja y saldos
          bancarios.
        </p>
      </div>

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
      {loading && !overview.data && <FinancialLoadingState />}

      {/* Error state */}
      {error && !loading && (
        <FinancialErrorState message={error} />
      )}

      {/* Empty state */}
      {!loading && !error && overview.data && !hasData && (
        <FinancialEmptyState label="Tesorería" />
      )}

      {/* ── Summary Cards ──────────────────────────────────────────────── */}
      {overview.data && hasData && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Ingresos */}
            <article className="financial-card">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-success/12 p-2.5">
                  <TrendingUp className="financial-icon text-success" />
                </div>
                <p className="text-xs uppercase tracking-[0.18em] text-default-500">
                  Total Ingresos
                </p>
              </div>
              <p className="mt-4 text-2xl font-semibold tracking-[-0.03em] text-success">
                {formatCurrency(overview.data.moneyIn.total, "ARS")}
              </p>
              <p className="mt-1 text-xs text-default-500">
                {overview.data.moneyIn.transactionCount} transacciones
              </p>
            </article>

            {/* Egresos */}
            <article className="financial-card">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-danger/12 p-2.5">
                  <TrendingDown className="financial-icon text-danger" />
                </div>
                <p className="text-xs uppercase tracking-[0.18em] text-default-500">
                  Total Egresos
                </p>
              </div>
              <p className="mt-4 text-2xl font-semibold tracking-[-0.03em] text-danger">
                {formatCurrency(overview.data.moneyOut.total, "ARS")}
              </p>
              <p className="mt-1 text-xs text-default-500">
                {overview.data.moneyOut.transactionCount} transacciones
              </p>
            </article>

            {/* Flujo Neto */}
            <article className="financial-card">
              <div className="flex items-center gap-3">
                <div
                  className={`rounded-xl p-2.5 ${
                    overview.data.netCashFlow >= 0
                      ? "bg-success/12"
                      : "bg-danger/12"
                  }`}
                >
                  <ArrowUpDown
                    className={`financial-icon ${
                      overview.data.netCashFlow >= 0
                        ? "text-success"
                        : "text-danger"
                    }`}
                  />
                </div>
                <p className="text-xs uppercase tracking-[0.18em] text-default-500">
                  Flujo Neto
                </p>
              </div>
              <p
                className={`mt-4 text-2xl font-semibold tracking-[-0.03em] ${
                  overview.data.netCashFlow >= 0
                    ? "text-success"
                    : "text-danger"
                }`}
              >
                {formatCurrency(overview.data.netCashFlow, "ARS")}
              </p>
            </article>

            {/* Balance Total */}
            <article className="financial-card">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-secondary/12 p-2.5">
                  <Wallet className="financial-icon text-secondary" />
                </div>
                <p className="text-xs uppercase tracking-[0.18em] text-default-500">
                  Balance Total
                </p>
              </div>
              <p className="mt-4 text-2xl font-semibold tracking-[-0.03em] text-secondary">
                {formatCurrency(overview.data.balances.totalBalance, "ARS")}
              </p>
            </article>
          </div>

          {/* ── Cash Flow Chart ──────────────────────────────────────────── */}
          <article className="financial-card">
            <h2 className="financial-section-title">
              Flujo de Caja Mensual
            </h2>
            <p className="mt-1 text-sm text-default-500">
              Ingresos (verde), egresos (rojo) y neto (azul) por período.
            </p>

            <div className="mt-8">
              {/* Legend */}
              <div className="mb-4 flex flex-wrap gap-6 text-xs font-medium">
                <span className="flex items-center gap-2">
                  <span className="inline-block h-3 w-3 rounded-sm bg-success" />
                  Ingresos
                </span>
                <span className="flex items-center gap-2">
                  <span className="inline-block h-3 w-3 rounded-sm bg-danger" />
                  Egresos
                </span>
                <span className="flex items-center gap-2">
                  <span className="inline-block h-3 w-3 rounded-sm bg-primary" />
                  Neto
                </span>
              </div>

              {/* Chart grid */}
              <div className="space-y-1">
                {series
                  .slice(-12)
                  .reverse()
                  .map((point) => {
                    const inPct = (point.moneyIn / chartMax) * 100;
                    const outPct = (point.moneyOut / chartMax) * 100;
                    const netPct = chartMax > 0 ? Math.abs(point.net) / chartMax * 100 : 0;
                    const periodLabel = point.period
                      ? new Date(point.period + "-02").toLocaleDateString(
                          "es-AR",
                          { month: "short", year: "2-digit" },
                        )
                      : point.period;

                    return (
                      <div key={point.period} className="group relative">
                        <div className="flex items-center gap-3">
                          <span className="w-16 shrink-0 text-right text-xs text-default-500">
                            {periodLabel}
                          </span>
                          <div className="flex flex-1 items-center gap-[3px]">
                            <div
                              className="h-4 rounded-sm bg-success transition-all"
                              style={{
                                width: `${Math.max(inPct, 0.5)}%`,
                              }}
                            />
                            <div
                              className="h-4 rounded-sm bg-danger transition-all"
                              style={{
                                width: `${Math.max(outPct, 0.5)}%`,
                              }}
                            />
                            <div
                              className="h-4 rounded-sm bg-primary transition-all"
                              style={{
                                width: `${Math.max(netPct, 0.5)}%`,
                              }}
                            />
                          </div>
                        </div>
                        {/* Tooltip */}
                        <div className="absolute -top-8 left-20 z-10 hidden whitespace-nowrap rounded-md bg-foreground/90 px-2.5 py-1.5 text-xs text-background shadow group-hover:block">
                          {periodLabel} &mdash; In:{" "}
                          {formatCurrency(point.moneyIn, "ARS")} / Out:{" "}
                          {formatCurrency(point.moneyOut, "ARS")} / Net:{" "}
                          {formatCurrency(point.net, "ARS")}
                        </div>
                      </div>
                    );
                  })}
              </div>

              {series.length === 0 && (
                <p className="py-8 text-center text-sm text-default-500">
                  Sin datos de flujo de caja para el período seleccionado.
                </p>
              )}
            </div>
          </article>

          {/* ── Payment Method Breakdown ─────────────────────────────────── */}
          <div className="flex flex-col gap-4 lg:flex-row">
            <MethodTable
              data={overview.data.moneyIn.byMethod}
              title="Ingresos por Método"
              total={overview.data.moneyIn.total}
            />
            <MethodTable
              data={overview.data.moneyOut.byMethod}
              title="Egresos por Método"
              total={overview.data.moneyOut.total}
            />
          </div>

          {/* ── Bank Accounts ────────────────────────────────────────────── */}
          <article className="financial-card">
            <div className="flex items-center gap-3">
              <Banknote className="financial-icon text-default-500" />
              <h2 className="financial-section-title">Cuentas Bancarias</h2>
            </div>

            <div className="mt-4 space-y-2">
              {overview.data.balances.bankAccounts.map((acc) => (
                <BankAccountCard
                  key={acc._id}
                  name={acc.name}
                  bank={acc.bank}
                  balance={acc.currentBalance}
                />
              ))}

              {overview.data.balances.cashInRegister > 0 && (
                <div className="flex items-center justify-between rounded-xl border border-divider/60 bg-success/5 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <DollarSign className="financial-icon text-success" />
                      Efectivo en Caja
                    </p>
                  </div>
                  <p className="ml-4 shrink-0 text-right text-sm font-bold tabular-nums text-success">
                    {formatCurrency(
                      overview.data.balances.cashInRegister,
                      "ARS",
                    )}
                  </p>
                </div>
              )}

              {overview.data.balances.bankAccounts.length === 0 &&
                overview.data.balances.cashInRegister === 0 && (
                  <p className="py-4 text-center text-sm text-default-500">
                    No hay cuentas bancarias registradas.
                  </p>
                )}
            </div>
          </article>
        </>
      )}
    </section>
  );
}
