import { useState } from 'react';
import { Loader2, Plus, X } from 'lucide-react';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@heroui/modal';

interface OpenClosingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen: (notes?: string) => void;
  isOpening: boolean;
}

export function OpenClosingModal({ isOpen, onClose, onOpen, isOpening }: OpenClosingModalProps) {
  const [notes, setNotes] = useState('');

  const handleSubmit = () => {
    onOpen(notes.trim() || undefined);
    setNotes('');
  };

  const handleClose = () => {
    setNotes('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md">
      <ModalContent>
        <ModalHeader className="flex items-center gap-2">
          <Plus className="w-5 h-5 text-blue-500" />
          Abrir Cierre de Caja
        </ModalHeader>
        <ModalBody>
          <p className="text-sm text-gray-600 mb-4">
            Abre un nuevo período de caja. Se contarán todas las ventas desde este momento hasta que cierres.
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notas (opcional)
              </label>
              <Input
                placeholder="Ej: Turno mañana, feriado, etc."
                value={notes}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNotes(e.target.value)}
                disabled={isOpening}
              />
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="flat" onClick={handleClose} disabled={isOpening}>
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
          <Button color="primary" onClick={handleSubmit} disabled={isOpening}>
            {isOpening ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Abriendo...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Abrir Caja
              </>
            )}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
