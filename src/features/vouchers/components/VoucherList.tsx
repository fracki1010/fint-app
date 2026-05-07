import { useState } from "react";
import {
  FileDown,
  Ban,
  Loader2,
  FileText,
  AlertCircle,
} from "lucide-react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";

import { Voucher } from "../types/voucher";
import {
  getVoucherTypeLabel,
  getVoucherTypeIcon,
  getVoucherStatusLabel,
  getVoucherStatusColor,
  getVoucherStatusBgColor,
  getVoucherStatusBorderColor,
  formatVoucherDate,
  sortVouchersByType,
} from "../utils/voucherUtils";
import { useVoidVoucher, useDownloadVoucher } from "../hooks/useVouchers";
import { useAppToast } from "@features/notifications/components/AppToast";
import { getErrorMessage } from "@shared/utils/errors";

interface VoucherListProps {
  vouchers: Voucher[];
  orderId?: string;
  onVoucherVoided?: () => void;
  className?: string;
}

export function VoucherList({
  vouchers,
  orderId,
  onVoucherVoided,
  className = "",
}: VoucherListProps) {
  const { showToast } = useAppToast();
  const { voidVoucher, isVoiding } = useVoidVoucher();
  const { downloadVoucher } = useDownloadVoucher();

  const [voidModalOpen, setVoidModalOpen] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const [voidReason, setVoidReason] = useState("");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const sortedVouchers = sortVouchersByType(vouchers);

  const handleVoidClick = (voucher: Voucher) => {
    setSelectedVoucher(voucher);
    setVoidReason("");
    setVoidModalOpen(true);
  };

  const handleConfirmVoid = async () => {
    if (!selectedVoucher || !voidReason.trim()) return;

    try {
      await voidVoucher({
        voucherId: selectedVoucher._id,
        reason: voidReason.trim(),
      });
      showToast({
        variant: "success",
        message: `Comprobante ${selectedVoucher.number} anulado correctamente`,
      });
      setVoidModalOpen(false);
      setSelectedVoucher(null);
      setVoidReason("");
      onVoucherVoided?.();
    } catch (error) {
      showToast({
        variant: "error",
        message: getErrorMessage(error, "No se pudo anular el comprobante"),
      });
    }
  };

  const handleDownload = async (voucher: Voucher) => {
    try {
      setDownloadingId(voucher._id);
      await downloadVoucher(voucher._id, `${voucher.number}.pdf`);
      showToast({
        variant: "success",
        message: `Descargando ${voucher.number}`,
      });
    } catch (error) {
      showToast({
        variant: "error",
        message: getErrorMessage(error, "No se pudo descargar el comprobante"),
      });
    } finally {
      setDownloadingId(null);
    }
  };

  if (vouchers.length === 0) {
    return (
      <div className={`rounded-2xl border border-divider/30 bg-content2/20 p-6 text-center ${className}`}>
        <FileText size={32} className="mx-auto mb-3 text-default-300" />
        <p className="text-sm text-default-500">No hay comprobantes generados</p>
        {orderId && (
          <p className="mt-1 text-xs text-default-400">
            Los comprobantes aparecerán aquí una vez generados
          </p>
        )}
      </div>
    );
  }

  return (
    <>
      <div className={`space-y-2 ${className}`}>
        {sortedVouchers.map((voucher) => {
          const Icon = getVoucherTypeIcon(voucher.type);
          const statusLabel = getVoucherStatusLabel(voucher.status);
          const statusColor = getVoucherStatusColor(voucher.status);
          const statusBg = getVoucherStatusBgColor(voucher.status);
          const statusBorder = getVoucherStatusBorderColor(voucher.status);
          const isVoided = voucher.status === "voided";
          const isDownloading = downloadingId === voucher._id;

          return (
            <div
              key={voucher._id}
              className={`flex items-center gap-3 rounded-2xl border p-3 transition ${
                isVoided
                  ? "border-divider/30 bg-content2/20 opacity-70"
                  : "border-divider/60 bg-content2/40"
              }`}
            >
              {/* Icon */}
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  isVoided ? "bg-content2/70 text-default-400" : "bg-primary/10 text-primary"
                }`}
              >
                <Icon size={18} />
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">
                    {getVoucherTypeLabel(voucher.type)}
                  </span>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusBg} ${statusBorder} ${statusColor}`}
                  >
                    {statusLabel}
                  </span>
                </div>
                <p className="text-xs text-default-500">
                  {voucher.number} • {formatVoucherDate(voucher.createdAt)}
                </p>
                {voucher.voidReason && (
                  <p className="mt-1 text-[10px] text-danger">
                    Motivo: {voucher.voidReason}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                <button
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-default-500 transition hover:bg-content2 hover:text-foreground disabled:opacity-50"
                  disabled={isDownloading}
                  onClick={() => handleDownload(voucher)}
                  title="Descargar PDF"
                >
                  {isDownloading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <FileDown size={16} />
                  )}
                </button>

                {!isVoided && (
                  <button
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-default-500 transition hover:bg-danger/10 hover:text-danger disabled:opacity-50"
                    disabled={isVoiding}
                    onClick={() => handleVoidClick(voucher)}
                    title="Anular comprobante"
                  >
                    <Ban size={16} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Void Confirmation Modal */}
      <Modal isOpen={voidModalOpen} onClose={() => setVoidModalOpen(false)}>
        <ModalContent>
          <ModalHeader className="flex items-center gap-2">
            <AlertCircle size={18} className="text-warning" />
            Anular comprobante
          </ModalHeader>
          <ModalBody>
            <p className="text-sm text-default-500">
              Estás por anular el comprobante{" "}
              <strong className="text-foreground">
                {selectedVoucher?.number}
              </strong>
              . Esta acción no se puede deshacer.
            </p>
            <div className="mt-4">
              <label className="mb-1.5 block text-xs font-semibold text-default-600">
                Motivo de anulación <span className="text-danger">*</span>
              </label>
              <Input
                placeholder="Ej: Error en datos del cliente, CUIT incorrecto..."
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
              />
              <p className="mt-1.5 text-[10px] text-default-400">
                El motivo quedará registrado para auditoría
              </p>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="flat"
              onPress={() => setVoidModalOpen(false)}
              isDisabled={isVoiding}
            >
              Cancelar
            </Button>
            <Button
              color="danger"
              onPress={handleConfirmVoid}
              isDisabled={!voidReason.trim() || isVoiding}
              isLoading={isVoiding}
            >
              Anular comprobante
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
