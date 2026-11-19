import type { Setting } from "@features/settings/hooks/useSettings";

import { useState } from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { resizeLogoToDataUrl } from "@features/settings/utils/resizeLogo";

interface GeneralSectionProps {
  formData: Partial<Setting>;
  handleInputChange: (field: keyof Setting, value: unknown) => void;
}

export default function GeneralSection({
  formData,
  handleInputChange,
}: GeneralSectionProps) {
  const [logoError, setLogoError] = useState<string | null>(null);
  const [processingLogo, setProcessingLogo] = useState(false);

  const handleLogoChange = async (file: File | undefined) => {
    if (!file) return;
    setLogoError(null);
    setProcessingLogo(true);
    try {
      handleInputChange("logoDataUrl", await resizeLogoToDataUrl(file));
    } catch (error) {
      setLogoError(
        error instanceof Error ? error.message : "No se pudo cargar el logo.",
      );
    } finally {
      setProcessingLogo(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex h-20 w-28 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-default-200 bg-default-50">
          {formData.logoDataUrl ? (
            <img
              alt="Logo de la empresa"
              className="max-h-full max-w-full object-contain"
              src={formData.logoDataUrl}
            />
          ) : (
            <span className="text-xs text-default-400">Sin logo</span>
          )}
        </div>
        <div className="flex flex-col items-start gap-2">
          <label className="cursor-pointer">
            <span className="sr-only">Subir logo de la empresa</span>
            <input
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              disabled={processingLogo}
              type="file"
              onChange={(e) => {
                handleLogoChange(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            <span className="inline-flex h-8 items-center rounded-lg bg-default-100 px-3 text-small font-medium hover:bg-default-200">
              {processingLogo
                ? "Procesando..."
                : formData.logoDataUrl
                  ? "Cambiar logo"
                  : "Subir logo"}
            </span>
          </label>
          {formData.logoDataUrl && (
            <Button
              color="danger"
              size="sm"
              variant="light"
              onPress={() => handleInputChange("logoDataUrl", "")}
            >
              Quitar logo
            </Button>
          )}
          {logoError ? (
            <p className="text-tiny text-danger">{logoError}</p>
          ) : (
            <p className="text-tiny text-default-400">
              Aparece en las facturas y comprobantes. PNG o JPG.
            </p>
          )}
        </div>
      </div>
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
      <Input
        description="Email que aparecerá como remitente en las notificaciones (ej: soporte@mi-dominio.com)"
        label="Email de soporte"
        type="email"
        value={formData.supportEmail || ""}
        variant="bordered"
        onChange={(e) => handleInputChange("supportEmail", e.target.value)}
      />
    </div>
  );
}
