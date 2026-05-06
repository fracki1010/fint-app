import jsPDF from "jspdf";

import { Order } from "@features/sales/hooks/useOrders";
import { Setting } from "@features/settings/hooks/useSettings";
import { formatCurrency } from "@shared/utils/currency";

type InvoiceClient = {
  name: string;
  phone: string;
  taxId: string;
  fiscalAddress: string;
};

function resolveClient(client: Order["client"]): InvoiceClient {
  if (typeof client === "object" && client) {
    return {
      name: client.name || "Cliente",
      phone: client.phone || "Sin telefono",
      taxId: client.taxId || "No definido",
      fiscalAddress: client.fiscalAddress || "No definido",
    };
  }

  return {
    name: "Cliente",
    phone: "Sin telefono",
    taxId: "No definido",
    fiscalAddress: "No definido",
  };
}

function toAmount(value: number) {
  return Number.isFinite(value) ? value : 0;
}

function toDateLabel(value?: string) {
  if (!value) return "--";

  return new Date(value).toLocaleString("es-AR");
}

export function downloadOrderInvoicePdf({
  order,
  settings,
}: {
  order: Order;
  settings?: Setting | null;
}) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 44;
  const rightEdge = pageWidth - margin;
  const currency = settings?.currency || "USD";
  const companyName = settings?.storeName || "Fint Company";
  const companyAddress = settings?.address || "Direccion no definida";
  const companyPhone = settings?.phone || "Telefono no definido";
  const companyEmail = settings?.email || "Email no definido";
  const companyTaxId = settings?.taxId || "No definido";
  const companyFiscalCondition = settings?.fiscalCondition || "No definida";
  const companyInvoiceTerms = settings?.invoiceTerms || "Pago contra entrega.";
  const client = resolveClient(order.client);
  const taxRate = Number(settings?.taxRate || 0);
  const subtotal = order.items.reduce(
    (sum, item) => sum + toAmount(item.quantity) * toAmount(item.price),
    0,
  );
  const total = toAmount(order.totalAmount);
  const taxes = Math.max(total - subtotal, 0);
  const orderNumber = order.orderNumber || `Pedido-${order._id.slice(-6)}`;
  const fileSafeOrderNumber = orderNumber.replace(/[^a-zA-Z0-9-_]/g, "_");

  let y = margin;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(companyName, margin, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  y += 18;
  doc.text(companyAddress, margin, y);
  y += 14;
  doc.text(`Tel: ${companyPhone}`, margin, y);
  y += 14;
  doc.text(`Email: ${companyEmail}`, margin, y);
  y += 14;
  doc.text(`Doc. fiscal: ${companyTaxId}`, margin, y);
  y += 14;
  doc.text(`Condicion fiscal: ${companyFiscalCondition}`, margin, y);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("FACTURA", rightEdge, margin + 4, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Nro: ${orderNumber}`, rightEdge, margin + 22, { align: "right" });
  doc.text(`Fecha: ${toDateLabel(order.createdAt)}`, rightEdge, margin + 36, {
    align: "right",
  });
  doc.text(`Estado: ${order.salesStatus}`, rightEdge, margin + 50, {
    align: "right",
  });

  y += 30;
  doc.setDrawColor(220);
  doc.line(margin, y, rightEdge, y);
  y += 20;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Facturar a", margin, y);
  doc.setFont("helvetica", "normal");
  y += 14;
  doc.text(client.name, margin, y);
  y += 14;
  doc.text(`Contacto: ${client.phone}`, margin, y);
  y += 14;
  doc.text(`Doc. fiscal: ${client.taxId}`, margin, y);
  y += 14;
  doc.text(`Direccion fiscal: ${client.fiscalAddress}`, margin, y);

  y += 22;
  doc.setDrawColor(220);
  doc.line(margin, y, rightEdge, y);
  y += 20;

  const colProductX = margin;
  const colQtyX = margin + 280;
  const colUnitX = margin + 360;
  const colTotalX = rightEdge;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Producto", colProductX, y);
  doc.text("Cant.", colQtyX, y);
  doc.text("P. Unitario", colUnitX, y);
  doc.text("Importe", colTotalX, y, { align: "right" });

  y += 10;
  doc.setDrawColor(230);
  doc.line(margin, y, rightEdge, y);
  y += 16;

  doc.setFont("helvetica", "normal");
  order.items.forEach((item) => {
    const lineTotal = toAmount(item.quantity) * toAmount(item.price);
    const productName = item.product || "Producto";

    doc.text(productName.slice(0, 44), colProductX, y);
    doc.text(String(item.quantity), colQtyX, y);
    doc.text(formatCurrency(toAmount(item.price), currency), colUnitX, y);
    doc.text(formatCurrency(lineTotal, currency), colTotalX, y, {
      align: "right",
    });

    y += 18;
    if (y > 690) {
      doc.addPage();
      y = margin;
    }
  });

  y += 4;
  doc.setDrawColor(220);
  doc.line(margin, y, rightEdge, y);
  y += 20;

  const summaryX = rightEdge;

  doc.setFont("helvetica", "normal");
  doc.text(`Subtotal: ${formatCurrency(subtotal, currency)}`, summaryX, y, {
    align: "right",
  });
  y += 16;
  doc.text(
    `Impuestos (${taxRate}%): ${formatCurrency(taxes, currency)}`,
    summaryX,
    y,
    { align: "right" },
  );
  y += 20;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(`TOTAL: ${formatCurrency(total, currency)}`, summaryX, y, {
    align: "right",
  });

  y += 26;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Condiciones: ${companyInvoiceTerms}`, margin, y);
  y += 14;
  doc.text(
    "Documento generado por Fint. Valores expresados en moneda configurada.",
    margin,
    y,
  );

  doc.save(`factura-${fileSafeOrderNumber}.pdf`);
}
