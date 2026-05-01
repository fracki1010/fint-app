import { useEffect, useMemo, useState } from "react";
import {
  Package,
  Search,
  AlertCircle,
  Plus,
  Loader2,
  X,
  Pencil,
  Trash2,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  PackageSearch,
  ChevronRight,
  Layers3,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Select, SelectItem } from "@heroui/select";
import { Drawer, DrawerBody, DrawerContent } from "@heroui/drawer";

import { useSupplies, useSupplyMovements } from "@/hooks/useSupplies";
import { useIsDesktop } from "@/hooks/useIsDesktop";
import { useSettings } from "@/hooks/useSettings";
import { SupplyMovementType } from "@/types";
import { useAppToast } from "@/components/AppToast";
import { formatCompactCurrency } from "@/utils/currency";
import { getErrorMessage } from "@/utils/errors";
import { PaginationBar } from "@/components/PaginationBar";

// ── Constants ─────────────────────────────────────────────────────────────────

const SUPPLY_UNIT_OPTIONS = [
  { value: "unidad", label: "Unidad" },
  { value: "kg", label: "Kilogramo" },
  { value: "g", label: "Gramo" },
  { value: "litro", label: "Litro" },
  { value: "ml", label: "Mililitro" },
  { value: "metro", label: "Metro" },
  { value: "caja", label: "Caja" },
  { value: "paquete", label: "Paquete" },
] as const;

const MOVEMENT_TYPE_LABELS: Record<SupplyMovementType, string> = {
  IN: "Entrada",
  OUT: "Salida",
  ADJUST: "Ajuste",
};

const MOVEMENT_TYPE_COLORS: Record<SupplyMovementType, string> = {
  IN: "text-success",
  OUT: "text-danger",
  ADJUST: "text-warning",
};

const MOVEMENT_TYPE_ICONS: Record<SupplyMovementType, typeof ArrowDownLeft> = {
  IN: ArrowDownLeft,
  OUT: ArrowUpRight,
  ADJUST: RefreshCw,
};

// ── Form types ────────────────────────────────────────────────────────────────

type SupplyFormState = {
  sku: string;
  name: string;
  unit: string;
  currentStock: string;
  minStock: string;
  referenceCost: string;
};

type MovementFormState = {
  type: SupplyMovementType;
  quantity: string;
  reason: string;
};

const emptySupplyForm: SupplyFormState = {
  sku: "",
  name: "",
  unit: "unidad",
  currentStock: "0",
  minStock: "0",
  referenceCost: "0",
};

const emptyMovementForm: MovementFormState = {
  type: "IN",
  quantity: "",
  reason: "",
};

// ── Supply Form Modal ─────────────────────────────────────────────────────────

