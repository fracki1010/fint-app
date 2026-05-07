import { useState, useEffect } from "react";
import { Tooltip } from "@heroui/tooltip";
import { VoucherType } from "../types/voucher";
import {
  getVoucherTypeLabel,
  getVoucherTypeIcon,
  getVoucherTypeDescription,
  canGenerateReceipt,
} from "../utils/voucherUtils";

interface VoucherSelectorProps {
  selectedTypes: VoucherType[];
  onChange: (types: VoucherType[]) => void;
  paymentStatus?: string;
  disabled?: boolean;
  className?: string;
}

const VOUCHER_TYPES: VoucherType[] = ["invoice", "delivery_note", "receipt"];

export function VoucherSelector({
  selectedTypes,
  onChange,
  paymentStatus = "Pendiente",
  disabled = false,
  className = "",
}: VoucherSelectorProps) {
  const [localSelection, setLocalSelection] =
    useState<VoucherType[]>(selectedTypes);

  // Sync local state with props
  useEffect(() => {
    setLocalSelection(selectedTypes);
  }, [selectedTypes]);

  const handleToggle = (type: VoucherType) => {
    if (disabled) return;

    const newSelection = localSelection.includes(type)
      ? localSelection.filter((t) => t !== type)
      : [...localSelection, type];

    setLocalSelection(newSelection);
    onChange(newSelection);
  };

  const isReceiptDisabled = !canGenerateReceipt(paymentStatus);

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-default-400">
          Generar comprobantes
        </p>
        <span className="text-[10px] text-default-400">
          {localSelection.length} seleccionado(s)
        </span>
      </div>

      <div className="space-y-2">
        {VOUCHER_TYPES.map((type) => {
          const Icon = getVoucherTypeIcon(type);
          const label = getVoucherTypeLabel(type);
          const description = getVoucherTypeDescription(type);
          const isSelected = localSelection.includes(type);
          const isTypeDisabled =
            disabled || (type === "receipt" && isReceiptDisabled);

          const checkboxContent = (
            <div
              className={`flex items-start gap-3 rounded-2xl border p-3 transition ${
                isTypeDisabled
                  ? "cursor-not-allowed border-divider/30 bg-content2/30 opacity-60"
                  : isSelected
                    ? "cursor-pointer border-primary/40 bg-primary/5"
                    : "cursor-pointer border-divider/60 bg-content2/20 hover:border-primary/20 hover:bg-content2/40"
              }`}
              onClick={() => !isTypeDisabled && handleToggle(type)}
            >
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                  isSelected ? "bg-primary/15 text-primary" : "bg-content2/70 text-default-400"
                }`}
              >
                <Icon size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm font-semibold ${
                      isSelected ? "text-foreground" : "text-foreground/80"
                    }`}
                  >
                    {label}
                  </span>
                  {isSelected && (
                    <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary">
                      Seleccionado
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-default-500">{description}</p>
                {type === "receipt" && isReceiptDisabled && (
                  <p className="mt-1 text-[10px] text-warning">
                    Solo disponible para órdenes pagadas
                  </p>
                )}
              </div>
            </div>
          );

          if (type === "receipt" && isReceiptDisabled) {
            return (
              <Tooltip
                key={type}
                content="El recibo solo puede generarse para órdenes pagadas"
                placement="top"
              >
                {checkboxContent}
              </Tooltip>
            );
          }

          return <div key={type}>{checkboxContent}</div>;
        })}
      </div>

      {localSelection.length === 0 && (
        <p className="text-xs text-default-400 italic">
          No se generarán comprobantes para esta venta
        </p>
      )}
    </div>
  );
}
