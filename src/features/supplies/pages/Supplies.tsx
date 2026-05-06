import { useEffect, useMemo, useState } from "react";
import {
  Package,
  Search,
  Plus,
  Loader2,
  X,
  ArrowUpRight,
  ChevronRight,
  Layers3,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import { useSupplies } from "@features/supplies/hooks/useSupplies";
import { useIsDesktop } from "@shared/hooks/useIsDesktop";
import { useSettings } from "@features/settings/hooks/useSettings";
import { useAppToast } from "@features/notifications/components/AppToast";
import { formatCompactCurrency } from "@shared/utils/currency";
import { getErrorMessage } from "@shared/utils/errors";
import { PaginationBar } from "@shared/components/PaginationBar";
import SupplyFormModal, { SUPPLY_UNIT_OPTIONS, SupplyFormState, emptySupplyForm } from "../components/SupplyFormModal";
import SupplyDetailPanel from "../components/SupplyDetailPanel";

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function SuppliesPage() {
  const navigate = useNavigate();
  const { supplyId } = useParams<{ supplyId?: string }>();
  const isDesktop = useIsDesktop();
  const { settings } = useSettings();
  const currency = settings?.currency || "USD";

  const { supplies, loading, createSupply, updateSupply, deleteSupply, isCreating, isUpdating, isDeleting } = useSupplies();
  const { showToast } = useAppToast();

  const DESKTOP_PAGE_SIZE = 15;
  const [desktopPage, setDesktopPage] = useState(1);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "low_stock">("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState<SupplyFormState>({ ...emptySupplyForm });

  const selectedSupply = useMemo(() => supplies.find((s) => s._id === supplyId) || null, [supplies, supplyId]);

  useEffect(() => {
    if (showEditModal && selectedSupply) {
      setFormData({
        sku: selectedSupply.sku || "",
        name: selectedSupply.name || "",
        unit: selectedSupply.unit || "unidad",
        currentStock: selectedSupply.currentStock?.toString() || "0",
        minStock: selectedSupply.minStock?.toString() || "0",
        referenceCost: selectedSupply.referenceCost?.toString() || "0",
      });
    }
  }, [showEditModal, selectedSupply]);

  const filteredSupplies = useMemo(() => {
    let result = supplies.filter((s) => s.isActive !== false);
    if (activeFilter === "low_stock") result = result.filter((s) => s.currentStock <= s.minStock);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((s) => s.name.toLowerCase().includes(q) || s.sku?.toLowerCase().includes(q));
    }
    return result;
  }, [supplies, searchQuery, activeFilter]);

  useEffect(() => {
    setDesktopPage(1);
  }, [searchQuery, activeFilter]);

  const desktopItems = isDesktop
    ? filteredSupplies.slice((desktopPage - 1) * DESKTOP_PAGE_SIZE, desktopPage * DESKTOP_PAGE_SIZE)
    : filteredSupplies;
  const desktopTotalPages = Math.ceil(filteredSupplies.length / DESKTOP_PAGE_SIZE);

  const lowStockCount = useMemo(
    () => supplies.filter((s) => s.isActive !== false && s.currentStock <= s.minStock).length,
    [supplies],
  );

  const resetForm = () => setFormData({ ...emptySupplyForm });
  const handleFormChange = (field: keyof SupplyFormState, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const handleCreateSupply = async () => {
    if (!formData.name.trim()) {
      showToast({ variant: "warning", message: "El nombre es obligatorio." });
      return;
    }
    try {
      await createSupply({
        name: formData.name.trim(),
        sku: formData.sku || undefined,
        unit: formData.unit,
        currentStock: Number(formData.currentStock || 0),
        minStock: Number(formData.minStock || 0),
        referenceCost: Number(formData.referenceCost || 0),
      });
      resetForm();
      setShowCreateModal(false);
      showToast({ variant: "success", message: "Insumo creado correctamente." });
    } catch (error) {
      showToast({ variant: "error", message: getErrorMessage(error, "No se pudo crear el insumo.") });
    }
  };

  const handleUpdateSupply = async () => {
    if (!supplyId) return;
    try {
      await updateSupply({
        id: supplyId,
        data: {
          name: formData.name.trim(),
          sku: formData.sku || undefined,
          unit: formData.unit,
          minStock: Number(formData.minStock || 0),
          referenceCost: Number(formData.referenceCost || 0),
        },
      });
      setShowEditModal(false);
      showToast({ variant: "success", message: "Insumo actualizado correctamente." });
    } catch (error) {
      showToast({ variant: "error", message: getErrorMessage(error, "No se pudo actualizar el insumo.") });
    }
  };

  const handleDeleteSupply = async () => {
    if (!supplyId || !selectedSupply) return;
    const confirmed = window.confirm(`¿Querés desactivar el insumo "${selectedSupply.name}"?`);
    if (!confirmed) return;
    try {
      await deleteSupply(supplyId);
      navigate("/supplies");
      showToast({ variant: "success", message: "Insumo desactivado correctamente." });
    } catch (error) {
      showToast({ variant: "error", message: getErrorMessage(error, "No se pudo desactivar el insumo.") });
    }
  };

  // Mobile: full-screen detail
  if (!isDesktop && supplyId) {
    return (
      <div className="flex min-h-full flex-col bg-background">
        <SupplyDetailPanel
          currency={currency}
          isDeleting={isDeleting}
          isDesktop={false}
          supplies={supplies}
          supplyId={supplyId}
          onDelete={handleDeleteSupply}
          onEdit={() => setShowEditModal(true)}
        />
        {showEditModal && (
          <SupplyFormModal
            formData={formData}
            isDesktop={false}
            mode="edit"
            submitting={isUpdating}
            onChange={handleFormChange}
            onClose={() => setShowEditModal(false)}
            onSubmit={handleUpdateSupply}
          />
        )}
      </div>
    );
  }

  // ── List panel ────────────────────────────────────────────────────────────

  const listPanel = (
    <div className="flex flex-col">
      {/* Header */}
      <div className="page-header">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="section-kicker">Inventario</p>
            <h1 className="page-title">Insumos</h1>
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
            <p className="stat-card-label">Insumos</p>
            <p className="mt-1.5 text-2xl font-bold tracking-tight text-foreground">
              {supplies.filter((s) => s.isActive !== false).length}
            </p>
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
                <p className="stat-card-label">Con SKU</p>
                <p className="mt-1.5 text-2xl font-bold tracking-tight text-foreground">
                  {supplies.filter((s) => s.isActive !== false && s.sku).length}
                </p>
              </div>
              <div className="stat-card p-3">
                <p className="stat-card-label">Sin stock</p>
                <p className={`mt-1.5 text-2xl font-bold tracking-tight ${supplies.filter((s) => s.isActive !== false && s.currentStock <= 0).length > 0 ? "text-danger" : "text-foreground"}`}>
                  {supplies.filter((s) => s.isActive !== false && s.currentStock <= 0).length}
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

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto px-4 py-3 no-scrollbar">
        {[
          { key: "all", label: "Todos" },
          { key: "low_stock", label: `Críticos (${lowStockCount})` },
        ].map(({ key, label }) => (
          <button
            key={key}
            className={`shrink-0 rounded-full px-4 py-1.5 text-[11px] font-bold tracking-wide transition ${
              activeFilter === key
                ? key === "low_stock" ? "bg-danger text-danger-foreground" : "bg-primary text-primary-foreground"
                : "app-panel-soft text-default-600"
            }`}
            onClick={() => setActiveFilter(key as "all" | "low_stock")}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Supply list */}
      <div className="px-4 pb-28 space-y-2">
        {loading && supplies.length === 0 ? (
          <div className="py-16 text-center text-default-400">
            <Loader2 className="mx-auto mb-3 animate-spin" size={28} />
            <p className="text-sm">Cargando insumos...</p>
          </div>
        ) : filteredSupplies.length > 0 ? (
          (isDesktop ? desktopItems : filteredSupplies).map((supply) => {
            const isLow = supply.currentStock <= supply.minStock;
            const isOut = supply.currentStock <= 0;
            const isSelected = supply._id === supplyId;

            return (
              <button
                key={supply._id}
                className={`list-row w-full ${isSelected ? "border-primary/30 bg-primary/8 shadow-sm" : ""}`}
                onClick={() => navigate(`/supplies/${supply._id}`)}
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${isOut ? "bg-danger/15 text-danger" : isLow ? "bg-warning/15 text-warning" : "bg-primary/12 text-primary"}`}>
                  <Package size={18} />
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <p className="truncate text-sm font-semibold text-foreground">{supply.name}</p>
                  <p className="mt-0.5 text-xs text-default-400">{supply.sku || "Sin SKU"} · {SUPPLY_UNIT_OPTIONS.find((u) => u.value === supply.unit)?.label || supply.unit}</p>
                  {!isDesktop && (
                    <p className={`mt-1 text-xs font-semibold ${isOut || isLow ? "text-danger" : "text-default-500"}`}>
                      {isOut ? "Sin stock" : `${supply.currentStock} ${supply.unit}`}
                    </p>
                  )}
                </div>
                {isDesktop && (
                  <div className="shrink-0 w-28 text-right">
                    <p className={`text-xs font-semibold ${isOut || isLow ? "text-danger" : "text-default-500"}`}>
                      {isOut ? "Sin stock" : `${supply.currentStock} ${supply.unit}`}
                    </p>
                    {isLow && !isOut && <p className="text-[10px] text-warning">Stock crítico</p>}
                  </div>
                )}
                <div className="shrink-0 text-right">
                  {isDesktop && <p className="text-[10px] uppercase tracking-wide text-default-400">Costo Ref.</p>}
                  <p className="text-sm font-bold text-foreground">{formatCompactCurrency(supply.referenceCost, currency)}</p>
                </div>
                {isDesktop
                  ? <ChevronRight className={`shrink-0 ${isSelected ? "text-primary" : "text-default-300"}`} size={16} />
                  : <ArrowUpRight className="shrink-0 text-default-300" size={16} />
                }
              </button>
            );
          })
        ) : (
          <div className="py-16 text-center text-default-400">
            <Layers3 className="mx-auto mb-3" size={28} />
            <p className="text-sm font-medium">No se encontraron insumos</p>
          </div>
        )}
        {isDesktop && filteredSupplies.length > 0 && (
          <PaginationBar
            from={(desktopPage - 1) * DESKTOP_PAGE_SIZE + 1}
            page={desktopPage}
            to={Math.min(desktopPage * DESKTOP_PAGE_SIZE, filteredSupplies.length)}
            total={filteredSupplies.length}
            totalPages={desktopTotalPages}
            onNext={() => setDesktopPage((p) => p + 1)}
            onPrev={() => setDesktopPage((p) => p - 1)}
          />
        )}
      </div>

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

  // ── Modals ────────────────────────────────────────────────────────────────

  const modals = (
    <>
      {showCreateModal && (
        <SupplyFormModal
          formData={formData}
          isDesktop={isDesktop}
          mode="create"
          submitting={isCreating}
          onChange={handleFormChange}
          onClose={() => { setShowCreateModal(false); resetForm(); }}
          onSubmit={handleCreateSupply}
        />
      )}
      {showEditModal && (
        <SupplyFormModal
          formData={formData}
          isDesktop={isDesktop}
          mode="edit"
          submitting={isUpdating}
          onChange={handleFormChange}
          onClose={() => setShowEditModal(false)}
          onSubmit={handleUpdateSupply}
        />
      )}
    </>
  );

  // Desktop: slide-over layout
  if (isDesktop) {
    return (
      <div className="h-full">
        {listPanel}
        <div
          className={`fixed inset-0 z-40 transition-all duration-300 ${supplyId ? "bg-black/30 backdrop-blur-[2px]" : "pointer-events-none opacity-0"}`}
          onClick={() => navigate("/supplies")}
        />
        <div
          className={`fixed right-0 top-0 z-50 h-screen w-[min(700px,58vw)] overflow-y-auto border-l border-white/10 bg-content1 shadow-[-24px_0_60px_rgba(40,25,15,0.28)] transition-transform duration-300 ease-in-out ${supplyId ? "translate-x-0" : "translate-x-full"}`}
        >
          {supplyId && (
            <SupplyDetailPanel
              currency={currency}
              isDeleting={isDeleting}
              isDesktop={true}
              supplies={supplies}
              supplyId={supplyId}
              onClose={() => navigate("/supplies")}
              onDelete={handleDeleteSupply}
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
    <div className="flex min-h-full flex-col bg-background pb-28">
      {listPanel}
      {modals}
    </div>
  );
}
