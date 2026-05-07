import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Archive,
  ArrowDownLeft,
  ArrowUpRight,
  Barcode,
  Box,
  DollarSign,
  Filter,
  Hash,
  Layers3,
  Loader2,
  Package,
  PackageSearch,
  Pencil,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useProductDetail } from "@features/products/hooks/useProducts";
import { useStockMovements } from "@features/products/hooks/useStockMovements";
import { formatCompactCurrency } from "@shared/utils/currency";
import { getAvailableStock } from "@features/products/utils/stock";
import { PriceTier } from "@shared/types";
import { calculateMargin, getTierDisplayName } from "../utils/priceResolver";

const MOVEMENTS_PREVIEW_LIMIT = 8;

export function ProductDetailPanel({
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
  const [activeTab, setActiveTab] = useState<"general" | "presentaciones">("general");

  // Movement filters
  const [showMovementFilters, setShowMovementFilters] = useState(false);
  const [movementTypeFilter, setMovementTypeFilter] = useState<string>("all");
  const [movementSearch, setMovementSearch] = useState("");

  const { product, loading: detailLoading, error: detailError } = useProductDetail(productId);
  const { movements, loading: movementsLoading } = useStockMovements(
    { product: productId, limit: 50, page: 1 },
    { enabled: Boolean(productId) },
  );

  useEffect(() => { setShowAllMovements(false); setActiveTab("general"); }, [productId]);

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
    <div className="flex flex-col bg-content1">
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
            {/* Tabs */}
            {product.presentations && product.presentations.length > 0 && (
              <div className="flex rounded-xl bg-content2/40 p-1">
                <button
                  className={`flex-1 rounded-lg px-3 py-2 text-sm font-bold transition-all ${
                    activeTab === "general"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-default-500 hover:text-foreground"
                  }`}
                  onClick={() => setActiveTab("general")}
                >
                  General
                </button>
                <button
                  className={`flex-1 rounded-lg px-3 py-2 text-sm font-bold transition-all ${
                    activeTab === "presentaciones"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-default-500 hover:text-foreground"
                  }`}
                  onClick={() => setActiveTab("presentaciones")}
                >
                  Presentaciones ({product.presentations.length})
                </button>
              </div>
            )}

            {activeTab === "general" ? (
              <>
                {/* KPI row */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="stat-card text-center">
                    <p className="stat-card-label flex items-center justify-center gap-1.5">
                      Costo
                      {product.costLocked && (
                        <span
                          className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-blue-500 cursor-help"
                          title="Calculado automáticamente de las compras"
                        >
                          Auto
                        </span>
                      )}
                    </p>
                    <p className={`stat-card-value mt-2 ${product.costLocked ? "text-blue-600 dark:text-blue-400" : ""}`}>
                      {product.costPrice != null ? formatCompactCurrency(product.costPrice, currency) : "—"}
                    </p>
                    {product.costLocked && (
                      <p className="mt-1 text-[10px] text-blue-500/70">
                        Calculado de compras
                      </p>
                    )}
                  </div>
                  <div className={`stat-card text-center ${isOutOfStock ? "border-danger/30 bg-danger/5" : isLowStock ? "border-warning/30 bg-warning/5" : ""}`}>
                    <p className="stat-card-label">Stock</p>
                    <p className={`stat-card-value mt-2 ${isOutOfStock || isLowStock ? "text-danger" : ""}`}>
                      {isOutOfStock ? "0" : product.stock}
                    </p>
                    <p className="stat-card-sub">{product.unitOfMeasure || "unidades"}</p>
                  </div>
                </div>

            {/* Tier Prices */}
            {product.priceTiers && (
              <div className="stat-card space-y-3">
                <p className="text-sm font-bold text-foreground flex items-center gap-2">
                  <DollarSign size={16} className="text-primary" />
                  Precios por lista
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(['retail', 'wholesale', 'distributor'] as PriceTier[]).map((tier) => {
                    const price = product.priceTiers?.[tier];
                    const hasPrice = price !== undefined && price > 0;
                    const margin = product.costPrice ? calculateMargin(price || 0, product.costPrice) : 0;
                    const isProfitable = margin > 0;

                    return (
                      <div
                        key={tier}
                        className={`rounded-xl border p-3 text-center ${
                          hasPrice
                            ? 'border-divider/40 bg-content2/30'
                            : 'border-dashed border-divider/30 bg-content2/20'
                        }`}
                      >
                        <p className="text-xs font-semibold uppercase tracking-wider text-default-500 mb-1">
                          {getTierDisplayName(tier)}
                        </p>
                        {hasPrice ? (
                          <>
                            <p className="text-lg font-bold text-foreground">
                              {formatCompactCurrency(price, currency)}
                            </p>
                            {product.costPrice && product.costPrice > 0 && (
                              <p className={`text-xs font-medium mt-1 ${isProfitable ? 'text-success' : 'text-danger'}`}>
                                {isProfitable ? '+' : ''}{margin.toFixed(1)}% margen
                              </p>
                            )}
                          </>
                        ) : (
                          <p className="text-sm text-default-400 italic">No configurado</p>
                        )}
                      </div>
                    );
                  })}
                </div>
                {/* Fallback to base price indicator */}
                {(!product.priceTiers?.retail && product.price > 0) && (
                  <div className="rounded-lg bg-content2/50 px-3 py-2 text-xs text-default-500">
                    <span className="font-medium text-foreground">Precio base: </span>
                    {formatCompactCurrency(product.price, currency)}
                    <span className="ml-1">(usado como respaldo)</span>
                  </div>
                )}
              </div>
            )}

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
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-default-400">Código de Barras</span>
                  <span className="font-mono text-foreground">{product.barcode || "—"}</span>
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

            {/* Presentations */}
            {product.presentations && product.presentations.length > 0 && (
              <div className="stat-card space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Layers3 size={16} className="text-primary" />
                    Presentaciones
                  </p>
                  <span className="text-xs text-default-400">{product.presentations.length} formatos</span>
                </div>
                
                <div className="space-y-3">
                  {product.presentations.map((pres) => {
                    const presStock = getAvailableStock(product, pres);
                    const isOut = presStock <= 0;
                    const isLow = presStock > 0 && presStock <= (product.minStock || 5);
                    
                    return (
                      <div key={pres._id} className="rounded-xl border border-divider/40 bg-content2/30 p-4 space-y-3">
                        {/* Header: Nombre y Precio */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <Package size={14} className="shrink-0 text-primary" />
                              <p className="text-sm font-bold text-foreground">{pres.name}</p>
                              {!pres.isActive && (
                                <span className="rounded-full bg-default-100 px-2 py-0.5 text-[10px] font-bold text-default-500">
                                  INACTIVA
                                </span>
                              )}
                            </div>
                            <p className="mt-1 text-xs text-default-500">
                              {pres.equivalentQty} {pres.unitOfMeasure || product.unitOfMeasure || "u."} por unidad
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-lg font-bold text-primary">{formatCompactCurrency(pres.price, currency)}</p>
                          </div>
                        </div>
                        
                        {/* Info Grid */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex items-center gap-1.5 text-default-500">
                            <Hash size={12} className="shrink-0" />
                            <span>SKU: <span className="font-mono text-foreground">{pres.sku || "—"}</span></span>
                          </div>
                          <div className="flex items-center gap-1.5 text-default-500">
                            <Barcode size={12} className="shrink-0" />
                            <span>Barra: <span className="font-mono text-foreground">{pres.barcode || "—"}</span></span>
                          </div>
                        </div>
                        
                        {/* Stock Badge */}
                        <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
                          isOut 
                            ? 'bg-danger/15 text-danger' 
                            : isLow 
                              ? 'bg-warning/15 text-warning' 
                              : 'bg-success/15 text-success'
                        }`}>
                          <Box size={12} />
                          {isOut ? "Sin stock" : `${presStock} disponibles`}
                        </div>
                        
                        {/* Margen si hay costo */}
                        {product.costPrice && product.costPrice > 0 && (
                          <div className="rounded-lg bg-content3/30 px-3 py-2 text-xs space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-default-500">Costo unitario:</span>
                              <span className="font-semibold">{formatCompactCurrency(product.costPrice * pres.equivalentQty, currency)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-default-500">Ganancia:</span>
                              <span className="font-semibold text-success">
                                {formatCompactCurrency(pres.price - (product.costPrice * pres.equivalentQty), currency)}
                                {' '}
                                <span className="text-[10px]">
                                  ({(((pres.price - (product.costPrice * pres.equivalentQty)) / pres.price) * 100).toFixed(0)}%)
                                </span>
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

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
            <div className="space-y-4">
              {/* Header with filters toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-foreground">Movimientos de stock</p>
                  <p className="text-xs text-default-400 mt-0.5">{movements.length} registros totales</p>
                </div>
                {movements.length > 0 && (
                  <button
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                      showMovementFilters
                        ? "bg-primary text-white"
                        : "bg-content2/60 text-default-500 hover:bg-content2"
                    }`}
                    onClick={() => setShowMovementFilters(!showMovementFilters)}
                  >
                    <Filter size={13} />
                    Filtros
                    {(movementTypeFilter !== "all" || movementSearch) && (
                      <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[9px] text-white">
                        {(movementTypeFilter !== "all" ? 1 : 0) + (movementSearch ? 1 : 0)}
                      </span>
                    )}
                  </button>
                )}
              </div>

              {/* Expandable filters */}
              {showMovementFilters && movements.length > 0 && (
                <div className="rounded-2xl border border-divider/30 bg-content2/20 p-4 space-y-3">
                  {/* Search */}
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-default-400" />
                    <input
                      className="w-full rounded-xl border border-divider/30 bg-content1 px-3 py-2 pl-9 text-xs text-foreground placeholder:text-default-400 focus:outline-none focus:ring-2 focus:ring-primary/40"
                      placeholder="Buscar por motivo o fuente..."
                      value={movementSearch}
                      onChange={(e) => setMovementSearch(e.target.value)}
                    />
                  </div>

                  {/* Type filter */}
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      className={`rounded-full px-3 py-1 text-[11px] font-bold transition ${
                        movementTypeFilter === "all"
                          ? "bg-primary text-white"
                          : "bg-content1 border border-divider/30 text-default-500 hover:border-primary/30"
                      }`}
                      onClick={() => setMovementTypeFilter("all")}
                    >
                      Todos
                    </button>
                    {Object.entries(movementSummary).map(([type, count]) => (
                      <button
                        key={type}
                        className={`rounded-full px-3 py-1 text-[11px] font-bold transition ${
                          movementTypeFilter === type
                            ? "bg-primary text-white"
                            : "bg-content1 border border-divider/30 text-default-500 hover:border-primary/30"
                        }`}
                        onClick={() => setMovementTypeFilter(type)}
                      >
                        {type} ({count})
                      </button>
                    ))}
                  </div>

                  {/* Clear filters */}
                  {(movementTypeFilter !== "all" || movementSearch) && (
                    <button
                      className="text-xs text-danger font-semibold hover:text-danger/80 transition"
                      onClick={() => {
                        setMovementTypeFilter("all");
                        setMovementSearch("");
                      }}
                    >
                      Limpiar filtros
                    </button>
                  )}
                </div>
              )}

              {/* Movement list */}
              <div>
                {movementsLoading ? (
                  <div className="stat-card py-8 text-center text-default-400">
                    <Loader2 className="mx-auto mb-2 animate-spin" size={22} />
                    <p className="text-sm">Cargando movimientos...</p>
                  </div>
                ) : (() => {
                  const filteredMovements = visibleMovements.filter((m) => {
                    if (movementTypeFilter !== "all" && m.type !== movementTypeFilter) return false;
                    if (movementSearch) {
                      const q = movementSearch.toLowerCase();
                      return (
                        (m.reason || "").toLowerCase().includes(q) ||
                        (m.source || "").toLowerCase().includes(q)
                      );
                    }
                    return true;
                  });

                  if (filteredMovements.length === 0) {
                    return (
                      <div className="stat-card py-8 text-center">
                        <PackageSearch className="mx-auto mb-3 text-default-400" size={28} />
                        <p className="text-sm font-medium text-foreground">
                          {movementTypeFilter !== "all" || movementSearch
                            ? "Sin movimientos que coincidan"
                            : "Sin movimientos"}
                        </p>
                        <p className="mt-1 text-xs text-default-500">
                          {movementTypeFilter !== "all" || movementSearch
                            ? "Probá con otros filtros"
                            : "Este producto no tiene historial de inventario."}
                        </p>
                      </div>
                    );
                  }

                  // Desktop: table
                  if (isDesktop) {
                    return (
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b border-divider/20">
                            <th className="px-4 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-default-500 w-[160px]">Tipo</th>
                            <th className="px-4 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-default-500">Detalle</th>
                            <th className="px-4 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-default-500 w-[120px]">Fuente</th>
                            <th className="px-4 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-default-500 w-[100px]">Movimiento</th>
                            <th className="px-4 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-default-500 w-[60px]">Stock</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-divider/10">
                          {filteredMovements.map((movement) => {
                            const isNegative = movement.type === "SALIDA" || movement.type === "MERMA";
                            return (
                              <tr key={movement._id} className="transition-colors hover:bg-content2/40">
                                <td className="px-4 py-2.5">
                                  <div className="flex items-center gap-2">
                                    <span className={`h-2 w-2 shrink-0 rounded-full ${isNegative ? "bg-danger" : "bg-success"}`} />
                                    <div>
                                      <p className="text-sm font-semibold text-foreground leading-tight">{movement.type}</p>
                                      <p className="text-[10px] text-default-400 leading-tight mt-0.5">
                                        {new Date(movement.createdAt).toLocaleDateString()} {new Date(movement.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                      </p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-2.5">
                                  <p className="text-sm text-default-500 truncate max-w-[200px]">
                                    {movement.reason ? (
                                      <span className="text-foreground">{movement.reason}</span>
                                    ) : (
                                      <span className="italic text-default-400">Sin detalle</span>
                                    )}
                                  </p>
                                </td>
                                <td className="px-4 py-2.5">
                                  <p className="text-sm text-default-500 truncate max-w-[120px]">{movement.source}</p>
                                </td>
                                <td className="px-4 py-2.5 text-right">
                                  <span className={`text-sm font-bold tabular-nums ${isNegative ? "text-danger" : "text-success"}`}>
                                    {isNegative ? "−" : "+"}{movement.quantity}
                                  </span>
                                </td>
                                <td className="px-4 py-2.5 text-right">
                                  <span className="text-xs text-default-400 tabular-nums font-medium">{movement.stockAfter}</span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    );
                  }

                  // Mobile: compact cards
                  return (
                    <div className="space-y-1.5">
                      {filteredMovements.map((movement) => {
                        const isNegative = movement.type === "SALIDA" || movement.type === "MERMA";
                        return (
                          <div key={movement._id} className="flex items-center gap-3 rounded-xl border border-divider/15 bg-content2/20 px-3.5 py-2.5 transition-colors hover:bg-content2/40">
                            <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                              isNegative ? "bg-danger/10 text-danger" : "bg-success/10 text-success"
                            }`}>
                              {isNegative ? <ArrowDownLeft size={12} /> : <ArrowUpRight size={12} />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <p className="truncate text-sm font-semibold text-foreground">{movement.type}</p>
                                <span className={`text-xs font-bold tabular-nums ${isNegative ? "text-danger" : "text-success"}`}>
                                  {isNegative ? "-" : "+"}{movement.quantity}
                                </span>
                              </div>
                              <p className="truncate text-[11px] text-default-400">
                                {movement.reason || movement.source || "Sin detalle"} · {new Date(movement.createdAt).toLocaleString()}
                              </p>
                            </div>
                            <div className="shrink-0 text-right">
                              <p className="text-[11px] font-semibold text-default-500 tabular-nums">→ {movement.stockAfter}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              {!movementsLoading && movements.length > MOVEMENTS_PREVIEW_LIMIT && (
                <button
                  className="w-full rounded-2xl border border-divider/70 px-4 py-2.5 text-xs font-semibold text-default-600 transition hover:bg-content2/60"
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
            ) : (
              /* Presentaciones Tab */
              <div className="space-y-4">
                {product.presentations?.map((pres) => {
                  const presStock = getAvailableStock(product, pres);
                  const isOut = presStock <= 0;
                  const isLow = presStock > 0 && presStock <= (product.minStock || 5);
                  const presCost = product.costPrice && product.costPrice > 0 ? product.costPrice * pres.equivalentQty : null;

                  return (
                    <div key={pres._id} className="space-y-3">
                      {/* Presentation name header */}
                      <div className="flex items-center gap-2">
                        <Package size={16} className="text-primary" />
                        <h3 className="text-sm font-bold text-foreground">{pres.name}</h3>
                        {!pres.isActive && (
                          <span className="rounded-full bg-default-100 px-2 py-0.5 text-[10px] font-bold text-default-500">
                            INACTIVA
                          </span>
                        )}
                      </div>

                      {/* KPI row for this presentation */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="stat-card text-center">
                          <p className="stat-card-label">Precio</p>
                          <p className="stat-card-value mt-2">{formatCompactCurrency(pres.price, currency)}</p>
                        </div>
                        <div className="stat-card text-center">
                          <p className="stat-card-label flex items-center justify-center gap-1.5">
                            Costo
                            {product.costLocked && (
                              <span
                                className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-blue-500 cursor-help"
                                title="Calculado automáticamente de las compras"
                              >
                                Auto
                              </span>
                            )}
                          </p>
                          <p className={`stat-card-value mt-2 ${product.costLocked ? "text-blue-600 dark:text-blue-400" : ""}`}>
                            {presCost != null ? formatCompactCurrency(presCost, currency) : "—"}
                          </p>
                          {product.costLocked && presCost != null && (
                            <p className="mt-1 text-[10px] text-blue-500/70">
                              {formatCompactCurrency(product.costPrice || 0, currency)} × {pres.equivalentQty}
                            </p>
                          )}
                        </div>
                        <div className={`stat-card text-center ${isOut ? "border-danger/30 bg-danger/5" : isLow ? "border-warning/30 bg-warning/5" : ""}`}>
                          <p className="stat-card-label">Stock</p>
                          <p className={`stat-card-value mt-2 ${isOut || isLow ? "text-danger" : ""}`}>
                            {isOut ? "0" : presStock}
                          </p>
                          <p className="stat-card-sub">{pres.unitOfMeasure || product.unitOfMeasure || "unidades"}</p>
                        </div>
                      </div>

                      {/* Margin for this presentation */}
                      {presCost != null && pres.price > 0 && (
                        <div className="stat-card">
                          <p className="text-sm font-bold text-foreground mb-3">Margen</p>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <p className="stat-card-label">Ganancia por unidad</p>
                              <p className="mt-1 text-lg font-bold text-success">
                                {formatCompactCurrency(pres.price - presCost, currency)}
                              </p>
                            </div>
                            <div>
                              <p className="stat-card-label">Margen bruto</p>
                              <p className="mt-1 text-lg font-bold text-success">
                                {(((pres.price - presCost) / pres.price) * 100).toFixed(1)}%
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Divider */}
                      <div className="border-t border-divider/20" />
                    </div>
                  );
                })}
              </div>
            )}

          </>
        )}
      </div>
    </div>
  );
}
