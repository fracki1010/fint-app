import { useEffect, useMemo, useRef, useState } from "react";
import {
  Boxes,
  Search,
  AlertCircle,
  Plus,
  Loader2,
  Layers3,
  X,
  Pencil,
  Trash2,
  PackageSearch,
  Archive,
  WandSparkles,
  ChevronRight,
  ArrowUpRight,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Select, SelectItem } from "@heroui/select";
import { Drawer, DrawerBody, DrawerContent } from "@heroui/drawer";

import {
  useInfiniteProducts,
  useProductDetail,
  useProducts,
} from "@/hooks/useProducts";
import { useIsDesktop } from "@/hooks/useIsDesktop";
import { useSettings } from "@/hooks/useSettings";
import { useStockMovements } from "@/hooks/useStockMovements";
import { Product } from "@/types";
import { useAppToast } from "@/components/AppToast";
import { formatCompactCurrency } from "@/utils/currency";
import { getErrorMessage } from "@/utils/errors";
import { PaginationBar } from "@/components/PaginationBar";

type ProductFormState = {
  sku: string;
  name: string;
  description: string;
  price: string;
  costPrice: string;
  stock: string;
  minStock: string;
  categories: string[];
  categoryInput: string;
  unitOfMeasure: string;
};

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
const MOVEMENTS_PREVIEW_LIMIT = 8;

const emptyForm: ProductFormState = {
  sku: "",
  name: "",
  description: "",
  price: "",
  costPrice: "",
  stock: "0",
  minStock: "0",
  categories: [],
  categoryInput: "",
  unitOfMeasure: "unidad",
};

function slugifyText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toUpperCase();
}

function buildSuggestedSku(name: string, categories: string[], existingSkus: string[]) {
  const categoryPrefix = slugifyText(categories[0] || "GEN").slice(0, 3) || "GEN";
  const namePrefix = slugifyText(name).replace(/-/g, "").slice(0, 5) || "ITEM";
  const base = `${categoryPrefix}-${namePrefix}`;

  let candidate = base;
  let sequence = 1;

  while (existingSkus.includes(candidate)) {
    sequence += 1;
    candidate = `${base}-${String(sequence).padStart(2, "0")}`;
  }

  return candidate;
}

// ── Product Form Modal ────────────────────────────────────────────────────────

