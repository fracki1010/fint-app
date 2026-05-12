import { useEffect, useRef, useState } from "react";
import { Select, SelectItem } from "@heroui/select";
import { Drawer, DrawerBody, DrawerContent } from "@heroui/drawer";
import {
  Tag,
  X,
  Plus,
  Loader2,
  Layers3,
  Trash2,
  DollarSign,
  Box,
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
  suggestedSku: _suggestedSku,
  onUseSuggestedSku: _onUseSuggestedSku,
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
      className="keyboard-safe-form flex h-full flex-col overflow-x-hidden p-4 sm:p-6"
      style={{ paddingBottom: `calc(max(env(safe-area-inset-bottom), 1rem) + ${keyboardInset}px)` }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="section-kicker">{mode === "create" ? "Alta de Producto" : "Edicion"}</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-foreground">
            {mode === "create" ? "Nuevo producto" : "Editar producto"}
          </h2>
        </div>
        <button className="app-panel-soft flex h-10 w-10 items-center justify-center rounded-2xl text-default-500" onClick={onClose}>
          <X size={18} />
        </button>
      </div>

      <div
        ref={formScrollRef}
        className="mt-6 grid flex-1 gap-6 overflow-y-auto overflow-x-hidden"
        style={{ paddingBottom: `calc(0.75rem + ${keyboardInset}px)` }}
      >
        {/* Section: Basic Info */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-default-400">
            <Tag size={14} />
            Información básica
          </div>
          <div className="space-y-4 rounded-2xl border border-divider/30 bg-content1/30 p-4">
            <label className="block min-w-0">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-default-500">Nombre *</span>
              <input 
                className="corp-input w-full rounded-2xl px-4 py-3 text-sm" 
                placeholder="Ej: Alimento para perros"
                value={formData.name} 
                onChange={(e) => onChange("name", e.target.value)} 
              />
            </label>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block min-w-0">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-default-500">Código de Barras</span>
                <div className="flex gap-2">
                  <input
                    className="corp-input flex-1 rounded-2xl px-4 py-3 text-sm"
                    placeholder="Ej: 7791234567890"
                    value={formData.barcode}
                    onChange={(e) => onChange("barcode", e.target.value.toUpperCase())}
                  />
                  <button
                    className="flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary transition hover:bg-primary/20"
                    type="button"
                    onClick={() => setShowBarcodeScanner(true)}
                  >
                    <ScanBarcode size={20} />
                  </button>
                </div>
                {formData.barcode && (
                  <p className="mt-1 text-[11px] font-semibold text-primary">{formData.barcode}</p>
                )}
              </label>

              <label className="block min-w-0">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-default-500">SKU</span>
                <input 
                  className="corp-input w-full rounded-2xl px-4 py-3 text-sm" 
                  placeholder="Auto-generado si vacío"
                  value={formData.sku} 
                  onChange={(e) => onChange("sku", e.target.value.toUpperCase())} 
                />
              </label>
            </div>

            <label className="block min-w-0">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-default-500">Descripción</span>
              <textarea 
                className="corp-input min-h-[80px] w-full rounded-2xl px-4 py-3 text-sm" 
                placeholder="Descripción del producto..."
                value={formData.description} 
                onChange={(e) => onChange("description", e.target.value)} 
              />
            </label>

            <label className="block min-w-0">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-default-500">Categorías</span>
              <div className="space-y-3">
                <div className="flex min-w-0 gap-2">
                  <input
                    className="corp-input min-w-0 flex-1 rounded-2xl px-4 py-3 text-sm"
                    placeholder="Escribe y agrega una categoría"
                    value={formData.categoryInput}
                    onChange={(e) => onChange("categoryInput", e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); onAddCategory(); } }}
                  />
                  <button className="shrink-0 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground" type="button" onClick={onAddCategory}>
                    Agregar
                  </button>
                </div>
                {formData.categories.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.categories.map((category) => (
                      <button
                        key={category}
                        className="inline-flex max-w-full items-center gap-2 rounded-full bg-content2 px-3 py-1.5 text-xs font-semibold text-default-700"
                        type="button"
                        onClick={() => onRemoveCategory(category)}
                      >
                        <span className="truncate">{category}</span>
                        <X size={12} />
                      </button>
                    ))}
                  </div>
                )}
                {existingCategories.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {existingCategories.map((category) => (
                      <button
                        key={category}
                        className="max-w-full rounded-full border border-divider/70 px-3 py-1.5 text-[11px] font-semibold text-default-500"
                        type="button"
                        onClick={() => onChange("categoryInput", category)}
                      >
                        <span className="block max-w-full truncate">{category}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </label>
          </div>
        </div>

        {/* Section: Pricing */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-default-400">
            <DollarSign size={14} />
            Precios
          </div>
          <div className="space-y-4 rounded-2xl border border-divider/30 bg-content1/30 p-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-default-500">Costo</span>
                <input className="corp-input w-full rounded-2xl px-4 py-3 text-sm" min="0" step="0.01" type="number" value={formData.costPrice} onChange={(e) => onChange("costPrice", e.target.value)} />
                <p className="mt-1 text-[11px] text-default-500">Para calcular margen de ganancia</p>
              </label>
            </div>

            {/* Tier Prices */}
            <ProductTierPriceInput
              priceTiers={formData.priceTiers || {}}
              costPrice={parseFloat(formData.costPrice) || 0}
              currency={currency}
              tierConfig={tierConfig}
              presentations={formData.presentations as any}
              onChange={(tier, value) => {
                // Handle price tier changes through a custom field update
                const newPriceTiers = { ...(formData.priceTiers || {}) };
                if (value === "" || value === undefined) {
                  delete newPriceTiers[tier];
                } else {
                  newPriceTiers[tier] = parseFloat(value) || undefined;
                }
                // Use a special field key that parent component will handle
                onChange(`priceTier_${tier}` as keyof ProductFormState, value);
              }}
            />
          </div>
        </div>

        {/* Section: Inventory */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-default-400">
            <Box size={14} />
            Inventario
          </div>
          <div className="space-y-4 rounded-2xl border border-divider/30 bg-content1/30 p-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-default-500">Stock inicial</span>
                <input className="corp-input w-full rounded-2xl px-4 py-3 text-sm" min="0" type="number" value={formData.stock} onChange={(e) => onChange("stock", e.target.value)} />
              </label>
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-default-500">Stock mínimo</span>
                <input className="corp-input w-full rounded-2xl px-4 py-3 text-sm" min="0" type="number" value={formData.minStock} onChange={(e) => onChange("minStock", e.target.value)} />
              </label>
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-default-500">Unidad base</span>
                <Select
                  aria-label="Unidad de medida"
                  classNames={{
                    base: "w-full",
                    trigger: "corp-input min-h-[48px] rounded-2xl px-4 text-sm text-foreground",
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

        {/* Section: Presentations */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-default-400">
            <Layers3 size={14} />
            Formatos de venta
            <span className="rounded-full bg-content2 px-2 py-0.5 text-[10px] font-semibold text-default-500">
              {formData.presentations.length}
            </span>
          </div>

          {/* Helper banner */}
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
            <div className="flex items-start gap-2">
              <Info size={14} className="mt-0.5 shrink-0 text-primary" />
              <div className="space-y-1">
                <p className="text-xs font-semibold text-foreground">
                  ¿No sabés el precio por kg/unidad?
                </p>
                <p className="text-[11px] leading-relaxed text-default-500">
                  Agregá el formato que conocés (ej: bolsa de 20kg a $50). El sistema calcula automáticamente el precio unitario.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3 rounded-2xl border border-divider/30 bg-content1/30 p-4">
            {formData.presentations.length === 0 && (
              <div className="py-4 text-center">
                <p className="text-sm text-default-400">Sin formatos de venta</p>
                <p className="mt-1 text-xs text-default-500">Agregá al menos uno para poder vender este producto</p>
              </div>
            )}

            {formData.presentations.map((pres, idx) => (
              <div key={idx} className="rounded-xl border border-divider/40 bg-content2/30 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 text-primary text-xs font-bold">
                      {idx + 1}
                    </div>
                    <span className="text-sm font-semibold text-foreground">
                      {pres.name || `Presentación ${idx + 1}`}
                    </span>
                  </div>
                  <button
                    className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-danger transition hover:bg-danger/10"
                    type="button"
                    onClick={() => onRemovePresentation(idx)}
                  >
                    <Trash2 size={12} />
                    Eliminar
                  </button>
                </div>
                
                <div className="space-y-4">
                  {/* Nombre y SKU */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-default-500">Nombre *</label>
                      <input
                        className="corp-input w-full rounded-xl px-3 py-2.5 text-sm"
                        placeholder="Ej: Bolsa 20kg"
                        value={pres.name}
                        onChange={(e) => onUpdatePresentation(idx, "name", e.target.value)}
                        onBlur={() => {
                          if (!pres.sku.trim() && pres.name.trim()) {
                            const base = pres.name.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5) || 'PRES';
                            onUpdatePresentation(idx, "sku", `${base}-${String(idx + 1).padStart(2, '0')}`);
                          }
                        }}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-default-500">SKU</label>
                      <input
                        className="corp-input w-full rounded-xl px-3 py-2.5 text-sm"
                        placeholder="Auto-generado"
                        value={pres.sku}
                        onChange={(e) => onUpdatePresentation(idx, "sku", e.target.value.toUpperCase())}
                      />
                    </div>
                  </div>

                  {/* Código de barras - línea completa */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-default-500">Código de barras</label>
                    <div className="flex gap-2">
                      <input
                        className="corp-input flex-1 rounded-xl px-3 py-2.5 text-sm"
                        placeholder="Escaneá o escribí el código"
                        value={pres.barcode}
                        onChange={(e) => onUpdatePresentation(idx, "barcode", e.target.value.toUpperCase())}
                      />
                      <button
                        className="flex shrink-0 items-center justify-center rounded-xl bg-primary/10 px-3 text-primary transition hover:bg-primary/20"
                        type="button"
                        onClick={() => {
                          setScanningPresentationIndex(idx);
                          setShowBarcodeScanner(true);
                        }}
                      >
                        <ScanBarcode size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Precio de venta, Costo, Contenido y Unidad */}
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-default-500">Precio de venta</label>
                        <input
                          className="corp-input w-full rounded-xl px-3 py-2.5 text-sm"
                          min="0"
                          step="0.01"
                          placeholder="Ej: 50000"
                          type="number"
                          value={pres.price}
                          onChange={(e) => onUpdatePresentation(idx, "price", e.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-default-500">Costo de este formato</label>
                        <input
                          className="corp-input w-full rounded-xl px-3 py-2.5 text-sm"
                          min="0"
                          step="0.01"
                          placeholder="Ej: 35000"
                          type="number"
                          value={pres.cost}
                          onChange={(e) => onUpdatePresentation(idx, "cost", e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-default-500">Contenido</label>
                        <input
                          className="corp-input w-full rounded-xl px-3 py-2.5 text-sm"
                          min="0.001"
                          step="0.001"
                          placeholder="Ej: 20"
                          type="number"
                          value={pres.equivalentQty}
                          onChange={(e) => onUpdatePresentation(idx, "equivalentQty", e.target.value)}
                        />
                        <p className="text-[10px] text-default-400">Cantidad de unidades base</p>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-default-500">Unidad base</label>
                        <Select
                          aria-label="Unidad de medida de la presentación"
                          classNames={{
                            base: "w-full",
                            trigger: "corp-input min-h-[44px] rounded-xl px-3 text-sm text-foreground",
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
                    {/* Margen del formato si hay precio y costo */}
                    {pres.price && Number(pres.price) > 0 && pres.cost && Number(pres.cost) > 0 && (
                      <div className="text-[11px]">
                        {(() => {
                          const cost = Number(pres.cost);
                          const price = Number(pres.price);
                          const margin = ((price - cost) / price) * 100;
                          const isProfit = margin > 0;
                          return (
                            <span className={isProfit ? "text-success font-semibold" : "text-danger font-semibold"}>
                              {isProfit ? "✓" : "⚠️"} Margen: {margin.toFixed(1)}%
                              <span className="block text-[10px] font-normal opacity-70">
                                Costo: {formatCompactCurrency(cost, currency)} | Ganancia: {formatCompactCurrency(price - cost, currency)}
                              </span>
                            </span>
                          );
                        })()}
                      </div>
                    )}

                  {/* Derived unit price + cost + margin */}
                  {pres.price && Number(pres.price) > 0 && pres.equivalentQty && Number(pres.equivalentQty) > 0 && (
                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <Calculator size={14} className="text-primary" />
                        <span className="text-xs font-semibold text-foreground">
                          Desglose por {pres.unitOfMeasure || "unidad"}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-[10px] text-default-500">Precio unitario</p>
                          <p className="text-base font-bold text-primary">
                            {formatCompactCurrency(Number(pres.price) / Number(pres.equivalentQty), currency)}
                          </p>
                          <p className="text-[10px] text-default-400">
                            {formatCompactCurrency(Number(pres.price), currency)} ÷ {pres.equivalentQty}
                          </p>
                        </div>
                        {pres.cost && Number(pres.cost) > 0 && (
                          <div>
                            <p className="text-[10px] text-default-500">Costo unitario</p>
                            <p className="text-base font-bold text-warning">
                              {formatCompactCurrency(Number(pres.cost) / Number(pres.equivalentQty), currency)}
                            </p>
                            <p className="text-[10px] text-default-400">
                              {formatCompactCurrency(Number(pres.cost), currency)} ÷ {pres.equivalentQty}
                            </p>
                          </div>
                        )}
                      </div>
                      {pres.cost && Number(pres.cost) > 0 && (() => {
                        const unitPrice = Number(pres.price) / Number(pres.equivalentQty);
                        const unitCost = Number(pres.cost) / Number(pres.equivalentQty);
                        const margin = unitCost > 0 ? ((unitPrice - unitCost) / unitPrice) * 100 : 0;
                        const isProfit = margin > 0;
                        return (
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-default-500">Margen unitario:</span>
                            <span className={isProfit ? "font-bold text-success" : "font-bold text-danger"}>
                              {margin.toFixed(1)}%
                            </span>
                            <span className="text-default-400">
                              ({formatCompactCurrency(unitPrice - unitCost, currency)} / {pres.unitOfMeasure || "unidad"})
                            </span>
                          </div>
                        );
                      })()}
                      <p className="text-[10px] text-primary font-medium">
                        Estos valores se usan automáticamente como precio y costo base
                      </p>
                    </div>
                  )}
                  </div>
                </div>
                
                <label className="flex items-center gap-2 rounded-lg bg-content3/30 px-3 py-2 text-xs text-default-500">
                  <input
                    className="h-4 w-4 rounded border-divider"
                    type="checkbox"
                    checked={pres.isActive}
                    onChange={(e) => onUpdatePresentation(idx, "isActive", e.target.checked)}
                  />
                  <span className={pres.isActive ? "font-semibold text-success" : ""}>
                    {pres.isActive ? "Activa - Visible en ventas" : "Inactiva - Oculta en ventas"}
                  </span>
                </label>
              </div>
            ))}
            
            <button
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-divider/50 py-3 text-sm font-semibold text-default-500 transition hover:border-primary/50 hover:text-primary"
              type="button"
              onClick={onAddPresentation}
            >
              <Plus size={16} />
              Agregar formato de venta
            </button>

            {/* Preview card */}
            {formData.name && formData.presentations.length > 0 && (() => {
              const firstActive = formData.presentations.find(p => p.isActive !== false && Number(p.price) > 0 && Number(p.equivalentQty) > 0);
              if (!firstActive) return null;
              const unitPrice = Number(firstActive.price) / Number(firstActive.equivalentQty);
              return (
                <div className="rounded-xl border border-success/30 bg-success/5 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-success">
                    <Package size={14} />
                    Vista previa del producto
                  </div>
                  <div className="rounded-lg bg-white/50 p-3 space-y-2">
                    <p className="text-sm font-semibold text-foreground">{formData.name}</p>
                    <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-default-600">
                      <span>{formData.presentations.length} formato{formData.presentations.length !== 1 ? "s" : ""}</span>
                      <span>Venta principal: <strong className="text-foreground">{firstActive.name}</strong></span>
                      <span>Precio de venta: <strong className="text-success">{formatCompactCurrency(Number(firstActive.price), currency)}</strong></span>
                      {firstActive.equivalentQty && (
                        <span>
                          {formatCompactCurrency(unitPrice, currency)} / {firstActive.unitOfMeasure || "unidad"}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-[11px] text-default-500">
                    Así se va a ver el producto en la lista de ventas.
                  </p>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      <BarcodeScanner
        isOpen={showBarcodeScanner}
        onClose={() => {
          setShowBarcodeScanner(false);
          setScanningPresentationIndex(null);
          stopBarcodeScan();
        }}
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

      <div className="mt-6 flex shrink-0 gap-3 border-t border-divider/70 pt-4">
        <button className="app-panel-soft flex-1 rounded-2xl px-4 py-3 text-sm font-semibold text-default-600" onClick={onClose}>
          Cancelar
        </button>
        <button className="flex-1 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50" disabled={submitting} onClick={onSubmit}>
          <span className="flex items-center justify-center gap-2">
            {submitting && <Loader2 className="animate-spin" size={18} />}
            {mode === "create" ? "Crear producto" : "Guardar cambios"}
          </span>
        </button>
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
