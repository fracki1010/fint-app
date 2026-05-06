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
  Building2,
  Calendar,
  Hash,
  CreditCard,
  FileText,
  Clock,
  ChevronRight,
  Receipt,
  BadgeCheck,
  Truck,
  Ban,
  ScanBarcode,
} from "lucide-react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Drawer, DrawerBody, DrawerContent } from "@heroui/drawer";
import { Select, SelectItem } from "@heroui/select";
import { Autocomplete, AutocompleteItem } from "@heroui/autocomplete";
import { useBarcodeScanner } from "@/hooks/useBarcodeScanner";
import BarcodeScanner from "@/components/scanner/BarcodeScanner";

import {
  usePurchases,
  usePurchaseDetail,
  buildPurchaseItemsPayload,
} from "@/hooks/usePurchases";
import { useSupplies } from "@/hooks/useSupplies";
import { useProducts } from "@/hooks/useProducts";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useIsDesktop } from "@/hooks/useIsDesktop";
import { useMobileHeaderCompact } from "@/hooks/useMobileHeaderCompact";
import { useSettings } from "@/hooks/useSettings";
import { PurchaseStatus, PaymentCondition } from "@/types";
import { useAppToast } from "@/components/AppToast";
import { formatCompactCurrency, formatCurrency } from "@/utils/currency";
import { getErrorMessage } from "@/utils/errors";
import { PaginationBar } from "@/components/PaginationBar";

const STATUS_LABELS: Record<PurchaseStatus, string> = {
  DRAFT: "Borrador",
  CONFIRMED: "Confirmada",
  RECEIVED: "Recibida",
  CANCELLED: "Cancelada",
};

const STATUS_COLORS: Record<PurchaseStatus, string> = {
  DRAFT: "bg-amber-400/15 text-amber-500 dark:text-amber-400",
  CONFIRMED: "bg-blue-500/15 text-blue-500 dark:text-blue-400",
  RECEIVED: "bg-emerald-500/15 text-emerald-500 dark:text-emerald-400",
  CANCELLED: "bg-red-500/15 text-red-500 dark:text-red-400",
};

const STATUS_DOTS: Record<PurchaseStatus, string> = {
  DRAFT: "bg-amber-400",
  CONFIRMED: "bg-blue-500",
  RECEIVED: "bg-emerald-500",
  CANCELLED: "bg-red-500",
};

const PAYMENT_LABELS: Record<PaymentCondition, string> = {
  CASH: "Contado",
  CREDIT: "Crédito 30d",
};

const AVATAR_COLORS = [
  "from-blue-500/20 to-blue-600/10 text-blue-600 dark:text-blue-400",
  "from-emerald-500/20 to-emerald-600/10 text-emerald-600 dark:text-emerald-400",
  "from-amber-500/20 to-amber-600/10 text-amber-600 dark:text-amber-400",
  "from-violet-500/20 to-violet-600/10 text-violet-600 dark:text-violet-400",
  "from-rose-500/20 to-rose-600/10 text-rose-600 dark:text-rose-400",
];

