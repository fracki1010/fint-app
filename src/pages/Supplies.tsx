import { useEffect, useMemo, useState } from "react";
import {
  Package,
  Search,
  AlertCircle,
  Plus,
  Loader2,
  Layers3,
  X,
  Pencil,
  Trash2,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  PackageSearch,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Select, SelectItem } from "@heroui/select";
import { Drawer, DrawerBody, DrawerContent } from "@heroui/drawer";

import { useSupplies, useSupplyMovements } from "@/hooks/useSupplies";
import { useIsDesktop } from "@/hooks/useIsDesktop";
import { useMobileHeaderCompact } from "@/hooks/useMobileHeaderCompact";
import { useSettings } from "@/hooks/useSettings";
import { SupplyMovementType } from "@/types";
import { useAppToast } from "@/components/AppToast";
import { formatCompactCurrency } from "@/utils/currency";
import { getErrorMessage } from "@/utils/errors";

// ── Constants ─────────────────────────────────────────────────────────

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

// ── Form types ────────────────────────────────────────────────────────

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

// ── Supply Form Modal ─────────────────────────────────────────────────

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
          <p className="section-kicker">
            {mode === "create" ? "Alta de Insumo" : "Edicion"}
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-foreground">
            {mode === "create" ? "Nuevo insumo" : "Editar insumo"}
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
        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-default-500">
            Nombre *
          </span>
          <input
            className="corp-input w-full rounded-2xl px-4 py-3 text-sm"
            placeholder="Ej: Harina 000"
            value={formData.name}
            onChange={(e) => onChange("name", e.target.value)}
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-default-500">
            SKU
          </span>
          <input
            className="corp-input w-full rounded-2xl px-4 py-3 text-sm"
            placeholder="Codigo opcional"
            value={formData.sku}
            onChange={(e) => onChange("sku", e.target.value.toUpperCase())}
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-default-500">
            Unidad de Medida
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
            selectedKeys={[formData.unit]}
            variant="bordered"
            onSelectionChange={(keys) =>
              onChange("unit", Array.from(keys)[0] as string)
            }
          >
            {SUPPLY_UNIT_OPTIONS.map((option) => (
              <SelectItem key={option.value}>{option.label}</SelectItem>
            ))}
          </Select>
        </label>

        <div className="grid grid-cols-3 gap-4">
          {mode === "create" && (
            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-default-500">
                Stock Inicial
              </span>
              <input
                className="corp-input w-full rounded-2xl px-4 py-3 text-sm"
                min="0"
                type="number"
                value={formData.currentStock}
                onChange={(e) => onChange("currentStock", e.target.value)}
              />
            </label>
          )}
          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-default-500">
              Stock Minimo
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
              Costo Ref.
            </span>
            <input
              className="corp-input w-full rounded-2xl px-4 py-3 text-sm"
              min="0"
              step="0.01"
              type="number"
              value={formData.referenceCost}
              onChange={(e) => onChange("referenceCost", e.target.value)}
            />
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
            {mode === "create" ? "Crear insumo" : "Guardar cambios"}
          </span>
        </button>
      </div>
    </div>
  );

  if (!isDesktop) {
    return (
      <div className="fixed inset-0 z-[120] bg-black/45 backdrop-blur-[1px]">
        <div className="h-[100dvh] w-screen overflow-hidden bg-background">
          {formLayout}
        </div>
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
      onOpenChange={(open: boolean) => {
        if (!open) onClose();
      }}
    >
      <DrawerContent className="h-screen w-full max-w-xl overflow-x-hidden rounded-none">
        <DrawerBody className="p-0">{formLayout}</DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}

// ── Movement Form Modal ───────────────────────────────────────────────

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
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-foreground">
            {supplyName}
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
        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-default-500">
            Tipo
          </span>
          <div className="flex gap-2">
            {(["IN", "OUT", "ADJUST"] as SupplyMovementType[]).map((t) => (
              <button
                key={t}
                className={`flex-1 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  formData.type === t
                    ? t === "IN"
                      ? "bg-success/15 text-success ring-1 ring-success/30"
                      : t === "OUT"
                        ? "bg-danger/15 text-danger ring-1 ring-danger/30"
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
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-default-500">
            Cantidad *
          </span>
          <input
            className="corp-input w-full rounded-2xl px-4 py-3 text-sm"
            min="0.01"
            step="0.01"
            type="number"
            value={formData.quantity}
            onChange={(e) => onChange("quantity", e.target.value)}
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-default-500">
            Razon / Motivo
          </span>
          <textarea
            className="corp-input min-h-20 w-full rounded-2xl px-4 py-3 text-sm"
            placeholder="Detalle opcional del movimiento"
            value={formData.reason}
            onChange={(e) => onChange("reason", e.target.value)}
          />
        </label>
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
          disabled={submitting || !formData.quantity}
          onClick={onSubmit}
        >
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
        <div className="h-[100dvh] w-screen overflow-hidden bg-background">
          {formLayout}
        </div>
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
      onOpenChange={(open: boolean) => {
        if (!open) onClose();
      }}
    >
      <DrawerContent className="h-screen w-full max-w-xl overflow-x-hidden rounded-none">
        <DrawerBody className="p-0">{formLayout}</DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────

export default function SuppliesPage() {
  const navigate = useNavigate();
  const { supplyId } = useParams<{ supplyId?: string }>();
  const isDesktop = useIsDesktop();
  const isHeaderCompact = useMobileHeaderCompact();
  const { settings } = useSettings();
  const currency = settings?.currency || "USD";

  const {
    supplies,
    loading,
    createSupply,
    updateSupply,
    deleteSupply,
    isCreating,
    isUpdating,
    isDeleting,
  } = useSupplies();

  const {
    movements,
    loading: movementsLoading,
    createMovement,
    isCreating: isCreatingMovement,
  } = useSupplyMovements(supplyId);

  const { showToast } = useAppToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "low_stock">("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [formData, setFormData] = useState<SupplyFormState>({
    ...emptySupplyForm,
  });
  const [movementForm, setMovementForm] = useState<MovementFormState>({
    ...emptyMovementForm,
  });

  const selectedSupply = useMemo(
    () => supplies.find((s) => s._id === supplyId) || null,
    [supplies, supplyId],
  );

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

    if (activeFilter === "low_stock") {
      result = result.filter((s) => s.currentStock <= s.minStock);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();

      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) || s.sku?.toLowerCase().includes(q),
      );
    }

    return result;
  }, [supplies, searchQuery, activeFilter]);

  const lowStockCount = useMemo(
    () =>
      supplies.filter(
        (s) => s.isActive !== false && s.currentStock <= s.minStock,
      ).length,
    [supplies],
  );

  const resetForm = () => setFormData({ ...emptySupplyForm });
  const resetMovementForm = () => setMovementForm({ ...emptyMovementForm });

  const handleFormChange = (field: keyof SupplyFormState, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleMovementFormChange = (
    field: keyof MovementFormState,
    value: string,
  ) => {
    setMovementForm((prev) => ({ ...prev, [field]: value }));
  };

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
      showToast({
        variant: "success",
        message: "Insumo creado correctamente.",
      });
    } catch (error) {
      showToast({
        variant: "error",
        message: getErrorMessage(error, "No se pudo crear el insumo."),
      });
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
      showToast({
        variant: "success",
        message: "Insumo actualizado correctamente.",
      });
    } catch (error) {
      showToast({
        variant: "error",
        message: getErrorMessage(error, "No se pudo actualizar el insumo."),
      });
    }
  };

  const handleDeleteSupply = async () => {
    if (!supplyId || !selectedSupply) return;

    const confirmed = window.confirm(
      `¿Quieres desactivar el insumo "${selectedSupply.name}"?`,
    );

    if (!confirmed) return;

    try {
      await deleteSupply(supplyId);
      navigate("/supplies");
      showToast({
        variant: "success",
        message: "Insumo desactivado correctamente.",
      });
    } catch (error) {
      showToast({
        variant: "error",
        message: getErrorMessage(error, "No se pudo desactivar el insumo."),
      });
    }
  };

  const handleCreateMovement = async () => {
    if (!supplyId || !movementForm.quantity) return;

    try {
      await createMovement({
        type: movementForm.type,
        quantity: Number(movementForm.quantity),
        reason: movementForm.reason || undefined,
        sourceType: "MANUAL",
      });
      resetMovementForm();
      setShowMovementModal(false);
      showToast({
        variant: "success",
        message: "Movimiento registrado correctamente.",
      });
    } catch (error) {
      showToast({
        variant: "error",
        message: getErrorMessage(error, "No se pudo registrar el movimiento."),
      });
    }
  };

  // ── Detail view ───────────────────────────────────────────────────

  if (supplyId) {
    return (
      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col bg-background pb-24 font-sans lg:max-w-none lg:pb-8">
        <header
          className={`app-topbar sticky top-0 z-30 border-b border-divider/60 bg-background/95 backdrop-blur-xl transition-all duration-300 ${
            isHeaderCompact ? "px-4 pb-3 pt-3" : "px-6 pb-4 pt-6"
          }`}
        >
          <button
            className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.14em] text-default-500"
            onClick={() => navigate("/supplies")}
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
            Ficha de Insumo
          </p>
          <h1
            className={`font-semibold tracking-[-0.03em] text-foreground transition-all duration-300 ${
              isHeaderCompact ? "mt-1 text-xl" : "mt-2 text-[28px]"
            }`}
          >
            {selectedSupply?.name || "Cargando..."}
          </h1>
        </header>

        <div className="flex-1 px-6 pb-6">
          {!selectedSupply ? (
            <div className="py-16 text-center text-default-400">
              <Loader2 className="mx-auto mb-3 animate-spin" size={32} />
              <p className="text-sm">Cargando detalle del insumo...</p>
            </div>
          ) : (
            <>
              {/* KPI cards */}
              <div className="mt-1 grid grid-cols-3 gap-3">
                <div className="app-panel-soft rounded-[24px] p-4">
                  <p className="section-kicker">Stock</p>
                  <p
                    className={`mt-3 text-2xl font-semibold ${
                      selectedSupply.currentStock <= selectedSupply.minStock
                        ? "text-danger"
                        : "text-foreground"
                    }`}
                  >
                    {selectedSupply.currentStock}
                  </p>
                  <p className="mt-1 text-[11px] text-default-400">
                    {selectedSupply.unit}
                  </p>
                </div>
                <div className="app-panel-soft rounded-[24px] p-4">
                  <p className="section-kicker">Minimo</p>
                  <p className="mt-3 text-2xl font-semibold text-foreground">
                    {selectedSupply.minStock}
                  </p>
                  <p className="mt-1 text-[11px] text-default-400">
                    {selectedSupply.unit}
                  </p>
                </div>
                <div className="app-panel-soft rounded-[24px] p-4">
                  <p className="section-kicker">Costo Ref.</p>
                  <p className="mt-3 text-2xl font-semibold text-foreground">
                    {formatCompactCurrency(
                      selectedSupply.referenceCost,
                      currency,
                    )}
                  </p>
                </div>
              </div>

              {/* General info */}
              <div className="mt-5 app-panel-soft rounded-[24px] p-5">
                <h3 className="text-sm font-semibold text-foreground">
                  Informacion General
                </h3>
                <div className="mt-4 grid gap-3 text-sm text-default-600">
                  <p>
                    <span className="font-semibold text-foreground">SKU:</span>{" "}
                    {selectedSupply.sku || "No definido"}
                  </p>
                  <p>
                    <span className="font-semibold text-foreground">
                      Unidad:
                    </span>{" "}
                    {SUPPLY_UNIT_OPTIONS.find(
                      (u) => u.value === selectedSupply.unit,
                    )?.label || selectedSupply.unit}
                  </p>
                  {selectedSupply.currentStock <= selectedSupply.minStock && (
                    <div className="flex items-center gap-2 rounded-2xl bg-danger/10 px-4 py-2.5 text-sm font-semibold text-danger">
                      <AlertCircle size={16} />
                      Stock por debajo del minimo
                    </div>
                  )}
                </div>
              </div>

              {/* Movements section */}
              <div className="mt-5">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">
                    Movimientos del insumo
                  </h3>
                  <button
                    className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary"
                    onClick={() => {
                      resetMovementForm();
                      setShowMovementModal(true);
                    }}
                  >
                    <Plus size={14} />
                    Nuevo
                  </button>
                </div>

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
                    movements.map((movement) => {
                      const Icon =
                        MOVEMENT_TYPE_ICONS[movement.type] || RefreshCw;
                      const colorClass =
                        MOVEMENT_TYPE_COLORS[movement.type] ||
                        "text-default-500";

                      return (
                        <div
                          key={movement._id}
                          className="app-panel-soft rounded-[22px] p-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <div
                                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-content2/70 ${colorClass}`}
                              >
                                <Icon size={16} />
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-foreground">
                                  {MOVEMENT_TYPE_LABELS[movement.type] ||
                                    movement.type}
                                </p>
                                <p className="mt-1 text-xs text-default-500">
                                  {movement.reason || "Movimiento sin detalle"}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p
                                className={`text-sm font-semibold ${colorClass}`}
                              >
                                {movement.type === "OUT" ? "-" : "+"}
                                {movement.quantity}
                              </p>
                              <p className="mt-1 text-xs text-default-500">
                                Stock: {movement.stockAfter}
                              </p>
                            </div>
                          </div>
                          <div className="mt-3 flex items-center justify-between text-xs text-default-400">
                            <span>{movement.sourceType}</span>
                            <span>
                              {movement.createdAt
                                ? new Date(movement.createdAt).toLocaleString()
                                : ""}
                            </span>
                          </div>
                        </div>
                      );
                    })
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
                        Este insumo aun no tiene historial de inventario.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
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
                  onClick={handleDeleteSupply}
                >
                  {isDeleting ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <Trash2 size={18} />
                  )}
                  Desactivar
                </button>
              </div>
            </>
          )}
        </div>

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

        {showMovementModal && selectedSupply && (
          <MovementFormModal
            formData={movementForm}
            isDesktop={isDesktop}
            submitting={isCreatingMovement}
            supplyName={selectedSupply.name}
            onChange={handleMovementFormChange}
            onClose={() => setShowMovementModal(false)}
            onSubmit={handleCreateMovement}
          />
        )}
      </div>
    );
  }

  // ── List view ─────────────────────────────────────────────────────

  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col overflow-hidden bg-background pb-24 font-sans lg:max-w-none lg:px-6 lg:pb-8">
      <header className="app-topbar px-6 pt-6 pb-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="section-kicker">Inventario</div>
            <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.03em] text-foreground">
              Insumos
            </h1>
            <p className="mt-2 text-sm text-default-500">
              Materias primas, materiales y productos de uso interno.
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
            <p className="section-kicker">Insumos</p>
            <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-foreground">
              {supplies.filter((s) => s.isActive !== false).length}
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

      {/* Filters */}
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
            Criticos ({lowStockCount})
          </button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 space-y-3 px-6 pb-6">
        {loading && supplies.length === 0 ? (
          <div className="app-panel rounded-[24px] py-12 text-center text-default-400">
            <Loader2 className="mx-auto mb-3 animate-spin" size={32} />
            <p className="text-sm font-medium">Cargando insumos...</p>
          </div>
        ) : filteredSupplies.length > 0 ? (
          <>
            {/* Desktop table */}
            <div className="hidden lg:block">
              <div className="app-panel overflow-x-auto rounded-[24px] p-2">
                <table className="w-full min-w-[800px]">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-[0.16em] text-default-500">
                      <th className="px-3 pb-3 pt-2">Insumo</th>
                      <th className="px-3 pb-3 pt-2">SKU</th>
                      <th className="px-3 pb-3 pt-2">Unidad</th>
                      <th className="px-3 pb-3 pt-2">Stock</th>
                      <th className="px-3 pb-3 pt-2">Minimo</th>
                      <th className="px-3 pb-3 pt-2 text-right">Costo Ref.</th>
                      <th className="px-3 pb-3 pt-2 text-right">Accion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSupplies.map((supply) => {
                      const isLow = supply.currentStock <= supply.minStock;
                      const isOut = supply.currentStock <= 0;

                      return (
                        <tr
                          key={supply._id}
                          className="cursor-pointer border-t border-divider/60"
                          onClick={() => navigate(`/supplies/${supply._id}`)}
                        >
                          <td className="px-3 py-3 text-sm font-semibold text-foreground">
                            {supply.name}
                          </td>
                          <td className="px-3 py-3 text-sm text-default-500">
                            {supply.sku || "—"}
                          </td>
                          <td className="px-3 py-3 text-sm text-default-500">
                            {SUPPLY_UNIT_OPTIONS.find(
                              (u) => u.value === supply.unit,
                            )?.label || supply.unit}
                          </td>
                          <td className="px-3 py-3 text-sm">
                            <span
                              className={
                                isOut || isLow
                                  ? "font-semibold text-danger"
                                  : "text-default-600"
                              }
                            >
                              {isOut
                                ? "Sin stock"
                                : `${supply.currentStock} ${supply.unit}`}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-sm text-default-500">
                            {supply.minStock} {supply.unit}
                          </td>
                          <td className="px-3 py-3 text-right text-sm font-semibold text-foreground">
                            {formatCompactCurrency(
                              supply.referenceCost,
                              currency,
                            )}
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

            {/* Mobile cards */}
            <div className="space-y-3 lg:hidden">
              {filteredSupplies.map((supply) => {
                const isLow = supply.currentStock <= supply.minStock;
                const isOut = supply.currentStock <= 0;

                return (
                  <button
                    key={supply._id}
                    className="app-panel flex w-full items-start justify-between rounded-[26px] p-4 text-left"
                    onClick={() => navigate(`/supplies/${supply._id}`)}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`flex h-14 w-14 items-center justify-center rounded-2xl ${
                          isOut
                            ? "bg-danger/15 text-danger"
                            : isLow
                              ? "bg-warning/15 text-warning"
                              : "bg-primary/12 text-primary"
                        }`}
                      >
                        <Package size={22} />
                      </div>
                      <div>
                        <h3 className="text-[15px] font-semibold text-foreground">
                          {supply.name}
                        </h3>
                        <p className="mt-0.5 text-[11px] uppercase tracking-[0.18em] text-default-400">
                          {supply.sku || "Sin SKU"} ·{" "}
                          {SUPPLY_UNIT_OPTIONS.find(
                            (u) => u.value === supply.unit,
                          )?.label || supply.unit}
                        </p>
                        <div className="mt-3 flex items-center gap-2 text-sm">
                          {isOut || isLow ? (
                            <AlertCircle className="text-danger" size={15} />
                          ) : (
                            <Layers3 className="text-primary" size={15} />
                          )}
                          <span
                            className={
                              isOut || isLow
                                ? "font-semibold text-danger"
                                : "text-default-600"
                            }
                          >
                            {isOut
                              ? "Sin stock"
                              : `${supply.currentStock} ${supply.unit}`}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-xs uppercase tracking-[0.16em] text-default-400">
                        Costo Ref.
                      </p>
                      <p className="mt-1 text-[18px] font-semibold tracking-[-0.03em] text-foreground">
                        {formatCompactCurrency(supply.referenceCost, currency)}
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
          </>
        ) : (
          <div className="app-panel rounded-[24px] py-12 text-center text-default-400">
            <p className="text-sm font-medium">No se encontraron insumos</p>
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        className="fixed bottom-[100px] right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_16px_34px_rgba(88,176,156,0.35)] transition-transform hover:scale-105 active:scale-95"
        onClick={() => {
          resetForm();
          setShowCreateModal(true);
        }}
      >
        <Plus size={26} strokeWidth={2.5} />
      </button>

      {/* Modals */}
      {showCreateModal && (
        <SupplyFormModal
          formData={formData}
          isDesktop={isDesktop}
          mode="create"
          submitting={isCreating}
          onChange={handleFormChange}
          onClose={() => {
            setShowCreateModal(false);
            resetForm();
          }}
          onSubmit={handleCreateSupply}
        />
      )}
    </div>
  );
}
