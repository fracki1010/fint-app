import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Upload,
  Loader2,
  AlertCircle,
  Search,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { Chip } from '@heroui/chip';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
} from '@heroui/modal';
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from '@heroui/dropdown';
import { Select, SelectItem } from '@heroui/select';
import {
  useBankTransactions,
  useCreateBankTransaction,
  useUpdateBankTransaction,
} from '../hooks/useBanking';
import { CsvImportWizard } from '../components/CsvImportWizard';
import { formatCurrency } from '@shared/utils/currency';
import type { BankTransaction, CreateBankTransactionRequest, TransactionStatus, TransactionType } from '../types/banking';

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Todos los estados' },
  { value: 'pending', label: 'Pendiente' },
  { value: 'cleared', label: 'Conciliado' },
  { value: 'reconciled', label: 'Reconciliado' },
];

const TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Todos los tipos' },
  { value: 'debit', label: 'Débito' },
  { value: 'credit', label: 'Crédito' },
];

const STATUS_COLORS: Record<TransactionStatus, 'warning' | 'success' | 'primary'> = {
  pending: 'warning',
  cleared: 'success',
  reconciled: 'primary',
};

const STATUS_LABELS: Record<TransactionStatus, string> = {
  pending: 'Pendiente',
  cleared: 'Conciliado',
  reconciled: 'Reconciliado',
};

export default function BankTransactionsPage() {
  const { id: accountId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Filters
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Create modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Import wizard
  const [isImportWizardOpen, setIsImportWizardOpen] = useState(false);

  const filters = {
    ...(dateFrom && { dateFrom }),
    ...(dateTo && { dateTo }),
    ...(statusFilter && { status: statusFilter as TransactionStatus }),
    ...(typeFilter && { type: typeFilter as TransactionType }),
  };

  const { data: transactions, isLoading, error, refetch } = useBankTransactions(accountId, filters);
  const { mutateAsync: createTransaction, isPending: isCreating } = useCreateBankTransaction();
  const { mutateAsync: updateTransaction } = useUpdateBankTransaction();

  const handleCreateTransaction = async (data: CreateBankTransactionRequest) => {
    await createTransaction(data);
    setIsCreateModalOpen(false);
  };

  const handleClearFilters = () => {
    setDateFrom('');
    setDateTo('');
    setStatusFilter('');
    setTypeFilter('');
  };

  const hasActiveFilters = dateFrom || dateTo || statusFilter || typeFilter;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-content1 border-b px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-2">
            <Button
              variant="light"
              isIconOnly
              onPress={() => navigate('/banking')}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Movimientos Bancarios</h1>
              <p className="text-sm text-default-500 mt-1">
                Gestioná las transacciones de tu cuenta bancaria
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <Button
              color="primary"
              onPress={() => setIsCreateModalOpen(true)}
              size="sm"
            >
              <Plus className="w-4 h-4 mr-1" />
              Agregar
            </Button>
            <Button
              variant="flat"
              onPress={() => setIsImportWizardOpen(true)}
              size="sm"
            >
              <Upload className="w-4 h-4 mr-1" />
              Importar CSV
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="border-b bg-content1/50">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center gap-3 flex-wrap">
            <Input
              type="date"
              label="Desde"
              value={dateFrom}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDateFrom(e.target.value)}
              size="sm"
              className="w-40"
            />
            <Input
              type="date"
              label="Hasta"
              value={dateTo}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDateTo(e.target.value)}
              size="sm"
              className="w-40"
            />
            <Select
              label="Estado"
              selectedKeys={statusFilter ? [statusFilter] : []}
              onSelectionChange={(keys) => {
                const val = Array.from(keys)[0] as string;
                setStatusFilter(val || '');
              }}
              size="sm"
              className="w-40"
            >
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value}>{opt.label}</SelectItem>
              ))}
            </Select>
            <Select
              label="Tipo"
              selectedKeys={typeFilter ? [typeFilter] : []}
              onSelectionChange={(keys) => {
                const val = Array.from(keys)[0] as string;
                setTypeFilter(val || '');
              }}
              size="sm"
              className="w-40"
            >
              {TYPE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value}>{opt.label}</SelectItem>
              ))}
            </Select>
            {hasActiveFilters && (
              <Button variant="light" size="sm" onPress={handleClearFilters}>
                Limpiar filtros
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-default-400" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <AlertCircle className="w-12 h-12 text-danger mb-3" />
            <p className="text-danger font-medium">Error al cargar movimientos</p>
            <Button className="mt-4" variant="flat" onPress={() => refetch()}>
              Reintentar
            </Button>
          </div>
        ) : !transactions || transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Search className="w-16 h-16 text-default-300 mb-4" />
            <p className="text-lg font-medium text-default-500">
              {hasActiveFilters
                ? 'No se encontraron movimientos con los filtros aplicados'
                : 'No hay movimientos bancarios'}
            </p>
            <p className="text-sm text-default-400 mt-1 mb-4">
              {hasActiveFilters
                ? 'Probá cambiando los filtros o'
                : 'Agregá un movimiento manualmente o importá un CSV para comenzar'}
            </p>
            {!hasActiveFilters && (
              <div className="flex gap-3">
                <Button color="primary" onPress={() => setIsCreateModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Movimiento
                </Button>
                <Button variant="flat" onPress={() => setIsImportWizardOpen(true)}>
                  <Upload className="w-4 h-4 mr-2" />
                  Importar CSV
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-default-200">
                  <th className="text-left py-3 px-4 text-default-500 font-medium">Fecha</th>
                  <th className="text-left py-3 px-4 text-default-500 font-medium">Descripción</th>
                  <th className="text-left py-3 px-4 text-default-500 font-medium">Referencia</th>
                  <th className="text-right py-3 px-4 text-default-500 font-medium">Monto</th>
                  <th className="text-center py-3 px-4 text-default-500 font-medium">Estado</th>
                  <th className="text-right py-3 px-4 text-default-500 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx: BankTransaction) => (
                  <tr
                    key={tx._id}
                    className="border-b border-default-100 hover:bg-default-50 transition-colors"
                  >
                    <td className="py-3 px-4 text-foreground whitespace-nowrap">
                      {new Date(tx.date).toLocaleDateString('es-AR')}
                    </td>
                    <td className="py-3 px-4 text-foreground max-w-xs truncate">
                      {tx.description}
                    </td>
                    <td className="py-3 px-4 text-default-500 whitespace-nowrap">
                      {tx.reference || '-'}
                    </td>
                    <td className={`py-3 px-4 text-right font-medium whitespace-nowrap ${
                      tx.type === 'debit' ? 'text-danger' : 'text-success'
                    }`}>
                      {tx.type === 'debit' ? '-' : '+'}
                      {formatCurrency(tx.amount)}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <Chip
                        size="sm"
                        variant="flat"
                        color={STATUS_COLORS[tx.status]}
                      >
                        {STATUS_LABELS[tx.status]}
                      </Chip>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <Dropdown>
                        <DropdownTrigger>
                          <Button variant="light" size="sm" isIconOnly>
                            <ChevronDown className="w-4 h-4" />
                          </Button>
                        </DropdownTrigger>
                        <DropdownMenu>
                          <DropdownItem
                            key="edit"
                            onPress={() => {
                              // Edit functionality - for Phase 3
                            }}
                          >
                            Editar
                          </DropdownItem>
                          <DropdownItem
                            key="advance"
                            onPress={async () => {
                              if (tx.status !== 'pending') return;
                              await updateTransaction({
                                transactionId: tx._id,
                                data: { status: 'cleared' },
                              });
                            }}
                          >
                            Marcar como Conciliado
                          </DropdownItem>
                          <DropdownItem
                            key="reconciliation"
                            onPress={() => {
                              navigate(`/banking/${tx.bankAccount}/reconciliation`);
                            }}
                          >
                            Conciliar
                          </DropdownItem>
                        </DropdownMenu>
                      </Dropdown>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Transaction Modal */}
      <CreateTransactionModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateTransaction}
        isSubmitting={isCreating}
        accountId={accountId || ''}
      />

      {/* CSV Import Wizard */}
      {isImportWizardOpen && (
        <CsvImportWizard
          accountId={accountId || ''}
          isOpen={isImportWizardOpen}
          onClose={() => setIsImportWizardOpen(false)}
        />
      )}
    </div>
  );
}

