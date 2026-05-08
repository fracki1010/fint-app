import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Loader2,
  Plus,
  Trash2,
  Calendar,
  FileText,
  Hash,
  X,
  User,
  Save,
} from "lucide-react";
import { Autocomplete, AutocompleteItem } from "@heroui/autocomplete";

import {
  useCreateQuote,
  useUpdateQuote,
  useQuote,
} from "@features/quotes/hooks/useQuotes";
import { useClients } from "@features/clients/hooks/useClients";
import { useAppToast } from "@features/notifications/components/AppToast";
import { formatCurrency } from "@shared/utils/currency";
import { getErrorMessage } from "@shared/utils/errors";

// ── Types ────────────────────────────────────────────────────────────

interface FormItem {
  product: string;
  quantity: string;
  price: string;
}

interface FormState {
  clientId: string;
  clientLabel: string;
  date: string;
  expirationDate: string;
  notes: string;
  items: FormItem[];
}

const todayISO = () => new Date().toISOString().slice(0, 10);

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function emptyItem(): FormItem {
  return { product: "", quantity: "1", price: "0" };
}

function createEmptyForm(): FormState {
  const today = todayISO();
  return {
    clientId: "",
    clientLabel: "",
    date: today,
    expirationDate: addDays(today, 30),
    notes: "",
    items: [emptyItem()],
  };
}

// ── Page component ───────────────────────────────────────────────────

