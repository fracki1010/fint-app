import { useState, useMemo, useEffect } from "react";
import {
  X,
  Wallet,
  AlertCircle,
  Check,
  DollarSign,
  CreditCard,
  FileText,
  Calendar,
  ArrowRight,
  Loader2,
} from "lucide-react";

import { ClientAccountEntry } from "@shared/types";
import { formatCurrency } from "@shared/utils/currency";
import { formatDateTime } from "@shared/utils/date";
import { Button } from "./Button";
import { Input } from "./Input";

interface PendingCharge extends ClientAccountEntry {
  remainingAmount: number;
  allocatedAmount: number;
  selected?: boolean;
  allocatedInPayment?: number;
}

interface PaymentAllocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  clientName: string;
  pendingCharges: PendingCharge[];
  currency: string;
  onAllocate: (data: {
    amount: number;
    paymentMethod?: string;
    reference?: string;
    notes?: string;
    allocations?: { entryId: string; amount: number }[];
  }) => Promise<void>;
  isLoading?: boolean;
}

const PAYMENT_METHODS = [
  { value: "cash", label: "Efectivo" },
  { value: "card", label: "Tarjeta" },
  { value: "transfer", label: "Transferencia" },
  { value: "check", label: "Cheque" },
  { value: "other", label: "Otro" },
];