function SupplyFormModal({
  mode,
  isDesktop,
  formData,
  onChange,
  onClose,
  onSubmit,
  submitting,
}: {
  mode: "create" | "edit";
  isDesktop: boolean;
  formData: SupplyFormState;
  onChange: (field: keyof SupplyFormState, value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
  submitting: boolean;
}) {
  const formLayout = (
    <div className="flex h-full flex-col overflow-x-hidden p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="section-kicker">{mode === "create" ? "Alta de Insumo" : "Edicion"}</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-foreground">
            {mode === "create" ? "Nuevo insumo" : "Editar insumo"}
          </h2>
        </div>
        <button className="app-panel-soft flex h-10 w-10 items-center justify-center rounded-2xl text-default-500" onClick={onClose}>
          <X size={18} />
        </button>
      </div>

      <div className="mt-6 grid flex-1 gap-4 overflow-y-auto pr-1">
        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-default-500">Nombre *</span>
          <input className="corp-input w-full rounded-2xl px-4 py-3 text-sm" placeholder="Ej: Harina 000" value={formData.name} onChange={(e) => onChange("name", e.target.value)} />
        </label>

        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-default-500">SKU</span>
          <input className="corp-input w-full rounded-2xl px-4 py-3 text-sm" placeholder="Codigo opcional" value={formData.sku} onChange={(e) => onChange("sku", e.target.value.toUpperCase())} />
        </label>

        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-default-500">Unidad de Medida</span>
          <Select
            aria-label="Unidad de medida"
            classNames={{
              base: "w-full",
              trigger: "corp-input min-h-[48px] rounded-2xl px-4 text-sm text-foreground",
              value: "text-foreground",
              popoverContent: "bg-content1 text-foreground",
              listbox: "bg-content1 text-foreground",
            }}
            selectedKeys={[formData.unit]}
            variant="bordered"
            onSelectionChange={(keys) => onChange("unit", Array.from(keys)[0] as string)}
          >
            {SUPPLY_UNIT_OPTIONS.map((option) => (
              <SelectItem key={option.value}>{option.label}</SelectItem>
            ))}
          </Select>
        </label>

        <div className="grid grid-cols-3 gap-4">
          {mode === "create" && (
            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-default-500">Stock Inicial</span>
              <input className="corp-input w-full rounded-2xl px-4 py-3 text-sm" min="0" type="number" value={formData.currentStock} onChange={(e) => onChange("currentStock", e.target.value)} />
            </label>
          )}
          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-default-500">Stock Mínimo</span>
            <input className="corp-input w-full rounded-2xl px-4 py-3 text-sm" min="0" type="number" value={formData.minStock} onChange={(e) => onChange("minStock", e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-default-500">Costo Ref.</span>
            <input className="corp-input w-full rounded-2xl px-4 py-3 text-sm" min="0" step="0.01" type="number" value={formData.referenceCost} onChange={(e) => onChange("referenceCost", e.target.value)} />
          </label>
        </div>
      </div>

      <div className="mt-6 flex shrink-0 gap-3 border-t border-divider/70 pt-4">
        <button className="app-panel-soft flex-1 rounded-2xl px-4 py-3 text-sm font-semibold text-default-600" onClick={onClose}>Cancelar</button>
        <button className="flex-1 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50" disabled={submitting} onClick={onSubmit}>
          <span className="flex items-center justify-center gap-2">
            {submitting && <Loader2 className="animate-spin" size={18} />}
            {mode === "create" ? "Crear insumo" : "Guardar cambios"}
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
    <Drawer hideCloseButton isOpen backdrop="opaque" placement="right" scrollBehavior="inside" size="xl" onOpenChange={(open: boolean) => { if (!open) onClose(); }}>
      <DrawerContent className="h-screen w-full max-w-xl overflow-x-hidden rounded-none">
        <DrawerBody className="p-0">{formLayout}</DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}

// ── Movement Form Modal ───────────────────────────────────────────────────────

function MovementFormModal({
  supplyName,
  isDesktop,
  formData,
  onChange,
  onClose,
  onSubmit,
  submitting,
}: {
  supplyName: string;
  isDesktop: boolean;
  formData: MovementFormState;
  onChange: (field: keyof MovementFormState, value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
  submitting: boolean;
}) {
  const formLayout = (
    <div className="flex h-full flex-col overflow-x-hidden p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="section-kicker">Movimiento Manual</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-foreground">{supplyName}</h2>
        </div>
        <button className="app-panel-soft flex h-10 w-10 items-center justify-center rounded-2xl text-default-500" onClick={onClose}>
          <X size={18} />
        </button>
      </div>

      <div className="mt-6 grid flex-1 gap-4 overflow-y-auto pr-1">
        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-default-500">Tipo</span>
          <div className="flex gap-2">
            {(["IN", "OUT", "ADJUST"] as SupplyMovementType[]).map((t) => (
              <button
                key={t}
                className={`flex-1 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  formData.type === t
                    ? t === "IN" ? "bg-success/15 text-success ring-1 ring-success/30"
                    : t === "OUT" ? "bg-danger/15 text-danger ring-1 ring-danger/30"
                    : "bg-warning/15 text-warning ring-1 ring-warning/30"
                    : "app-panel-soft text-default-600"
                }`}
                type="button"
                onClick={() => onChange("type", t)}
              >
                {MOVEMENT_TYPE_LABELS[t]}
              </button>
            ))}
          </div>
        </label>

        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-default-500">Cantidad *</span>
          <input className="corp-input w-full rounded-2xl px-4 py-3 text-sm" min="0.01" step="0.01" type="number" value={formData.quantity} onChange={(e) => onChange("quantity", e.target.value)} />
        </label>

        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-default-500">Razón / Motivo</span>
          <textarea className="corp-input min-h-20 w-full rounded-2xl px-4 py-3 text-sm" placeholder="Detalle opcional del movimiento" value={formData.reason} onChange={(e) => onChange("reason", e.target.value)} />
        </label>
      </div>

      <div className="mt-6 flex shrink-0 gap-3 border-t border-divider/70 pt-4">
        <button className="app-panel-soft flex-1 rounded-2xl px-4 py-3 text-sm font-semibold text-default-600" onClick={onClose}>Cancelar</button>
        <button className="flex-1 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50" disabled={submitting || !formData.quantity} onClick={onSubmit}>
          <span className="flex items-center justify-center gap-2">
            {submitting && <Loader2 className="animate-spin" size={18} />}
            Registrar movimiento
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
    <Drawer hideCloseButton isOpen backdrop="opaque" placement="right" scrollBehavior="inside" size="xl" onOpenChange={(open: boolean) => { if (!open) onClose(); }}>
      <DrawerContent className="h-screen w-full max-w-xl overflow-x-hidden rounded-none">
        <DrawerBody className="p-0">{formLayout}</DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}

// ── Supply Detail Panel ───────────────────────────────────────────────────────

function SupplyDetailPanel({
  supplyId,
  supplies,
  currency,
  isDesktop,
  isDeleting,
  onClose,
  onEdit,
  onDelete,
}: {
  supplyId: string;
  supplies: ReturnType<typeof useSupplies>["supplies"];
  currency: string;
  isDesktop: boolean;
  isDeleting: boolean;
  onClose?: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const navigate = useNavigate();
  const { showToast } = useAppToast();
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [movementForm, setMovementForm] = useState<MovementFormState>({ ...emptyMovementForm });

  const supply = useMemo(() => supplies.find((s) => s._id === supplyId) || null, [supplies, supplyId]);

  const { movements, loading: movementsLoading, createMovement, isCreating: isCreatingMovement } = useSupplyMovements(supplyId);

  const isLow = supply ? supply.currentStock <= supply.minStock : false;
  const isOut = supply ? supply.currentStock <= 0 : false;

  const handleMovementFormChange = (field: keyof MovementFormState, value: string) =>
    setMovementForm((prev) => ({ ...prev, [field]: value }));

  const handleCreateMovement = async () => {
    if (!supplyId || !movementForm.quantity) return;
    try {
      await createMovement({ type: movementForm.type, quantity: Number(movementForm.quantity), reason: movementForm.reason || undefined, sourceType: "MANUAL" });
      setMovementForm({ ...emptyMovementForm });
      setShowMovementModal(false);
      showToast({ variant: "success", message: "Movimiento registrado correctamente." });
    } catch (error) {
      showToast({ variant: "error", message: getErrorMessage(error, "No se pudo registrar el movimiento.") });
    }
  };

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="page-header flex items-center gap-3">
        {!isDesktop && (
          <button
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-default-400 transition hover:text-foreground"
            onClick={() => navigate("/supplies")}
          >
            <ArrowUpRight className="rotate-180" size={16} />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <p className="section-kicker">Ficha de Insumo</p>
          <h1 className="page-title truncate">{supply?.name || "Cargando..."}</h1>
        </div>
        {isDesktop && supply && (
          <div className="flex shrink-0 items-center gap-2">
            <button
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-default-400 transition hover:text-foreground"
              onClick={onEdit}
            >
              <Pencil size={13} />
              Editar
            </button>
            <button
              className="flex items-center gap-1.5 rounded-xl bg-danger/10 px-3 py-2 text-sm font-semibold text-danger transition hover:bg-danger/20 disabled:opacity-50"
              disabled={isDeleting}
              onClick={onDelete}
            >
              {isDeleting ? <Loader2 className="animate-spin" size={13} /> : <Trash2 size={13} />}
              Desactivar
            </button>
            <button
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-default-400 transition hover:text-foreground"
              onClick={onClose}
            >
              <X size={15} />
            </button>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="space-y-5 p-6">
        {!supply ? (
          <div className="py-20 text-center text-default-400">
            <Loader2 className="mx-auto mb-3 animate-spin" size={32} />
            <p className="text-sm">Cargando detalle...</p>
          </div>
        ) : (
          <>
            {/* KPI row */}
            <div className="grid grid-cols-3 gap-3">
              <div className={`stat-card text-center ${isOut ? "border-danger/30 bg-danger/5" : isLow ? "border-warning/30 bg-warning/5" : ""}`}>
                <p className="stat-card-label">Stock</p>
                <p className={`stat-card-value mt-2 ${isOut || isLow ? "text-danger" : ""}`}>{supply.currentStock}</p>
                <p className="stat-card-sub">{supply.unit}</p>
              </div>
              <div className="stat-card text-center">
                <p className="stat-card-label">Mínimo</p>
                <p className="stat-card-value mt-2">{supply.minStock}</p>
                <p className="stat-card-sub">{supply.unit}</p>
              </div>
              <div className="stat-card text-center">
                <p className="stat-card-label">Costo Ref.</p>
                <p className="stat-card-value mt-2">{formatCompactCurrency(supply.referenceCost, currency)}</p>
              </div>
            </div>

            {/* Stock alert */}
            {(isOut || isLow) && (
              <div className="flex items-center gap-3 rounded-2xl border border-danger/20 bg-danger/8 px-4 py-3">
                <AlertCircle className="shrink-0 text-danger" size={16} />
                <p className="text-sm font-semibold text-danger">
                  {isOut ? "Sin stock disponible" : `Stock por debajo del mínimo (${supply.minStock} ${supply.unit})`}
                </p>
              </div>
            )}

            {/* General info */}
            <div className="stat-card space-y-3">
              <p className="text-sm font-bold text-foreground">Información General</p>
              <div className="grid gap-2.5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-default-400">SKU</span>
                  <span className="font-mono text-foreground">{supply.sku || "No definido"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-default-400">Unidad</span>
                  <span className="text-foreground">
                    {SUPPLY_UNIT_OPTIONS.find((u) => u.value === supply.unit)?.label || supply.unit}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-default-400">Estado</span>
                  <span className={`badge ${isOut ? "bg-danger/15 text-danger" : isLow ? "bg-warning/15 text-warning" : "bg-success/15 text-success"}`}>
                    {isOut ? "Sin stock" : isLow ? "Stock crítico" : "OK"}
                  </span>
                </div>
              </div>
            </div>

            {/* Movements */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-bold text-foreground">Movimientos</p>
                <button
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/20"
                  onClick={() => { setMovementForm({ ...emptyMovementForm }); setShowMovementModal(true); }}
                >
                  <Plus size={13} />
                  Nuevo
                </button>
              </div>

              <div className="space-y-2">
                {movementsLoading ? (
                  <div className="stat-card py-8 text-center text-default-400">
                    <Loader2 className="mx-auto mb-2 animate-spin" size={22} />
                    <p className="text-sm">Cargando movimientos...</p>
                  </div>
                ) : movements.length > 0 ? (
                  movements.map((movement) => {
                    const Icon = MOVEMENT_TYPE_ICONS[movement.type] || RefreshCw;
                    const colorClass = MOVEMENT_TYPE_COLORS[movement.type] || "text-default-500";
                    return (
                      <div key={movement._id} className="list-row cursor-default hover:transform-none">
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-content2/70 ${colorClass}`}>
                          <Icon size={15} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-foreground">{MOVEMENT_TYPE_LABELS[movement.type] || movement.type}</p>
                          <p className="mt-0.5 text-xs text-default-500">{movement.reason || "Sin detalle"}</p>
                          <p className="mt-0.5 text-xs text-default-400">
                            {movement.sourceType} · {movement.createdAt ? new Date(movement.createdAt).toLocaleString() : ""}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className={`text-sm font-bold ${colorClass}`}>
                            {movement.type === "OUT" ? "-" : "+"}
                            {movement.quantity}
                          </p>
                          <p className="mt-0.5 text-xs text-default-400">→ {movement.stockAfter}</p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="stat-card py-8 text-center">
                    <PackageSearch className="mx-auto mb-3 text-default-400" size={28} />
                    <p className="text-sm font-medium text-foreground">Sin movimientos</p>
                    <p className="mt-1 text-xs text-default-500">Este insumo no tiene historial de inventario aún.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile actions */}
            {!isDesktop && (
              <div className="flex gap-3 pb-4">
                <button className="app-panel-soft flex flex-1 items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-default-600" onClick={onEdit}>
                  <Pencil size={16} />
                  Editar
                </button>
                <button className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-danger/10 px-4 py-3 text-sm font-semibold text-danger disabled:opacity-50" disabled={isDeleting} onClick={onDelete}>
                  {isDeleting ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
                  Desactivar
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {showMovementModal && supply && (
        <MovementFormModal
          formData={movementForm}
          isDesktop={isDesktop}
          submitting={isCreatingMovement}
          supplyName={supply.name}
          onChange={handleMovementFormChange}
          onClose={() => setShowMovementModal(false)}
          onSubmit={handleCreateMovement}
        />
      )}
    </div>
  );
}

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
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-[0_8px_20px_rgba(88,176,156,0.35)] transition hover:scale-105"
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
      <div className="px-4 pb-6 space-y-2">
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
          className="fixed bottom-[100px] right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_16px_34px_rgba(88,176,156,0.35)] transition-transform hover:scale-105 active:scale-95"
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
      <div className="h-screen overflow-hidden">
        <div className="h-full overflow-y-auto">
          {listPanel}
        </div>
        <div
          className={`fixed inset-0 z-40 transition-all duration-300 ${supplyId ? "bg-black/30 backdrop-blur-[2px]" : "pointer-events-none opacity-0"}`}
          onClick={() => navigate("/supplies")}
        />
        <div
          className={`fixed right-0 top-0 z-50 h-screen w-[min(700px,58vw)] overflow-y-auto border-l border-white/10 shadow-[-24px_0_60px_rgba(10,22,44,0.28)] transition-transform duration-300 ease-in-out ${supplyId ? "translate-x-0" : "translate-x-full"}`}
          style={{ background: "color-mix(in srgb, var(--heroui-content1) 98%, transparent)" }}
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
    <div className="flex min-h-full flex-col bg-background pb-24">
      {listPanel}
      {modals}
    </div>
  );
}
