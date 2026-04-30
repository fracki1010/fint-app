import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  Loader2,
  X,
  ShoppingBag,
  ArrowUpRight,
  CheckCircle2,
  PackageCheck,
  XCircle,
  Trash2,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Drawer, DrawerBody, DrawerContent } from "@heroui/drawer";
import { Select, SelectItem } from "@heroui/select";
import { Autocomplete, AutocompleteItem } from "@heroui/autocomplete";

import {
  usePurchases,
  usePurchaseDetail,
  CreatePurchaseItemPayload,
} from "@/hooks/usePurchases";
import { useSupplies } from "@/hooks/useSupplies";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useIsDesktop } from "@/hooks/useIsDesktop";
import { useMobileHeaderCompact } from "@/hooks/useMobileHeaderCompact";
import { useSettings } from "@/hooks/useSettings";
import { PurchaseStatus, PaymentCondition } from "@/types";
import { useAppToast } from "@/components/AppToast";
import { formatCompactCurrency, formatCurrency } from "@/utils/currency";
import { getErrorMessage } from "@/utils/errors";

// ── Constants ─────────────────────────────────────────────────────────

const STATUS_LABELS: Record<PurchaseStatus, string> = {
  DRAFT: "Borrador",
  CONFIRMED: "Confirmada",
  RECEIVED: "Recibida",
  CANCELLED: "Cancelada",
};

const STATUS_COLORS: Record<PurchaseStatus, string> = {
  DRAFT: "bg-default/15 text-default-600",
  CONFIRMED: "bg-primary/15 text-primary",
  RECEIVED: "bg-success/15 text-success",
  CANCELLED: "bg-danger/15 text-danger",
};

const PAYMENT_LABELS: Record<PaymentCondition, string> = {
  CASH: "Contado",
  CREDIT: "Credito",
};

function getSupplierName(
  supplier: string | { _id: string; name?: string; company?: string },
) {
  if (typeof supplier === "object" && supplier) {
    return supplier.company || supplier.name || "Proveedor desconocido";
  }

  return "Proveedor desconocido";
}

function getSupplyName(
  supply: string | { _id: string; name?: string; sku?: string },
) {
  if (typeof supply === "object" && supply) {
    return supply.name || "Insumo";
  }

  return "Insumo";
}

// ── Line item form ────────────────────────────────────────────────────

type LineItem = {
  supplyId: string;
  supplyName: string;
  quantity: string;
  unitCost: string;
};

type PurchaseFormState = {
  supplierId: string;
  supplierLabel: string;
  date: string;
  paymentCondition: PaymentCondition;
  tax: string;
  notes: string;
  items: LineItem[];
};

const todayISO = () => new Date().toISOString().slice(0, 10);

const emptyForm: PurchaseFormState = {
  supplierId: "",
  supplierLabel: "",
  date: todayISO(),
  paymentCondition: "CASH",
  tax: "0",
  notes: "",
  items: [{ supplyId: "", supplyName: "", quantity: "", unitCost: "" }],
};

// ── Create Purchase Modal ────────────────────────────────────────────

