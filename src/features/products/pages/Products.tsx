import { useEffect, useMemo, useRef, useState } from "react";
import {
  Boxes,
  Search,
  Plus,
  Loader2,
  Layers3,
  X,
  ChevronRight,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import {
  useInfiniteProducts,
  useProductDetail,
  useProducts,
} from "@features/products/hooks/useProducts";
import { useIsDesktop } from "@shared/hooks/useIsDesktop";
import { useSettings } from "@features/settings/hooks/useSettings";
import { Product } from "@shared/types";
import { useAppToast } from "@features/notifications/components/AppToast";
import { formatCompactCurrency } from "@shared/utils/currency";
import { getErrorMessage } from "@shared/utils/errors";
import { getAvailableStock } from "@features/products/utils/stock";
import { PaginationBar } from "@shared/components/PaginationBar";
import {
  ProductFormModal,
  PresentationFormState,
  ProductFormState,
  emptyPresentation,
  emptyForm,
} from "../components/ProductFormModal";
import { ProductDetailPanel } from "../components/ProductDetailPanel";

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
        barcode: selectedProduct.barcode || "",
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
        presentations: (selectedProduct.presentations || []).map((p) => ({
          _id: p._id,
          sku: p.sku || "",
          barcode: p.barcode || "",
          name: p.name,
          unitOfMeasure: p.unitOfMeasure || "unidad",
          price: p.price?.toString() || "",
          equivalentQty: p.equivalentQty?.toString() || "1",
          isActive: p.isActive !== false,
        })),
        priceTiers: selectedProduct.priceTiers || {
          retail: undefined,
          wholesale: undefined,
          distributor: undefined,
        },
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
    barcode: formData.barcode || undefined,
    name: formData.name.trim(),
    description: formData.description.trim() || undefined,
    price: Number(formData.price || 0),
    costPrice: formData.costPrice ? Number(formData.costPrice) : undefined,
    stock: Number(formData.stock || 0),
    minStock: Number(formData.minStock || 0),
    category: formData.categories[0] || undefined,
    categories: formData.categories,
    unitOfMeasure: formData.unitOfMeasure || "unidad",
    presentations: formData.presentations.map((p) => ({
      ...(p._id ? { _id: p._id } : {}),
      sku: p.sku || undefined,
      barcode: p.barcode || undefined,
      name: p.name.trim(),
      unitOfMeasure: p.unitOfMeasure || "unidad",
      price: Number(p.price || 0),
      equivalentQty: Number(p.equivalentQty || 1),
      isActive: p.isActive,
    })) as Product["presentations"],
  });

  const handleCreateProduct = async () => {
    if (!formData.name.trim()) {
      showToast({ variant: "warning", message: "Completa al menos el nombre." });
      return;
    }
    const invalidPresentation = formData.presentations.find((p) => !p.name.trim());
    if (invalidPresentation) {
      showToast({ variant: "warning", message: "Todas las presentaciones deben tener un nombre." });
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

  const handleAddPresentation = () =>
    setFormData((prev) => ({ ...prev, presentations: [...prev.presentations, emptyPresentation()] }));

  const handleUpdatePresentation = (index: number, field: keyof PresentationFormState, value: string | boolean) =>
    setFormData((prev) => ({
      ...prev,
      presentations: prev.presentations.map((p, i) => (i === index ? { ...p, [field]: value } : p)),
    }));

  const handleRemovePresentation = (index: number) =>
    setFormData((prev) => ({ ...prev, presentations: prev.presentations.filter((_, i) => i !== index) }));

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
            currency={currency}
            existingCategories={categories}
            formData={formData}
            isDesktop={false}
            mode="edit"
            submitting={isUpdating}
            suggestedPrices={suggestedPrices}
            suggestedSku={suggestedSku}
            onAddCategory={handleAddCategory}
            onAddPresentation={handleAddPresentation}
            onApplySuggestedPrice={(value) => handleFormChange("price", value)}
            onChange={handleFormChange}
            onClose={() => setShowEditModal(false)}
            onRemoveCategory={handleRemoveCategory}
            onRemovePresentation={handleRemovePresentation}
            onSubmit={handleUpdateProduct}
            onUpdatePresentation={handleUpdatePresentation}
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
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-[0_8px_20px_rgba(217,119,6,0.35)] transition hover:scale-105"
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
      <div className="px-4 pb-28 space-y-2">
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
                      <span className="font-mono text-xs text-default-400">
                        {product.barcode
                          ? `${product.barcode.slice(0, 13)}`
                          : product.sku || "—"}
                      </span>
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
                    {/* Presentation stock summary */}
                    {product.presentations && product.presentations.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {product.presentations.filter((pr) => pr.isActive !== false).slice(0, isDesktop ? 3 : 2).map((pres) => {
                          const presStock = getAvailableStock(product, pres);
                          const presOut = presStock <= 0;
                          return (
                            <span key={pres._id} className={`badge text-[10px] ${presOut ? "bg-danger/15 text-danger" : "bg-content2/70 text-default-500"}`}>
                              {pres.name}: {presOut ? "0" : presStock}
                            </span>
                          );
                        })}
                        {product.presentations.filter((pr) => pr.isActive !== false).length > (isDesktop ? 3 : 2) && (
                          <span className="badge text-[10px] bg-content2/70 text-default-500">+{product.presentations.filter((pr) => pr.isActive !== false).length - (isDesktop ? 3 : 2)}</span>
                        )}
                      </div>
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
          className="fixed bottom-[100px] right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_16px_34px_rgba(217,119,6,0.35)] transition-transform hover:scale-105 active:scale-95"
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
          currency={currency}
          existingCategories={categories}
          formData={formData}
          isDesktop={isDesktop}
          mode="create"
          submitting={isCreating}
          suggestedPrices={suggestedPrices}
          suggestedSku={suggestedSku}
          onAddCategory={handleAddCategory}
          onAddPresentation={handleAddPresentation}
          onApplySuggestedPrice={(value) => handleFormChange("price", value)}
          onChange={handleFormChange}
          onClose={() => { setShowCreateModal(false); resetForm(); }}
          onRemoveCategory={handleRemoveCategory}
          onRemovePresentation={handleRemovePresentation}
          onSubmit={handleCreateProduct}
          onUpdatePresentation={handleUpdatePresentation}
          onUseSuggestedSku={() => handleFormChange("sku", suggestedSku)}
        />
      )}
      {showEditModal && (
        <ProductFormModal
          currency={currency}
          existingCategories={categories}
          formData={formData}
          isDesktop={isDesktop}
          mode="edit"
          submitting={isUpdating}
          suggestedPrices={suggestedPrices}
          suggestedSku={suggestedSku}
          onAddCategory={handleAddCategory}
          onAddPresentation={handleAddPresentation}
          onApplySuggestedPrice={(value) => handleFormChange("price", value)}
          onChange={handleFormChange}
          onClose={() => setShowEditModal(false)}
          onRemoveCategory={handleRemoveCategory}
          onRemovePresentation={handleRemovePresentation}
          onSubmit={handleUpdateProduct}
          onUpdatePresentation={handleUpdatePresentation}
          onUseSuggestedSku={() => handleFormChange("sku", suggestedSku)}
        />
      )}
    </>
  );

  // Desktop: full-width list + slide-over panel
  if (isDesktop) {
    return (
      <div className="h-full">
        {listPanel}

        {/* Backdrop */}
        <div
          className={`fixed inset-0 z-40 transition-all duration-300 ${productId ? "bg-black/30 backdrop-blur-[2px]" : "pointer-events-none opacity-0"}`}
          onClick={() => navigate("/products")}
        />

        {/* Slide-over panel */}
        <div
          className={`fixed right-0 top-0 z-50 h-screen w-[min(700px,58vw)] overflow-y-auto border-l border-white/10 bg-content1 shadow-[-24px_0_60px_rgba(40,25,15,0.28)] transition-transform duration-300 ease-in-out ${productId ? "translate-x-0" : "translate-x-full"}`}
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
    <div className="flex min-h-screen flex-col bg-background pb-28">
      {listPanel}
      {modals}
    </div>
  );
}
