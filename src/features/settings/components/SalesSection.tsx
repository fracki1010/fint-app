import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import type { Setting } from "@features/settings/hooks/useSettings";

interface SalesSectionProps {
  formData: Partial<Setting>;
  handleInputChange: (field: keyof Setting, value: unknown) => void;
}

export default function SalesSection({
  formData,
  handleInputChange,
}: SalesSectionProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Prefijo de pedido"
          value={formData.orderPrefix || "VTA"}
          variant="bordered"
          onChange={(e) =>
            handleInputChange("orderPrefix", e.target.value.toUpperCase())
          }
        />
        <Input
          label="Tasa de IVA (%)"
          min="0"
          step="0.01"
          type="number"
          value={formData.taxRate?.toString() || "0"}
          variant="bordered"
          onChange={(e) =>
            handleInputChange("taxRate", parseFloat(e.target.value) || 0)
          }
        />
      </div>

      <Select
        label="Moneda"
        selectedKeys={[formData.currency || "USD"]}
        variant="bordered"
        onSelectionChange={(keys) =>
          handleInputChange("currency", Array.from(keys)[0] as string)
        }
      >
        <SelectItem key="USD">USD</SelectItem>
        <SelectItem key="EUR">EUR</SelectItem>
        <SelectItem key="MXN">MXN</SelectItem>
        <SelectItem key="COP">COP</SelectItem>
        <SelectItem key="ARS">Peso argentino (ARS)</SelectItem>
      </Select>

      <Input
        label="Condiciones de factura"
        placeholder="Ej: Pago a 15 dias, transferencia bancaria..."
        value={formData.invoiceTerms || ""}
        variant="bordered"
        onChange={(e) => handleInputChange("invoiceTerms", e.target.value)}
      />

      <div>
        <p className="text-xs font-semibold text-default-500 mb-2">
          Impresión de ticket
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            className={`rounded-xl py-2.5 text-xs font-bold transition ${
              formData.autoPrintTicket !== false
                ? "bg-primary text-white shadow-md shadow-primary/25"
                : "bg-content2/60 text-default-500"
            }`}
            onClick={() => handleInputChange("autoPrintTicket", true)}
          >
            🖨 Imprimir siempre
          </button>
          <button
            className={`rounded-xl py-2.5 text-xs font-bold transition ${
              formData.autoPrintTicket === false
                ? "bg-primary text-white shadow-md shadow-primary/25"
                : "bg-content2/60 text-default-500"
            }`}
            onClick={() => handleInputChange("autoPrintTicket", false)}
          >
            No imprimir
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Select
          label="Estado venta"
          selectedKeys={[formData.defaultSalesStatus || "Pendiente"]}
          variant="bordered"
          onSelectionChange={(keys) =>
            handleInputChange(
              "defaultSalesStatus",
              Array.from(keys)[0] as Setting["defaultSalesStatus"],
            )
          }
        >
          <SelectItem key="Pendiente">Pendiente</SelectItem>
          <SelectItem key="Confirmada">Confirmada</SelectItem>
          <SelectItem key="Cancelada">Cancelada</SelectItem>
        </Select>

        <Select
          label="Estado pago"
          selectedKeys={[formData.defaultPaymentStatus || "Pendiente"]}
          variant="bordered"
          onSelectionChange={(keys) =>
            handleInputChange(
              "defaultPaymentStatus",
              Array.from(keys)[0] as Setting["defaultPaymentStatus"],
            )
          }
        >
          <SelectItem key="Pendiente">Pendiente</SelectItem>
          <SelectItem key="Parcial">Parcial</SelectItem>
          <SelectItem key="Pagado">Pagado</SelectItem>
        </Select>

        <Select
          label="Estado entrega"
          selectedKeys={[formData.defaultDeliveryStatus || "Pendiente"]}
          variant="bordered"
          onSelectionChange={(keys) =>
            handleInputChange(
              "defaultDeliveryStatus",
              Array.from(keys)[0] as Setting["defaultDeliveryStatus"],
            )
          }
        >
          <SelectItem key="Pendiente">Pendiente</SelectItem>
          <SelectItem key="Preparando">Preparando</SelectItem>
          <SelectItem key="Entregada">Entregada</SelectItem>
        </Select>
      </div>
    </div>
  );
}
