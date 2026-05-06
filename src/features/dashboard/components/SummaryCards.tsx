import { Wallet, AlertTriangle, FileText, Users } from "lucide-react";

import KpiCard from "./KpiCard";
import { formatCompactCurrency } from "@shared/utils/currency";

interface SummaryCardsProps {
  collectedMonth: number;
  lowStockCount: number;
  pendingOrders: number;
  customersWithDebt: number;
  currency: string;
}

export default function SummaryCards({
  collectedMonth,
  lowStockCount,
  pendingOrders,
  customersWithDebt,
  currency,
}: SummaryCardsProps) {
  return (
    <section className="lg:col-span-12">
      <h2 className="mb-3 section-kicker">Indicadores</h2>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          label="Cobrado"
          value={formatCompactCurrency(collectedMonth, currency)}
          sub="Ingreso efectivo del mes actual."
          icon={<Wallet size={14} />}
          color="primary"
        />
        <KpiCard
          label="Stock Bajo"
          value={lowStockCount.toString().padStart(2, "0")}
          sub="Productos bajo el minimo operativo."
          icon={<AlertTriangle size={14} />}
          color="danger"
        />
        <KpiCard
          label="Pendientes"
          value={pendingOrders.toString().padStart(2, "0")}
          sub="Ordenes abiertas en el circuito."
          icon={<FileText size={14} />}
          color="warning"
        />
        <KpiCard
          label="Con Deuda"
          value={customersWithDebt.toString().padStart(2, "0")}
          sub="Clientes con saldo pendiente."
          icon={<Users size={14} />}
          color="warning"
        />
      </div>
    </section>
  );
}
