import { useState } from "react";
import {
  FileDown,
  MoreVertical,
  Plus,
  FileText,
  ChevronDown,
} from "lucide-react";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/dropdown";
import { Button } from "@heroui/button";

import { Voucher } from "../types/voucher";
import { useDownloadVoucher } from "../hooks/useVouchers";
import { sortVouchersByType } from "../utils/voucherUtils";
import { useAppToast } from "@features/notifications/components/AppToast";
import { getErrorMessage } from "@shared/utils/errors";

interface VoucherActionsProps {
  vouchers: Voucher[];
  orderId?: string;
  onViewList?: () => void;
  onGenerateMore?: () => void;
  className?: string;
}

export function VoucherActions({
  vouchers,
  orderId: _orderId,
  onViewList,
  onGenerateMore,
  className = "",
}: VoucherActionsProps) {
  const { showToast } = useAppToast();
  const { downloadVoucher } = useDownloadVoucher();
  const [downloadingAll, setDownloadingAll] = useState(false);

  const activeVouchers = vouchers.filter((v) => v.status === "active");
  const sortedVouchers = sortVouchersByType(activeVouchers);
  const hasVouchers = activeVouchers.length > 0;

  const handleDownloadAll = async () => {
    if (activeVouchers.length === 0) return;

    try {
      setDownloadingAll(true);
      // Download vouchers sequentially to avoid overwhelming the browser
      for (const voucher of activeVouchers) {
        await downloadVoucher(voucher._id, `${voucher.number}.pdf`);
        // Small delay between downloads
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
      showToast({
        variant: "success",
        message: `${activeVouchers.length} comprobante(s) descargado(s)`,
      });
    } catch (error) {
      showToast({
        variant: "error",
        message: getErrorMessage(error, "Error al descargar comprobantes"),
      });
    } finally {
      setDownloadingAll(false);
    }
  };

  const handleDownloadSingle = async (voucher: Voucher) => {
    try {
      await downloadVoucher(voucher._id, `${voucher.number}.pdf`);
      showToast({
        variant: "success",
        message: `${voucher.number} descargado`,
      });
    } catch (error) {
      showToast({
        variant: "error",
        message: getErrorMessage(error, "Error al descargar"),
      });
    }
  };

  // If no vouchers, show simple button to generate
  if (!hasVouchers) {
    return (
      <Button
        size="sm"
        variant="flat"
        className={className}
        startContent={<Plus size={16} />}
        onPress={onGenerateMore}
      >
        Generar comprobantes
      </Button>
    );
  }

  // If only one voucher, show direct download button
  if (sortedVouchers.length === 1) {
    const voucher = sortedVouchers[0];
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Button
          size="sm"
          variant="flat"
          startContent={<FileDown size={16} />}
          onPress={() => handleDownloadSingle(voucher)}
        >
          {voucher.number}
        </Button>
        <Dropdown>
          <DropdownTrigger>
            <Button size="sm" variant="flat" isIconOnly>
              <MoreVertical size={16} />
            </Button>
          </DropdownTrigger>
          <DropdownMenu aria-label="Opciones de comprobantes">
            <DropdownItem key="view" onPress={onViewList}>
              Ver detalle
            </DropdownItem>
            <DropdownItem key="generate" onPress={onGenerateMore}>
              Generar más
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </div>
    );
  }

  // Multiple vouchers - show dropdown with count badge
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Dropdown>
        <DropdownTrigger>
          <Button
            size="sm"
            variant="flat"
            startContent={<FileText size={16} />}
            endContent={<ChevronDown size={14} />}
          >
            Comprobantes
            <span className="ml-1.5 rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold text-primary">
              {sortedVouchers.length}
            </span>
          </Button>
        </DropdownTrigger>
        <DropdownMenu aria-label="Descargar comprobantes">
          <>
            <DropdownItem
              key="download-all"
              startContent={<FileDown size={16} />}
              onPress={handleDownloadAll}
              isDisabled={downloadingAll}
            >
              Descargar todos ({sortedVouchers.length})
            </DropdownItem>
            {sortedVouchers.map((voucher) => (
              <DropdownItem
                key={voucher._id}
                onPress={() => handleDownloadSingle(voucher)}
              >
                {voucher.number}
              </DropdownItem>
            ))}
          </>
        </DropdownMenu>
      </Dropdown>

      <Dropdown>
        <DropdownTrigger>
          <Button size="sm" variant="flat" isIconOnly>
            <MoreVertical size={16} />
          </Button>
        </DropdownTrigger>
        <DropdownMenu aria-label="Opciones de comprobantes">
          <DropdownItem key="view" onPress={onViewList}>
            Ver listado completo
          </DropdownItem>
          <DropdownItem key="generate" onPress={onGenerateMore}>
            Generar más comprobantes
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
    </div>
  );
}
