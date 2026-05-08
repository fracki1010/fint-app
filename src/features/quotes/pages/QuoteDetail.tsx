import { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  Send,
  CheckCircle,
  XCircle,
  ShoppingCart,
  FileEdit,
  Trash2,
  User,
  Calendar,
  Clock,
  MessageSquare,
  ExternalLink,
} from "lucide-react";

import {
  useQuote,
  useSendQuote,
  useAcceptQuote,
  useRejectQuote,
  useConvertToOrder,
  useDeleteQuote,
} from "@features/quotes/hooks/useQuotes";
import type { QuoteStatus } from "@shared/types";
import { useAppToast } from "@features/notifications/components/AppToast";
import { formatCurrency } from "@shared/utils/currency";
import { formatDateShort, formatDateTime } from "@shared/utils/date";
import { getErrorMessage } from "@shared/utils/errors";

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

// ── Helpers ──────────────────────────────────────────────────────────

function getClientName(client: { _id: string; name?: string; phone?: string } | string): string {
  if (typeof client === "object" && client) {
    return client.name || "Cliente sin nombre";
  }
  return "Cliente sin nombre";
}

function getClientPhone(client: { _id: string; name?: string; phone?: string } | string): string {
  if (typeof client === "object" && client) {
    return client.phone || "";
  }
  return "";
}

function getCreatedByName(createdBy: { _id: string; fullName: string } | undefined): string {
  if (createdBy && typeof createdBy === "object") {
    return createdBy.fullName || "—";
  }
  return "—";
}

// ── Confirm modal ────────────────────────────────────────────────────