function supplierInitials(name: string) {
  const words = name.split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function avatarColor(name: string) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffff;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

function expectedDelivery(purchase: { date: string; status: string; receivedAt?: string | null }) {
  if (purchase.status === "RECEIVED" && purchase.receivedAt) {
    return purchase.receivedAt.slice(0, 10);
  }
  const d = new Date(purchase.date);
  d.setDate(d.getDate() + 15);
  return d.toISOString().slice(0, 10);
}

function isToday(dateStr: string) {
  return dateStr === new Date().toISOString().slice(0, 10);
}

function getSupplierName(supplier: string | { _id: string; name?: string; company?: string }) {
  if (typeof supplier === "object" && supplier) {
    return supplier.company || supplier.name || "Proveedor desconocido";
  }
  return "Proveedor desconocido";
}

function getSupplierId(supplier: string | { _id: string; name?: string; company?: string }): string | null {
  if (typeof supplier === "object" && supplier) {
    return supplier._id;
  }
  return null;
}

function getSupplyName(supply: string | { _id: string; name?: string; sku?: string | null }) {
  if (typeof supply === "object" && supply) {
    return supply.name || "Insumo";
  }
  return "Insumo";
}

function getProductName(product: string | { _id: string; name?: string; sku?: string | null }) {
  if (typeof product === "object" && product) {
    return product.name || "Producto";
  }
  return "Producto";
}

function getItemName(item: { supply?: any; product?: any }) {
  if (item.product) return getProductName(item.product);
  return getSupplyName(item.supply as any);
}

function formatId(id: string) {
  return `#${id.slice(-6).toUpperCase()}`;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" });
}

type LineItem = {
  itemKind: "supply" | "product";
  supplyId: string;
  supplyName: string;
  productId: string;
  productName: string;
  purchaseUnit: string;
  purchaseEquivalentQty: string;
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
  items: [emptyLineItem()],
};

function emptyLineItem(): LineItem {
  return {
    itemKind: "supply",
    supplyId: "",
    supplyName: "",
    productId: "",
    productName: "",
    purchaseUnit: "",
    purchaseEquivalentQty: "1",
    quantity: "",
    unitCost: "",
  };
}

function CreatePurchaseModal({
  isDesktop,
  onClose,
  onSubmit,
  submitting,
  suppliers,
  supplies,
  products,
  currency,
  showToast,
}: {
  isDesktop: boolean;
  onClose: () => void;
  onSubmit: (form: PurchaseFormState) => void;
  submitting: boolean;
  suppliers: Array<{ _id: string; name: string; company?: string }>;
  supplies: Array<{ _id: string; name: string; sku?: string | null; referenceCost: number; unit: string }>;
  products: Array<{ _id: string; name: string; sku?: string; barcode?: string; type?: string; purchaseUnit?: string; purchaseEquivalentQty?: number; unitOfMeasure?: string }>;
  currency: string;
  showToast: (opts: { variant: "success" | "error" | "warning" | "info"; message: string }) => void;
}) {
  const [form, setForm] = useState<PurchaseFormState>({ ...emptyForm });
  const [showScanner, setShowScanner] = useState(false);

  const {
    state: scannerState,
    error: scannerError,
    setVideoContainer,
    stopCameraScanner,
    toggleCameraScanner,
    zoomSupported,
    zoomRange,
    zoomValue,
    applyZoom,
  } = useBarcodeScanner({
    onScan: (code: string) => {
      const upper = code.toUpperCase();
      const supply = supplies.find((s) => s.sku && s.sku.toUpperCase() === upper);
      if (supply) {
        setForm((prev) => {
          const items = [...prev.items];
          const emptyIdx = items.findIndex((it) => it.itemKind === "supply" && !it.supplyId);
          const idx = emptyIdx >= 0 ? emptyIdx : items.length;
          if (emptyIdx < 0) {
            items.push(emptyLineItem());
          }
          items[idx] = {
            ...items[idx],
            itemKind: "supply",
            supplyId: supply._id,
            supplyName: supply.name,
            quantity: "1",
            unitCost: String(supply.referenceCost || 0),
          };
          return { ...prev, items };
        });
        showToast({ variant: "success", message: `Insumo agregado: ${supply.name}` });
        setShowScanner(false);
        return;
      }
      const product = products.find((p) => (p.sku && p.sku.toUpperCase() === upper) || (p.barcode && p.barcode.toUpperCase() === upper));
      if (product) {
        setForm((prev) => {
          const items = [...prev.items];
          const emptyIdx = items.findIndex((it) => it.itemKind === "product" && !it.productId);
          const idx = emptyIdx >= 0 ? emptyIdx : items.length;
          if (emptyIdx < 0) {
            items.push(emptyLineItem());
          }
          items[idx] = {
            ...items[idx],
            itemKind: "product",
            productId: product._id,
            productName: product.name,
            purchaseUnit: product.purchaseUnit || "",
            purchaseEquivalentQty: String(product.purchaseEquivalentQty ?? 1),
            quantity: "1",
            unitCost: "",
          };
          return { ...prev, items };
        });
        showToast({ variant: "success", message: `Producto agregado: ${product.name}` });
        setShowScanner(false);
      } else {
        showToast({ variant: "warning", message: `No se encontró insumo o producto con SKU: ${code}` });
      }
    },
    onError: (err) => {
      showToast({ variant: "error", message: err.message || "Error al escanear" });
    },
  });

  const updateField = <K extends keyof PurchaseFormState>(key: K, value: PurchaseFormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const updateItem = (idx: number, field: keyof LineItem, value: string) => {
    setForm((prev) => {
      const items = [...prev.items];
      items[idx] = { ...items[idx], [field]: value };
      return { ...prev, items };
    });
  };

  const setItemKind = (idx: number, kind: "supply" | "product") => {
    setForm((prev) => {
      const items = [...prev.items];
      items[idx] = {
        ...items[idx],
        itemKind: kind,
        supplyId: kind === "product" ? "" : items[idx].supplyId,
        supplyName: kind === "product" ? "" : items[idx].supplyName,
        productId: kind === "supply" ? "" : items[idx].productId,
        productName: kind === "supply" ? "" : items[idx].productName,
        purchaseUnit: kind === "supply" ? "" : items[idx].purchaseUnit,
        purchaseEquivalentQty: kind === "supply" ? "1" : items[idx].purchaseEquivalentQty,
      };
      return { ...prev, items };
    });
  };

  const addLine = () =>
    setForm((prev) => ({
      ...prev,
      items: [...prev.items, emptyLineItem()],
    }));

  const removeLine = (idx: number) =>
    setForm((prev) => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }));

  const subtotal = form.items.reduce((sum, it) => sum + Number(it.quantity || 0) * Number(it.unitCost || 0), 0);
  const taxAmount = subtotal * (Number(form.tax || 0) / 100);
  const total = subtotal + taxAmount;

  const formLayout = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-divider/10 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25">
            <Receipt size={16} />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-default-400">Compras</p>
            <h2 className="mt-0.5 text-lg font-semibold tracking-[-0.02em] text-foreground">
              Nueva orden de compra
            </h2>
          </div>
        </div>
        <button
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-divider/20 text-default-400 hover:bg-content2/60 hover:text-foreground transition-colors"
          onClick={onClose}
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block">
              <span className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-default-500">
                <Building2 size={13} /> Proveedor *
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
                  <AutocompleteItem key={item._id}>{item.company || item.name}</AutocompleteItem>
                )}
              </Autocomplete>
            </label>
          </div>

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
              <CreditCard size={13} /> Condición de Pago
            </span>
            <Select
              aria-label="Condicion de pago"
              classNames={{
                trigger: "min-h-[48px] rounded-2xl border-divider/25 bg-content2/40 px-4 text-sm text-foreground data-[focus=true]:border-blue-500/50",
                value: "text-foreground",
                popoverContent: "bg-content1 text-foreground",
              }}
              selectedKeys={[form.paymentCondition]}
              variant="bordered"
              onSelectionChange={(keys) =>
                updateField("paymentCondition", Array.from(keys)[0] as PaymentCondition)
              }
            >
              <SelectItem key="CASH">Contado</SelectItem>
              <SelectItem key="CREDIT">Crédito</SelectItem>
            </Select>
          </label>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-default-500">
              <PackageCheck size={13} /> Items *
            </span>
            <div className="flex items-center gap-2">
              <button
                className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3.5 py-1.5 text-[11px] font-bold text-amber-500 hover:bg-amber-500/20 transition-colors"
                type="button"
                onClick={() => setShowScanner(true)}
              >
                <ScanBarcode size={13} />
                Escanear SKU
              </button>
              <button
                className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-3.5 py-1.5 text-[11px] font-bold text-blue-500 hover:bg-blue-500/20 transition-colors"
                type="button"
                onClick={addLine}
              >
                <Plus size={13} />
                Agregar línea
              </button>
            </div>
          </div>
          <div className="space-y-3">
            {form.items.map((item, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-divider/15 bg-content2/30 p-4 transition-all hover:border-divider/25"
              >
                {/* Tipo selector */}
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-default-400">Tipo</span>
                  <div className="flex rounded-xl bg-content3/50 p-0.5">
                    <button
                      className={`rounded-lg px-3 py-1 text-[11px] font-bold transition-all ${
                        item.itemKind === "supply"
                          ? "bg-blue-500 text-white shadow-sm"
                          : "text-default-500 hover:text-foreground"
                      }`}
                      type="button"
                      onClick={() => setItemKind(idx, "supply")}
                    >
                      Insumo
                    </button>
                    <button
                      className={`rounded-lg px-3 py-1 text-[11px] font-bold transition-all ${
                        item.itemKind === "product"
                          ? "bg-blue-500 text-white shadow-sm"
                          : "text-default-500 hover:text-foreground"
                      }`}
                      type="button"
                      onClick={() => setItemKind(idx, "product")}
                    >
                      Producto
                    </button>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    {item.itemKind === "supply" ? (
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
                              updateItem(idx, "unitCost", String(s.referenceCost));
                            }
                          }
                        }}
                      >
                        {(s) => (
                          <AutocompleteItem key={s._id}>
                            {s.name}{s.sku ? ` (${s.sku})` : ""}
                          </AutocompleteItem>
                        )}
                      </Autocomplete>
                    ) : (
                      <Autocomplete
                        aria-label="Producto"
                        classNames={{
                          base: "w-full",
                          listboxWrapper: "bg-content1",
                        }}
                        defaultItems={products.filter(
                          (p) => !p.type || p.type === "raw_material" || p.type === "both",
                        )}
                        inputValue={item.productName}
                        placeholder="Buscar producto..."
                        size="sm"
                        variant="bordered"
                        onInputChange={(v) => updateItem(idx, "productName", v)}
                        onSelectionChange={(key) => {
                          if (!key) return;
                          const p = products.find((pr) => pr._id === String(key));
                          if (p) {
                            updateItem(idx, "productId", p._id);
                            updateItem(idx, "productName", p.name);
                            updateItem(idx, "purchaseUnit", p.purchaseUnit || "");
                            updateItem(idx, "purchaseEquivalentQty", String(p.purchaseEquivalentQty ?? 1));
                          }
                        }}
                      >
                        {(p) => (
                          <AutocompleteItem key={p._id}>
                            {p.name}{p.sku ? ` (${p.sku})` : ""}{p.barcode ? ` · ${p.barcode}` : ""}
                          </AutocompleteItem>
                        )}
                      </Autocomplete>
                    )}
                  </div>
                  {form.items.length > 1 && (
                    <button
                      className="mt-1.5 flex h-8 w-8 items-center justify-center rounded-lg text-default-400 hover:bg-red-500/10 hover:text-red-500 transition-colors"
                      type="button"
                      onClick={() => removeLine(idx)}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                {/* Product info (when product selected) */}
                {item.itemKind === "product" && item.productId && (
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 rounded-xl bg-blue-500/5 px-3 py-2 text-[11px] text-default-500">
                    <span>
                      <strong>Unidad de compra:</strong> {item.purchaseUnit || "unidad"}
                    </span>
                    <span>
                      <strong>Equivalencia:</strong> 1 {item.purchaseUnit || "unidad"} ={" "}
                      {item.purchaseEquivalentQty || "1"} ud. base
                    </span>
                    {Number(item.unitCost) > 0 && Number(item.purchaseEquivalentQty) > 0 && (
                      <span>
                        <strong>Costo x ud. base:</strong>{" "}
                        {formatCurrency(Number(item.unitCost) / Number(item.purchaseEquivalentQty), currency)}
                      </span>
                    )}
                  </div>
                )}

                <div className="mt-3 grid grid-cols-3 gap-3">
                  <label className="block">
                    <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.1em] text-default-400">
                      {item.itemKind === "product" && item.purchaseUnit
                        ? `Cant. (${item.purchaseUnit})`
                        : "Cant."}
                    </span>
                    <input
                      className="corp-input w-full rounded-xl px-3 py-2 text-sm font-mono"
                      min="0.01"
                      step="0.01"
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(idx, "quantity", e.target.value)}
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.1em] text-default-400">
                      {item.itemKind === "product" && item.purchaseUnit
                        ? `Costo x ${item.purchaseUnit}`
                        : "Costo Unit."}
                    </span>
                    <input
                      className="corp-input w-full rounded-xl px-3 py-2 text-sm font-mono"
                      min="0"
                      step="0.01"
                      type="number"
                      value={item.unitCost}
                      onChange={(e) => updateItem(idx, "unitCost", e.target.value)}
                    />
                  </label>
                  <div>
                    <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.1em] text-default-400">Subtotal</span>
                    <p className="rounded-xl bg-blue-500/5 px-3 py-2 text-sm font-mono font-semibold text-foreground">
                      {formatCurrency(Number(item.quantity || 0) * Number(item.unitCost || 0), currency)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <label className="block">
          <span className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-default-500">
            <Hash size={13} /> Impuesto (%)
          </span>
          <input
            className="corp-input w-full rounded-2xl px-4 py-3 text-sm font-mono"
            min="0"
            step="0.01"
            type="number"
            value={form.tax}
            onChange={(e) => updateField("tax", e.target.value)}
          />
        </label>

        <label className="block">
          <span className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-default-500">
            <FileText size={13} /> Notas
          </span>
          <textarea
            className="corp-input min-h-[72px] w-full rounded-2xl px-4 py-3 text-sm resize-none"
            placeholder="Observaciones de la compra..."
            value={form.notes}
            onChange={(e) => updateField("notes", e.target.value)}
          />
        </label>

        <div className="rounded-2xl border border-blue-500/15 bg-gradient-to-br from-blue-500/5 to-blue-600/5 p-5">
          <div className="flex justify-between text-sm text-default-500">
            <span>Subtotal</span>
            <span className="font-mono font-semibold text-foreground">{formatCurrency(subtotal, currency)}</span>
          </div>
          <div className="mt-2 flex justify-between text-sm text-default-500">
            <span>Impuesto ({form.tax || 0}%)</span>
            <span className="font-mono font-semibold text-foreground">{formatCurrency(taxAmount, currency)}</span>
          </div>
          <div className="mt-3 flex justify-between border-t border-blue-500/15 pt-3 text-base font-bold text-foreground">
            <span>Total</span>
            <span className="font-mono">{formatCurrency(total, currency)}</span>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 gap-3 border-t border-divider/10 px-6 py-4">
        <button
          className="flex-1 rounded-2xl border border-divider/20 px-4 py-3 text-sm font-semibold text-default-600 hover:bg-content2/60 transition-colors"
          onClick={onClose}
        >
          Cancelar
        </button>
        <button
          className="flex-1 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 disabled:opacity-50 hover:shadow-blue-500/35 transition-all"
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
      <div className="fixed inset-0 z-[120] flex flex-col bg-background/95 backdrop-blur-sm">
        <div className="flex-1 overflow-hidden">{formLayout}</div>
      </div>
    );
  }

  return (
    <>
      {!isDesktop ? (
        <div className="fixed inset-0 z-[120] flex flex-col bg-background/95 backdrop-blur-sm">
          <div className="flex-1 overflow-hidden">{formLayout}</div>
        </div>
      ) : (
        <Drawer
          hideCloseButton
          isOpen
          backdrop="opaque"
          placement="right"
          scrollBehavior="inside"
          size="xl"
          onOpenChange={(open: boolean) => { if (!open) onClose(); }}
        >
          <DrawerContent className="h-[100dvh] w-full max-w-xl overflow-x-hidden rounded-none bg-content1">
            <DrawerBody className="p-0">{formLayout}</DrawerBody>
          </DrawerContent>
        </Drawer>
      )}
      <BarcodeScanner
        error={scannerError}
        isOpen={showScanner}
        setVideoContainer={setVideoContainer}
        state={scannerState}
        onClose={() => {
          stopCameraScanner();
          setShowScanner(false);
        }}
        onScan={() => {}}
        onToggle={toggleCameraScanner}
        zoomSupported={zoomSupported}
        zoomRange={zoomRange}
        zoomValue={zoomValue}
        onZoomChange={applyZoom}
      />
    </>
  );
}

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

  const { purchase: detailPurchase, loading: detailLoading } = usePurchaseDetail(purchaseId);
  const { supplies } = useSupplies();
  const { products } = useProducts();
  const { suppliers } = useSuppliers();

  const DESKTOP_PAGE_SIZE = 15;
  const [desktopPage, setDesktopPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | PurchaseStatus>("all");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const selectedPurchase = detailPurchase || purchases.find((p) => p._id === purchaseId) || null;

  const filteredPurchases = useMemo(() => {
    let result = purchases;
    if (activeFilter !== "all") result = result.filter((p) => p.status === activeFilter);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) => getSupplierName(p.supplier).toLowerCase().includes(q) || p._id.toLowerCase().includes(q),
      );
    }
    return result;
  }, [purchases, searchQuery, activeFilter]);

  useEffect(() => { setDesktopPage(1); }, [searchQuery, activeFilter]);

  const desktopItems = isDesktop
    ? filteredPurchases.slice((desktopPage - 1) * DESKTOP_PAGE_SIZE, desktopPage * DESKTOP_PAGE_SIZE)
    : filteredPurchases;
  const desktopTotalPages = Math.ceil(filteredPurchases.length / DESKTOP_PAGE_SIZE);

  const totalPurchased = useMemo(() => purchases.reduce((sum, p) => sum + (p.total || 0), 0), [purchases]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of purchases) counts[p.status] = (counts[p.status] || 0) + 1;
    return counts;
  }, [purchases]);

  const monthStats = useMemo(() => {
    const now = new Date();
    const thisM = now.getMonth(), thisY = now.getFullYear();
    const prevM = thisM === 0 ? 11 : thisM - 1;
    const prevY = thisM === 0 ? thisY - 1 : thisY;
    let thisTotal = 0, thisCount = 0, prevTotal = 0, prevCount = 0;
    const byMonth = new Map<string, number>();
    for (const p of purchases) {
      const d = new Date(p.date);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      byMonth.set(key, (byMonth.get(key) || 0) + (p.total || 0));
      if (d.getMonth() === thisM && d.getFullYear() === thisY) { thisTotal += p.total || 0; thisCount++; }
      else if (d.getMonth() === prevM && d.getFullYear() === prevY) { prevTotal += p.total || 0; prevCount++; }
    }
    const countDelta = prevCount > 0 ? ((thisCount - prevCount) / prevCount) * 100 : 0;
    const costDelta = prevTotal > 0 ? ((thisTotal - prevTotal) / prevTotal) * 100 : 0;
    const monthlyAvg = byMonth.size > 0
      ? Array.from(byMonth.values()).reduce((a, b) => a + b, 0) / byMonth.size
      : 0;
    const pending = statusCounts["CONFIRMED"] || 0;
    const received = statusCounts["RECEIVED"] || 0;
    const pendingPct = pending + received > 0 ? Math.round((pending / (pending + received)) * 100) : 0;
    return { countDelta, costDelta, monthlyAvg, pending, pendingPct };
  }, [purchases, statusCounts]);

  const handleCreate = async (form: PurchaseFormState) => {
    if (!form.supplierId) {
      showToast({ variant: "warning", message: "Selecciona un proveedor." });
      return;
    }
    const items = buildPurchaseItemsPayload(form.items);
    if (items.length === 0) {
      showToast({ variant: "warning", message: "Agrega al menos un item con insumo/producto, cantidad y costo." });
      return;
    }
    const subtotal = items.reduce((sum, it) => sum + it.quantity * it.unitCost, 0);
    const taxAmount = subtotal * (Number(form.tax || 0) / 100);
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
      showToast({ variant: "success", message: "Orden de compra creada como borrador." });
    } catch (error) {
      showToast({ variant: "error", message: getErrorMessage(error, "No se pudo crear la compra.") });
    }
  };

  const handleConfirm = async () => {
    if (!purchaseId) return;
    try {
      await confirmPurchase(purchaseId);
      showToast({ variant: "success", message: "Compra confirmada." });
    } catch (error) {
      showToast({ variant: "error", message: getErrorMessage(error, "No se pudo confirmar.") });
    }
  };

  const handleReceive = async () => {
    if (!purchaseId) return;
    const confirmed = window.confirm("Al recibir la compra se actualizará el stock de insumos y productos. ¿Continuar?");
    if (!confirmed) return;
    try {
      await receivePurchase(purchaseId);
      showToast({ variant: "success", message: "Compra recibida. Stock de insumos actualizado." });
    } catch (error) {
      showToast({ variant: "error", message: getErrorMessage(error, "No se pudo recibir la compra.") });
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
      showToast({ variant: "error", message: getErrorMessage(error, "No se pudo cancelar.") });
    }
  };

  // ── Detail view ───────────────────────────────────────────────────

  if (purchaseId) {
    const status = selectedPurchase?.status;

    return (
      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col bg-background pb-28 font-sans lg:max-w-4xl lg:pb-8">
        <header
          className={`app-topbar sticky top-0 z-30 transition-all duration-300 ${
            isHeaderCompact ? "px-4 pb-3 pt-3" : "px-6 pb-4 pt-6"
          }`}
        >
          <button
            className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-default-500 hover:text-foreground transition-colors"
            onClick={() => navigate("/purchases")}
          >
            <ArrowUpRight className="rotate-180" size={14} />
            Volver
          </button>
          <p className={`section-kicker transition-all duration-200 ${isHeaderCompact ? "mt-1 text-[10px] opacity-80" : "mt-3 opacity-100"}`}>
            Detalle de Compra
          </p>
          <h1 className={`font-bold tracking-[-0.03em] text-foreground transition-all duration-300 ${
            isHeaderCompact ? "mt-1 text-xl" : "mt-2 text-[28px]"
          }`}>
            {formatId(purchaseId)}
          </h1>
        </header>

        <div className="flex-1 px-6 pb-28">
          {detailLoading && !selectedPurchase ? (
            <div className="flex flex-col items-center justify-center py-20 text-default-400">
              <Loader2 className="mb-4 animate-spin" size={32} />
              <p className="text-sm font-medium">Cargando detalle...</p>
            </div>
          ) : !selectedPurchase ? (
            <div className="flex flex-col items-center justify-center py-20">
              <ShoppingBag className="mb-4 text-default-300" size={48} />
              <p className="text-sm font-semibold text-foreground">Compra no encontrada</p>
            </div>
          ) : (
            <div className="space-y-5 pt-4">
              {/* Status & payment badges */}
              <div className="flex items-center gap-3">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.1em] ${STATUS_COLORS[selectedPurchase.status]}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOTS[selectedPurchase.status]}`} />
                  {STATUS_LABELS[selectedPurchase.status]}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-default-100 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-default-600">
                  <CreditCard size={12} />
                  {PAYMENT_LABELS[selectedPurchase.paymentCondition]}
                </span>
              </div>

              {/* KPI cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-divider/15 bg-gradient-to-br from-content1 to-content2/60 p-5">
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-default-400">
                    <Building2 size={13} />
                    Proveedor
                  </div>
                  {(() => {
                    const supplierId = getSupplierId(selectedPurchase.supplier);
                    const supplierName = getSupplierName(selectedPurchase.supplier);
                    return supplierId ? (
                      <Link
                        className="mt-3 block text-lg font-bold text-foreground hover:text-primary transition-colors"
                        to={`/supplier-account/${supplierId}`}
                      >
                        {supplierName}
                        <span className="ml-1.5 text-[10px] font-normal text-primary opacity-0 hover:opacity-100 transition-opacity">→ Ver cuenta</span>
                      </Link>
                    ) : (
                      <p className="mt-3 text-lg font-bold text-foreground">{supplierName}</p>
                    );
                  })()}
                  <div className="mt-2 flex items-center gap-1.5 text-[11px] text-default-500">
                    <Calendar size={11} />
                    {formatDate(selectedPurchase.date)}
                  </div>
                </div>
                <div className="rounded-2xl border border-blue-500/15 bg-gradient-to-br from-blue-500/5 to-blue-600/5 p-5">
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-default-400">
                    <Receipt size={13} />
                    Importe Total
                  </div>
                  <p className="mt-3 text-2xl font-bold font-mono text-foreground">
                    {formatCurrency(selectedPurchase.total, currency)}
                  </p>
                  <p className="mt-2 text-[11px] text-default-500">
                    {selectedPurchase.items.length} item{selectedPurchase.items.length !== 1 ? "s" : ""}
                    {" · "}{formatCurrency(selectedPurchase.subtotal, currency)} subtotal
                  </p>
                </div>
              </div>

              {/* Items */}
              <div className="rounded-2xl border border-divider/15 bg-gradient-to-br from-content1 to-content2/40 p-5">
                <h3 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-default-500">
                  <PackageCheck size={13} />
                  Items de la compra
                </h3>
                <div className="mt-4 space-y-2">
                  {selectedPurchase.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-xl bg-content2/50 px-4 py-3 transition-colors hover:bg-content2/80"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {getItemName(item)}
                        </p>
                        <p className="mt-0.5 text-xs text-default-500 font-mono">
                          {item.quantity} × {formatCurrency(item.unitCost, currency)}
                        </p>
                      </div>
                      <p className="ml-4 text-sm font-bold font-mono text-foreground">
                        {formatCurrency(item.lineTotal, currency)}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 space-y-1.5 border-t border-divider/10 pt-4 text-sm">
                  <div className="flex justify-between text-default-500">
                    <span>Subtotal</span>
                    <span className="font-mono font-semibold text-foreground">
                      {formatCurrency(selectedPurchase.subtotal, currency)}
                    </span>
                  </div>
                  <div className="flex justify-between text-default-500">
                    <span>Impuesto</span>
                    <span className="font-mono font-semibold text-foreground">
                      {formatCurrency(selectedPurchase.tax, currency)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-divider/10 pt-1.5 text-base font-bold text-foreground">
                    <span>Total</span>
                    <span className="font-mono">{formatCurrency(selectedPurchase.total, currency)}</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedPurchase.notes && (
                <div className="rounded-2xl border border-divider/15 bg-gradient-to-br from-content1 to-content2/40 p-5">
                  <h3 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-default-500">
                    <FileText size={13} />
                    Notas
                  </h3>
                  <p className="mt-3 text-sm text-default-600 leading-relaxed">{selectedPurchase.notes}</p>
                </div>
              )}

              {/* Timeline history */}
              <div className="rounded-2xl border border-divider/15 bg-gradient-to-br from-content1 to-content2/40 p-5">
                <h3 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-default-500">
                  <Clock size={13} />
                  Historial
                </h3>
                <div className="mt-4 space-y-0">
                  {selectedPurchase.createdAt && (
                    <div className="flex gap-4 pb-4 relative">
                      <div className="flex flex-col items-center">
                        <div className="z-10 flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/15 text-blue-500">
                          <FileText size={13} />
                        </div>
                        <div className="mt-0 w-px flex-1 bg-divider/20" />
                      </div>
                      <div className="pb-2">
                        <p className="text-sm font-semibold text-foreground">Orden creada</p>
                        <p className="mt-0.5 text-xs text-default-500">
                          {new Date(selectedPurchase.createdAt).toLocaleString("es-AR", {
                            day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  )}
                  {selectedPurchase.status === "CONFIRMED" && selectedPurchase.createdAt && (
                    <div className="flex gap-4 pb-4 relative">
                      <div className="flex flex-col items-center">
                        <div className="z-10 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-500">
                          <BadgeCheck size={13} />
                        </div>
                        <div className="mt-0 w-px flex-1 bg-divider/20" />
                      </div>
                      <div className="pb-2">
                        <p className="text-sm font-semibold text-foreground">Compra confirmada</p>
                        <p className="mt-0.5 text-xs text-blue-500 font-medium">Pendiente de recepción</p>
                      </div>
                    </div>
                  )}
                  {selectedPurchase.receivedAt && (
                    <div className="flex gap-4 pb-4 relative">
                      <div className="flex flex-col items-center">
                        <div className="z-10 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-500">
                          <Truck size={13} />
                        </div>
                        <div className="mt-0 w-px flex-1 bg-divider/20" />
                      </div>
                      <div className="pb-2">
                        <p className="text-sm font-semibold text-foreground">Mercadería recibida</p>
                        <p className="mt-0.5 text-xs text-default-500">
                          {new Date(selectedPurchase.receivedAt).toLocaleString("es-AR", {
                            day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  )}
                  {selectedPurchase.cancelledAt && (
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="z-10 flex h-8 w-8 items-center justify-center rounded-full bg-red-500/15 text-red-500">
                          <Ban size={13} />
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">Compra cancelada</p>
                        <p className="mt-0.5 text-xs text-default-500">
                          {new Date(selectedPurchase.cancelledAt).toLocaleString("es-AR", {
                            day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Contextual actions */}
              <div className="flex gap-3 pt-1">
                {status === "DRAFT" && (
                  <>
                    <button
                      className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-500/25 disabled:opacity-50 hover:shadow-blue-500/35 transition-all"
                      disabled={isConfirming}
                      onClick={handleConfirm}
                    >
                      {isConfirming ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                      Confirmar
                    </button>
                    <button
                      className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-red-500/25 disabled:opacity-50 hover:shadow-red-500/35 transition-all"
                      disabled={isCancelling}
                      onClick={handleCancel}
                    >
                      {isCancelling ? <Loader2 className="animate-spin" size={18} /> : <XCircle size={18} />}
                      Cancelar
                    </button>
                  </>
                )}
                {status === "CONFIRMED" && (
                  <>
                    <button
                      className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/25 disabled:opacity-50 hover:shadow-emerald-500/35 transition-all"
                      disabled={isReceiving}
                      onClick={handleReceive}
                    >
                      {isReceiving ? <Loader2 className="animate-spin" size={18} /> : <PackageCheck size={18} />}
                      Recibir
                    </button>
                    <button
                      className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-red-500/25 disabled:opacity-50 hover:shadow-red-500/35 transition-all"
                      disabled={isCancelling}
                      onClick={handleCancel}
                    >
                      {isCancelling ? <Loader2 className="animate-spin" size={18} /> : <XCircle size={18} />}
                      Cancelar
                    </button>
                  </>
                )}
                {(status === "RECEIVED" || status === "CANCELLED") && (
                  <div className="flex-1 rounded-2xl border border-divider/20 bg-content2/40 px-4 py-3.5 text-center text-xs text-default-500">
                    Esta compra ya fue {status === "RECEIVED" ? "recibida" : "cancelada"} y no admite más acciones.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── List view ─────────────────────────────────────────────────────

  const TAB_FILTERS = [
    { key: "all" as const, label: "Todas" },
    { key: "DRAFT" as const, label: "Borrador" },
    { key: "CONFIRMED" as const, label: "Confirmadas" },
    { key: "RECEIVED" as const, label: "Recibidas" },
  ] as const;

  return (
    <div className="relative flex h-full w-full flex-col font-sans">

      {/* ── Desktop layout ─────────────────────────────────────── */}
      <div className="hidden h-full flex-col lg:flex">
        <header className="page-header flex shrink-0 items-center justify-between gap-4">
          <div>
            <p className="section-kicker">Operaciones</p>
            <h1 className="page-title mt-0.5">Ordenes de Compra</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="search-bar w-72">
              <Search className="shrink-0 text-default-400" size={15} />
              <input
                className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-default-400"
                placeholder="Buscar por proveedor o ID..."
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button
              className="flex items-center gap-2 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(59,130,246,0.30)] transition-all hover:shadow-[0_8px_24px_rgba(59,130,246,0.40)] hover:scale-[1.02] active:scale-[0.98]"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus size={16} strokeWidth={2.5} />
              Nueva Compra
            </button>
          </div>
        </header>

        <div className="flex-1 p-6 space-y-5">
          {/* KPI Cards */}
          <div className="grid grid-cols-4 gap-4">
            <div className="stat-card relative overflow-hidden">
              <div className="absolute right-0 top-0 h-20 w-20 translate-x-6 -translate-y-6 rounded-full bg-blue-500/5" />
              <p className="stat-card-label flex items-center gap-1.5">
                <ShoppingBag size={12} />
                Compras Realizadas
              </p>
              <p className="stat-card-value mt-3">{purchases.length}</p>
              <p className="stat-card-sub">
                {monthStats.countDelta !== 0 && (
                  <span className={monthStats.countDelta > 0 ? "text-emerald-600 font-semibold" : "text-red-600 font-semibold"}>
                    {monthStats.countDelta > 0 ? "▲" : "▼"} {Math.abs(monthStats.countDelta).toFixed(1)}%
                  </span>
                )}{" "}
                vs mes anterior
              </p>
            </div>
            <div className="stat-card relative overflow-hidden">
              <div className="absolute right-0 top-0 h-20 w-20 translate-x-6 -translate-y-6 rounded-full bg-emerald-500/5" />
              <p className="stat-card-label flex items-center gap-1.5">
                <Receipt size={12} />
                Total Invertido
              </p>
              <p className="stat-card-value mt-3 font-mono">{formatCurrency(totalPurchased, currency)}</p>
              <p className="stat-card-sub">
                Promedio mensual:{" "}
                <span className="font-semibold font-mono text-foreground">
                  {formatCompactCurrency(monthStats.monthlyAvg, currency)}
                </span>
              </p>
            </div>
            <div className="stat-card relative overflow-hidden">
              <div className="absolute right-0 top-0 h-20 w-20 translate-x-6 -translate-y-6 rounded-full bg-amber-500/5" />
              <p className="stat-card-label flex items-center gap-1.5">
                <Clock size={12} />
                Pendientes Recepción
              </p>
              <p className="stat-card-value mt-3">{monthStats.pending}</p>
              <div className="mt-3 flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-content3">
                  <div
                    className="h-full rounded-full bg-amber-400 transition-all"
                    style={{ width: `${monthStats.pendingPct}%` }}
                  />
                </div>
                <span className="text-xs font-bold font-mono text-amber-500">{monthStats.pendingPct}%</span>
              </div>
            </div>
            <div className="stat-card relative overflow-hidden">
              <div className="absolute right-0 top-0 h-20 w-20 translate-x-6 -translate-y-6 rounded-full bg-red-500/5" />
              <p className="stat-card-label flex items-center gap-1.5">
                <ArrowUpRight size={12} />
                Variación Costos
              </p>
              <p className={`stat-card-value mt-3 font-mono ${
                monthStats.costDelta < 0 ? "text-red-600" : monthStats.costDelta > 0 ? "text-emerald-600" : ""
              }`}>
                {monthStats.costDelta > 0 ? "+" : ""}{monthStats.costDelta.toFixed(1)}%
              </p>
              <p className="stat-card-sub">Impacto en margen bruto</p>
            </div>
          </div>

          {/* Table card */}
          <div className="financial-card !p-0 overflow-hidden">
            <div className="flex items-center justify-between border-b border-divider/10 px-5 py-3.5">
              <div className="flex items-center gap-1">
                {TAB_FILTERS.map((f) => {
                  const count = f.key === "all" ? purchases.length : statusCounts[f.key] || 0;
                  if (f.key !== "all" && count === 0) return null;
                  return (
                    <button
                      key={f.key}
                      className={`relative rounded-lg px-3.5 py-1.5 text-xs font-bold transition-colors ${
                        activeFilter === f.key
                          ? "bg-blue-500 text-white shadow-sm"
                          : "text-default-500 hover:text-foreground hover:bg-content2/60"
                      }`}
                      onClick={() => setActiveFilter(f.key)}
                    >
                      {f.label}
                      <span className={`ml-1.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[9px] font-bold ${
                        activeFilter === f.key ? "bg-white/20 text-white" : "bg-default-200/60 text-default-500"
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="overflow-x-auto">
              {loading && purchases.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-default-400">
                  <Loader2 className="mb-3 animate-spin" size={28} />
                  <p className="text-sm font-medium">Cargando compras...</p>
                </div>
              ) : filteredPurchases.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-default-100">
                    <ShoppingBag className="text-default-300" size={28} />
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    {searchQuery || activeFilter !== "all"
                      ? "Sin resultados"
                      : "Crea tu primera orden de compra"}
                  </p>
                  <p className="mt-1 text-xs text-default-500">
                    {searchQuery || activeFilter !== "all"
                      ? "No se encontraron compras con los filtros aplicados."
                      : "Usa el botón Nueva Compra para empezar."}
                  </p>
                </div>
              ) : (
                <table className="w-full min-w-[900px]">
                  <thead>
                    <tr className="text-left text-[10px] font-bold uppercase tracking-[0.16em] text-default-400">
                      <th className="px-5 pb-3 pt-4">OC</th>
                      <th className="px-4 pb-3 pt-4">Proveedor</th>
                      <th className="px-4 pb-3 pt-4">Emisión</th>
                      <th className="px-4 pb-3 pt-4">Entrega</th>
                      <th className="px-4 pb-3 pt-4">Estado</th>
                      <th className="px-4 pb-3 pt-4">Pago</th>
                      <th className="px-4 pb-3 pt-4 text-right">Total</th>
                      <th className="px-5 pb-3 pt-4 text-right w-16"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {desktopItems.map((purchase) => {
                      const name = getSupplierName(purchase.supplier);
                      const delivery = expectedDelivery(purchase);
                      return (
                        <tr
                          key={purchase._id}
                          className="group cursor-pointer border-t border-divider/10 transition-colors hover:bg-blue-500/5"
                          onClick={() => navigate(`/purchases/${purchase._id}`)}
                        >
                          <td className="px-5 py-4">
                            <span className="text-sm font-bold font-mono text-blue-500">
                              {formatId(purchase._id)}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-[11px] font-bold ${avatarColor(name)}`}>
                                {supplierInitials(name)}
                              </div>
                              <span className="text-sm font-semibold text-foreground">{name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-sm font-mono text-default-500">{formatDate(purchase.date)}</span>
                          </td>
                          <td className="px-4 py-4">
                            {isToday(delivery) ? (
                              <span className="inline-flex items-center gap-1 text-sm font-bold text-amber-500">
                                <Clock size={13} />
                                Hoy
                              </span>
                            ) : (
                              <span className="text-sm font-mono text-default-500">{formatDate(delivery)}</span>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.08em] ${STATUS_COLORS[purchase.status]}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOTS[purchase.status]}`} />
                              {STATUS_LABELS[purchase.status]}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-sm text-default-500">
                              {PAYMENT_LABELS[purchase.paymentCondition]}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <span className="text-sm font-bold font-mono text-foreground">
                              {formatCurrency(purchase.total, currency)}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <ChevronRight size={15} className="text-default-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            <PaginationBar
              from={(desktopPage - 1) * DESKTOP_PAGE_SIZE + 1}
              label={`Mostrando ${desktopItems.length} de ${filteredPurchases.length} órdenes`}
              page={desktopPage}
              to={Math.min(desktopPage * DESKTOP_PAGE_SIZE, filteredPurchases.length)}
              total={filteredPurchases.length}
              totalPages={desktopTotalPages}
              onNext={() => setDesktopPage((p) => p + 1)}
              onPage={(p) => setDesktopPage(p)}
              onPrev={() => setDesktopPage((p) => p - 1)}
            />
          </div>
        </div>
      </div>

      {/* ── Mobile layout ──────────────────────────────────────── */}
      <div className="flex h-full w-full flex-col pb-28 lg:hidden">
        <header className="app-topbar px-6 pt-6 pb-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="section-kicker">Compras</div>
              <h1 className="mt-2 text-[28px] font-bold tracking-[-0.03em] text-foreground">
                Ordenes de Compra
              </h1>
            </div>
            <button
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus size={20} />
            </button>
          </div>
          <div className="relative mt-4">
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-default-400" size={18} />
            <input
              className="corp-input w-full rounded-2xl py-3.5 pl-11 pr-4 text-sm text-foreground"
              placeholder="Buscar por proveedor o ID..."
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </header>

        <div className="px-6 py-4">
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {(
              [
                { key: "all" as const, label: "Todas" },
                { key: "DRAFT" as const, label: "Borrador" },
                { key: "CONFIRMED" as const, label: "Confirmadas" },
                { key: "RECEIVED" as const, label: "Recibidas" },
                { key: "CANCELLED" as const, label: "Canceladas" },
              ] as const
            ).map((filter) => {
              const count = filter.key === "all" ? purchases.length : statusCounts[filter.key] || 0;
              if (filter.key !== "all" && count === 0) return null;
              return (
                <button
                  key={filter.key}
                  className={`shrink-0 rounded-full px-5 py-2 text-[12px] font-bold tracking-wide transition-all ${
                    activeFilter === filter.key
                      ? filter.key === "CANCELLED"
                        ? "bg-gradient-to-br from-red-500 to-red-600 text-white shadow-md"
                        : "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md"
                      : "border border-divider/20 bg-content2/50 text-default-600 hover:bg-content2/80"
                  }`}
                  onClick={() => setActiveFilter(filter.key)}
                >
                  {filter.label} ({count})
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 space-y-3 px-6 pb-28">
          {loading && purchases.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-divider/10 bg-content2/40 py-16 text-default-400">
              <Loader2 className="mb-3 animate-spin" size={32} />
              <p className="text-sm font-medium">Cargando compras...</p>
            </div>
          ) : filteredPurchases.length > 0 ? (
            filteredPurchases.map((purchase, i) => (
              <button
                key={purchase._id}
                className="group relative flex w-full items-start justify-between rounded-2xl border border-divider/15 bg-gradient-to-br from-content1 to-content2/40 p-4 text-left transition-all hover:border-blue-500/25 hover:shadow-md active:scale-[0.99]"
                onClick={() => navigate(`/purchases/${purchase._id}`)}
                style={{ animationDelay: `${i * 30}ms` }}
              >
                <div className="flex items-start gap-4">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${
                    purchase.status === "CANCELLED" ? "from-red-500/15 to-red-600/10 text-red-500"
                      : purchase.status === "RECEIVED" ? "from-emerald-500/15 to-emerald-600/10 text-emerald-500"
                        : purchase.status === "CONFIRMED" ? "from-blue-500/15 to-blue-600/10 text-blue-500"
                          : "from-amber-500/15 to-amber-600/10 text-amber-500"
                  }`}>
                    <ShoppingBag size={20} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-[15px] font-bold text-foreground truncate max-w-[180px]">
                      {getSupplierName(purchase.supplier)}
                    </h3>
                    <p className="mt-0.5 text-[10px] font-mono uppercase tracking-[0.12em] text-default-400">
                      {formatId(purchase._id)} · {formatDate(purchase.date)}
                    </p>
                    <div className="mt-2 flex gap-2">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.06em] ${STATUS_COLORS[purchase.status]}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOTS[purchase.status]}`} />
                        {STATUS_LABELS[purchase.status]}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-default-100 px-2.5 py-1 text-[9px] font-bold text-default-500">
                        <CreditCard size={10} />
                        {PAYMENT_LABELS[purchase.paymentCondition]}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0 ml-3">
                  <p className="text-base font-bold font-mono text-foreground">
                    {formatCompactCurrency(purchase.total, currency)}
                  </p>
                  <ChevronRight size={15} className="text-default-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </button>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-divider/10 bg-content2/40 py-16">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-default-100">
                <ShoppingBag className="text-default-300" size={28} />
              </div>
              <p className="text-sm font-semibold text-foreground">
                {searchQuery || activeFilter !== "all" ? "Sin resultados" : "Crea tu primera compra"}
              </p>
              <p className="mt-1 text-xs text-default-500">
                {searchQuery || activeFilter !== "all"
                  ? "No se encontraron compras con los filtros aplicados."
                  : "Usa el botón + para empezar."}
              </p>
            </div>
          )}
        </div>

        <button
          className="fixed bottom-[100px] right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-[0_16px_34px_rgba(59,130,246,0.35)] transition-all hover:scale-105 active:scale-95 hover:shadow-[0_16px_40px_rgba(59,130,246,0.45)]"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus size={26} strokeWidth={2.5} />
        </button>
      </div>

      {showCreateModal && (
        <CreatePurchaseModal
          currency={currency}
          isDesktop={isDesktop}
          products={products}
          submitting={isCreating}
          suppliers={suppliers}
          supplies={supplies}
          showToast={showToast}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreate}
        />
      )}
    </div>
  );
}
