import { useState, useEffect } from "react";
import { Input } from "@heroui/input";
import { Switch } from "@heroui/switch";
import { FileText, Truck, Receipt, RotateCcw, AlertCircle } from "lucide-react";
import type { Setting } from "@features/settings/hooks/useSettings";

interface VoucherConfigSectionProps {
  formData: Partial<Setting>;
  handleInputChange: (field: keyof Setting, value: unknown) => void;
}

interface VoucherTypeConfig {
  key: string;
  type: "invoice" | "delivery_note" | "receipt";
  icon: React.ElementType;
  label: string;
  defaultPrefix: string;
  description: string;
}

const VOUCHER_TYPES: VoucherTypeConfig[] = [
  {
    key: "invoice",
    type: "invoice",
    icon: FileText,
    label: "Factura",
    defaultPrefix: "F-",
    description: "Documento fiscal con datos completos",
  },
  {
    key: "deliveryNote",
    type: "delivery_note",
    icon: Truck,
    label: "Remito",
    defaultPrefix: "R-",
    description: "Comprobante de entrega",
  },
  {
    key: "receipt",
    type: "receipt",
    icon: Receipt,
    label: "Recibo",
    defaultPrefix: "D-",
    description: "Comprobante de pago",
  },
];

export default function VoucherConfigSection({
  formData,
  handleInputChange,
}: VoucherConfigSectionProps) {
  const [previewNumbers, setPreviewNumbers] = useState<Record<string, string>>({
    invoice: "F-000001",
    delivery_note: "R-000001",
    receipt: "D-000001",
  });

  // Calculate preview numbers when prefixes or starting numbers change
  useEffect(() => {
    const newPreviews: Record<string, string> = {};

    VOUCHER_TYPES.forEach(({ key, defaultPrefix }) => {
      const prefixKey = `${key}Prefix` as keyof Setting;
      const nextNumberKey = `next${key.charAt(0).toUpperCase() + key.slice(1)}Number` as keyof Setting;

      const prefix = (formData[prefixKey] as string) || defaultPrefix;
      const nextNumber = (formData[nextNumberKey] as number) || 1;

      newPreviews[key] = `${prefix}${String(nextNumber).padStart(6, "0")}`;
    });

    setPreviewNumbers(newPreviews);
  }, [
    formData.invoicePrefix,
    formData.deliveryNotePrefix,
    formData.receiptPrefix,
    formData.nextInvoiceNumber,
    formData.nextDeliveryNoteNumber,
    formData.nextReceiptNumber,
  ]);

  const handlePrefixChange = (key: string, value: string) => {
    // Sanitize prefix: only allow letters, numbers, and hyphens
    const sanitized = value.replace(/[^a-zA-Z0-9-]/g, "").toUpperCase();
    handleInputChange(`${key}Prefix` as keyof Setting, sanitized);
  };

  const handleNumberChange = (key: string, value: string) => {
    const num = parseInt(value, 10);
    handleInputChange(
      `next${key.charAt(0).toUpperCase() + key.slice(1)}Number` as keyof Setting,
      isNaN(num) || num < 1 ? 1 : num
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-foreground">
          Configuración de Comprobantes
        </h3>
        <p className="mt-1 text-sm text-default-500">
          Personaliza los prefijos, números y comportamiento automático de los comprobantes.
        </p>
      </div>

      {/* Prefix Configuration */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-default-600 flex items-center gap-2">
          Prefijos y Numeración
        </h4>

        <div className="grid gap-4">
          {VOUCHER_TYPES.map(({ key, icon: Icon, label, defaultPrefix, description }) => {
            const prefixKey = `${key}Prefix` as keyof Setting;
            const nextNumberKey = `next${key.charAt(0).toUpperCase() + key.slice(1)}Number` as keyof Setting;
            const autoGenerateKey = `autoGenerate${key.charAt(0).toUpperCase() + key.slice(1)}` as keyof Setting;

            return (
              <div
                key={key}
                className="rounded-2xl border border-divider/40 bg-content2/20 p-4"
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon size={20} />
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1 space-y-4">
                    <div>
                      <p className="font-semibold text-foreground">{label}</p>
                      <p className="text-xs text-default-500">{description}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        label="Prefijo"
                        value={(formData[prefixKey] as string) || defaultPrefix}
                        onChange={(e) => handlePrefixChange(key, e.target.value)}
                        variant="bordered"
                        size="sm"
                        maxLength={10}
                        description="Ej: F-, FAC-, etc."
                      />
                      <Input
                        label="Próximo número"
                        type="number"
                        min={1}
                        value={String((formData[nextNumberKey] as number) || 1)}
                        onChange={(e) => handleNumberChange(key, e.target.value)}
                        variant="bordered"
                        size="sm"
                        description="Desde 1"
                      />
                    </div>

                    {/* Preview */}
                    <div className="flex items-center gap-2 rounded-xl bg-content1/50 px-3 py-2">
                      <span className="text-xs text-default-500">Vista previa:</span>
                      <span className="text-sm font-mono font-semibold text-primary">
                        {previewNumbers[key]}
                      </span>
                    </div>

                    {/* Auto-generate toggle */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-default-600">
                        Auto-generar {label.toLowerCase()}
                      </span>
                      <Switch
                        isSelected={Boolean(formData[autoGenerateKey])}
                        onValueChange={(checked) =>
                          handleInputChange(autoGenerateKey, checked)
                        }
                        size="sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Annual Reset Toggle */}
      <div className="rounded-2xl border border-divider/40 bg-content2/20 p-4">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-warning/10 text-warning">
            <RotateCcw size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-foreground">Reinicio anual</p>
                <p className="text-xs text-default-500">
                  Reiniciar numeración al cambiar de año
                </p>
              </div>
              <Switch
                isSelected={formData.annualResetEnabled !== false}
                onValueChange={(checked) =>
                  handleInputChange("annualResetEnabled", checked)
                }
                size="sm"
              />
            </div>
            <div className="mt-3 flex items-start gap-2 rounded-xl bg-warning/10 px-3 py-2">
              <AlertCircle size={14} className="mt-0.5 shrink-0 text-warning" />
              <p className="text-xs text-default-600">
                Al activar esta opción, los contadores se reiniciarán automáticamente
                a 1 cada vez que comience un nuevo año fiscal.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Info Note */}
      <div className="rounded-2xl border border-divider/30 bg-content2/10 p-4">
        <p className="text-xs text-default-500">
          <strong className="text-default-600">Nota:</strong> Los cambios en los prefijos
          solo afectarán a los nuevos comprobantes. Los comprobantes existentes conservarán
          sus números originales por razones de auditoría.
        </p>
      </div>
    </div>
  );
}
