import { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Table,
  Ban,
} from 'lucide-react';
import { Button } from '@heroui/button';
import { Chip } from '@heroui/chip';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
} from '@heroui/modal';
import { usePreviewCsv, useImportCsv } from '../hooks/useBanking';
import { formatCurrency } from '@shared/utils/currency';
import type { CsvPreviewData, CsvImportData } from '../types/banking';

type WizardStep = 'upload' | 'preview' | 'confirm' | 'result';

interface CsvImportWizardProps {
  accountId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function CsvImportWizard({ accountId, isOpen, onClose }: CsvImportWizardProps) {
  const [step, setStep] = useState<WizardStep>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [previewData, setPreviewData] = useState<CsvPreviewData | null>(null);
  const [importResult, setImportResult] = useState<CsvImportData | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const previewMutation = usePreviewCsv(accountId);
  const importMutation = useImportCsv(accountId);

  const handleFileSelect = (selectedFile: File | null) => {
    if (!selectedFile) return;

    // Validate file type
    const isValid =
      selectedFile.type === 'text/csv' ||
      selectedFile.type === 'application/vnd.ms-excel' ||
      selectedFile.name.toLowerCase().endsWith('.csv');

    if (!isValid) {
      alert('Por favor seleccioná un archivo CSV válido');
      return;
    }

    // Validate size (10MB max)
    if (selectedFile.size > 10 * 1024 * 1024) {
      alert('El archivo es demasiado grande. Tamaño máximo: 10MB');
      return;
    }

    setFile(selectedFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    handleFileSelect(droppedFile);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleNextToPreview = async () => {
    if (!file) return;

    try {
      const result = await previewMutation.mutateAsync(file);
      setPreviewData(result);
      setStep('preview');
    } catch {
      // Error is handled by the mutation
    }
  };

  const handleConfirmImport = async () => {
    if (!file) return;

    try {
      const result = await importMutation.mutateAsync(file);
      setImportResult(result);
      setStep('result');
    } catch {
      // Error is handled by the mutation
    }
  };

  const handleClose = () => {
    // Reset state
    setStep('upload');
    setFile(null);
    setPreviewData(null);
    setImportResult(null);
    onClose();
  };

  const handleBack = () => {
    if (step === 'preview') {
      setStep('upload');
    } else if (step === 'confirm') {
      setStep('preview');
    }
  };

  // Validation state for step buttons
  const isUploadComplete = !!file;
  const isImporting = importMutation.isPending;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="2xl" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader className="flex items-center gap-2">
          <Upload className="w-5 h-5 text-primary" />
          Importar CSV
        </ModalHeader>
        <ModalBody className="pb-6">
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {(['upload', 'preview', 'confirm', 'result'] as WizardStep[]).map(
              (s, idx) => (
                <div key={s} className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      step === s
                        ? 'bg-primary text-white'
                        : ['preview', 'confirm', 'result'].indexOf(step) >= idx
                          ? 'bg-success/20 text-success'
                          : 'bg-default-100 text-default-400'
                    }`}
                  >
                    {['preview', 'confirm', 'result'].indexOf(step) >= idx &&
                    step !== s ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      idx + 1
                    )}
                  </div>
                  {idx < 3 && (
                    <div
                      className={`w-8 h-0.5 ${
                        ['preview', 'confirm', 'result'].indexOf(step) > idx
                          ? 'bg-success'
                          : 'bg-default-200'
                      }`}
                    />
                  )}
                </div>
              ),
            )}
          </div>

          {/* Step 1: Upload */}
          {step === 'upload' && (
            <div className="space-y-4">
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
                  dragOver
                    ? 'border-primary bg-primary/5'
                    : file
                      ? 'border-success bg-success/5'
                      : 'border-default-300 hover:border-primary hover:bg-default-50'
                }`}
              >
                {file ? (
                  <div className="flex flex-col items-center gap-2">
                    <FileText className="w-12 h-12 text-success" />
                    <p className="font-medium text-foreground">{file.name}</p>
                    <p className="text-sm text-default-500">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                    <Button
                      variant="light"
                      size="sm"
                      onPress={() => {
                        setFile(null);
                        // Open file picker after clearing selection
                        setTimeout(() => fileInputRef.current?.click(), 0);
                      }}
                    >
                      Cambiar archivo
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="w-12 h-12 text-default-300" />
                    <p className="font-medium text-foreground">
                      Soltá tu archivo CSV aquí o hacé clic para seleccionarlo
                    </p>
                    <p className="text-sm text-default-400">
                      Formatos soportados: BBVA, Galicia, Santander, Nación
                    </p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
                />
              </div>

              <div className="flex justify-between pt-2">
                <Button variant="flat" onPress={handleClose}>
                  Cancelar
                </Button>
                <Button
                  color="primary"
                  onPress={handleNextToPreview}
                  isDisabled={!isUploadComplete || previewMutation.isPending}
                >
                  {previewMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analizando...
                    </>
                  ) : (
                    <>
                      Vista Previa
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </Button>
              </div>

              {previewMutation.error && (
                <div className="flex items-center gap-2 p-3 bg-danger/10 text-danger rounded-lg text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>
                    {(previewMutation.error as any)?.response?.data?.error?.message ||
                      'Error al procesar el archivo. Verificá que sea un CSV válido.'}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Preview */}
          {step === 'preview' && previewData && (
            <div className="space-y-4">
              {/* Bank detection */}
              <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg">
                <Table className="w-5 h-5 text-primary" />
                <span className="text-sm">
                  Banco detectado:{' '}
                  <strong>{previewData.detectedBank}</strong>
                </span>
                <Chip size="sm" variant="flat" className="ml-auto">
                  {previewData.totalRows} filas totales
                </Chip>
              </div>

              {/* Summary */}
              <div className="flex gap-3">
                <div className="flex-1 p-3 bg-success/5 rounded-lg text-center">
                  <p className="text-2xl font-bold text-success">
                    {previewData.validRows.length}
                  </p>
                  <p className="text-xs text-default-500">Filas válidas</p>
                </div>
                <div className="flex-1 p-3 bg-danger/5 rounded-lg text-center">
                  <p className="text-2xl font-bold text-danger">
                    {previewData.errorRows.length}
                  </p>
                  <p className="text-xs text-default-500">Filas con errores</p>
                </div>
              </div>

              {/* Valid rows table (first 20) */}
              {previewData.validRows.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">
                    Vista previa de las primeras{' '}
                    {Math.min(20, previewData.validRows.length)} filas válidas
                  </p>
                  <div className="overflow-x-auto border rounded-lg">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-default-50 border-b">
                          <th className="text-left py-2 px-3 text-default-500 font-medium">
                            #
                          </th>
                          <th className="text-left py-2 px-3 text-default-500 font-medium">
                            Fecha
                          </th>
                          <th className="text-left py-2 px-3 text-default-500 font-medium">
                            Descripción
                          </th>
                          <th className="text-right py-2 px-3 text-default-500 font-medium">
                            Monto
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {previewData.validRows.slice(0, 20).map((row, idx) => (
                          <tr key={idx} className="border-b last:border-b-0">
                            <td className="py-2 px-3 text-default-400">
                              {idx + 1}
                            </td>
                            <td className="py-2 px-3 whitespace-nowrap">
                              {row.date}
                            </td>
                            <td className="py-2 px-3 max-w-xs truncate">
                              {row.description}
                            </td>
                            <td
                              className={`py-2 px-3 text-right font-medium whitespace-nowrap ${
                                row.type === 'debit'
                                  ? 'text-danger'
                                  : 'text-success'
                              }`}
                            >
                              {row.type === 'debit' ? '-' : '+'}
                              {formatCurrency(row.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Error rows */}
              {previewData.errorRows.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-danger mb-2">
                    {previewData.errorRows.length} filas con errores (serán omitidas)
                  </p>
                  <div className="space-y-1">
                    {previewData.errorRows.slice(0, 5).map((errRow, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2 p-2 bg-danger/5 rounded-lg text-sm"
                      >
                        <XCircle className="w-4 h-4 text-danger shrink-0 mt-0.5" />
                        <div>
                          <span className="text-default-500">
                            Fila {errRow.rowNumber}:{' '}
                          </span>
                          <span className="text-danger">
                            {errRow.errors.join(', ')}
                          </span>
                        </div>
                      </div>
                    ))}
                    {previewData.errorRows.length > 5 && (
                      <p className="text-xs text-default-400 pl-6">
                        ...y {previewData.errorRows.length - 5} filas más con errores
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-2">
                <Button variant="flat" onPress={handleBack}>
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Volver
                </Button>
                <Button
                  color="primary"
                  onPress={() => setStep('confirm')}
                  isDisabled={previewData.validRows.length === 0}
                >
                  Continuar
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Confirm */}
          {step === 'confirm' && previewData && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-4 bg-primary/5 rounded-lg">
                <AlertCircle className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium text-foreground">¿Confirmar importación?</p>
                  <p className="text-sm text-default-500">
                    Se van a importar los datos del archivo CSV a tu cuenta bancaria
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-default-500">Banco detectado</span>
                  <span className="font-medium">{previewData.detectedBank}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-default-500">Total de filas</span>
                  <span className="font-medium">{previewData.totalRows}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-default-500">Filas a importar</span>
                  <span className="font-medium text-success">
                    {previewData.validRows.length}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-default-500">Filas con errores</span>
                  <span className="font-medium text-danger">
                    {previewData.errorRows.length}
                  </span>
                </div>
                {previewData.errorRows.length > 0 && (
                  <p className="text-xs text-default-400">
                    Las filas con errores serán omitidas. Solo se importarán las filas
                    válidas.
                  </p>
                )}
              </div>

              <div className="flex justify-between pt-2">
                <Button variant="flat" onPress={handleBack} isDisabled={isImporting}>
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Volver
                </Button>
                <div className="flex gap-2">
                  <Button variant="flat" onPress={handleClose} isDisabled={isImporting}>
                    Cancelar
                  </Button>
                  <Button
                    color="primary"
                    onPress={handleConfirmImport}
                    isDisabled={previewData.validRows.length === 0 || isImporting}
                  >
                    {isImporting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Importando...
                      </>
                    ) : (
                      'Confirmar Importación'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Result */}
          {step === 'result' && importResult && (
            <div className="space-y-4">
              {/* Success banner */}
              <div className="flex items-center gap-3 p-4 bg-success/10 rounded-lg">
                <CheckCircle2 className="w-8 h-8 text-success shrink-0" />
                <div>
                  <p className="font-medium text-foreground">
                    Importación completada
                  </p>
                  <p className="text-sm text-default-500">{importResult.message}</p>
                </div>
              </div>

              {/* Summary */}
              <div className="flex gap-3">
                <div className="flex-1 p-3 bg-success/5 rounded-lg text-center">
                  <p className="text-2xl font-bold text-success">
                    {importResult.created}
                  </p>
                  <p className="text-xs text-default-500">Transacciones importadas</p>
                </div>
                <div className="flex-1 p-3 bg-default-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-default-600">
                    {importResult.totalRows}
                  </p>
                  <p className="text-xs text-default-500">Filas totales</p>
                </div>
                <div className="flex-1 p-3 rounded-lg text-center"
                  style={importResult.errors.length > 0 ? { backgroundColor: 'rgba(220, 38, 38, 0.05)' } : undefined}
                >
                  <p className={`text-2xl font-bold ${importResult.errors.length > 0 ? 'text-danger' : 'text-default-400'}`}>
                    {importResult.errors.length}
                  </p>
                  <p className="text-xs text-default-500">Filas omitidas</p>
                </div>
              </div>

              {/* Error details */}
              {importResult.errors.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-danger mb-2">
                    Detalle de filas omitidas
                  </p>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {importResult.errors.map((errRow, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2 p-2 bg-danger/5 rounded-lg text-sm"
                      >
                        <Ban className="w-4 h-4 text-danger shrink-0 mt-0.5" />
                        <div>
                          <span className="text-default-500">
                            Fila {errRow.rowNumber}:{' '}
                          </span>
                          <span className="text-danger">
                            {errRow.errors.join(', ')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <Button color="primary" onPress={handleClose}>
                  Finalizar
                </Button>
              </div>
            </div>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
