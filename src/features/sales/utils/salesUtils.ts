import { normalizeText } from "@shared/utils/string";
import { SalesStatus } from "@features/sales/hooks/useOrders";

/**
 * Normaliza el estado comercial de una orden.
 */
export function getCommercialStatus(order: { salesStatus?: string; status?: string }): SalesStatus {
  const rawStatus = order.salesStatus || order.status;
  const normalized = normalizeText(rawStatus);
  if (normalized === "confirmada") return "Confirmada";
  if (normalized === "cancelada") return "Cancelada";
  return "Pendiente";
}
