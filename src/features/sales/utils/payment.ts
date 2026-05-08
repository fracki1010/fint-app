import { DollarSign } from "lucide-react";
import { PaymentMethod } from "@shared/types";

export function getPaymentIcon(method: PaymentMethod) {
  return method === "cash" ? DollarSign : null;
}

export function getPaymentLabel(method: PaymentMethod, short = false): string {
  switch (method) {
    case "cash": return short ? "Efectivo" : "Efectivo";
    case "card": return short ? "Tarjeta" : "Tarjeta";
    case "transfer": return short ? "Transf." : "Transferencia";
    case "mercadopago": return "Mercado Pago";
    case "check": return "Cheque";
    case "other": return "Otro";
  }
}

export function getPaymentEmoji(method: PaymentMethod): string {
  switch (method) {
    case "cash": return "";
    case "card": return "💳";
    case "transfer": return "📱";
    case "mercadopago": return "🟡";
    case "check": return "📄";
    case "other": return "❓";
  }
}
