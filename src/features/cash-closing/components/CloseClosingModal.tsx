import { useState, useEffect } from 'react';
import { Loader2, X, Lock, AlertCircle } from 'lucide-react';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@heroui/modal';
import { CashClosing } from '../types/cashClosing';
import { formatCurrency } from '@shared/utils/currency';

interface CloseClosingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCloseSubmit: (amounts: {
    cash: number;
    card: number;
    transfer: number;
    check: number;
    other: number;
  }, notes?: string) => void;
  isClosing: boolean;
  closing: CashClosing | null;
  expectedAmounts: {
    cash: number;
    card: number;
    transfer: number;
    check: number;
    other: number;
    total: number;
  } | null;
}

const initialAmounts = {
  cash: '',
  card: '',
  transfer: '',
  check: '',
  other: '',
};

export function CloseClosingModal({
  isOpen,
  onClose,
  onCloseSubmit,
  isClosing,
  closing,
  expectedAmounts,
}: CloseClosingModalProps) {
  const [amounts, setAmounts] = useState(initialAmounts);
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      setAmounts(initialAmounts);
      setNotes('');
      setErrors({});
    }
  }, [isOpen]);

  const handleAmountChange = (field: keyof typeof amounts, value: string) => {
    // Only allow numbers and decimals
    if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
      setAmounts((prev) => ({ ...prev, [field]: value }));
      // Clear error for this field
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: '' }));
      }
    }
  };

  const calculateDiscrepancy = (field: keyof typeof amounts, expected: number) => {
    const actual = parseFloat(amounts[field] || '0');
    return actual - expected;
  };

  const calculateTotal = () => {
    return Object.values(amounts).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
  };

  const calculateTotalDiscrepancy = () => {
    if (!expectedAmounts) return 0;
    return calculateTotal() - expectedAmounts.total;
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Check if all amounts are valid numbers
    Object.entries(amounts).forEach(([key, value]) => {
      if (value !== '' && isNaN(parseFloat(value))) {
        newErrors[key] = 'Monto inválido';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    onCloseSubmit({
      cash: parseFloat(amounts.cash || '0'),
      card: parseFloat(amounts.card || '0'),
      transfer: parseFloat(amounts.transfer || '0'),
      check: parseFloat(amounts.check || '0'),
      other: parseFloat(amounts.other || '0'),
    }, notes.trim() || undefined);
  };

  const handleClose = () => {
    setAmounts(initialAmounts);
    setNotes('');
    setErrors({});
    onClose();
  };

  const paymentMethods = [
    { key: 'cash', label: 'Efectivo', color: 'text-green-600' },
    { key: 'card', label: 'Tarjeta', color: 'text-blue-600' },
    { key: 'transfer', label: 'Transferencia', color: 'text-purple-600' },
    { key: 'check', label: 'Cheque', color: 'text-orange-600' },
    { key: 'other', label: 'Otro', color: 'text-gray-600' },
  ] as const;

  const totalDiscrepancy = calculateTotalDiscrepancy();
  const hasDiscrepancy = Math.abs(totalDiscrepancy) > 0.01;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <ModalContent>
        <ModalHeader className="flex items-center gap-2">
          <Lock className="w-5 h-5 text-red-500" />
          Cerrar Cierre de Caja
          {closing && (
            <span className="text-sm font-normal text-gray-500 ml-2">
              #{closing.closingNumber}
            </span>
          )}
        </ModalHeader>
        <ModalBody>
          <div className="space-y-6">
            {/* Info */}
            <p className="text-sm text-gray-600">
              Ingresá los montos reales contados en caja. El sistema calculará las diferencias con lo esperado.
            </p>

            {/* Payment Methods Table */}
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-gray-700">Método</th>
                    <th className="px-4 py-2 text-right font-medium text-gray-700">Esperado</th>
                    <th className="px-4 py-2 text-right font-medium text-gray-700">Real</th>
                    <th className="px-4 py-2 text-right font-medium text-gray-700">Diferencia</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {paymentMethods.map(({ key, label, color }) => {
                    const expected = expectedAmounts?.[key] || 0;
                    const discrepancy = calculateDiscrepancy(key, expected);
                    const hasDiff = Math.abs(discrepancy) > 0.01;

                    return (
                      <tr key={key}>
                        <td className={`px-4 py-3 font-medium ${color}`}>{label}</td>
                        <td className="px-4 py-3 text-right text-gray-600">
                          {formatCurrency(expected)}
                        </td>
                        <td className="px-4 py-3">
                          <Input
                            type="text"
                            inputMode="decimal"
                            placeholder="0.00"
                            value={amounts[key]}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleAmountChange(key, e.target.value)}
                            disabled={isClosing}
                            className="w-32 text-right"
                            isInvalid={!!errors[key]}
                            errorMessage={errors[key]}
                          />
                        </td>
                        <td className={`px-4 py-3 text-right font-medium ${
                          hasDiff 
                            ? discrepancy > 0 
                              ? 'text-green-600' 
                              : 'text-red-600'
                            : 'text-gray-400'
                        }`}>
                          {hasDiff ? `${discrepancy > 0 ? '+' : ''}${formatCurrency(discrepancy)}` : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-gray-50 font-medium">
                  <tr>
                    <td className="px-4 py-3">TOTAL</td>
                    <td className="px-4 py-3 text-right">
                      {formatCurrency(expectedAmounts?.total || 0)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {formatCurrency(calculateTotal())}
                    </td>
                    <td className={`px-4 py-3 text-right ${
                      hasDiscrepancy 
                        ? totalDiscrepancy > 0 
                          ? 'text-green-600' 
                          : 'text-red-600'
                        : 'text-gray-600'
                    }`}>
                      {hasDiscrepancy ? `${totalDiscrepancy > 0 ? '+' : ''}${formatCurrency(totalDiscrepancy)}` : '-'}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Discrepancy Alert */}
            {hasDiscrepancy && (
              <div className={`p-3 rounded-lg flex items-start gap-2 ${
                totalDiscrepancy > 0 
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">
                    {totalDiscrepancy > 0 
                      ? 'Hay un sobrante en caja'
                      : 'Hay un faltante en caja'
                    }
                  </p>
                  <p className="text-sm mt-1">
                    Diferencia: {formatCurrency(Math.abs(totalDiscrepancy))}
                  </p>
                </div>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notas del cierre (opcional)
              </label>
              <Input
                placeholder="Ej: Faltante por error de cambio, etc."
                value={notes}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNotes(e.target.value)}
                disabled={isClosing}
              />
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="flat" onClick={handleClose} disabled={isClosing}>
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
          <Button 
            color={hasDiscrepancy ? 'danger' : 'primary'}
            onClick={handleSubmit} 
            disabled={isClosing}
          >
            {isClosing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Cerrando...
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 mr-2" />
                Confirmar Cierre
              </>
            )}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
