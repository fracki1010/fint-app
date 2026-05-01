import { useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  ShoppingCart,
  Plus,
  Loader2,
  ReceiptText,
  PackageCheck,
  CircleDollarSign,
  ClipboardCheck,
  FileDown,
  ChevronRight,
  ArrowLeft,
  X,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@heroui/button";
import { Select, SelectItem } from "@heroui/select";

import {
  DeliveryStatus,
  Order,
  PaymentStatus,
  SalesStatus,
  useInfiniteOrders,
  useOrderDetail,
  useOrders,
} from "@/hooks/useOrders";
import { useMobileHeaderCompact } from "@/hooks/useMobileHeaderCompact";
import { useIsDesktop } from "@/hooks/useIsDesktop";
import { useSettings } from "@/hooks/useSettings";
import { useAppToast } from "@/components/AppToast";
import { formatCompactCurrency, formatCurrency } from "@/utils/currency";
import { getErrorMessage } from "@/utils/errors";
import { downloadOrderInvoicePdf } from "@/utils/invoice";
import { PaginationBar } from "@/components/PaginationBar";

const SALES_STATUS_OPTIONS: SalesStatus[] = ["Pendiente", "Confirmada", "Cancelada"];
const PAYMENT_STATUS_OPTIONS: PaymentStatus[] = ["Pendiente", "Parcial", "Pagado"];
const DELIVERY_STATUS_OPTIONS: DeliveryStatus[] = ["Pendiente", "Preparando", "Entregada"];
const MOVEMENTS_PREVIEW_LIMIT = 8;

function getClientName(client: string | { _id: string; name?: string; phone?: string }) {
  if (typeof client === "object" && client) return client.name || "Cliente desconocido";
  return "Cliente desconocido";
}

function getClientPhone(client: string | { _id: string; name?: string; phone?: string }) {
  if (typeof client === "object" && client) return client.phone || "Sin teléfono";
  return client || "Sin teléfono";
}

function normalizeText(value?: string | null) {
  return (value || "").trim().toLowerCase();
}

function getCommercialStatus(order: Order): SalesStatus {
  const rawStatus = order.salesStatus || order.status;
  const normalized = normalizeText(rawStatus);
  if (normalized === "confirmada") return "Confirmada";
  if (normalized === "cancelada") return "Cancelada";
  return "Pendiente";
}

const STATUS_COLORS: Record<string, string> = {
  Confirmada: "bg-primary/15 text-primary",
  Cancelada: "bg-danger/15 text-danger",
  Pendiente: "bg-default/40 text-default-600",
  Pagado: "bg-success/15 text-success",
  Parcial: "bg-warning/15 text-warning",
  Entregada: "bg-success/15 text-success",
  Preparando: "bg-primary/15 text-primary",
};

function StatusBadge({ label }: { label: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ${STATUS_COLORS[label] ?? "bg-default/40 text-default-600"}`}>
      {label}
    </span>
  );
}

// ── Detail panel content ──────────────────────────────────────────────

function DetailPanel({
  orderId,
  currency,
  settings,
  isDesktop,
  onBack,
  onClose,
}: {
  orderId: string;
  currency: string;
  settings: ReturnType<typeof useSettings>["settings"];
  isDesktop: boolean;
  onBack: () => void;
  onClose?: () => void;
}) {
  const { showToast } = useAppToast();
  const { updateOrder, isUpdating } = useOrders({ enabled: false });
  const {
    order: selectedOrder,
    movements,
    loading: detailLoading,
    error: detailError,
    refetch: refetchOrderDetail,
  } = useOrderDetail(orderId);

  const [notesDraft, setNotesDraft] = useState("");
  const [salesStatusDraft, setSalesStatusDraft] = useState<SalesStatus>("Pendiente");
  const [paymentStatusDraft, setPaymentStatusDraft] = useState<PaymentStatus>("Pendiente");
  const [deliveryStatusDraft, setDeliveryStatusDraft] = useState<DeliveryStatus>("Pendiente");
  const [showAllMovements, setShowAllMovements] = useState(false);

  const movementSummary = useMemo(
    () => movements.reduce((acc, m) => { acc[m.type] = (acc[m.type] || 0) + 1; return acc; }, {} as Record<string, number>),
    [movements],
  );
  const visibleMovements = showAllMovements ? movements : movements.slice(0, MOVEMENTS_PREVIEW_LIMIT);

  useEffect(() => {
    if (selectedOrder) {
      setSalesStatusDraft(selectedOrder.salesStatus || "Pendiente");
      setPaymentStatusDraft(selectedOrder.paymentStatus || "Pendiente");
      setDeliveryStatusDraft(selectedOrder.deliveryStatus || "Pendiente");
      setNotesDraft(selectedOrder.notes || "");
    }
    setShowAllMovements(false);
  }, [selectedOrder, orderId]);

  const handleSave = async () => {
    try {
      await updateOrder({ id: orderId, orderData: { salesStatus: salesStatusDraft, paymentStatus: paymentStatusDraft, deliveryStatus: deliveryStatusDraft, notes: notesDraft } });
      showToast({ variant: "success", message: "Venta actualizada." });
    } catch (error) {
      showToast({ variant: "error", message: getErrorMessage(error, "No se pudo actualizar.") });
    }
  };

  const handleDownloadInvoice = () => {
    if (!selectedOrder) return;
    const clientTaxId = typeof selectedOrder.client === "object" ? selectedOrder.client?.taxId : "";
    if (!settings?.taxId || !settings?.fiscalCondition) {
      showToast({ variant: "warning", message: "Completá CUIT y condición fiscal en Ajustes antes de generar la factura." });
      return;
    }
    if (!clientTaxId) {
      showToast({ variant: "warning", message: "El cliente no tiene documento fiscal." });
      return;
    }
    try {
      downloadOrderInvoicePdf({ order: selectedOrder, settings });
      showToast({ variant: "success", message: "Factura descargada." });
    } catch (error) {
      showToast({ variant: "error", message: getErrorMessage(error, "No se pudo descargar.") });
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Panel header */}
      <div className={`shrink-0 border-b border-white/10 px-6 py-4 ${isDesktop ? "bg-background/60 backdrop-blur-sm" : "bg-background"}`}>
        {!isDesktop && (
          <button className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-default-500" onClick={onBack}>
            <ArrowLeft size={14} /> Volver a ventas
          </button>
        )}
        {isDesktop && (
          <div className="mb-3 flex justify-end">
            <button
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-default-400 transition hover:text-foreground"
              onClick={onClose}
            >
              <X size={15} />
            </button>
          </div>
        )}
        {detailLoading && !selectedOrder ? (
          <div className="flex items-center gap-2 text-default-400">
            <Loader2 className="animate-spin" size={16} />
            <span className="text-sm">Cargando...</span>
          </div>
        ) : (
          <>
            <p className="text-[11px] font-bold uppercase tracking-widest text-default-400">Detalle de venta</p>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-foreground">
              {selectedOrder?.orderNumber || `Pedido #${orderId.slice(-6)}`}
            </h2>
            {selectedOrder && (
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                <StatusBadge label={selectedOrder.salesStatus || "Pendiente"} />
                <StatusBadge label={selectedOrder.paymentStatus || "Pendiente"} />
                <StatusBadge label={selectedOrder.deliveryStatus || "Pendiente"} />
              </div>
            )}
          </>
        )}
      </div>

      {/* Panel body */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {detailLoading && !selectedOrder ? (
          <div className="flex flex-col items-center justify-center py-20 text-default-400">
            <Loader2 className="animate-spin mb-3" size={28} />
            <p className="text-sm">Cargando detalle de la venta...</p>
          </div>
        ) : detailError && !selectedOrder ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-sm font-semibold text-danger">No se pudo cargar la venta</p>
            <p className="mt-1 text-xs text-default-500">{detailError}</p>
            <button className="mt-4 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white" onClick={() => void refetchOrderDetail()}>
              Reintentar
            </button>
          </div>
        ) : !selectedOrder ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-default-400">
            <ReceiptText size={32} className="mb-3" />
            <p className="text-sm">La venta no está disponible</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Client + amount */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/8 bg-content2/50 p-4">
                <p className="section-kicker">Cliente</p>
                <p className="mt-2 font-semibold text-foreground">{getClientName(selectedOrder.client)}</p>
                <p className="mt-0.5 text-xs text-default-400">{getClientPhone(selectedOrder.client)}</p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-content2/50 p-4">
                <p className="section-kicker">Importe</p>
                <p className="mt-2 text-xl font-bold tracking-tight text-foreground">
                  {formatCurrency(Number(selectedOrder.totalAmount || 0), currency)}
                </p>
                <p className="mt-0.5 text-xs text-default-400">{selectedOrder.items.length} ítem(s)</p>
              </div>
            </div>

            {/* Status selectors */}
            <div className="rounded-2xl border border-white/8 bg-content2/50 p-4">
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-default-400">Actualizar estados</p>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <div className="mb-1.5 flex items-center gap-1.5 text-primary">
                    <ClipboardCheck size={13} />
                    <span className="text-[11px] font-semibold uppercase tracking-wider">Comercial</span>
                  </div>
                  <Select
                    aria-label="Estado comercial"
                    classNames={{ trigger: "corp-input min-h-[40px] rounded-xl px-3 text-sm text-foreground", value: "text-foreground", popoverContent: "bg-content1 text-foreground" }}
                    selectedKeys={[salesStatusDraft]}
                    variant="bordered"
                    onSelectionChange={(keys) => setSalesStatusDraft(Array.from(keys)[0] as SalesStatus)}
                  >
                    {SALES_STATUS_OPTIONS.map((s) => <SelectItem key={s}>{s}</SelectItem>)}
                  </Select>
                </div>
                <div>
                  <div className="mb-1.5 flex items-center gap-1.5 text-success">
                    <CircleDollarSign size={13} />
                    <span className="text-[11px] font-semibold uppercase tracking-wider">Pago</span>
                  </div>
                  <Select
                    aria-label="Estado de pago"
                    classNames={{ trigger: "corp-input min-h-[40px] rounded-xl px-3 text-sm text-foreground", value: "text-foreground", popoverContent: "bg-content1 text-foreground" }}
                    selectedKeys={[paymentStatusDraft]}
                    variant="bordered"
                    onSelectionChange={(keys) => setPaymentStatusDraft(Array.from(keys)[0] as PaymentStatus)}
                  >
                    {PAYMENT_STATUS_OPTIONS.map((s) => <SelectItem key={s}>{s}</SelectItem>)}
                  </Select>
                </div>
                <div>
                  <div className="mb-1.5 flex items-center gap-1.5 text-warning">
                    <PackageCheck size={13} />
                    <span className="text-[11px] font-semibold uppercase tracking-wider">Entrega</span>
                  </div>
                  <Select
                    aria-label="Estado de entrega"
                    classNames={{ trigger: "corp-input min-h-[40px] rounded-xl px-3 text-sm text-foreground", value: "text-foreground", popoverContent: "bg-content1 text-foreground" }}
                    selectedKeys={[deliveryStatusDraft]}
                    variant="bordered"
                    onSelectionChange={(keys) => setDeliveryStatusDraft(Array.from(keys)[0] as DeliveryStatus)}
                  >
                    {DELIVERY_STATUS_OPTIONS.map((s) => <SelectItem key={s}>{s}</SelectItem>)}
                  </Select>
                </div>
              </div>
            </div>

            {/* Items */}
            <div className="rounded-2xl border border-white/8 bg-content2/50 p-4">
              <p className="mb-3 text-sm font-bold text-foreground">Items del pedido</p>
              <div className="space-y-2">
                {selectedOrder.items.map((item, i) => (
                  <div key={`${item.product}-${i}`} className="flex items-center justify-between rounded-xl bg-content2/60 px-3 py-2.5">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{item.product}</p>
                      <p className="text-xs text-default-400">{item.quantity} × {formatCurrency(Number(item.price || 0), currency)}</p>
                    </div>
                    <p className="text-sm font-bold text-foreground">
                      {formatCurrency(Number(item.quantity || 0) * Number(item.price || 0), currency)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="rounded-2xl border border-white/8 bg-content2/50 p-4">
              <p className="mb-2 text-sm font-bold text-foreground">Notas</p>
              <textarea
                className="corp-input min-h-20 w-full rounded-xl px-3 py-2.5 text-sm"
                placeholder="Observaciones internas..."
                value={notesDraft}
                onChange={(e) => setNotesDraft(e.target.value)}
              />
            </div>

            {/* Movements */}
            <div className="rounded-2xl border border-white/8 bg-content2/50 p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-bold text-foreground">Movimientos de stock</p>
                <span className="text-xs text-default-400">{movements.length} registros</span>
              </div>
              {movements.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-1.5">
                  {Object.entries(movementSummary).map(([type, count]) => (
                    <span key={type} className="rounded-full bg-content2/70 px-2.5 py-0.5 text-[11px] font-semibold text-default-500">
                      {type}: {count}
                    </span>
                  ))}
                </div>
              )}
              <div className="space-y-2">
                {movements.length > 0 ? visibleMovements.map((m) => (
                  <div key={m._id} className="flex items-center justify-between rounded-xl bg-content2/60 px-3 py-2.5">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{m.product?.name || "Movimiento"}</p>
                      <p className="text-xs text-default-400">{m.reason || m.type}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-foreground">{m.type} {m.quantity}</p>
                      <p className="text-xs text-default-400">{new Date(m.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                )) : (
                  <p className="text-sm text-default-500">Sin movimientos de stock.</p>
                )}
              </div>
              {movements.length > MOVEMENTS_PREVIEW_LIMIT && (
                <button
                  className="mt-3 w-full rounded-xl border border-white/10 py-2 text-xs font-semibold text-default-500 hover:bg-content2/40 transition"
                  onClick={() => setShowAllMovements((p) => !p)}
                >
                  {showAllMovements ? "Ver menos" : `Ver todos (${movements.length})`}
                </button>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pb-2">
              <button
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-content2/50 py-3 text-sm font-semibold text-default-600 hover:bg-content2 transition"
                onClick={handleDownloadInvoice}
              >
                <FileDown size={16} /> Descargar factura
              </button>
              <button
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-white disabled:opacity-50 hover:bg-primary/90 transition"
                disabled={isUpdating}
                onClick={handleSave}
              >
                {isUpdating && <Loader2 className="animate-spin" size={16} />}
                Guardar estados
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

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

  const safeOrders = useMemo(
    () => orders.filter((o): o is NonNullable<typeof o> => Boolean(o && typeof o === "object" && o._id)),
    [orders],
  );

  const filteredOrders = useMemo(() => {
    let result = safeOrders;
    if (activeFilter !== "all") result = result.filter((o) => getCommercialStatus(o) === activeFilter);
    if (searchQuery) result = result.filter((o) => getClientName(o.client).toLowerCase().includes(searchQuery.toLowerCase()) || o._id.toLowerCase().includes(searchQuery.toLowerCase()));
    return result;
  }, [safeOrders, searchQuery, activeFilter]);

  useEffect(() => {
    setDesktopPage(1);
  }, [searchQuery, activeFilter]);

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

  const statuses = useMemo(
    () => SALES_STATUS_OPTIONS.filter((s) => safeOrders.some((o) => getCommercialStatus(o) === s)),
    [safeOrders],
  );

  const totalSales = useMemo(() => safeOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0), [safeOrders]);

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
        <DetailPanel
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
    <div className={`flex flex-col ${isDesktop ? "h-full" : "min-h-screen pb-24"}`}>
      {/* Header */}
      <div className={`shrink-0 page-header ${isHeaderCompact ? "py-3" : ""}`}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="page-title">Ventas</h1>
            {!isHeaderCompact && <p className="page-subtitle">Seguimiento de operaciones y estados</p>}
          </div>
          <Link
            className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/25 hover:bg-primary/90 transition"
            to="/new-operation"
          >
            <Plus size={15} /> Nueva venta
          </Link>
        </div>

        {/* KPI mini */}
        {!isHeaderCompact && (
          <div className={`mt-4 grid gap-3 ${isDesktop ? "grid-cols-4" : "grid-cols-2"}`}>
            <div className="stat-card !p-4">
              <p className="stat-card-label">Operaciones</p>
              <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">{total || safeOrders.length}</p>
            </div>
            <div className="stat-card !p-4">
              <p className="stat-card-label">Facturado</p>
              <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">{formatCompactCurrency(totalSales, currency)}</p>
            </div>
            {isDesktop && (
              <>
                <div className="stat-card !p-4">
                  <p className="stat-card-label">Confirmadas</p>
                  <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">
                    {safeOrders.filter((o) => getCommercialStatus(o) === "Confirmada").length}
                  </p>
                </div>
                <div className="stat-card !p-4">
                  <p className="stat-card-label">Pagadas</p>
                  <p className={`mt-2 text-2xl font-bold tracking-tight ${safeOrders.filter((o) => o.paymentStatus === "Pagado").length > 0 ? "text-success" : "text-foreground"}`}>
                    {safeOrders.filter((o) => o.paymentStatus === "Pagado").length}
                  </p>
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
            <button className="text-default-400 hover:text-foreground" onClick={() => setSearchQuery("")}>×</button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="shrink-0 flex gap-2 overflow-x-auto no-scrollbar px-4 py-3 lg:px-5">
        {(["all", ...statuses] as ("all" | SalesStatus)[]).map((f) => (
          <button
            key={f}
            className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-bold transition ${activeFilter === f ? "bg-primary text-white shadow-md shadow-primary/30" : "bg-content2/60 text-default-500 hover:bg-content2"}`}
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
          <div className="space-y-2 pb-4">
            {(isDesktop ? desktopItems : filteredOrders).map((order) => {
              const isSelected = order._id === orderId;
              return (
                <button
                  key={order._id}
                  className={`w-full rounded-2xl border px-4 py-3.5 text-left transition-all ${
                    isSelected
                      ? "border-primary/30 bg-primary/8 shadow-sm shadow-primary/10"
                      : "border-white/6 bg-content2/40 hover:border-primary/20 hover:bg-primary/5"
                  }`}
                  onClick={() => navigate(`/sales/${order._id}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${isSelected ? "bg-primary/20 text-primary" : "bg-content2 text-default-400"}`}>
                      <ReceiptText size={15} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">{getClientName(order.client)}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-[11px] text-default-400">{order.orderNumber || `#${order._id.slice(-6)}`}</span>
                        <span className="text-[11px] text-default-400">·</span>
                        <span className="text-[11px] text-default-400">{new Date(order.createdAt).toLocaleDateString()}</span>
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
                      {isDesktop && <p className="text-[10px] uppercase tracking-wide text-default-400">Importe</p>}
                      <p className="text-sm font-bold text-foreground">{formatCompactCurrency(Number(order.totalAmount || 0), currency)}</p>
                    </div>
                    {isDesktop && <ChevronRight size={14} className={`shrink-0 ${isSelected ? "text-primary" : "text-default-300"}`} />}
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

      {/* Mobile FAB */}
      {!isDesktop && (
        <Button
          isIconOnly
          as={Link}
          className="fixed bottom-[100px] right-6 z-10 rounded-full shadow-lg shadow-primary/35 lg:hidden"
          color="primary"
          size="lg"
          to="/new-operation"
        >
          <Plus size={24} />
        </Button>
      )}
    </div>
  );

  // ── Desktop slide-over layout ─────────────────────────────────────────
  if (isDesktop) {
    return (
      <div className="h-screen overflow-hidden">
        <div className="h-full overflow-y-auto">
          {ListPanel}
        </div>
        <div
          className={`fixed inset-0 z-40 transition-all duration-300 ${orderId ? "bg-black/30 backdrop-blur-[2px]" : "pointer-events-none opacity-0"}`}
          onClick={() => navigate("/sales")}
        />
        <div
          className={`fixed right-0 top-0 z-50 h-screen w-[min(700px,58vw)] overflow-y-auto border-l border-white/10 shadow-[-24px_0_60px_rgba(10,22,44,0.28)] transition-transform duration-300 ease-in-out ${orderId ? "translate-x-0" : "translate-x-full"}`}
          style={{ background: "color-mix(in srgb, var(--heroui-content1) 98%, transparent)" }}
        >
          {orderId && (
            <DetailPanel
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
