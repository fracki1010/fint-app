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
  suggestedPrices,
  onApplySuggestedPrice,
  onClose,
  onSubmit,
  submitting,
  onAddPresentation,
  onUpdatePresentation,
  onRemovePresentation,
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
  suggestedPrices: Array<{ label: string; value: string }>;
  onApplySuggestedPrice: (value: string) => void;
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
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-default-500">Precio base</span>
                <input className="corp-input w-full rounded-2xl px-4 py-3 text-sm" min="0" step="0.01" type="number" value={formData.price} onChange={(e) => onChange("price", e.target.value)} />
                <p className="mt-1 text-[11px] text-default-500">Opcional si usás presentaciones</p>
                {suggestedPrices.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {suggestedPrices.map((suggestion) => (
                      <button key={suggestion.label} className="rounded-full bg-content2 px-3 py-1.5 text-[11px] font-semibold text-default-700" type="button" onClick={() => onApplySuggestedPrice(suggestion.value)}>
                        {suggestion.label}: ${suggestion.value}
                      </button>
                    ))}
                  </div>
                )}
              </label>
              <label className="block">
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
            Presentaciones
            <span className="rounded-full bg-content2 px-2 py-0.5 text-[10px] font-semibold text-default-500">
              {formData.presentations.length}
            </span>
          </div>
          
          <div className="space-y-3 rounded-2xl border border-divider/30 bg-content1/30 p-4">
            {formData.presentations.length === 0 && (
              <div className="py-4 text-center">
                <p className="text-sm text-default-400">Sin presentaciones</p>
                <p className="mt-1 text-xs text-default-500">Agregá una para vender el producto en diferentes formatos</p>
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

                  {/* Precio, Cantidad y Unidad */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-default-500">Precio</label>
                      <input
                        className="corp-input w-full rounded-xl px-3 py-2.5 text-sm"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        type="number"
                        value={pres.price}
                        onChange={(e) => onUpdatePresentation(idx, "price", e.target.value)}
                      />
                      {/* Margen actual si hay precio y costo */}
                      {formData.costPrice && Number(formData.costPrice) > 0 && pres.price && Number(pres.price) > 0 && pres.equivalentQty && Number(pres.equivalentQty) > 0 && (
                        <div className="text-[11px]">
                          {(() => {
                            const costTotal = Number(formData.costPrice) * Number(pres.equivalentQty);
                            const price = Number(pres.price);
                            const margin = ((price - costTotal) / price) * 100;
                            const isProfit = margin > 0;
                            return (
                              <span className={isProfit ? "text-success font-semibold" : "text-danger font-semibold"}>
                                {isProfit ? "✓" : "⚠️"} Margen: {margin.toFixed(1)}%
                                <span className="block text-[10px] font-normal opacity-70">
                                  Costo: {formatCompactCurrency(costTotal, currency)} | Ganancia: {formatCompactCurrency(price - costTotal, currency)}
                                </span>
                              </span>
                            );
                          })()}
                        </div>
                      )}
                      {formData.costPrice && Number(formData.costPrice) > 0 && pres.equivalentQty && Number(pres.equivalentQty) > 0 && (
                        <button
                          className="w-full rounded-lg bg-success/10 px-2 py-1.5 text-[11px] font-semibold text-success transition hover:bg-success/20"
                          type="button"
                          onClick={() => {
                            const suggested = Number(formData.costPrice) * Number(pres.equivalentQty) * 1.3;
                            onUpdatePresentation(idx, "price", String(Math.round(suggested * 100) / 100));
                          }}
                        >
                          💡 Sugerir {formatCompactCurrency(Number(formData.costPrice) * Number(pres.equivalentQty) * 1.3, currency)}
                          <span className="block text-[10px] font-normal opacity-80">
                            {formatCompactCurrency(Number(formData.costPrice), currency)} × {pres.equivalentQty} × 1.3
                          </span>
                        </button>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-default-500">Cant. equivalente</label>
                      <input
                        className="corp-input w-full rounded-xl px-3 py-2.5 text-sm"
                        min="0.001"
                        step="0.001"
                        placeholder="Ej: 20"
                        type="number"
                        value={pres.equivalentQty}
                        onChange={(e) => onUpdatePresentation(idx, "equivalentQty", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-default-500">Unidad</label>
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
                    </div>
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
              Agregar presentación
            </button>
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
