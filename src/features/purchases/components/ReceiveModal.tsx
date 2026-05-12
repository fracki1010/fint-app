import { useState } from "react";
import { Button } from "@heroui/button";
import { Drawer, DrawerBody, DrawerContent } from "@heroui/drawer";
import { Select, SelectItem } from "@heroui/select";
import { X, Package, Calculator, AlertTriangle, Info } from "lucide-react";
import { formatCompactCurrency } from "@shared/utils/currency";
import type { Purchase } from "@shared/types";

interface ReceiveModalProps {
  isOpen: boolean;
  purchase: Purchase;
  alreadyReceived: Map<string, number> | null;
  currency: string;
  isDesktop: boolean;
  onClose: () => void;
  onSubmit: (data: {
    date: string;
    notes: string;
    items: Array<{
      product: string;
      presentationId?: string;
      quantity: number;
      remittedQty?: number;
      differenceReason?: string;
      notes?: string;
      unitCost: number;
    }>;
  }) => Promise<void>;
}

const DIFF_REASONS = [
  { value: "falta", label: "Falta mercadería" },
  { value: "sobra", label: "Sobrante" },
  { value: "dañado", label: "Dañado / roto" },
  { value: "sustitución", label: "Producto sustituto" },
  { value: "otro", label: "Otro" },
];

type ItemState = {
  productId: string;
  presentationId?: string;
  productName: string;
  orderedQty: number;
  remittedQty: number;
  realQty: number;
  unitCost: number;
  differenceReason: string;
  notes: string;
};