// ── Inline Create Transaction Modal ──

interface CreateTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateBankTransactionRequest) => Promise<void>;
  isSubmitting: boolean;
  accountId: string;
}

function CreateTransactionModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  accountId,
}: CreateTransactionModalProps) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'debit' | 'credit'>('debit');
  const [reference, setReference] = useState('');

  const handleSubmit = async () => {
    await onSubmit({
      bankAccount: accountId,
      date,
      description: description.trim(),
      amount: Math.abs(Number(amount)),
      type,
      reference: reference.trim() || undefined,
    });
    // Reset form
    setDate(new Date().toISOString().split('T')[0]);
    setDescription('');
    setAmount('');
    setType('debit');
    setReference('');
  };

  const isFormValid = date && description.trim() && amount && Number(amount) > 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalContent>
        <ModalHeader className="flex items-center gap-2">
          <Plus className="w-5 h-5 text-primary" />
          Nuevo Movimiento
        </ModalHeader>
        <ModalBody className="pb-6 space-y-4">
          <Input
            label="Fecha"
            type="date"
            value={date}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDate(e.target.value)}
            isRequired
            isDisabled={isSubmitting}
          />
          <Input
            label="Descripción"
            placeholder="Ej: Pago factura servicios"
            value={description}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDescription(e.target.value)}
            isRequired
            isDisabled={isSubmitting}
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Tipo"
              selectedKeys={[type]}
              onSelectionChange={(keys) => {
                const val = Array.from(keys)[0] as string;
                if (val === 'debit' || val === 'credit') setType(val);
              }}
              isDisabled={isSubmitting}
            >
              <SelectItem key="debit">Débito (Salida)</SelectItem>
              <SelectItem key="credit">Crédito (Ingreso)</SelectItem>
            </Select>
            <Input
              label="Monto"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmount(e.target.value)}
              isRequired
              isDisabled={isSubmitting}
            />
          </div>
          <Input
            label="Referencia (opcional)"
            placeholder="Ej: TRF-001"
            value={reference}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReference(e.target.value)}
            isDisabled={isSubmitting}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="flat" onPress={onClose} isDisabled={isSubmitting}>
              Cancelar
            </Button>
            <Button
              color="primary"
              onPress={handleSubmit}
              isDisabled={!isFormValid || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creando...
                </>
              ) : (
                'Crear Movimiento'
              )}
            </Button>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