export default function QuoteFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useAppToast();
  const isEditing = Boolean(id);

  const { quote, loading: quoteLoading } = useQuote(isEditing ? id : undefined);
  const { clients, loading: clientsLoading } = useClients();
  const createQuote = useCreateQuote();
  const updateQuote = useUpdateQuote();

  const [form, setForm] = useState<FormState>(createEmptyForm());
  const [saving, setSaving] = useState(false);

  // Populate form when quote loads (edit mode)
  useEffect(() => {
    if (isEditing && quote) {
      const clientId = typeof quote.client === "object" ? quote.client._id : quote.client;
      const clientLabel =
        typeof quote.client === "object" && quote.client
          ? quote.client.name || ""
          : "";
      setForm({
        clientId,
        clientLabel,
        date: quote.date.slice(0, 10),
        expirationDate: quote.expirationDate ? quote.expirationDate.slice(0, 10) : addDays(quote.date.slice(0, 10), 30),
        notes: quote.notes || "",
        items: quote.items.map((item) => ({
          product: item.product,
          quantity: String(item.quantity),
          price: String(item.price),
        })),
      });
    }
  }, [isEditing, quote]);

  // ── Computed totals ──────────────────────────────────────────────

  const itemsData = useMemo(() => {
    return form.items.map((item) => ({
      product: item.product,
      quantity: Number(item.quantity) || 0,
      price: Number(item.price) || 0,
      lineTotal: (Number(item.quantity) || 0) * (Number(item.price) || 0),
    }));
  }, [form.items]);

  const subtotal = itemsData.reduce((sum, it) => sum + it.lineTotal, 0);
  const tax = 0;
  const total = subtotal + tax;

  // ── Form helpers ─────────────────────────────────────────────────

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateItem = (idx: number, field: keyof FormItem, value: string) => {
    setForm((prev) => {
      const items = [...prev.items];
      items[idx] = { ...items[idx], [field]: value };
      return { ...prev, items };
    });
  };

  const addItem = () => {
    setForm((prev) => ({ ...prev, items: [...prev.items, emptyItem()] }));
  };

  const removeItem = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx),
    }));
  };

  // ── Submit ───────────────────────────────────────────────────────

  const handleSubmit = async () => {
    // Validation
    if (!form.clientId) {
      showToast({ variant: "warning", message: "Selecciona un cliente." });
      return;
    }
    const validItems = itemsData.filter((it) => it.product.trim() && it.quantity > 0);
    if (validItems.length === 0) {
      showToast({ variant: "warning", message: "Agrega al menos un item con producto, cantidad y precio." });
      return;
    }

    const payload = {
      client: form.clientId,
      date: form.date,
      expirationDate: form.expirationDate || undefined,
      items: validItems.map((it) => ({
        product: it.product,
        quantity: it.quantity,
        price: it.price,
        lineTotal: it.lineTotal,
      })),
      subtotal,
      tax,
      total,
      notes: form.notes || undefined,
    };

    setSaving(true);
    try {
      if (isEditing && id) {
        await updateQuote.mutateAsync({ id, data: payload });
        showToast({ variant: "success", message: "Presupuesto actualizado correctamente." });
      } else {
        await createQuote.mutateAsync(payload);
        showToast({ variant: "success", message: "Presupuesto creado correctamente." });
      }
      navigate("/quotes");
    } catch (error) {
      showToast({
        variant: "error",
        message: getErrorMessage(error, isEditing ? "Error al actualizar el presupuesto." : "Error al crear el presupuesto."),
      });
    } finally {
      setSaving(false);
    }
  };

  // ── Loading state (edit mode) ────────────────────────────────────

  if (isEditing && quoteLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-default-400">
          <Loader2 className="animate-spin" size={32} />
          <p className="text-sm font-medium">Cargando presupuesto...</p>
        </div>
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────────

  const formContent = (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-divider/10 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25">
            <FileText size={16} />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-default-400">
              Presupuestos
            </p>
            <h2 className="mt-0.5 text-lg font-semibold tracking-[-0.02em] text-foreground">
              {isEditing ? "Editar Presupuesto" : "Nuevo Presupuesto"}
            </h2>
          </div>
        </div>
        <button
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-divider/20 text-default-400 hover:bg-content2/60 hover:text-foreground transition-colors"
          onClick={() => navigate("/quotes")}
        >
          <X size={16} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
        {/* Client selector */}
        <div>
          <label className="block">
            <span className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-default-500">
              <User size={13} /> Cliente *
            </span>
            <Autocomplete
              aria-label="Seleccionar cliente"
              classNames={{
                base: "w-full",
                listboxWrapper: "bg-content1",
              }}
              defaultItems={clients}
              inputValue={form.clientLabel}
              isLoading={clientsLoading}
              placeholder="Buscar cliente..."
              variant="bordered"
              onInputChange={(v) => updateField("clientLabel", v)}
              onSelectionChange={(key) => {
                if (!key) return;
                const c = clients.find((cl) => cl._id === String(key));
                if (c) {
                  updateField("clientId", c._id);
                  updateField("clientLabel", c.name);
                }
              }}
            >
              {(item) => (
                <AutocompleteItem key={item._id}>{item.name}</AutocompleteItem>
              )}
            </Autocomplete>
          </label>
        </div>

        {/* Dates */}
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-default-500">
              <Calendar size={13} /> Fecha *
            </span>
            <input
              className="corp-input w-full rounded-2xl px-4 py-3 text-sm"
              type="date"
              value={form.date}
              onChange={(e) => updateField("date", e.target.value)}
            />
          </label>

          <label className="block">
            <span className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-default-500">
              <Calendar size={13} /> Vencimiento
            </span>
            <input
              className="corp-input w-full rounded-2xl px-4 py-3 text-sm"
              type="date"
              value={form.expirationDate}
              onChange={(e) => updateField("expirationDate", e.target.value)}
            />
          </label>
        </div>

        {/* Items */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-default-500">
              <Hash size={13} /> Items *
            </span>
            <button
              className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-3.5 py-1.5 text-[11px] font-bold text-blue-500 hover:bg-blue-500/20 transition-colors"
              type="button"
              onClick={addItem}
            >
              <Plus size={13} />
              Agregar línea
            </button>
          </div>

          <div className="space-y-3">
            {form.items.map((item, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 rounded-2xl border border-divider/15 bg-content2/30 p-3"
              >
                <div className="flex-1 min-w-0">
                  <input
                    className="corp-input w-full rounded-xl px-3 py-2 text-sm"
                    placeholder="Nombre del producto"
                    type="text"
                    value={item.product}
                    onChange={(e) => updateItem(idx, "product", e.target.value)}
                  />
                </div>
                <div className="w-20 shrink-0">
                  <input
                    className="corp-input w-full rounded-xl px-3 py-2 text-sm text-center font-mono"
                    min="0"
                    step="1"
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateItem(idx, "quantity", e.target.value)}
                  />
                </div>
                <div className="w-28 shrink-0">
                  <input
                    className="corp-input w-full rounded-xl px-3 py-2 text-sm font-mono"
                    min="0"
                    step="0.01"
                    type="number"
                    value={item.price}
                    onChange={(e) => updateItem(idx, "price", e.target.value)}
                  />
                </div>
                <div className="flex items-center justify-end w-24 shrink-0 pt-2 text-sm font-bold font-mono text-foreground">
                  {formatCurrency((Number(item.quantity) || 0) * (Number(item.price) || 0))}
                </div>
                <button
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-default-400 hover:bg-red-500/10 hover:text-red-500 transition-colors"
                  disabled={form.items.length <= 1}
                  onClick={() => removeItem(idx)}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          {/* Items column headers (for clarity) */}
          <div className="mt-1 flex text-[10px] text-default-400 px-1">
            <div className="flex-1 pl-1">Producto</div>
            <div className="w-20 text-center">Cant.</div>
            <div className="w-28 text-center">Precio</div>
            <div className="w-24 text-right pr-[52px]">Subtotal</div>
          </div>
        </div>

        {/* Notes */}
        <label className="block">
          <span className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-default-500">
            <FileText size={13} /> Notas
          </span>
          <textarea
            className="corp-input min-h-[72px] w-full rounded-2xl px-4 py-3 text-sm resize-none"
            placeholder="Notas del presupuesto..."
            value={form.notes}
            onChange={(e) => updateField("notes", e.target.value)}
          />
        </label>

        {/* Totals */}
        <div className="rounded-2xl border border-blue-500/15 bg-gradient-to-br from-blue-500/5 to-blue-600/5 p-5">
          <div className="flex justify-between text-sm text-default-500">
            <span>Subtotal</span>
            <span className="font-mono font-semibold text-foreground">{formatCurrency(subtotal)}</span>
          </div>
          <div className="mt-2 flex justify-between text-sm text-default-500">
            <span>Impuesto</span>
            <span className="font-mono font-semibold text-foreground">{formatCurrency(tax)}</span>
          </div>
          <div className="mt-3 flex justify-between border-t border-blue-500/15 pt-3 text-base font-bold text-foreground">
            <span>Total</span>
            <span className="font-mono">{formatCurrency(total)}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex shrink-0 gap-3 border-t border-divider/10 px-6 py-4">
        <button
          className="flex-1 rounded-2xl border border-divider/20 px-4 py-3 text-sm font-semibold text-default-600 hover:bg-content2/60 transition-colors"
          onClick={() => navigate("/quotes")}
        >
          Cancelar
        </button>
        <button
          className="flex-1 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 disabled:opacity-50 hover:shadow-blue-500/35 transition-all"
          disabled={saving}
          onClick={handleSubmit}
        >
          <span className="flex items-center justify-center gap-2">
            {saving && <Loader2 className="animate-spin" size={18} />}
            <Save size={16} />
            {isEditing ? "Guardar Cambios" : "Crear Presupuesto"}
          </span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-full w-full flex-col">
      {/* Desktop: full page */}
      <div className="hidden h-full flex-col lg:flex">
        {formContent}
      </div>

      {/* Mobile: full screen overlay */}
      <div className="fixed inset-0 z-[120] flex flex-col bg-background/95 backdrop-blur-sm lg:hidden">
        <div className="flex-1 overflow-hidden">
          {formContent}
        </div>
      </div>
    </div>
  );
}
