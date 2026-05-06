import type { NavigateFunction } from "react-router-dom";
import { Button } from "@heroui/button";
import { ArrowUpRight } from "lucide-react";

interface AdvancedSectionProps {
  navigate: NavigateFunction;
  onClose: () => void;
}

export default function AdvancedSection({
  navigate,
  onClose,
}: AdvancedSectionProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-default-200/70 bg-content1/60 p-4">
        <p className="text-sm font-semibold text-foreground">
          Historial de movimientos
        </p>
        <p className="mt-1 text-xs text-default-500">
          Consulta el historial operativo de inventario: entradas, salidas,
          mermas y ajustes.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <Button
          className="h-12 justify-between rounded-2xl"
          color="primary"
          endContent={<ArrowUpRight size={16} />}
          onClick={() => {
            onClose();
            navigate("/movements");
          }}
        >
          Ir a Movimientos
        </Button>
      </div>
    </div>
  );
}
