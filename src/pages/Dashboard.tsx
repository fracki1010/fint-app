import { useMemo, useState } from "react";
import {
  ShoppingCart,
  UserPlus,
  PackagePlus,
  TrendingUp,
  AlertTriangle,
  FileText,
  Loader2,
  ArrowUpRight,
  Wallet,
  Boxes,
  Users,
  Activity,
  ReceiptText,
  PackageCheck,
  ChartNoAxesCombined,
} from "lucide-react";
import { Link } from "react-router-dom";
import jsPDF from "jspdf";

import { useDashboard, useDashboardOptionalKpis } from "@/hooks/useDashboard";
import { useSettings } from "@/hooks/useSettings";
import { formatCompactCurrency } from "@/utils/currency";

export default function DashboardPage() {
  const [optionalRangeDays, setOptionalRangeDays] = useState(90);
  const { dashboard, loading, error } = useDashboard();
  const { optionalKpis, loading: optionalLoading } =
    useDashboardOptionalKpis(optionalRangeDays);
  const { settings } = useSettings();
  const currency = settings?.currency || "USD";

  const activityFeed = useMemo(() => {
    if (!dashboard) return [];

    const orders = dashboard.recentOrders.map((order) => ({
      id: `order-${order._id}`,
      title: order.orderNumber || `Pedido #${order._id.slice(-6)}`,
      subtitle: `${order.clientName} · ${order.deliveryStatus}`,
      amount: formatCompactCurrency(order.totalAmount, currency),
      createdAt: order.createdAt,
      icon: ReceiptText,
      tone: "primary" as const,
    }));

    const movements = dashboard.recentMovements.map((movement) => ({
      id: `movement-${movement._id}`,
      title: `${movement.type} · ${movement.productName}`,
      subtitle: movement.reason || movement.type,
      amount: `${movement.quantity} un.`,
      createdAt: movement.createdAt,
      icon: PackageCheck,
      tone:
        movement.type === "ENTRADA"
          ? ("success" as const)
          : movement.type === "MERMA"
            ? ("danger" as const)
            : ("default" as const),
    }));

    return [...orders, ...movements]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, 6);
  }, [currency, dashboard]);

  const quickActions = [
    {
      label: "Nueva Venta",
      caption: "Registrar pedido",
      icon: ShoppingCart,
      to: "/new-operation",
    },
    {
      label: "Cliente",
      caption: "Alta comercial",
      icon: UserPlus,
      to: "/clients",
    },
    {
      label: "Producto",
      caption: "Gestionar catalogo",
      icon: PackagePlus,
      to: "/products",
    },
    {
      label: "Ajustes",
      caption: "Reglas del negocio",
      icon: ArrowUpRight,
      to: "/settings",
    },
    {
      label: "Finanzas",
      caption: "Panel financiero",
      icon: ChartNoAxesCombined,
      to: "/financial/dashboard",
    },
  ];

  const peakHour = useMemo(() => {
    if (!optionalKpis?.salesByHour?.length) return null;

    return [...optionalKpis.salesByHour].sort((a, b) => b.revenue - a.revenue)[0];
  }, [optionalKpis]);

  const peakWeekday = useMemo(() => {
    if (!optionalKpis?.salesByWeekday?.length) return null;

    return optionalKpis.salesByWeekday[0];
  }, [optionalKpis]);

  const downloadFile = (content: BlobPart, fileName: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCsv = () => {
    if (!optionalKpis) return;

    const lines: string[] = [];
    lines.push(`Rango,${optionalKpis.meta.startDate},${optionalKpis.meta.endDate}`);
    lines.push("");
    lines.push("Categoria,Revenue,SharePct");
    optionalKpis.salesByCategory.forEach((row) => {
      lines.push(`${row.category},${row.revenue},${row.sharePct}`);
    });
    lines.push("");
    lines.push("Producto,MargenBruto,GananciaBruta,Revenue,Cantidad");
    optionalKpis.topProductsByMargin.forEach((row) => {
      lines.push(
        `${row.productName},${row.grossMarginPct},${row.grossProfit},${row.revenue},${row.quantitySold}`,
      );
    });
    lines.push("");
    lines.push("Cliente,Revenue,Ordenes");
    optionalKpis.topClients.forEach((row) => {
      lines.push(`${row.clientName},${row.revenue},${row.orders}`);
    });

    const safeStart = optionalKpis.meta.startDate.replace(/-/g, "");
    const safeEnd = optionalKpis.meta.endDate.replace(/-/g, "");
    downloadFile(lines.join("\n"), `optional-kpis-${safeStart}-${safeEnd}.csv`, "text/csv;charset=utf-8;");
  };

  const handleExportPdf = () => {
    if (!optionalKpis) return;

    const doc = new jsPDF();
    let y = 16;

    doc.setFontSize(14);
    doc.text("Fint - Metricas Opcionales", 14, y);
    y += 8;
    doc.setFontSize(10);
    doc.text(
      `Rango: ${optionalKpis.meta.startDate} a ${optionalKpis.meta.endDate}`,
      14,
      y,
    );
    y += 10;

    doc.setFontSize(11);
    doc.text(
      `Rotacion inventario: ${optionalKpis.inventoryRotation.ratio.toFixed(3)}x (${optionalKpis.inventoryRotation.method})`,
      14,
      y,
    );
    y += 8;

    doc.text("Top productos por margen:", 14, y);
    y += 6;
    optionalKpis.topProductsByMargin.slice(0, 6).forEach((row, idx) => {
      doc.text(
        `${idx + 1}. ${row.productName} - Margen ${row.grossMarginPct.toFixed(1)}% - Ganancia ${row.grossProfit.toFixed(2)}`,
        14,
        y,
      );
      y += 6;
    });

    y += 4;
    doc.text("Top clientes:", 14, y);
    y += 6;
    optionalKpis.topClients.slice(0, 6).forEach((row, idx) => {
      doc.text(
        `${idx + 1}. ${row.clientName} - ${row.orders} ventas - ${row.revenue.toFixed(2)}`,
        14,
        y,
      );
      y += 6;
    });

    const safeStart = optionalKpis.meta.startDate.replace(/-/g, "");
    const safeEnd = optionalKpis.meta.endDate.replace(/-/g, "");
    doc.save(`optional-kpis-${safeStart}-${safeEnd}.pdf`);
  };

  if (loading && !dashboard) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="app-panel w-full max-w-md rounded-[28px] p-6 text-center">
          <p className="text-base font-semibold text-foreground">
            No pudimos cargar el panel ejecutivo
          </p>
          <p className="mt-2 text-sm text-default-500">
            {error || "El dashboard no devolvio datos."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-full w-full flex-col overflow-y-auto bg-background pb-24 font-sans lg:pb-8">

      {/* ── Desktop header ──────────────────────────────────────────── */}
      <header className="page-header">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="page-title">Panel Ejecutivo</h1>
            <p className="page-subtitle">Operación comercial, ventas e inventario en una sola vista.</p>
          </div>
          <div className="flex items-center gap-3">
            {/* KPI hero — visible solo en desktop */}
            <div className="hidden lg:flex items-center gap-6">
              <div className="text-right">
                <p className="stat-card-label">Ventas del mes</p>
                <p className="text-xl font-bold tracking-tight text-foreground">
                  {formatCompactCurrency(dashboard.sales.monthSales, currency)}
                </p>
              </div>
              <div className="text-right">
                <p className="stat-card-label">Ticket promedio</p>
                <p className="text-xl font-bold tracking-tight text-foreground">
                  {formatCompactCurrency(dashboard.sales.averageTicket, currency)}
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-4 py-2 text-xs font-bold text-primary">
                <TrendingUp size={13} />
                Monitoreo activo
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── Mobile hero card ─────────────────────────────────────────── */}
      <div className="px-4 pt-5 lg:hidden">
        <div className="app-panel rounded-[28px] p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="section-kicker">Resumen Comercial</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-foreground truncate">
                {formatCompactCurrency(dashboard.sales.monthSales, currency)}
              </h2>
              <p className="mt-2 text-sm text-default-500">
                {dashboard.sales.totalOrdersMonth} ventas · ticket prom.{" "}
                {formatCompactCurrency(dashboard.sales.averageTicket, currency)}
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
              <TrendingUp size={14} />
              Activo
            </div>
          </div>
          <div className="mt-5 h-24 w-full">
            <svg className="h-full w-full fill-none stroke-primary" preserveAspectRatio="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" viewBox="0 0 400 120">
              <path d="M0 94C18 92 26 48 50 46C76 43 83 77 104 76C125 75 135 56 158 56C182 56 194 90 217 92C248 94 255 30 282 26C306 23 319 61 341 67C364 73 380 48 400 40" />
            </svg>
          </div>
        </div>
      </div>

      <div className="space-y-6 px-4 py-5 lg:grid lg:grid-cols-12 lg:items-start lg:gap-5 lg:space-y-0 lg:px-6 lg:py-6">
        <section className="lg:col-span-12">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="section-kicker">Acciones Rapidas</h2>
            {loading && (
              <Loader2 className="animate-spin text-primary" size={18} />
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            {quickActions.map((action) => {
              const Icon = action.icon;

              return (
                <Link
                  key={action.to}
                  className="app-panel rounded-[24px] p-4 transition-transform hover:-translate-y-0.5 active:scale-[0.98]"
                  to={action.to}
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/12 text-primary">
                    <Icon size={20} />
                  </div>
                  <div className="mt-4">
                    <p className="text-sm font-semibold text-foreground">
                      {action.label}
                    </p>
                    <p className="mt-1 text-[11px] leading-tight text-default-500">
                      {action.caption}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="lg:col-span-12">
          <h2 className="mb-3 section-kicker">Indicadores</h2>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">

            <div className="stat-card">
              <div className="flex items-center justify-between">
                <span className="stat-card-label">Cobrado</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Wallet size={14} />
                </div>
              </div>
              <div className="mt-4 stat-card-value">
                {formatCompactCurrency(dashboard.sales.collectedMonth, currency)}
              </div>
              <p className="stat-card-sub">Ingreso efectivo del mes actual.</p>
            </div>

            <div className="stat-card">
              <div className="flex items-center justify-between">
                <span className="stat-card-label">Stock Bajo</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-danger/10 text-danger">
                  <AlertTriangle size={14} />
                </div>
              </div>
              <div className="mt-4 stat-card-value text-danger">
                {dashboard.inventory.lowStockCount.toString().padStart(2, "0")}
              </div>
              <p className="stat-card-sub">Productos bajo el mínimo operativo.</p>
            </div>

            <div className="stat-card">
              <div className="flex items-center justify-between">
                <span className="stat-card-label">Pendientes</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-warning/10 text-warning">
                  <FileText size={14} />
                </div>
              </div>
              <div className="mt-4 stat-card-value">
                {dashboard.operations.pendingOrders.toString().padStart(2, "0")}
              </div>
              <p className="stat-card-sub">Órdenes abiertas en el circuito.</p>
            </div>

            <div className="stat-card">
              <div className="flex items-center justify-between">
                <span className="stat-card-label">Con Deuda</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-warning/10 text-warning">
                  <Users size={14} />
                </div>
              </div>
              <div className="mt-4 stat-card-value">
                {dashboard.customers.customersWithDebt.toString().padStart(2, "0")}
              </div>
              <p className="stat-card-sub">Clientes con saldo pendiente.</p>
            </div>

          </div>
        </section>

        <section className="grid gap-4 lg:col-span-12 lg:grid-cols-2">
          <div className="app-panel rounded-[28px] p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="section-kicker">Operacion</h2>
              <Boxes className="text-primary" size={18} />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="min-w-0 rounded-2xl bg-content2/55 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-default-500">
                  Confirmadas
                </p>
                <p className="mt-3 truncate text-[clamp(1.25rem,4.8vw,1.5rem)] font-semibold text-foreground">
                  {dashboard.operations.confirmedOrders}
                </p>
              </div>
              <div className="min-w-0 rounded-2xl bg-content2/55 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-default-500">
                  Pagadas
                </p>
                <p className="mt-3 truncate text-[clamp(1.25rem,4.8vw,1.5rem)] font-semibold text-foreground">
                  {dashboard.operations.paidOrders}
                </p>
              </div>
              <div className="min-w-0 rounded-2xl bg-content2/55 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-default-500">
                  Entregadas
                </p>
                <p className="mt-3 truncate text-[clamp(1.25rem,4.8vw,1.5rem)] font-semibold text-foreground">
                  {dashboard.operations.deliveredOrders}
                </p>
              </div>
            </div>
          </div>

          <div className="app-panel rounded-[28px] p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="section-kicker">Top Productos</h2>
              <Link
                className="text-xs font-semibold text-primary"
                to="/products"
              >
                Ver catalogo
              </Link>
            </div>
            <div className="space-y-3">
              {dashboard.topProducts.length > 0 ? (
                dashboard.topProducts.map((product, index) => (
                  <div
                    key={`${product.productId || product.name}-${index}`}
                    className="flex items-center justify-between rounded-2xl bg-content2/55 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {product.name}
                      </p>
                      <p className="mt-1 text-xs text-default-500">
                        {product.sku || "Sin SKU"} · {product.quantitySold}{" "}
                        unidad(es)
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-foreground">
                      {formatCompactCurrency(product.revenue, currency)}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-default-500">
                  Aun no hay suficiente historial para destacar productos.
                </p>
              )}
            </div>
          </div>

          <div className="app-panel rounded-[28px] p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="section-kicker">Alertas de Inventario</h2>
              <Link
                className="text-xs font-semibold text-primary"
                to="/movements"
              >
                Ver movimientos
              </Link>
            </div>
            <div className="space-y-3">
              {dashboard.inventory.lowStockProducts.length > 0 ? (
                dashboard.inventory.lowStockProducts.map((product) => (
                  <div
                    key={product._id}
                    className="flex items-center justify-between rounded-2xl bg-content2/55 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {product.name}
                      </p>
                      <p className="mt-1 text-xs text-default-500">
                        {product.sku || "Sin SKU"} · minimo {product.minStock}{" "}
                        {product.unitOfMeasure}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-danger">
                      {product.stock} {product.unitOfMeasure}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-default-500">
                  No hay alertas de stock bajo en este momento.
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="app-panel rounded-[28px] p-5 lg:col-span-12">
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <h2 className="section-kicker">Metricas Opcionales por Rubro</h2>
            <div className="flex flex-wrap items-center gap-2">
              {[30, 90, 180].map((days) => (
                <button
                  key={`range-${days}`}
                  className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                    optionalRangeDays === days
                      ? "bg-primary text-primary-foreground"
                      : "bg-content2/70 text-default-600 hover:bg-content2"
                  }`}
                  onClick={() => setOptionalRangeDays(days)}
                  type="button"
                >
                  {days}d
                </button>
              ))}
              <button
                className="rounded-lg bg-content2/70 px-3 py-1 text-xs font-semibold text-default-600 hover:bg-content2"
                onClick={handleExportCsv}
                type="button"
              >
                Exportar CSV
              </button>
              <button
                className="rounded-lg bg-content2/70 px-3 py-1 text-xs font-semibold text-default-600 hover:bg-content2"
                onClick={handleExportPdf}
                type="button"
              >
                Exportar PDF
              </button>
              {optionalLoading && (
                <Loader2 className="animate-spin text-primary" size={16} />
              )}
            </div>
          </div>

          {!optionalKpis ? (
            <p className="text-sm text-default-500">
              No hay datos suficientes para analisis opcional.
            </p>
          ) : (
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="rounded-2xl bg-content2/55 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-default-500">
                  Rotacion Inventario (Proxy)
                </p>
                <p className="mt-2 text-xl font-semibold text-foreground">
                  {optionalKpis.inventoryRotation.ratio.toFixed(3)}x
                </p>
                <p className="mt-1 text-xs text-default-500">
                  COGS:{" "}
                  {formatCompactCurrency(optionalKpis.inventoryRotation.cogs, currency)}
                </p>
                <p className="mt-1 text-xs text-default-500">
                  Base stock:{" "}
                  {formatCompactCurrency(
                    optionalKpis.inventoryRotation.averageStockValue,
                    currency,
                  )}{" "}
                  · {optionalKpis.inventoryRotation.snapshotCount} snapshot(s)
                </p>
              </div>

              <div className="rounded-2xl bg-content2/55 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-default-500">
                  Franja y Dia Pico
                </p>
                <p className="mt-2 text-sm font-semibold text-foreground">
                  Hora: {peakHour ? `${peakHour.hour}:00` : "Sin datos"}
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  Dia: {peakWeekday?.weekday || "Sin datos"}
                </p>
              </div>

              <div className="rounded-2xl bg-content2/55 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-default-500">
                  Categoria Lider
                </p>
                <p className="mt-2 text-sm font-semibold text-foreground">
                  {optionalKpis.salesByCategory[0]?.category || "Sin datos"}
                </p>
                <p className="mt-1 text-xs text-default-500">
                  {optionalKpis.salesByCategory[0]
                    ? `${optionalKpis.salesByCategory[0].sharePct.toFixed(1)}% del total`
                    : "Sin participacion aun"}
                </p>
              </div>

              <div className="rounded-2xl bg-content2/55 p-4 lg:col-span-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-default-500">
                  Top Productos por Margen
                </p>
                <div className="mt-3 space-y-2">
                  {optionalKpis.topProductsByMargin.slice(0, 3).map((product) => (
                    <div
                      key={`margin-${product.productName}-${product.sku || "no-sku"}`}
                      className="flex items-center justify-between rounded-xl bg-background/60 px-3 py-2"
                    >
                      <p className="text-sm font-medium text-foreground">
                        {product.productName}
                      </p>
                      <p className="text-xs font-semibold text-primary">
                        {formatCompactCurrency(product.grossProfit, currency)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl bg-content2/55 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-default-500">
                  Top Clientes
                </p>
                <div className="mt-3 space-y-2">
                  {optionalKpis.topClients.slice(0, 3).map((client) => (
                    <div
                      key={`client-${client.clientId || client.clientName}`}
                      className="rounded-xl bg-background/60 px-3 py-2"
                    >
                      <p className="text-sm font-medium text-foreground">
                        {client.clientName}
                      </p>
                      <p className="mt-0.5 text-xs text-default-500">
                        {formatCompactCurrency(client.revenue, currency)} · {client.orders}{" "}
                        ventas
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="lg:col-span-7">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="section-kicker">Actividad Reciente</h2>
            <Activity className="text-primary" size={18} />
          </div>

          <div className="space-y-3">
            {activityFeed.length > 0 ? (
              activityFeed.map((entry) => {
                const Icon = entry.icon;

                return (
                  <div
                    key={entry.id}
                    className="app-panel rounded-[24px] p-4 transition-colors hover:bg-content2/70"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-content2 text-default-600">
                          <Icon size={18} />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-foreground">
                            {entry.title}
                          </h3>
                          <p className="mt-1 text-xs text-default-500">
                            {entry.subtitle}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-sm font-semibold text-foreground">
                          {entry.amount}
                        </p>
                        <p className="mt-1 text-xs text-default-500">
                          {new Date(entry.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="app-panel rounded-[24px] p-6 text-center">
                <p className="text-sm font-medium text-foreground">
                  Todavia no hay actividad operativa registrada
                </p>
                <p className="mt-2 text-xs text-default-500">
                  Cuando empieces a vender y mover stock, el tablero se completa
                  solo.
                </p>
              </div>
            )}
          </div>
        </section>

        <section className="app-panel rounded-[28px] p-5 lg:col-span-5 lg:self-start">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="section-kicker">KPI Universales</p>
              <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-foreground">
                Rentabilidad y clientes en una sola lectura
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-default-500">
                Indicadores transversales para cualquier rubro, con foco en
                ventas netas, margen y fidelizacion.
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/12 text-primary">
              <ArrowUpRight size={20} />
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-content2/55 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-default-500">
                Ganancia Bruta (Mes)
              </p>
              <p className="mt-2 text-lg font-semibold text-foreground">
                {formatCompactCurrency(
                  dashboard.universalKpis.grossProfit.month,
                  currency,
                )}
              </p>
            </div>

            <div className="rounded-2xl bg-content2/55 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-default-500">
                Margen Bruto (Mes)
              </p>
              <p className="mt-2 text-lg font-semibold text-foreground">
                {dashboard.universalKpis.grossMarginPct.month.toFixed(1)}%
              </p>
            </div>

            <div className="rounded-2xl bg-content2/55 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-default-500">
                Crecimiento Mensual
              </p>
              <p className="mt-2 text-lg font-semibold text-foreground">
                {dashboard.universalKpis.growth.salesMonthVsPreviousMonthPct >= 0
                  ? "+"
                  : ""}
                {dashboard.universalKpis.growth.salesMonthVsPreviousMonthPct.toFixed(
                  1,
                )}
                %
              </p>
            </div>

            <div className="rounded-2xl bg-content2/55 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-default-500">
                Nuevos vs Recurrentes
              </p>
              <p className="mt-2 text-lg font-semibold text-foreground">
                {dashboard.universalKpis.customers.newThisMonth}/
                {dashboard.universalKpis.customers.returningThisMonth}
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
