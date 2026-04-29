import { ReactNode } from "react";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@heroui/modal";
import { Button } from "@heroui/button";

type ConfirmActionDialogProps = {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmColor?: "primary" | "danger" | "warning";
  isLoading?: boolean;
  icon?: ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmActionDialog({
  isOpen,
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  confirmColor = "primary",
  isLoading = false,
  icon,
  onConfirm,
  onCancel,
}: ConfirmActionDialogProps) {
  return (
    <Modal isOpen={isOpen} placement="center" onOpenChange={(open) => !open && onCancel()}>
      <ModalContent>
        <ModalHeader className="flex items-center gap-2">
          {icon}
          <span>{title}</span>
        </ModalHeader>
        <ModalBody>
          <p className="text-sm text-default-600">{message}</p>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button color={confirmColor} isLoading={isLoading} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
