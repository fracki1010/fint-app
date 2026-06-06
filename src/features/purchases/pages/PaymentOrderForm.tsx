import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Save, X } from "lucide-react";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { Input } from "@heroui/input";
import { Autocomplete, AutocompleteItem } from "@heroui/autocomplete";
import { useSuppliers } from "@features/suppliers/hooks/useSuppliers";
import type { Supplier } from "@shared/types";
import { usePurchases } from "@features/purchases/hooks/usePurchases";
import { useCreatePaymentOrder, useApplyPaymentOrder } from "../hooks/usePaymentOrders";
import { formatCurrency } from "@shared/utils/currency";
import { formatDateShort } from "@shared/utils/date";
import { getPaymentLabel } from "@features/sales/utils/payment";
import { useAppToast } from "@features/notifications/components/AppToast";
import { getErrorMessage } from "@shared/utils/errors";

export default function PaymentOrderFormPage() {
  const navigate = useNavigate();
  const { showToast } = useAppToast();
  const { suppliers, loading: suppliersLoading } = useSuppliers();
  const { mutateAsync: createOrder, isPending: isCreating } = useCreatePaymentOrder();
  const { mutateAsync: applyPaymentOrder, isPending: isApplying } = useApplyPaymentOrder();

  const [supplierId, setSupplierId] = useState("");
  const [supplierLabel, setSupplierLabel] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState("transfer");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedPurchases, setSelectedPurchases] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);

  // Fetch purchases for selected supplier
  const { purchases, loading: purchasesLoading } = usePurchases({
    enabled: Boolean(supplierId),
  });

  // Filter pending purchases (not fully paid)
  const pendingPurchases = useMemo(() =>
    (purchases || []).filter((p) => (p.total || 0) - (p.paidAmount || 0) > 0),
    [purchases]
  );

  const total = useMemo(() =>
    Object.values(selectedPurchases).reduce((s, v) => s + (v || 0), 0),
    [selectedPurchases]
  );

  const handlePurchaseToggle = (purchaseId: string, maxAmount: number) => {
    setSelectedPurchases((prev) => {
      if (prev[purchaseId]) {
        const next = { ...prev };
        delete next[purchaseId];
        return next;
      }
      return { ...prev, [purchaseId]: maxAmount };
    });
  };

  const handleAmountChange = (purchaseId: string, value: string, maxAmount: number) => {
    const amount = Math.min(Math.max(0, Number(value) || 0), maxAmount);
    setSelectedPurchases((prev) => ({ ...prev, [purchaseId]: amount }));
  };

  const handleSubmit = async () => {
    if (!supplierId || Object.keys(selectedPurchases).length === 0) return;
    setSaving(true);
    try {
      const items = Object.entries(selectedPurchases).map(([purchaseId, amount]) => ({ purchaseId, amount }));
      const order = await createOrder({
        supplierId,
        date,
        paymentMethod,
        reference,
        notes,
        items,
        total,
      });
      // Auto-apply
      await applyPaymentOrder(order._id);
      navigate("/supplier-payments");
    } catch (e) {
      showToast({ variant: "error", message: getErrorMessage(e, "Error al crear la orden de pago") });
    } finally {
      setSaving(false);
    }
  };

  const isPending = saving || isCreating || isApplying;

  return (
    <div className="flex h-full flex-col max-w-2xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">Nueva Orden de Pago</h2>
          <p className="text-sm text-default-500">Seleccioná compras pendientes y aplicá el pago</p>
        </div>
        <Button isIconOnly variant="flat" onPress={() => navigate("/supplier-payments")}>
          <X size={16} />
        </Button>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto">
        {/* Supplier */}
        <div>
          <label className="text-xs font-bold uppercase text-default-500 mb-1.5 block">Proveedor *</label>
          <Autocomplete
            aria-label="Proveedor"
            placeholder="Buscar proveedor..."
            inputValue={supplierLabel}
            isLoading={suppliersLoading}
            items={suppliers}
            onInputChange={setSupplierLabel}
            onSelectionChange={(key) => {
              if (!key) return;
              const s = suppliers.find((c) => c._id === String(key));
              if (s) { setSupplierId(s._id); setSupplierLabel(s.name); setSelectedPurchases({}); }
            }}
          >
            {(item: Supplier) => <AutocompleteItem key={item._id}>{item.name}</AutocompleteItem>}
          </Autocomplete>
        </div>

        {/* Date & Method */}
        <div className="grid grid-cols-2 gap-4">
          <Input label="Fecha" labelPlacement="outside" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <div>
            <label className="text-xs font-bold uppercase text-default-500 mb-1.5 block">Método</label>
            <select className="corp-input w-full rounded-xl px-3 py-2.5 text-sm" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
              {["cash","card","transfer","mercadopago","check","other"].map((m) => (
                <option key={m} value={m}>{getPaymentLabel(m as any)}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Reference & Notes */}
        <Input label="Referencia" labelPlacement="outside" placeholder="N° de comprobante, factura..." value={reference} onChange={(e) => setReference(e.target.value)} />
        <Input label="Notas" labelPlacement="outside" placeholder="Observaciones..." value={notes} onChange={(e) => setNotes(e.target.value)} />

        {/* Pending purchases */}
        {supplierId && (
          <Card>
            <CardBody>
              <p className="text-sm font-bold text-foreground mb-3">Compras pendientes</p>
              {purchasesLoading ? (
                <Loader2 className="animate-spin mx-auto" size={20} />
              ) : pendingPurchases.length === 0 ? (
                <p className="text-sm text-default-500 text-center py-4">Este proveedor no tiene compras pendientes</p>
              ) : (
                <div className="space-y-2">
                  {pendingPurchases.map((p) => {
                    const remaining = (p.total || 0) - (p.paidAmount || 0);
                    const selected = selectedPurchases[p._id];
                    return (
                      <div key={p._id} className={`rounded-xl border p-3 transition ${selected ? "border-primary/40 bg-primary/5" : "border-divider/30"}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={!!selected}
                              onChange={() => handlePurchaseToggle(p._id, remaining)}
                              className="w-4 h-4 rounded border-divider text-primary"
                            />
                            <div>
                              <p className="text-sm font-semibold text-foreground">{formatDateShort(p.date)} · {formatCurrency(p.total)}</p>
                              <p className="text-xs text-default-500">Saldo: {formatCurrency(remaining)}</p>
                            </div>
                          </div>
                          {selected && (
                            <Input
                              type="number"
                              min={0}
                              max={remaining}
                              value={String(selected)}
                              onChange={(e) => handleAmountChange(p._id, e.target.value, remaining)}
                              size="sm"
                              className="w-28"
                              endContent={<span className="text-xs text-default-400">{remaining.toFixed(0)}</span>}
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardBody>
          </Card>
        )}

        {/* Total */}
        {total > 0 && (
          <Card>
            <CardBody className="flex flex-row items-center justify-between">
              <span className="text-sm font-semibold">Total a pagar</span>
              <span className="text-lg font-bold font-mono text-primary">{formatCurrency(total)}</span>
            </CardBody>
          </Card>
        )}
      </div>

      {/* Footer */}
      <div className="flex gap-3 pt-4 border-t border-divider/10 mt-4">
        <Button variant="flat" className="flex-1" onPress={() => navigate("/supplier-payments")}>Cancelar</Button>
        <Button color="primary" className="flex-1" isLoading={isPending} isDisabled={!supplierId || Object.keys(selectedPurchases).length === 0} onPress={handleSubmit}>
          {isPending ? null : <Save size={16} />}
          Aplicar Pago
        </Button>
      </div>
    </div>
  );
}
