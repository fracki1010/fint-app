import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { ClientAccountEntry, ClientEntryType } from "@shared/types";
import { formatCurrency } from "@shared/utils/currency";

const ENTRY_TYPE_LABELS: Record<ClientEntryType, string> = {
  CHARGE: "Cargo",
  PAYMENT: "Cobro",
  CREDIT_NOTE: "Nota de Crédito",
  DEBIT_NOTE: "Nota de Débito",
};

interface ExportAccountToPDFParams {
  entries: ClientAccountEntry[];
  clientName: string;
  balance: number;
  currency: string;
  filters?: {
    dateFrom?: string;
    dateTo?: string;
    types?: string[];
  };
}

export function exportAccountToPDF({
  entries,
  clientName,
  balance,
  currency,
  filters,
}: ExportAccountToPDFParams) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFontSize(20);
  doc.setTextColor(217, 119, 6); // Primary color
  doc.text("Cuenta Corriente", 14, 20);

  doc.setFontSize(12);
  doc.setTextColor(60, 60, 60);
  doc.text(clientName, 14, 30);

  // Balance box
  doc.setFillColor(255, 247, 237); // Light orange background
  doc.roundedRect(14, 38, 80, 25, 3, 3, "F");
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text("Saldo actual", 18, 48);
  doc.setFontSize(16);
  doc.setTextColor(balance > 0 ? 220 : 34, balance > 0 ? 38 : 197, balance > 0 ? 38 : 94);
  doc.text(`${balance > 0 ? "+" : ""}${formatCurrency(balance, currency)}`, 18, 56);

  // Date
  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  doc.text(`Generado: ${new Date().toLocaleString("es-AR")}`, pageWidth - 14, 20, { align: "right" });

  // Filters info
  let yPos = 70;
  if (filters && (filters.dateFrom || filters.dateTo || (filters.types && filters.types.length > 0))) {
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    let filterText = "Filtros aplicados: ";
    const filterParts: string[] = [];
    if (filters.dateFrom) filterParts.push(`Desde: ${filters.dateFrom}`);
    if (filters.dateTo) filterParts.push(`Hasta: ${filters.dateTo}`);
    if (filters.types && filters.types.length > 0) {
      filterParts.push(`Tipos: ${filters.types.map(t => ENTRY_TYPE_LABELS[t as ClientEntryType]).join(", ")}`);
    }
    doc.text(filterText + filterParts.join(" | "), 14, yPos);
    yPos += 10;
  }

  // Table
  const tableData = entries.map((entry) => {
    const signedAmount = entry.amount * entry.sign;
    return [
      formatDateForPDF(entry.date),
      ENTRY_TYPE_LABELS[entry.type],
      entry.reference || "-",
      entry.paymentMethod || "-",
      formatCurrency(signedAmount, currency),
      entry.notes || "",
    ];
  });

  autoTable(doc, {
    head: [["Fecha", "Tipo", "Referencia", "Método", "Monto", "Notas"]],
    body: tableData,
    startY: yPos,
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [217, 119, 6],
      textColor: 255,
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [250, 250, 250],
    },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 30 },
      2: { cellWidth: 30 },
      3: { cellWidth: 30 },
      4: { cellWidth: 25, halign: "right" },
      5: { cellWidth: "auto" },
    },
  });

  // Footer
  const pageCount = (doc as any).getNumberOfPages ? (doc as any).getNumberOfPages() : 1;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Página ${i} de ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
  }

  // Save
  const safeClientName = clientName.replace(/[^a-zA-Z0-9]/g, "_");
  const dateStr = new Date().toISOString().slice(0, 10);
  doc.save(`cuenta_corriente_${safeClientName}_${dateStr}.pdf`);
}

function formatDateForPDF(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}

// CSV Export
interface ExportAccountToCSVParams {
  entries: ClientAccountEntry[];
  clientName: string;
  currency: string;
}

export function exportAccountToCSV({ entries, clientName, currency: _currency }: ExportAccountToCSVParams) {
  const headers = ["Fecha", "Tipo", "Monto", "Signo", "Referencia", "Metodo de Pago", "Notas", "Venta Asociada", "Creado"];
  
  const rows = entries.map((entry) => [
    entry.date,
    ENTRY_TYPE_LABELS[entry.type],
    entry.amount.toString(),
    entry.sign > 0 ? "+" : "-",
    entry.reference || "",
    entry.paymentMethod || "",
    entry.notes || "",
    entry.order || "",
    entry.createdAt || "",
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")),
  ].join("\n");

  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const safeClientName = clientName.replace(/[^a-zA-Z0-9]/g, "_");
  const dateStr = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `cuenta_corriente_${safeClientName}_${dateStr}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
