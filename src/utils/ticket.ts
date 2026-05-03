import { Order } from "@/hooks/useOrders";
import { formatCurrency } from "./currency";

interface TicketData {
  order: Order;
  settings: {
    businessName?: string;
    address?: string;
    phone?: string;
    taxId?: string;
  };
  currency: string;
}

export function generateTicketHTML(data: TicketData): string {
  const { order, settings, currency } = data;

  const items = order.items
    .map((item) => {
      const lineTotal = item.quantity * item.price;
      return `
      <tr>
        <td style="padding:2px 0">${item.product}</td>
        <td style="padding:2px 8px;text-align:center">${item.quantity}</td>
        <td style="padding:2px 0;text-align:right">${formatCurrency(lineTotal, currency)}</td>
      </tr>`;
    })
    .join("");

  const subtotal = order.totalAmount / 1.21;
  const taxAmount = order.totalAmount - subtotal;

  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8">
    <style>
      @media print {
        @page { margin: 0; size: 80mm auto; }
        body { width: 80mm; padding: 3mm 5mm; font-family: 'Courier New', monospace; font-size: 12px; color: #000; }
        .center { text-align: center; }
        .right { text-align: right; }
        .line { border-top: 1px dashed #000; margin: 4px 0; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        td { padding: 2px 0; }
        .total td { font-weight: bold; font-size: 14px; padding-top: 4px; }
      }
    </style>
    </head>
    <body>
      <div class="center">
        <h2 style="margin:0;font-size:16px">${settings.businessName || "MI NEGOCIO"}</h2>
        ${settings.address ? `<p style="margin:2px 0">${settings.address}</p>` : ""}
        ${settings.phone ? `<p style="margin:2px 0">Tel: ${settings.phone}</p>` : ""}
        ${settings.taxId ? `<p style="margin:2px 0">CUIT: ${settings.taxId}</p>` : ""}
        <p style="margin:6px 0 0">${new Date(order.createdAt).toLocaleString()}</p>
      </div>

      <div class="line"></div>

      <table>
        <thead>
          <tr style="font-size:11px">
            <th style="text-align:left">Producto</th>
            <th style="text-align:center">Cant</th>
            <th style="text-align:right">Total</th>
          </tr>
        </thead>
        <tbody>${items}</tbody>
      </table>

      <div class="line"></div>

      <table>
        <tr><td>Subtotal</td><td class="right">${formatCurrency(subtotal, currency)}</td></tr>
        <tr><td>IVA</td><td class="right">${formatCurrency(taxAmount, currency)}</td></tr>
        <tr class="total"><td>TOTAL</td><td class="right">${formatCurrency(order.totalAmount, currency)}</td></tr>
      </table>

      <div class="line"></div>

      <p class="center" style="margin-top:6px">¡Gracias por su compra!</p>
    </body>
    </html>
  `;
}

export function printTicket(data: TicketData): void {
  const html = generateTicketHTML(data);
  const printWindow = window.open("", "_blank", "width=400,height=600");
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 300);
  }
}
