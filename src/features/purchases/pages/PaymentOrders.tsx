import { useState, useMemo } from "react";
import { Plus, Loader2, FileText, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Input } from "@heroui/input";
import { usePaymentOrders } from "../hooks/usePaymentOrders";
import { formatCurrency } from "@shared/utils/currency";
import { formatDateShort } from "@shared/utils/date";
import { useIsDesktop } from "@shared/hooks/useIsDesktop";

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Borrador",
  PAID: "Pagado",
  CANCELLED: "Cancelado",
};

const STATUS_CHIP: Record<string, "default" | "success" | "danger"> = {
  DRAFT: "default",
  PAID: "success",
  CANCELLED: "danger",
};

export default function PaymentOrdersPage() {
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const filters = useMemo(() => ({
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(from ? { from } : {}),
    ...(to ? { to } : {}),
  }), [statusFilter, from, to]);

  const { paymentOrders: orders, loading } = usePaymentOrders(filters);

  return (
    <div className="space-y-4 p-4 lg:space-y-6 lg:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg lg:text-xl font-bold text-foreground">Órdenes de Pago</h2>
          <p className="text-xs lg:text-sm text-default-500">Agrupa y aplica pagos a proveedores</p>
        </div>
        {isDesktop && (
          <Button color="primary" onPress={() => navigate("/supplier-payments/new")} startContent={<Plus size={16} />}>
            Nueva Orden
          </Button>
        )}
      </div>

      {/* Filters — toggle on mobile, always visible on desktop */}
      {isDesktop ? (
        <div className="flex flex-wrap gap-3 items-end">
          <div className="w-40">
            <label className="text-[10px] font-bold uppercase text-default-500 mb-1 block">Estado</label>
            <select
              className="corp-input w-full rounded-xl px-3 py-2 text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Todos</option>
              <option value="DRAFT">Borrador</option>
              <option value="PAID">Pagado</option>
              <option value="CANCELLED">Cancelado</option>
            </select>
          </div>
          <Input type="date" label="Desde" labelPlacement="outside" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" size="sm" />
          <Input type="date" label="Hasta" labelPlacement="outside" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" size="sm" />
        </div>
      ) : (
        <>
          <button
            className="flex items-center gap-2 text-xs font-semibold text-default-500"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Search size={14} />
            {showFilters ? "Ocultar filtros" : "Mostrar filtros"}
          </button>
          {showFilters && (
            <div className="space-y-3">
              <select
                className="corp-input w-full rounded-xl px-3 py-2 text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">Todos los estados</option>
                <option value="DRAFT">Borrador</option>
                <option value="PAID">Pagado</option>
                <option value="CANCELLED">Cancelado</option>
              </select>
              <div className="flex gap-3">
                <Input type="date" label="Desde" labelPlacement="outside" value={from} onChange={(e) => setFrom(e.target.value)} size="sm" />
                <Input type="date" label="Hasta" labelPlacement="outside" value={to} onChange={(e) => setTo(e.target.value)} size="sm" />
              </div>
            </div>
          )}
        </>
      )}

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin" size={32} /></div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12 text-default-500">
          <FileText size={32} className="mx-auto mb-3 text-default-300" />
          <p>No hay órdenes de pago</p>
          <p className="text-xs mt-1">Creá una desde "Nueva Orden"</p>
        </div>
      ) : (
        <div className="space-y-2 lg:space-y-3">
          {orders.map((order) => {
            const supplierName = typeof order.supplier === "object" ? order.supplier.name : "—";
            return (
              <button
                key={order._id}
                className="flex w-full items-center justify-between rounded-xl border border-divider/20 bg-content2/30 p-3 lg:p-4 text-left hover:bg-content2/60 active:bg-content2/80 transition-colors"
                onClick={() => navigate(`/supplier-payments/${order._id}`)}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground truncate">{supplierName}</span>
                    <Chip color={STATUS_CHIP[order.status]} variant="flat" size="sm" classNames={{ base: "shrink-0" }}>{STATUS_LABELS[order.status]}</Chip>
                  </div>
                  <p className="mt-1 text-xs text-default-500">
                    {formatDateShort(order.date)} · {order.items.length} compra(s)
                  </p>
                </div>
                <div className="shrink-0 text-right ml-3">
                  <p className="text-sm font-bold font-mono text-foreground">{formatCurrency(order.total)}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Mobile FAB */}
      {!isDesktop && (
        <button
          className="fixed bottom-24 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_8px_24px_rgba(217,119,6,0.4)] active:scale-95 transition-transform"
          onClick={() => navigate("/supplier-payments/new")}
        >
          <Plus size={24} />
        </button>
      )}
    </div>
  );
}
