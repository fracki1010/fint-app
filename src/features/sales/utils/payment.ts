import { DollarSign } from "lucide-react";
import { PaymentMethod } from "@shared/types";

export function getPaymentIcon(method: PaymentMethod) {
  return method === "cash" ? DollarSign : null;
}

export function getPaymentLabel(method: PaymentMethod, short = false): string {
  switch (method) {
    case "cash": return short ? "Efectivo" : "Efectivo";
    case "card": return short ? "Tarjeta" : "Tarjeta";
    case "mercadopago": return "Mercado Pago";
    case "transfer": return short ? "Transf." : "Transferencia";
    case "naranja_x": return "Naranja X";
    case "uala": return "Ualá";
    case "check": return "Cheque";
    case "other": return "Otro";
  }
}

export function getPaymentEmoji(method: PaymentMethod): string {
  switch (method) {
    case "cash": return "💵";
    case "card": return "💳";
    case "mercadopago": return "🟡";
    case "transfer": return "🏦";
    case "naranja_x": return "🟠";
    case "uala": return "🔵";
    case "check": return "📄";
    case "other": return "❓";
  }
}