export default function ReceiveModal({
  isOpen,
  purchase,
  alreadyReceived,
  currency,
  isDesktop,
  onClose,
  onSubmit,
}: ReceiveModalProps) {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<ItemState[]>(
    purchase.items.map((item) => {
      const productId = typeof item.product === "string" ? item.product : item.product?._id || "";
      const alreadyQty = alreadyReceived?.get(productId) || 0;
      const pending = Math.max(0, item.quantity - alreadyQty);

      return {
        productId,
        presentationId: item.presentationId || undefined,
        productName: typeof item.product === "string" ? "" : item.product?.name || "",
        orderedQty: item.quantity,
        remittedQty: pending,
        realQty: pending,
        unitCost: item.unitCost,
        differenceReason: "",
        notes: "",
      };
    }),
  );
  const [submitting, setSubmitting] = useState(false);

  const updateItem = (idx: number, updates: Partial<ItemState>) => {
    setItems((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], ...updates };
      return next;
    });
  };

  const totalReal = items.reduce((sum, item) => sum + item.realQty * item.unitCost, 0);
  const hasDifferences = items.some((item) => item.remittedQty !== item.realQty);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await onSubmit({
        date,
        notes,
        items: items
          .filter((item) => item.realQty > 0)
          .map((item) => {
            const base = {
              product: item.productId,
              presentationId: item.presentationId,
              quantity: item.realQty,
              unitCost: item.unitCost,
            };
            const diff = item.remittedQty - item.realQty;
            if (diff !== 0) {
              return {
                ...base,
                remittedQty: item.remittedQty,
                differenceReason: item.differenceReason || "otro",
                notes: item.notes,
              };
            }
            return base;
          }),
      });
      onClose();
    } catch {
      // Error handled by parent
    } finally {
      setSubmitting(false);
    }
  };

  const content = (
    <div className="flex h-full flex-col p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="section-kicker">Recepción de mercadería</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-foreground">
            Remito de compra
          </h2>
          <p className="mt-1 text-xs text-default-500">{purchase?._id?.slice(-8)?.toUpperCase()}</p>
        </div>
        <button className="app-panel-soft flex h-10 w-10 items-center justify-center rounded-2xl text-default-500" onClick={onClose}>
          <X size={18} />
        </button>
      </div>

      {/* Date + Notes */}
      <div className="mt-6 space-y-4">
        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-default-500">Fecha</span>
          <input
            className="corp-input w-full rounded-2xl px-4 py-3 text-sm"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-default-500">Notas generales</span>
          <textarea
            className="corp-input min-h-[60px] w-full rounded-2xl px-4 py-3 text-sm"
            placeholder="Observaciones del remito..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </label>
      </div>

      {/* Items */}
      <div className="mt-6 flex-1 space-y-3 overflow-y-auto">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-default-400">
          Items
        </p>
        {items.map((item, idx) => {
          const diff = item.remittedQty - item.realQty;
          const hasDiff = diff !== 0;

          return (
            <div key={idx} className="rounded-xl border border-divider/30 bg-content2/20 p-4 space-y-4">
              {/* Product name + pending status */}
              <div className="flex items-center gap-2">
                <Package size={14} className="shrink-0 text-primary" />
                <p className="text-sm font-semibold text-foreground">{item.productName || `Producto #${idx + 1}`}</p>
                {item.orderedQty - item.realQty > 0 && (
                  <span className="text-[10px] text-default-400 ml-auto">
                    Pendiente: {item.orderedQty - item.realQty}
                  </span>
                )}
              </div>

              {/* Already received info */}
              {alreadyReceived && (alreadyReceived.get(item.productId) || 0) > 0 && (
                <div className="flex items-center gap-1.5 rounded-lg bg-content3/30 px-3 py-1.5 text-[11px] text-default-500">
                  <Info size={12} />
                  Ya recibido: {alreadyReceived.get(item.productId)} · Pendiente: {Math.max(0, item.orderedQty - (alreadyReceived.get(item.productId) || 0))}
                </div>
              )}

              {/* Three-column header */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-default-400 mb-1">Pedido</p>
                  <p className="rounded-lg bg-content3/50 px-3 py-2.5 text-sm font-bold text-foreground text-center">
                    {item.orderedQty}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-default-400 mb-1">Según remito</p>
                  <input
                    className="corp-input w-full rounded-lg px-3 py-2.5 text-sm text-center font-semibold"
                    min="0"
                    max={item.orderedQty}
                    step="0.001"
                    type="number"
                    value={item.remittedQty}
                    onChange={(e) => updateItem(idx, { remittedQty: Math.min(Number(e.target.value), item.orderedQty) })}
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-default-400 mb-1">Real recibido</p>
                  <input
                    className={`corp-input w-full rounded-lg px-3 py-2.5 text-sm text-center font-bold ${
                      hasDiff ? "border-warning/50 bg-warning/5" : ""
                    }`}
                    min="0"
                    step="0.001"
                    type="number"
                    value={item.realQty}
                    onChange={(e) => updateItem(idx, { realQty: Math.max(0, Number(e.target.value)) })}
                  />
                </div>
              </div>

              {/* Difference alert */}
              {hasDiff && (
                <div className="rounded-lg border border-warning/30 bg-warning/5 p-3 space-y-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={14} className="text-warning shrink-0" />
                    <span className="text-xs font-bold text-warning">
                      Diferencia: {diff > 0 ? `Faltan ${diff}` : `Sobran ${Math.abs(diff)}`}
                    </span>
                    <span className="text-[10px] text-default-400 ml-auto">
                      Remito: {item.remittedQty} | Real: {item.realQty}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-default-500">Motivo</label>
                      <Select
                        aria-label="Motivo de la diferencia"
                        classNames={{
                          base: "w-full",
                          trigger: "corp-input min-h-[40px] rounded-lg px-3 text-sm text-foreground",
                          value: "text-foreground text-xs",
                          popoverContent: "bg-content1 text-foreground",
                          listbox: "bg-content1 text-foreground",
                        }}
                        selectedKeys={[item.differenceReason]}
                        variant="bordered"
                        onSelectionChange={(keys) => {
                          const val = Array.from(keys)[0] as string;
                          updateItem(idx, { differenceReason: val });
                        }}
                      >
                        {DIFF_REASONS.map((r) => (
                          <SelectItem key={r.value}>{r.label}</SelectItem>
                        ))}
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-default-500">Observación</label>
                      <input
                        className="corp-input w-full rounded-lg px-3 py-2.5 text-sm"
                        placeholder="Ej: 5 bolsas llegaron rotas"
                        value={item.notes}
                        onChange={(e) => updateItem(idx, { notes: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Costo unitario */}
              <div className="flex items-center gap-3">
                <div className="flex-1 space-y-1">
                  <label className="text-[11px] font-semibold text-default-500">Costo unitario</label>
                  <input
                    className="corp-input w-full rounded-lg px-3 py-2.5 text-sm"
                    min="0"
                    step="0.01"
                    type="number"
                    value={item.unitCost}
                    onChange={(e) => updateItem(idx, { unitCost: Number(e.target.value) })}
                  />
                </div>
                <div className="shrink-0 pt-5">
                  <div className="flex items-center gap-1.5 rounded-lg bg-content3/50 px-3 py-2.5 text-xs text-default-500">
                    <Calculator size={12} />
                    <span>
                      Subtotal: <strong className="text-foreground">{formatCompactCurrency(item.realQty * item.unitCost, currency)}</strong>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary + Submit */}
      <div className="mt-6 space-y-4 border-t border-divider/70 pt-4">
        {hasDifferences && (
          <div className="flex items-center gap-2 rounded-lg bg-warning/10 px-3 py-2 text-xs text-warning font-medium">
            <Info size={14} />
            Hay diferencias entre lo remitido y lo recibido. Se registrarán en el remito.
          </div>
        )}
        <div className="flex items-center justify-between text-sm">
          <span className="text-default-500">Total real recibido</span>
          <span className="text-lg font-bold text-success">{formatCompactCurrency(totalReal, currency)}</span>
        </div>
        <div className="flex gap-3">
          <Button className="flex-1" variant="flat" onPress={onClose}>
            Cancelar
          </Button>
          <Button
            className="flex-1"
            color="success"
            isLoading={submitting}
            isDisabled={items.every((i) => i.realQty <= 0)}
            onPress={handleSubmit}
            startContent={submitting ? null : <PackageCheckIcon />}
          >
            {submitting ? "Recibiendo..." : "Recibir mercadería"}
          </Button>
        </div>
      </div>
    </div>
  );

  if (!isDesktop) {
    return (
      <div className="fixed inset-0 z-[120] bg-black/45 backdrop-blur-[1px]">
        <div className="h-[100dvh] w-full max-w-full overflow-hidden bg-background">{content}</div>
      </div>
    );
  }

  return (
    <Drawer
      hideCloseButton
      isOpen={isOpen}
      backdrop="opaque"
      placement="right"
      scrollBehavior="inside"
      size="xl"
      onOpenChange={(open: boolean) => { if (!open) onClose(); }}
    >
      <DrawerContent className="h-[100dvh] w-full max-w-xl overflow-x-hidden rounded-none bg-content1">
        <DrawerBody className="p-0">{content}</DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}

function PackageCheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 16l3 3 4-4" />
      <path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l2-1.14" />
      <path d="M16.5 9.4L7.55 4.24" />
      <path d="M3.29 7L12 12M12 12l8.71-5" />
      <path d="M12 22V12" />
    </svg>
  );
}
