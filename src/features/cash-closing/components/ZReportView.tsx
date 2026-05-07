import { Printer, Download, FileText, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Button } from '@heroui/button';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Chip } from '@heroui/chip';
import { ZReport } from '../types/cashClosing';
import { formatCurrency } from '@shared/utils/currency';
import { formatDate } from '@shared/utils/date';

interface ZReportViewProps {
  report: ZReport;
  onPrint?: () => void;
  onExport?: () => void;
}

export function ZReportView({ report, onPrint, onExport }: ZReportViewProps) {
  const { closing, paymentBreakdown, hourlyBreakdown, summary } = report;

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" />
            Z-Report
          </h2>
          <div className="text-default-500 mt-1 flex items-center gap-2">
            <span>Cierre #{closing.closingNumber}</span>
            <span>·</span>
            {getStatusChip(closing.status)}
          </div>
        </div>
        <div className="flex gap-2">
          {onPrint && (
            <Button variant="flat" onClick={onPrint}>
              <Printer className="w-4 h-4 mr-2" />
              Imprimir
            </Button>
          )}
          {onExport && (
            <Button variant="flat" onClick={onExport}>
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <p className="text-sm font-medium text-default-500">Total Ventas</p>
          </CardHeader>
          <CardBody>
            <div className="text-2xl font-bold">{formatCurrency(summary.totalSales)}</div>
            <p className="text-xs text-default-500 mt-1">{summary.totalOrders} órdenes</p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <p className="text-sm font-medium text-default-500">Esperado en Caja</p>
          </CardHeader>
          <CardBody>
            <div className="text-2xl font-bold">{formatCurrency(summary.expectedTotal)}</div>
            <p className="text-xs text-default-500 mt-1">Según transacciones</p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <p className="text-sm font-medium text-default-500">Real en Caja</p>
          </CardHeader>
          <CardBody>
            <div className="text-2xl font-bold">{formatCurrency(summary.actualTotal)}</div>
            <p className="text-xs text-default-500 mt-1">Conteo físico</p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <p className="text-sm font-medium text-default-500">Diferencia</p>
          </CardHeader>
          <CardBody>
            <div className={`text-2xl font-bold flex items-center gap-2 ${
              summary.discrepancy > 0 
                ? 'text-success' 
                : summary.discrepancy < 0 
                  ? 'text-danger' 
                  : 'text-default-600'
            }`}>
              {getDiscrepancyIcon(summary.discrepancy)}
              {formatCurrency(Math.abs(summary.discrepancy))}
            </div>
            <p className="text-xs text-default-500 mt-1">
              {summary.discrepancy > 0 
                ? 'Sobrante' 
                : summary.discrepancy < 0 
                  ? 'Faltante' 
                  : 'Cuadrado'}
            </p>
          </CardBody>
        </Card>
      </div>

      {/* Payment Methods Breakdown */}
      <Card>
        <CardHeader>
          <p className="text-lg font-semibold">Desglose por Método de Pago</p>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {Object.entries(paymentBreakdown).map(([method, data]) => {
              const methodLabels: Record<string, string> = {
                cash: 'Efectivo',
                card: 'Tarjeta',
                transfer: 'Transferencia',
                check: 'Cheque',
                other: 'Otro',
              };
              const methodColors: Record<string, string> = {
                cash: 'bg-success-100 text-success-800',
                card: 'bg-primary-100 text-primary-800',
                transfer: 'bg-secondary-100 text-secondary-800',
                check: 'bg-warning-100 text-warning-800',
                other: 'bg-default-100 text-default-800',
              };

              return (
                <div key={method} className={`p-4 rounded-lg ${methodColors[method]}`}>
                  <p className="text-sm font-medium opacity-80">{methodLabels[method]}</p>
                  <p className="text-xl font-bold mt-1">{formatCurrency(data.amount)}</p>
                  <p className="text-xs opacity-70 mt-1">{data.count} pagos</p>
                </div>
              );
            })}
          </div>
        </CardBody>
      </Card>

      {/* Hourly Breakdown */}
      {hourlyBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <p className="text-lg font-semibold">Ventas por Hora</p>
          </CardHeader>
          <CardBody>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4">Hora</th>
                    <th className="text-right py-2 px-4">Órdenes</th>
                    <th className="text-right py-2 px-4">Monto</th>
                    <th className="text-right py-2 px-4">Promedio</th>
                  </tr>
                </thead>
                <tbody>
                  {hourlyBreakdown.map((hour) => (
                    <tr key={hour.hour} className="border-b last:border-0">
                      <td className="py-2 px-4 font-medium">{hour.hour}</td>
                      <td className="py-2 px-4 text-right">{hour.orders}</td>
                      <td className="py-2 px-4 text-right">{formatCurrency(hour.amount)}</td>
                      <td className="py-2 px-4 text-right">
                        {formatCurrency(hour.orders > 0 ? hour.amount / hour.orders : 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Expected vs Actual Table */}
      {closing.status === 'closed' && (
        <Card>
          <CardHeader>
            <p className="text-lg font-semibold">Detalle de Cierre</p>
          </CardHeader>
          <CardBody>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4">Método</th>
                    <th className="text-right py-2 px-4">Esperado</th>
                    <th className="text-right py-2 px-4">Real</th>
                    <th className="text-right py-2 px-4">Diferencia</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { key: 'cash', label: 'Efectivo' },
                    { key: 'card', label: 'Tarjeta' },
                    { key: 'transfer', label: 'Transferencia' },
                    { key: 'check', label: 'Cheque' },
                    { key: 'other', label: 'Otro' },
                  ].map(({ key, label }) => {
                    const expected = closing[`expected${key.charAt(0).toUpperCase() + key.slice(1)}` as keyof typeof closing] as number;
                    const actual = closing[`actual${key.charAt(0).toUpperCase() + key.slice(1)}` as keyof typeof closing] as number;
                    const discrepancy = closing[`discrepancy${key.charAt(0).toUpperCase() + key.slice(1)}` as keyof typeof closing] as number;

                    return (
                      <tr key={key} className="border-b last:border-0">
                        <td className="py-2 px-4 font-medium">{label}</td>
                        <td className="py-2 px-4 text-right">{formatCurrency(expected || 0)}</td>
                        <td className="py-2 px-4 text-right">{formatCurrency(actual || 0)}</td>
                        <td className={`py-2 px-4 text-right font-medium ${
                          discrepancy > 0 
                            ? 'text-success' 
                            : discrepancy < 0 
                              ? 'text-danger' 
                              : 'text-default-400'
                        }`}>
                          {discrepancy ? `${discrepancy > 0 ? '+' : ''}${formatCurrency(discrepancy)}` : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="font-bold bg-default-100">
                  <tr>
                    <td className="py-2 px-4">TOTAL</td>
                    <td className="py-2 px-4 text-right">{formatCurrency(closing.expectedTotal)}</td>
                    <td className="py-2 px-4 text-right">{formatCurrency(closing.actualTotal || 0)}</td>
                    <td className={`py-2 px-4 text-right ${
                      closing.discrepancyTotal && closing.discrepancyTotal > 0 
                        ? 'text-success' 
                        : closing.discrepancyTotal && closing.discrepancyTotal < 0 
                          ? 'text-danger' 
                          : ''
                    }`}>
                      {closing.discrepancyTotal 
                        ? `${closing.discrepancyTotal > 0 ? '+' : ''}${formatCurrency(closing.discrepancyTotal)}`
                        : '-'}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Notes */}
            {closing.notes && (
              <div className="mt-4 p-3 bg-default-100 rounded-lg">
                <p className="text-sm font-medium text-default-700">Notas del cierre:</p>
                <p className="text-sm text-default-600 mt-1">{closing.notes}</p>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* Footer Info */}
      <div className="text-sm text-default-500 border-t pt-4">
        <p>Abierto: {formatDate(closing.openedAt)} por {closing.openedBy?.fullName || 'N/A'}</p>
        {closing.closedAt && (
          <p>Cerrado: {formatDate(closing.closedAt)} por {closing.closedBy?.fullName || 'N/A'}</p>
        )}
        {closing.reopenedAt && (
          <p className="text-warning">
            Reabierto: {formatDate(closing.reopenedAt)} por {closing.reopenedBy?.fullName || 'N/A'}
            {closing.reopenReason && ` - Motivo: ${closing.reopenReason}`}
          </p>
        )}
      </div>
    </div>
  );
}
