import { useState } from "react";
import { AlertTriangle, AlertCircle, X, TrendingUp, Wallet } from "lucide-react";
import { CreditStatus } from "@shared/types";
import { formatCurrency } from "@shared/utils/currency";

interface CreditLimitAlertProps {
  creditStatus: CreditStatus | null;
  currency: string;
  showDismiss?: boolean;
  onDismiss?: () => void;
  variant?: "banner" | "compact" | "card";
}

export function CreditLimitAlert({ 
  creditStatus, 
  currency, 
  showDismiss = true, 
  onDismiss,
  variant = "banner"
}: CreditLimitAlertProps) {
  const [dismissed, setDismissed] = useState(false);

  if (!creditStatus || dismissed) return null;

  // Don't show anything if no limit set or status is OK
  if (creditStatus.status === "no_limit" || creditStatus.status === "ok") return null;

  const isOverLimit = creditStatus.status === "over_limit";

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  // Banner variant - full width alert
  if (variant === "banner") {
    return (
      <div className={`relative rounded-2xl border p-4 ${
        isOverLimit 
          ? "border-danger/30 bg-danger/10" 
          : "border-warning/30 bg-warning/10"
      }`}>
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
            isOverLimit ? "bg-danger/20" : "bg-warning/20"
          }`}>
            {isOverLimit ? (
              <AlertCircle className="text-danger" size={20} />
            ) : (
              <AlertTriangle className="text-warning" size={20} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className={`font-semibold ${isOverLimit ? "text-danger" : "text-warning"}`}>
              {isOverLimit 
                ? "¡Límite de crédito excedido!" 
                : "Cerca del límite de crédito"}
            </h4>
            <p className="mt-1 text-sm text-default-600">
              {isOverLimit ? (
                <>
                  El cliente ha superado su límite de crédito de{" "}
                  <strong>{formatCurrency(creditStatus.creditLimit, currency)}</strong>.
                  {" "}Actualmente debe{" "}
                  <strong>{formatCurrency(creditStatus.currentBalance, currency)}</strong>.
                </>
              ) : (
                <>
                  El cliente ha utilizado el{" "}
                  <strong>{creditStatus.utilizationPercentage.toFixed(1)}%</strong>
                  {" "}de su límite de crédito ({formatCurrency(creditStatus.creditLimit, currency)}).
                  {" "}Restante: {" "}
                  <strong>{formatCurrency(creditStatus.remainingCredit || 0, currency)}</strong>.
                </>
              )}
            </p>
          </div>
          {showDismiss && (
            <button 
              onClick={handleDismiss}
              className="text-default-400 hover:text-foreground transition"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>
    );
  }

  // Compact variant - inline badge style
  if (variant === "compact") {
    return (
      <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${
        isOverLimit 
          ? "bg-danger/15 text-danger" 
          : "bg-warning/15 text-warning"
      }`}>
        {isOverLimit ? <AlertCircle size={14} /> : <AlertTriangle size={14} />}
        {isOverLimit 
          ? `Excedido ${creditStatus.utilizationPercentage.toFixed(0)}%`
          : `${creditStatus.utilizationPercentage.toFixed(0)}% usado`
        }
      </div>
    );
  }

  // Card variant - detailed info card
  return (
    <div className={`rounded-2xl border p-4 ${
      isOverLimit 
        ? "border-danger/20 bg-danger/5" 
        : "border-warning/20 bg-warning/5"
    }`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Wallet size={16} className={isOverLimit ? "text-danger" : "text-warning"} />
          <span className="font-semibold text-foreground">Estado de Crédito</span>
        </div>
        {showDismiss && (
          <button 
            onClick={handleDismiss}
            className="text-default-400 hover:text-foreground transition"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <div className="space-y-3">
        {/* Progress bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-default-500">Utilización</span>
            <span className={`font-semibold ${isOverLimit ? "text-danger" : "text-warning"}`}>
              {creditStatus.utilizationPercentage.toFixed(1)}%
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-content2">
            <div 
              className={`h-full rounded-full transition-all ${
                isOverLimit ? "bg-danger" : "bg-warning"
              }`}
              style={{ width: `${Math.min(creditStatus.utilizationPercentage, 100)}%` }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-content2/50 p-2 text-center">
            <p className="text-[10px] uppercase tracking-wider text-default-500">Límite</p>
            <p className="text-sm font-bold text-foreground">
              {formatCurrency(creditStatus.creditLimit, currency)}
            </p>
          </div>
          <div className="rounded-xl bg-content2/50 p-2 text-center">
            <p className="text-[10px] uppercase tracking-wider text-default-500">Usado</p>
            <p className={`text-sm font-bold ${isOverLimit ? "text-danger" : "text-foreground"}`}>
              {formatCurrency(creditStatus.currentBalance, currency)}
            </p>
          </div>
        </div>

        {creditStatus.remainingCredit !== null && (
          <div className="flex items-center justify-between rounded-xl bg-content2/30 px-3 py-2">
            <span className="text-xs text-default-500">Crédito disponible</span>
            <span className="text-sm font-bold text-success">
              {formatCurrency(creditStatus.remainingCredit, currency)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// Badge component for showing credit limit % in lists
interface CreditLimitBadgeProps {
  creditLimit?: number;
  currentBalance?: number;
  currency: string;
  size?: "sm" | "md";
}

export function CreditLimitBadge({ 
  creditLimit = 0, 
  currentBalance = 0, 
  currency,
  size = "sm"
}: CreditLimitBadgeProps) {
  if (!creditLimit || creditLimit <= 0) return null;

  const utilization = (currentBalance / creditLimit) * 100;
  const isOverLimit = utilization > 100;
  const isNearLimit = utilization >= 80 && !isOverLimit;

  const sizeClasses = size === "sm" 
    ? "px-1.5 py-0.5 text-[10px]"
    : "px-2 py-1 text-xs";

  return (
    <div 
      className={`inline-flex items-center gap-1 rounded-full font-semibold ${sizeClasses} ${
        isOverLimit 
          ? "bg-danger/15 text-danger"
          : isNearLimit
            ? "bg-warning/15 text-warning"
            : "bg-success/15 text-success"
      }`}
      title={`Límite: ${formatCurrency(creditLimit, currency)} · Usado: ${formatCurrency(currentBalance, currency)}`}
    >
      <TrendingUp size={size === "sm" ? 10 : 12} />
      {utilization.toFixed(0)}%
    </div>
  );
}

export default CreditLimitAlert;
