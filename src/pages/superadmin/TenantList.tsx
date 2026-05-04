import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  Search,
  Plus,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { useTenants } from "@/hooks/useSuperAdmin";
import SuperAdminLayout from "@/components/superadmin/SuperAdminLayout";

const planColors: Record<string, string> = {
  essential: "bg-gray-500/15 text-gray-400 border-gray-500/20",
  business: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  enterprise: "bg-purple-500/15 text-purple-400 border-purple-500/20",
};

const planLabels: Record<string, string> = {
  essential: "Essential",
  business: "Business",
  enterprise: "Enterprise",
};

const statusColors: Record<string, string> = {
  active: "bg-green-500/15 text-green-400",
  suspended: "bg-red-500/15 text-red-400",
  cancelled: "bg-gray-500/15 text-gray-400",
};

export default function TenantList() {
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [page, setPage] = useState(1);

  const { tenants, pagination, loading } = useTenants({
    page,
    limit: 20,
    plan: planFilter || undefined,
    status: statusFilter || undefined,
    search: search || undefined,
  });

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Tenants</h1>
            <p className="text-sm text-gray-400">
              {pagination.total} {pagination.total === 1 ? "tenant registrado" : "tenants registrados"}
            </p>
          </div>
          <Link
            to="/superadmin/tenants/new"
            className="flex items-center gap-2 rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-600"
          >
            <Plus size={18} />
            Nuevo Tenant
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-white/10 bg-content1 px-3 py-2">
            <Search size={16} className="text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm text-white placeholder:text-gray-500 focus:outline-none"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="text-gray-400 hover:text-white"
              >
                ×
              </button>
            )}
          </div>

          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="rounded-xl border border-white/10 bg-content1 px-3 py-2 text-sm text-white focus:outline-none"
          >
            <option value="">Todos los planes</option>
            <option value="essential">Essential</option>
            <option value="business">Business</option>
            <option value="enterprise">Enterprise</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-white/10 bg-content1 px-3 py-2 text-sm text-white focus:outline-none"
          >
            <option value="">Todos los estados</option>
            <option value="active">Activo</option>
            <option value="suspended">Suspendido</option>
            <option value="cancelled">Cancelado</option>
          </select>
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-white/10 bg-content1">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 size={32} className="animate-spin text-blue-400" />
            </div>
          ) : tenants.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center gap-3">
              <Building2 size={48} className="text-gray-600" />
              <p className="text-lg font-semibold text-gray-400">No hay tenants</p>
              <p className="text-sm text-gray-500">
                {search || planFilter || statusFilter
                  ? "Prueba con otros filtros"
                  : "Crea tu primer tenant"}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10 text-left">
                      <th className="px-5 py-3 text-xs font-bold uppercase tracking-widest text-gray-500">
                        Tenant
                      </th>
                      <th className="px-5 py-3 text-xs font-bold uppercase tracking-widest text-gray-500">
                        Plan
                      </th>
                      <th className="px-5 py-3 text-xs font-bold uppercase tracking-widest text-gray-500">
                        Estado
                      </th>
                      <th className="px-5 py-3 text-xs font-bold uppercase tracking-widest text-gray-500">
                        Usuarios
                      </th>
                      <th className="px-5 py-3 text-xs font-bold uppercase tracking-widest text-gray-500">
                        Creado
                      </th>
                      <th className="px-5 py-3 text-xs font-bold uppercase tracking-widest text-gray-500">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {tenants.map((tenant) => (
                      <tr
                        key={tenant._id}
                        className="transition hover:bg-white/[0.02]"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${planColors[tenant.plan] || planColors.essential}`}>
                              <Building2 size={18} />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-white">{tenant.name}</p>
                              {tenant.billing?.email && (
                                <p className="text-xs text-gray-400">{tenant.billing.email}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${planColors[tenant.plan]?.split(" ")[0] || "bg-gray-500/15"} ${planColors[tenant.plan]?.split(" ")[1] || "text-gray-400"}`}>
                            {planLabels[tenant.plan] || tenant.plan}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusColors[tenant.status] || statusColors.active}`}>
                            {tenant.status === "active" ? "Activo" : tenant.status === "suspended" ? "Suspendido" : "Cancelado"}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="text-sm text-white">
                            {tenant.usage?.currentUsers || 0} / {tenant.limits?.maxUsers === Infinity || tenant.limits?.maxUsers === 0 ? "∞" : tenant.limits?.maxUsers}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-sm text-gray-400">
                            {tenant.createdAt
                              ? new Date(tenant.createdAt).toLocaleDateString("es-AR")
                              : "-"}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <Link
                            to={`/superadmin/tenants/${tenant._id}`}
                            className="inline-flex items-center gap-1 rounded-lg bg-white/5 px-3 py-1.5 text-xs font-semibold text-gray-400 transition hover:bg-white/10 hover:text-white"
                          >
                            Ver
                            <ChevronRight size={14} />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex items-center justify-between border-t border-white/10 px-5 py-3">
                  <p className="text-xs text-gray-400">
                    Página {pagination.page} de {pagination.pages}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-gray-400 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
                    >
                      Anterior
                    </button>
                    <button
                      onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                      disabled={page === pagination.pages}
                      className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-gray-400 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </SuperAdminLayout>
  );
}
