import { useEffect, useRef, useState } from "react";
import { Select, SelectItem } from "@heroui/select";
import { Drawer, DrawerBody, DrawerContent } from "@heroui/drawer";
import {
  X,
  Plus,
  Loader2,
  Trash2,
  ScanBarcode,
  Calculator,
  Info,
  Package,
} from "lucide-react";
import { useBarcodeScanner } from "@shared/hooks/useBarcodeScanner";
import { formatCompactCurrency } from "@shared/utils/currency";
import { PriceTier, PriceTiers } from "@shared/types";
import BarcodeScanner from "@shared/components/scanner/BarcodeScanner";
import { ProductTierPriceInput } from "./ProductTierPriceInput";

// ── Types ──────────────────────────────────────────────────────────────────────

export type PresentationFormState = {
  _id?: string;
  sku: string;
  barcode: string;
  name: string;
  unitOfMeasure: string;
  price: string;
  cost: string;
  equivalentQty: string;
  isActive: boolean;
};

export type ProductFormState = {
  sku: string;
  barcode: string;
  name: string;
  description: string;
  price: string;
  costPrice: string;
  stock: string;
  minStock: string;
  categories: string[];
  categoryInput: string;
  unitOfMeasure: string;
  type: "raw_material" | "finished" | "both" | "";
  presentations: PresentationFormState[];
  priceTiers: PriceTiers;
};

// ── Constants / Helpers ────────────────────────────────────────────────────────

export function emptyPresentation(): PresentationFormState {
  return {
    sku: "",
    barcode: "",
    name: "",
    unitOfMeasure: "unidad",
    price: "",
    cost: "",
    equivalentQty: "1",
    isActive: true,
  };
}

/**
 * Genera un SKU para una presentación basado en el SKU del producto.
 * Patrón: {productSku}-{presAcronym}
 * Ej: "ALI-ABP" + "Bolsa 20kg" → "ALI-ABP-B20"
 * Si no hay SKU de producto, usa el acrónimo del nombre del producto.
 */
function buildPresentationSku(productSkuOrName: string, presName: string, idx: number): string {
  if (!presName.trim()) return "";

  // Take the product base (sku or name acronym)
  const productBase = productSkuOrName || "PROD";
  
  // Build presentation acronym: first letters of each word + key numbers
  const words = presName.trim().split(/\s+/).filter(Boolean);
  let presAcronym = "";
  if (words.length >= 2) {
    // Multi-word: first letter of each word
    presAcronym = words.map((w) => w[0].toUpperCase()).join("");
  } else {
    // Single word: take first 3 chars
    presAcronym = presName.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 3) || `P${idx + 1}`;
  }
  
  return `${productBase}-${presAcronym}`;
}

const UNIT_OPTIONS = [
  { value: "unidad", label: "Unidad" },
  { value: "caja", label: "Caja" },
  { value: "paquete", label: "Paquete" },
  { value: "bolsa", label: "Bolsa" },
  { value: "botella", label: "Botella" },
  { value: "kg", label: "Kilogramo" },
  { value: "g", label: "Gramo" },
  { value: "litro", label: "Litro" },
  { value: "ml", label: "Mililitro" },
  { value: "metro", label: "Metro" },
] as const;

export const emptyForm: ProductFormState = {
  sku: "",
  barcode: "",
  name: "",
  description: "",
  price: "",
  costPrice: "",
  stock: "0",
  minStock: "0",
  categories: [],
  categoryInput: "",
  unitOfMeasure: "unidad",
  type: "finished",
  presentations: [],
  priceTiers: {
    retail: undefined,
    wholesale: undefined,
    distributor: undefined,
  },
};

// ── Component ──────────────────────────────────────────────────────────────────

