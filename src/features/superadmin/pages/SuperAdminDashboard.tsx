import { Building2, TrendingUp, Users, DollarSign, AlertTriangle, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useSuperAdminAnalytics, useTenants } from "@features/superadmin/hooks/useSuperAdmin";
import SuperAdminLayout from "@features/superadmin/components/SuperAdminLayout";

const planColors: Record<string, string> = {
  essential: "bg-default-200/50 text-default-500",
  business: "bg-primary/15 text-primary",
  enterprise: "bg-purple-500/15 text-purple-400",
};

const planLabels: Record<string, string> = {
  essential: "Essential",
  business: "Business",
  enterprise: "Enterprise",
};

export default function SuperAdminDashboard() {
  const { analytics, loading: analyticsLoading } = useSuperAdminAnalytics();
  const { tenants, loading: tenantsLoading } = useTenants({ limit: 5 });

  const isLoading = analyticsLoading || tenantsLoading;

  if (isLoading) {
    return (
      <SuperAdminLayout>
        <div className="flex h-96 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
            <p className="text-sm text-gray-400">Cargando dashboard...</p>
          </div>
        </div>
      </SuperAdminLayout>
    );
  }

  const overview = analytics?.overview;
  const plans = analytics?.plans || {};
  const revenue = analytics?.revenue;

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-default-400">Visión general del sistema</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-divider bg-content1 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-default-500">Total Tenants</p>
                <p className="mt-2 text-3xl font-bold text-foreground">{overview?.totalTenants || 0}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Building2 size={24} />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs text-default-400">
                {overview?.activeTenants || 0} activos
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-divider bg-content1 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-default-500">MRR</p>
                <p className="mt-2 text-3xl font-bold text-foreground">${revenue?.mrr || 0}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/15 text-success">
                <DollarSign size={24} />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs text-default-400">
                ARR: ${revenue?.arr || 0}
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-divider bg-content1 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-default-500">Nuevos (Mes)</p>
                <p className="mt-2 text-3xl font-bold text-foreground">{overview?.newThisMonth || 0}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/15 text-purple-400">
                <TrendingUp size={24} />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs text-success">
                +{overview?.newThisMonth || 0} este mes
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-divider bg-content1 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-default-500">Tasa Churn</p>
                <p className="mt-2 text-3xl font-bold text-foreground">
                  {overview?.totalTenants ? ((overview.cancelledTenants / overview.totalTenants) * 100).toFixed(1) : 0}%
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning/15 text-warning">
                <Users size={24} />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs text-default-400">
                {overview?.cancelledTenants || 0} cancelados
              </span>
            </div>
          </div>
        </div>

        {/* Plan Distribution & Recent Tenants */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Plan Distribution */}
          <div className="rounded-2xl border border-divider bg-content1 p-5">
            <h2 className="text-lg font-bold text-foreground">Distribución de Planes</h2>
            <div className="mt-4 space-y-3">
              {Object.entries(plans).map(([plan, data]) => (
                <div key={plan} className="flex items-center gap-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${planColors[plan] || "bg-default-200/50 text-default-500"}`}>
                    <span className="text-xs font-bold">{planLabels[plan]?.[0] || "?"}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-foreground">{planLabels[plan] || plan}</span>
                      <span className="text-sm text-default-400">{data.count} ({data.percentage}%)</span>
                    </div>
                    <div className="mt-1 h-2 w-full rounded-full bg-content2">
                      <div
                        className={`h-2 rounded-full ${plan === "essential" ? "bg-default-400" : plan === "business" ? "bg-primary" : "bg-purple-500"}`}
                        style={{ width: `${data.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Tenants */}
          <div className="rounded-2xl border border-divider bg-content1 p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">Tenants Recientes</h2>
              <Link
                to="/superadmin/tenants"
                className="flex items-center gap-1 text-sm font-semibold text-primary transition hover:opacity-80"
              >
                Ver todos
                <ChevronRight size={16} />
              </Link>
            </div>
            <div className="mt-4 space-y-2">
              {tenants.length === 0 ? (
                <p className="text-sm text-default-400">No hay tenants registrados</p>
              ) : (
                tenants.map((tenant) => (
                  <Link
                    key={tenant._id}
                    to={`/superadmin/tenants/${tenant._id}`}
                    className="flex items-center gap-3 rounded-xl border border-divider bg-content1/50 p-3 transition hover:border-primary/20 hover:bg-content2"
                  >
                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${planColors[tenant.plan]}`}>
                      <Building2 size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">{tenant.name}</p>
                      <p className="text-xs text-default-400">
                        {planLabels[tenant.plan]} • {tenant.status === "active" ? "Activo" : tenant.status}
                      </p>
                    </div>
                    <ChevronRight size={16} className="text-default-500" />
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Alerts */}
        <div className="rounded-2xl border border-divider bg-content1 p-5">
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-warning" />
            <h2 className="text-lg font-bold text-foreground">Alertas</h2>
          </div>
          <div className="mt-4">
            {overview && overview.suspendedTenants > 0 ? (
              <div className="flex items-center gap-3 rounded-xl border border-warning/20 bg-warning/5 p-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-warning/20 text-warning">
                  <AlertTriangle size={14} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {overview.suspendedTenants} {overview.suspendedTenants === 1 ? "tenant suspendido" : "tenants suspendidos"}
                  </p>
                  <p className="text-xs text-default-400">
                    Revisar cuentas suspendidas
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-default-400">No hay alertas pendientes</p>
            )}
          </div>
        </div>
      </div>
    </SuperAdminLayout>
  );
}