function CreatePurchaseModal({
  isDesktop,
  onClose,
  onSubmit,
  submitting,
  suppliers,
  supplies,
  currency,
}: {
  isDesktop: boolean;
  onClose: () => void;
  onSubmit: (form: PurchaseFormState) => void;
  submitting: boolean;
  suppliers: Array<{ _id: string; name: string; company?: string }>;
  supplies: Array<{
    _id: string;
    name: string;
    sku?: string | null;
    referenceCost: number;
    unit: string;
  }>;
  currency: string;
}) {
  const [form, setForm] = useState<PurchaseFormState>({ ...emptyForm });

  const updateField = <K extends keyof PurchaseFormState>(
    key: K,
    value: PurchaseFormState[K],
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  const updateItem = (idx: number, field: keyof LineItem, value: string) => {
    setForm((prev) => {
      const items = [...prev.items];

      items[idx] = { ...items[idx], [field]: value };

      return { ...prev, items };
    });
  };

  const addLine = () =>
    setForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        { supplyId: "", supplyName: "", quantity: "", unitCost: "" },
      ],
    }));

  const removeLine = (idx: number) =>
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx),
    }));

  const subtotal = form.items.reduce(
    (sum, it) => sum + Number(it.quantity || 0) * Number(it.unitCost || 0),
    0,
  );
  const taxAmount = subtotal * (Number(form.tax || 0) / 100);
  const total = subtotal + taxAmount;

  const formLayout = (
    <div className="flex h-full flex-col overflow-x-hidden p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="section-kicker">Compras</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-foreground">
            Nueva orden de compra
          </h2>
        </div>
        <button
          className="app-panel-soft flex h-10 w-10 items-center justify-center rounded-2xl text-default-500"
          onClick={onClose}
        >
          <X size={18} />
        </button>
      </div>

      <div className="mt-6 grid flex-1 gap-5 overflow-y-auto pr-1 pb-4">
        {/* Supplier */}
        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-default-500">
            Proveedor *
          </span>
          <Autocomplete
            aria-label="Seleccionar proveedor"
            classNames={{
              base: "w-full",
              listboxWrapper: "bg-content1",
            }}
            defaultItems={suppliers}
            inputValue={form.supplierLabel}
            placeholder="Buscar proveedor..."
            variant="bordered"
            onInputChange={(v) => updateField("supplierLabel", v)}
            onSelectionChange={(key) => {
              if (!key) return;
              const s = suppliers.find((sup) => sup._id === String(key));

              if (s) {
                updateField("supplierId", s._id);
                updateField("supplierLabel", s.company || s.name);
              }
            }}
          >
            {(item) => (
              <AutocompleteItem key={item._id}>
                {item.company || item.name}
              </AutocompleteItem>
            )}
          </Autocomplete>
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-default-500">
              Fecha *
            </span>
            <input
              className="corp-input w-full rounded-2xl px-4 py-3 text-sm"
              type="date"
              value={form.date}
              onChange={(e) => updateField("date", e.target.value)}
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-default-500">
              Condicion de Pago
            </span>
            <Select
              aria-label="Condicion de pago"
              classNames={{
                trigger:
                  "corp-input min-h-[48px] rounded-2xl px-4 text-sm text-foreground",
                value: "text-foreground",
                popoverContent: "bg-content1 text-foreground",
              }}
              selectedKeys={[form.paymentCondition]}
              variant="bordered"
              onSelectionChange={(keys) =>
                updateField(
                  "paymentCondition",
                  Array.from(keys)[0] as PaymentCondition,
                )
              }
            >
              <SelectItem key="CASH">Contado</SelectItem>
              <SelectItem key="CREDIT">Credito</SelectItem>
            </Select>
          </label>
        </div>

        {/* Items */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-default-500">
              Items *
            </span>
            <button
              className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary"
              type="button"
              onClick={addLine}
            >
              <Plus size={14} />
              Linea
            </button>
          </div>

          <div className="space-y-3">
            {form.items.map((item, idx) => (
              <div key={idx} className="app-panel-soft rounded-[20px] p-4">
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <Autocomplete
                      aria-label="Insumo"
                      classNames={{
                        base: "w-full",
                        listboxWrapper: "bg-content1",
                      }}
                      defaultItems={supplies}
                      inputValue={item.supplyName}
                      placeholder="Buscar insumo..."
                      size="sm"
                      variant="bordered"
                      onInputChange={(v) => updateItem(idx, "supplyName", v)}
                      onSelectionChange={(key) => {
                        if (!key) return;
                        const s = supplies.find((sp) => sp._id === String(key));

                        if (s) {
                          updateItem(idx, "supplyId", s._id);
                          updateItem(idx, "supplyName", s.name);
                          if (!item.unitCost && s.referenceCost) {
                            updateItem(
                              idx,
                              "unitCost",
                              String(s.referenceCost),
                            );
                          }
                        }
                      }}
                    >
                      {(s) => (
                        <AutocompleteItem key={s._id}>
                          {s.name}
                          {s.sku ? ` (${s.sku})` : ""}
                        </AutocompleteItem>
                      )}
                    </Autocomplete>
                  </div>
                  {form.items.length > 1 && (
                    <button
                      className="mt-1 text-default-400 hover:text-danger"
                      type="button"
                      onClick={() => removeLine(idx)}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                <div className="mt-3 grid grid-cols-3 gap-3">
                  <label className="block">
                    <span className="mb-1 block text-[10px] font-semibold uppercase text-default-400">
                      Cantidad
                    </span>
                    <input
                      className="corp-input w-full rounded-xl px-3 py-2 text-sm"
                      min="0.01"
                      step="0.01"
                      type="number"
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(idx, "quantity", e.target.value)
                      }
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-[10px] font-semibold uppercase text-default-400">
                      Costo Unit.
                    </span>
                    <input
                      className="corp-input w-full rounded-xl px-3 py-2 text-sm"
                      min="0"
                      step="0.01"
                      type="number"
                      value={item.unitCost}
                      onChange={(e) =>
                        updateItem(idx, "unitCost", e.target.value)
                      }
                    />
                  </label>
                  <div>
                    <span className="mb-1 block text-[10px] font-semibold uppercase text-default-400">
                      Subtotal
                    </span>
                    <p className="rounded-xl bg-content2/60 px-3 py-2 text-sm font-semibold text-foreground">
                      {formatCurrency(
                        Number(item.quantity || 0) * Number(item.unitCost || 0),
                        currency,
                      )}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tax */}
        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-default-500">
            Impuesto (%)
          </span>
          <input
            className="corp-input w-full rounded-2xl px-4 py-3 text-sm"
            min="0"
            step="0.01"
            type="number"
            value={form.tax}
            onChange={(e) => updateField("tax", e.target.value)}
          />
        </label>

        {/* Notes */}
        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-default-500">
            Notas
          </span>
          <textarea
            className="corp-input min-h-16 w-full rounded-2xl px-4 py-3 text-sm"
            placeholder="Observaciones de la compra..."
            value={form.notes}
            onChange={(e) => updateField("notes", e.target.value)}
          />
        </label>

        {/* Totals summary */}
        <div className="app-panel-soft rounded-[20px] p-4">
          <div className="flex justify-between text-sm text-default-600">
            <span>Subtotal</span>
            <span className="font-semibold text-foreground">
              {formatCurrency(subtotal, currency)}
            </span>
          </div>
          <div className="mt-2 flex justify-between text-sm text-default-600">
            <span>Impuesto ({form.tax || 0}%)</span>
            <span className="font-semibold text-foreground">
              {formatCurrency(taxAmount, currency)}
            </span>
          </div>
          <div className="mt-3 flex justify-between border-t border-divider/60 pt-3 text-base font-bold text-foreground">
            <span>Total</span>
            <span>{formatCurrency(total, currency)}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 flex shrink-0 gap-3 border-t border-divider/70 pt-4">
        <button
          className="app-panel-soft flex-1 rounded-2xl px-4 py-3 text-sm font-semibold text-default-600"
          onClick={onClose}
        >
          Cancelar
        </button>
        <button
          className="flex-1 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          disabled={submitting}
          onClick={() => onSubmit(form)}
        >
          <span className="flex items-center justify-center gap-2">
            {submitting && <Loader2 className="animate-spin" size={18} />}
            Crear compra
          </span>
        </button>
      </div>
    </div>
  );

  if (!isDesktop) {
    return (
      <div className="fixed inset-0 z-[120] bg-black/45 backdrop-blur-[1px]">
        <div className="h-[100dvh] w-screen overflow-hidden bg-background">
          {formLayout}
        </div>
      </div>
    );
  }

  return (
    <Drawer
      hideCloseButton
      isOpen
      backdrop="opaque"
      placement="right"
      scrollBehavior="inside"
      size="xl"
      onOpenChange={(open: boolean) => {
        if (!open) onClose();
      }}
    >
      <DrawerContent className="h-screen w-full max-w-xl overflow-x-hidden rounded-none">
        <DrawerBody className="p-0">{formLayout}</DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────

export default function PurchasesPage() {
  const navigate = useNavigate();
  const { purchaseId } = useParams<{ purchaseId?: string }>();
  const isDesktop = useIsDesktop();
  const isHeaderCompact = useMobileHeaderCompact();
  const { settings } = useSettings();
  const currency = settings?.currency || "USD";
  const { showToast } = useAppToast();

  const {
    purchases,
    loading,
    createPurchase,
    confirmPurchase,
    receivePurchase,
    cancelPurchase,
    isCreating,
    isConfirming,
    isReceiving,
    isCancelling,
  } = usePurchases();

  const { purchase: detailPurchase, loading: detailLoading } =
    usePurchaseDetail(purchaseId);

  const { supplies } = useSupplies();
  const { suppliers } = useSuppliers();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | PurchaseStatus>(
    "all",
  );
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Selected purchase from list or detail endpoint
  const selectedPurchase =
    detailPurchase || purchases.find((p) => p._id === purchaseId) || null;

  const filteredPurchases = useMemo(() => {
    let result = purchases;

    if (activeFilter !== "all") {
      result = result.filter((p) => p.status === activeFilter);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();

      result = result.filter(
        (p) =>
          getSupplierName(p.supplier).toLowerCase().includes(q) ||
          p._id.toLowerCase().includes(q),
      );
    }

    return result;
  }, [purchases, searchQuery, activeFilter]);

  const totalPurchased = useMemo(
    () => purchases.reduce((sum, p) => sum + (p.total || 0), 0),
    [purchases],
  );

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};

    for (const p of purchases) {
      counts[p.status] = (counts[p.status] || 0) + 1;
    }

    return counts;
  }, [purchases]);

  // ── Handlers ──────────────────────────────────────────────────────

  const handleCreate = async (form: PurchaseFormState) => {
    if (!form.supplierId) {
      showToast({ variant: "warning", message: "Selecciona un proveedor." });

      return;
    }

    const validItems = form.items.filter(
      (it) =>
        it.supplyId && Number(it.quantity) > 0 && Number(it.unitCost) >= 0,
    );

    if (validItems.length === 0) {
      showToast({
        variant: "warning",
        message: "Agrega al menos un item con insumo, cantidad y costo.",
      });

      return;
    }

    const subtotal = validItems.reduce(
      (sum, it) => sum + Number(it.quantity) * Number(it.unitCost),
      0,
    );
    const taxAmount = subtotal * (Number(form.tax || 0) / 100);

    const items: CreatePurchaseItemPayload[] = validItems.map((it) => ({
      supplyItemId: it.supplyId,
      quantity: Number(it.quantity),
      unitCost: Number(it.unitCost),
      lineTotal: Number(it.quantity) * Number(it.unitCost),
    }));

    try {
      await createPurchase({
        supplierId: form.supplierId,
        date: form.date,
        paymentCondition: form.paymentCondition,
        subtotal,
        tax: taxAmount,
        total: subtotal + taxAmount,
        notes: form.notes,
        items,
      });
      setShowCreateModal(false);
      showToast({
        variant: "success",
        message: "Orden de compra creada como borrador.",
      });
    } catch (error) {
      showToast({
        variant: "error",
        message: getErrorMessage(error, "No se pudo crear la compra."),
      });
    }
  };

  const handleConfirm = async () => {
    if (!purchaseId) return;

    try {
      await confirmPurchase(purchaseId);
      showToast({ variant: "success", message: "Compra confirmada." });
    } catch (error) {
      showToast({
        variant: "error",
        message: getErrorMessage(error, "No se pudo confirmar."),
      });
    }
  };

  const handleReceive = async () => {
    if (!purchaseId) return;

    const confirmed = window.confirm(
      "Al recibir la compra se actualizara el stock de los insumos. ¿Continuar?",
    );

    if (!confirmed) return;

    try {
      await receivePurchase(purchaseId);
      showToast({
        variant: "success",
        message: "Compra recibida. Stock de insumos actualizado.",
      });
    } catch (error) {
      showToast({
        variant: "error",
        message: getErrorMessage(error, "No se pudo recibir la compra."),
      });
    }
  };

  const handleCancel = async () => {
    if (!purchaseId) return;

    const confirmed = window.confirm("¿Cancelar esta orden de compra?");

    if (!confirmed) return;

    try {
      await cancelPurchase(purchaseId);
      showToast({ variant: "success", message: "Compra cancelada." });
    } catch (error) {
      showToast({
        variant: "error",
        message: getErrorMessage(error, "No se pudo cancelar."),
      });
    }
  };

  // ── Detail view ───────────────────────────────────────────────────

  if (purchaseId) {
    const status = selectedPurchase?.status;

    return (
      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col bg-background pb-24 font-sans lg:max-w-none lg:pb-8">
        <header
          className={`app-topbar sticky top-0 z-30 border-b border-divider/60 bg-background/95 backdrop-blur-xl transition-all duration-300 ${
            isHeaderCompact ? "px-4 pb-3 pt-3" : "px-6 pb-4 pt-6"
          }`}
        >
          <button
            className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.14em] text-default-500"
            onClick={() => navigate("/purchases")}
          >
            <ArrowUpRight className="rotate-180" size={14} />
            Volver
          </button>
          <p
            className={`section-kicker transition-all duration-200 ${
              isHeaderCompact
                ? "mt-1 text-[10px] opacity-80"
                : "mt-3 opacity-100"
            }`}
          >
            Detalle de Compra
          </p>
          <h1
            className={`font-semibold tracking-[-0.03em] text-foreground transition-all duration-300 ${
              isHeaderCompact ? "mt-1 text-xl" : "mt-2 text-[28px]"
            }`}
          >
            OC #{purchaseId.slice(-6).toUpperCase()}
          </h1>
        </header>

        <div className="flex-1 px-6 pb-6">
          {detailLoading && !selectedPurchase ? (
            <div className="py-16 text-center text-default-400">
              <Loader2 className="mx-auto mb-3 animate-spin" size={32} />
              <p className="text-sm">Cargando detalle...</p>
            </div>
          ) : !selectedPurchase ? (
            <div className="py-12 text-center">
              <p className="text-sm font-semibold text-foreground">
                Compra no encontrada
              </p>
            </div>
          ) : (
            <>
              {/* Status badge */}
              <div className="mt-2 flex items-center gap-3">
                <span
                  className={`inline-flex rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-[0.12em] ${STATUS_COLORS[selectedPurchase.status]}`}
                >
                  {STATUS_LABELS[selectedPurchase.status]}
                </span>
                <span className="rounded-full bg-content2/70 px-3 py-1.5 text-xs font-semibold text-default-600">
                  {PAYMENT_LABELS[selectedPurchase.paymentCondition]}
                </span>
              </div>

              {/* KPI cards */}
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="app-panel-soft rounded-[24px] p-4">
                  <p className="section-kicker">Proveedor</p>
                  <p className="mt-3 text-lg font-semibold text-foreground">
                    {getSupplierName(selectedPurchase.supplier)}
                  </p>
                  <p className="mt-1 text-sm text-default-500">
                    {selectedPurchase.date}
                  </p>
                </div>
                <div className="app-panel-soft rounded-[24px] p-4">
                  <p className="section-kicker">Importe Total</p>
                  <p className="mt-3 text-2xl font-semibold text-foreground">
                    {formatCurrency(selectedPurchase.total, currency)}
                  </p>
                  <p className="mt-1 text-sm text-default-500">
                    {selectedPurchase.items.length} item(s)
                  </p>
                </div>
              </div>

              {/* Items */}
              <div className="mt-5 app-panel-soft rounded-[24px] p-5">
                <h3 className="text-sm font-semibold text-foreground">
                  Items de la compra
                </h3>
                <div className="mt-4 space-y-3">
                  {selectedPurchase.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-2xl bg-content2/55 px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {getSupplyName(item.supply)}
                        </p>
                        <p className="mt-1 text-xs text-default-500">
                          {item.quantity} x{" "}
                          {formatCurrency(item.unitCost, currency)}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-foreground">
                        {formatCurrency(item.lineTotal, currency)}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 space-y-1 border-t border-divider/60 pt-3 text-sm">
                  <div className="flex justify-between text-default-600">
                    <span>Subtotal</span>
                    <span>
                      {formatCurrency(selectedPurchase.subtotal, currency)}
                    </span>
                  </div>
                  <div className="flex justify-between text-default-600">
                    <span>Impuesto</span>
                    <span>
                      {formatCurrency(selectedPurchase.tax, currency)}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-foreground">
                    <span>Total</span>
                    <span>
                      {formatCurrency(selectedPurchase.total, currency)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedPurchase.notes && (
                <div className="mt-5 app-panel-soft rounded-[24px] p-5">
                  <h3 className="text-sm font-semibold text-foreground">
                    Notas
                  </h3>
                  <p className="mt-2 text-sm text-default-600">
                    {selectedPurchase.notes}
                  </p>
                </div>
              )}

              {/* Timestamps */}
              <div className="mt-5 app-panel-soft rounded-[24px] p-5">
                <h3 className="text-sm font-semibold text-foreground">
                  Historial
                </h3>
                <div className="mt-3 space-y-2 text-sm text-default-600">
                  {selectedPurchase.createdAt && (
                    <p>
                      <span className="font-semibold text-foreground">
                        Creada:
                      </span>{" "}
                      {new Date(selectedPurchase.createdAt).toLocaleString()}
                    </p>
                  )}
                  {selectedPurchase.receivedAt && (
                    <p>
                      <span className="font-semibold text-success">
                        Recibida:
                      </span>{" "}
                      {new Date(selectedPurchase.receivedAt).toLocaleString()}
                    </p>
                  )}
                  {selectedPurchase.cancelledAt && (
                    <p>
                      <span className="font-semibold text-danger">
                        Cancelada:
                      </span>{" "}
                      {new Date(selectedPurchase.cancelledAt).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>

              {/* Contextual actions */}
              <div className="mt-6 flex gap-3">
                {status === "DRAFT" && (
                  <>
                    <button
                      className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                      disabled={isConfirming}
                      onClick={handleConfirm}
                    >
                      {isConfirming ? (
                        <Loader2 className="animate-spin" size={18} />
                      ) : (
                        <CheckCircle2 size={18} />
                      )}
                      Confirmar
                    </button>
                    <button
                      className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-danger px-4 py-3 text-sm font-semibold text-danger-foreground disabled:opacity-50"
                      disabled={isCancelling}
                      onClick={handleCancel}
                    >
                      {isCancelling ? (
                        <Loader2 className="animate-spin" size={18} />
                      ) : (
                        <XCircle size={18} />
                      )}
                      Cancelar
                    </button>
                  </>
                )}
                {status === "CONFIRMED" && (
                  <>
                    <button
                      className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-success px-4 py-3 text-sm font-semibold text-success-foreground disabled:opacity-50"
                      disabled={isReceiving}
                      onClick={handleReceive}
                    >
                      {isReceiving ? (
                        <Loader2 className="animate-spin" size={18} />
                      ) : (
                        <PackageCheck size={18} />
                      )}
                      Recibir Mercaderia
                    </button>
                    <button
                      className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-danger px-4 py-3 text-sm font-semibold text-danger-foreground disabled:opacity-50"
                      disabled={isCancelling}
                      onClick={handleCancel}
                    >
                      {isCancelling ? (
                        <Loader2 className="animate-spin" size={18} />
                      ) : (
                        <XCircle size={18} />
                      )}
                      Cancelar
                    </button>
                  </>
                )}
                {(status === "RECEIVED" || status === "CANCELLED") && (
                  <div className="flex-1 rounded-2xl border border-divider/70 bg-content2/45 px-4 py-3 text-center text-xs text-default-500">
                    Esta compra ya fue{" "}
                    {status === "RECEIVED" ? "recibida" : "cancelada"} y no
                    admite mas acciones.
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // ── List view ─────────────────────────────────────────────────────

  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col overflow-hidden bg-background pb-24 font-sans lg:max-w-none lg:px-6 lg:pb-8">
      <header className="app-topbar px-6 pt-6 pb-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="section-kicker">Compras</div>
            <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.03em] text-foreground">
              Ordenes de Compra
            </h1>
            <p className="mt-2 text-sm text-default-500">
              Gestion de compras a proveedores e ingreso de mercaderia.
            </p>
          </div>
          <button
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[0_16px_34px_rgba(88,176,156,0.35)]"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus size={20} />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="app-panel rounded-[24px] p-4">
            <p className="section-kicker">Compras</p>
            <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-foreground">
              {purchases.length}
            </p>
          </div>
          <div className="app-panel rounded-[24px] p-4">
            <p className="section-kicker">Total Comprado</p>
            <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-foreground">
              {formatCompactCurrency(totalPurchased, currency)}
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
            placeholder="Buscar por proveedor o ID..."
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </header>

      {/* Filters */}
      <div className="px-6 py-5">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          {(
            [
              { key: "all" as const, label: "Todas" },
              { key: "DRAFT" as const, label: "Borrador" },
              { key: "CONFIRMED" as const, label: "Confirmadas" },
              { key: "RECEIVED" as const, label: "Recibidas" },
              { key: "CANCELLED" as const, label: "Canceladas" },
            ] as const
          ).map((filter) => {
            const count =
              filter.key === "all"
                ? purchases.length
                : statusCounts[filter.key] || 0;

            if (filter.key !== "all" && count === 0) return null;

            return (
              <button
                key={filter.key}
                className={`shrink-0 rounded-full px-5 py-2 text-[12px] font-semibold tracking-wide transition ${
                  activeFilter === filter.key
                    ? filter.key === "CANCELLED"
                      ? "bg-danger text-danger-foreground"
                      : "bg-primary text-primary-foreground"
                    : "app-panel-soft text-default-600"
                }`}
                onClick={() => setActiveFilter(filter.key)}
              >
                {filter.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 space-y-3 px-6 pb-6">
        {loading && purchases.length === 0 ? (
          <div className="app-panel rounded-[24px] py-12 text-center text-default-400">
            <Loader2 className="mx-auto mb-3 animate-spin" size={32} />
            <p className="text-sm font-medium">Cargando compras...</p>
          </div>
        ) : filteredPurchases.length > 0 ? (
          <>
            {/* Desktop table */}
            <div className="hidden lg:block">
              <div className="app-panel overflow-x-auto rounded-[24px] p-2">
                <table className="w-full min-w-[900px]">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-[0.16em] text-default-500">
                      <th className="px-3 pb-3 pt-2">OC</th>
                      <th className="px-3 pb-3 pt-2">Proveedor</th>
                      <th className="px-3 pb-3 pt-2">Fecha</th>
                      <th className="px-3 pb-3 pt-2">Estado</th>
                      <th className="px-3 pb-3 pt-2">Pago</th>
                      <th className="px-3 pb-3 pt-2 text-right">Total</th>
                      <th className="px-3 pb-3 pt-2 text-right">Accion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPurchases.map((purchase) => (
                      <tr
                        key={purchase._id}
                        className="cursor-pointer border-t border-divider/60"
                        onClick={() => navigate(`/purchases/${purchase._id}`)}
                      >
                        <td className="px-3 py-3 text-sm font-semibold text-foreground">
                          #{purchase._id.slice(-6).toUpperCase()}
                        </td>
                        <td className="px-3 py-3 text-sm text-default-600">
                          {getSupplierName(purchase.supplier)}
                        </td>
                        <td className="px-3 py-3 text-sm text-default-500">
                          {purchase.date}
                        </td>
                        <td className="px-3 py-3 text-sm">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] ${STATUS_COLORS[purchase.status]}`}
                          >
                            {STATUS_LABELS[purchase.status]}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-sm text-default-500">
                          {PAYMENT_LABELS[purchase.paymentCondition]}
                        </td>
                        <td className="px-3 py-3 text-right text-sm font-semibold text-foreground">
                          {formatCompactCurrency(purchase.total, currency)}
                        </td>
                        <td className="px-3 py-3 text-right text-sm text-primary">
                          Ver detalle
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile cards */}
            <div className="space-y-3 lg:hidden">
              {filteredPurchases.map((purchase) => (
                <button
                  key={purchase._id}
                  className="app-panel flex w-full items-start justify-between rounded-[26px] p-4 text-left"
                  onClick={() => navigate(`/purchases/${purchase._id}`)}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`flex h-14 w-14 items-center justify-center rounded-2xl ${
                        purchase.status === "CANCELLED"
                          ? "bg-danger/15 text-danger"
                          : purchase.status === "RECEIVED"
                            ? "bg-success/15 text-success"
                            : "bg-primary/12 text-primary"
                      }`}
                    >
                      <ShoppingBag size={22} />
                    </div>
                    <div>
                      <h3 className="text-[15px] font-semibold text-foreground">
                        {getSupplierName(purchase.supplier)}
                      </h3>
                      <p className="mt-0.5 text-[11px] uppercase tracking-[0.18em] text-default-400">
                        OC #{purchase._id.slice(-6).toUpperCase()} ·{" "}
                        {purchase.date}
                      </p>
                      <div className="mt-2 flex gap-2">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] ${STATUS_COLORS[purchase.status]}`}
                        >
                          {STATUS_LABELS[purchase.status]}
                        </span>
                        <span className="rounded-full bg-content2/70 px-2.5 py-1 text-[10px] font-semibold text-default-500">
                          {PAYMENT_LABELS[purchase.paymentCondition]}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-xs uppercase tracking-[0.16em] text-default-400">
                      Total
                    </p>
                    <p className="mt-1 text-[18px] font-semibold tracking-[-0.03em] text-foreground">
                      {formatCompactCurrency(purchase.total, currency)}
                    </p>
                    <ArrowUpRight
                      className="ml-auto mt-3 text-default-300"
                      size={18}
                    />
                  </div>
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="app-panel rounded-[24px] py-12 text-center text-default-400">
            <ShoppingBag className="mx-auto mb-4 h-16 w-16" />
            <p className="text-sm font-medium text-foreground">
              No hay compras para mostrar
            </p>
            <p className="mx-auto mt-2 max-w-xs text-sm text-default-500">
              {searchQuery || activeFilter !== "all"
                ? "No se encontraron compras con los filtros aplicados."
                : "Crea tu primera orden de compra."}
            </p>
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        className="fixed bottom-[100px] right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_16px_34px_rgba(88,176,156,0.35)] transition-transform hover:scale-105 active:scale-95"
        onClick={() => setShowCreateModal(true)}
      >
        <Plus size={26} strokeWidth={2.5} />
      </button>

      {/* Create modal */}
      {showCreateModal && (
        <CreatePurchaseModal
          suppliers={suppliers}
          currency={currency}
          isDesktop={isDesktop}
          submitting={isCreating}
          supplies={supplies}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreate}
        />
      )}
    </div>
  );
}
