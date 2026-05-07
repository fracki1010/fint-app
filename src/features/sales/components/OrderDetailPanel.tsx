import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Loader2,
  X,
  FileDown,
  PackageCheck,
  ReceiptText,
  ClipboardCheck,
  CircleDollarSign,
} from "lucide-react";
import { Select, SelectItem } from "@heroui/select";

import {
  DeliveryStatus,
  PaymentStatus,
  SalesStatus,
  useOrderDetail,
  useOrders,
} from "@features/sales/hooks/useOrders";
import { useSettings } from "@features/settings/hooks/useSettings";
import { useAppToast } from "@features/notifications/components/AppToast";
import { formatCurrency } from "@shared/utils/currency";
import { getErrorMessage } from "@shared/utils/errors";
import { downloadOrderInvoicePdf } from "@features/sales/utils/invoice";
import { getClientName, getClientPhone } from "@shared/utils/entity";
import { StatusBadge } from "@shared/components/StatusBadge";
import { TierBadge } from "@features/sales/components/TierBadge";
import { PriceTier } from "@shared/types";

const MOVEMENTS_PREVIEW_LIMIT = 8;

const SALES_STATUS_OPTIONS: SalesStatus[] = ["Pendiente", "Confirmada", "Cancelada"];
const PAYMENT_STATUS_OPTIONS: PaymentStatus[] = ["Pendiente", "Parcial", "Pagado"];
const DELIVERY_STATUS_OPTIONS: DeliveryStatus[] = ["Pendiente", "Preparando", "Entregada"];

interface OrderDetailPanelProps {
  orderId: string;
  currency: string;
  settings: ReturnType<typeof useSettings>["settings"];
  isDesktop: boolean;
  onBack: () => void;
  onClose?: () => void;
}

export function OrderDetailPanel({
  orderId,
  currency,
  settings,
  isDesktop,
  onBack,
  onClose,
}: OrderDetailPanelProps) {
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
    <div className="flex h-full flex-col bg-content1">
      {/* Panel header */}
      <div className={`shrink-0 border-b border-[color:rgb(var(--warm-border)/0.12)] px-6 py-4 ${isDesktop ? "bg-background/60 backdrop-blur-sm" : "bg-background"}`}>
        {!isDesktop && (
          <button className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-default-500 hover:text-foreground transition" onClick={onBack}>
            <ArrowLeft size={14} /> Volver a ventas
          </button>
        )}
        {isDesktop && (
          <div className="mb-3 flex justify-end">
            <button
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-[color:rgb(var(--warm-border)/0.12)] bg-white/5 text-default-400 transition hover:text-foreground"
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
            <p className="section-kicker">Detalle de venta</p>
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
              <div className="rounded-2xl border border-divider/10 bg-content2/50 p-4">
                <div className="flex items-center justify-between">
                  <p className="section-kicker">Cliente</p>
                  {(() => {
                    const client = typeof selectedOrder.client === "object" ? selectedOrder.client : null;
                    const tier = client?.priceList || "retail";
                    return tier !== "retail" ? (
                      <TierBadge tier={tier as PriceTier} size="sm" tierConfig={settings?.priceTierConfig} />
                    ) : null;
                  })()}
                </div>
                <p className="mt-2 font-semibold text-foreground">{getClientName(selectedOrder.client)}</p>
                <p className="mt-0.5 text-xs text-default-400">{getClientPhone(selectedOrder.client)}</p>
              </div>
              <div className="rounded-2xl border border-divider/10 bg-content2/50 p-4">
                <p className="section-kicker">Importe</p>
                <p className="mt-2 text-xl font-bold tracking-tight text-foreground">
                  {formatCurrency(Number(selectedOrder.totalAmount || 0), currency)}
                </p>
                <p className="mt-0.5 text-xs text-default-400">{selectedOrder.items.length} ítem(s)</p>
              </div>
            </div>

            {/* Status selectors */}
            <div className="rounded-2xl border border-divider/10 bg-content2/50 p-4">
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-default-400">Actualizar estados</p>
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
            <div className="rounded-2xl border border-divider/10 bg-content2/50 p-4">
              <p className="mb-3 text-sm font-bold text-foreground">Items del pedido</p>
              <div className="space-y-1.5">
                {selectedOrder.items.map((item, i) => (
                  <div key={`${item.product}-${i}`} className="flex items-center justify-between rounded-xl bg-background/50 px-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{item.product}</p>
                      <p className="text-xs text-default-400">{item.quantity} × {formatCurrency(Number(item.price || 0), currency)}</p>
                    </div>
                    <p className="ml-3 shrink-0 text-sm font-bold text-foreground">
                      {formatCurrency(Number(item.quantity || 0) * Number(item.price || 0), currency)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="rounded-2xl border border-divider/10 bg-content2/50 p-4">
              <p className="mb-2 text-sm font-bold text-foreground">Notas</p>
              <textarea
                className="corp-input min-h-20 w-full rounded-xl px-3 py-2.5 text-sm"
                placeholder="Observaciones internas..."
                value={notesDraft}
                onChange={(e) => setNotesDraft(e.target.value)}
              />
            </div>

            {/* Movements */}
            <div className="rounded-2xl border border-divider/10 bg-content2/50 p-4">
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
              <div className="space-y-1.5">
                {movements.length > 0 ? visibleMovements.map((m) => (
                  <div key={m._id} className="flex items-center justify-between rounded-xl bg-background/50 px-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{m.product?.name || "Movimiento"}</p>
                      <p className="text-xs text-default-400">{m.reason || m.type}</p>
                    </div>
                    <div className="shrink-0 text-right">
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
                  className="mt-3 w-full rounded-xl border border-divider/10 py-2 text-xs font-semibold text-default-500 hover:bg-content2/40 transition"
                  onClick={() => setShowAllMovements((p) => !p)}
                >
                  {showAllMovements ? "Ver menos" : `Ver todos (${movements.length})`}
                </button>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pb-2">
              <button
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-divider/12 bg-content2/50 py-3 text-sm font-semibold text-default-600 hover:bg-content2 transition"
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
