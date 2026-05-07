import { useState, useCallback } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Button as HeroButton } from "@heroui/button";
import {
  Upload,
  X,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
  Loader2,
  Download,
  FileDown,
  AlertTriangle,
} from "lucide-react";

import { useBulkSalesImport } from "@features/sales/hooks/useBulkSalesImport";
import { ImportStatus } from "@features/sales/stores/bulkImportStore";
import { ImportPreviewTable } from "./ImportPreviewTable";
import { ImportProgress } from "./ImportProgress";
import { useAppToast } from "@features/notifications/components/AppToast";
import {
  exportFailedRows,
  downloadImportTemplate,
  validateImportFile,
  readFileAsText,
} from "@features/sales/utils/importExport";

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const STEPS = [
  { key: "input", label: "Pegar CSV" },
  { key: "preview", label: "Vista previa" },
  { key: "importing", label: "Importando" },
  { key: "complete", label: "Completado" },
] as const;

export function BulkImportModal({ isOpen, onClose }: BulkImportModalProps) {
  const {
    rawText,
    setRawText,
    parse,
    validate,
    importRows,
    retryFailed,
    reset,
    status,
    progress,
    validRowCount,
    invalidRowCount,
    validatedRows,
    errorMessage,
    failedRows,
  } = useBulkSalesImport();

  const { showToast } = useAppToast();
  const [parseError, setParseError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const currentStepIndex = getStepIndex(status);

  const handleParse = useCallback(async () => {
    setParseError(null);
    const result = parse();

    if (!result.success || result.rowCount === 0) {
      setParseError("No se encontraron filas válidas. Verificá el formato del CSV.");
      return;
    }

    // Automatically validate after parse
    const validateResult = await validate();

    if (validateResult.validCount === 0 && validateResult.invalidCount > 0) {
      setParseError("Todas las filas tienen errores. Revisá la vista previa.");
    }
  }, [parse, validate]);

  const handleImport = useCallback(async () => {
    const result = await importRows({
      useBulkAPI: true,
      batchSize: 100,
    });

    if (result.success) {
      showToast({
        variant: "success",
        message: `Se importaron ${result.imported} ventas correctamente.`,
      });
    } else if (result.imported > 0) {
      showToast({
        variant: "warning",
        message: `Importación parcial: ${result.imported} importadas, ${result.failed} fallidas.`,
      });
    } else {
      showToast({
        variant: "error",
        message: `La importación falló. No se pudo importar ninguna venta.`,
      });
    }
  }, [importRows, showToast]);

  const handleRetry = useCallback(async () => {
    setIsRetrying(true);
    try {
      const result = await retryFailed();

      if (result.success) {
        showToast({
          variant: "success",
          message: `Se reintentaron ${result.imported} ventas exitosamente.`,
        });
      } else {
        showToast({
          variant: "warning",
          message: `${result.imported} exitosas, ${result.failed} siguen fallando.`,
        });
      }
    } catch (error) {
      showToast({
        variant: "error",
        message: "Error al reintentar las ventas fallidas.",
      });
    } finally {
      setIsRetrying(false);
    }
  }, [retryFailed, showToast]);

  const handleExportFailed = useCallback(() => {
    try {
      exportFailedRows(failedRows.length > 0 ? failedRows : validatedRows.filter(
        (r) => r.status === "valid" && progress.failed > 0
      ));
      showToast({
        variant: "success",
        message: "Archivo de filas fallidas descargado.",
      });
    } catch {
      showToast({
        variant: "error",
        message: "Error al exportar las filas fallidas.",
      });
    }
  }, [failedRows, validatedRows, progress.failed, showToast]);

  const handleDownloadTemplate = useCallback(() => {
    try {
      downloadImportTemplate();
      showToast({
        variant: "success",
        message: "Plantilla descargada. Completá los datos y volvé a subirla.",
      });
    } catch {
      showToast({
        variant: "error",
        message: "Error al descargar la plantilla.",
      });
    }
  }, [showToast]);

  const handleClose = useCallback(() => {
    if (status === "importing") {
      // Don't allow closing during import
      return;
    }
    reset();
    setParseError(null);
    onClose();
  }, [status, reset, onClose]);

  const handleReset = useCallback(() => {
    reset();
    setParseError(null);
  }, [reset]);

  // File drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length === 0) return;

    const file = files[0];
    const validation = validateImportFile(file);

    if (!validation.valid) {
      setParseError(validation.error || "Archivo inválido");
      return;
    }

    try {
      const content = await readFileAsText(file);
      setRawText(content);
      showToast({
        variant: "success",
        message: `Archivo "${file.name}" cargado. Presioná Continuar para validar.`,
      });
    } catch {
      setParseError("Error al leer el archivo");
    }
  }, [setRawText, showToast]);

  const getStepContent = () => {
    switch (status) {
      case "idle":
      case "parsing":
      case "error":
        return (
          <InputStep
            rawText={rawText}
            onChange={setRawText}
            onParse={handleParse}
            onDownloadTemplate={handleDownloadTemplate}
            isLoading={status === "parsing"}
            error={parseError || errorMessage}
            isDragging={isDragging}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          />
        );
      case "validating":
      case "ready":
        return (
          <PreviewStep
            rows={validatedRows}
            validCount={validRowCount}
            invalidCount={invalidRowCount}
            isValidating={status === "validating"}
            onImport={handleImport}
            onBack={handleReset}
          />
        );
      case "importing":
        return <ImportProgress progress={progress} rows={validatedRows} />;
      case "complete":
        return (
          <CompleteStep
            progress={progress}
            onReset={handleReset}
            onRetry={progress.failed > 0 ? handleRetry : undefined}
            onExportFailed={progress.failed > 0 ? handleExportFailed : undefined}
            isRetrying={isRetrying}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
      size="3xl"
      scrollBehavior="inside"
      backdrop="blur"
      hideCloseButton={status === "importing"}
    >
      <ModalContent className="max-h-[90vh]">
        <ModalHeader className="flex flex-col gap-1 border-b border-divider/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <FileSpreadsheet size={18} />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Importar ventas</h3>
                <p className="text-xs text-default-500">
                  Importá ventas históricas desde CSV
                </p>
              </div>
            </div>
            {status !== "importing" && (
              <button
                onClick={handleClose}
                className="flex h-8 w-8 items-center justify-center rounded-xl text-default-400 transition-colors hover:bg-content2 hover:text-foreground"
                aria-label="Cerrar"
              >
                <X size={18} />
              </button>
            )}
          </div>

          {/* Step indicator */}
          <div className="mt-4 flex items-center gap-2">
            {STEPS.map((step, index) => {
              const isActive = index === currentStepIndex;
              const isCompleted = index < currentStepIndex;

              return (
                <div key={step.key} className="flex items-center">
                  <div
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      isActive
                        ? "bg-primary text-white"
                        : isCompleted
                          ? "bg-success/10 text-success"
                          : "bg-content2 text-default-500"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 size={12} />
                    ) : (
                      <span className="flex h-4 w-4 items-center justify-center text-[10px]">
                        {index + 1}
                      </span>
                    )}
                    {step.label}
                  </div>
                  {index < STEPS.length - 1 && (
                    <div
                      className={`mx-2 h-px w-6 ${
                        isCompleted ? "bg-success/30" : "bg-divider"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </ModalHeader>

        <ModalBody className="py-6">{getStepContent()}</ModalBody>

        <ModalFooter className="border-t border-divider/50">
          {status === "idle" || status === "error" ? (
            <>
              <HeroButton variant="flat" onPress={handleClose}>
                Cancelar
              </HeroButton>
              <HeroButton
                color="primary"
                onPress={handleParse}
                isDisabled={!rawText.trim()}
              >
                Continuar
                <ArrowRight size={16} />
              </HeroButton>
            </>
          ) : status === "ready" || status === "validating" ? (
            <>
              <HeroButton
                variant="flat"
                onPress={handleReset}
                isDisabled={status === "validating"}
              >
                Volver
              </HeroButton>
              <HeroButton
                color="primary"
                onPress={handleImport}
                isLoading={status === "validating"}
                isDisabled={validRowCount === 0}
              >
                Importar {validRowCount > 0 && `(${validRowCount})`}
              </HeroButton>
            </>
          ) : status === "complete" ? (
            <>
              {progress.failed > 0 && (
                <HeroButton
                  variant="flat"
                  onPress={handleExportFailed}
                  className="gap-2"
                >
                  <Download size={16} />
                  Descargar fallidas
                </HeroButton>
              )}
              <HeroButton color="primary" onPress={handleClose}>
                Cerrar
              </HeroButton>
            </>
          ) : null}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

// Helper functions
function getStepIndex(status: ImportStatus): number {
  switch (status) {
    case "idle":
    case "parsing":
    case "error":
      return 0;
    case "validating":
    case "ready":
      return 1;
    case "importing":
      return 2;
    case "complete":
      return 3;
    default:
      return 0;
  }
}

// Sub-components

interface InputStepProps {
  rawText: string;
  onChange: (text: string) => void;
  onParse: () => void;
  onDownloadTemplate: () => void;
  isLoading: boolean;
  error: string | null;
  isDragging: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
}

function InputStep({
  rawText,
  onChange,
  isLoading,
  error,
  onDownloadTemplate,
  isDragging,
  onDragOver,
  onDragLeave,
  onDrop,
}: InputStepProps) {
  return (
    <div className="space-y-4">
      <div
        className={`rounded-2xl border-2 border-dashed p-4 transition-colors ${
          isDragging
            ? "border-primary bg-primary/5"
            : "border-divider bg-content2/30"
        }`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-default-600">
            <Upload size={16} />
            <span className="font-medium">Pegá tu CSV o arrastrá un archivo</span>
          </div>
          <button
            onClick={onDownloadTemplate}
            className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
          >
            <FileDown size={14} />
            Descargar plantilla
          </button>
        </div>

        <textarea
          className="corp-input min-h-[200px] w-full resize-none font-mono text-xs"
          placeholder={`fecha,cliente,producto,cantidad,precio_unitario,metodo_pago,notas
15/01/2024,Juan Pérez,Producto A,2,100,Efectivo,Nota opcional
16/01/2024,María García,1234567890123,1,,Tarjeta,`}
          value={rawText}
          onChange={(e) => onChange(e.target.value)}
          disabled={isLoading}
          aria-label="Contenido CSV"
        />

        {isDragging && (
          <div className="mt-3 flex items-center justify-center rounded-xl bg-primary/10 py-4 text-sm text-primary">
            Soltá el archivo aquí
          </div>
        )}

        {error && (
          <div className="mt-3 flex items-start gap-2 rounded-xl bg-danger/10 p-3 text-sm text-danger">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      <div className="rounded-2xl bg-content2/50 p-4">
        <p className="mb-2 text-xs font-medium text-default-600">
          Formato esperado:
        </p>
        <ul className="space-y-1 text-xs text-default-500">
          <li className="flex gap-2">
            <span className="text-primary">•</span>
            <span>
              <strong>fecha:</strong> DD/MM/AAAA o YYYY-MM-DD
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-primary">•</span>
            <span>
              <strong>cliente:</strong> Nombre o &quot;Nombre,Teléfono&quot;
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-primary">•</span>
            <span>
              <strong>producto:</strong> Nombre, código de barras o SKU
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-primary">•</span>
            <span>
              <strong>cantidad:</strong> número entero positivo
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-primary">•</span>
            <span>
              <strong>precio_unitario:</strong> (opcional) usa el precio del
              producto si no se especifica
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-primary">•</span>
            <span>
              <strong>metodo_pago:</strong> (opcional) Efectivo, Tarjeta,
              Transferencia
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}

interface PreviewStepProps {
  rows: import("@shared/types/bulkImport").ValidatedRow[];
  validCount: number;
  invalidCount: number;
  isValidating: boolean;
  onImport: () => void;
  onBack: () => void;
}

function PreviewStep({
  rows,
  validCount,
  invalidCount,
  isValidating,
}: PreviewStepProps) {
  if (isValidating) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="animate-spin text-primary" size={40} />
        <p className="mt-4 text-sm text-default-500">Validando datos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 rounded-xl bg-success/10 px-4 py-2 text-sm">
          <CheckCircle2 size={16} className="text-success" />
          <span className="font-medium text-success">{validCount} válidas</span>
        </div>
        {invalidCount > 0 && (
          <div className="flex items-center gap-2 rounded-xl bg-danger/10 px-4 py-2 text-sm">
            <AlertCircle size={16} className="text-danger" />
            <span className="font-medium text-danger">
              {invalidCount} con errores
            </span>
          </div>
        )}
      </div>

      {/* Preview table */}
      <ImportPreviewTable rows={rows} />
    </div>
  );
}

interface CompleteStepProps {
  progress: { total: number; succeeded: number; failed: number };
  onReset: () => void;
  onRetry?: () => void;
  onExportFailed?: () => void;
  isRetrying: boolean;
}

function CompleteStep({
  progress,
  onReset,
  onRetry,
  onExportFailed,
  isRetrying,
}: CompleteStepProps) {
  const allSuccess = progress.failed === 0;
  const hasFailures = progress.failed > 0;

  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div
        className={`flex h-16 w-16 items-center justify-center rounded-2xl ${
          allSuccess ? "bg-success/10" : "bg-warning/10"
        }`}
      >
        {allSuccess ? (
          <CheckCircle2 size={32} className="text-success" />
        ) : (
          <AlertTriangle size={32} className="text-warning" />
        )}
      </div>

      <h4 className="mt-4 text-lg font-semibold">
        {allSuccess ? "¡Importación completada!" : "Importación parcial"}
      </h4>

      <p className="mt-2 text-sm text-default-500">
        {allSuccess
          ? `Se importaron ${progress.succeeded} ventas correctamente.`
          : `Se importaron ${progress.succeeded} de ${progress.total} ventas. ${progress.failed} fallaron.`}
      </p>

      <div className="mt-6 flex w-full max-w-xs flex-col gap-3">
        <div className="flex justify-between rounded-xl bg-content2 p-3 text-sm">
          <span className="text-default-500">Importadas</span>
          <span className="font-semibold text-success">{progress.succeeded}</span>
        </div>
        {hasFailures && (
          <div className="flex justify-between rounded-xl bg-content2 p-3 text-sm">
            <span className="text-default-500">Fallidas</span>
            <span className="font-semibold text-danger">{progress.failed}</span>
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {hasFailures && onExportFailed && (
          <button
            onClick={onExportFailed}
            className="flex items-center gap-2 rounded-xl bg-content2 px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-content3"
          >
            <Download size={16} />
            Exportar fallidas
          </button>
        )}
        {hasFailures && onRetry && (
          <button
            onClick={onRetry}
            disabled={isRetrying}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-600 disabled:opacity-50"
          >
            {isRetrying ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <RotateCcw size={16} />
            )}
            Reintentar fallidas
          </button>
        )}
        {!hasFailures && (
          <button
            onClick={onReset}
            className="flex items-center gap-2 rounded-xl bg-content2 px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-content3"
          >
            <RotateCcw size={16} />
            Importar más
          </button>
        )}
      </div>
    </div>
  );
}

export default BulkImportModal;
