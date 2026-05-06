import { useState, useMemo } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
} from "@heroui/table";
import { Chip } from "@heroui/chip";
import { Tooltip } from "@heroui/tooltip";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { ValidatedRow } from "@shared/types/bulkImport";
import { formatCurrency } from "@shared/utils/currency";

interface ImportPreviewTableProps {
  rows: ValidatedRow[];
  pageSize?: number;
}

const STATUS_CONFIG = {
  valid: {
    icon: CheckCircle2,
    color: "success" as const,
    label: "Válida",
  },
  invalid: {
    icon: XCircle,
    color: "danger" as const,
    label: "Error",
  },
  warning: {
    icon: AlertTriangle,
    color: "warning" as const,
    label: "Advertencia",
  },
};

export function ImportPreviewTable({
  rows,
  pageSize = 10,
}: ImportPreviewTableProps) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(rows.length / pageSize);
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return rows.slice(start, start + pageSize);
  }, [rows, currentPage, pageSize]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatPrice = (price?: number) => {
    if (price === undefined || price === null) return "-";
    return formatCurrency(price, "ARS");
  };

  const getStatusChip = (row: ValidatedRow) => {
    const config = STATUS_CONFIG[row.status];
    const Icon = config.icon;

    return (
      <Tooltip
        content={
          row.errors.length > 0
            ? row.errors.join(", ")
            : row.warnings.length > 0
              ? row.warnings.join(", ")
              : "Fila válida"
        }
        placement="top"
      >
        <div className="flex items-center gap-1.5">
          <Icon
            size={16}
            className={
              row.status === "valid"
                ? "text-success"
                : row.status === "invalid"
                  ? "text-danger"
                  : "text-warning"
            }
          />
          <Chip
            size="sm"
            variant="flat"
            color={config.color}
            className="text-xs"
          >
            {config.label}
          </Chip>
        </div>
      </Tooltip>
    );
  };

  const getClientCell = (row: ValidatedRow) => {
    const clientName = row.row.clienteName;
    const clientInfo = row.isNewClient
      ? "Nuevo cliente"
      : row.clientId
        ? "Cliente existente"
        : "Sin identificar";

    return (
      <div className="flex flex-col">
        <span className="truncate font-medium">{clientName}</span>
        {row.row.clientePhone && (
          <span className="text-xs text-default-400">
            {row.row.clientePhone}
          </span>
        )}
        <Chip size="sm" variant="flat" color="default" className="mt-1 w-fit text-[10px]">
          {clientInfo}
        </Chip>
      </div>
    );
  };

  const getProductCell = (row: ValidatedRow) => {
    const displayName = row.productName || row.row.productoQuery;
    const hasError = row.errors.some((e) =>
      e.toLowerCase().includes("producto"),
    );

    return (
      <div className="flex flex-col">
        <span
          className={`truncate ${hasError ? "text-danger line-through" : ""}`}
        >
          {displayName}
        </span>
        {row.productId && !hasError && (
          <span className="text-xs text-success">Encontrado</span>
        )}
        {hasError && <span className="text-xs text-danger">No encontrado</span>}
      </div>
    );
  };

  const getErrorTooltip = (row: ValidatedRow) => {
    if (row.errors.length === 0 && row.warnings.length === 0) return null;

    const messages = [...row.errors, ...row.warnings];
    return (
      <Tooltip
        content={
          <ul className="list-disc space-y-1 pl-4">
            {messages.map((msg, idx) => (
              <li key={idx} className="text-xs">
                {msg}
              </li>
            ))}
          </ul>
        }
        placement="left"
      >
        <div className="cursor-help">
          {row.status === "invalid" ? (
            <XCircle size={16} className="text-danger" />
          ) : (
            <AlertTriangle size={16} className="text-warning" />
          )}
        </div>
      </Tooltip>
    );
  };

  return (
    <div className="space-y-3">
      <div className="max-h-[400px] overflow-auto rounded-2xl border border-divider">
        <Table
          aria-label="Tabla de vista previa de importación"
          removeWrapper
          classNames={{
            base: "min-w-full",
            th: "bg-content2 text-default-600 text-xs font-semibold",
            td: "text-sm py-3",
          }}
        >
          <TableHeader>
            <TableColumn className="w-16 text-center">#</TableColumn>
            <TableColumn>Fecha</TableColumn>
            <TableColumn>Cliente</TableColumn>
            <TableColumn>Producto</TableColumn>
            <TableColumn className="text-center">Cant.</TableColumn>
            <TableColumn className="text-right">Precio</TableColumn>
            <TableColumn className="text-center">Estado</TableColumn>
          </TableHeader>
          <TableBody emptyContent="No hay filas para mostrar">
            {paginatedRows.map((row) => (
              <TableRow
                key={row.row.rowNumber}
                className={
                  row.status === "invalid"
                    ? "bg-danger/5"
                    : row.status === "warning"
                      ? "bg-warning/5"
                      : ""
                }
              >
                <TableCell className="text-center text-default-400">
                  {row.row.rowNumber}
                </TableCell>
                <TableCell>{formatDate(row.row.fecha)}</TableCell>
                <TableCell>{getClientCell(row)}</TableCell>
                <TableCell>{getProductCell(row)}</TableCell>
                <TableCell className="text-center font-medium">
                  {row.row.cantidad}
                </TableCell>
                <TableCell className="text-right">
                  {formatPrice(row.row.precioUnitario)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-center gap-2">
                    {getStatusChip(row)}
                    {getErrorTooltip(row)}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-default-500">
            Mostrando {(currentPage - 1) * pageSize + 1} -{" "}
            {Math.min(currentPage * pageSize, rows.length)} de {rows.length} filas
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-divider text-default-600 transition-colors hover:bg-content2 disabled:opacity-40"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="min-w-[3rem] text-center text-sm">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-divider text-default-600 transition-colors hover:bg-content2 disabled:opacity-40"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
