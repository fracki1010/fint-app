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
} from "lucide-react";

import { useBulkSalesImport } from "@features/sales/hooks/useBulkSalesImport";
import { ImportStatus } from "@features/sales/stores/bulkImportStore";
import { ImportPreviewTable } from "./ImportPreviewTable";
import { ImportProgress } from "./ImportProgress";
import { useAppToast } from "@features/notifications/components/AppToast";

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
    reset,
    status,
    progress,
    validRowCount,
    invalidRowCount,
    validatedRows,
    errorMessage,
    isProcessing,
  } = useBulkSalesImport();

  const { showToast } = useAppToast();
  const [parseError, setParseError] = useState<string | null>(null);

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
    const result = await importRows();

    if (result.success) {
      showToast({
        variant: "success",
        message: `Se importaron ${result.imported} ventas correctamente.`,
      });
    } else {
      showToast({
        variant: "warning",
        message: `Importación parcial: ${result.imported} importadas, ${result.failed} fallidas.`,
      });
    }
  }, [importRows, showToast]);

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
            isLoading={status === "parsing"}
            error={parseError || errorMessage}
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
            onClose={handleClose}
            onReset={handleReset}
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
                isLoading={status === "parsing"}
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
            <HeroButton color="primary" onPress={handleClose}>
              Cerrar
            </HeroButton>
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
  isLoading: boolean;
  error: string | null;
}

function InputStep({ rawText, onChange, isLoading, error }: InputStepProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-dashed border-divider bg-content2/30 p-4">
        <div className="mb-3 flex items-center gap-2 text-sm text-default-600">
          <Upload size={16} />
          <span className="font-medium">Pegá tu CSV o TSV aquí</span>
        </div>

        <textarea
          className="corp-input min-h-[200px] w-full resize-none font-mono text-xs"
          placeholder={`fecha,cliente,producto,cantidad,precio_unitario,metodo_pago,notas
15/01/2024,Juan Pérez,Producto A,2,100,Efectivo,Nota opcional
16/01/2024,María García,1234567890123,1,,Tarjeta,`}
          value={rawText}
          onChange={(e) => onChange(e.target.value)}
          disabled={isLoading}
        />

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
              <strong>cliente:</strong> Nombre o "Nombre,Teléfono"
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
  onClose: () => void;
  onReset: () => void;
}

function CompleteStep({ progress, onClose, onReset }: CompleteStepProps) {
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
          <AlertCircle size={32} className="text-warning" />
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

      <div className="mt-6 flex gap-3">
        {hasFailures && (
          <button
            onClick={onReset}
            className="flex items-center gap-2 rounded-xl bg-content2 px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-content3"
          >
            <RotateCcw size={16} />
            Intentar de nuevo
          </button>
        )}
      </div>
    </div>
  );
}
