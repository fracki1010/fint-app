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

const REASONS = [
  { key: "reposicion", label: "Reposición" },
  { key: "compra", label: "Compra" },
  { key: "ajuste", label: "Ajuste" },
  { key: "devolucion", label: "Devolución" },
];

export default function QuickStockAdjust({ product, isOpen, onClose }: QuickStockAdjustProps) {
  const [quantity, setQuantity] = useState<number>(0);
  const [reason, setReason] = useState<string>("reposicion");
  const { createMovement, isCreating } = useStockMovements();

  if (!isOpen) return null;

  const currentStock = product.stock ?? 0;
  const newStock = currentStock + quantity;

  const handleSubmit = async () => {
    if (quantity <= 0) return;
    try {
      await createMovement({
        product: product._id,
        type: "ENTRADA",
        quantity,
        reason,
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
      <Card className="relative z-10 mx-4 mb-4 w-full max-w-sm rounded-[28px] sm:mb-0">
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
                Stock actual: <span className="font-semibold text-foreground">{currentStock}</span>
              </p>
            </div>
          </div>

          {/* Quantity */}
          <div className="space-y-3">
            <Input
              label="Cantidad a agregar"
              type="number"
              min={1}
              value={quantity > 0 ? quantity.toString() : ""}
              variant="bordered"
              onChange={(e) => setQuantity(Number(e.target.value) || 0)}
            />

            <Select
              label="Motivo"
              selectedKeys={[reason]}
              variant="bordered"
              onSelectionChange={(key) => {
                const selected = key instanceof Set ? [...key][0] : key;
                if (selected) setReason(String(selected));
              }}
            >
              {REASONS.map((r) => (
                <SelectItem key={r.key}>{r.label}</SelectItem>
              ))}
            </Select>
          </div>

          {/* Preview */}
          {quantity > 0 && (
            <div className="mt-4 rounded-2xl bg-content2/50 px-4 py-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-default-500">Stock nuevo</span>
                <span className="font-bold text-success">{newStock}</span>
              </div>
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
              isDisabled={quantity <= 0 || isCreating}
              startContent={
                isCreating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null
              }
              onClick={handleSubmit}
            >
              Confirmar
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
