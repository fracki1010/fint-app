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
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@heroui/button";
import { Select, SelectItem } from "@heroui/select";

import {
  DeliveryStatus,
  PaymentStatus,
  SalesStatus,
  useInfiniteOrders,
  useOrderDetail,
  useOrders,
} from "@/hooks/useOrders";
import { useMobileHeaderCompact } from "@/hooks/useMobileHeaderCompact";
import { useSettings } from "@/hooks/useSettings";
import { useAppToast } from "@/components/AppToast";
import { formatCompactCurrency, formatCurrency } from "@/utils/currency";
import { getErrorMessage } from "@/utils/errors";
import { downloadOrderInvoicePdf } from "@/utils/invoice";

const SALES_STATUS_OPTIONS: SalesStatus[] = [
  "Pendiente",
  "Confirmada",
  "Cancelada",
];
const PAYMENT_STATUS_OPTIONS: PaymentStatus[] = [
  "Pendiente",
  "Parcial",
  "Pagado",
];
const DELIVERY_STATUS_OPTIONS: DeliveryStatus[] = [
  "Pendiente",
  "Preparando",
  "Entregada",
];
const MOVEMENTS_PREVIEW_LIMIT = 8;

function getClientName(
  client: string | { _id: string; name?: string; phone?: string },
) {
  if (typeof client === "object" && client) {
    return client.name || "Cliente desconocido";
  }

  return "Cliente desconocido";
}

function getClientPhone(
  client: string | { _id: string; name?: string; phone?: string },
) {
  if (typeof client === "object" && client) {
    return client.phone || "Sin telefono";
  }

  return client || "Sin telefono";
}

