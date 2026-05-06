import { useMemo } from "react";
import { Progress } from "@heroui/progress";
import { Chip } from "@heroui/chip";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  Package,
  TrendingUp,
  AlertCircle,
} from "lucide-react";

import { ImportProgress as ImportProgressType } from "@features/sales/stores/bulkImportStore";
import { ValidatedRow } from "@shared/types/bulkImport";

interface ImportProgressProps {
  progress: ImportProgressType;
  rows: ValidatedRow[];
}

export function ImportProgress({ progress, rows }: ImportProgressProps) {
  const percentage = useMemo(() => {
    if (progress.total === 0) return 0;
    return Math.round((progress.processed / progress.total) * 100);
  }, [progress.processed, progress.total]);

  const validRows = useMemo(
    () => rows.filter((r) => r.status === "valid"),
    [rows],
  );

  // Calculate estimated time remaining (rough estimate)
  const estimatedTimeRemaining = useMemo(() => {
    if (progress.processed === 0) return null;
    const avgTimePerRow = 500; // Assume 500ms per row
    const remaining = progress.total - progress.processed;
    const seconds = Math.ceil((remaining * avgTimePerRow) / 1000);

    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  }, [progress.processed, progress.total]);

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <div className="rounded-2xl border border-divider bg-content2/30 p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold">Progreso de importación</h4>
            <p className="mt-0.5 text-xs text-default-500">
              {progress.processed < progress.total
                ? `Procesando ${progress.processed + 1} de ${progress.total} ventas...`
                : "Finalizando..."}
            </p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold text-primary">{percentage}%</span>
          </div>
        </div>

        <Progress
          value={percentage}
          className="h-3"
          classNames={{
            track: "bg-content3",
            indicator: "bg-primary",
          }}
        />

        {estimatedTimeRemaining && progress.processed < progress.total && (
          <p className="mt-2 text-xs text-default-400">
            Tiempo estimado restante: {estimatedTimeRemaining}
          </p>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          icon={Package}
          label="Total"
          value={progress.total}
          color="primary"
        />
        <StatCard
          icon={CheckCircle2}
          label="Exitosas"
          value={progress.succeeded}
          color="success"
        />
        <StatCard
          icon={XCircle}
          label="Fallidas"
          value={progress.failed}
          color="danger"
        />
      </div>

      {/* Row Status List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h5 className="text-xs font-semibold uppercase tracking-wider text-default-500">
            Estado por fila
          </h5>
          <span className="text-xs text-default-400">
            {Math.min(progress.processed, validRows.length)} / {validRows.length}{" "}
            procesadas
          </span>
        </div>

        <div className="max-h-[250px] space-y-1.5 overflow-y-auto rounded-2xl border border-divider p-2">
          {validRows.map((row, index) => {
            const isProcessed = index < progress.processed;
            const isCurrent = index === progress.processed;
            const isSuccess = isProcessed && index < progress.succeeded + (progress.processed - progress.succeeded - progress.failed + progress.succeeded);
            const isFailed =
              isProcessed &&
              progress.failed > 0 &&
              index >= progress.processed - progress.failed;

            // Determine status based on progress counts
            let status: "pending" | "processing" | "success" | "failed" =
              "pending";
            if (isCurrent && progress.processed < progress.total) {
              status = "processing";
            } else if (isProcessed) {
              // Approximate which rows succeeded vs failed based on counts
              const processedSoFar = index + 1;
              const successRate =
                progress.processed > 0
                  ? progress.succeeded / progress.processed
                  : 1;
              const expectedSuccesses = Math.round(processedSoFar * successRate);
              status = index < expectedSuccesses ? "success" : "failed";
            }

            return (
              <RowStatusItem
                key={row.row.rowNumber}
                row={row}
                status={status}
                rowNumber={row.row.rowNumber}
              />
            );
          })}
        </div>
      </div>

      {/* Summary Message */}
      {progress.processed === progress.total && (
        <div
          className={`flex items-center gap-3 rounded-xl p-3 ${
            progress.failed === 0
              ? "bg-success/10 text-success"
              : "bg-warning/10 text-warning"
          }`}
        >
          {progress.failed === 0 ? (
            <CheckCircle2 size={20} />
          ) : (
            <AlertCircle size={20} />
          )}
          <p className="text-sm font-medium">
            {progress.failed === 0
              ? `¡Todas las ${progress.succeeded} ventas fueron importadas correctamente!`
              : `Importación completada: ${progress.succeeded} exitosas, ${progress.failed} fallidas.`}
          </p>
        </div>
      )}
    </div>
  );
}

// Sub-components

interface StatCardProps {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: number;
  color: "primary" | "success" | "danger" | "warning";
}

function StatCard({ icon: Icon, label, value, color }: StatCardProps) {
  const colorClasses = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    danger: "bg-danger/10 text-danger",
    warning: "bg-warning/10 text-warning",
  };

  return (
    <div className="flex items-center gap-3 rounded-xl border border-divider bg-content2/50 p-3">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${colorClasses[color]}`}
      >
        <Icon size={18} />
      </div>
      <div>
        <p className="text-xs text-default-500">{label}</p>
        <p className="text-lg font-bold">{value}</p>
      </div>
    </div>
  );
}

interface RowStatusItemProps {
  row: ValidatedRow;
  status: "pending" | "processing" | "success" | "failed";
  rowNumber: number;
}

function RowStatusItem({ row, status, rowNumber }: RowStatusItemProps) {
  const getStatusConfig = () => {
    switch (status) {
      case "processing":
        return {
          icon: Loader2,
          label: "Procesando...",
          chipColor: "primary" as const,
          iconClass: "animate-spin text-primary",
        };
      case "success":
        return {
          icon: CheckCircle2,
          label: "Completado",
          chipColor: "success" as const,
          iconClass: "text-success",
        };
      case "failed":
        return {
          icon: XCircle,
          label: "Error",
          chipColor: "danger" as const,
          iconClass: "text-danger",
        };
      default:
        return {
          icon: Clock,
          label: "Pendiente",
          chipColor: "default" as const,
          iconClass: "text-default-400",
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  const totalAmount =
    (row.row.precioUnitario || row.productName ? row.row.cantidad * (row.row.precioUnitario || 0) : 0);

  return (
    <div
      className={`flex items-center justify-between rounded-xl px-3 py-2 transition-colors ${
        status === "processing"
          ? "bg-primary/5"
          : status === "success"
            ? "bg-success/5"
            : status === "failed"
              ? "bg-danger/5"
              : "bg-content2/30"
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon size={16} className={config.iconClass} />
        <div className="flex flex-col">
          <span className="text-sm font-medium">
            Fila {rowNumber} - {row.row.clienteName}
          </span>
          <span className="text-xs text-default-400">
            {row.productName || row.row.productoQuery} × {row.row.cantidad}
            {totalAmount > 0 && (
              <span className="ml-1 text-default-500">
                (${totalAmount.toFixed(2)})
              </span>
            )}
          </span>
        </div>
      </div>
      <Chip size="sm" variant="flat" color={config.chipColor} className="text-xs">
        {config.label}
      </Chip>
    </div>
  );
}

// Default export for dynamic imports
export default ImportProgress;
