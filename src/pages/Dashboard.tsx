import { useMemo, useRef } from "react";
import {
  Bell,
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
  CheckCheck,
} from "lucide-react";
import { Link } from "react-router-dom";

import { useDashboard } from "@/hooks/useDashboard";
import { useNotifications } from "@/hooks/useNotifications";
import { useSettings } from "@/hooks/useSettings";
import { formatCompactCurrency } from "@/utils/currency";

export default function DashboardPage() {
  const notificationsSectionRef = useRef<HTMLElement | null>(null);
  const { dashboard, loading, error } = useDashboard();
  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotifications();
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
  ];

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
    <div className="flex flex-col min-h-screen bg-background pb-24 font-sans max-w-md mx-auto relative overflow-hidden">
      <header className="app-topbar px-6 pt-6 pb-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="section-kicker">Fint Suite</div>
            <div>
              <h1 className="text-[28px] font-semibold tracking-[-0.03em] text-foreground">
                Panel Ejecutivo
              </h1>
              <p className="text-sm text-default-500">
                Operacion comercial, ventas e inventario en una sola vista.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-default-500">
            <button
              aria-label="Ir a notificaciones"
              className="relative flex h-10 w-10 items-center justify-center rounded-2xl app-panel-soft"
              type="button"
              onClick={() =>
                notificationsSectionRef.current?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                })
              }
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-danger ring-2 ring-background" />
              )}
            </button>
          </div>
        </div>

        <div className="mt-5 app-panel rounded-[28px] p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="section-kicker">Resumen Comercial</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-foreground truncate">
                {formatCompactCurrency(dashboard.sales.monthSales, currency)}
              </h2>
              <p className="mt-2 text-sm text-default-500">
                {dashboard.sales.totalOrdersMonth} ventas del mes y ticket
                promedio de{" "}
                {formatCompactCurrency(dashboard.sales.averageTicket, currency)}
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
              <TrendingUp size={14} />
              Monitoreo activo
            </div>
          </div>

          <div className="mt-5 h-28 w-full">
            <svg
              className="h-full w-full fill-none stroke-primary"
              preserveAspectRatio="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="4"
              viewBox="0 0 400 120"
            >
              <path d="M0 94C18 92 26 48 50 46C76 43 83 77 104 76C125 75 135 56 158 56C182 56 194 90 217 92C248 94 255 30 282 26C306 23 319 61 341 67C364 73 380 48 400 40" />
            </svg>
          </div>
        </div>
      </header>

      <div className="px-6 py-6 space-y-7">
        <section ref={notificationsSectionRef}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="section-kicker">Notificaciones</h2>
            {unreadCount > 0 && (
              <button
                className="flex items-center gap-1 text-xs font-semibold text-primary"
                onClick={() => void markAllAsRead()}
              >
                <CheckCheck size={14} />
                Marcar todas
              </button>
            )}
          </div>

          <div className="space-y-3">
            {notifications.length > 0 ? (
              notifications.slice(0, 5).map((notification) => (
                <button
                  key={notification._id}
                  className="app-panel w-full rounded-[20px] p-4 text-left transition-colors hover:bg-content2/70"
                  onClick={() => void markAsRead(notification._id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {notification.title}
                      </p>
                      <p className="mt-1 text-xs text-default-500">
                        {notification.message}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <span className="mt-1 h-2.5 w-2.5 rounded-full bg-primary" />
                    )}
                  </div>
                  <p className="mt-2 text-[11px] text-default-400">
                    {new Date(notification.createdAt).toLocaleString()}
                  </p>
                </button>
              ))
            ) : (
              <div className="app-panel rounded-[20px] p-4">
                <p className="text-sm text-default-500">
                  No hay notificaciones por ahora.
                </p>
              </div>
            )}
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="section-kicker">Acciones Rapidas</h2>
            {loading && (
              <Loader2 className="animate-spin text-primary" size={18} />
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
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

        <section>
          <h2 className="mb-4 section-kicker">Indicadores</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="app-panel rounded-[24px] p-5">
              <div className="flex items-center gap-2 text-primary">
                <Wallet size={16} />
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em]">
                  Cobrado
                </span>
              </div>
              <div className="mt-5 text-[clamp(1.35rem,5vw,1.875rem)] font-semibold leading-tight tracking-[-0.03em] text-foreground overflow-hidden text-ellipsis whitespace-nowrap">
                {formatCompactCurrency(
                  dashboard.sales.collectedMonth,
                  currency,
                )}
              </div>
              <p className="mt-2 text-xs leading-relaxed text-default-500">
                Ingreso efectivamente pagado en el mes actual.
              </p>
            </div>

            <div className="app-panel rounded-[24px] p-5">
              <div className="flex items-center gap-2 text-danger">
                <AlertTriangle size={16} />
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em]">
                  Stock Bajo
                </span>
              </div>
              <div className="mt-5 text-3xl font-semibold tracking-[-0.04em] text-foreground">
                {dashboard.inventory.lowStockCount.toString().padStart(2, "0")}
              </div>
              <p className="mt-2 text-xs leading-relaxed text-default-500">
                Productos por debajo del minimo operativo.
              </p>
            </div>

            <div className="app-panel rounded-[24px] p-5">
              <div className="flex items-center gap-2 text-primary">
                <FileText size={16} />
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em]">
                  Pendientes
                </span>
              </div>
              <div className="mt-5 text-3xl font-semibold tracking-[-0.04em] text-foreground">
                {dashboard.operations.pendingOrders.toString().padStart(2, "0")}
              </div>
              <p className="mt-2 text-xs leading-relaxed text-default-500">
                Ordenes que siguen abiertas dentro del circuito comercial.
              </p>
            </div>

            <div className="app-panel rounded-[24px] p-5">
              <div className="flex items-center gap-2 text-warning">
                <Users size={16} />
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em]">
                  Deuda
                </span>
              </div>
              <div className="mt-5 text-3xl font-semibold tracking-[-0.04em] text-foreground">
                {dashboard.customers.customersWithDebt
                  .toString()
                  .padStart(2, "0")}
              </div>
              <p className="mt-2 text-xs leading-relaxed text-default-500">
                Clientes con saldo pendiente por cobrar.
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-4">
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

        <section>
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

        <section className="app-panel rounded-[28px] p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="section-kicker">Base Financiera</p>
              <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-foreground">
                El dashboard ya esta listo para crecer con contabilidad
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-default-500">
                Ya distinguimos ventas, cobros, entregas, deuda y costo de
                inventario. Con esa base, el siguiente modulo natural puede ser
                caja, cuentas corrientes o reportes contables.
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/12 text-primary">
              <ArrowUpRight size={20} />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