export default function SalesPage() {
  const navigate = useNavigate();
  const { orderId } = useParams<{ orderId?: string }>();
  const isHeaderCompact = useMobileHeaderCompact();
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const {
    orders,
    total,
    loading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteOrders(20);
  const { updateOrder, isUpdating } = useOrders({ enabled: false });
  const { settings } = useSettings();
  const { showToast } = useAppToast();
  const currency = settings?.currency || "USD";

  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [notesDraft, setNotesDraft] = useState("");
  const [salesStatusDraft, setSalesStatusDraft] =
    useState<SalesStatus>("Pendiente");
  const [paymentStatusDraft, setPaymentStatusDraft] =
    useState<PaymentStatus>("Pendiente");
  const [deliveryStatusDraft, setDeliveryStatusDraft] =
    useState<DeliveryStatus>("Pendiente");
  const [showAllMovements, setShowAllMovements] = useState(false);

  const {
    order: selectedOrder,
    movements,
    loading: detailLoading,
    error: detailError,
    refetch: refetchOrderDetail,
  } = useOrderDetail(orderId);

  const safeOrders = useMemo(
    () =>
      orders.filter((order): order is NonNullable<typeof order> =>
        Boolean(order && typeof order === "object" && order._id),
      ),
    [orders],
  );

  const selectedOrderFromList = useMemo(
    () => safeOrders.find((order) => order._id === orderId) || null,
    [safeOrders, orderId],
  );

  const displayOrder = selectedOrder || selectedOrderFromList;
  const movementSummary = useMemo(
    () =>
      movements.reduce(
        (acc, movement) => {
          acc[movement.type] = (acc[movement.type] || 0) + 1;

          return acc;
        },
        {} as Record<string, number>,
      ),
    [movements],
  );
  const visibleMovements = showAllMovements
    ? movements
    : movements.slice(0, MOVEMENTS_PREVIEW_LIMIT);

  const filteredOrders = useMemo(() => {
    let result = safeOrders;

    if (activeFilter !== "all") {
      result = result.filter(
        (o) =>
          o.status?.toLowerCase() === activeFilter.toLowerCase() ||
          o.deliveryStatus?.toLowerCase() === activeFilter.toLowerCase() ||
          o.paymentStatus?.toLowerCase() === activeFilter.toLowerCase(),
      );
    }

    if (searchQuery) {
      result = result.filter(
        (o) =>
          getClientName(o.client)
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          o._id.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    return result;
  }, [safeOrders, searchQuery, activeFilter]);

  const statuses = useMemo(() => {
    const stats = new Set(
      safeOrders
        .flatMap((o) => [o.status, o.paymentStatus, o.deliveryStatus])
        .filter(Boolean),
    );

    return Array.from(stats);
  }, [safeOrders]);

  const totalSales = useMemo(
    () => safeOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0),
    [safeOrders],
  );

  useEffect(() => {
    const target = loadMoreRef.current;

    if (!target || !hasNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "240px 0px" },
    );

    observer.observe(target);

    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, filteredOrders.length]);

  useEffect(() => {
    if (displayOrder) {
      setSalesStatusDraft(displayOrder.salesStatus || "Pendiente");
      setPaymentStatusDraft(displayOrder.paymentStatus || "Pendiente");
      setDeliveryStatusDraft(displayOrder.deliveryStatus || "Pendiente");
      setNotesDraft(displayOrder.notes || "");
    }
  }, [displayOrder]);

  useEffect(() => {
    setShowAllMovements(false);
  }, [orderId]);

  const handleSaveOrder = async () => {
    if (!orderId) return;

    try {
      await updateOrder({
        id: orderId,
        orderData: {
          salesStatus: salesStatusDraft,
          paymentStatus: paymentStatusDraft,
          deliveryStatus: deliveryStatusDraft,
          notes: notesDraft,
        },
      });
      showToast({
        variant: "success",
        message: "Venta actualizada correctamente.",
      });
    } catch (error) {
      showToast({
        variant: "error",
        message: getErrorMessage(error, "No se pudo actualizar la venta."),
      });
    }
  };

  const handleDownloadInvoice = () => {
    if (!displayOrder) return;
    const clientTaxId =
      typeof displayOrder.client === "object" ? displayOrder.client?.taxId : "";

    if (!settings?.taxId || !settings?.fiscalCondition) {
      showToast({
        variant: "warning",
        message:
          "Completa CUIT/NIT y condicion fiscal en Configuracion > Empresa antes de generar la factura.",
      });

      return;
    }

    if (!clientTaxId) {
      showToast({
        variant: "warning",
        message:
          "El cliente no tiene documento fiscal. Edita la ficha del cliente para continuar.",
      });

      return;
    }

    try {
      downloadOrderInvoicePdf({ order: displayOrder, settings });
      showToast({
        variant: "success",
        message: "Factura descargada correctamente.",
      });
    } catch (error) {
      showToast({
        variant: "error",
        message: getErrorMessage(error, "No se pudo descargar la factura."),
      });
    }
  };

  if (orderId) {
    return (
      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col bg-background pb-24 font-sans lg:max-w-none lg:pb-8">
        <header
          className={`app-topbar sticky top-0 z-30 border-b border-divider/60 bg-background/95 backdrop-blur-xl transition-all duration-300 ${
            isHeaderCompact ? "px-4 pb-3 pt-3" : "px-6 pb-4 pt-6"
          }`}
        >
          <button
            className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.14em] text-default-500"
            onClick={() => navigate("/sales")}
          >
            <ReceiptText className="rotate-180" size={14} />
            Volver
          </button>
          <p
            className={`section-kicker transition-all duration-200 ${
              isHeaderCompact
                ? "mt-1 text-[10px] opacity-80"
                : "mt-3 opacity-100"
            }`}
          >
            Detalle de Venta
          </p>
          <h1
            className={`font-semibold tracking-[-0.03em] text-foreground transition-all duration-300 ${
              isHeaderCompact ? "mt-1 text-xl" : "mt-2 text-[28px]"
            }`}
          >
            {displayOrder?.orderNumber || `Pedido #${orderId.slice(-6)}`}
          </h1>
        </header>

        <div className="flex-1 px-6 pb-6">
          {detailLoading ? (
            <div className="py-16 text-center text-default-400">
              <Loader2 className="mx-auto mb-3 animate-spin" size={32} />
              <p className="text-sm">Cargando detalle de la venta...</p>
            </div>
          ) : detailError && !displayOrder ? (
            <div className="py-12 text-center">
              <p className="text-sm font-semibold text-danger">
                No se pudo cargar la venta
              </p>
              <p className="mt-2 text-xs text-default-500">{detailError}</p>
              <button
                className="mt-4 rounded-2xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
                type="button"
                onClick={() => void refetchOrderDetail()}
              >
                Reintentar detalle
              </button>
            </div>
          ) : !displayOrder ? (
            <div className="py-12 text-center">
              <p className="text-sm font-semibold text-foreground">
                La venta no esta disponible
              </p>
            </div>
          ) : (
            <>
              {detailError && (
                <div className="mt-4 rounded-2xl border border-warning/30 bg-warning/10 p-3 text-xs text-warning">
                  Mostrando datos base de la lista. El detalle completo no pudo
                  actualizarse.
                </div>
              )}
              <div className="mt-1 grid grid-cols-2 gap-4">
                <div className="app-panel-soft rounded-[24px] p-4">
                  <p className="section-kicker">Cliente</p>
                  <p className="mt-3 text-lg font-semibold text-foreground">
                    {getClientName(displayOrder.client)}
                  </p>
                  <p className="mt-1 text-sm text-default-500">
                    {getClientPhone(displayOrder.client)}
                  </p>
                </div>
                <div className="app-panel-soft rounded-[24px] p-4">
                  <p className="section-kicker">Importe</p>
                  <p className="mt-3 text-2xl font-semibold text-foreground">
                    {formatCompactCurrency(
                      Number(displayOrder.totalAmount || 0),
                      currency,
                    )}
                  </p>
                  <p className="mt-1 text-sm text-default-500">
                    {displayOrder.items.length} item(s)
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <div className="app-panel-soft rounded-[24px] p-4">
                  <div className="mb-3 flex items-center gap-2 text-primary">
                    <ClipboardCheck size={16} />
                    <span className="text-xs font-semibold uppercase tracking-[0.16em]">
                      Comercial
                    </span>
                  </div>
                  <Select
                    aria-label="Estado comercial"
                    classNames={{
                      trigger:
                        "corp-input min-h-[46px] rounded-2xl px-4 text-sm text-foreground",
                      value: "text-foreground",
                      popoverContent: "bg-content1 text-foreground",
                    }}
                    selectedKeys={[salesStatusDraft]}
                    variant="bordered"
                    onSelectionChange={(keys) =>
                      setSalesStatusDraft(Array.from(keys)[0] as SalesStatus)
                    }
                  >
                    {SALES_STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status}>{status}</SelectItem>
                    ))}
                  </Select>
                </div>

                <div className="app-panel-soft rounded-[24px] p-4">
                  <div className="mb-3 flex items-center gap-2 text-primary">
                    <CircleDollarSign size={16} />
                    <span className="text-xs font-semibold uppercase tracking-[0.16em]">
                      Pago
                    </span>
                  </div>
                  <Select
                    aria-label="Estado de pago"
                    classNames={{
                      trigger:
                        "corp-input min-h-[46px] rounded-2xl px-4 text-sm text-foreground",
                      value: "text-foreground",
                      popoverContent: "bg-content1 text-foreground",
                    }}
                    selectedKeys={[paymentStatusDraft]}
                    variant="bordered"
                    onSelectionChange={(keys) =>
                      setPaymentStatusDraft(
                        Array.from(keys)[0] as PaymentStatus,
                      )
                    }
                  >
                    {PAYMENT_STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status}>{status}</SelectItem>
                    ))}
                  </Select>
                </div>

                <div className="app-panel-soft rounded-[24px] p-4">
                  <div className="mb-3 flex items-center gap-2 text-primary">
                    <PackageCheck size={16} />
                    <span className="text-xs font-semibold uppercase tracking-[0.16em]">
                      Entrega
                    </span>
                  </div>
                  <Select
                    aria-label="Estado de entrega"
                    classNames={{
                      trigger:
                        "corp-input min-h-[46px] rounded-2xl px-4 text-sm text-foreground",
                      value: "text-foreground",
                      popoverContent: "bg-content1 text-foreground",
                    }}
                    selectedKeys={[deliveryStatusDraft]}
                    variant="bordered"
                    onSelectionChange={(keys) =>
                      setDeliveryStatusDraft(
                        Array.from(keys)[0] as DeliveryStatus,
                      )
                    }
                  >
                    {DELIVERY_STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status}>{status}</SelectItem>
                    ))}
                  </Select>
                </div>
              </div>

              <div className="mt-5 app-panel-soft rounded-[24px] p-5">
                <h3 className="text-sm font-semibold text-foreground">Items</h3>
                <div className="mt-4 space-y-3">
                  {displayOrder.items.map((item, index) => (
                    <div
                      key={`${item.product}-${index}`}
                      className="flex items-center justify-between rounded-2xl bg-content2/55 px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {item.product}
                        </p>
                        <p className="mt-1 text-xs text-default-500">
                          {item.quantity} x{" "}
                          {formatCurrency(Number(item.price || 0), currency)}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-foreground">
                        {formatCurrency(
                          Number(item.quantity || 0) * Number(item.price || 0),
                          currency,
                        )}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5 app-panel-soft rounded-[24px] p-5">
                <h3 className="text-sm font-semibold text-foreground">Notas</h3>
                <textarea
                  className="corp-input mt-3 min-h-24 w-full rounded-2xl px-4 py-3 text-sm"
                  placeholder="Observaciones internas de la venta..."
                  value={notesDraft}
                  onChange={(e) => setNotesDraft(e.target.value)}
                />
              </div>

              <div className="mt-5 app-panel-soft rounded-[24px] p-5">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">
                    Movimientos asociados
                  </h3>
                  <span className="text-xs text-default-400">
                    {movements.length} registros
                  </span>
                </div>
                {movements.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {Object.entries(movementSummary).map(([type, count]) => (
                      <span
                        key={type}
                        className="rounded-full bg-content2/70 px-3 py-1 text-[11px] font-semibold text-default-600"
                      >
                        {type}: {count}
                      </span>
                    ))}
                  </div>
                )}

                <div className="max-h-[46vh] space-y-3 overflow-y-auto pr-1">
                  {movements.length > 0 ? (
                    visibleMovements.map((movement) => (
                      <div
                        key={movement._id}
                        className="rounded-2xl bg-content2/55 px-4 py-3"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-sm font-semibold text-foreground">
                              {movement.product?.name || "Movimiento"}
                            </p>
                            <p className="mt-1 text-xs text-default-500">
                              {movement.reason || movement.type}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-foreground">
                              {movement.type} {movement.quantity}
                            </p>
                            <p className="mt-1 text-xs text-default-500">
                              {new Date(movement.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-default-500">
                      Aun no hay movimientos de stock para esta venta.
                    </p>
                  )}
                </div>
                {movements.length > MOVEMENTS_PREVIEW_LIMIT && (
                  <button
                    className="mt-4 w-full rounded-2xl border border-divider/70 px-4 py-2.5 text-xs font-semibold text-default-600 transition hover:bg-content2/60"
                    type="button"
                    onClick={() => setShowAllMovements((prev) => !prev)}
                  >
                    {showAllMovements
                      ? "Ver menos movimientos"
                      : `Ver todos (${movements.length})`}
                  </button>
                )}
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  className="app-panel-soft flex-1 rounded-2xl px-4 py-3 text-sm font-semibold text-default-700"
                  type="button"
                  onClick={handleDownloadInvoice}
                >
                  <span className="flex items-center justify-center gap-2">
                    <FileDown size={18} />
                    Descargar factura
                  </span>
                </button>
                <button
                  className="flex-1 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                  disabled={isUpdating}
                  type="button"
                  onClick={handleSaveOrder}
                >
                  <span className="flex items-center justify-center gap-2">
                    {isUpdating && (
                      <Loader2 className="animate-spin" size={18} />
                    )}
                    Guardar estados
                  </span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col overflow-hidden bg-background pb-24 font-sans lg:max-w-none lg:px-6 lg:pb-8">
      <header className="app-topbar px-6 pt-6 pb-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="section-kicker">Ventas</div>
            <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.03em] text-foreground">
              Libro Comercial
            </h1>
            <p className="mt-2 text-sm text-default-500">
              Seguimiento de operaciones, estados y monto transaccionado.
            </p>
          </div>
          <Link
            className="hidden rounded-2xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-[0_16px_34px_rgba(88,176,156,0.35)] lg:inline-flex lg:items-center lg:gap-2"
            to="/new-operation"
          >
            <Plus size={16} />
            Nueva venta
          </Link>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="app-panel rounded-[24px] p-4">
            <p className="section-kicker">Operaciones</p>
            <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-foreground">
              {total || safeOrders.length}
            </p>
          </div>
          <div className="app-panel rounded-[24px] p-4">
            <p className="section-kicker">Facturado</p>
            <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-foreground">
              {formatCompactCurrency(totalSales, currency)}
            </p>
          </div>
        </div>

        <div className="relative mt-4">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-default-400"
            size={18}
          />
          <input
            className="corp-input w-full rounded-2xl py-3.5 pl-11 pr-4 text-sm text-foreground"
            placeholder="Buscar por cliente o ID..."
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </header>

      <div className="px-6 py-5">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          <Button
            className="rounded-full"
            color={activeFilter === "all" ? "primary" : "default"}
            size="sm"
            variant={activeFilter === "all" ? "solid" : "flat"}
            onClick={() => setActiveFilter("all")}
          >
            Todas
          </Button>
          {statuses.map((status) => (
            <Button
              key={status}
              className="rounded-full"
              color={activeFilter === status ? "primary" : "default"}
              size="sm"
              variant={activeFilter === status ? "solid" : "flat"}
              onClick={() => setActiveFilter(status)}
            >
              {status}
            </Button>
          ))}
        </div>
      </div>

      <main className="flex-1 px-6">
        {loading && safeOrders.length === 0 ? (
          <div className="app-panel rounded-[24px] py-12 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error && safeOrders.length === 0 ? (
          <div className="app-panel rounded-[24px] p-6 text-center">
            <h3 className="text-lg font-semibold text-foreground">
              No pudimos cargar las ventas
            </h3>
            <p className="mx-auto mt-2 max-w-xs text-sm text-default-500">
              {error}
            </p>
            <button
              className="mt-5 rounded-2xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
              type="button"
              onClick={() => void refetch()}
            >
              Reintentar
            </button>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="app-panel rounded-[24px] py-12 text-center">
            <ShoppingCart className="mx-auto mb-4 h-16 w-16 text-default-400" />
            <h3 className="text-lg font-semibold text-foreground">
              No hay ventas para mostrar
            </h3>
            <p className="mx-auto mt-2 max-w-xs text-sm text-default-500">
              {searchQuery || activeFilter !== "all"
                ? "No se encontraron ventas con los filtros aplicados."
                : "Aun no se registraron operaciones comerciales."}
            </p>
            <Link
              className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 font-semibold text-primary-foreground transition hover:opacity-90"
              to="/new-operation"
            >
              <Plus size={18} />
              Crear venta
            </Link>
          </div>
        ) : (
          <div className="space-y-3 pb-4">
            {error && (
              <div className="rounded-2xl border border-warning/30 bg-warning/10 p-3 text-xs text-warning">
                Mostrando datos disponibles. Hubo un error al actualizar en
                segundo plano.
              </div>
            )}
            <div className="hidden lg:block">
              <div className="app-panel overflow-x-auto rounded-[24px] p-2">
                <table className="w-full min-w-[980px]">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-[0.16em] text-default-500">
                      <th className="px-3 pb-3 pt-2">Pedido</th>
                      <th className="px-3 pb-3 pt-2">Cliente</th>
                      <th className="px-3 pb-3 pt-2">Fecha</th>
                      <th className="px-3 pb-3 pt-2">Comercial</th>
                      <th className="px-3 pb-3 pt-2">Pago</th>
                      <th className="px-3 pb-3 pt-2">Entrega</th>
                      <th className="px-3 pb-3 pt-2 text-right">Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order) => (
                      <tr
                        key={order._id}
                        className="cursor-pointer border-t border-divider/60"
                        onClick={() => navigate(`/sales/${order._id}`)}
                      >
                        <td className="px-3 py-3 text-sm font-semibold text-foreground">
                          {order.orderNumber || `Pedido #${order._id.slice(-6)}`}
                        </td>
                        <td className="px-3 py-3 text-sm text-default-600">
                          {getClientName(order.client)}
                        </td>
                        <td className="px-3 py-3 text-sm text-default-500">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-3 py-3 text-sm text-default-500">
                          {order.status}
                        </td>
                        <td className="px-3 py-3 text-sm text-default-500">
                          {order.paymentStatus}
                        </td>
                        <td className="px-3 py-3 text-sm text-default-500">
                          {order.deliveryStatus}
                        </td>
                        <td className="px-3 py-3 text-right text-sm font-semibold text-foreground">
                          {formatCompactCurrency(
                            Number(order.totalAmount || 0),
                            currency,
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-3 lg:hidden">
              {filteredOrders.map((order) => (
                <button
                  key={order._id}
                  className="app-panel w-full rounded-[24px] p-4 text-left"
                  onClick={() => navigate(`/sales/${order._id}`)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/12 text-primary">
                        <ReceiptText size={18} />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">
                          {getClientName(order.client)}
                        </h3>
                        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-default-500">
                          {order.orderNumber || `Pedido #${order._id.slice(-6)}`}
                        </p>
                        <p className="mt-1 text-xs uppercase tracking-[0.16em] text-default-400">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                        <p className="mt-3 text-sm text-default-500">
                          {order.items?.length || 0} producto(s)
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-[18px] font-semibold tracking-[-0.03em] text-foreground">
                        {formatCompactCurrency(
                          Number(order.totalAmount || 0),
                          currency,
                        )}
                      </p>
                      <span className="mt-2 inline-flex rounded-full bg-content2 px-3 py-1 text-[11px] font-semibold text-default-600">
                        {order.status}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div ref={loadMoreRef} className="h-8 w-full" />

            {isFetchingNextPage && (
              <div className="app-panel rounded-[24px] py-6 text-center text-default-400">
                <Loader2 className="mx-auto mb-2 animate-spin" size={24} />
                <p className="text-sm">Cargando mas ventas...</p>
              </div>
            )}

            {!hasNextPage && safeOrders.length > 0 && (
              <div className="py-4 text-center text-xs text-default-400">
                Fin del historial cargado
              </div>
            )}
          </div>
        )}
      </main>

      <Button
        isIconOnly
        as={Link}
        className="fixed bottom-[100px] right-6 z-10 rounded-full shadow-[0_16px_34px_rgba(88,176,156,0.35)] lg:hidden"
        color="primary"
        size="lg"
        to="/new-operation"
      >
        <Plus size={24} />
      </Button>
    </div>
  );
}
