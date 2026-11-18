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

// The user states how much is on the shelf; the difference decides the movement.
const INCREASE_REASONS = [
  { key: "compra", label: "Compra" },
  { key: "reposicion", label: "Reposición" },
  { key: "devolucion", label: "Devolución" },
  { key: "ajuste", label: "Ajuste" },
];

const DECREASE_REASONS = [
  { key: "merma", label: "Merma o rotura" },
  { key: "recuento", label: "Recuento" },
];

export default function QuickStockAdjust({ product, isOpen, onClose }: QuickStockAdjustProps) {
  const currentStock = product.stock ?? 0;
  const [counted, setCounted] = useState<string>(String(currentStock));
  const [reasonKey, setReasonKey] = useState<string>("");
  const { createMovement, isCreating } = useStockMovements();

  if (!isOpen) return null;

  const countedNumber = Number(counted);
  const isValidCount = counted.trim() !== "" && Number.isFinite(countedNumber) && countedNumber >= 0;
  const delta = isValidCount ? countedNumber - currentStock : 0;
  const reasons = delta < 0 ? DECREASE_REASONS : INCREASE_REASONS;
  const selectedReason = reasons.find((r) => r.key === reasonKey) ?? reasons[0];
  const unit = product.unitOfMeasure || "unidades";

  const handleSubmit = async () => {
    if (!isValidCount || delta === 0) return;
    const isLoss = delta < 0;
    try {
      await createMovement({
        product: product._id,
        type: isLoss
          ? selectedReason.key === "merma" ? "MERMA" : "SALIDA"
          : selectedReason.key === "ajuste" ? "AJUSTE" : "ENTRADA",
        quantity: Math.abs(delta),
        reason: selectedReason.label,
        source: "Dashboard",
      });
      onClose();
    } catch {
      // error handled by mutation
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Modal */}
      <Card className="relative z-10 mx-4 mb-4 w-full max-w-sm rounded-[28px] animate-sheet-up sm:mb-0">
        <CardBody className="p-6">
          {/* Header */}
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary">
              <Boxes size={18} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">
                {product.name}
              </p>
              <p className="text-xs text-default-500">
                Hoy hay <span className="font-semibold text-foreground">{currentStock} {unit}</span>
              </p>
            </div>
          </div>

          {/* Count */}
          <Input
            label="¿Cuánto hay ahora?"
            type="number"
            min={0}
            value={counted}
            variant="bordered"
            endContent={<span className="text-xs text-default-500">{unit}</span>}
            onChange={(e) => setCounted(e.target.value)}
          />

          {/* Result of the count */}
          <div className="mt-4 rounded-2xl bg-content2/50 px-4 py-3">
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

          {/* Reason, only when something changes */}
          {isValidCount && delta !== 0 && (
            <div className="mt-4">
              <Select
                label="¿Por qué cambia?"
                selectedKeys={[selectedReason.key]}
                variant="bordered"
                onSelectionChange={(keys) => {
                  const selected = keys instanceof Set ? [...keys][0] : keys;
                  if (selected) setReasonKey(String(selected));
                }}
              >
                {reasons.map((r) => (
                  <SelectItem key={r.key}>{r.label}</SelectItem>
                ))}
              </Select>
            </div>
          )}

          {/* Actions */}
          <div className="mt-5 flex gap-3">
            <Button
              className="flex-1 h-11 rounded-2xl font-semibold"
              variant="bordered"
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1 h-11 rounded-2xl font-semibold"
              color="primary"
              isDisabled={!isValidCount || delta === 0 || isCreating}
              startContent={
                isCreating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null
              }
              onClick={handleSubmit}
            >
              Guardar stock
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
