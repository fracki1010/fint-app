import { useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  PackageSearch,
  AlertCircle,
  Plus,
  Loader2,
  X,
  Pencil,
  Trash2,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  ChevronRight,
  ShoppingBag,
} from "lucide-react";
import { Drawer, DrawerBody, DrawerContent } from "@heroui/drawer";

import { useSupplies, useSupplyMovements } from "@features/supplies/hooks/useSupplies";
import { usePurchases } from "@features/purchases/hooks/usePurchases";
import { SupplyMovementType } from "@shared/types";
import { useAppToast } from "@features/notifications/components/AppToast";
import { formatCompactCurrency } from "@shared/utils/currency";
import { getErrorMessage } from "@shared/utils/errors";
import { SUPPLY_UNIT_OPTIONS } from "./SupplyFormModal";

// ── Constants ─────────────────────────────────────────────────────────────────

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

// ── Movement form types ───────────────────────────────────────────────────────

type MovementFormState = {
  type: SupplyMovementType;
  quantity: string;
  reason: string;
};

const emptyMovementForm: MovementFormState = {
  type: "IN",
  quantity: "",
  reason: "",
};

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
      <DrawerContent className="h-[100dvh] w-full max-w-xl overflow-x-hidden rounded-none bg-content1">
        <DrawerBody className="p-0">{formLayout}</DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}

// ── Related Purchases ─────────────────────────────────────────────────────────

function RelatedPurchases({ supplyId, currency }: { supplyId: string; currency: string }) {
  const { purchases, loading } = usePurchases();

  const related = useMemo(() => {
    return purchases.filter((p) =>
      p.items.some((item) => {
        // Check product ref (new)
        const product = item.product;
        if (typeof product === "object" && product) {
          return product._id === supplyId;
        }
        if (product === supplyId) return true;
        // Check supply ref (legacy)
        const supply = item.supply;
        if (typeof supply === "object" && supply) {
          return supply._id === supplyId;
        }
        return supply === supplyId;
      }),
    );
  }, [purchases, supplyId]);

  if (loading && purchases.length === 0) {
    return (
      <div className="stat-card py-6 text-center text-default-400">
        <Loader2 className="mx-auto mb-2 animate-spin" size={20} />
        <p className="text-xs">Cargando compras...</p>
      </div>
    );
  }

  if (related.length === 0) return null;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-bold text-foreground">Compras Relacionadas</p>
        <span className="text-xs text-default-400">{related.length}</span>
      </div>
      <div className="space-y-2">
        {related.slice(0, 5).map((purchase) => {
          const supplierName =
            typeof purchase.supplier === "object" && purchase.supplier
              ? purchase.supplier.company || purchase.supplier.name || "Proveedor"
              : "Proveedor";
          return (
            <Link
              key={purchase._id}
              className="list-row flex w-full items-center gap-3 hover:border-primary/30 hover:bg-primary/5"
              to={`/purchases/${purchase._id}`}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
                <ShoppingBag size={15} />
              </div>
              <div className="min-w-0 flex-1 text-left">
                <p className="truncate text-sm font-semibold text-foreground">{supplierName}</p>
                <p className="mt-0.5 text-xs text-default-400">
                  {purchase.items.length} items · {new Date(purchase.date).toLocaleDateString("es-AR")}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-bold text-foreground">{formatCompactCurrency(purchase.total, currency)}</p>
                <p className="mt-0.5 text-[10px] uppercase tracking-wide text-default-400">{purchase.status}</p>
              </div>
              <ChevronRight className="shrink-0 text-default-300" size={16} />
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// ── Supply Detail Panel ───────────────────────────────────────────────────────

export default function SupplyDetailPanel({
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
    <div className="flex flex-col bg-content1">
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

            {/* Related Purchases */}
            <RelatedPurchases supplyId={supplyId} currency={currency} />

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
