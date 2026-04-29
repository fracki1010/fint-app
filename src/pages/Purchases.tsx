import { useMemo, useState } from "react";
import { Check, ClipboardCheck, PackageCheck, Plus, Trash2, XCircle } from "lucide-react";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";

import { useAppToast } from "@/components/AppToast";
import { ConfirmActionDialog } from "@/components/ConfirmActionDialog";
import { useClients } from "@/hooks/useClients";
import { usePurchases } from "@/hooks/usePurchases";
import { usePermissions } from "@/hooks/usePermissions";
import { useSupplies } from "@/hooks/useSupplies";
import { formatCurrency } from "@/utils/currency";
import { getErrorMessage } from "@/utils/errors";
import type { PaymentCondition, PurchaseStatus } from "@/types";

type PurchaseFormItem = {
  supplyItemId: string;
  quantity: string;
  unitCost: string;
};

const STATUS_COLORS: Record<PurchaseStatus, string> = {
  DRAFT: "bg-default-200 text-default-700",
  CONFIRMED: "bg-primary/15 text-primary",
  RECEIVED: "bg-success/15 text-success",
  CANCELLED: "bg-danger/15 text-danger",
};

export default function PurchasesPage() {
  const { showToast } = useAppToast();
  const { canManagePurchases } = usePermissions();
  const [showForm, setShowForm] = useState(false);
  const [supplierId, setSupplierId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentCondition, setPaymentCondition] = useState<PaymentCondition>("CREDIT");
  const [tax, setTax] = useState("0");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<PurchaseFormItem[]>([
    { supplyItemId: "", quantity: "1", unitCost: "0" },
  ]);
  const [pendingAction, setPendingAction] = useState<{
    purchaseId: string;
    action: "confirm" | "receive" | "cancel";
  } | null>(null);

  const { clients, loading: loadingClients } = useClients();
  const { supplies, loading: loadingSupplies } = useSupplies();
  const {
    purchases,
    loading,
    createPurchase,
    confirmPurchase,
    receivePurchase,
    cancelPurchase,
    isCreating,
    isConfirming,
    isReceiving,
    isCancelling,
  } = usePurchases();

  const suppliers = clients;

  const subtotal = useMemo(
    () =>
      items.reduce((acc, item) => {
        const qty = Number(item.quantity) || 0;
        const cost = Number(item.unitCost) || 0;

        return acc + qty * cost;
      }, 0),
    [items],
  );

  const taxAmount = Number(tax) || 0;
  const total = subtotal + taxAmount;

  const resetForm = () => {
    setSupplierId("");
    setDate(new Date().toISOString().slice(0, 10));
    setPaymentCondition("CREDIT");
    setTax("0");
    setNotes("");
    setItems([{ supplyItemId: "", quantity: "1", unitCost: "0" }]);
    setShowForm(false);
  };

  const updateItem = (index: number, patch: Partial<PurchaseFormItem>) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const addItem = () => {
    setItems((prev) => [...prev, { supplyItemId: "", quantity: "1", unitCost: "0" }]);
  };

  const handleCreatePurchase = async () => {
    if (!canManagePurchases) {
      showToast({ title: "Sin permisos", message: "No tienes permisos para crear compras.", variant: "warning" });
      return;
    }
    if (!supplierId) {
      showToast({ title: "Proveedor requerido", message: "Selecciona un proveedor.", variant: "warning" });

      return;
    }

    const hasInvalidItem = items.some(
      (item) => !item.supplyItemId || Number(item.quantity) <= 0 || Number(item.unitCost) < 0,
    );

    if (hasInvalidItem) {
      showToast({
        title: "Items invalidos",
        message: "Completa insumo, cantidad mayor a 0 y costo valido.",
        variant: "warning",
      });

      return;
    }

    try {
      await createPurchase({
        supplierId,
        date,
        paymentCondition,
        subtotal,
        tax: taxAmount,
        total,
        notes: notes.trim() || undefined,
        items: items.map((item) => ({
          supplyItemId: item.supplyItemId,
          quantity: Number(item.quantity),
          unitCost: Number(item.unitCost),
          lineTotal: Number(item.quantity) * Number(item.unitCost),
        })),
      });

      showToast({ title: "Compra creada", message: "Se guardo en estado borrador.", variant: "success" });
      resetForm();
    } catch (error) {
      showToast({
        title: "No se pudo crear",
        message: getErrorMessage(error, "Error al crear compra."),
        variant: "error",
      });
    }
  };

  const applyStatusAction = async (purchaseId: string, action: "confirm" | "receive" | "cancel") => {
    try {
      if (action === "confirm") await confirmPurchase(purchaseId);
      if (action === "receive") await receivePurchase(purchaseId);
      if (action === "cancel") await cancelPurchase(purchaseId);

      showToast({ title: "Estado actualizado", message: "La compra fue actualizada.", variant: "success" });
    } catch (error) {
      showToast({
        title: "No se pudo actualizar",
        message: getErrorMessage(error, "Error al actualizar estado de compra."),
        variant: "error",
      });
    }
  };

  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col overflow-hidden bg-background pb-24 font-sans lg:max-w-none lg:px-6 lg:pb-8">
      <header className="app-topbar px-6 pt-6 pb-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="section-kicker">Abastecimiento</p>
            <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.03em] text-foreground">Compras</h1>
            <p className="mt-2 text-sm text-default-500">Gestiona compras de insumos y recepciones.</p>
          </div>
          <Button isDisabled={!canManagePurchases} radius="full" size="sm" startContent={<Plus size={16} />} onClick={() => setShowForm(true)}>
            Nueva
          </Button>
        </div>
      </header>

      <section className="space-y-3 px-4 pb-8 lg:px-0">
        {loading ? (
          <Card><CardBody>Cargando compras...</CardBody></Card>
        ) : purchases.length === 0 ? (
          <Card><CardBody>No hay compras registradas.</CardBody></Card>
        ) : (
          purchases.map((purchase) => {
            const supplier = suppliers.find((item) => item._id === purchase.supplierId);

            return (
              <Card key={purchase._id}>
                <CardBody className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold text-foreground">{supplier?.name || "Proveedor"}</p>
                      <p className="text-xs text-default-500">{purchase.date} · {purchase.items.length} item(s)</p>
                    </div>
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${STATUS_COLORS[purchase.status]}`}>
                      {purchase.status}
                    </span>
                  </div>

                  <div className="rounded-xl bg-content2 px-3 py-2 text-sm">
                    <p className="text-default-500">Total</p>
                    <p className="font-semibold">{formatCurrency(purchase.total)}</p>
                    {(purchase.createdAt || purchase.createdBy) && (
                      <p className="mt-1 text-[11px] text-default-500">
                        {purchase.createdAt
                          ? `Creado: ${new Date(purchase.createdAt).toLocaleString()}`
                          : "Creado"}
                        {purchase.createdBy ? ` · Usuario: ${purchase.createdBy}` : ""}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {purchase.status === "DRAFT" && (
                      <Button
                        isLoading={isConfirming}
                        isDisabled={!canManagePurchases}
                        size="sm"
                        startContent={<Check size={15} />}
                        variant="flat"
                        onClick={() =>
                          setPendingAction({
                            purchaseId: purchase._id,
                            action: "confirm",
                          })
                        }
                      >
                        Confirmar
                      </Button>
                    )}
                    {purchase.status === "CONFIRMED" && (
                      <Button
                        isLoading={isReceiving}
                        isDisabled={!canManagePurchases}
                        size="sm"
                        startContent={<PackageCheck size={15} />}
                        variant="flat"
                        onClick={() =>
                          setPendingAction({
                            purchaseId: purchase._id,
                            action: "receive",
                          })
                        }
                      >
                        Recibir
                      </Button>
                    )}
                    {(purchase.status === "DRAFT" || purchase.status === "CONFIRMED") && (
                      <Button
                        isLoading={isCancelling}
                        isDisabled={!canManagePurchases}
                        size="sm"
                        startContent={<XCircle size={15} />}
                        variant="flat"
                        onClick={() =>
                          setPendingAction({
                            purchaseId: purchase._id,
                            action: "cancel",
                          })
                        }
                      >
                        Cancelar
                      </Button>
                    )}
                    {purchase.status === "RECEIVED" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-1 text-xs font-semibold text-success">
                        <ClipboardCheck size={14} /> Stock actualizado
                      </span>
                    )}
                  </div>
                </CardBody>
              </Card>
            );
          })
        )}
      </section>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 p-2 lg:items-center lg:justify-center">
          <Card className="w-full max-w-2xl">
            <CardBody className="space-y-3">
              <h2 className="text-lg font-semibold">Nueva compra</h2>

              <Select
                isDisabled={loadingClients}
                label="Proveedor"
                placeholder="Selecciona proveedor"
                selectedKeys={supplierId ? [supplierId] : []}
                onSelectionChange={(keys) => setSupplierId((Array.from(keys)[0] as string) || "")}
              >
                {suppliers.map((supplier) => (
                  <SelectItem key={supplier._id}>{supplier.name}</SelectItem>
                ))}
              </Select>

              <div className="grid grid-cols-2 gap-2">
                <Input label="Fecha" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
                <Select
                  label="Condicion"
                  selectedKeys={[paymentCondition]}
                  onSelectionChange={(keys) => {
                    const value = Array.from(keys)[0] as PaymentCondition;

                    if (value) setPaymentCondition(value);
                  }}
                >
                  <SelectItem key="CASH">Contado</SelectItem>
                  <SelectItem key="CREDIT">Credito</SelectItem>
                </Select>
              </div>

              <div className="space-y-2 rounded-xl border border-divider p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">Items</p>
                  <Button size="sm" startContent={<Plus size={14} />} variant="flat" onClick={addItem}>
                    Agregar
                  </Button>
                </div>

                {items.map((item, index) => (
                  <div key={`${index}-${item.supplyItemId}`} className="grid grid-cols-12 gap-2">
                    <div className="col-span-6">
                      <Select
                        isDisabled={loadingSupplies}
                        placeholder="Insumo"
                        selectedKeys={item.supplyItemId ? [item.supplyItemId] : []}
                        onSelectionChange={(keys) =>
                          updateItem(index, {
                            supplyItemId: (Array.from(keys)[0] as string) || "",
                          })
                        }
                      >
                        {supplies.map((supply) => (
                          <SelectItem key={supply._id}>{supply.name}</SelectItem>
                        ))}
                      </Select>
                    </div>
                    <div className="col-span-2">
                      <Input
                        min={0}
                        placeholder="Cant"
                        type="number"
                        value={item.quantity}
                        onChange={(event) => updateItem(index, { quantity: event.target.value })}
                      />
                    </div>
                    <div className="col-span-3">
                      <Input
                        min={0}
                        placeholder="Costo"
                        type="number"
                        value={item.unitCost}
                        onChange={(event) => updateItem(index, { unitCost: event.target.value })}
                      />
                    </div>
                    <div className="col-span-1 flex items-center justify-center">
                      <Button
                        isIconOnly
                        isDisabled={items.length === 1}
                        size="sm"
                        variant="light"
                        onClick={() => removeItem(index)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <Input label="Impuestos" min={0} type="number" value={tax} onChange={(event) => setTax(event.target.value)} />
              <Input label="Notas" value={notes} onChange={(event) => setNotes(event.target.value)} />

              <div className="rounded-xl bg-content2 px-3 py-2 text-sm">
                <p className="text-default-500">Subtotal: {formatCurrency(subtotal)}</p>
                <p className="text-default-500">Impuestos: {formatCurrency(taxAmount)}</p>
                <p className="font-semibold">Total: {formatCurrency(total)}</p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="light" onClick={resetForm}>Cancelar</Button>
                <Button isLoading={isCreating} onClick={handleCreatePurchase}>Guardar compra</Button>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      <ConfirmActionDialog
        confirmColor={pendingAction?.action === "cancel" ? "danger" : "primary"}
        confirmLabel={
          pendingAction?.action === "confirm"
            ? "Confirmar compra"
            : pendingAction?.action === "receive"
              ? "Registrar recepción"
              : "Cancelar compra"
        }
        isLoading={isConfirming || isReceiving || isCancelling}
        isOpen={Boolean(pendingAction)}
        message={
          pendingAction?.action === "confirm"
            ? "Esta compra pasará a estado CONFIRMED."
            : pendingAction?.action === "receive"
              ? "Esta acción impacta stock y deja la compra en RECEIVED."
              : "La compra cambiará a CANCELLED."
        }
        title="Confirmar acción"
        onCancel={() => setPendingAction(null)}
        onConfirm={async () => {
          if (!pendingAction) return;
          await applyStatusAction(pendingAction.purchaseId, pendingAction.action);
          setPendingAction(null);
        }}
      />
    </div>
  );
}
