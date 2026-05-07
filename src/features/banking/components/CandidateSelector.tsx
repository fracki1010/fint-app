import { useState, useMemo } from 'react';
import {
  Loader2,
  Search,
  Filter,
  Check,
  UserCheck,
  Truck,
  ShoppingCart,
} from 'lucide-react';
import { Button } from '@heroui/button';
import { Chip } from '@heroui/chip';
import { Input } from '@heroui/input';
import { Select, SelectItem } from '@heroui/select';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from '@heroui/modal';
import { formatCurrency } from '@shared/utils/currency';
import type { MatchCandidate, MatchedEntryType, BankTransaction } from '../types/banking';

interface CandidateSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: BankTransaction | null;
  candidates: MatchCandidate[] | undefined;
  isLoading: boolean;
  onConfirmMatch: (transactionId: string, matchedEntryType: MatchedEntryType, matchedEntryId: string) => void;
  isMatching: boolean;
}

const TYPE_CONFIG: Record<
  MatchedEntryType,
  { label: string; color: 'primary' | 'warning' | 'secondary'; icon: React.ReactNode }
> = {
  ClientAccountEntry: {
    label: 'Pago Cliente',
    color: 'primary',
    icon: <UserCheck className="w-3 h-3" />,
  },
  SupplierAccountEntry: {
    label: 'Pago Proveedor',
    color: 'warning',
    icon: <Truck className="w-3 h-3" />,
  },
  Order: {
    label: 'Orden',
    color: 'secondary',
    icon: <ShoppingCart className="w-3 h-3" />,
  },
};

