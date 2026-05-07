import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Building2,
  ArrowLeft,
  Loader2,
  Edit3,
  PauseCircle,
  PlayCircle,
  Save,
  X,
  Users,
  Package,
  ShoppingCart,
  Mail,
  Phone,
  AlertTriangle,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@shared/api/axios";
import { useAppToast } from "@features/notifications/components/AppToast";
import { useTenant } from "@features/superadmin/hooks/useSuperAdmin";
import SuperAdminLayout from "@features/superadmin/components/SuperAdminLayout";

const planLabels: Record<string, string> = {
  essential: "Essential",
  business: "Business",
  enterprise: "Enterprise",
};

const planColors: Record<string, string> = {
  essential: "bg-default-200/50 text-default-500 border-default-200/50",
  business: "bg-primary/15 text-primary border-primary/20",
  enterprise: "bg-purple-500/15 text-purple-400 border-purple-500/20",
};

const statusColors: Record<string, string> = {
  active: "bg-success/15 text-success",
  suspended: "bg-danger/15 text-danger",
  cancelled: "bg-default-200/50 text-default-500",
};

export default function TenantDetail() {
  const { tenantId } = useParams<{ tenantId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useAppToast();

  const { tenant, adminUser, settings, stats, usagePercentages, loading } = useTenant(tenantId);

  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    plan: "",
    status: "",
    notes: "",
  });

  const startEditing = () => {
    if (!tenant) return;
    setEditForm({
      plan: tenant.plan,
      status: tenant.status,
      notes: tenant.metadata?.notes || "",
    });
    setEditing(true);
  };

  const updateMutation = useMutation({
    mutationFn: async (data: typeof editForm) => {
      const response = await api.patch(`/superadmin/tenants/${tenantId}`, {
        plan: data.plan,
        status: data.status,
        metadata: { notes: data.notes },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["superadmin", "tenant", tenantId] });
      queryClient.invalidateQueries({ queryKey: ["superadmin", "tenants"] });
      queryClient.invalidateQueries({ queryKey: ["superadmin", "analytics"] });
      setEditing(false);
      showToast({ variant: "success", message: "Tenant actualizado" });
    },
    onError: (error: any) => {
      showToast({
        variant: "error",
        message: error.response?.data?.message || "Error al actualizar tenant",
      });
    },
  });

  const suspendMutation = useMutation({
    mutationFn: async () => {
      const response = await api.delete(`/superadmin/tenants/${tenantId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["superadmin", "tenant", tenantId] });
      queryClient.invalidateQueries({ queryKey: ["superadmin", "tenants"] });
      queryClient.invalidateQueries({ queryKey: ["superadmin", "analytics"] });
      showToast({ variant: "success", message: "Estado del tenant actualizado" });
    },
    onError: (error: any) => {
      showToast({
        variant: "error",
        message: error.response?.data?.message || "Error al cambiar estado",
      });
    },
  });

  if (loading) {
    return (
      <SuperAdminLayout>
        <div className="flex h-96 items-center justify-center">
          <Loader2 size={32} className="animate-spin text-blue-400" />
        </div>
      </SuperAdminLayout>
    );
  }

  if (!tenant) {
    return (
      <SuperAdminLayout>
        <div className="flex h-96 flex-col items-center justify-center gap-3">
          <Building2 size={48} className="text-gray-600" />
          <p className="text-lg font-semibold text-gray-400">Tenant no encontrado</p>
          <button
            onClick={() => navigate("/superadmin/tenants")}
            className="rounded-xl bg-blue-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-600"
          >
            Volver a la lista
          </button>
        </div>
      </SuperAdminLayout>
    );
  }

  const planConfig = {
    essential: { maxUsers: 3, maxProducts: 200 },
    business: { maxUsers: 10, maxProducts: Infinity },
    enterprise: { maxUsers: Infinity, maxProducts: Infinity },
  }[tenant.plan] || { maxUsers: 3, maxProducts: 200 };

  return (
    <SuperAdminLayout>
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <button
              onClick={() => navigate("/superadmin/tenants")}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-divider bg-content1 text-default-400 transition hover:text-foreground"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-foreground truncate max-w-[300px] lg:max-w-[500px]">{tenant.name}</h1>
                <span className={`inline-flex shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${statusColors[tenant.status]}`}>
                  {tenant.status === "active" ? "Activo" : tenant.status === "suspended" ? "Suspendido" : "Cancelado"}
                </span>
              </div>
              <p className="text-sm text-default-400">
                Creado el {new Date(tenant.createdAt).toLocaleDateString("es-AR")}
              </p>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            {editing ? (
              <>
                <button
                  onClick={() => setEditing(false)}
                  className="flex items-center gap-2 rounded-xl border border-divider bg-content2 px-4 py-2.5 text-sm font-bold text-foreground transition hover:bg-content3"
                >
                  <X size={16} />
                  Cancelar
                </button>
                <button
                  onClick={() => updateMutation.mutate(editForm)}
                  disabled={updateMutation.isPending}
                  className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
                >
                  {updateMutation.isPending ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}
                  Guardar
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => suspendMutation.mutate()}
                  disabled={suspendMutation.isPending}
                  className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold transition disabled:opacity-50 ${
                    tenant.status === "active"
                      ? "border-danger/20 bg-danger/10 text-danger hover:bg-danger/20"
                      : "border-success/20 bg-success/10 text-success hover:bg-success/20"
                  }`}
                >
                  {suspendMutation.isPending ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : tenant.status === "active" ? (
                    <PauseCircle size={16} />
                  ) : (
                    <PlayCircle size={16} />
                  )}
                  {tenant.status === "active" ? "Suspender" : "Activar"}
                </button>
                <button
                  onClick={startEditing}
                  className="flex items-center gap-2 rounded-xl border border-divider bg-content2 px-4 py-2.5 text-sm font-bold text-foreground transition hover:bg-content3"
                >
                  <Edit3 size={16} />
                  Editar
                </button>
              </>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-divider bg-content1 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-default-500">Usuarios</p>
                <p className="mt-2 text-2xl font-bold text-foreground">{stats.totalUsers}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Users size={20} />
              </div>
            </div>
            {planConfig.maxUsers !== Infinity && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-default-400">{usagePercentages.users}% usado</span>
                  <span className="text-default-400">{stats.totalUsers} / {planConfig.maxUsers}</span>
                </div>
                <div className="mt-1 h-1.5 w-full rounded-full bg-content2">
                  <div
                    className={`h-1.5 rounded-full ${usagePercentages.users >= 90 ? "bg-danger" : usagePercentages.users >= 70 ? "bg-warning" : "bg-primary"}`}
                    style={{ width: `${Math.min(100, usagePercentages.users)}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-divider bg-content1 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-default-500">Productos</p>
                <p className="mt-2 text-2xl font-bold text-foreground">{stats.totalProducts}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/15 text-purple-400">
                <Package size={20} />
              </div>
            </div>
            {planConfig.maxProducts !== Infinity && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-default-400">{usagePercentages.products}% usado</span>
                  <span className="text-default-400">{stats.totalProducts} / {planConfig.maxProducts}</span>
                </div>
                <div className="mt-1 h-1.5 w-full rounded-full bg-content2">
                  <div
                    className={`h-1.5 rounded-full ${usagePercentages.products >= 90 ? "bg-danger" : usagePercentages.products >= 70 ? "bg-warning" : "bg-purple-500"}`}
                    style={{ width: `${Math.min(100, usagePercentages.products)}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-divider bg-content1 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-default-500">Órdenes Totales</p>
                <p className="mt-2 text-2xl font-bold text-foreground">{stats.totalOrders}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/15 text-success">
                <ShoppingCart size={20} />
              </div>
            </div>
          </div>
        </div>

        {/* Plan & Billing */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Plan Info */}
          <div className="rounded-2xl border border-divider bg-content1 p-6">
            <h2 className="text-lg font-bold text-foreground">Plan y Límites</h2>
            {editing ? (
              <div className="mt-4 space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-default-500">
                    Plan
                  </label>
                  <select
                    value={editForm.plan}
                    onChange={(e) => setEditForm({ ...editForm, plan: e.target.value })}
                    className="w-full rounded-xl border border-divider bg-background px-4 py-3 text-sm text-foreground focus:border-primary focus:outline-none"
                  >
                    <option value="essential">Essential ($2/mes)</option>
                    <option value="business">Business ($3/mes)</option>
                    <option value="enterprise">Enterprise ($8/mes)</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-default-500">
                    Estado
                  </label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full rounded-xl border border-divider bg-background px-4 py-3 text-sm text-foreground focus:border-primary focus:outline-none"
                  >
                    <option value="active">Activo</option>
                    <option value="suspended">Suspendido</option>
                    <option value="cancelled">Cancelado</option>
                  </select>
                </div>
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-default-400">Plan actual</span>
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${planColors[tenant.plan]}`}>
                    {planLabels[tenant.plan]}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-default-400">Usuarios máximos</span>
                  <span className="text-sm font-semibold text-foreground">
                    {planConfig.maxUsers === Infinity ? "∞ Ilimitado" : planConfig.maxUsers}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-default-400">Productos máximos</span>
                  <span className="text-sm font-semibold text-foreground">
                    {planConfig.maxProducts === Infinity ? "∞ Ilimitado" : planConfig.maxProducts}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <span className="text-sm text-default-400 shrink-0">Features</span>
                  <div className="flex flex-wrap gap-1 justify-end">
                    {tenant.enabledFeatures?.length > 0 ? (
                      tenant.enabledFeatures.map((f: string) => (
                        <span key={f} className="rounded bg-content2 px-2 py-0.5 text-[10px] text-default-300">
                          {f.replace(/_/g, " ")}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-default-500">Ninguno</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Admin Info */}
          <div className="rounded-2xl border border-divider bg-content1 p-6">
            <h2 className="text-lg font-bold text-foreground">Administrador</h2>
            {adminUser ? (
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary">
                    {adminUser.fullName?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{adminUser.fullName}</p>
                    <p className="text-xs text-default-400">Admin</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-default-300">
                  <Mail size={14} className="text-default-500" />
                  {adminUser.email}
                </div>
                {adminUser.phone && (
                  <div className="flex items-center gap-2 text-sm text-default-300">
                    <Phone size={14} className="text-default-500" />
                    {adminUser.phone}
                  </div>
                )}
              </div>
            ) : (
              <p className="mt-4 text-sm text-default-400">No se encontró usuario administrador</p>
            )}
          </div>

          {/* Email Configuration */}
          <div className="rounded-2xl border border-divider bg-content1 p-6">
            <h2 className="text-lg font-bold text-foreground">Configuración de Email</h2>
            <div className="mt-4 space-y-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-default-500">Email de Soporte</p>
                <div className="flex items-center gap-2 text-sm text-default-300">
                  <Mail size={14} className="text-default-500" />
                  {settings?.supportEmail || "No configurado (usa valor por defecto)"}
                </div>
                <p className="mt-1 text-xs text-default-400">
                  Los emails de notificación se enviarán desde esta dirección
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="rounded-2xl border border-divider bg-content1 p-6">
          <h2 className="text-lg font-bold text-foreground">Notas Internas</h2>
          {editing ? (
            <textarea
              rows={4}
              value={editForm.notes}
              onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
              className="mt-4 w-full rounded-xl border border-divider bg-background px-4 py-3 text-sm text-foreground placeholder:text-default-500 focus:border-primary focus:outline-none"
              placeholder="Notas para referencia interna..."
            />
          ) : (
            <p className="mt-4 text-sm text-default-300 whitespace-pre-wrap">
              {tenant.metadata?.notes || "Sin notas"}
            </p>
          )}
        </div>

        {/* Limits Alert */}
        {(usagePercentages.users >= 90 || usagePercentages.products >= 90) && (
          <div className="flex items-center gap-3 rounded-2xl border border-warning/20 bg-warning/5 p-4">
            <AlertTriangle size={20} className="text-warning" />
            <div>
              <p className="text-sm font-semibold text-foreground">Límite cercano</p>
              <p className="text-xs text-default-400">
                {usagePercentages.users >= 90 && `Usuarios al ${usagePercentages.users}% del límite. `}
                {usagePercentages.products >= 90 && `Productos al ${usagePercentages.products}% del límite. `}
                Considerar upgrade de plan.
              </p>
            </div>
          </div>
        )}
      </div>
    </SuperAdminLayout>
  );
}
