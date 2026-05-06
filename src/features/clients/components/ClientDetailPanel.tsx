import { useMemo } from "react";
import {
  AlertCircle,
  ArrowLeft,
  BarChart3,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Hash,
  Loader2,
  Mail,
  MapPin,
  NotebookText,
  Pencil,
  Phone,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { useClientDetail } from "@features/clients/hooks/useClients";
import { Badge } from "@shared/components/Badge";
import { formatCompactCurrency } from "@shared/utils/currency";
import { Button } from "./Button";
import { Card } from "./Card";
import { MetricCard } from "./MetricCard";
import { EmptyState } from "./EmptyState";

// ── Utilidades ──────────────────────────────────────────────────────────

function getInitials(name: string): string {
  if (!name) return "??";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ── Component ────────────────────────────────────────────────────────────

export function ClientDetailPanel({
  clientId,
  currency,
  isDesktop,
  onBack,
  onClose,
  onEdit,
  onDelete,
  isDeleting,
}: {
  clientId: string;
  currency: string;
  isDesktop: boolean;
  onBack: () => void;
  onClose?: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  const { client: selectedClient, orders, metrics, loading, error } = useClientDetail(clientId);

  // Filter orders: last 5 max; for Consumidor Final, only today's
  const isGenericClient = selectedClient?.name === "Consumidor Final";
  const displayOrders = useMemo(() => {
    if (isGenericClient) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return orders
        .filter((o) => new Date(o.createdAt) >= today)
        .slice(0, 5);
    }
    return orders.slice(0, 5);
  }, [orders, isGenericClient]);

  if (loading && !selectedClient) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
        <p className="mt-4 text-sm text-default-500">Cargando información del cliente...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-6 text-center">
        <div className="mb-4 rounded-full bg-danger/10 p-4">
          <AlertCircle size={32} className="text-danger" />
        </div>
        <p className="text-sm font-semibold text-danger">No se pudo cargar el cliente</p>
        <p className="mt-1 text-xs text-default-500">{error}</p>
        <Button variant="secondary" className="mt-4" onClick={onBack}>
          Volver
        </Button>
      </div>
    );
  }

  if (!selectedClient || !metrics) {
    return (
      <EmptyState
        icon={Users}
        title="Cliente no encontrado"
        description="El cliente que buscas no está disponible o ha sido eliminado."
        action={
          <Button onClick={onBack} icon={ArrowLeft}>
            Volver a la lista
          </Button>
        }
      />
    );
  }

  return (
    <div className="flex h-full flex-col bg-content1">
      {/* Header */}
      <div
        className={`shrink-0 border-b border-white/10 px-6 py-4 ${
          isDesktop ? "bg-background/60 backdrop-blur-sm" : "bg-background"
        }`}
      >
        {!isDesktop && (
          <button
            className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-default-500 transition-colors hover:text-foreground"
            onClick={onBack}
          >
            <ArrowLeft size={14} /> Volver a clientes
          </button>
        )}
        {isDesktop && (
          <div className="mb-3 flex justify-end">
            <button
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-default-400 transition hover:bg-white/10 hover:text-foreground"
              onClick={onClose}
              aria-label="Cerrar panel"
            >
              <X size={15} />
            </button>
          </div>
        )}

        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 text-lg font-bold text-primary">
            {getInitials(selectedClient.name)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-widest text-default-400">
              Ficha de cliente
            </p>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-foreground">
              {selectedClient.name}
            </h2>
            {selectedClient.company && (
              <p className="mt-0.5 text-sm text-default-500">{selectedClient.company}</p>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        <div className="space-y-4">
          {/* KPIs Grid */}
          <div className="grid grid-cols-2 gap-3">
            <MetricCard
              label="Total Comprado"
              value={formatCompactCurrency(metrics.totalSpent, currency)}
              subValue={`${metrics.totalOrders} órdenes`}
              trend={metrics.totalSpent > 0 ? "up" : "neutral"}
              icon={BarChart3}
              color="success"
            />
            <MetricCard
              label="Deuda"
              value={formatCompactCurrency(Number(selectedClient.debt || 0), currency)}
              subValue={Number(selectedClient.debt || 0) > 0 ? "Pendiente de pago" : "Al día"}
              trend={Number(selectedClient.debt || 0) > 0 ? "down" : "up"}
              icon={Number(selectedClient.debt || 0) > 0 ? AlertCircle : CheckCircle2}
              color={Number(selectedClient.debt || 0) > 0 ? "danger" : "success"}
            />
          </div>

          {/* Orders Stats */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Compras", value: metrics.totalOrders, icon: Hash },
              { label: "Pendientes", value: metrics.pendingOrders, icon: Clock },
              { label: "Entregadas", value: metrics.deliveredOrders, icon: CheckCircle2 },
            ].map((kpi) => (
              <Card key={kpi.label} className="text-center">
                <p className="text-[10px] font-bold uppercase tracking-widest text-default-400">
                  {kpi.label}
                </p>
                <p className="mt-2 text-xl font-bold text-foreground">{kpi.value}</p>
              </Card>
            ))}
          </div>

          {/* Contact Info */}
          <Card>
            <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-foreground">
              <Building2 size={16} className="text-primary" />
              Datos de contacto
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { icon: Phone, label: "Teléfono", value: selectedClient.phone },
                { icon: Mail, label: "Email", value: selectedClient.email || "No definido" },
                { icon: Building2, label: "Empresa", value: selectedClient.company || "No definida" },
                { icon: Hash, label: "Doc. fiscal", value: selectedClient.taxId || "No definido" },
                { icon: MapPin, label: "Dirección", value: selectedClient.address || "No definida" },
                { icon: MapPin, label: "Dir. fiscal", value: selectedClient.fiscalAddress || "No definida" },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-2.5">
                  <Icon size={14} className="mt-0.5 shrink-0 text-primary" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-default-400">
                      {label}
                    </p>
                    <p className="mt-0.5 truncate text-sm text-foreground">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Notes */}
          {selectedClient.notes && (
            <Card>
              <div className="flex items-start gap-2.5">
                <NotebookText size={16} className="mt-0.5 shrink-0 text-primary" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-default-400">
                    Notas
                  </p>
                  <p className="mt-1 text-sm text-foreground leading-relaxed">{selectedClient.notes}</p>
                </div>
              </div>
            </Card>
          )}

          {/* Orders */}
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
                <Calendar size={16} className="text-primary" />
                Ventas relacionadas
              </h3>
              <Badge variant="default" size="sm">
                {displayOrders.length} registros
              </Badge>
            </div>
            <div className="space-y-2">
              {displayOrders.length > 0 ? (
                displayOrders.map((order) => (
                  <div
                    key={order._id}
                    className="flex items-center justify-between rounded-xl bg-content2/60 px-3 py-2.5 transition-colors hover:bg-content2"
                  >
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {order.orderNumber || `#${order._id.slice(-6)}`}
                      </p>
                      <p className="text-xs text-default-500">
                        {new Date(order.createdAt).toLocaleDateString("es-ES", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}{" "}
                        · {order.items.length} ítem(s)
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-foreground">
                        {formatCompactCurrency(order.totalAmount, currency)}
                      </p>
                      <Badge
                        variant={
                          order.status === "Entregado"
                            ? "success"
                            : order.status === "Pendiente"
                            ? "warning"
                            : order.status === "Cancelada"
                            ? "danger"
                            : "default"
                        }
                        size="sm"
                      >
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-default-500">Sin ventas registradas.</p>
              )}
            </div>
          </Card>

          {/* Actions */}
          <div className="flex gap-3 pb-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onEdit}
              icon={Pencil}
            >
              Editar
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              onClick={onDelete}
              disabled={isDeleting}
              icon={isDeleting ? Loader2 : Trash2}
            >
              {isDeleting ? "Procesando..." : "Desactivar"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
