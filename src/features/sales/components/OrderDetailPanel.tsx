import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Loader2,
  X,
  FileDown,
  Check,
  ReceiptText,
} from "lucide-react";

import {
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
import { PriceTier, PaymentMethod } from "@shared/types";
import { getPaymentLabel, getPaymentIcon } from "@features/sales/utils/payment";
import { VoucherList } from "@features/vouchers/components/VoucherList";
import { VoucherActions } from "@features/vouchers/components/VoucherActions";
import { useVouchers, useGenerateVouchers } from "@features/vouchers/hooks/useVouchers";
import { VoucherType } from "@shared/types";

const MOVEMENTS_PREVIEW_LIMIT = 8;


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

  // Voucher integration
  const { vouchers, loading: vouchersLoading, refetch: refetchVouchers } = useVouchers(orderId);
  const { generateVouchers, isGenerating } = useGenerateVouchers();
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [voucherTypesToGenerate, setVoucherTypesToGenerate] = useState<VoucherType[]>(["invoice"]);

  const handleGenerateVouchers = async () => {
    if (!orderId || voucherTypesToGenerate.length === 0) return;
    try {
      await generateVouchers({
        orderId,
        data: { types: voucherTypesToGenerate, generatePdf: true },
      });
      showToast({
        variant: "success",
        message: `${voucherTypesToGenerate.length} comprobante(s) generado(s) correctamente`,
      });
      setShowGenerateModal(false);
      refetchVouchers();
    } catch (error) {
      showToast({
        variant: "error",
        message: getErrorMessage(error, "No se pudieron generar los comprobantes"),
      });
    }
  };

  const [notesDraft, setNotesDraft] = useState("");
  const [paymentMethodDraft, setPaymentMethodDraft] = useState<string>("cash");
  const [changingMethod, setChangingMethod] = useState(false);
  const [showAllMovements, setShowAllMovements] = useState(false);

  const movementSummary = useMemo(
    () => movements.reduce((acc, m) => { acc[m.type] = (acc[m.type] || 0) + 1; return acc; }, {} as Record<string, number>),
    [movements],
  );
  const visibleMovements = showAllMovements ? movements : movements.slice(0, MOVEMENTS_PREVIEW_LIMIT);

  useEffect(() => {
    if (selectedOrder) {
      setPaymentMethodDraft((selectedOrder as any).paymentMethod || "cash");
      setNotesDraft(selectedOrder.notes || "");
    }
    setShowAllMovements(false);
  }, [selectedOrder, orderId]);

  const saveOrder = async (patch: Record<string, unknown>) => {
    try {
      await updateOrder({ id: orderId, orderData: patch as any });
      showToast({ variant: "success", message: "Venta actualizada." });
      setChangingMethod(false);
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
    <div className={`flex flex-col bg-content1 ${isDesktop ? "h-full" : "min-h-full"}`}>
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
            <h2 className="mt-1 text-xl font-bold tracking-tight text-foreground">
              {selectedOrder?.orderNumber || `Pedido #${orderId.slice(-6)}`}
            </h2>
            {selectedOrder && (
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                {/* One summary of where the sale stands, same order as the steps */}
                <StatusBadge
                  label={
                    selectedOrder.salesStatus === "Cancelada"
                      ? "Cancelada"
                      : selectedOrder.deliveryStatus === "Entregada"
                        ? "Entregada"
                        : selectedOrder.paymentStatus === "Pagado"
                          ? "Cobrada"
                          : selectedOrder.salesStatus === "Confirmada"
                            ? "Confirmada"
                            : "Pendiente"
                  }
                />
                {(selectedOrder.paymentSplits && selectedOrder.paymentSplits.length > 0
                  ? selectedOrder.paymentSplits
                  : selectedOrder.paymentMethod
                    ? [{ method: selectedOrder.paymentMethod, amount: 0 }]
                    : []
                ).map((split, i) => {
                  const Icon = getPaymentIcon(split.method as PaymentMethod);
                  return (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 rounded-full bg-content2/70 px-2.5 py-1 text-[10px] font-semibold text-default-600"
                    >
                      <Icon width={10} height={10} />
                      {getPaymentLabel(split.method as PaymentMethod, true)}
                    </span>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Panel body */}
      <div className={`flex-1 px-6 py-5 ${isDesktop ? "overflow-y-auto" : ""}`}>
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
                <p className="mt-0.5 text-xs text-default-400">
                  {selectedOrder.items.length} ítem(s) ·{" "}
                  {new Date(selectedOrder.createdAt).toLocaleString("es-AR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: false })}
                  {selectedOrder.source ? ` · ${selectedOrder.source}` : ""}
                </p>
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

            {/* Status: one path with one action per step */}
            {(() => {
              const sales = selectedOrder.salesStatus || "Pendiente";
              const payment = selectedOrder.paymentStatus || "Pendiente";
              const delivery = selectedOrder.deliveryStatus || "Pendiente";
              const cancelled = sales === "Cancelada";
              const paid = payment === "Pagado";
              const method = (selectedOrder as any).paymentMethod as PaymentMethod | undefined;
              const steps = [
                { label: "Confirmada", done: sales === "Confirmada" || paid || delivery === "Entregada" },
                { label: "Cobrada", done: paid },
                { label: "Entregada", done: delivery === "Entregada" },
              ];
              const methodOptions = [
                { key: "cash", label: "Efectivo" },
                { key: "card", label: "Tarjeta" },
                { key: "transfer", label: "Transferencia" },
              ];
              const methodButtons = (
                <div className="flex gap-2">
                  {methodOptions.map((m) => (
                    <button
                      key={m.key}
                      type="button"
                      className={`flex-1 rounded-xl py-2 text-xs font-bold transition ${
                        paymentMethodDraft === m.key ? "bg-primary text-white" : "border border-divider/30 bg-content2/50 text-default-500 hover:bg-content2"
                      }`}
                      onClick={() => setPaymentMethodDraft(m.key)}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              );

              return (
                <div className="space-y-4 rounded-2xl border border-divider/10 bg-content2/50 p-4">
                  {cancelled ? (
                    <p className="text-sm font-semibold text-danger">Venta cancelada</p>
                  ) : (
                    <ol className="flex items-center gap-2">
                      {steps.map((step, i) => (
                        <li key={step.label} className="flex min-w-0 flex-1 items-center gap-2">
                          <span
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                              step.done ? "bg-success text-white" : "border border-divider/30 bg-content2 text-default-500"
                            }`}
                          >
                            {step.done ? <Check size={12} /> : i + 1}
                          </span>
                          <span className={`truncate text-xs font-semibold ${step.done ? "text-foreground" : "text-default-400"}`}>{step.label}</span>
                        </li>
                      ))}
                    </ol>
                  )}

                  {!cancelled && sales === "Pendiente" && (
                    <button
                      type="button"
                      className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-white disabled:opacity-50"
                      disabled={isUpdating}
                      onClick={() => saveOrder({ salesStatus: "Confirmada" })}
                    >
                      Confirmar venta
                    </button>
                  )}

                  {!cancelled && sales !== "Pendiente" && !paid && (
                    <div className="space-y-3">
                      <p className="text-xs font-semibold text-default-500">¿Cómo cobraste?</p>
                      {methodButtons}
                      <button
                        type="button"
                        className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-white disabled:opacity-50"
                        disabled={isUpdating}
                        onClick={() => saveOrder({ paymentStatus: "Pagado", paymentMethod: paymentMethodDraft })}
                      >
                        Registrar cobro
                      </button>
                    </div>
                  )}

                  {!cancelled && paid && delivery !== "Entregada" && (
                    <button
                      type="button"
                      className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-white disabled:opacity-50"
                      disabled={isUpdating}
                      onClick={() => saveOrder({ deliveryStatus: "Entregada" })}
                    >
                      Marcar entregada
                    </button>
                  )}

                  {!cancelled && paid && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-default-500">Cobrado{method ? ` en ${getPaymentLabel(method)}` : ""}</span>
                        {!changingMethod && (
                          <button type="button" className="font-semibold text-primary" onClick={() => setChangingMethod(true)}>
                            Cambiar
                          </button>
                        )}
                      </div>
                      {changingMethod && (
                        <div className="space-y-3">
                          {methodButtons}
                          <button
                            type="button"
                            className="w-full rounded-xl bg-primary py-2.5 text-xs font-bold text-white disabled:opacity-50"
                            disabled={isUpdating}
                            onClick={() => saveOrder({ paymentMethod: paymentMethodDraft })}
                          >
                            Guardar método
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {!cancelled && delivery !== "Entregada" && (
                    <button
                      type="button"
                      className="text-xs font-semibold text-danger"
                      onClick={() => {
                        if (window.confirm("¿Cancelar esta venta?")) saveOrder({ salesStatus: "Cancelada" });
                      }}
                    >
                      Cancelar venta
                    </button>
                  )}
                </div>
              );
            })()}

            {/* Payment details */}
            {((selectedOrder.paymentSplits && selectedOrder.paymentSplits.length > 0) || selectedOrder.paymentMethod) && (
              <div className="rounded-2xl border border-divider/10 bg-content2/50 p-4">
                <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-default-400">
                  Pago{selectedOrder.paymentSplits && selectedOrder.paymentSplits.length > 1 ? "s" : ""}
                </p>
                <div className="space-y-1.5">
                  {(selectedOrder.paymentSplits && selectedOrder.paymentSplits.length > 0
                    ? selectedOrder.paymentSplits
                    : selectedOrder.paymentMethod
                      ? [{ method: selectedOrder.paymentMethod, amount: selectedOrder.totalAmount }]
                      : []
                  ).map((split, i) => {
                    const Icon = getPaymentIcon(split.method as PaymentMethod);
                    return (
                      <div key={i} className="flex items-center justify-between rounded-xl bg-background/50 px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <Icon width={14} height={14} />
                          <span className="text-sm font-semibold text-foreground">
                            {getPaymentLabel(split.method as PaymentMethod)}
                          </span>
                        </div>
                        <span className="text-sm font-bold text-foreground">
                          {split.amount > 0 ? formatCurrency(split.amount, currency) : "—"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Vouchers */}
            <div className="rounded-2xl border border-divider/10 bg-content2/50 p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-bold text-foreground">Comprobantes</p>
                {vouchers.length > 0 && (
                  <VoucherActions
                    vouchers={vouchers}
                    orderId={orderId}
                    onViewList={() => { /* Could expand to show full list */ }}
                    onGenerateMore={() => setShowGenerateModal(true)}
                  />
                )}
              </div>
              {vouchersLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 size={20} className="animate-spin text-default-400" />
                </div>
              ) : (
                <VoucherList
                  vouchers={vouchers}
                  orderId={orderId}
                  onVoucherVoided={refetchVouchers}
                />
              )}
              {vouchers.length === 0 && !vouchersLoading && selectedOrder.salesStatus === "Confirmada" && (
                <button
                  className="mt-3 w-full rounded-xl border border-dashed border-divider/50 py-2.5 text-xs font-semibold text-default-500 transition hover:border-primary/30 hover:text-primary"
                  onClick={() => setShowGenerateModal(true)}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 size={14} className="animate-spin" />
                      Generando...
                    </span>
                  ) : (
                    "Generar comprobantes"
                  )}
                </button>
              )}
            </div>

            {/* Notes */}
            <div className="rounded-2xl border border-divider/10 bg-content2/50 p-4">
              <p className="mb-2 text-sm font-bold text-foreground">Notas</p>
              <textarea
                className="corp-input min-h-20 w-full rounded-xl px-3 py-2.5 text-sm"
                placeholder="Observaciones internas..."
                value={notesDraft}
                onChange={(e) => setNotesDraft(e.target.value)}
                onBlur={() => {
                  if (notesDraft !== (selectedOrder.notes || "")) saveOrder({ notes: notesDraft });
                }}
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

            {/* Actions: pinned so saving a status change never needs a long scroll */}
            <div className="sticky bottom-0 -mx-6 flex gap-3 border-t border-divider/10 bg-background px-6 py-3">
              <button
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-divider/12 bg-content2/50 py-3 text-sm font-semibold text-default-600 hover:bg-content2 transition"
                onClick={handleDownloadInvoice}
              >
                <FileDown size={16} /> Descargar factura
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Generate Vouchers Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-content1 p-6 shadow-xl">
            <h3 className="text-lg font-bold text-foreground">Generar comprobantes</h3>
            <p className="mt-1 text-sm text-default-500">
              Selecciona los tipos de comprobantes a generar para esta orden
            </p>

            <div className="mt-4 space-y-2">
              {(['invoice', 'delivery_note', 'receipt'] as VoucherType[]).map((type) => {
                const isSelected = voucherTypesToGenerate.includes(type);
                const isReceiptDisabled = type === 'receipt' && selectedOrder?.paymentStatus !== 'Pagado';
                const labels: Record<VoucherType, string> = {
                  invoice: 'Factura',
                  delivery_note: 'Remito',
                  receipt: 'Recibo',
                };

                return (
                  <label
                    key={type}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${
                      isReceiptDisabled
                        ? 'cursor-not-allowed border-divider/30 bg-content2/30 opacity-60'
                        : isSelected
                          ? 'border-primary/40 bg-primary/5'
                          : 'border-divider/60 bg-content2/20 hover:border-primary/20'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-divider text-primary focus:ring-primary"
                      checked={isSelected}
                      disabled={isReceiptDisabled}
                      onChange={() => {
                        if (isReceiptDisabled) return;
                        setVoucherTypesToGenerate((prev) =>
                          isSelected
                            ? prev.filter((t) => t !== type)
                            : [...prev, type]
                        );
                      }}
                    />
                    <span className="flex-1 text-sm font-medium text-foreground">
                      {labels[type]}
                    </span>
                    {type === 'receipt' && isReceiptDisabled && (
                      <span className="text-[10px] text-warning">
                        Solo para órdenes pagadas
                      </span>
                    )}
                  </label>
                );
              })}
            </div>

            {voucherTypesToGenerate.length === 0 && (
              <p className="mt-3 text-xs text-warning">
                Selecciona al menos un tipo de comprobante
              </p>
            )}

            <div className="mt-6 flex gap-3">
              <button
                className="flex-1 rounded-xl border border-divider/60 py-2.5 text-sm font-semibold text-default-600 transition hover:bg-content2"
                onClick={() => {
                  setShowGenerateModal(false);
                  setVoucherTypesToGenerate(['invoice']);
                }}
                disabled={isGenerating}
              >
                Cancelar
              </button>
              <button
                className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:opacity-50"
                onClick={handleGenerateVouchers}
                disabled={voucherTypesToGenerate.length === 0 || isGenerating}
              >
                {isGenerating ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    Generando...
                  </span>
                ) : (
                  `Generar ${voucherTypesToGenerate.length > 0 ? `(${voucherTypesToGenerate.length})` : ''}`
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
