import { X, ArrowDownLeft, ArrowUpRight, FileText, AlertCircle, User, Calendar, CreditCard, Hash, FileEdit, Trash2, Loader2, ExternalLink } from "lucide-react";

import { ClientAccountEntry, ClientEntryType } from "@shared/types";
import { formatCurrency } from "@shared/utils/currency";
import { formatDateTime } from "@shared/utils/date";
import { usePermissions } from "@features/auth/hooks/usePermissions";

const ENTRY_TYPE_LABELS: Record<ClientEntryType, string> = {
  CHARGE: "Cargo",
  PAYMENT: "Cobro",
  CREDIT_NOTE: "Nota de Crédito",
  DEBIT_NOTE: "Nota de Débito",
};

const ENTRY_TYPE_COLORS: Record<ClientEntryType, { bg: string; text: string; border: string }> = {
  CHARGE: { bg: "bg-danger/10", text: "text-danger", border: "border-danger/20" },
  PAYMENT: { bg: "bg-success/10", text: "text-success", border: "border-success/20" },
  CREDIT_NOTE: { bg: "bg-primary/10", text: "text-primary", border: "border-primary/20" },
  DEBIT_NOTE: { bg: "bg-warning/10", text: "text-warning", border: "border-warning/20" },
};

function EntryTypeIcon({ type }: { type: ClientEntryType }) {
  switch (type) {
    case "PAYMENT":
      return <ArrowUpRight size={20} />;
    case "CHARGE":
      return <ArrowDownLeft size={20} />;
    case "CREDIT_NOTE":
      return <FileText size={20} />;
    case "DEBIT_NOTE":
      return <AlertCircle size={20} />;
  }
}



interface AccountEntryDetailModalProps {
  entry: ClientAccountEntry | null;
  isOpen: boolean;
  onClose: () => void;
  currency: string;
  clientName: string;
  onEdit?: () => void;
  onDelete?: () => void;
  isDeleting?: boolean;
}

export function AccountEntryDetailModal({
  entry,
  isOpen,
  onClose,
  currency,
  clientName,
  onEdit,
  onDelete,
  isDeleting,
}: AccountEntryDetailModalProps) {
  const { can } = usePermissions();
  const canEdit = can.manageAccounting || can.manageClients;

  if (!isOpen || !entry) return null;

  const colors = ENTRY_TYPE_COLORS[entry.type];
  const signedAmount = entry.amount * entry.sign;
  const isManualEntry = !entry.order; // Manual entries don't have an associated order
  const isSystemEntry = !!entry.order; // System entries are from orders

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 bg-content1 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-content1 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${colors.bg} ${colors.text}`}>
              <EntryTypeIcon type={entry.type} />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{ENTRY_TYPE_LABELS[entry.type]}</p>
              <p className="text-xs text-default-400">{clientName}</p>
            </div>
          </div>
          <button
            className="rounded-full p-2 text-default-400 transition hover:bg-content2 hover:text-foreground"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5">
          {/* Amount Card */}
          <div className={`rounded-2xl border ${colors.border} ${colors.bg} p-5`}>
            <p className="text-xs font-semibold uppercase tracking-widest text-default-500">
              Monto
            </p>
            <p className={`mt-2 text-3xl font-bold ${colors.text}`}>
              {signedAmount > 0 ? "+" : ""}
              {formatCurrency(signedAmount, currency)}
            </p>
            <p className="mt-1 text-xs text-default-400">
              {entry.sign > 0 ? "Aumenta la deuda" : "Reduce la deuda"}
            </p>
          </div>

          {/* Details Grid */}
          <div className="grid gap-3">
            {/* Date */}
            <div className="flex items-center justify-between rounded-xl bg-content2 px-4 py-3">
              <div className="flex items-center gap-2 text-default-500">
                <Calendar size={16} />
                <span className="text-sm">Fecha</span>
              </div>
              <span className="text-sm font-semibold text-foreground">
                {formatDateTime(entry.date)}
              </span>
            </div>

            {/* Created At */}
            <div className="flex items-center justify-between rounded-xl bg-content2 px-4 py-3">
              <div className="flex items-center gap-2 text-default-500">
                <User size={16} />
                <span className="text-sm">Registrado</span>
              </div>
              <span className="text-sm text-foreground">
                {formatDateTime(entry.createdAt)}
              </span>
            </div>

            {/* Payment Method */}
            {entry.paymentMethod && (
              <div className="flex items-center justify-between rounded-xl bg-content2 px-4 py-3">
                <div className="flex items-center gap-2 text-default-500">
                  <CreditCard size={16} />
                  <span className="text-sm">Método de pago</span>
                </div>
                <span className="text-sm font-semibold text-foreground">
                  {entry.paymentMethod}
                </span>
              </div>
            )}

            {/* Reference */}
            {entry.reference && (
              <div className="flex items-center justify-between rounded-xl bg-content2 px-4 py-3">
                <div className="flex items-center gap-2 text-default-500">
                  <Hash size={16} />
                  <span className="text-sm">Referencia</span>
                </div>
                <span className="text-sm font-mono text-foreground">
                  {entry.reference}
                </span>
              </div>
            )}

            {/* Order Link */}
            {entry.order && (
              <div className="rounded-xl bg-primary/5 border border-primary/20 px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-primary">
                    <FileText size={16} />
                    <span className="text-sm font-semibold">Venta asociada</span>
                  </div>
                  <button
                    className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                    onClick={() => {
                      // Navigate to order detail - would need order number
                      window.open(`/sales/${entry.order}`, "_blank");
                    }}
                  >
                    Ver venta
                    <ExternalLink size={12} />
                  </button>
                </div>
                <p className="mt-1 text-xs text-default-400">
                  Este movimiento fue generado automáticamente desde una venta
                </p>
              </div>
            )}
          </div>

          {/* Notes */}
          {entry.notes && (
            <div className="rounded-xl bg-content2 px-4 py-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-default-500">
                Notas
              </p>
              <p className="text-sm text-foreground whitespace-pre-wrap">
                {entry.notes}
              </p>
            </div>
          )}

          {/* Entry Type Badge */}
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${colors.bg} ${colors.text}`}
            >
              {isSystemEntry ? "Generado automáticamente" : "Entrada manual"}
            </span>
          </div>
        </div>

        {/* Actions */}
        {canEdit && isManualEntry && (
          <div className="sticky bottom-0 border-t border-white/10 bg-content1 p-4">
            <div className="flex gap-2">
              {onEdit && (
                <button
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-content2 py-3 text-sm font-semibold text-foreground transition hover:bg-content2/80"
                  onClick={onEdit}
                >
                  <FileEdit size={16} />
                  Editar
                </button>
              )}
              {onDelete && (
                <button
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-danger/10 py-3 text-sm font-semibold text-danger transition hover:bg-danger/20 disabled:opacity-50"
                  disabled={isDeleting}
                  onClick={onDelete}
                >
                  {isDeleting ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <Trash2 size={16} />
                  )}
                  Eliminar
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
