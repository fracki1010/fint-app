import { useState } from 'react';
import {
  Plus,
  Lock,
  Unlock,
  History,
  FileText,
  Loader2,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import { Button } from '@heroui/button';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Chip } from '@heroui/chip';
import { Modal, ModalContent, ModalBody } from '@heroui/modal';
import {
  useCurrentClosing,
  useClosings,
  useOpenClosing,
  useCloseClosing,
  useZReport,
  useOpenClosingPreview,
} from '../hooks/useCashClosing';
import { OpenClosingModal } from '../components/OpenClosingModal';
import { CloseClosingModal } from '../components/CloseClosingModal';
import { ZReportView } from '../components/ZReportView';
import { formatCurrency } from '@shared/utils/currency';
import { formatDate } from '@shared/utils/date';
import { CashClosing } from '../types/cashClosing';

export default function CashClosingPage() {
  // Hooks
  const { closing: currentClosing, hasOpenClosing, loading: loadingCurrent, refetch: refetchCurrent } = useCurrentClosing();
  const { closings, loading: loadingClosings, refetch: refetchClosings } = useClosings({ page: 1, limit: 10 });
  const { openClosing, isOpening } = useOpenClosing();
  const { closeClosing, isClosing } = useCloseClosing();

  // Local state
  const [isOpenModalOpen, setIsOpenModalOpen] = useState(false);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [selectedClosing, setSelectedClosing] = useState<CashClosing | null>(null);
  const [isZReportOpen, setIsZReportOpen] = useState(false);

  // Z-Report data for selected closing (historical - when viewing past closings)
  const { report: zReport, loading: loadingZReport } = useZReport(selectedClosing?._id || '');
  
  // Preview data for current open closing (shows live orders in real-time)
  const { preview: currentPreview, loading: loadingCurrentPreview, refetch: refetchCurrentPreview } = useOpenClosingPreview(hasOpenClosing);

  // Calculate expected amounts for current closing
  const calculateExpectedAmounts = () => {
    if (!currentClosing) return null;
    
    // If closing is already closed, use stored values
    if (currentClosing.status === 'closed') {
      return {
        cash: currentClosing.expectedCash,
        card: currentClosing.expectedCard,
        transfer: currentClosing.expectedTransfer,
        check: currentClosing.expectedCheck,
        other: currentClosing.expectedOther,
        total: currentClosing.expectedTotal,
      };
    }

    // For open closing, use real-time preview data
    if (currentPreview) {
      return {
        cash: currentPreview.paymentBreakdown.cash.amount,
        card: currentPreview.paymentBreakdown.card.amount,
        transfer: currentPreview.paymentBreakdown.transfer.amount,
        check: currentPreview.paymentBreakdown.check.amount,
        other: currentPreview.paymentBreakdown.other.amount,
        total: currentPreview.summary.expectedTotal,
      };
    }

    return {
      cash: 0,
      card: 0,
      transfer: 0,
      check: 0,
      other: 0,
      total: 0,
    };
  };

  // Handlers
  const handleOpen = async (notes?: string) => {
    try {
      await openClosing({ notes });
      setIsOpenModalOpen(false);
      refetchCurrent();
      refetchClosings();
    } catch (error) {
      console.error('Error opening closing:', error);
    }
  };

  const handleClose = async (amounts: { cash: number; card: number; transfer: number; check: number; other: number }, notes?: string) => {
    if (!currentClosing) return;
    
    try {
      await closeClosing({ 
        closingId: currentClosing._id, 
        data: { actualAmounts: amounts, notes } 
      });
      setIsCloseModalOpen(false);
      refetchCurrent();
      refetchClosings();
    } catch (error) {
      console.error('Error closing closing:', error);
    }
  };

  const handleViewReport = (closing: CashClosing) => {
    setSelectedClosing(closing);
    setIsZReportOpen(true);
  };

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'open':
        return <Chip color="warning" variant="flat">Abierto</Chip>;
      case 'closed':
        return <Chip color="success" variant="flat">Cerrado</Chip>;
      case 'reopened':
        return <Chip color="danger" variant="flat">Reabierto</Chip>;
      default:
        return <Chip>{status}</Chip>;
    }
  };

  const getDiscrepancyIcon = (value: number) => {
    if (value > 0) return <TrendingUp className="w-4 h-4 text-success" />;
    if (value < 0) return <TrendingDown className="w-4 h-4 text-danger" />;
    return <Minus className="w-4 h-4 text-default-400" />;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-content1 border-b px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Cierre de Caja</h1>
            <p className="text-sm text-default-500 mt-1">
              Gestiona los cierres de caja y genera reportes Z
            </p>
          </div>
          <div className="flex gap-2">
            {hasOpenClosing ? (
              <Button onClick={() => setIsCloseModalOpen(true)} color="danger">
                <Lock className="w-4 h-4 mr-2" />
                Cerrar Caja
              </Button>
            ) : (
              <Button onClick={() => setIsOpenModalOpen(true)} color="primary">
                <Plus className="w-4 h-4 mr-2" />
                Abrir Caja
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Current Status Card */}
        <Card>
          <CardHeader>
            <p className="text-lg font-semibold flex items-center gap-2">
              {hasOpenClosing ? (
                <Unlock className="w-5 h-5 text-success" />
              ) : (
                <Lock className="w-5 h-5 text-default-400" />
              )}
              Estado Actual
            </p>
          </CardHeader>
          <CardBody>
            {loadingCurrent ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-default-400" />
              </div>
            ) : hasOpenClosing && currentClosing ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-default-500">Caja Actual</p>
                  <p className="text-xl font-bold">#{currentClosing.closingNumber}</p>
                  <p className="text-sm text-default-500 mt-1">
                    Abierta el {formatDate(currentClosing.openedAt)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-default-500">Abierta por</p>
                  <p className="text-lg font-medium">{currentClosing.openedBy?.fullName}</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <AlertCircle className="w-12 h-12 text-default-300 mb-3" />
                <p className="text-default-500 font-medium">No hay caja abierta</p>
                <p className="text-sm text-default-400 mt-1">
                  Abrí una caja para comenzar a registrar ventas
                </p>
                <Button className="mt-4" color="primary" onClick={() => setIsOpenModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Abrir Caja
                </Button>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Current Period Orders */}
        {hasOpenClosing && currentClosing && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <p className="text-lg font-semibold flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Ventas del Período Actual
                </p>
                <Button 
                  variant="light" 
                  size="sm" 
                  onClick={() => refetchCurrentPreview()}
                  isLoading={loadingCurrentPreview}
                >
                  Actualizar
                </Button>
              </div>
            </CardHeader>
            <CardBody>
              {loadingCurrentPreview ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-default-400" />
                </div>
              ) : !currentPreview || currentPreview.orders.length === 0 ? (
                <div className="text-center py-8 text-default-500">
                  <FileText className="w-12 h-12 text-default-300 mx-auto mb-3" />
                  <p>No hay ventas en este período</p>
                  <p className="text-sm text-default-400 mt-1">
                    Las ventas que hagas ahora se mostrarán aquí
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Summary */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="p-3 bg-default-100 rounded-lg">
                      <p className="text-xs text-default-500">Total Órdenes</p>
                      <p className="text-xl font-bold">{currentPreview.summary.totalOrders}</p>
                    </div>
                    <div className="p-3 bg-default-100 rounded-lg">
                      <p className="text-xs text-default-500">Total Ventas</p>
                      <p className="text-xl font-bold">{formatCurrency(currentPreview.summary.totalSales)}</p>
                    </div>
                    <div className="p-3 bg-default-100 rounded-lg">
                      <p className="text-xs text-default-500">Efectivo</p>
                      <p className="text-xl font-bold">{formatCurrency(currentPreview.paymentBreakdown.cash.amount)}</p>
                    </div>
                    <div className="p-3 bg-default-100 rounded-lg">
                      <p className="text-xs text-default-500">Tarjeta</p>
                      <p className="text-xl font-bold">{formatCurrency(currentPreview.paymentBreakdown.card.amount)}</p>
                    </div>
                  </div>

                  {/* Orders Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-4 font-medium text-default-700">Orden</th>
                          <th className="text-left py-2 px-4 font-medium text-default-700">Cliente</th>
                          <th className="text-left py-2 px-4 font-medium text-default-700">Fecha</th>
                          <th className="text-right py-2 px-4 font-medium text-default-700">Total</th>
                          <th className="text-center py-2 px-4 font-medium text-default-700">Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentPreview.orders.slice(0, 10).map((order) => (
                          <tr key={order._id} className="border-b last:border-0 hover:bg-default-50">
                            <td className="py-2 px-4 font-medium">#{order.orderNumber || order._id.slice(-6)}</td>
                            <td className="py-2 px-4 text-default-600">
                              {order.client?.name || order.client?.phone || 'Consumidor final'}
                            </td>
                            <td className="py-2 px-4 text-default-600">
                              {formatDate(order.createdAt)}
                            </td>
                            <td className="py-2 px-4 text-right font-medium">
                              {formatCurrency(order.totalAmount)}
                            </td>
                            <td className="py-2 px-4 text-center">
                              <Chip 
                                size="sm" 
                                color={order.paymentStatus === 'Pagado' ? 'success' : order.paymentStatus === 'Parcial' ? 'warning' : 'default'}
                                variant="flat"
                              >
                                {order.paymentStatus}
                              </Chip>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {currentPreview.orders.length > 10 && (
                      <p className="text-center text-sm text-default-400 mt-3">
                        Y {currentPreview.orders.length - 10} órdenes más...
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardBody>
          </Card>
        )}

        {/* Historical Closings */}
        <Card>
          <CardHeader>
            <p className="text-lg font-semibold flex items-center gap-2">
              <History className="w-5 h-5" />
              Historial de Cierres
            </p>
          </CardHeader>
          <CardBody>
            {loadingClosings ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-default-400" />
              </div>
            ) : closings.length === 0 ? (
              <div className="text-center py-8 text-default-500">
                <History className="w-12 h-12 text-default-300 mx-auto mb-3" />
                <p>No hay cierres registrados</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-default-700">Número</th>
                      <th className="text-left py-3 px-4 font-medium text-default-700">Estado</th>
                      <th className="text-left py-3 px-4 font-medium text-default-700">Apertura</th>
                      <th className="text-left py-3 px-4 font-medium text-default-700">Cierre</th>
                      <th className="text-right py-3 px-4 font-medium text-default-700">Ventas</th>
                      <th className="text-right py-3 px-4 font-medium text-default-700">Diferencia</th>
                      <th className="text-center py-3 px-4 font-medium text-default-700">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {closings.map((closing) => (
                      <tr key={closing._id} className="border-b last:border-0 hover:bg-default-100">
                        <td className="py-3 px-4 font-medium">{closing.closingNumber}</td>
                        <td className="py-3 px-4">{getStatusChip(closing.status)}</td>
                        <td className="py-3 px-4 text-default-600">
                          {formatDate(closing.openedAt)}
                        </td>
                        <td className="py-3 px-4 text-default-600">
                          {closing.closedAt ? formatDate(closing.closedAt) : '-'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {formatCurrency(closing.totalSales)}
                        </td>
                        <td className="py-3 px-4">
                          {closing.status === 'closed' ? (
                            <div className={`flex items-center justify-end gap-1 ${
                              (closing.discrepancyTotal || 0) > 0 
                                ? 'text-success' 
                                : (closing.discrepancyTotal || 0) < 0 
                                  ? 'text-danger' 
                                  : 'text-default-400'
                            }`}>
                              {getDiscrepancyIcon(closing.discrepancyTotal || 0)}
                              <span>
                                {closing.discrepancyTotal 
                                  ? formatCurrency(Math.abs(closing.discrepancyTotal))
                                  : '-'}
                              </span>
                            </div>
                          ) : (
                            <span className="text-default-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {closing.status === 'closed' || closing.status === 'reopened' ? (
                            <Button
                              variant="light"
                              size="sm"
                              onClick={() => handleViewReport(closing)}
                            >
                              <FileText className="w-4 h-4" />
                            </Button>
                          ) : (
                            <span className="text-default-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Modals */}
      <OpenClosingModal
        isOpen={isOpenModalOpen}
        onClose={() => setIsOpenModalOpen(false)}
        onOpen={handleOpen}
        isOpening={isOpening}
      />

      <CloseClosingModal
        isOpen={isCloseModalOpen}
        onClose={() => setIsCloseModalOpen(false)}
        onCloseSubmit={handleClose}
        isClosing={isClosing}
        closing={currentClosing || null}
        expectedAmounts={calculateExpectedAmounts()}
      />

      {/* Z-Report Modal */}
      <Modal
        isOpen={isZReportOpen}
        onClose={() => {
          setIsZReportOpen(false);
          setSelectedClosing(null);
        }}
        size="4xl"
      >
        <ModalContent>
          <ModalBody className="p-6">
            {loadingZReport ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-default-400" />
              </div>
            ) : zReport ? (
              <ZReportView
                report={zReport}
                onPrint={() => window.print()}
              />
            ) : (
              <div className="text-center py-12 text-default-500">
                <AlertCircle className="w-12 h-12 text-default-300 mx-auto mb-3" />
                <p>No se pudo cargar el reporte</p>
              </div>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
}
