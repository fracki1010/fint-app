import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRightLeft,
  Loader2,
  AlertCircle,
  CalendarDays,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { Chip } from '@heroui/chip';
import {
  useReconciliationData,
  useMatchTransaction,
  useUnmatchTransaction,
  useConfirmReconciliation,
} from '../hooks/useBanking';
import MatchTable from '../components/MatchTable';
import CandidateSelector from '../components/CandidateSelector';
import ReconciliationSummary from '../components/ReconciliationSummary';
import { formatCurrency } from '@shared/utils/currency';
import type { BankTransaction, MatchedEntryType } from '../types/banking';

export default function ReconciliationPage() {
  const { id: accountId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Date range — default to current month
  const today = new Date();
  const defaultFrom = new Date(today.getFullYear(), today.getMonth(), 1)
    .toISOString()
    .split('T')[0];
  const defaultTo = today.toISOString().split('T')[0];

  const [dateFrom, setDateFrom] = useState(defaultFrom);
  const [dateTo, setDateTo] = useState(defaultTo);

  // Reconciliation data
  const {
    data: reconciliationData,
    isLoading,
    error,
    refetch,
  } = useReconciliationData(accountId, dateFrom, dateTo);

  // Mutations
  const { mutateAsync: matchTransaction, isPending: isMatching } = useMatchTransaction();
  const { mutateAsync: unmatchTransaction, isPending: isUnmatching } = useUnmatchTransaction();
  const { mutateAsync: confirmReconciliation, isPending: isConfirming } =
    useConfirmReconciliation(accountId);

  // Candidate selector state
  const [isCandidateModalOpen, setIsCandidateModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<BankTransaction | null>(null);
  const [highlightedTransactionId, setHighlightedTransactionId] = useState<string | null>(null);

  // Success message
  const [confirmSuccess, setConfirmSuccess] = useState<string | null>(null);

  // Handle match — open candidate selector
  const handleOpenMatch = useCallback((transaction: BankTransaction) => {
    setSelectedTransaction(transaction);
    setIsCandidateModalOpen(true);
  }, []);

  // Handle confirm match
  const handleConfirmMatch = useCallback(
    async (
      transactionId: string,
      matchedEntryType: MatchedEntryType,
      matchedEntryId: string,
    ) => {
      await matchTransaction({ transactionId, data: { matchedEntryType, matchedEntryId } });
    },
    [matchTransaction],
  );

  // Handle unmatch
  const handleUnmatch = useCallback(
    async (transactionId: string) => {
      await unmatchTransaction(transactionId);
    },
    [unmatchTransaction],
  );

  // Handle confirm reconciliation
  const handleConfirmReconciliation = useCallback(async () => {
    try {
      const result = await confirmReconciliation(dateTo);
      setConfirmSuccess(
        `Conciliación confirmada. ${result.reconciledCount} transacciones reconciliadas. Nuevo saldo: ${result.currentBalance}`,
      );
    } catch {
      setConfirmSuccess(null);
    }
  }, [confirmReconciliation, dateTo]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-content1 border-b px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-2">
            <Button
              variant="light"
              isIconOnly
              onPress={() => navigate(`/banking/${accountId}/transactions`)}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Conciliación Bancaria</h1>
              <p className="text-sm text-default-500 mt-1">
                Relacioná transacciones bancarias con registros internos
              </p>
            </div>
          </div>

          {/* Date Range Picker */}
          <div className="flex items-center gap-3 pt-2">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-default-400" />
              <Input
                type="date"
                label="Desde"
                value={dateFrom}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setDateFrom(e.target.value);
                  setConfirmSuccess(null);
                }}
                size="sm"
                className="w-40"
              />
              <span className="text-default-400 text-sm">→</span>
              <Input
                type="date"
                label="Hasta"
                value={dateTo}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setDateTo(e.target.value);
                  setConfirmSuccess(null);
                }}
                size="sm"
                className="w-40"
              />
            </div>
            <Chip
              variant="flat"
              color="primary"
              startContent={<ArrowRightLeft className="w-3 h-3" />}
              size="sm"
            >
              Período de conciliación
            </Chip>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Success message */}
        {confirmSuccess && (
          <div className="flex items-center gap-3 bg-success-50 border border-success-200 rounded-lg p-4">
            <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-success-700">{confirmSuccess}</p>
            </div>
            <Button
              size="sm"
              variant="light"
              color="success"
              className="ml-auto"
              onPress={() => setConfirmSuccess(null)}
            >
              Cerrar
            </Button>
          </div>
        )}

        {/* Error state */}
        {error && !isLoading && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="w-12 h-12 text-danger mb-3" />
            <p className="text-danger font-medium">Error al cargar datos de conciliación</p>
            <Button className="mt-4" variant="flat" onPress={() => refetch()}>
              Reintentar
            </Button>
          </div>
        )}

        {/* Summary */}
        <ReconciliationSummary
          data={reconciliationData}
          isLoading={isLoading}
          onConfirm={handleConfirmReconciliation}
          isConfirming={isConfirming}
        />

        {/* Main content: Match Table + Candidates */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-default-400" />
          </div>
        ) : reconciliationData ? (
          <div className="space-y-6">
            {/* Matched Candidates Preview */}
            {reconciliationData.bankTransactions.filter((tx) => tx.status === 'reconciled')
              .length > 0 && (
              <div className="bg-success-50/50 border border-success-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  <span className="text-sm font-medium text-success-700">
                    Transacciones reconciliadas
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {reconciliationData.bankTransactions
                    .filter((tx) => tx.status === 'reconciled')
                    .slice(0, 5)
                    .map((tx) => (
                      <Chip
                        key={tx._id}
                        size="sm"
                        variant="flat"
                        color="success"
                        startContent={<CheckCircle2 className="w-3 h-3" />}
                      >
                        {tx.description} — {tx.matchedEntryType?.replace(/([A-Z])/g, ' $1').trim()}
                      </Chip>
                    ))}
                  {reconciliationData.bankTransactions.filter((tx) => tx.status === 'reconciled')
                    .length > 5 && (
                    <Chip size="sm" variant="flat">
                      +{reconciliationData.bankTransactions.filter((tx) => tx.status === 'reconciled')
                        .length - 5}{' '}
                      más
                    </Chip>
                  )}
                </div>
              </div>
            )}

            {/* Bank Transactions Table */}
            <div className="bg-content1 rounded-lg border border-default-200 p-4">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Transacciones Bancarias
                <span className="text-sm font-normal text-default-400 ml-2">
                  ({reconciliationData.bankTransactions.length})
                </span>
              </h2>
              <MatchTable
                transactions={reconciliationData.bankTransactions}
                isLoading={false}
                onMatch={handleOpenMatch}
                onUnmatch={handleUnmatch}
                isMatching={isMatching || isUnmatching}
                selectedTransactionId={highlightedTransactionId}
                onSelectTransaction={(tx) =>
                  setHighlightedTransactionId(tx ? tx._id : null)
                }
              />
            </div>

            {/* Candidate Records Table */}
            <div className="bg-content1 rounded-lg border border-default-200 p-4">
              <h2 className="text-lg font-semibold text-foreground mb-2">
                Registros Internos (Candidatos)
                <span className="text-sm font-normal text-default-400 ml-2">
                  ({reconciliationData.candidates.length})
                </span>
              </h2>
              <p className="text-xs text-default-400 mb-4">
                Clientes, proveedores y órdenes que pueden corresponder a las transacciones bancarias
              </p>

              {reconciliationData.candidates.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <AlertCircle className="w-10 h-10 text-default-300 mb-2" />
                  <p className="text-default-500">No hay candidatos en este período</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-default-200">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-default-50 border-b border-default-200">
                        <th className="text-left py-3 px-4 text-default-500 font-medium">Fecha</th>
                        <th className="text-left py-3 px-4 text-default-500 font-medium">Tipo</th>
                        <th className="text-left py-3 px-4 text-default-500 font-medium">Descripción</th>
                        <th className="text-right py-3 px-4 text-default-500 font-medium">Monto</th>
                        <th className="text-left py-3 px-4 text-default-500 font-medium">Medio Pago</th>
                        <th className="text-left py-3 px-4 text-default-500 font-medium">Origen</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reconciliationData.candidates.map((candidate) => {
                        const typeLabels: Record<string, string> = {
                          ClientAccountEntry: 'Pago Cliente',
                          SupplierAccountEntry: 'Pago Proveedor',
                          Order: 'Orden',
                        };
                        const typeColors: Record<string, 'primary' | 'warning' | 'secondary'> = {
                          ClientAccountEntry: 'primary',
                          SupplierAccountEntry: 'warning',
                          Order: 'secondary',
                        };

                        return (
                          <tr
                            key={`${candidate.type}-${candidate.id}`}
                            className="border-b border-default-100 hover:bg-default-50 transition-colors"
                          >
                            <td className="py-3 px-4 text-foreground whitespace-nowrap">
                              {candidate.date}
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <Chip
                                size="sm"
                                variant="flat"
                                color={typeColors[candidate.type] || 'default'}
                              >
                                {typeLabels[candidate.type] || candidate.type}
                              </Chip>
                            </td>
                            <td className="py-3 px-4 text-foreground max-w-xs truncate">
                              {candidate.description}
                            </td>
                            <td className="py-3 px-4 text-right font-medium text-foreground whitespace-nowrap">
                              {formatCurrency(candidate.amount)}
                            </td>
                            <td className="py-3 px-4 text-default-500 whitespace-nowrap">
                              {candidate.paymentMethod || '-'}
                            </td>
                            <td className="py-3 px-4 text-default-500 whitespace-nowrap">
                              {candidate.source || '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : !error ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <CalendarDays className="w-16 h-16 text-default-300 mb-4" />
            <p className="text-lg font-medium text-default-500">
              Seleccioná un rango de fechas para comenzar
            </p>
            <p className="text-sm text-default-400 mt-1">
              Los períodos de conciliación te permiten agrupar transacciones por mes
            </p>
          </div>
        ) : null}
      </div>

      {/* Candidate Selector Modal */}
      <CandidateSelector
        isOpen={isCandidateModalOpen}
        onClose={() => {
          setIsCandidateModalOpen(false);
          setSelectedTransaction(null);
        }}
        transaction={selectedTransaction}
        candidates={reconciliationData?.candidates}
        isLoading={isLoading}
        onConfirmMatch={handleConfirmMatch}
        isMatching={isMatching}
      />
    </div>
  );
}
