import { Input } from "@heroui/input";
import type { Setting } from "@features/settings/hooks/useSettings";

interface GeneralSectionProps {
  formData: Partial<Setting>;
  handleInputChange: (field: keyof Setting, value: unknown) => void;
}

export default function GeneralSection({
  formData,
  handleInputChange,
}: GeneralSectionProps) {
  return (
    <div className="space-y-4">
      <Input
        label="Nombre de la empresa"
        value={formData.storeName || ""}
        variant="bordered"
        onChange={(e) => handleInputChange("storeName", e.target.value)}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          isRequired
          label="CUIT / NIT / RUC"
          value={formData.taxId || ""}
          variant="bordered"
          onChange={(e) => handleInputChange("taxId", e.target.value)}
        />
        <Input
          isRequired
          label="Condicion fiscal"
          value={formData.fiscalCondition || ""}
          variant="bordered"
          onChange={(e) => handleInputChange("fiscalCondition", e.target.value)}
        />
      </div>
      <Input
        label="Direccion"
        value={formData.address || ""}
        variant="bordered"
        onChange={(e) => handleInputChange("address", e.target.value)}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Telefono"
          value={formData.phone || ""}
          variant="bordered"
          onChange={(e) => handleInputChange("phone", e.target.value)}
        />
        <Input
          label="Email"
          type="email"
          value={formData.email || ""}
          variant="bordered"
          onChange={(e) => handleInputChange("email", e.target.value)}
        />
      </div>
    </div>
  );
}