function ProductFormModal({
  mode,
  isDesktop,
  formData,
  onChange,
  onAddCategory,
  onRemoveCategory,
  existingCategories,
  suggestedSku,
  onUseSuggestedSku,
  suggestedPrices,
  onApplySuggestedPrice,
  onClose,
  onSubmit,
  submitting,
}: {
  mode: "create" | "edit";
  isDesktop: boolean;
  formData: ProductFormState;
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
}) {
  const formScrollRef = useRef<HTMLDivElement | null>(null);
  const [keyboardInset, setKeyboardInset] = useState(0);

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
      className="keyboard-safe-form flex h-full flex-col overflow-x-hidden p-6"
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
        className="mt-6 grid flex-1 gap-4 overflow-y-auto pr-1"
        style={{ paddingBottom: `calc(0.75rem + ${keyboardInset}px)` }}
      >
        <div className="grid grid-cols-1 gap-4">
          <label className="block min-w-0">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-default-500">SKU</span>
            <div className="space-y-2">
              <input
                className="corp-input w-full rounded-2xl px-4 py-3 text-sm"
                value={formData.sku}
                onChange={(e) => onChange("sku", e.target.value.toUpperCase())}
              />
              <button
                className="inline-flex max-w-full items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary"
                type="button"
                onClick={onUseSuggestedSku}
              >
                <WandSparkles size={14} />
                <span className="truncate">Usar sugerencia {suggestedSku}</span>
              </button>
            </div>
          </label>

          <label className="block min-w-0">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-default-500">Categorias</span>
            <div className="space-y-3">
              <div className="flex min-w-0 gap-2">
                <input
                  className="corp-input min-w-0 flex-1 rounded-2xl px-4 py-3 text-sm"
                  placeholder="Escribe y agrega una categoria"
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

        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-default-500">Nombre</span>
          <input className="corp-input w-full rounded-2xl px-4 py-3 text-sm" value={formData.name} onChange={(e) => onChange("name", e.target.value)} />
        </label>

        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-default-500">Descripcion</span>
          <textarea className="corp-input min-h-28 w-full rounded-2xl px-4 py-3 text-sm" value={formData.description} onChange={(e) => onChange("description", e.target.value)} />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-default-500">Precio</span>
            <div className="space-y-2">
              <input className="corp-input w-full rounded-2xl px-4 py-3 text-sm" min="0" step="0.01" type="number" value={formData.price} onChange={(e) => onChange("price", e.target.value)} />
              <p className="text-[11px] text-default-500">Carga costo primero y te sugerimos precio segun margen.</p>
              {suggestedPrices.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {suggestedPrices.map((suggestion) => (
                    <button key={suggestion.label} className="rounded-full bg-content2 px-3 py-1.5 text-[11px] font-semibold text-default-700" type="button" onClick={() => onApplySuggestedPrice(suggestion.value)}>
                      {suggestion.label}: ${suggestion.value}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </label>
          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-default-500">Costo</span>
            <input className="corp-input w-full rounded-2xl px-4 py-3 text-sm" min="0" step="0.01" type="number" value={formData.costPrice} onChange={(e) => onChange("costPrice", e.target.value)} />
          </label>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-default-500">Stock</span>
            <input className="corp-input w-full rounded-2xl px-4 py-3 text-sm" min="0" type="number" value={formData.stock} onChange={(e) => onChange("stock", e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-default-500">Minimo</span>
            <input className="corp-input w-full rounded-2xl px-4 py-3 text-sm" min="0" type="number" value={formData.minStock} onChange={(e) => onChange("minStock", e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-default-500">Unidad</span>
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
        <div className="h-[100dvh] w-screen overflow-hidden bg-background">{formLayout}</div>
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
      <DrawerContent className="h-screen w-full max-w-xl overflow-x-hidden rounded-none">
        <DrawerBody className="p-0">{formLayout}</DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}

// ── Product Detail Panel ──────────────────────────────────────────────────────

function ProductDetailPanel({
  productId,
  currency,
  isDesktop,
  onEdit,
  onDelete,
  onClose,
  isDeleting,
}: {
  productId: string;
  currency: string;
  isDesktop: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onClose?: () => void;
  isDeleting: boolean;
}) {
  const navigate = useNavigate();
  const [showAllMovements, setShowAllMovements] = useState(false);

  const { product, loading: detailLoading, error: detailError } = useProductDetail(productId);
  const { movements, loading: movementsLoading } = useStockMovements(
    { product: productId, limit: 50, page: 1 },
    { enabled: Boolean(productId) },
  );

  useEffect(() => { setShowAllMovements(false); }, [productId]);

  const movementSummary = useMemo(
    () => movements.reduce((acc, m) => { acc[m.type] = (acc[m.type] || 0) + 1; return acc; }, {} as Record<string, number>),
    [movements],
  );
  const visibleMovements = showAllMovements ? movements : movements.slice(0, MOVEMENTS_PREVIEW_LIMIT);

  const productCategories =
    product?.categories && product.categories.length > 0
      ? product.categories
      : product?.category
        ? [product.category]
        : [];

  const isLowStock = product ? product.stock <= (product.minStock || 5) : false;
  const isOutOfStock = product ? product.stock <= 0 : false;

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="page-header flex items-center gap-3">
        {!isDesktop && (
          <button
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-default-400 transition hover:text-foreground"
            onClick={() => navigate("/products")}
          >
            <ArrowUpRight className="rotate-180" size={16} />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <p className="section-kicker">Ficha de Producto</p>
          <h1 className="page-title truncate">{product?.name || "Cargando..."}</h1>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {product && (
            <>
              <button
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-default-400 transition hover:text-foreground"
                onClick={onEdit}
              >
                <Pencil size={14} />
                {isDesktop && "Editar"}
              </button>
              <button
                className="flex items-center gap-2 rounded-xl bg-danger/10 px-3 py-2 text-sm font-semibold text-danger transition hover:bg-danger/20 disabled:opacity-50"
                disabled={isDeleting}
                onClick={onDelete}
              >
                {isDeleting ? <Loader2 className="animate-spin" size={14} /> : <Trash2 size={14} />}
                {isDesktop && "Desactivar"}
              </button>
            </>
          )}
          {isDesktop && onClose && (
            <button
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-default-400 transition hover:text-foreground"
              onClick={onClose}
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 space-y-5 p-6">
        {detailLoading ? (
          <div className="py-20 text-center text-default-400">
            <Loader2 className="mx-auto mb-3 animate-spin" size={32} />
            <p className="text-sm">Cargando detalle...</p>
          </div>
        ) : detailError ? (
          <div className="py-12 text-center">
            <p className="text-sm font-semibold text-danger">No se pudo cargar el detalle</p>
            <p className="mt-2 text-xs text-default-500">{detailError}</p>
          </div>
        ) : !product ? (
          <div className="py-12 text-center">
            <p className="text-sm font-semibold text-foreground">Producto no encontrado</p>
          </div>
        ) : (
          <>
            {/* KPI row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="stat-card text-center">
                <p className="stat-card-label">Precio</p>
                <p className="stat-card-value mt-2">{formatCompactCurrency(product.price, currency)}</p>
              </div>
              <div className="stat-card text-center">
                <p className="stat-card-label">Costo</p>
                <p className="stat-card-value mt-2">
                  {product.costPrice != null ? formatCompactCurrency(product.costPrice, currency) : "—"}
                </p>
              </div>
              <div className={`stat-card text-center ${isOutOfStock ? "border-danger/30 bg-danger/5" : isLowStock ? "border-warning/30 bg-warning/5" : ""}`}>
                <p className="stat-card-label">Stock</p>
                <p className={`stat-card-value mt-2 ${isOutOfStock || isLowStock ? "text-danger" : ""}`}>
                  {isOutOfStock ? "0" : product.stock}
                </p>
                <p className="stat-card-sub">{product.unitOfMeasure || "unidades"}</p>
              </div>
            </div>

            {/* Stock alert */}
            {(isOutOfStock || isLowStock) && (
              <div className="flex items-center gap-3 rounded-2xl border border-danger/20 bg-danger/8 px-4 py-3">
                <AlertCircle className="shrink-0 text-danger" size={16} />
                <p className="text-sm font-semibold text-danger">
                  {isOutOfStock ? "Sin stock disponible" : `Stock bajo el mínimo (${product.minStock || 5})`}
                </p>
              </div>
            )}

            {/* General info */}
            <div className="stat-card space-y-3">
              <p className="text-sm font-bold text-foreground">Información General</p>
              <div className="grid gap-2.5 text-sm text-default-600">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-default-400">SKU</span>
                  <span className="font-mono text-foreground">{product.sku || "No definido"}</span>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <span className="font-semibold text-default-400">Categorías</span>
                  <span className="text-right text-foreground">
                    {productCategories.join(", ") || "Sin categoría"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-default-400">Stock mínimo</span>
                  <span className="text-foreground">{product.minStock || 0} {product.unitOfMeasure || "unidades"}</span>
                </div>
                {product.description && (
                  <div>
                    <span className="font-semibold text-default-400">Descripción</span>
                    <p className="mt-1 text-foreground">{product.description}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Margin info if cost available */}
            {product.costPrice != null && product.costPrice > 0 && product.price > 0 && (
              <div className="stat-card">
                <p className="text-sm font-bold text-foreground mb-3">Margen</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="stat-card-label">Ganancia por unidad</p>
                    <p className="mt-1 text-lg font-bold text-success">
                      {formatCompactCurrency(product.price - product.costPrice, currency)}
                    </p>
                  </div>
                  <div>
                    <p className="stat-card-label">Margen bruto</p>
                    <p className="mt-1 text-lg font-bold text-success">
                      {(((product.price - product.costPrice) / product.price) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Stock movements */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-bold text-foreground">Movimientos de stock</p>
                <span className="text-xs text-default-400">{movements.length} registros</span>
              </div>

              {movements.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {Object.entries(movementSummary).map(([type, count]) => (
                    <span key={type} className="badge bg-content2/70 text-default-600">
                      {type}: {count}
                    </span>
                  ))}
                </div>
              )}

              <div className="space-y-2">
                {movementsLoading ? (
                  <div className="stat-card py-8 text-center text-default-400">
                    <Loader2 className="mx-auto mb-2 animate-spin" size={22} />
                    <p className="text-sm">Cargando movimientos...</p>
                  </div>
                ) : movements.length > 0 ? (
                  visibleMovements.map((movement) => (
                    <div key={movement._id} className="list-row cursor-default hover:transform-none">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground">{movement.type}</p>
                        <p className="mt-0.5 text-xs text-default-500">{movement.reason || "Sin detalle"}</p>
                        <p className="mt-1 text-xs text-default-400">
                          {movement.source} · {new Date(movement.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`text-sm font-bold ${movement.type === "SALIDA" || movement.type === "MERMA" ? "text-danger" : "text-success"}`}>
                          {movement.type === "SALIDA" || movement.type === "MERMA" ? "-" : "+"}
                          {movement.quantity}
                        </p>
                        <p className="mt-0.5 text-xs text-default-400">→ {movement.stockAfter}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="stat-card py-8 text-center">
                    <PackageSearch className="mx-auto mb-3 text-default-400" size={28} />
                    <p className="text-sm font-medium text-foreground">Sin movimientos</p>
                    <p className="mt-1 text-xs text-default-500">Este producto no tiene historial de inventario.</p>
                  </div>
                )}
              </div>

              {!movementsLoading && movements.length > MOVEMENTS_PREVIEW_LIMIT && (
                <button
                  className="mt-3 w-full rounded-2xl border border-divider/70 px-4 py-2.5 text-xs font-semibold text-default-600 transition hover:bg-content2/60"
                  type="button"
                  onClick={() => setShowAllMovements((prev) => !prev)}
                >
                  {showAllMovements ? "Ver menos" : `Ver todos (${movements.length})`}
                </button>
              )}
            </div>

            {/* Soft delete note */}
            <div className="rounded-2xl border border-divider/70 bg-content2/30 px-4 py-3 text-xs text-default-500">
              <span className="inline-flex items-center gap-2 font-semibold text-foreground">
                <Archive size={14} />
                El borrado será lógico
              </span>
              <p className="mt-1.5">El producto se desactiva del catálogo pero conserva su trazabilidad histórica.</p>
            </div>

          </>
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ProductsPage() {
  const navigate = useNavigate();
  const { productId } = useParams<{ productId?: string }>();
  const isDesktop = useIsDesktop();
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const { products, total, loading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteProducts(20);
  const { settings } = useSettings();
  const currency = settings?.currency || "USD";
  const { createProduct, updateProduct, deleteProduct, isCreating, isUpdating, isDeleting } = useProducts({ enabled: false });
  const { showToast } = useAppToast();

  const DESKTOP_PAGE_SIZE = 15;
  const [desktopPage, setDesktopPage] = useState(1);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState<ProductFormState>({
    ...emptyForm,
    unitOfMeasure: settings?.defaultUnitOfMeasure || emptyForm.unitOfMeasure,
  });

  const safeProducts = useMemo(
    () => products.filter((p): p is Product => Boolean(p && typeof p === "object" && p._id)),
    [products],
  );

  const { product: selectedProduct } = useProductDetail(productId);

  useEffect(() => {
    if (showEditModal && selectedProduct) {
      setFormData({
        sku: selectedProduct.sku || "",
        name: selectedProduct.name || "",
        description: selectedProduct.description || "",
        price: selectedProduct.price?.toString() || "",
        costPrice: selectedProduct.costPrice?.toString() || "",
        stock: selectedProduct.stock?.toString() || "0",
        minStock: selectedProduct.minStock?.toString() || "0",
        categories:
          selectedProduct.categories && selectedProduct.categories.length > 0
            ? selectedProduct.categories
            : selectedProduct.category
              ? [selectedProduct.category]
              : [],
        categoryInput: "",
        unitOfMeasure: selectedProduct.unitOfMeasure || "unidad",
      });
    }
  }, [showEditModal, selectedProduct]);

  useEffect(() => {
    setDesktopPage(1);
  }, [searchQuery, activeFilter]);

  const filteredProducts = useMemo(() => {
    let result = safeProducts;
    const lowStockThreshold = settings?.lowStockThreshold || 5;

    if (activeFilter === "low_stock") {
      result = result.filter((p) => p.stock <= (p.minStock || lowStockThreshold));
    } else if (activeFilter !== "all") {
      result = result.filter((p) =>
        (p.categories && p.categories.length > 0 ? p.categories : p.category ? [p.category] : []).some(
          (cat) => cat.toLowerCase() === activeFilter.toLowerCase(),
        ),
      );
    }

    if (searchQuery) {
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.sku?.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    return result;
  }, [safeProducts, searchQuery, activeFilter, settings?.lowStockThreshold]);

  const desktopItems = isDesktop
    ? filteredProducts.slice((desktopPage - 1) * DESKTOP_PAGE_SIZE, desktopPage * DESKTOP_PAGE_SIZE)
    : filteredProducts;
  const desktopTotalPages = Math.ceil((total ?? filteredProducts.length) / DESKTOP_PAGE_SIZE);

  const handleDesktopNext = () => {
    const next = desktopPage + 1;
    if (next * DESKTOP_PAGE_SIZE > safeProducts.length && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
    setDesktopPage(next);
  };

  const categories = useMemo(() => {
    const cats = new Set(
      safeProducts.flatMap((p) =>
        p.categories && p.categories.length > 0 ? p.categories : p.category ? [p.category] : [],
      ),
    );
    return Array.from(cats);
  }, [safeProducts]);

  const existingSkus = useMemo(
    () => safeProducts.map((p) => p.sku).filter(Boolean).map((sku) => sku!.toUpperCase()),
    [safeProducts],
  );

  const suggestedSku = useMemo(() => {
    const currentSku = selectedProduct?.sku?.toUpperCase();
    const remainingSkus = currentSku ? existingSkus.filter((sku) => sku !== currentSku) : existingSkus;
    return buildSuggestedSku(formData.name, formData.categories, remainingSkus);
  }, [existingSkus, formData.categories, formData.name, selectedProduct?.sku]);

  const suggestedPrices = useMemo(() => {
    const cost = Number(formData.costPrice || 0);
    if (!cost) return [];
    return [
      { label: "Margen 30%", value: (cost / 0.7).toFixed(2) },
      { label: "Margen 40%", value: (cost / 0.6).toFixed(2) },
      { label: "Margen 50%", value: (cost / 0.5).toFixed(2) },
    ];
  }, [formData.costPrice]);

  const lowStockCount = safeProducts.filter(
    (p) => p.stock <= (p.minStock || settings?.lowStockThreshold || 5),
  ).length;

  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target || !hasNextPage || isDesktop) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0]?.isIntersecting && !isFetchingNextPage) fetchNextPage(); },
      { rootMargin: "240px 0px" },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, filteredProducts.length, isDesktop]);

  const resetForm = () =>
    setFormData({ ...emptyForm, unitOfMeasure: settings?.defaultUnitOfMeasure || emptyForm.unitOfMeasure });

  const handleFormChange = (field: keyof ProductFormState, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const buildPayload = () => ({
    sku: formData.sku || undefined,
    name: formData.name.trim(),
    description: formData.description.trim() || undefined,
    price: Number(formData.price || 0),
    costPrice: formData.costPrice ? Number(formData.costPrice) : undefined,
    stock: Number(formData.stock || 0),
    minStock: Number(formData.minStock || 0),
    category: formData.categories[0] || undefined,
    categories: formData.categories,
    unitOfMeasure: formData.unitOfMeasure || "unidad",
  });

  const handleCreateProduct = async () => {
    if (!formData.name.trim() || !formData.price) {
      showToast({ variant: "warning", message: "Completa al menos nombre y precio." });
      return;
    }
    try {
      await createProduct(buildPayload());
      resetForm();
      setShowCreateModal(false);
      showToast({ variant: "success", message: "Producto creado correctamente." });
    } catch (error) {
      showToast({ variant: "error", message: getErrorMessage(error, "No se pudo crear el producto.") });
    }
  };

  const handleUpdateProduct = async () => {
    if (!productId) return;
    try {
      await updateProduct({ id: productId, productData: buildPayload() });
      setShowEditModal(false);
      showToast({ variant: "success", message: "Producto actualizado correctamente." });
    } catch (error) {
      showToast({ variant: "error", message: getErrorMessage(error, "No se pudo actualizar el producto.") });
    }
  };

  const handleDeleteProduct = async () => {
    if (!productId || !selectedProduct) return;
    const confirmed = window.confirm(`¿Querés desactivar el producto "${selectedProduct.name}"?`);
    if (!confirmed) return;
    try {
      await deleteProduct(productId);
      navigate("/products");
      showToast({ variant: "success", message: "Producto desactivado correctamente." });
    } catch (error) {
      showToast({ variant: "error", message: getErrorMessage(error, "No se pudo desactivar el producto.") });
    }
  };

  const handleAddCategory = () => {
    const normalized = formData.categoryInput.trim();
    if (!normalized) return;
    setFormData((prev) => ({
      ...prev,
      categories: prev.categories.includes(normalized) ? prev.categories : [...prev.categories, normalized],
      categoryInput: "",
    }));
  };

  const handleRemoveCategory = (category: string) =>
    setFormData((prev) => ({ ...prev, categories: prev.categories.filter((item) => item !== category) }));

  // Mobile: full-screen detail
  if (!isDesktop && productId) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <ProductDetailPanel
          currency={currency}
          isDeleting={isDeleting}
          isDesktop={false}
          productId={productId}
          onDelete={handleDeleteProduct}
          onEdit={() => setShowEditModal(true)}
        />
        {showEditModal && (
          <ProductFormModal
            existingCategories={categories}
            formData={formData}
            isDesktop={false}
            mode="edit"
            submitting={isUpdating}
            suggestedPrices={suggestedPrices}
            suggestedSku={suggestedSku}
            onAddCategory={handleAddCategory}
            onApplySuggestedPrice={(value) => handleFormChange("price", value)}
            onChange={handleFormChange}
            onClose={() => setShowEditModal(false)}
            onRemoveCategory={handleRemoveCategory}
            onSubmit={handleUpdateProduct}
            onUseSuggestedSku={() => handleFormChange("sku", suggestedSku)}
          />
        )}
      </div>
    );
  }

  // ── List panel (shared mobile + desktop left column) ──────────────────────

  const listPanel = (
    <div className="flex flex-col">
      {/* Header */}
      <div className="page-header">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="section-kicker">Inventario</p>
            <h1 className="page-title">Catálogo</h1>
          </div>
          <button
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-[0_8px_20px_rgba(88,176,156,0.35)] transition hover:scale-105"
            onClick={() => { resetForm(); setShowCreateModal(true); }}
          >
            <Plus size={18} />
          </button>
        </div>

        {/* KPIs */}
        <div className={`mt-4 grid gap-3 ${isDesktop ? "grid-cols-4" : "grid-cols-2"}`}>
          <div className="stat-card p-3">
            <p className="stat-card-label">Productos</p>
            <p className="mt-1.5 text-2xl font-bold tracking-tight text-foreground">{total || safeProducts.length}</p>
          </div>
          <div className={`stat-card p-3 ${lowStockCount > 0 ? "border-danger/25 bg-danger/5" : ""}`}>
            <p className="stat-card-label">Stock Bajo</p>
            <p className={`mt-1.5 text-2xl font-bold tracking-tight ${lowStockCount > 0 ? "text-danger" : "text-foreground"}`}>
              {lowStockCount}
            </p>
          </div>
          {isDesktop && (
            <>
              <div className="stat-card p-3">
                <p className="stat-card-label">Categorías</p>
                <p className="mt-1.5 text-2xl font-bold tracking-tight text-foreground">{categories.length}</p>
              </div>
              <div className="stat-card p-3">
                <p className="stat-card-label">Con costo</p>
                <p className="mt-1.5 text-2xl font-bold tracking-tight text-foreground">
                  {safeProducts.filter((p) => p.costPrice != null && p.costPrice > 0).length}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Search */}
        <div className="search-bar mt-4">
          <Search className="shrink-0 text-default-400" size={16} />
          <input
            className="min-w-0 flex-1 bg-transparent text-sm text-foreground placeholder:text-default-400 focus:outline-none"
            placeholder="Buscar por nombre o SKU..."
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="shrink-0 text-default-400 hover:text-foreground">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Category filters */}
      <div className="flex gap-2 overflow-x-auto px-4 py-3 no-scrollbar">
        {[{ key: "all", label: "Todos" }, { key: "low_stock", label: "Críticos" }, ...categories.map((cat) => ({ key: cat, label: cat }))].map(({ key, label }) => (
          <button
            key={key}
            className={`shrink-0 rounded-full px-4 py-1.5 text-[11px] font-bold tracking-wide transition ${
              activeFilter === key
                ? key === "low_stock"
                  ? "bg-danger text-danger-foreground"
                  : "bg-primary text-primary-foreground"
                : "app-panel-soft text-default-600"
            }`}
            onClick={() => setActiveFilter(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Product list */}
      <div className="px-4 pb-6 space-y-2">
        {loading && products.length === 0 ? (
          <div className="py-16 text-center text-default-400">
            <Loader2 className="mx-auto mb-3 animate-spin" size={28} />
            <p className="text-sm">Cargando catálogo...</p>
          </div>
        ) : filteredProducts.length > 0 ? (
          <>
            {(isDesktop ? desktopItems : filteredProducts).map((product) => {
              const isLow = product.stock <= (product.minStock || settings?.lowStockThreshold || 5);
              const isOut = product.stock <= 0;
              const productCats =
                product.categories && product.categories.length > 0
                  ? product.categories
                  : product.category
                    ? [product.category]
                    : [];
              const isSelected = product._id === productId;

              return (
                <button
                  key={product._id}
                  className={`list-row w-full ${isSelected ? "border-primary/30 bg-primary/8 shadow-sm" : ""}`}
                  onClick={() => navigate(`/products/${product._id}`)}
                >
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${isOut ? "bg-danger/15 text-danger" : isLow ? "bg-warning/15 text-warning" : "bg-primary/12 text-primary"}`}>
                    <Boxes size={18} />
                  </div>

                  {/* Name + SKU + categories */}
                  <div className="min-w-0 flex-1 text-left">
                    <p className="truncate text-sm font-semibold text-foreground">{product.name}</p>
                    <div className="mt-0.5 flex items-center gap-2">
                      <span className="font-mono text-xs text-default-400">{product.sku || "—"}</span>
                      {productCats.slice(0, isDesktop ? 2 : 1).map((cat) => (
                        <span key={cat} className="badge bg-content2/70 text-default-500">{cat}</span>
                      ))}
                    </div>
                    {/* Stock visible on mobile inline */}
                    {!isDesktop && (
                      <p className={`mt-1 text-xs font-semibold ${isOut || isLow ? "text-danger" : "text-default-500"}`}>
                        {isOut ? "Sin stock" : `${product.stock} ${product.unitOfMeasure || "u."}`}
                      </p>
                    )}
                  </div>

                  {/* Stock — desktop column */}
                  {isDesktop && (
                    <div className="hidden lg:block shrink-0 w-28 text-right">
                      <p className={`text-xs font-semibold ${isOut || isLow ? "text-danger" : "text-default-500"}`}>
                        {isOut ? "Sin stock" : `${product.stock} ${product.unitOfMeasure || "u."}`}
                      </p>
                      {isLow && !isOut && <p className="text-[10px] text-warning">Stock bajo</p>}
                    </div>
                  )}

                  {/* Cost — desktop column */}
                  {isDesktop && (
                    <div className="hidden lg:block shrink-0 w-24 text-right">
                      <p className="text-[10px] uppercase tracking-wide text-default-400">Costo</p>
                      <p className="text-xs font-semibold text-default-500">
                        {product.costPrice != null ? formatCompactCurrency(product.costPrice, currency) : "—"}
                      </p>
                    </div>
                  )}

                  {/* Price + margin */}
                  <div className="shrink-0 text-right">
                    {isDesktop && <p className="text-[10px] uppercase tracking-wide text-default-400">Precio</p>}
                    <p className="text-sm font-bold text-foreground">{formatCompactCurrency(product.price, currency)}</p>
                    {isDesktop && product.costPrice != null && product.costPrice > 0 && product.price > 0 && (
                      <p className="text-[10px] text-success">
                        {(((product.price - product.costPrice) / product.price) * 100).toFixed(0)}% mg
                      </p>
                    )}
                  </div>

                  <ChevronRight className={`shrink-0 ${isSelected ? "text-primary" : "text-default-300"}`} size={16} />
                </button>
              );
            })}

            {!isDesktop && (
              <>
                <div ref={loadMoreRef} className="h-4 w-full" />
                {isFetchingNextPage && (
                  <div className="py-4 text-center text-default-400">
                    <Loader2 className="mx-auto animate-spin" size={20} />
                  </div>
                )}
                {!hasNextPage && safeProducts.length > 0 && (
                  <p className="py-3 text-center text-xs text-default-400">Fin del catálogo</p>
                )}
              </>
            )}
            {isDesktop && (
              <PaginationBar
                from={(desktopPage - 1) * DESKTOP_PAGE_SIZE + 1}
                loading={isFetchingNextPage}
                page={desktopPage}
                to={Math.min(desktopPage * DESKTOP_PAGE_SIZE, total ?? filteredProducts.length)}
                total={total ?? filteredProducts.length}
                totalPages={desktopTotalPages}
                onNext={handleDesktopNext}
                onPrev={() => setDesktopPage((p) => p - 1)}
              />
            )}
          </>
        ) : (
          <div className="py-16 text-center text-default-400">
            <Layers3 className="mx-auto mb-3" size={28} />
            <p className="text-sm font-medium">No se encontraron productos</p>
          </div>
        )}
      </div>

      {/* Mobile FAB */}
      {!isDesktop && (
        <button
          className="fixed bottom-[100px] right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_16px_34px_rgba(88,176,156,0.35)] transition-transform hover:scale-105 active:scale-95"
          onClick={() => { resetForm(); setShowCreateModal(true); }}
        >
          <Plus size={26} strokeWidth={2.5} />
        </button>
      )}
    </div>
  );

  // ── Modals (rendered outside grid so they don't clip) ─────────────────────

  const modals = (
    <>
      {showCreateModal && (
        <ProductFormModal
          existingCategories={categories}
          formData={formData}
          isDesktop={isDesktop}
          mode="create"
          submitting={isCreating}
          suggestedPrices={suggestedPrices}
          suggestedSku={suggestedSku}
          onAddCategory={handleAddCategory}
          onApplySuggestedPrice={(value) => handleFormChange("price", value)}
          onChange={handleFormChange}
          onClose={() => { setShowCreateModal(false); resetForm(); }}
          onRemoveCategory={handleRemoveCategory}
          onSubmit={handleCreateProduct}
          onUseSuggestedSku={() => handleFormChange("sku", suggestedSku)}
        />
      )}
      {showEditModal && (
        <ProductFormModal
          existingCategories={categories}
          formData={formData}
          isDesktop={isDesktop}
          mode="edit"
          submitting={isUpdating}
          suggestedPrices={suggestedPrices}
          suggestedSku={suggestedSku}
          onAddCategory={handleAddCategory}
          onApplySuggestedPrice={(value) => handleFormChange("price", value)}
          onChange={handleFormChange}
          onClose={() => setShowEditModal(false)}
          onRemoveCategory={handleRemoveCategory}
          onSubmit={handleUpdateProduct}
          onUseSuggestedSku={() => handleFormChange("sku", suggestedSku)}
        />
      )}
    </>
  );

  // Desktop: full-width list + slide-over panel
  if (isDesktop) {
    return (
      <div className="h-screen overflow-hidden">
        <div className="h-full overflow-y-auto">
          {listPanel}
        </div>

        {/* Backdrop */}
        <div
          className={`fixed inset-0 z-40 transition-all duration-300 ${productId ? "bg-black/30 backdrop-blur-[2px]" : "pointer-events-none opacity-0"}`}
          onClick={() => navigate("/products")}
        />

        {/* Slide-over panel */}
        <div
          className={`fixed right-0 top-0 z-50 h-screen w-[min(700px,58vw)] overflow-y-auto border-l border-white/10 shadow-[-24px_0_60px_rgba(10,22,44,0.28)] transition-transform duration-300 ease-in-out ${productId ? "translate-x-0" : "translate-x-full"}`}
          style={{ background: "color-mix(in srgb, var(--heroui-content1) 98%, transparent)" }}
        >
          {productId && (
            <ProductDetailPanel
              currency={currency}
              isDeleting={isDeleting}
              isDesktop={true}
              productId={productId}
              onClose={() => navigate("/products")}
              onDelete={handleDeleteProduct}
              onEdit={() => setShowEditModal(true)}
            />
          )}
        </div>

        {modals}
      </div>
    );
  }

  // Mobile: full-screen list
  return (
    <div className="flex min-h-screen flex-col bg-background pb-24">
      {listPanel}
      {modals}
    </div>
  );
}