export default function CandidateSelector({
  isOpen,
  onClose,
  transaction,
  candidates,
  isLoading,
  onConfirmMatch,
  isMatching,
}: CandidateSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);

  // Reset state when modal opens with a new transaction
  const handleClose = () => {
    setSearchTerm('');
    setTypeFilter('');
    setSelectedCandidateId(null);
    onClose();
  };

  // Sort candidates by amount proximity to the selected transaction
  const sortedCandidates = useMemo(() => {
    if (!candidates || !transaction) return [];

    const txAmount = transaction.amount;

    return [...candidates].sort((a, b) => {
      // Exact matches first
      const aExact = a.amount === txAmount ? 0 : 1;
      const bExact = b.amount === txAmount ? 0 : 1;
      if (aExact !== bExact) return aExact - bExact;

      // Then by proximity (within ±10%)
      const aRatio = Math.abs(a.amount - txAmount) / txAmount;
      const bRatio = Math.abs(b.amount - txAmount) / txAmount;
      const aInRange = aRatio <= 0.1 ? 0 : 1;
      const bInRange = bRatio <= 0.1 ? 0 : 1;
      if (aInRange !== bInRange) return aInRange - bInRange;

      // Then by proximity ascending
      return aRatio - bRatio;
    });
  }, [candidates, transaction]);

  // Apply filters
  const filteredCandidates = useMemo(() => {
    let result = sortedCandidates;

    if (typeFilter) {
      result = result.filter((c) => c.type === typeFilter);
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (c) =>
          c.description.toLowerCase().includes(term) ||
          (c.source && c.source.toLowerCase().includes(term)),
      );
    }

    return result;
  }, [sortedCandidates, typeFilter, searchTerm]);

  const handleConfirm = () => {
    if (!transaction || !selectedCandidateId) return;

    const candidate = candidates?.find((c) => c.id === selectedCandidateId);
    if (!candidate) return;

    onConfirmMatch(transaction._id, candidate.type, candidate.id);
    handleClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="3xl" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader className="flex items-center gap-2 border-b">
          <Filter className="w-5 h-5 text-primary" />
          <div>
            <p className="text-lg font-semibold">Seleccionar candidato</p>
            {transaction && (
              <p className="text-sm text-default-500 font-normal mt-0.5">
                Buscando match para: <span className="font-medium text-foreground">{transaction.description}</span>
                {' — '}
                <span className={transaction.type === 'debit' ? 'text-danger' : 'text-success'}>
                  {transaction.type === 'debit' ? '-' : '+'}
                  {formatCurrency(transaction.amount)}
                </span>
              </p>
            )}
          </div>
        </ModalHeader>

        <ModalBody className="py-4">
          {/* Filters */}
          <div className="flex items-center gap-3 mb-4">
            <Input
              placeholder="Buscar candidatos..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              startContent={<Search className="w-4 h-4 text-default-400" />}
              size="sm"
              className="flex-1"
            />
            <Select
              label="Tipo"
              selectedKeys={typeFilter ? [typeFilter] : []}
              onSelectionChange={(keys) => {
                const val = Array.from(keys)[0] as string;
                setTypeFilter(val || '');
              }}
              size="sm"
              className="w-44"
            >
              <SelectItem key="">Todos</SelectItem>
              <SelectItem key="ClientAccountEntry">Pago Cliente</SelectItem>
              <SelectItem key="SupplierAccountEntry">Pago Proveedor</SelectItem>
              <SelectItem key="Order">Orden</SelectItem>
            </Select>
          </div>

          {/* Loading */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-default-400" />
            </div>
          ) : filteredCandidates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Search className="w-12 h-12 text-default-300 mb-3" />
              <p className="text-default-500 font-medium">No se encontraron candidatos</p>
              <p className="text-sm text-default-400 mt-1">
                {searchTerm || typeFilter
                  ? 'Probá cambiando los filtros'
                  : 'No hay registros internos en este período para conciliar'}
              </p>
            </div>
          ) : (
            /* Candidates list */
            <div className="space-y-2">
              {filteredCandidates.map((candidate) => {
                const config = TYPE_CONFIG[candidate.type];
                const isSelected = selectedCandidateId === candidate.id;
                const amountDiff = transaction
                  ? Math.abs(candidate.amount - transaction.amount)
                  : 0;
                const isExactMatch = transaction && candidate.amount === transaction.amount;
                const isCloseMatch = transaction && amountDiff / transaction.amount <= 0.1;

                return (
                  <div
                    key={candidate.id}
                    className={`flex items-center gap-4 p-3 rounded-lg border cursor-pointer transition-colors ${
                      isSelected
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                        : 'border-default-200 hover:border-default-300 hover:bg-default-50'
                    }`}
                    onClick={() => setSelectedCandidateId(candidate.id)}
                  >
                    {/* Radio indicator */}
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        isSelected ? 'border-primary bg-primary' : 'border-default-300'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>

                    {/* Type badge */}
                    <Chip
                      size="sm"
                      variant="flat"
                      color={config.color}
                      startContent={config.icon}
                    >
                      {config.label}
                    </Chip>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {candidate.description}
                      </p>
                      <p className="text-xs text-default-400">
                        {candidate.date} {candidate.source ? `• ${candidate.source}` : ''}
                      </p>
                    </div>

                    {/* Amount */}
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold text-foreground">
                        {formatCurrency(candidate.amount)}
                      </p>
                      {isExactMatch && (
                        <Chip size="sm" variant="flat" color="success" className="mt-0.5">
                          Exacto
                        </Chip>
                      )}
                      {!isExactMatch && isCloseMatch && (
                        <Chip size="sm" variant="flat" color="warning" className="mt-0.5">
                          Cercano
                        </Chip>
                      )}
                    </div>

                    {/* Payment method */}
                    {candidate.paymentMethod && (
                      <span className="text-xs text-default-400 flex-shrink-0 hidden sm:block">
                        {candidate.paymentMethod}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ModalBody>

        <ModalFooter className="border-t">
          <Button variant="flat" onPress={handleClose}>
            Cancelar
          </Button>
          <Button
            color="primary"
            onPress={handleConfirm}
            isDisabled={!selectedCandidateId || isMatching}
          >
            {isMatching ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Conciliando...
              </>
            ) : (
              'Confirmar Match'
            )}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