export function PaymentAllocationModal({
  isOpen,
  onClose,
  clientId: _clientId,
  clientName,
  pendingCharges,
  currency,
  onAllocate,
  isLoading = false,
}: PaymentAllocationModalProps) {
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedCharges, setSelectedCharges] = useState<Set<string>>(new Set());
  const [manualAllocations, setManualAllocations] = useState<Map<string, string>>(new Map());
  const [allocationMode, setAllocationMode] = useState<"fifo" | "manual">("fifo");
  const [error, setError] = useState<string | null>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setPaymentAmount("");
      setPaymentMethod("cash");
      setReference("");
      setNotes("");
      setSelectedCharges(new Set());
      setManualAllocations(new Map());
      setAllocationMode("fifo");
      setError(null);
    }
  }, [isOpen]);

  const totalPending = useMemo(() => {
    return pendingCharges.reduce((sum, c) => sum + c.remainingAmount, 0);
  }, [pendingCharges]);

  const parsedPaymentAmount = useMemo(() => {
    const amount = parseFloat(paymentAmount);
    return isNaN(amount) ? 0 : amount;
  }, [paymentAmount]);

  // Calculate FIFO allocations
  const fifoAllocations = useMemo(() => {
    if (parsedPaymentAmount <= 0) return [];

    const allocations: { entryId: string; amount: number }[] = [];
    let remaining = parsedPaymentAmount;

    for (const charge of pendingCharges) {
      if (remaining <= 0) break;
      const allocAmount = Math.min(charge.remainingAmount, remaining);
      allocations.push({ entryId: charge._id, amount: allocAmount });
      remaining -= allocAmount;
    }

    return allocations;
  }, [parsedPaymentAmount, pendingCharges]);

  // Calculate manual allocations
  const manualAllocationTotal = useMemo(() => {
    let total = 0;
    for (const amount of manualAllocations.values()) {
      const val = parseFloat(amount);
      if (!isNaN(val)) total += val;
    }
    return total;
  }, [manualAllocations]);

  const allocatedTotal = useMemo(() => {
    if (allocationMode === "fifo") {
      return fifoAllocations.reduce((sum, a) => sum + a.amount, 0);
    }
    return manualAllocationTotal;
  }, [allocationMode, fifoAllocations, manualAllocationTotal]);

  const unallocatedAmount = useMemo(() => {
    return Math.max(0, parsedPaymentAmount - allocatedTotal);
  }, [parsedPaymentAmount, allocatedTotal]);

  const handleToggleCharge = (chargeId: string) => {
    setSelectedCharges((prev) => {
      const next = new Set(prev);
      if (next.has(chargeId)) {
        next.delete(chargeId);
        setManualAllocations((alloc) => {
          const nextAlloc = new Map(alloc);
          nextAlloc.delete(chargeId);
          return nextAlloc;
        });
      } else {
        next.add(chargeId);
        // Initialize with remaining amount or 0
        const charge = pendingCharges.find((c) => c._id === chargeId);
        if (charge) {
          setManualAllocations((alloc) => {
            const nextAlloc = new Map(alloc);
            nextAlloc.set(chargeId, String(charge.remainingAmount));
            return nextAlloc;
          });
        }
      }
      return next;
    });
  };

  const handleManualAllocationChange = (chargeId: string, value: string) => {
    setManualAllocations((prev) => {
      const next = new Map(prev);
      next.set(chargeId, value);
      return next;
    });
  };

  const handleSubmit = async () => {
    setError(null);

    if (parsedPaymentAmount <= 0) {
      setError("El monto del pago debe ser mayor a cero");
      return;
    }

    if (allocationMode === "manual" && selectedCharges.size === 0) {
      setError("Selecciona al menos un cargo para asignar el pago");
      return;
    }

    if (allocationMode === "manual") {
      // Validate manual allocations don't exceed remaining amounts
      for (const chargeId of selectedCharges) {
        const charge = pendingCharges.find((c) => c._id === chargeId);
        const allocAmount = parseFloat(manualAllocations.get(chargeId) || "0");
        if (charge && allocAmount > charge.remainingAmount) {
          setError(
            `El monto asignado al cargo excede el saldo pendiente de ${formatCurrency(
              charge.remainingAmount,
              currency
            )}`
          );
          return;
        }
      }
    }

    const allocations =
      allocationMode === "fifo"
        ? fifoAllocations
        : Array.from(selectedCharges)
            .map((chargeId) => ({
              entryId: chargeId,
              amount: parseFloat(manualAllocations.get(chargeId) || "0"),
            }))
            .filter((a) => a.amount > 0);

    try {
      await onAllocate({
        amount: parsedPaymentAmount,
        paymentMethod,
        reference: reference || undefined,
        notes: notes || undefined,
        allocations: allocations.length > 0 ? allocations : undefined,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al procesar el pago");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={!isLoading ? onClose : undefined}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 bg-content1 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-content1 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10 text-success">
              <Wallet size={20} />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Registrar Cobro
              </p>
              <p className="text-xs text-default-400">{clientName}</p>
            </div>
          </div>
          <button
            className="rounded-full p-2 text-default-400 transition hover:bg-content2 hover:text-foreground disabled:opacity-50"
            onClick={onClose}
            disabled={isLoading}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-danger/10 border border-danger/20 px-4 py-3 text-danger">
              <AlertCircle size={18} />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Payment Amount Section */}
          <div className="rounded-2xl border border-white/10 bg-content2 p-5 space-y-4">
            <div className="flex items-center gap-2 text-default-500 mb-2">
              <DollarSign size={16} />
              <span className="text-xs font-semibold uppercase tracking-widest">
                Monto del Pago
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Monto a pagar"
                value={paymentAmount}
                onChange={setPaymentAmount}
                placeholder="0.00"
                type="number"
                required
              />

              <div className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-default-500">
                  Método de pago
                </span>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="corp-input w-full px-4 py-3 text-sm"
                >
                  {PAYMENT_METHODS.map((method) => (
                    <option key={method.value} value={method.value}>
                      {method.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Referencia"
                value={reference}
                onChange={setReference}
                placeholder="Número de comprobante, etc."
              />

              <div className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-default-500">
                  Notas
                </span>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notas adicionales..."
                  className="corp-input w-full min-h-[44px] px-4 py-2.5 text-sm resize-none"
                  rows={1}
                />
              </div>
            </div>
          </div>

          {/* Pending Charges Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-default-500" />
                <span className="text-xs font-semibold uppercase tracking-widest text-default-500">
                  Cargos Pendientes
                </span>
                <span className="text-xs text-default-400">
                  ({pendingCharges.length} | Total: {formatCurrency(totalPending, currency)})
                </span>
              </div>

              {/* Allocation Mode Toggle */}
              <div className="flex items-center gap-2 bg-content2 rounded-lg p-1">
                <button
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
                    allocationMode === "fifo"
                      ? "bg-primary text-primary-foreground"
                      : "text-default-500 hover:text-foreground"
                  }`}
                  onClick={() => setAllocationMode("fifo")}
                >
                  Automático (FIFO)
                </button>
                <button
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
                    allocationMode === "manual"
                      ? "bg-primary text-primary-foreground"
                      : "text-default-500 hover:text-foreground"
                  }`}
                  onClick={() => setAllocationMode("manual")}
                >
                  Manual
                </button>
              </div>
            </div>

            {/* Charges List */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {pendingCharges.length === 0 ? (
                <div className="text-center py-8 text-default-400">
                  <Check size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No hay cargos pendientes</p>
                </div>
              ) : (
                pendingCharges.map((charge) => {
                  const isSelected = selectedCharges.has(charge._id);
                  const fifoAlloc = fifoAllocations.find(
                    (a) => a.entryId === charge._id
                  );
                  const isAllocated =
                    allocationMode === "fifo"
                      ? !!fifoAlloc && fifoAlloc.amount > 0
                      : isSelected;
                  const allocatedAmount =
                    allocationMode === "fifo"
                      ? fifoAlloc?.amount || 0
                      : parseFloat(manualAllocations.get(charge._id) || "0");

                  return (
                    <div
                      key={charge._id}
                      className={`rounded-xl border p-4 transition ${
                        isAllocated
                          ? "border-success/30 bg-success/5"
                          : "border-white/10 bg-content2"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {allocationMode === "manual" && (
                          <button
                            className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded border transition ${
                              isSelected
                                ? "border-success bg-success text-success-foreground"
                                : "border-default-400 hover:border-success"
                            }`}
                            onClick={() => handleToggleCharge(charge._id)}
                          >
                            {isSelected && <Check size={12} />}
                          </button>
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <Calendar size={14} className="text-default-400" />
                              <span className="text-sm text-foreground">
                                {formatDateTime(charge.date)}
                              </span>
                            </div>
                            <span className="text-sm font-semibold text-foreground">
                              {formatCurrency(charge.amount, currency)}
                            </span>
                          </div>

                          <div className="mt-1 flex items-center justify-between gap-2">
                            <span className="text-xs text-default-400">
                              Pendiente: {formatCurrency(charge.remainingAmount, currency)}
                            </span>
                            {charge.order && (
                              <span className="text-xs text-primary">
                                Venta #{charge.order}
                              </span>
                            )}
                          </div>

                          {/* Allocation Display */}
                          {isAllocated && (
                            <div className="mt-2 flex items-center gap-2 text-success">
                              <ArrowRight size={14} />
                              <span className="text-sm font-medium">
                                Asignar: {formatCurrency(allocatedAmount, currency)}
                              </span>
                            </div>
                          )}

                          {/* Manual Allocation Input */}
                          {allocationMode === "manual" && isSelected && (
                            <div className="mt-3">
                              <input
                                type="number"
                                value={manualAllocations.get(charge._id) || ""}
                                onChange={(e) =>
                                  handleManualAllocationChange(charge._id, e.target.value)
                                }
                                placeholder="Monto a asignar"
                                className="corp-input w-full max-w-[200px] px-3 py-2 text-sm"
                                max={charge.remainingAmount}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Summary */}
          {parsedPaymentAmount > 0 && (
            <div className="rounded-2xl border border-white/10 bg-content2 p-5">
              <div className="flex items-center gap-2 text-default-500 mb-3">
                <CreditCard size={16} />
                <span className="text-xs font-semibold uppercase tracking-widest">
                  Resumen
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-default-400">Monto del pago:</span>
                  <span className="font-semibold text-foreground">
                    {formatCurrency(parsedPaymentAmount, currency)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-default-400">Asignado a cargos:</span>
                  <span className="font-semibold text-success">
                    {formatCurrency(allocatedTotal, currency)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-default-400">Sin asignar:</span>
                  <span
                    className={`font-semibold ${
                      unallocatedAmount > 0 ? "text-warning" : "text-default-400"
                    }`}
                  >
                    {formatCurrency(unallocatedAmount, currency)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 border-t border-white/10 bg-content1 p-4">
          <div className="flex gap-3">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              onClick={handleSubmit}
              disabled={
                isLoading ||
                parsedPaymentAmount <= 0 ||
                (allocationMode === "manual" && selectedCharges.size === 0)
              }
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  Procesando...
                </>
              ) : (
                <>
                  <Check size={16} />
                  Confirmar Pago
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
