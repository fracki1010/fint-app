import { useState } from "react";
import { Boxes, Loader2 } from "lucide-react";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";

import { useStockMovements } from "@features/products/hooks/useStockMovements";
import { Product } from "@shared/types";

interface QuickStockAdjustProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
}

type Mode = "receive" | "count";

const RECEIVE_REASONS = [
  { key: "compra", label: "Compra" },
  { key: "reposicion", label: "Reposición" },
  { key: "devolucion", label: "Devolución" },
  { key: "ajuste", label: "Ajuste" },
];

const COUNT_INCREASE_REASONS = [
  { key: "ajuste", label: "Ajuste" },
  { key: "compra", label: "Compra sin cargar" },
  { key: "devolucion", label: "Devolución" },
];

const COUNT_DECREASE_REASONS = [
  { key: "merma", label: "Merma o rotura" },
  { key: "recuento", label: "Recuento" },
];

export default function QuickStockAdjust({ product, isOpen, onClose }: QuickStockAdjustProps) {
  const currentStock = product.stock ?? 0;
  const unit = product.unitOfMeasure || "unidades";

  const [mode, setMode] = useState<Mode>("receive");
  const [received, setReceived] = useState<string>("");
  const [receiveReason, setReceiveReason] = useState<string>("compra");
  const [counted, setCounted] = useState<string>(String(currentStock));
  const [countReason, setCountReason] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const { createMovement, isCreating } = useStockMovements();

  if (!isOpen) return null;

  // Receive mode: the user says how much arrived.
  const receivedNumber = Number(received);
  const isValidReceived = received.trim() !== "" && Number.isFinite(receivedNumber) && receivedNumber > 0;
  const receiveSelected = RECEIVE_REASONS.find((r) => r.key === receiveReason) ?? RECEIVE_REASONS[0];

  // Count mode: the user says how much is on the shelf; the difference decides the movement.
  const countedNumber = Number(counted);
  const isValidCount = counted.trim() !== "" && Number.isFinite(countedNumber) && countedNumber >= 0;
  const delta = isValidCount ? countedNumber - currentStock : 0;
  const countReasons = delta < 0 ? COUNT_DECREASE_REASONS : COUNT_INCREASE_REASONS;
  const countSelected = countReasons.find((r) => r.key === countReason) ?? countReasons[0];

  const canSubmit = mode === "receive" ? isValidReceived : isValidCount && delta !== 0;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setError(null);
    try {
      if (mode === "receive") {
        await createMovement({
          product: product._id,
          type: receiveSelected.key === "ajuste" ? "AJUSTE" : "ENTRADA",
          quantity: receivedNumber,
          reason: receiveSelected.label,
          source: "Dashboard",
        });
      } else {
        const isLoss = delta < 0;
        await createMovement({
          product: product._id,
          type: isLoss
            ? countSelected.key === "merma" ? "MERMA" : "SALIDA"
            : countSelected.key === "ajuste" ? "AJUSTE" : "ENTRADA",
          quantity: Math.abs(delta),
          reason: countSelected.label,
          source: "Dashboard",
          expectedStock: currentStock,
        });
      }
      onClose();
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      setError(
        status === 409
          ? "El stock cambió mientras contabas. Cerrá y volvé a abrirlo para ver el número actual."
          : "No se pudo guardar. Probá de nuevo.",
      );
    }
  };

  const segment = (value: Mode, label: string) => (
    <button
      type="button"
      className={`flex-1 rounded-xl px-3 py-2 text-xs font-bold transition ${
        mode === value ? "bg-primary text-primary-foreground" : "bg-content2/60 text-default-500"
      }`}
      onClick={() => {
        setMode(value);
        setError(null);
      }}
    >
      {label}
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />

      {/* Modal */}
      <Card className="relative z-10 mx-4 mb-4 w-full max-w-sm rounded-[28px] animate-sheet-up sm:mb-0">
        <CardBody className="p-6">
          {/* Header */}
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary">
              <Boxes size={18} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{product.name}</p>
              <p className="text-xs text-default-500">
                Hoy hay <span className="font-semibold text-foreground">{currentStock} {unit}</span>
              </p>
            </div>
          </div>

          {/* Mode */}
          <div className="mb-4 flex gap-2">
            {segment("receive", "Llegó mercadería")}
            {segment("count", "Hice un recuento")}
          </div>

          {mode === "receive" ? (
            <div className="space-y-4">
              <Input
                label="¿Cuánto llegó?"
                type="number"
                min={1}
                value={received}
                variant="bordered"
                endContent={<span className="text-xs text-default-500">{unit}</span>}
                onChange={(e) => setReceived(e.target.value)}
              />
              <Select
                label="¿De dónde viene?"
                selectedKeys={[receiveSelected.key]}
                variant="bordered"
                onSelectionChange={(keys) => {
                  const selected = keys instanceof Set ? [...keys][0] : keys;
                  if (selected) setReceiveReason(String(selected));
                }}
              >
                {RECEIVE_REASONS.map((r) => (
                  <SelectItem key={r.key}>{r.label}</SelectItem>
                ))}
              </Select>
              <div className="rounded-2xl bg-content2/50 px-4 py-3 text-sm">
                {isValidReceived ? (
                  <div className="flex items-center justify-between">
                    <span className="text-default-500">Quedará en</span>
                    <span className="font-bold text-success">
                      {currentStock + receivedNumber} {unit}
                    </span>
                  </div>
                ) : (
                  <p className="text-default-500">Ingresá cuánto llegó.</p>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Input
                label="¿Cuánto hay ahora?"
                type="number"
                min={0}
                value={counted}
                variant="bordered"
                endContent={<span className="text-xs text-default-500">{unit}</span>}
                onChange={(e) => setCounted(e.target.value)}
              />
              <div className="rounded-2xl bg-content2/50 px-4 py-3">
                {!isValidCount ? (
                  <p className="text-sm text-default-500">Ingresá una cantidad.</p>
                ) : delta === 0 ? (
                  <p className="text-sm text-default-500">Sin cambios: el stock ya coincide.</p>
                ) : (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-default-500">
                      {delta > 0 ? `Entran ${delta} ${unit}` : `Salen ${Math.abs(delta)} ${unit}`}
                    </span>
                    <span className={`font-bold ${delta > 0 ? "text-success" : "text-danger"}`}>
                      {delta > 0 ? `+${delta}` : delta}
                    </span>
                  </div>
                )}
              </div>
              {isValidCount && delta !== 0 && (
                <Select
                  label="¿Por qué cambia?"
                  selectedKeys={[countSelected.key]}
                  variant="bordered"
                  onSelectionChange={(keys) => {
                    const selected = keys instanceof Set ? [...keys][0] : keys;
                    if (selected) setCountReason(String(selected));
                  }}
                >
                  {countReasons.map((r) => (
                    <SelectItem key={r.key}>{r.label}</SelectItem>
                  ))}
                </Select>
              )}
            </div>
          )}

          {error && <p className="mt-4 text-xs font-semibold text-danger">{error}</p>}

          {/* Actions */}
          <div className="mt-5 flex gap-3">
            <Button className="flex-1 h-11 rounded-2xl font-semibold" variant="bordered" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              className="flex-1 h-11 rounded-2xl font-semibold"
              color="primary"
              isDisabled={!canSubmit || isCreating}
              startContent={isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              onClick={handleSubmit}
            >
              {mode === "receive" ? "Guardar entrada" : "Guardar stock"}
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