function ConfirmActionModal({
  isOpen,
  title,
  message,
  confirmLabel,
  confirmColor,
  isLoading,
  onConfirm,
  onCancel,
}: {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  confirmColor: string;
  isLoading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-divider/10 bg-content1 p-6 shadow-2xl">
        <h3 className="text-lg font-bold text-foreground">{title}</h3>
        <p className="mt-2 text-sm text-default-500">{message}</p>
        <div className="mt-6 flex gap-3">
          <button
            className="flex-1 rounded-xl border border-divider/20 px-4 py-2.5 text-sm font-semibold text-default-600 hover:bg-content2/60 transition-colors"
            disabled={isLoading}
            onClick={onCancel}
          >
            Cancelar
          </button>
          <button
            className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all disabled:opacity-50 ${confirmColor}`}
            disabled={isLoading}
            onClick={onConfirm}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="animate-spin" size={16} />
                Procesando...
              </span>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page component ───────────────────────────────────────────────────

export default function QuoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useAppToast();

  const { quote, loading, error } = useQuote(id);
  const sendQuote = useSendQuote();
  const acceptQuote = useAcceptQuote();
  const rejectQuote = useRejectQuote();
  const convertToOrder = useConvertToOrder();
  const deleteQuote = useDeleteQuote();

  const [confirmAction, setConfirmAction] = useState<{
    type: "send" | "accept" | "reject" | "convert" | "delete";
  } | null>(null);

  // ── Action handlers ──────────────────────────────────────────────

  const handleSend = async () => {
    if (!id) return;
    try {
      await sendQuote.mutateAsync(id);
      showToast({ variant: "success", message: "Presupuesto enviado correctamente." });
    } catch (err) {
      showToast({ variant: "error", message: getErrorMessage(err, "Error al enviar el presupuesto.") });
    } finally {
      setConfirmAction(null);
    }
  };

  const handleAccept = async () => {
    if (!id) return;
    try {
      await acceptQuote.mutateAsync(id);
      showToast({ variant: "success", message: "Presupuesto aceptado correctamente." });
    } catch (err) {
      showToast({ variant: "error", message: getErrorMessage(err, "Error al aceptar el presupuesto.") });
    } finally {
      setConfirmAction(null);
    }
  };

  const handleReject = async () => {
    if (!id) return;
    try {
      await rejectQuote.mutateAsync(id);
      showToast({ variant: "success", message: "Presupuesto rechazado." });
    } catch (err) {
      showToast({ variant: "error", message: getErrorMessage(err, "Error al rechazar el presupuesto.") });
    } finally {
      setConfirmAction(null);
    }
  };

  const handleConvert = async () => {
    if (!id) return;
    try {
      await convertToOrder.mutateAsync(id);
      showToast({ variant: "success", message: "Venta creada desde el presupuesto." });
    } catch (err) {
      showToast({ variant: "error", message: getErrorMessage(err, "Error al convertir el presupuesto.") });
    } finally {
      setConfirmAction(null);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      await deleteQuote.mutateAsync(id);
      showToast({ variant: "success", message: "Presupuesto eliminado." });
      navigate("/quotes");
    } catch (err) {
      showToast({ variant: "error", message: getErrorMessage(err, "Error al eliminar el presupuesto.") });
    } finally {
      setConfirmAction(null);
    }
  };

  const isPending =
    sendQuote.isPending ||
    acceptQuote.isPending ||
    rejectQuote.isPending ||
    convertToOrder.isPending ||
    deleteQuote.isPending;

  // ── Loading / Error states ───────────────────────────────────────

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-default-400">
          <Loader2 className="animate-spin" size={32} />
          <p className="text-sm font-medium">Cargando presupuesto...</p>
        </div>
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10">
          <XCircle className="text-red-500" size={28} />
        </div>
        <p className="text-sm font-semibold text-foreground">Error al cargar el presupuesto</p>
        <p className="text-xs text-default-500">{error || "Presupuesto no encontrado"}</p>
        <button
          className="rounded-xl border border-divider/20 px-4 py-2 text-sm font-semibold text-default-600 hover:bg-content2/60 transition-colors"
          onClick={() => navigate("/quotes")}
        >
          Volver a presupuestos
        </button>
      </div>
    );
  }

  const clientName = getClientName(quote.client);
  const clientPhone = getClientPhone(quote.client);

  // ── Desktop layout ─────────────────────────────────────────────
  return (
    <div className="flex h-full w-full flex-col">
      {/* Header */}
      <header className="page-header flex shrink-0 items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-divider/20 text-default-400 hover:text-foreground transition-colors"
            onClick={() => navigate("/quotes")}
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <p className="section-kicker">Presupuestos</p>
            <div className="flex items-center gap-3 mt-0.5">
              <h1 className="page-title">{quote.quoteNumber}</h1>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.08em] ${STATUS_COLORS[quote.status]}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOTS[quote.status]}`} />
                {STATUS_LABELS[quote.status]}
              </span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {quote.status === "DRAFT" && (
            <>
              <button
                className="flex items-center gap-2 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-blue-500/35 disabled:opacity-50"
                disabled={isPending}
                onClick={() => setConfirmAction({ type: "send" })}
              >
                <Send size={15} />
                Enviar
              </button>
              <button
                className="flex items-center gap-2 rounded-xl border border-divider/20 px-4 py-2.5 text-sm font-semibold text-default-600 hover:bg-content2/60 transition-colors"
                onClick={() => navigate(`/quotes/${quote._id}/edit`)}
              >
                <FileEdit size={15} />
                Editar
              </button>
              <button
                className="flex items-center gap-2 rounded-xl border border-red-500/20 px-4 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-500/10 transition-colors"
                disabled={isPending}
                onClick={() => setConfirmAction({ type: "delete" })}
              >
                <Trash2 size={15} />
                Eliminar
              </button>
            </>
          )}

          {quote.status === "SENT" && (
            <>
              <button
                className="flex items-center gap-2 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/25 transition-all hover:shadow-emerald-500/35 disabled:opacity-50"
                disabled={isPending}
                onClick={() => setConfirmAction({ type: "accept" })}
              >
                <CheckCircle size={15} />
                Aceptar
              </button>
              <button
                className="flex items-center gap-2 rounded-xl border border-red-500/20 px-4 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-500/10 transition-colors"
                disabled={isPending}
                onClick={() => setConfirmAction({ type: "reject" })}
              >
                <XCircle size={15} />
                Rechazar
              </button>
            </>
          )}

          {quote.status === "ACCEPTED" && (
            <button
              className="flex items-center gap-2 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-500/25 transition-all hover:shadow-violet-500/35 disabled:opacity-50"
              disabled={isPending}
              onClick={() => setConfirmAction({ type: "convert" })}
            >
              <ShoppingCart size={15} />
              Convertir en Venta
            </button>
          )}

          {quote.status === "CONVERTED" && quote.convertedToOrder && (
            <Link
              to={`/sales/${quote.convertedToOrder}`}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-500/25 transition-all hover:shadow-violet-500/35"
            >
              <ExternalLink size={15} />
              Ver Venta
            </Link>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Client info */}
          <div className="financial-card">
            <div className="flex items-center gap-2 mb-4">
              <User size={14} className="text-default-400" />
              <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-default-500">Cliente</h3>
            </div>
            <p className="text-sm font-semibold text-foreground">{clientName}</p>
            {clientPhone && (
              <p className="mt-1 text-xs text-default-500">{clientPhone}</p>
            )}
          </div>

          {/* Dates */}
          <div className="financial-card">
            <div className="flex items-center gap-2 mb-4">
              <Calendar size={14} className="text-default-400" />
              <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-default-500">Fechas</h3>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-default-500">Emisión:</span>
                <span className="font-semibold text-foreground">{formatDateShort(quote.date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-default-500">Vencimiento:</span>
                <span className="font-semibold text-foreground">
                  {quote.expirationDate ? formatDateShort(quote.expirationDate) : "—"}
                </span>
              </div>
            </div>
          </div>

          {/* Created by */}
          <div className="financial-card">
            <div className="flex items-center gap-2 mb-4">
              <Clock size={14} className="text-default-400" />
              <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-default-500">Creado por</h3>
            </div>
            <p className="text-sm font-semibold text-foreground">{getCreatedByName(quote.createdBy)}</p>
            <p className="mt-1 text-xs text-default-500">{formatDateTime(quote.createdAt)}</p>
          </div>
        </div>

        {/* Items table */}
        <div className="financial-card !p-0 overflow-hidden">
          <div className="px-5 py-4 border-b border-divider/10">
            <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-default-500">
              Items ({quote.items.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="text-left text-[10px] font-bold uppercase tracking-[0.16em] text-default-400">
                  <th className="px-5 pb-3 pt-4">Producto</th>
                  <th className="px-4 pb-3 pt-4 text-right">Cantidad</th>
                  <th className="px-4 pb-3 pt-4 text-right">Precio</th>
                  <th className="px-5 pb-3 pt-4 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {quote.items.map((item, idx) => (
                  <tr key={idx} className="border-t border-divider/10">
                    <td className="px-5 py-4">
                      <span className="text-sm font-semibold text-foreground">{item.product}</span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className="text-sm font-mono text-default-500">{item.quantity}</span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className="text-sm font-mono text-default-500">{formatCurrency(item.price)}</span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className="text-sm font-bold font-mono text-foreground">{formatCurrency(item.lineTotal)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="border-t border-divider/10 px-5 py-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-default-500">Subtotal</span>
              <span className="font-mono font-semibold text-foreground">{formatCurrency(quote.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-default-500">Impuesto</span>
              <span className="font-mono font-semibold text-foreground">{formatCurrency(quote.tax)}</span>
            </div>
            <div className="flex justify-between border-t border-divider/10 pt-2 text-base font-bold text-foreground">
              <span>Total</span>
              <span className="font-mono">{formatCurrency(quote.total)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {quote.notes && (
          <div className="financial-card">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare size={14} className="text-default-400" />
              <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-default-500">Notas</h3>
            </div>
            <p className="text-sm text-default-600 whitespace-pre-wrap">{quote.notes}</p>
          </div>
        )}
      </div>

      {/* Confirm modals */}
      <ConfirmActionModal
        isOpen={confirmAction?.type === "send"}
        title="Enviar presupuesto"
        message="El presupuesto pasará a estado Enviado. ¿Continuar?"
        confirmLabel="Enviar"
        confirmColor="bg-gradient-to-br from-blue-500 to-blue-600"
        isLoading={sendQuote.isPending}
        onConfirm={handleSend}
        onCancel={() => setConfirmAction(null)}
      />
      <ConfirmActionModal
        isOpen={confirmAction?.type === "accept"}
        title="Aceptar presupuesto"
        message="El presupuesto pasará a estado Aceptado. ¿Continuar?"
        confirmLabel="Aceptar"
        confirmColor="bg-gradient-to-br from-emerald-500 to-emerald-600"
        isLoading={acceptQuote.isPending}
        onConfirm={handleAccept}
        onCancel={() => setConfirmAction(null)}
      />
      <ConfirmActionModal
        isOpen={confirmAction?.type === "reject"}
        title="Rechazar presupuesto"
        message="El presupuesto pasará a estado Rechazado. Esta acción no se puede deshacer."
        confirmLabel="Rechazar"
        confirmColor="bg-gradient-to-br from-red-500 to-red-600"
        isLoading={rejectQuote.isPending}
        onConfirm={handleReject}
        onCancel={() => setConfirmAction(null)}
      />
      <ConfirmActionModal
        isOpen={confirmAction?.type === "convert"}
        title="Convertir en Venta"
        message="Se creará una nueva venta con los items de este presupuesto. El presupuesto pasará a estado Convertido."
        confirmLabel="Convertir"
        confirmColor="bg-gradient-to-br from-violet-500 to-violet-600"
        isLoading={convertToOrder.isPending}
        onConfirm={handleConvert}
        onCancel={() => setConfirmAction(null)}
      />
      <ConfirmActionModal
        isOpen={confirmAction?.type === "delete"}
        title="Eliminar presupuesto"
        message="¿Estás seguro de eliminar este presupuesto? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        confirmColor="bg-gradient-to-br from-red-500 to-red-600"
        isLoading={deleteQuote.isPending}
        onConfirm={handleDelete}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
}
