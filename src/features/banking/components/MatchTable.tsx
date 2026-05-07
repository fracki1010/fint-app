import { useState, useMemo } from 'react';
import { Search, Loader2, CheckCircle2, Link2, Unlink2 } from 'lucide-react';
import { Button } from '@heroui/button';
import { Chip } from '@heroui/chip';
import { Input } from '@heroui/input';
import { formatCurrency } from '@shared/utils/currency';
import type { BankTransaction, MatchedEntryType, TransactionStatus } from '../types/banking';

const STATUS_COLORS: Record<TransactionStatus, 'warning' | 'success' | 'primary' | 'secondary'> = {
  pending: 'warning',
  cleared: 'success',
  reconciled: 'primary',
};

const STATUS_LABELS: Record<TransactionStatus, string> = {
  pending: 'Pendiente',
  cleared: 'Conciliado',
  reconciled: 'Reconciliado',
};

interface MatchTableProps {
  transactions: BankTransaction[] | undefined;
  isLoading: boolean;
  onMatch: (transaction: BankTransaction) => void;
  onUnmatch: (transactionId: string) => void;
  isMatching?: boolean;
  selectedTransactionId?: string | null;
  onSelectTransaction?: (transaction: BankTransaction | null) => void;
}

export default function MatchTable({
  transactions,
  isLoading,
  onMatch,
  onUnmatch,
  isMatching,
  selectedTransactionId,
  onSelectTransaction,
}: MatchTableProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];
    if (!searchTerm.trim()) return transactions;

    const term = searchTerm.toLowerCase();
    return transactions.filter(
      (tx) =>
        tx.description.toLowerCase().includes(term) ||
        (tx.reference && tx.reference.toLowerCase().includes(term)),
    );
  }, [transactions, searchTerm]);

  const getMatchedInfo = (tx: BankTransaction) => {
    if (tx.status !== 'reconciled' || !tx.matchedEntryType) return null;

    const typeLabels: Record<MatchedEntryType, string> = {
      ClientAccountEntry: 'Pago Cliente',
      SupplierAccountEntry: 'Pago Proveedor',
      Order: 'Orden',
    };

    return {
      label: typeLabels[tx.matchedEntryType],
      type: tx.matchedEntryType,
    };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-default-400" />
      </div>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Search className="w-12 h-12 text-default-300 mb-3" />
        <p className="text-default-500 font-medium">No hay transacciones bancarias</p>
        <p className="text-sm text-default-400 mt-1">
          No se encontraron transacciones en el rango de fechas seleccionado
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Search */}
      <div className="mb-4">
        <Input
          placeholder="Buscar por descripción o referencia..."
          value={searchTerm}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
          startContent={<Search className="w-4 h-4 text-default-400" />}
          size="sm"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-default-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-default-50 border-b border-default-200">
              <th className="text-left py-3 px-4 text-default-500 font-medium">Fecha</th>
              <th className="text-left py-3 px-4 text-default-500 font-medium">Descripción</th>
              <th className="text-left py-3 px-4 text-default-500 font-medium">Referencia</th>
              <th className="text-right py-3 px-4 text-default-500 font-medium">Monto</th>
              <th className="text-center py-3 px-4 text-default-500 font-medium">Estado</th>
              <th className="text-center py-3 px-4 text-default-500 font-medium">Match</th>
              <th className="text-right py-3 px-4 text-default-500 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.map((tx) => {
              const matchedInfo = getMatchedInfo(tx);
              const isSelected = selectedTransactionId === tx._id;

              return (
                <tr
                  key={tx._id}
                  className={`border-b border-default-100 transition-colors cursor-pointer ${
                    isSelected ? 'bg-primary/5' : 'hover:bg-default-50'
                  } ${tx.status === 'reconciled' ? 'bg-success-50/30' : ''}`}
                  onClick={() => onSelectTransaction?.(isSelected ? null : tx)}
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
                  <td
                    className={`py-3 px-4 text-right font-medium whitespace-nowrap ${
                      tx.type === 'debit' ? 'text-danger' : 'text-success'
                    }`}
                  >
                    {tx.type === 'debit' ? '-' : '+'}
                    {formatCurrency(tx.amount)}
                  </td>
                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    <Chip size="sm" variant="flat" color={STATUS_COLORS[tx.status]}>
                      {STATUS_LABELS[tx.status]}
                    </Chip>
                  </td>
                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    {matchedInfo ? (
                      <div className="flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-4 h-4 text-success" />
                        <span className="text-xs text-success-600 font-medium">
                          {matchedInfo.label}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-default-400">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    {tx.status === 'reconciled' ? (
                      <Button
                        size="sm"
                        variant="light"
                        color="danger"
                        isIconOnly
                        onPress={() => onUnmatch(tx._id)}
                        isDisabled={isMatching}
                      >
                        <Unlink2 className="w-4 h-4" />
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        color="primary"
                        variant="flat"
                        onPress={() => onMatch(tx)}
                        isDisabled={isMatching}
                        startContent={<Link2 className="w-3 h-3" />}
                      >
                        Match
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="flex items-center justify-between mt-3 text-xs text-default-400">
        <span>
          Mostrando {filteredTransactions.length} de {transactions.length} transacciones
        </span>
        <span>
          {transactions.filter((t) => t.status === 'reconciled').length} reconciliadas
        </span>
      </div>
    </div>
  );
}
