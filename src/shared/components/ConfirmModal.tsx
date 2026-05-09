import { Button } from "@heroui/button";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "primary";
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  variant = "danger",
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmModalProps) {
  return (
    <Modal isOpen={open} onClose={onCancel} placement="center">
      <ModalContent>
        <ModalHeader className="text-base font-bold">{title}</ModalHeader>
        <ModalBody>
          <p className="text-sm text-default-500">{message}</p>
        </ModalBody>
        <ModalFooter>
          <Button variant="flat" onPress={onCancel} isDisabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            color={variant === "danger" ? "danger" : variant === "warning" ? "warning" : "primary"}
            onPress={onConfirm}
            isLoading={loading}
          >
            {confirmLabel}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
