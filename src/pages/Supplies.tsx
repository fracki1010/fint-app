import { useMemo, useState } from "react";
import { AlertTriangle, Package, Plus, SlidersHorizontal } from "lucide-react";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";

import { useAppToast } from "@/components/AppToast";
import { ConfirmActionDialog } from "@/components/ConfirmActionDialog";
import { usePermissions } from "@/hooks/usePermissions";
import { useSupplies, useSupplyMovements } from "@/hooks/useSupplies";
import { getErrorMessage } from "@/utils/errors";
import type { SupplyItem, SupplyMovementType, SupplyUnit } from "@/types";

type SupplyFormState = {
  name: string;
  sku: string;
  unit: SupplyUnit;
  currentStock: string;
  minStock: string;
  referenceCost: string;
};

const UNIT_OPTIONS: Array<{ value: SupplyUnit; label: string }> = [
  { value: "u", label: "Unidad" },
  { value: "kg", label: "Kilogramo" },
  { value: "g", label: "Gramo" },
  { value: "lt", label: "Litro" },
  { value: "ml", label: "Mililitro" },
];

const emptySupplyForm: SupplyFormState = {
  name: "",
  sku: "",
  unit: "u",
  currentStock: "0",
  minStock: "0",
  referenceCost: "0",
};

export default function SuppliesPage() {
  const { showToast } = useAppToast();
  const { canManageSupplies } = usePermissions();
  const [query, setQuery] = useState("");
  const [editingSupply, setEditingSupply] = useState<SupplyItem | null>(null);
  const [showSupplyForm, setShowSupplyForm] = useState(false);
  const [showAdjustmentForm, setShowAdjustmentForm] = useState(false);
  const [selectedSupplyId, setSelectedSupplyId] = useState<string>("");
  const [formData, setFormData] = useState<SupplyFormState>(emptySupplyForm);
  const [adjustType, setAdjustType] = useState<SupplyMovementType>("IN");
  const [adjustQuantity, setAdjustQuantity] = useState("1");
  const [adjustReason, setAdjustReason] = useState("");
  const [pendingAdjustment, setPendingAdjustment] = useState<{
    supplyId: string;
    type: SupplyMovementType;
    quantity: number;
    reason: string;
  } | null>(null);

  const { supplies, loading, createSupply, updateSupply, isCreating, isUpdating } =
    useSupplies();

  const { createSupplyMovement, isCreatingMovement } =
    useSupplyMovements(selectedSupplyId || undefined);

  const filteredSupplies = useMemo(() => {
    if (!query.trim()) return supplies;

    const value = query.toLowerCase();

    return supplies.filter(
      (supply) =>
        supply.name.toLowerCase().includes(value) ||
        (supply.sku || "").toLowerCase().includes(value),
    );
  }, [supplies, query]);

  const resetSupplyForm = () => {
    setFormData(emptySupplyForm);
    setEditingSupply(null);
    setShowSupplyForm(false);
  };

  const openCreateForm = () => {
    if (!canManageSupplies) return;
    setEditingSupply(null);
    setFormData(emptySupplyForm);
    setShowSupplyForm(true);
  };

  const openEditForm = (supply: SupplyItem) => {
    if (!canManageSupplies) return;
    setEditingSupply(supply);
    setFormData({
      name: supply.name,
      sku: supply.sku || "",
      unit: supply.unit,
      currentStock: String(supply.currentStock ?? 0),
      minStock: String(supply.minStock ?? 0),
      referenceCost: String(supply.referenceCost ?? 0),
    });
    setShowSupplyForm(true);
  };

  const openAdjustmentForm = (supplyId: string) => {
    if (!canManageSupplies) return;
    setSelectedSupplyId(supplyId);
    setAdjustType("IN");
    setAdjustQuantity("1");
    setAdjustReason("");
    setShowAdjustmentForm(true);
  };

  const handleSubmitSupply = async () => {
    if (!formData.name.trim()) {
      showToast({ title: "Nombre obligatorio", message: "Ingresa el nombre del insumo.", variant: "warning" });

      return;
    }

    try {
      const payload = {
        name: formData.name.trim(),
        sku: formData.sku.trim() || undefined,
        unit: formData.unit,
        currentStock: Number(formData.currentStock) || 0,
        minStock: Number(formData.minStock) || 0,
        referenceCost: Number(formData.referenceCost) || 0,
      };

      if (editingSupply) {
        await updateSupply({ id: editingSupply._id, payload });
      } else {
        await createSupply(payload);
      }

      showToast({ title: editingSupply ? "Insumo actualizado" : "Insumo creado", message: "Cambios guardados correctamente.", variant: "success" });
      resetSupplyForm();
    } catch (error) {
      showToast({ title: "No se pudo guardar", message: getErrorMessage(error, "Error al guardar insumo."), variant: "error" });
    }
  };

  const handleCreateAdjustment = async () => {
    if (!canManageSupplies) {
      showToast({ title: "Sin permisos", message: "No tienes permisos para ajustar stock.", variant: "warning" });
      return;
    }
    const quantity = Number(adjustQuantity);

    if (!selectedSupplyId) {
      showToast({ title: "Selecciona un insumo", message: "Debes elegir un insumo para ajustar.", variant: "warning" });

      return;
    }

    if (!adjustReason.trim()) {
      showToast({ title: "Motivo obligatorio", message: "Ingresa el motivo del ajuste.", variant: "warning" });

      return;
    }

    if (quantity <= 0) {
      showToast({ title: "Cantidad invalida", message: "La cantidad debe ser mayor a 0.", variant: "warning" });

      return;
    }

    const selectedSupply = supplies.find((s) => s._id === selectedSupplyId);

    if (
      selectedSupply &&
      adjustType === "OUT" &&
      selectedSupply.currentStock - quantity < 0
    ) {
      showToast({ title: "Stock insuficiente", message: "No se permite dejar stock negativo.", variant: "error" });

      return;
    }

    setPendingAdjustment({
      supplyId: selectedSupplyId,
      type: adjustType,
      quantity,
      reason: adjustReason.trim(),
    });
  };

  const confirmCreateAdjustment = async () => {
    if (!pendingAdjustment) return;

    try {
      await createSupplyMovement({
        id: pendingAdjustment.supplyId,
        payload: {
          type: pendingAdjustment.type,
          quantity: pendingAdjustment.quantity,
          reason: pendingAdjustment.reason,
          sourceType: "MANUAL",
        },
      });

      showToast({ title: "Ajuste registrado", message: "El movimiento se guardo correctamente.", variant: "success" });
      setShowAdjustmentForm(false);
      setPendingAdjustment(null);
    } catch (error) {
      showToast({ title: "No se pudo registrar", message: getErrorMessage(error, "Error al crear ajuste de stock."), variant: "error" });
    }
  };

  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col overflow-hidden bg-background pb-24 font-sans lg:max-w-none lg:px-6 lg:pb-8">
      <header className="app-topbar px-6 pt-6 pb-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="section-kicker">Inventario</p>
            <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.03em] text-foreground">
              Insumos
            </h1>
            <p className="mt-2 text-sm text-default-500">
              Gestiona catalogo, stock y ajustes manuales.
            </p>
          </div>
          <Button isDisabled={!canManageSupplies} radius="full" size="sm" startContent={<Plus size={16} />} onClick={openCreateForm}>
            Nuevo
          </Button>
        </div>

        <Input
          className="mt-4"
          placeholder="Buscar por nombre o SKU..."
          value={query}
          variant="bordered"
          onChange={(event) => setQuery(event.target.value)}
        />
      </header>

      <section className="space-y-3 px-4 pb-8 lg:px-0">
        {loading ? (
          <Card><CardBody>Cargando insumos...</CardBody></Card>
        ) : filteredSupplies.length === 0 ? (
          <Card><CardBody>No hay insumos registrados.</CardBody></Card>
        ) : (
          filteredSupplies.map((supply) => {
            const lowStock = supply.currentStock <= supply.minStock;

            return (
              <Card key={supply._id}>
                <CardBody className="space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-base font-semibold text-foreground">{supply.name}</p>
                      <p className="text-xs text-default-500">
                        SKU: {supply.sku || "-"} · Unidad: {supply.unit}
                      </p>
                    </div>
                    {lowStock && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-warning/15 px-2 py-1 text-xs font-semibold text-warning">
                        <AlertTriangle size={13} /> Bajo minimo
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="rounded-xl bg-content2 px-3 py-2">
                      <p className="text-default-500">Stock actual</p>
                      <p className="font-semibold">{supply.currentStock}</p>
                    </div>
                    <div className="rounded-xl bg-content2 px-3 py-2">
                      <p className="text-default-500">Stock minimo</p>
                      <p className="font-semibold">{supply.minStock}</p>
                    </div>
                  </div>
                  {(supply.createdAt || supply.updatedAt) && (
                    <p className="text-[11px] text-default-500">
                      {supply.createdAt
                        ? `Creado: ${new Date(supply.createdAt).toLocaleString()}`
                        : ""}
                      {supply.updatedAt
                        ? ` · Actualizado: ${new Date(supply.updatedAt).toLocaleString()}`
                        : ""}
                    </p>
                  )}

                  <div className="flex gap-2">
                    <Button className="flex-1" isDisabled={!canManageSupplies} size="sm" startContent={<Package size={15} />} variant="flat" onClick={() => openEditForm(supply)}>
                      Editar
                    </Button>
                    <Button className="flex-1" isDisabled={!canManageSupplies} size="sm" startContent={<SlidersHorizontal size={15} />} variant="flat" onClick={() => openAdjustmentForm(supply._id)}>
                      Ajustar stock
                    </Button>
                  </div>
                </CardBody>
              </Card>
            );
          })
        )}
      </section>

      {showSupplyForm && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 p-2 lg:items-center lg:justify-center">
          <Card className="w-full max-w-xl">
            <CardBody className="space-y-3">
              <h2 className="text-lg font-semibold">
                {editingSupply ? "Editar insumo" : "Nuevo insumo"}
              </h2>

              <Input
                label="Nombre"
                value={formData.name}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, name: event.target.value }))
                }
              />
              <Input
                label="SKU"
                value={formData.sku}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, sku: event.target.value }))
                }
              />
              <Select
                label="Unidad"
                selectedKeys={[formData.unit]}
                onSelectionChange={(keys) => {
                  const unit = Array.from(keys)[0] as SupplyUnit;

                  if (unit) {
                    setFormData((prev) => ({ ...prev, unit }));
                  }
                }}
              >
                {UNIT_OPTIONS.map((unit) => (
                  <SelectItem key={unit.value}>{unit.label}</SelectItem>
                ))}
              </Select>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  label="Stock actual"
                  type="number"
                  value={formData.currentStock}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, currentStock: event.target.value }))
                  }
                />
                <Input
                  label="Stock minimo"
                  type="number"
                  value={formData.minStock}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, minStock: event.target.value }))
                  }
                />
              </div>
              <Input
                label="Costo referencia"
                type="number"
                value={formData.referenceCost}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, referenceCost: event.target.value }))
                }
              />

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="light" onClick={resetSupplyForm}>Cancelar</Button>
                <Button isLoading={isCreating || isUpdating} onClick={handleSubmitSupply}>Guardar</Button>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {showAdjustmentForm && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 p-2 lg:items-center lg:justify-center">
          <Card className="w-full max-w-xl">
            <CardBody className="space-y-3">
              <h2 className="text-lg font-semibold">Ajuste de stock</h2>
              <Select
                label="Tipo"
                selectedKeys={[adjustType]}
                onSelectionChange={(keys) => {
                  const value = Array.from(keys)[0] as SupplyMovementType;

                  if (value) {
                    setAdjustType(value);
                  }
                }}
              >
                <SelectItem key="IN">Ingreso</SelectItem>
                <SelectItem key="OUT">Egreso</SelectItem>
                <SelectItem key="ADJUST">Ajuste</SelectItem>
              </Select>
              <Input
                label="Cantidad"
                min={0}
                type="number"
                value={adjustQuantity}
                onChange={(event) => setAdjustQuantity(event.target.value)}
              />
              <Input
                label="Motivo"
                value={adjustReason}
                onChange={(event) => setAdjustReason(event.target.value)}
              />

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="light" onClick={() => setShowAdjustmentForm(false)}>Cancelar</Button>
                <Button isLoading={isCreatingMovement} onClick={handleCreateAdjustment}>Registrar</Button>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      <ConfirmActionDialog
        confirmColor="warning"
        confirmLabel="Registrar ajuste"
        isLoading={isCreatingMovement}
        isOpen={Boolean(pendingAdjustment)}
        message={
          pendingAdjustment
            ? `Se registrará ${pendingAdjustment.type} por ${pendingAdjustment.quantity} unidad(es).`
            : ""
        }
        title="Confirmar ajuste de stock"
        onCancel={() => setPendingAdjustment(null)}
        onConfirm={confirmCreateAdjustment}
      />
    </div>
  );
}
