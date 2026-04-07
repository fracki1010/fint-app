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
  ArrowUpRight,
  Archive,
  WandSparkles,
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
import { useMobileHeaderCompact } from "@/hooks/useMobileHeaderCompact";
import { useSettings } from "@/hooks/useSettings";
import { useStockMovements } from "@/hooks/useStockMovements";
import { Product } from "@/types";
import { useAppToast } from "@/components/AppToast";
import { formatCompactCurrency } from "@/utils/currency";
import { getErrorMessage } from "@/utils/errors";

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
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toUpperCase();
}

function buildSuggestedSku(
  name: string,
  categories: string[],
  existingSkus: string[],
) {
  const categoryPrefix =
    slugifyText(categories[0] || "GEN").slice(0, 3) || "GEN";
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
  return (
    <Drawer
      hideCloseButton
      isOpen
      backdrop="opaque"
      placement={isDesktop ? "right" : "bottom"}
      scrollBehavior="inside"
      size={isDesktop ? "xl" : "full"}
      onOpenChange={(open: boolean) => {
        if (!open) onClose();
      }}
    >
      <DrawerContent
        className={
          isDesktop
            ? "h-screen w-full max-w-xl overflow-x-hidden rounded-none"
            : "h-screen w-screen max-w-none overflow-x-hidden rounded-none"
        }
      >
        <DrawerBody className="flex h-full flex-col overflow-x-hidden p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="section-kicker">
                {mode === "create" ? "Alta de Producto" : "Edicion"}
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-foreground">
                {mode === "create" ? "Nuevo producto" : "Editar producto"}
              </h2>
            </div>
            <button
              className="app-panel-soft flex h-10 w-10 items-center justify-center rounded-2xl text-default-500"
              onClick={onClose}
            >
              <X size={18} />
            </button>
          </div>

          <div className="mt-6 grid flex-1 gap-4 overflow-y-auto pr-1">
            <div className="grid grid-cols-1 gap-4">
              <label className="block min-w-0">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-default-500">
                  SKU
                </span>
                <div className="space-y-2">
                  <input
                    className="corp-input w-full rounded-2xl px-4 py-3 text-sm"
                    value={formData.sku}
                    onChange={(e) =>
                      onChange("sku", e.target.value.toUpperCase())
                    }
                  />
                  <button
                    className="inline-flex max-w-full items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary"
                    type="button"
                    onClick={onUseSuggestedSku}
                  >
                    <WandSparkles size={14} />
                    <span className="truncate">
                      Usar sugerencia {suggestedSku}
                    </span>
                  </button>
                </div>
              </label>
              <label className="block min-w-0">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-default-500">
                  Categorias
                </span>
                <div className="space-y-3">
                  <div className="flex min-w-0 gap-2">
                    <input
                      className="corp-input min-w-0 flex-1 rounded-2xl px-4 py-3 text-sm"
                      placeholder="Escribe y agrega una categoria"
                      value={formData.categoryInput}
                      onChange={(e) =>
                        onChange("categoryInput", e.target.value)
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === ",") {
                          e.preventDefault();
                          onAddCategory();
                        }
                      }}
                    />
                    <button
                      className="shrink-0 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground"
                      type="button"
                      onClick={onAddCategory}
                    >
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
                          <span className="block max-w-full truncate">
                            {category}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </label>
            </div>

            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-default-500">
                Nombre
              </span>
              <input
                className="corp-input w-full rounded-2xl px-4 py-3 text-sm"
                value={formData.name}
                onChange={(e) => onChange("name", e.target.value)}
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-default-500">
                Descripcion
              </span>
              <textarea
                className="corp-input min-h-28 w-full rounded-2xl px-4 py-3 text-sm"
                value={formData.description}
                onChange={(e) => onChange("description", e.target.value)}
              />
            </label>

            <div className="grid grid-cols-2 gap-4">
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-default-500">
                  Precio
                </span>
                <div className="space-y-2">
                  <input
                    className="corp-input w-full rounded-2xl px-4 py-3 text-sm"
                    min="0"
                    step="0.01"
                    type="number"
                    value={formData.price}
                    onChange={(e) => onChange("price", e.target.value)}
                  />
                  <p className="text-[11px] text-default-500">
                    Carga costo primero y te sugerimos precio segun margen.
                  </p>
                  {suggestedPrices.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {suggestedPrices.map((suggestion) => (
                        <button
                          key={suggestion.label}
                          className="rounded-full bg-content2 px-3 py-1.5 text-[11px] font-semibold text-default-700"
                          type="button"
                          onClick={() =>
                            onApplySuggestedPrice(suggestion.value)
                          }
                        >
                          {suggestion.label}: ${suggestion.value}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </label>
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-default-500">
                  Costo
                </span>
                <div className="space-y-2">
                  <input
                    className="corp-input w-full rounded-2xl px-4 py-3 text-sm"
                    min="0"
                    step="0.01"
                    type="number"
                    value={formData.costPrice}
                    onChange={(e) => onChange("costPrice", e.target.value)}
                  />
                </div>
              </label>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-default-500">
                  Stock
                </span>
                <input
                  className="corp-input w-full rounded-2xl px-4 py-3 text-sm"
                  min="0"
                  type="number"
                  value={formData.stock}
                  onChange={(e) => onChange("stock", e.target.value)}
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-default-500">
                  Minimo
                </span>
                <input
                  className="corp-input w-full rounded-2xl px-4 py-3 text-sm"
                  min="0"
                  type="number"
                  value={formData.minStock}
                  onChange={(e) => onChange("minStock", e.target.value)}
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-default-500">
                  Unidad
                </span>
                <Select
                  aria-label="Unidad de medida"
                  classNames={{
                    base: "w-full",
                    trigger:
                      "corp-input min-h-[48px] rounded-2xl px-4 text-sm text-foreground",
                    value: "text-foreground",
                    popoverContent: "bg-content1 text-foreground",
                    listbox: "bg-content1 text-foreground",
                  }}
                  selectedKeys={[formData.unitOfMeasure]}
                  variant="bordered"
                  onSelectionChange={(keys) =>
                    onChange("unitOfMeasure", Array.from(keys)[0] as string)
                  }
                >
                  {UNIT_OPTIONS.map((option) => (
                    <SelectItem key={option.value}>{option.label}</SelectItem>
                  ))}
                </Select>
              </label>
            </div>
          </div>

          <div className="mt-6 flex shrink-0 gap-3 border-t border-divider/70 pt-4">
            <button
              className="app-panel-soft flex-1 rounded-2xl px-4 py-3 text-sm font-semibold text-default-600"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              className="flex-1 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
              disabled={submitting}
              onClick={onSubmit}
            >
              <span className="flex items-center justify-center gap-2">
                {submitting && <Loader2 className="animate-spin" size={18} />}
                {mode === "create" ? "Crear producto" : "Guardar cambios"}
              </span>
            </button>
          </div>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}

export default function ProductsPage() {
  const navigate = useNavigate();
  const { productId } = useParams<{ productId?: string }>();
  const isDesktop = useIsDesktop();
  const isHeaderCompact = useMobileHeaderCompact();
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const {
    products,
    total,
    loading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteProducts(20);
  const { settings } = useSettings();
  const currency = settings?.currency || "USD";
  const {
    createProduct,
    updateProduct,
    deleteProduct,
    isCreating,
    isUpdating,
    isDeleting,
  } = useProducts({ enabled: false });
  const { showToast } = useAppToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAllMovements, setShowAllMovements] = useState(false);
  const [formData, setFormData] = useState<ProductFormState>({
    ...emptyForm,
    unitOfMeasure: settings?.defaultUnitOfMeasure || emptyForm.unitOfMeasure,
  });

  const safeProducts = useMemo(
    () =>
      products.filter((product): product is Product =>
        Boolean(product && typeof product === "object" && product._id),
      ),
    [products],
  );

  const {
    product: selectedProduct,
    loading: detailLoading,
    error: detailError,
  } = useProductDetail(productId);

  const { movements, loading: movementsLoading } = useStockMovements(
    {
      product: productId,
      limit: 50,
      page: 1,
    },
    { enabled: Boolean(productId) },
  );
  const movementSummary = useMemo(
    () =>
      movements.reduce(
        (acc, movement) => {
          acc[movement.type] = (acc[movement.type] || 0) + 1;

          return acc;
        },
        {} as Record<string, number>,
      ),
    [movements],
  );
  const visibleMovements = showAllMovements
    ? movements
    : movements.slice(0, MOVEMENTS_PREVIEW_LIMIT);

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
    setShowAllMovements(false);
  }, [productId]);

  const filteredProducts = useMemo(() => {
    let result = safeProducts;
    const lowStockThreshold = settings?.lowStockThreshold || 5;

    if (activeFilter === "low_stock") {
      result = result.filter(
        (p) => p.stock <= (p.minStock || lowStockThreshold),
      );
    } else if (activeFilter !== "all") {
      result = result.filter((p) =>
        (p.categories && p.categories.length > 0
          ? p.categories
          : p.category
            ? [p.category]
            : []
        ).some(
          (category) => category.toLowerCase() === activeFilter.toLowerCase(),
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

  const categories = useMemo(() => {
    const cats = new Set(
      safeProducts.flatMap((p) =>
        p.categories && p.categories.length > 0
          ? p.categories
          : p.category
            ? [p.category]
            : [],
      ),
    );

    return Array.from(cats);
  }, [safeProducts]);

  const existingSkus = useMemo(
    () =>
      safeProducts
        .map((product) => product.sku)
        .filter(Boolean)
        .map((sku) => sku!.toUpperCase()),
    [safeProducts],
  );

  const suggestedSku = useMemo(() => {
    const currentSku = selectedProduct?.sku?.toUpperCase();
    const remainingSkus = currentSku
      ? existingSkus.filter((sku) => sku !== currentSku)
      : existingSkus;

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

    if (!target || !hasNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "240px 0px" },
    );

    observer.observe(target);

    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, filteredProducts.length]);

  const resetForm = () =>
    setFormData({
      ...emptyForm,
      unitOfMeasure: settings?.defaultUnitOfMeasure || emptyForm.unitOfMeasure,
    });

  const handleFormChange = (field: keyof ProductFormState, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

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
      showToast({
        variant: "warning",
        message: "Completa al menos nombre y precio.",
      });

      return;
    }

    try {
      await createProduct(buildPayload());
      resetForm();
      setShowCreateModal(false);
      showToast({
        variant: "success",
        message: "Producto creado correctamente.",
      });
    } catch (error) {
      showToast({
        variant: "error",
        message: getErrorMessage(error, "No se pudo crear el producto."),
      });
    }
  };

  const handleUpdateProduct = async () => {
    if (!productId) return;

    try {
      await updateProduct({
        id: productId,
        productData: buildPayload(),
      });
      setShowEditModal(false);
      showToast({
        variant: "success",
        message: "Producto actualizado correctamente.",
      });
    } catch (error) {
      showToast({
        variant: "error",
        message: getErrorMessage(error, "No se pudo actualizar el producto."),
      });
    }
  };

  const handleDeleteProduct = async () => {
    if (!productId || !selectedProduct) return;

    const confirmed = window.confirm(
      `¿Quieres desactivar el producto "${selectedProduct.name}"?`,
    );

    if (!confirmed) return;

    try {
      await deleteProduct(productId);
      navigate("/products");
      showToast({
        variant: "success",
        message: "Producto desactivado correctamente.",
      });
    } catch (error) {
      showToast({
        variant: "error",
        message: getErrorMessage(error, "No se pudo desactivar el producto."),
      });
    }
  };

  const openProductDetail = (product: Product) => {
    navigate(`/products/${product._id}`);
  };

  const handleAddCategory = () => {
    const normalized = formData.categoryInput.trim();

    if (!normalized) return;

    setFormData((prev) => ({
      ...prev,
      categories: prev.categories.includes(normalized)
        ? prev.categories
        : [...prev.categories, normalized],
      categoryInput: "",
    }));
  };

  const handleRemoveCategory = (category: string) => {
    setFormData((prev) => ({
      ...prev,
      categories: prev.categories.filter((item) => item !== category),
    }));
  };

  if (productId) {
    return (
      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col bg-background pb-24 font-sans lg:max-w-none lg:pb-8">
        <header
          className={`app-topbar sticky top-0 z-30 border-b border-divider/60 bg-background/95 backdrop-blur-xl transition-all duration-300 ${
            isHeaderCompact ? "px-4 pb-3 pt-3" : "px-6 pb-4 pt-6"
          }`}
        >
          <button
            className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.14em] text-default-500"
            onClick={() => navigate("/products")}
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
            Ficha de Producto
          </p>
          <h1
            className={`font-semibold tracking-[-0.03em] text-foreground transition-all duration-300 ${
              isHeaderCompact ? "mt-1 text-xl" : "mt-2 text-[28px]"
            }`}
          >
            {selectedProduct?.name || "Cargando..."}
          </h1>
        </header>

        <div className="flex-1 px-6 pb-6">
          {detailLoading ? (
            <div className="py-16 text-center text-default-400">
              <Loader2 className="mx-auto mb-3 animate-spin" size={32} />
              <p className="text-sm">Cargando detalle del producto...</p>
            </div>
          ) : detailError ? (
            <div className="py-12 text-center">
              <p className="text-sm font-semibold text-danger">
                No se pudo cargar el detalle del producto
              </p>
              <p className="mt-2 text-xs text-default-500">{detailError}</p>
            </div>
          ) : !selectedProduct ? (
            <div className="py-12 text-center">
              <p className="text-sm font-semibold text-foreground">
                No encontramos informacion para este producto
              </p>
              <p className="mt-2 text-xs text-default-500">
                Puede que haya sido desactivado o que el backend necesite
                reinicio.
              </p>
            </div>
          ) : (
            <>
              <div className="mt-1 grid grid-cols-2 gap-4">
                <div className="app-panel-soft rounded-[24px] p-4">
                  <p className="section-kicker">Precio</p>
                  <p className="mt-3 text-2xl font-semibold text-foreground">
                    {formatCompactCurrency(selectedProduct.price, currency)}
                  </p>
                </div>
                <div className="app-panel-soft rounded-[24px] p-4">
                  <p className="section-kicker">Stock Actual</p>
                  <p className="mt-3 text-2xl font-semibold text-foreground">
                    {selectedProduct.stock}{" "}
                    {selectedProduct.unitOfMeasure || "unidades"}
                  </p>
                </div>
              </div>

              <div className="mt-5 app-panel-soft rounded-[24px] p-5">
                <h3 className="text-sm font-semibold text-foreground">
                  Informacion General
                </h3>
                <div className="mt-4 grid gap-3 text-sm text-default-600">
                  <p>
                    <span className="font-semibold text-foreground">SKU:</span>{" "}
                    {selectedProduct.sku || "No definido"}
                  </p>
                  <p>
                    <span className="font-semibold text-foreground">
                      Categorias:
                    </span>{" "}
                    <span className="break-words">
                      {(selectedProduct.categories &&
                      selectedProduct.categories.length > 0
                        ? selectedProduct.categories
                        : selectedProduct.category
                          ? [selectedProduct.category]
                          : []
                      ).join(", ") || "Sin categoria"}
                    </span>
                  </p>
                  <p>
                    <span className="font-semibold text-foreground">
                      Costo:
                    </span>{" "}
                    {selectedProduct.costPrice != null
                      ? formatCompactCurrency(
                          selectedProduct.costPrice,
                          currency,
                        )
                      : "No definido"}
                  </p>
                  <p>
                    <span className="font-semibold text-foreground">
                      Stock minimo:
                    </span>{" "}
                    {selectedProduct.minStock || 0}
                  </p>
                  <p>
                    <span className="font-semibold text-foreground">
                      Descripcion:
                    </span>{" "}
                    {selectedProduct.description || "Sin descripcion"}
                  </p>
                </div>
              </div>

              <div className="mt-5">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">
                    Movimientos del producto
                  </h3>
                  <span className="text-xs text-default-400">
                    {movements.length} registros
                  </span>
                </div>

                {movements.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {Object.entries(movementSummary).map(([type, count]) => (
                      <span
                        key={type}
                        className="rounded-full bg-content2/70 px-3 py-1 text-[11px] font-semibold text-default-600"
                      >
                        {type}: {count}
                      </span>
                    ))}
                  </div>
                )}

                <div className="max-h-[46vh] space-y-3 overflow-y-auto pr-1">
                  {movementsLoading ? (
                    <div className="app-panel-soft rounded-[22px] p-5 text-center text-default-400">
                      <Loader2
                        className="mx-auto mb-2 animate-spin"
                        size={22}
                      />
                      <p className="text-sm">Cargando movimientos...</p>
                    </div>
                  ) : movements.length > 0 ? (
                    visibleMovements.map((movement) => (
                      <div
                        key={movement._id}
                        className="app-panel-soft rounded-[22px] p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-foreground">
                              {movement.type}
                            </p>
                            <p className="mt-1 text-xs text-default-500">
                              {movement.reason || "Movimiento sin detalle"}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-foreground">
                              {movement.type === "SALIDA" ||
                              movement.type === "MERMA"
                                ? "-"
                                : "+"}
                              {movement.quantity}
                            </p>
                            <p className="mt-1 text-xs text-default-500">
                              Stock: {movement.stockAfter}
                            </p>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center justify-between text-xs text-default-400">
                          <span>{movement.source}</span>
                          <span>
                            {new Date(movement.createdAt).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="app-panel-soft rounded-[22px] p-6 text-center">
                      <PackageSearch
                        className="mx-auto mb-3 text-default-400"
                        size={28}
                      />
                      <p className="text-sm font-medium text-foreground">
                        Sin movimientos registrados
                      </p>
                      <p className="mt-2 text-xs text-default-500">
                        Este producto aun no tiene historial de inventario.
                      </p>
                    </div>
                  )}
                </div>
                {!movementsLoading &&
                  movements.length > MOVEMENTS_PREVIEW_LIMIT && (
                    <button
                      className="mt-4 w-full rounded-2xl border border-divider/70 px-4 py-2.5 text-xs font-semibold text-default-600 transition hover:bg-content2/60"
                      type="button"
                      onClick={() => setShowAllMovements((prev) => !prev)}
                    >
                      {showAllMovements
                        ? "Ver menos movimientos"
                        : `Ver todos (${movements.length})`}
                    </button>
                  )}
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  className="app-panel-soft flex flex-1 items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-default-600"
                  onClick={() => setShowEditModal(true)}
                >
                  <Pencil size={18} />
                  Editar
                </button>
                <button
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-danger px-4 py-3 text-sm font-semibold text-danger-foreground disabled:opacity-50"
                  disabled={isDeleting}
                  onClick={handleDeleteProduct}
                >
                  {isDeleting ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <Trash2 size={18} />
                  )}
                  Soft delete
                </button>
              </div>

              <div className="mt-4 rounded-2xl border border-divider/70 bg-content2/45 px-4 py-3 text-xs text-default-500">
                <span className="inline-flex items-center gap-2 font-semibold text-foreground">
                  <Archive size={14} />
                  El borrado sera logico
                </span>
                <p className="mt-2">
                  El producto se desactiva del catalogo operativo pero conserva
                  su trazabilidad historica.
                </p>
              </div>
            </>
          )}
        </div>

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
      </div>
    );
  }

  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col overflow-hidden bg-background pb-24 font-sans lg:max-w-none lg:px-6 lg:pb-8">
      <header className="app-topbar px-6 pt-6 pb-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="section-kicker">Inventario</div>
            <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.03em] text-foreground">
              Catalogo Operativo
            </h1>
            <p className="mt-2 text-sm text-default-500">
              Altas, consulta detallada, edicion y seguimiento historico.
            </p>
          </div>
          <button
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[0_16px_34px_rgba(88,176,156,0.35)]"
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
          >
            <Plus size={20} />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="app-panel rounded-[24px] p-4">
            <p className="section-kicker">Productos</p>
            <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-foreground">
              {total || safeProducts.length}
            </p>
          </div>
          <div className="app-panel rounded-[24px] p-4">
            <p className="section-kicker">Stock Bajo</p>
            <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-danger">
              {lowStockCount}
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
            placeholder="Buscar por nombre o SKU..."
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </header>

      <div className="px-6 py-5">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          <button
            className={`shrink-0 rounded-full px-5 py-2 text-[12px] font-semibold tracking-wide transition ${
              activeFilter === "all"
                ? "bg-primary text-primary-foreground"
                : "app-panel-soft text-default-600"
            }`}
            onClick={() => setActiveFilter("all")}
          >
            Todos
          </button>
          <button
            className={`shrink-0 rounded-full px-5 py-2 text-[12px] font-semibold tracking-wide transition ${
              activeFilter === "low_stock"
                ? "bg-danger text-danger-foreground"
                : "app-panel-soft text-default-600"
            }`}
            onClick={() => setActiveFilter("low_stock")}
          >
            Criticos
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              className={`shrink-0 rounded-full px-5 py-2 text-[12px] font-semibold tracking-wide transition ${
                activeFilter === cat
                  ? "bg-primary text-primary-foreground"
                  : "app-panel-soft text-default-600"
              }`}
              onClick={() => setActiveFilter(cat as string)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 space-y-3 px-6 pb-6">
        {loading && products.length === 0 ? (
          <div className="app-panel rounded-[24px] py-12 text-center text-default-400">
            <Loader2 className="mx-auto mb-3 animate-spin" size={32} />
            <p className="text-sm font-medium">Cargando catalogo...</p>
          </div>
        ) : filteredProducts.length > 0 ? (
          <>
            <div className="hidden lg:block">
              <div className="app-panel overflow-x-auto rounded-[24px] p-2">
                <table className="w-full min-w-[960px]">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-[0.16em] text-default-500">
                      <th className="px-3 pb-3 pt-2">Producto</th>
                      <th className="px-3 pb-3 pt-2">SKU</th>
                      <th className="px-3 pb-3 pt-2">Categorias</th>
                      <th className="px-3 pb-3 pt-2">Stock</th>
                      <th className="px-3 pb-3 pt-2 text-right">Precio</th>
                      <th className="px-3 pb-3 pt-2 text-right">Accion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product) => {
                      const productStock = product.stock ?? 0;
                      const productPrice = product.price ?? 0;
                      const isLowStock =
                        productStock <=
                        (product.minStock || settings?.lowStockThreshold || 5);
                      const isOutOfStock = productStock <= 0;

                      return (
                        <tr
                          key={product._id}
                          className="cursor-pointer border-t border-divider/60"
                          onClick={() => openProductDetail(product)}
                        >
                          <td className="px-3 py-3 text-sm font-semibold text-foreground">
                            {product.name}
                          </td>
                          <td className="px-3 py-3 text-sm text-default-500">
                            {product.sku || "No definido"}
                          </td>
                          <td className="px-3 py-3 text-sm text-default-500">
                            {(product.categories && product.categories.length > 0
                              ? product.categories
                              : product.category
                                ? [product.category]
                                : []
                            )
                              .slice(0, 3)
                              .join(", ") || "Sin categoria"}
                          </td>
                          <td className="px-3 py-3 text-sm">
                            <span
                              className={
                                isOutOfStock || isLowStock
                                  ? "font-semibold text-danger"
                                  : "text-default-600"
                              }
                            >
                              {isOutOfStock
                                ? "Sin stock"
                                : `${productStock} ${product.unitOfMeasure || "unidades"}`}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-right text-sm font-semibold text-foreground">
                            {formatCompactCurrency(productPrice, currency)}
                          </td>
                          <td className="px-3 py-3 text-right text-sm text-primary">
                            Ver detalle
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-3 lg:hidden">
              {filteredProducts.map((product) => {
                const productStock = product.stock ?? 0;
                const productPrice = product.price ?? 0;
                const isLowStock =
                  productStock <=
                  (product.minStock || settings?.lowStockThreshold || 5);
                const isOutOfStock = productStock <= 0;

                return (
                  <button
                    key={product._id}
                    className="app-panel flex w-full items-start justify-between rounded-[26px] p-4 text-left"
                    onClick={() => openProductDetail(product)}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`flex h-14 w-14 items-center justify-center rounded-2xl ${
                          isOutOfStock
                            ? "bg-danger/15 text-danger"
                            : isLowStock
                              ? "bg-warning/15 text-warning"
                              : "bg-primary/12 text-primary"
                        }`}
                      >
                        <Boxes size={22} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-[15px] font-semibold text-foreground">
                            {product.name}
                          </h3>
                          <div className="flex flex-wrap gap-1.5">
                            {(product.categories && product.categories.length > 0
                              ? product.categories
                              : product.category
                                ? [product.category]
                                : []
                            )
                              .slice(0, 2)
                              .map((category) => (
                                <span
                                  key={category}
                                  className="rounded-full bg-content2 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-default-500"
                                >
                                  {category}
                                </span>
                              ))}
                          </div>
                        </div>

                        <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-default-400">
                          SKU {product.sku || "No definido"}
                        </p>

                        <div className="mt-3 flex items-center gap-2 text-sm">
                          {isOutOfStock || isLowStock ? (
                            <AlertCircle className="text-danger" size={15} />
                          ) : (
                            <Layers3 className="text-primary" size={15} />
                          )}
                          <span
                            className={
                              isOutOfStock || isLowStock
                                ? "font-semibold text-danger"
                                : "text-default-600"
                            }
                          >
                            {isOutOfStock
                              ? "Sin stock"
                              : `${productStock} ${product.unitOfMeasure || "unidades"}`}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-xs uppercase tracking-[0.16em] text-default-400">
                        Precio
                      </p>
                      <p className="mt-1 text-[18px] font-semibold tracking-[-0.03em] text-foreground">
                        {formatCompactCurrency(productPrice, currency)}
                      </p>
                      <ArrowUpRight
                        className="ml-auto mt-3 text-default-300"
                        size={18}
                      />
                    </div>
                  </button>
                );
              })}
            </div>

            <div ref={loadMoreRef} className="h-8 w-full" />

            {isFetchingNextPage && (
              <div className="app-panel rounded-[24px] py-6 text-center text-default-400">
                <Loader2 className="mx-auto mb-2 animate-spin" size={24} />
                <p className="text-sm">Cargando mas productos...</p>
              </div>
            )}

            {!hasNextPage && safeProducts.length > 0 && (
              <div className="py-4 text-center text-xs text-default-400">
                Fin del catalogo cargado
              </div>
            )}
          </>
        ) : (
          <div className="app-panel rounded-[24px] py-12 text-center text-default-400">
            <p className="text-sm font-medium">No se encontraron productos</p>
          </div>
        )}
      </div>

      <button
        className="fixed bottom-[100px] right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_16px_34px_rgba(88,176,156,0.35)] transition-transform hover:scale-105 active:scale-95"
        onClick={() => {
          resetForm();
          setShowCreateModal(true);
        }}
      >
        <Plus size={26} strokeWidth={2.5} />
      </button>

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
          onClose={() => {
            setShowCreateModal(false);
            resetForm();
          }}
          onRemoveCategory={handleRemoveCategory}
          onSubmit={handleCreateProduct}
          onUseSuggestedSku={() => handleFormChange("sku", suggestedSku)}
        />
      )}
    </div>
  );
}