export function ProductFormModal({
  mode,
  isDesktop,
  formData,
  currency,
  onChange,
  onAddCategory,
  onRemoveCategory,
  existingCategories,
  suggestedSku,
  onUseSuggestedSku,
  onClose,
  onSubmit,
  submitting,
  onAddPresentation,
  onUpdatePresentation,
  onRemovePresentation,
  tierConfig,
}: {
  mode: "create" | "edit";
  isDesktop: boolean;
  formData: ProductFormState;
  currency: string;
  onChange: (field: keyof ProductFormState, value: string) => void;
  onAddCategory: () => void;
  onRemoveCategory: (category: string) => void;
  existingCategories: string[];
  suggestedSku: string;
  onUseSuggestedSku: () => void;
  onClose: () => void;
  onSubmit: () => void;
  submitting: boolean;
  onAddPresentation: () => void;
  onUpdatePresentation: (index: number, field: keyof PresentationFormState, value: string | boolean) => void;
  onRemovePresentation: (index: number) => void;
  tierConfig?: Record<PriceTier, { name: string; enabled: boolean }>;
}) {
  const formScrollRef = useRef<HTMLDivElement | null>(null);
  const [keyboardInset, setKeyboardInset] = useState(0);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [scanningPresentationIndex, setScanningPresentationIndex] = useState<number | null>(null);

  const {
    state: barcodeState,
    error: barcodeError,
    setVideoContainer: setBarcodeContainer,
    startCameraScanner: startBarcodeScan,
    stopCameraScanner: stopBarcodeScan,
    toggleCameraScanner: toggleBarcodeScan,
    zoomSupported,
    zoomRange,
    zoomValue,
    applyZoom,
  } = useBarcodeScanner({
    onScan: (code) => {
      if (scanningPresentationIndex !== null) {
        onUpdatePresentation(scanningPresentationIndex, "barcode", code.toUpperCase());
        setScanningPresentationIndex(null);
      } else {
        onChange("barcode", code);
      }
      setShowBarcodeScanner(false);
    },
    onError: () => {},
  });

  useEffect(() => {
    if (showBarcodeScanner) {
      startBarcodeScan();
    } else {
      stopBarcodeScan();
    }
  }, [showBarcodeScanner, startBarcodeScan, stopBarcodeScan]);

  useEffect(() => {
    if (isDesktop) return;
    const container = formScrollRef.current;
    if (!container) return;
    const handleFocusIn = (event: FocusEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      window.setTimeout(() => { target.scrollIntoView({ block: "center", behavior: "smooth" }); }, 120);
    };
    container.addEventListener("focusin", handleFocusIn);
    return () => { container.removeEventListener("focusin", handleFocusIn); };
  }, [isDesktop]);

  useEffect(() => {
    if (isDesktop || typeof window === "undefined" || !window.visualViewport) {
      setKeyboardInset(0);
      return;
    }
    const viewport = window.visualViewport;
    const updateKeyboardInset = () => {
      const inset = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
      setKeyboardInset(inset);
    };
    updateKeyboardInset();
    viewport.addEventListener("resize", updateKeyboardInset);
    viewport.addEventListener("scroll", updateKeyboardInset);
    return () => {
      viewport.removeEventListener("resize", updateKeyboardInset);
      viewport.removeEventListener("scroll", updateKeyboardInset);
    };
  }, [isDesktop]);

  const formLayout = (
    <div
      className="keyboard-safe-form flex h-full flex-col overflow-x-hidden"
      style={{ paddingBottom: `calc(max(env(safe-area-inset-bottom), 1rem) + ${keyboardInset}px)` }}
    >
      {/* ── Header ── */}
      <div className="border-b border-divider/10 px-5 py-5 sm:px-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-default-400">{mode === "create" ? "Alta de Artículo" : "Edicion"}</p>
            <h2 className="mt-1.5 text-xl font-bold tracking-[-0.02em] text-foreground">
              {mode === "create" ? "Nuevo artículo" : "Editar artículo"}
            </h2>
          </div>
          <button className="flex h-9 w-9 items-center justify-center rounded-xl border border-divider/20 text-default-400 hover:bg-content2/60 hover:text-foreground transition-colors" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
      </div>

      {/* ── Scrollable body ── */}
      <div
        ref={formScrollRef}
        className="flex-1 space-y-6 overflow-y-auto px-5 py-6 sm:px-7"
        style={{ paddingBottom: `calc(1.5rem + ${keyboardInset}px)` }}
      >
        {/* ═══════ ETIQUETA DEL PRODUCTO ═══════ */}
        <div className="space-y-5">
          <div className="flex items-center gap-2.5">
            <div className="h-px flex-1 bg-divider/20" />
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-default-400">Etiqueta del producto</span>
            <div className="h-px flex-1 bg-divider/20" />
          </div>

          <div className="rounded-2xl border border-divider/20 bg-gradient-to-br from-content1 to-content2/20 p-5 shadow-sm">
            {/* Nombre */}
            <label className="block">
              <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.1em] text-default-500">Nombre *</span>
              <input 
                className="corp-input w-full rounded-xl border-divider/25 bg-content1 px-4 py-3 text-[15px] font-semibold text-foreground placeholder:text-default-300" 
                placeholder="Ej: Alimento Balanceado"
                value={formData.name} 
                onChange={(e) => onChange("name", e.target.value)} 
              />
            </label>

            {/* Tipo (solo crear) */}
            {mode === "create" && (
              <div className="mt-5">
                <span className="mb-2.5 block text-[11px] font-semibold uppercase tracking-[0.1em] text-default-500">Tipo</span>
                <div className="flex gap-2">
                  {[
                    { value: "finished" as const, label: "Producto Terminado", desc: "Se vende" },
                    { value: "raw_material" as const, label: "Materia Prima", desc: "Se produce" },
                    { value: "both" as const, label: "Ambos", desc: "Compra y venta" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      className={`flex-1 rounded-xl px-4 py-3 text-left transition-all ${
                        formData.type === opt.value
                          ? "bg-primary text-white shadow-sm ring-1 ring-primary/30"
                          : "bg-content2/50 text-default-500 hover:bg-content2/80 hover:text-foreground"
                      }`}
                      type="button"
                      onClick={() => onChange("type", opt.value)}
                    >
                      <span className="block text-xs font-bold">{opt.label}</span>
                      <span className={`block text-[10px] mt-0.5 ${formData.type === opt.value ? "text-white/70" : "text-default-400"}`}>{opt.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Código de barras + SKU */}
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.1em] text-default-500">Código de Barras</span>
                <div className="flex gap-2">
                  <input
                    className="corp-input flex-1 rounded-xl border-divider/25 bg-content1 px-4 py-2.5 text-sm font-mono"
                    placeholder="779..."
                    value={formData.barcode}
                    onChange={(e) => onChange("barcode", e.target.value.toUpperCase())}
                  />
                  <button
                    className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition hover:bg-primary/20"
                    type="button"
                    onClick={() => setShowBarcodeScanner(true)}
                  >
                    <ScanBarcode size={18} />
                  </button>
                </div>
              </label>
              <label className="block">
                <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.1em] text-default-500">SKU</span>
                <div className="flex gap-2">
                  <input 
                    className="corp-input flex-1 rounded-xl border-divider/25 bg-content1 px-4 py-2.5 text-sm font-mono" 
                    placeholder="Auto-generado"
                    value={formData.sku} 
                    onChange={(e) => onChange("sku", e.target.value.toUpperCase())} 
                  />
                  {mode === "create" && suggestedSku && formData.sku.toUpperCase() !== suggestedSku && (
                    <button
                      className="shrink-0 rounded-xl bg-primary/10 px-3.5 py-2.5 text-[11px] font-bold text-primary transition hover:bg-primary/20"
                      type="button"
                      onClick={onUseSuggestedSku}
                    >
                      Usar
                    </button>
                  )}
                </div>
                {mode === "create" && suggestedSku && !formData.sku && (
                  <p className="mt-1.5 text-[11px] text-primary/70 font-medium">
                    Sugerido: <span className="font-mono">{suggestedSku}</span>
                  </p>
                )}
              </label>
            </div>

            {/* Categorías */}
            <div className="mt-5">
              <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.1em] text-default-500">Categorías</span>
              <div className="flex gap-2">
                <input
                  className="corp-input min-w-0 flex-1 rounded-xl border-divider/25 bg-content1 px-4 py-2.5 text-sm"
                  placeholder="Escribe y agrega..."
                  value={formData.categoryInput}
                  onChange={(e) => onChange("categoryInput", e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); onAddCategory(); } }}
                  list="category-suggestions"
                />
                <datalist id="category-suggestions">
                  {existingCategories.filter(c => !formData.categories.includes(c)).map((cat) => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
                <button className="shrink-0 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground" type="button" onClick={onAddCategory}>
                  +
                </button>
              </div>
              {/* Existing categories as quick-add chips */}
              {existingCategories.length > 0 && formData.categories.length < existingCategories.length && (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {existingCategories
                    .filter(cat => !formData.categories.includes(cat))
                    .slice(0, 8)
                    .map((cat) => (
                      <button
                        key={cat}
                        className="inline-flex items-center gap-1 rounded-full border border-divider/30 px-2.5 py-1 text-[11px] font-medium text-default-500 hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-colors"
                        type="button"
                        onClick={() => { onChange("categoryInput", cat); setTimeout(() => onAddCategory(), 0); }}
                      >
                        + {cat}
                      </button>
                    ))}
                </div>
              )}
              {formData.categories.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {formData.categories.map((cat) => (
                    <button
                      key={cat}
                      className="inline-flex items-center gap-1.5 rounded-full bg-content2/80 px-3 py-1.5 text-[11px] font-semibold text-default-600 hover:bg-danger/10 hover:text-danger transition-colors"
                      type="button"
                      onClick={() => onRemoveCategory(cat)}
                    >
                      {cat}
                      <X size={11} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ═══════ PRECIOS ═══════ */}
        <div className="space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="h-px flex-1 bg-divider/20" />
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-default-400">Precios</span>
            <div className="h-px flex-1 bg-divider/20" />
          </div>

          <div className="rounded-2xl border border-divider/20 bg-gradient-to-br from-content1 to-content2/20 p-5 shadow-sm space-y-4">
            <label className="block">
              <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.1em] text-default-500">Costo</span>
              <input className="corp-input w-full rounded-xl border-divider/25 bg-content1 px-4 py-2.5 text-sm font-mono" min="0" step="0.01" type="number" value={formData.costPrice} onChange={(e) => onChange("costPrice", e.target.value)} />
              <p className="mt-1 text-[11px] text-default-400">
                {formData.type === "raw_material" ? "Costo de la materia prima" : "Para calcular margen de ganancia"}
              </p>
              {/* Cost calculations when there are presentations with prices */}
              {formData.type !== "raw_material" && formData.costPrice && Number(formData.costPrice) > 0 && formData.presentations.length > 0 && (
                <div className="mt-3 space-y-1.5 rounded-lg bg-primary/5 border border-primary/15 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-default-400">Márgenes estimados</p>
                  {formData.presentations.filter(p => p.isActive !== false && Number(p.price) > 0).map((pres, i) => {
                    const costTotal = Number(formData.costPrice) * Number(pres.equivalentQty || 1);
                    const price = Number(pres.price);
                    const margin = ((price - costTotal) / price) * 100;
                    return (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <span className="text-default-500">{pres.name || `Formato ${i + 1}`}</span>
                        <span className={margin > 0 ? "font-bold text-success" : "font-bold text-danger"}>
                          {margin.toFixed(1)}%
                          <span className="ml-1.5 text-[10px] font-normal text-default-400">
                            ({formatCompactCurrency(costTotal, currency)} csto · {formatCompactCurrency(price - costTotal, currency)} gan)
                          </span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </label>

            <ProductTierPriceInput
              priceTiers={formData.priceTiers || {}}
              costPrice={parseFloat(formData.costPrice) || 0}
              currency={currency}
              tierConfig={tierConfig}
              presentations={formData.presentations as any}
              onChange={(tier, value) => {
                const newPriceTiers = { ...(formData.priceTiers || {}) };
                if (value === "" || value === undefined) {
                  delete newPriceTiers[tier];
                } else {
                  newPriceTiers[tier] = parseFloat(value) || undefined;
                }
                onChange(`priceTier_${tier}` as keyof ProductFormState, value);
              }}
            />
          </div>
        </div>

        {/* ═══════ INVENTARIO ═══════ */}
        <div className="space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="h-px flex-1 bg-divider/20" />
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-default-400">Inventario</span>
            <div className="h-px flex-1 bg-divider/20" />
          </div>

          <div className="rounded-2xl border border-divider/20 bg-gradient-to-br from-content1 to-content2/20 p-5 shadow-sm">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <label className="block">
                <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.1em] text-default-500">Stock inicial</span>
                <div className="flex gap-2">
                  <input className="corp-input flex-1 rounded-xl border-divider/25 bg-content1 px-4 py-2.5 text-sm font-mono" min="0" type="number" value={formData.stock} onChange={(e) => onChange("stock", e.target.value)} />
                  {formData.presentations.filter(p => p.isActive !== false).length > 0 && (
                    <select
                      className="corp-input w-24 shrink-0 rounded-xl border-divider/25 bg-content1 px-2 py-2.5 text-xs text-default-500"
                      value="base"
                      onChange={(e) => {
                        if (e.target.value === "base") return;
                        const pres = formData.presentations.find(p => p._id === e.target.value || p.name === e.target.value);
                        if (pres && Number(formData.stock) > 0) {
                          const baseQty = Number(formData.stock) * Number(pres.equivalentQty || 1);
                          onChange("stock", String(Math.round(baseQty * 100) / 100));
                        }
                      }}
                    >
                      <option value="base">{formData.unitOfMeasure || "ud"}</option>
                      {formData.presentations.filter(p => p.isActive !== false).map((p) => (
                        <option key={p._id || p.name} value={p._id || p.name}>{p.name}</option>
                      ))}
                    </select>
                  )}
                </div>
              </label>
              <label className="block">
                <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.1em] text-default-500">Stock mínimo</span>
                <div className="flex gap-2">
                  <input className="corp-input flex-1 rounded-xl border-divider/25 bg-content1 px-4 py-2.5 text-sm font-mono" min="0" type="number" value={formData.minStock} onChange={(e) => onChange("minStock", e.target.value)} />
                  {formData.presentations.filter(p => p.isActive !== false).length > 0 && (
                    <select
                      className="corp-input w-24 shrink-0 rounded-xl border-divider/25 bg-content1 px-2 py-2.5 text-xs text-default-500"
                      value="base"
                      onChange={(e) => {
                        if (e.target.value === "base") return;
                        const pres = formData.presentations.find(p => p._id === e.target.value || p.name === e.target.value);
                        if (pres && Number(formData.minStock) > 0) {
                          const baseQty = Number(formData.minStock) * Number(pres.equivalentQty || 1);
                          onChange("minStock", String(Math.round(baseQty * 100) / 100));
                        }
                      }}
                    >
                      <option value="base">{formData.unitOfMeasure || "ud"}</option>
                      {formData.presentations.filter(p => p.isActive !== false).map((p) => (
                        <option key={p._id || p.name} value={p._id || p.name}>{p.name}</option>
                      ))}
                    </select>
                  )}
                </div>
              </label>
              <label className="block">
                <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.1em] text-default-500">Unidad base</span>
                <Select
                  aria-label="Unidad de medida"
                  classNames={{
                    base: "w-full",
                    trigger: "corp-input min-h-[42px] rounded-xl border-divider/25 bg-content1 px-4 text-sm text-foreground",
                    value: "text-foreground",
                    popoverContent: "bg-content1 text-foreground",
                    listbox: "bg-content1 text-foreground",
                  }}
                  selectedKeys={[formData.unitOfMeasure]}
                  variant="bordered"
                  onSelectionChange={(keys) => onChange("unitOfMeasure", Array.from(keys)[0] as string)}
                >
                  {UNIT_OPTIONS.map((option) => (
                    <SelectItem key={option.value}>{option.label}</SelectItem>
                  ))}
                </Select>
              </label>
            </div>
          </div>
        </div>

        {/* ═══════ UNIDADES ALTERNATIVAS ═══════ */}
        <div className="space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="h-px flex-1 bg-divider/20" />
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-default-400">Unidades alternativas</span>
            {formData.presentations.length > 0 && (
              <span className="rounded-full bg-content2/80 px-2 py-0.5 text-[10px] font-bold text-default-500">{formData.presentations.length}</span>
            )}
            <div className="h-px flex-1 bg-divider/20" />
          </div>

          {/* Helper banner */}
          {formData.presentations.length === 0 && (
            <div className="rounded-xl border border-primary/15 bg-primary/5 p-4">
              <div className="flex items-start gap-3">
                <Info size={15} className="mt-0.5 shrink-0 text-primary" />
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-foreground">¿No sabés el precio por kg/unidad?</p>
                  <p className="text-[12px] leading-relaxed text-default-500">Agregá una unidad alternativa (ej: bolsa de 20kg a $50). El sistema calcula automáticamente el precio unitario.</p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {formData.presentations.length === 0 && (
              <div className="rounded-2xl border-2 border-dashed border-divider/30 p-8 text-center">
                <Package size={28} className="mx-auto mb-3 text-default-300" />
                <p className="text-sm font-semibold text-default-500">Sin unidades alternativas</p>
                <p className="mt-1 text-xs text-default-400">Agregá al menos una para poder vender este artículo</p>
              </div>
            )}

            {formData.presentations.map((pres, idx) => (
              <div key={idx} className="rounded-2xl border border-divider/20 bg-gradient-to-br from-content1 to-content2/20 p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-bold">
                      {idx + 1}
                    </div>
                    <span className="text-sm font-bold text-foreground">{pres.name || `Formato ${idx + 1}`}</span>
                  </div>
                  <button
                    className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-danger/70 transition hover:bg-danger/10 hover:text-danger"
                    type="button"
                    onClick={() => onRemovePresentation(idx)}
                  >
                    <Trash2 size={12} />
                    Quitar
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Nombre y SKU */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-default-500">Nombre *</label>
                      <input
                        className="corp-input w-full rounded-xl border-divider/25 bg-content1 px-3.5 py-2.5 text-sm"
                        placeholder="Ej: Bolsa 20kg"
                        value={pres.name}
                        onChange={(e) => onUpdatePresentation(idx, "name", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-default-500">SKU</label>
                      <div className="flex gap-2">
                        <input
                          className="corp-input flex-1 rounded-xl border-divider/25 bg-content1 px-3.5 py-2.5 text-sm font-mono"
                          placeholder="Auto-generado"
                          value={pres.sku}
                          onChange={(e) => onUpdatePresentation(idx, "sku", e.target.value.toUpperCase())}
                        />
                        {(() => {
                          const suggested = buildPresentationSku(formData.sku || formData.name, pres.name, idx);
                          if (mode === "create" && suggested && pres.sku.toUpperCase() !== suggested) {
                            return (
                              <button
                                className="shrink-0 rounded-xl bg-primary/10 px-3 py-2.5 text-[11px] font-bold text-primary transition hover:bg-primary/20"
                                type="button"
                                onClick={() => onUpdatePresentation(idx, "sku", suggested)}
                              >
                                Usar
                              </button>
                            );
                          }
                          return null;
                        })()}
                      </div>
                      {mode === "create" && !pres.sku && buildPresentationSku(formData.sku || formData.name, pres.name, idx) && (
                        <p className="mt-1 text-[10px] text-primary/70 font-medium">
                          Sugerido: <span className="font-mono">{buildPresentationSku(formData.sku || formData.name, pres.name, idx)}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Código de barras */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-default-500">Código de barras</label>
                    <div className="flex gap-2">
                      <input
                        className="corp-input flex-1 rounded-xl border-divider/25 bg-content1 px-3.5 py-2.5 text-sm"
                        placeholder="Escaneá o escribí el código"
                        value={pres.barcode}
                        onChange={(e) => onUpdatePresentation(idx, "barcode", e.target.value.toUpperCase())}
                      />
                      <button
                        className="flex shrink-0 items-center justify-center rounded-xl bg-primary/10 px-3 text-primary transition hover:bg-primary/20"
                        type="button"
                        onClick={() => { setScanningPresentationIndex(idx); setShowBarcodeScanner(true); }}
                      >
                        <ScanBarcode size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Precio de venta, Costo, Contenido y Unidad */}
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold text-default-500">Precio de venta</label>
                        <input className="corp-input w-full rounded-xl border-divider/25 bg-content1 px-3.5 py-2.5 text-sm" min="0" step="0.01" placeholder="Ej: 50000" type="number" value={pres.price} onChange={(e) => onUpdatePresentation(idx, "price", e.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold text-default-500">Costo de este formato</label>
                        <input className="corp-input w-full rounded-xl border-divider/25 bg-content1 px-3.5 py-2.5 text-sm" min="0" step="0.01" placeholder="Ej: 35000" type="number" value={pres.cost} onChange={(e) => onUpdatePresentation(idx, "cost", e.target.value)} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold text-default-500">Contenido</label>
                        <input className="corp-input w-full rounded-xl border-divider/25 bg-content1 px-3.5 py-2.5 text-sm" min="0.001" step="0.001" placeholder="Ej: 20" type="number" value={pres.equivalentQty} onChange={(e) => onUpdatePresentation(idx, "equivalentQty", e.target.value)} />
                        <p className="text-[10px] text-default-400">Cantidad de unidades base</p>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold text-default-500">Unidad base</label>
                        <Select
                          aria-label="Unidad de medida de la presentación"
                          classNames={{
                            base: "w-full",
                            trigger: "corp-input min-h-[40px] rounded-xl border-divider/25 bg-content1 px-3 text-sm text-foreground",
                            value: "text-foreground",
                            popoverContent: "bg-content1 text-foreground",
                            listbox: "bg-content1 text-foreground",
                          }}
                          selectedKeys={[pres.unitOfMeasure]}
                          variant="bordered"
                          onSelectionChange={(keys) => onUpdatePresentation(idx, "unitOfMeasure", Array.from(keys)[0] as string)}
                        >
                          {UNIT_OPTIONS.map((option) => (
                            <SelectItem key={option.value}>{option.label}</SelectItem>
                          ))}
                        </Select>
                        <p className="text-[10px] text-default-400">Ej: kg, litro, unidad</p>
                      </div>
                    </div>
                  </div>

                  {/* Margen del formato */}
                  {pres.price && Number(pres.price) > 0 && pres.cost && Number(pres.cost) > 0 && (
                    <div className="rounded-lg bg-success/5 border border-success/15 px-4 py-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-default-500">Margen del formato</span>
                        <span className="font-bold text-success">
                          {((Number(pres.price) - Number(pres.cost)) / Number(pres.price) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Desglose unitario — visible desde el primer momento */}
                  {pres.price && Number(pres.price) > 0 && pres.equivalentQty && Number(pres.equivalentQty) > 0 && (
                    <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <Calculator size={14} className="text-primary" />
                        <span className="text-xs font-bold text-foreground">
                          Precio unitario calculado
                        </span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-primary tracking-tight">
                          {formatCompactCurrency(Number(pres.price) / Number(pres.equivalentQty), currency)}
                        </span>
                        <span className="text-sm text-default-500">
                          / {pres.unitOfMeasure || "unidad"}
                        </span>
                      </div>
                      <p className="text-xs text-default-400">
                        {formatCompactCurrency(Number(pres.price), currency)} ÷ {pres.equivalentQty} {pres.unitOfMeasure || "unidad"}
                      </p>
                      {pres.cost && Number(pres.cost) > 0 && (
                        <div className="flex items-baseline gap-2 pt-1 border-t border-primary/10">
                          <span className="text-xs text-default-500">Costo unitario:</span>
                          <span className="text-lg font-bold text-warning">
                            {formatCompactCurrency(Number(pres.cost) / Number(pres.equivalentQty), currency)}
                          </span>
                          <span className="text-xs text-default-500">
                            / {pres.unitOfMeasure || "unidad"}
                          </span>
                        </div>
                      )}
                      <p className="text-[11px] text-primary/70 font-medium">
                        Este valor se usa automáticamente como precio base del producto
                      </p>
                    </div>
                  )}

                  {/* Activo/Inactivo */}
                  <label className="flex items-center gap-2.5 rounded-lg bg-content2/40 px-3.5 py-2.5">
                    <input className="h-4 w-4 rounded border-divider" type="checkbox" checked={pres.isActive} onChange={(e) => onUpdatePresentation(idx, "isActive", e.target.checked)} />
                    <span className={`text-xs font-semibold ${pres.isActive ? "text-success" : "text-default-400"}`}>
                      {pres.isActive ? "Activa — Visible en ventas" : "Inactiva — Oculta en ventas"}
                    </span>
                  </label>
                </div>
              </div>
            ))}

            <button
              className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-divider/30 py-3.5 text-sm font-semibold text-default-500 transition hover:border-primary/40 hover:text-primary"
              type="button"
              onClick={onAddPresentation}
            >
              <Plus size={16} />
              Agregar unidad alternativa
            </button>

            {/* Preview card */}
            {formData.name && formData.presentations.length > 0 && (() => {
              const firstActive = formData.presentations.find(p => p.isActive !== false && Number(p.price) > 0 && Number(p.equivalentQty) > 0);
              if (!firstActive) return null;
              const unitPrice = Number(firstActive.price) / Number(firstActive.equivalentQty);
              return (
                <div className="rounded-2xl border border-success/20 bg-success/5 p-5 space-y-3">
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-success">
                    <Package size={14} />
                    Vista previa del producto
                  </div>
                  <div className="rounded-xl bg-white/60 dark:bg-white/5 p-4 space-y-2">
                    <p className="text-sm font-bold text-foreground">{formData.name}</p>
                    <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-default-500">
                      <span>{formData.presentations.length} formato{formData.presentations.length !== 1 ? "s" : ""}</span>
                      <span>Venta principal: <strong className="text-foreground">{firstActive.name}</strong></span>
                      <span>Precio: <strong className="text-success">{formatCompactCurrency(Number(firstActive.price), currency)}</strong></span>
                      {firstActive.equivalentQty && (
                        <span>{formatCompactCurrency(unitPrice, currency)} / {firstActive.unitOfMeasure || "unidad"}</span>
                      )}
                    </div>
                  </div>
                  <p className="text-[11px] text-default-400">Así se va a ver el artículo en la lista de ventas.</p>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* ── Barcode Scanner (overlay) ── */}
      <BarcodeScanner
        isOpen={showBarcodeScanner}
        onClose={() => { setShowBarcodeScanner(false); setScanningPresentationIndex(null); stopBarcodeScan(); }}
        onScan={() => {}}
        setVideoContainer={setBarcodeContainer}
        state={barcodeState}
        error={barcodeError}
        onToggle={toggleBarcodeScan}
        zoomSupported={zoomSupported}
        zoomRange={zoomRange}
        zoomValue={zoomValue}
        onZoomChange={applyZoom}
      />

      {/* ── Footer ── */}
      <div className="border-t border-divider/10 px-5 py-4 sm:px-7">
        <div className="flex gap-3">
          <button className="flex-1 rounded-xl border border-divider/20 px-4 py-3 text-sm font-semibold text-default-600 transition hover:bg-content2/60" onClick={onClose}>
            Cancelar
          </button>
          <button className="flex-1 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-sm disabled:opacity-50" disabled={submitting} onClick={onSubmit}>
            <span className="flex items-center justify-center gap-2">
              {submitting && <Loader2 className="animate-spin" size={16} />}
              {mode === "create" ? "Crear artículo" : "Guardar cambios"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );

  if (!isDesktop) {
    return (
      <div className="fixed inset-0 z-[120] bg-black/45 backdrop-blur-[1px]">
        <div className="h-[100dvh] w-full max-w-full overflow-hidden bg-background">{formLayout}</div>
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
      onOpenChange={(open: boolean) => { if (!open) onClose(); }}
    >
      <DrawerContent className="h-[100dvh] w-full max-w-xl overflow-x-hidden rounded-none bg-content1">
        <DrawerBody className="p-0">{formLayout}</DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
