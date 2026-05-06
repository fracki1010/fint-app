import { useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  ShoppingCart,
  Plus,
  Loader2,
  ReceiptText,
  CircleDollarSign,
  FileDown,
  ChevronRight,
  TrendingUp,
  CheckCircle2,
  ScanBarcode,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@heroui/button";

import {
  SalesStatus,
  useInfiniteOrders,
} from "@features/sales/hooks/useOrders";
import { useMobileHeaderCompact } from "@shared/hooks/useMobileHeaderCompact";
import { useIsDesktop } from "@shared/hooks/useIsDesktop";
import { useSettings } from "@features/settings/hooks/useSettings";
import { formatCompactCurrency } from "@shared/utils/currency";
import { getClientName, getClientPhone } from "@shared/utils/entity";
import { PaginationBar } from "@shared/components/PaginationBar";
import { StatusBadge } from "@shared/components/StatusBadge";
import { OrderDetailPanel } from "@features/sales/components/OrderDetailPanel";
import { getCommercialStatus } from "@features/sales/utils/salesUtils";

const SALES_STATUS_OPTIONS: SalesStatus[] = ["Pendiente", "Confirmada", "Cancelada"];







// ── Detail panel content ──────────────────────────────────────────────

// ── Main page ─────────────────────────────────────────────────────────

export default function SalesPage() {
  const navigate = useNavigate();
  const { orderId } = useParams<{ orderId?: string }>();
  const isDesktop = useIsDesktop();
  const isHeaderCompact = useMobileHeaderCompact();
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const { orders, total, loading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteOrders(20);
  const { settings } = useSettings();
  const currency = settings?.currency || "USD";

  const DESKTOP_PAGE_SIZE = 15;
  const [desktopPage, setDesktopPage] = useState(1);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | SalesStatus>("all");

  // Date filters
  type DateFilter = "today" | "yesterday" | "7days" | "month" | "90days" | "custom";
  const [dateFilter, setDateFilter] = useState<DateFilter>("today");
  const [customDateFrom, setCustomDateFrom] = useState("");
  const [customDateTo, setCustomDateTo] = useState("");
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);

  const safeOrders = useMemo(
    () => orders.filter((o): o is NonNullable<typeof o> => Boolean(o && typeof o === "object" && o._id)),
    [orders],
  );

  const filteredOrders = useMemo(() => {
    let result = safeOrders;

    // Date filter
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (dateFilter === "today") {
      result = result.filter((o) => {
        const d = new Date(o.createdAt);
        return d >= today && d < new Date(today.getTime() + 86400000);
      });
    } else if (dateFilter === "yesterday") {
      result = result.filter((o) => {
        const d = new Date(o.createdAt);
        return d >= yesterday && d < today;
      });
    } else if (dateFilter === "7days") {
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      result = result.filter((o) => new Date(o.createdAt) >= sevenDaysAgo);
    } else if (dateFilter === "month") {
      const monthAgo = new Date(today);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      result = result.filter((o) => new Date(o.createdAt) >= monthAgo);
    } else if (dateFilter === "90days") {
      const ninetyDaysAgo = new Date(today);
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      result = result.filter((o) => new Date(o.createdAt) >= ninetyDaysAgo);
    } else if (dateFilter === "custom" && (customDateFrom || customDateTo)) {
      const from = customDateFrom ? new Date(customDateFrom) : new Date("1970-01-01");
      const to = customDateTo ? new Date(customDateTo) : new Date("2099-12-31");
      to.setDate(to.getDate() + 1);
      result = result.filter((o) => {
        const d = new Date(o.createdAt);
        return d >= from && d < to;
      });
    }

    if (activeFilter !== "all") result = result.filter((o) => getCommercialStatus(o) === activeFilter);
    if (searchQuery) result = result.filter((o) => getClientName(o.client).toLowerCase().includes(searchQuery.toLowerCase()) || o._id.toLowerCase().includes(searchQuery.toLowerCase()));
    return result;
  }, [safeOrders, searchQuery, activeFilter, dateFilter, customDateFrom, customDateTo]);

  useEffect(() => {
    setDesktopPage(1);
  }, [searchQuery, activeFilter, dateFilter, customDateFrom, customDateTo]);

  const desktopItems = isDesktop
    ? filteredOrders.slice((desktopPage - 1) * DESKTOP_PAGE_SIZE, desktopPage * DESKTOP_PAGE_SIZE)
    : filteredOrders;
  const desktopTotalPages = Math.ceil((total ?? filteredOrders.length) / DESKTOP_PAGE_SIZE);

  const handleDesktopNext = () => {
    const next = desktopPage + 1;
    if (next * DESKTOP_PAGE_SIZE > safeOrders.length && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
    setDesktopPage(next);
  };

  const exportToCsv = () => {
    const rows = filteredOrders.map((o) => [
      o.orderNumber || `#${o._id.slice(-6)}`,
      getClientName(o.client),
      getClientPhone(o.client),
      getCommercialStatus(o),
      o.paymentStatus || "Pendiente",
      o.deliveryStatus || "Pendiente",
      o.totalAmount || 0,
      new Date(o.createdAt).toLocaleDateString(),
      o.items?.length || 0,
    ]);

    const header = "Pedido,Cliente,Telefono,Estado,Pago,Entrega,Total,Fecha,Items";
    const csv = [header, ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    const filterLabel = dateFilter === "today" ? "hoy" : dateFilter === "yesterday" ? "ayer" : dateFilter;
    link.download = `ventas_${filterLabel}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  const statuses = useMemo(
    () => SALES_STATUS_OPTIONS.filter((s) => safeOrders.some((o) => getCommercialStatus(o) === s)),
    [safeOrders],
  );

  const totalSales = useMemo(() => safeOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0), [safeOrders]);

  const confirmedCount = useMemo(() => safeOrders.filter((o) => getCommercialStatus(o) === "Confirmada").length, [safeOrders]);
  const paidCount = useMemo(() => safeOrders.filter((o) => o.paymentStatus === "Pagado").length, [safeOrders]);

  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target || !hasNextPage || isDesktop) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0]?.isIntersecting && !isFetchingNextPage) fetchNextPage(); },
      { rootMargin: "240px 0px" },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, filteredOrders.length, isDesktop]);

  // Mobile: show full-screen detail when orderId is set
  if (!isDesktop && orderId) {
    return (
      <div className="flex h-screen flex-col bg-background">
        <OrderDetailPanel
          currency={currency}
          isDesktop={false}
          orderId={orderId}
          settings={settings}
          onBack={() => navigate("/sales")}
        />
      </div>
    );
  }

  // ── List panel ──────────────────────────────────────────────────────
  const ListPanel = (
    <div className={`flex flex-col ${isDesktop ? "h-full" : "min-h-screen pb-28"}`}>
      {/* Header */}
      <div className={`shrink-0 page-header ${isHeaderCompact ? "py-3" : ""}`}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="page-title">Ventas</h1>
            {!isHeaderCompact && <p className="page-subtitle">Seguimiento de operaciones y estados</p>}
          </div>
          <div className="flex items-center gap-2">
            <Link
              className="flex items-center gap-1.5 rounded-xl bg-primary/10 px-4 py-2.5 text-sm font-bold text-primary hover:bg-primary/20 transition"
              to="/quick-sale"
            >
              <ScanBarcode size={15} /> Venta Rápida
            </Link>
            <Link
              className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/25 hover:bg-primary/90 transition"
              to="/new-operation"
            >
              <Plus size={15} /> Nueva venta
            </Link>
            <button
              className="flex items-center gap-1.5 rounded-xl border border-divider/30 px-4 py-2.5 text-sm font-bold text-default-600 hover:bg-content2/60 transition"
              onClick={exportToCsv}
              title="Exportar ventas filtradas"
            >
              <FileDown size={15} /> {isDesktop ? "Exportar" : ""}
            </button>
          </div>
        </div>

        {/* KPI strip */}
        {!isHeaderCompact && (
          <div className={`mt-4 grid gap-3 ${isDesktop ? "grid-cols-4" : "grid-cols-2"}`}>
            <div className="stat-card !p-4">
              <div className="flex items-center justify-between">
                <span className="stat-card-label">Operaciones</span>
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <ReceiptText size={13} />
                </div>
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">{total || safeOrders.length}</p>
            </div>
            <div className="stat-card !p-4">
              <div className="flex items-center justify-between">
                <span className="stat-card-label">Facturado</span>
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <TrendingUp size={13} />
                </div>
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">{formatCompactCurrency(totalSales, currency)}</p>
            </div>
            {isDesktop && (
              <>
                <div className="stat-card !p-4">
                  <div className="flex items-center justify-between">
                    <span className="stat-card-label">Confirmadas</span>
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <CheckCircle2 size={13} />
                    </div>
                  </div>
                  <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">{confirmedCount}</p>
                </div>
                <div className="stat-card !p-4">
                  <div className="flex items-center justify-between">
                    <span className="stat-card-label">Pagadas</span>
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-success/10 text-success">
                      <CircleDollarSign size={13} />
                    </div>
                  </div>
                  <p className={`mt-2 text-2xl font-bold tracking-tight ${paidCount > 0 ? "text-success" : "text-foreground"}`}>{paidCount}</p>
                </div>
              </>
            )}
          </div>
        )}

        {/* Search */}
        <div className="mt-3 search-bar">
          <Search size={15} className="shrink-0 text-default-400" />
          <input
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-default-400 focus:outline-none"
            placeholder="Buscar por cliente o ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="text-default-400 hover:text-foreground transition" onClick={() => setSearchQuery("")}>×</button>
          )}
        </div>
      </div>

      {/* Date Filters */}
      <div className="shrink-0 flex gap-1.5 overflow-x-auto no-scrollbar px-4 pt-3 lg:px-5">
        {([
          { key: "today", label: "Hoy" },
          { key: "yesterday", label: "Ayer" },
          { key: "7days", label: "7 días" },
          { key: "month", label: "Mes" },
          { key: "90days", label: "90 días" },
          { key: "custom", label: "Otro" },
        ] as { key: DateFilter; label: string }[]).map((f) => (
          <button
            key={f.key}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition ${
              dateFilter === f.key
                ? "bg-primary text-white shadow-md shadow-primary/25"
                : "bg-content2/60 text-default-500 hover:bg-content2"
            }`}
            onClick={() => {
              setDateFilter(f.key);
              if (f.key === "custom") {
                setShowCustomDatePicker(true);
              } else {
                setShowCustomDatePicker(false);
              }
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Custom date picker */}
      {showCustomDatePicker && (
        <div className="shrink-0 flex items-center gap-2 px-4 py-2 lg:px-5">
          <input
            className="corp-input rounded-lg px-3 py-1.5 text-xs"
            type="date"
            value={customDateFrom}
            onChange={(e) => setCustomDateFrom(e.target.value)}
          />
          <span className="text-xs text-default-400">hasta</span>
          <input
            className="corp-input rounded-lg px-3 py-1.5 text-xs"
            type="date"
            value={customDateTo}
            onChange={(e) => setCustomDateTo(e.target.value)}
          />
          <button
            className="rounded-lg bg-danger/10 px-3 py-1.5 text-xs font-bold text-danger hover:bg-danger/20 transition"
            onClick={() => {
              setCustomDateFrom("");
              setCustomDateTo("");
            }}
          >
            Limpiar
          </button>
        </div>
      )}

      {/* Status Filters */}
      <div className="shrink-0 flex gap-2 overflow-x-auto no-scrollbar px-4 py-2 lg:px-5">
        {(["all", ...statuses] as ("all" | SalesStatus)[]).map((f) => (
          <button
            key={f}
            className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-bold transition ${
              activeFilter === f
                ? "bg-content1 border border-primary text-primary"
                : "bg-content2/60 text-default-500 hover:bg-content2"
            }`}
            onClick={() => setActiveFilter(f)}
          >
            {f === "all" ? "Todas" : f}
          </button>
        ))}
      </div>

      {/* Order list */}
      <div className="flex-1 overflow-y-auto px-4 lg:px-5">
        {loading && safeOrders.length === 0 ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-default-400" size={28} /></div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-center text-default-400">
            <ShoppingCart size={36} />
            <p className="text-sm font-semibold text-foreground">Sin ventas para mostrar</p>
            <p className="text-xs">{searchQuery || activeFilter !== "all" ? "Probá con otros filtros." : "Aún no se registraron operaciones."}</p>
          </div>
        ) : (
          <div className="space-y-2 pb-28">
            {(isDesktop ? desktopItems : filteredOrders).map((order) => {
              const isSelected = order._id === orderId;
              return (
                <button
                  key={order._id}
                  className={`w-full rounded-2xl border px-4 py-3.5 text-left transition-all ${
                    isSelected
                      ? "border-primary/30 bg-primary/8 shadow-[0_0_0_1px_rgb(var(--warm-glow)/0.15),0_4px_16px_rgb(var(--warm-glow)/0.10)]"
                      : "border-[color:rgb(var(--warm-border)/0.08)] bg-content2/40 hover:border-primary/20 hover:bg-primary/5"
                  }`}
                  onClick={() => navigate(`/sales/${order._id}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${isSelected ? "bg-primary/15 text-primary" : "bg-content2 text-default-400"}`}>
                      <ReceiptText size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">{getClientName(order.client)}</p>
                      <div className="mt-0.5 flex items-center gap-1.5">
                        <span className="text-[11px] text-default-400">{order.orderNumber || `#${order._id.slice(-6)}`}</span>
                        <span className="text-[11px] text-default-400">·</span>
                        <span className="text-[11px] text-default-400">{new Date(order.createdAt).toLocaleDateString()}</span>
                        <span className="text-[11px] text-default-400">·</span>
                        <span className="text-[11px] text-default-400">{new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                        {!isDesktop && <StatusBadge label={order.paymentStatus || "Pendiente"} />}
                      </div>
                    </div>
                    {isDesktop && (
                      <div className="shrink-0 flex items-center gap-1">
                        <StatusBadge label={order.salesStatus || "Pendiente"} />
                        <StatusBadge label={order.paymentStatus || "Pendiente"} />
                        <StatusBadge label={order.deliveryStatus || "Pendiente"} />
                      </div>
                    )}
                    <div className="shrink-0 text-right">
                      {isDesktop && <p className="text-[10px] uppercase tracking-[0.12em] text-default-400">Importe</p>}
                      <p className="text-sm font-bold text-foreground">{formatCompactCurrency(Number(order.totalAmount || 0), currency)}</p>
                    </div>
                    {isDesktop && <ChevronRight size={14} className={`shrink-0 transition-colors ${isSelected ? "text-primary" : "text-default-300"}`} />}
                  </div>
                </button>
              );
            })}

            {!isDesktop && (
              <>
                <div ref={loadMoreRef} className="h-4 w-full" />
                {isFetchingNextPage && (
                  <div className="flex justify-center py-4"><Loader2 className="animate-spin text-default-400" size={20} /></div>
                )}
                {!hasNextPage && safeOrders.length > 0 && (
                  <p className="py-3 text-center text-[11px] text-default-400">Fin del historial</p>
                )}
              </>
            )}
            {isDesktop && (
              <PaginationBar
                from={(desktopPage - 1) * DESKTOP_PAGE_SIZE + 1}
                loading={isFetchingNextPage}
                page={desktopPage}
                to={Math.min(desktopPage * DESKTOP_PAGE_SIZE, total ?? filteredOrders.length)}
                total={total ?? filteredOrders.length}
                totalPages={desktopTotalPages}
                onNext={handleDesktopNext}
                onPrev={() => setDesktopPage((p) => p - 1)}
              />
            )}
          </div>
        )}
      </div>

      {/* Mobile FABs */}
      {!isDesktop && (
        <div className="fixed bottom-[100px] right-6 z-10 flex flex-col gap-3 lg:hidden">
          <Button
            isIconOnly
            as={Link}
            className="rounded-full shadow-lg shadow-primary/35"
            color="primary"
            size="lg"
            to="/new-operation"
          >
            <Plus size={24} />
          </Button>
          <Button
            isIconOnly
            as={Link}
            className="rounded-full shadow-lg shadow-primary/25"
            color="default"
            size="lg"
            variant="bordered"
            to="/quick-sale"
          >
            <ScanBarcode size={22} />
          </Button>
        </div>
      )}
    </div>
  );

  // ── Desktop slide-over layout ─────────────────────────────────────────
  if (isDesktop) {
    return (
      <div className="h-full">
        {ListPanel}
        <div
          className={`fixed inset-0 z-40 transition-all duration-300 ${orderId ? "bg-black/30 backdrop-blur-[2px]" : "pointer-events-none opacity-0"}`}
          onClick={() => navigate("/sales")}
        />
        <div
          className={`fixed right-0 top-0 z-50 h-screen w-[min(700px,58vw)] overflow-y-auto border-l border-[color:rgb(var(--warm-border)/0.12)] bg-content1 shadow-[-24px_0_60px_rgba(40,25,15,0.28)] transition-transform duration-300 ease-in-out ${orderId ? "translate-x-0" : "translate-x-full"}`}
        >
          {orderId && (
            <OrderDetailPanel
              currency={currency}
              isDesktop
              orderId={orderId}
              settings={settings}
              onBack={() => navigate("/sales")}
              onClose={() => navigate("/sales")}
            />
          )}
        </div>
      </div>
    );
  }

  // ── Mobile list layout ───────────────────────────────────────────────
  return ListPanel;
}