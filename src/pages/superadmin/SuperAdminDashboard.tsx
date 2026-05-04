import { Building2, TrendingUp, Users, DollarSign, AlertTriangle, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useSuperAdminAnalytics, useTenants } from "@/hooks/useSuperAdmin";
import SuperAdminLayout from "@/components/superadmin/SuperAdminLayout";

const planColors: Record<string, string> = {
  essential: "bg-gray-500/15 text-gray-400",
  business: "bg-blue-500/15 text-blue-400",
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
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-gray-400">Visión general del sistema</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-content1 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Total Tenants</p>
                <p className="mt-2 text-3xl font-bold text-white">{overview?.totalTenants || 0}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/15 text-blue-400">
                <Building2 size={24} />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs text-gray-400">
                {overview?.activeTenants || 0} activos
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-content1 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-500">MRR</p>
                <p className="mt-2 text-3xl font-bold text-white">${revenue?.mrr || 0}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/15 text-green-400">
                <DollarSign size={24} />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs text-gray-400">
                ARR: ${revenue?.arr || 0}
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-content1 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Nuevos (Mes)</p>
                <p className="mt-2 text-3xl font-bold text-white">{overview?.newThisMonth || 0}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/15 text-purple-400">
                <TrendingUp size={24} />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs text-green-400">
                +{overview?.newThisMonth || 0} este mes
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-content1 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Tasa Churn</p>
                <p className="mt-2 text-3xl font-bold text-white">
                  {overview?.totalTenants ? ((overview.cancelledTenants / overview.totalTenants) * 100).toFixed(1) : 0}%
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/15 text-orange-400">
                <Users size={24} />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs text-gray-400">
                {overview?.cancelledTenants || 0} cancelados
              </span>
            </div>
          </div>
        </div>

        {/* Plan Distribution & Recent Tenants */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Plan Distribution */}
          <div className="rounded-2xl border border-white/10 bg-content1 p-5">
            <h2 className="text-lg font-bold text-white">Distribución de Planes</h2>
            <div className="mt-4 space-y-3">
              {Object.entries(plans).map(([plan, data]) => (
                <div key={plan} className="flex items-center gap-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${planColors[plan] || "bg-gray-500/15 text-gray-400"}`}>
                    <span className="text-xs font-bold">{planLabels[plan]?.[0] || "?"}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-white">{planLabels[plan] || plan}</span>
                      <span className="text-sm text-gray-400">{data.count} ({data.percentage}%)</span>
                    </div>
                    <div className="mt-1 h-2 w-full rounded-full bg-white/5">
                      <div
                        className={`h-2 rounded-full ${plan === "essential" ? "bg-gray-500" : plan === "business" ? "bg-blue-500" : "bg-purple-500"}`}
                        style={{ width: `${data.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Tenants */}
          <div className="rounded-2xl border border-white/10 bg-content1 p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Tenants Recientes</h2>
              <Link
                to="/superadmin/tenants"
                className="flex items-center gap-1 text-sm font-semibold text-blue-400 transition hover:text-blue-300"
              >
                Ver todos
                <ChevronRight size={16} />
              </Link>
            </div>
            <div className="mt-4 space-y-2">
              {tenants.length === 0 ? (
                <p className="text-sm text-gray-400">No hay tenants registrados</p>
              ) : (
                tenants.map((tenant) => (
                  <Link
                    key={tenant._id}
                    to={`/superadmin/tenants/${tenant._id}`}
                    className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3 transition hover:border-white/10 hover:bg-white/[0.04]"
                  >
                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${planColors[tenant.plan]}`}>
                      <Building2 size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-white">{tenant.name}</p>
                      <p className="text-xs text-gray-400">
                        {planLabels[tenant.plan]} • {tenant.status === "active" ? "Activo" : tenant.status}
                      </p>
                    </div>
                    <ChevronRight size={16} className="text-gray-500" />
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Alerts */}
        <div className="rounded-2xl border border-white/10 bg-content1 p-5">
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-orange-400" />
            <h2 className="text-lg font-bold text-white">Alertas</h2>
          </div>
          <div className="mt-4">
            {overview && overview.suspendedTenants > 0 ? (
              <div className="flex items-center gap-3 rounded-xl border border-orange-500/20 bg-orange-500/5 p-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500/20 text-orange-400">
                  <AlertTriangle size={14} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">
                    {overview.suspendedTenants} {overview.suspendedTenants === 1 ? "tenant suspendido" : "tenants suspendidos"}
                  </p>
                  <p className="text-xs text-gray-400">
                    Revisar cuentas suspendidas
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400">No hay alertas pendientes</p>
            )}
          </div>
        </div>
      </div>
    </SuperAdminLayout>
  );
}
