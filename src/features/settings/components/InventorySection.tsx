import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import type { Setting } from "@features/settings/hooks/useSettings";

interface InventorySectionProps {
  formData: Partial<Setting>;
  handleInputChange: (field: keyof Setting, value: unknown) => void;
}

const UNIT_OPTIONS = [
  { key: "unidad", label: "Unidad" },
  { key: "caja", label: "Caja" },
  { key: "paquete", label: "Paquete" },
  { key: "bolsa", label: "Bolsa" },
  { key: "botella", label: "Botella" },
  { key: "kg", label: "Kilogramo" },
  { key: "g", label: "Gramo" },
  { key: "litro", label: "Litro" },
  { key: "ml", label: "Mililitro" },
  { key: "metro", label: "Metro" },
];

export default function InventorySection({
  formData,
  handleInputChange,
}: InventorySectionProps) {
  return (
    <div className="space-y-4">
      <Input
        label="Umbral de Stock Bajo"
        min="0"
        type="number"
        value={formData.lowStockThreshold?.toString() || "5"}
        variant="bordered"
        onChange={(e) =>
          handleInputChange(
            "lowStockThreshold",
            parseInt(e.target.value) || 5,
          )
        }
      />

      <Select
        label="Unidad por defecto"
        selectedKeys={[formData.defaultUnitOfMeasure || "unidad"]}
        variant="bordered"
        onSelectionChange={(keys) =>
          handleInputChange(
            "defaultUnitOfMeasure",
            Array.from(keys)[0] as string,
          )
        }
      >
        {UNIT_OPTIONS.map((option) => (
          <SelectItem key={option.key}>{option.label}</SelectItem>
        ))}
      </Select>

      <Select
        label="Momento de descuento de stock"
        selectedKeys={[formData.stockDeductionMoment || "delivery"]}
        variant="bordered"
        onSelectionChange={(keys) =>
          handleInputChange(
            "stockDeductionMoment",
            Array.from(keys)[0] as Setting["stockDeductionMoment"],
          )
        }
      >
        <SelectItem key="delivery">Al entregar</SelectItem>
        <SelectItem key="confirmation">Al confirmar</SelectItem>
      </Select>
    </div>
  );
}
