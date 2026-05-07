import { Loader2, CheckCircle2, AlertCircle, Banknote, ArrowUpDown } from 'lucide-react';
import { Button } from '@heroui/button';
import { Card, CardBody } from '@heroui/card';
import { formatCurrency } from '@shared/utils/currency';
import type { ReconciliationData } from '../types/banking';

interface ReconciliationSummaryProps {
  data: ReconciliationData | undefined;
  isLoading: boolean;
  onConfirm: () => void;
  isConfirming: boolean;
}

interface SummaryCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  color?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
}

function SummaryCard({ title, value, subtitle, icon, color = 'default' }: SummaryCardProps) {
  const colorClasses: Record<string, string> = {
    default: 'bg-default-50 border-default-200',
    primary: 'bg-primary-50 border-primary-200',
    success: 'bg-success-50 border-success-200',
    warning: 'bg-warning-50 border-warning-200',
    danger: 'bg-danger-50 border-danger-200',
  };

  const iconClasses: Record<string, string> = {
    default: 'text-default-500',
    primary: 'text-primary',
    success: 'text-success',
    warning: 'text-warning',
    danger: 'text-danger',
  };

  return (
    <Card className={`border ${colorClasses[color]} shadow-sm`}>
      <CardBody className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-default-500 font-medium uppercase tracking-wide">{title}</p>
            <p className="text-xl font-bold text-foreground mt-1">{value}</p>
            {subtitle && (
              <p className="text-xs text-default-400 mt-0.5">{subtitle}</p>
            )}
          </div>
          <div className={`p-2 rounded-lg bg-white/60 ${iconClasses[color]}`}>
            {icon}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

export default function ReconciliationSummary({
  data,
  isLoading,
  onConfirm,
  isConfirming,
}: ReconciliationSummaryProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-default-400" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <AlertCircle className="w-8 h-8 text-default-300 mb-2" />
        <p className="text-sm text-default-500">Seleccioná un rango de fechas para ver el resumen</p>
      </div>
    );
  }

  const { bankTransactions, unmatchedTransactions, balance, candidates } = data;

  const totalTransactions = bankTransactions.length;
  const matchedCount = bankTransactions.filter((tx) => tx.status === 'reconciled').length;
  const unmatchedCount = unmatchedTransactions.length;
  const totalCandidates = candidates.length;

  const totalDebits = bankTransactions
    .filter((tx) => tx.type === 'debit')
    .reduce((sum, tx) => sum + tx.amount, 0);
  const totalCredits = bankTransactions
    .filter((tx) => tx.type === 'credit')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const balanceDiff = balance.current - (totalCredits - totalDebits);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard
          title="Transacciones"
          value={totalTransactions.toString()}
          subtitle={`${matchedCount} reconciliadas`}
          icon={<Banknote className="w-5 h-5" />}
          color="primary"
        />
        <SummaryCard
          title="Match"
          value={matchedCount.toString()}
          subtitle={`${unmatchedCount} sin match`}
          icon={<CheckCircle2 className="w-5 h-5" />}
          color="success"
        />
        <SummaryCard
          title="Candidatos"
          value={totalCandidates.toString()}
          subtitle="Registros internos"
          icon={<ArrowUpDown className="w-5 h-5" />}
          color="warning"
        />
        <SummaryCard
          title="Diferencia"
          value={formatCurrency(Math.abs(balanceDiff))}
          subtitle={balanceDiff >= 0 ? 'Saldo a favor' : 'Saldo en contra'}
          icon={<AlertCircle className="w-5 h-5" />}
          color={balanceDiff === 0 ? 'success' : Math.abs(balanceDiff) > 0 ? 'warning' : 'default'}
        />
      </div>

      {/* Totals row */}
      <div className="flex items-center justify-between bg-content1 rounded-lg border border-default-200 p-3">
        <div className="flex items-center gap-6 text-sm">
          <div>
            <span className="text-default-500">Débitos: </span>
            <span className="font-semibold text-danger">{formatCurrency(totalDebits)}</span>
          </div>
          <div>
            <span className="text-default-500">Créditos: </span>
            <span className="font-semibold text-success">{formatCurrency(totalCredits)}</span>
          </div>
          <div>
            <span className="text-default-500">Balance banco: </span>
            <span className="font-semibold text-foreground">{formatCurrency(balance.current)}</span>
          </div>
        </div>

        <Button
          color="primary"
          onPress={onConfirm}
          isDisabled={matchedCount === 0 || isConfirming}
          size="sm"
        >
          {isConfirming ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Confirmando...
            </>
          ) : matchedCount === 0 ? (
            'Sin matches para confirmar'
          ) : (
            `Confirmar Conciliación (${matchedCount})`
          )}
        </Button>
      </div>
    </div>
  );
}
