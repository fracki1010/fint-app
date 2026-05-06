import { DollarSign } from "lucide-react";
import { PaymentMethod } from "@shared/types";

export function getPaymentIcon(method: PaymentMethod) {
  if (method === "cash") return DollarSign;
  return null;
}

export function getPaymentLabel(method: PaymentMethod, short = false): string {
  switch (method) {
    case "cash": return short ? "Efectivo" : "Efectivo";
    case "card": return short ? "Tarjeta" : "Tarjeta";
    case "transfer": return short ? "Transf." : "Transferencia";
  }
}

export function getPaymentEmoji(method: PaymentMethod): string {
  switch (method) {
    case "cash": return "";
    case "card": return "💳";
    case "transfer": return "📱";
  }
}
