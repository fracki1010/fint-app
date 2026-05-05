import { useState } from "react";
import { ClipboardList, Loader2, Filter, X, ChevronDown } from "lucide-react";
import { useAuditLogs } from "@/hooks/useSuperAdmin";
import SuperAdminLayout from "@/components/superadmin/SuperAdminLayout";

const ACTION_LABELS: Record<string, string> = {
  "tenant.created": "Tenant Creado",
  "tenant.updated": "Tenant Actualizado",
  "tenant.suspended": "Tenant Suspendido",
  "tenant.activated": "Tenant Activado",
  "tenant.plan_changed": "Plan Cambiado",
};

const ACTION_COLORS: Record<string, string> = {
  "tenant.created": "bg-success/15 text-success",
  "tenant.updated": "bg-primary/15 text-primary",
  "tenant.suspended": "bg-danger/15 text-danger",
  "tenant.activated": "bg-success/15 text-success",
  "tenant.plan_changed": "bg-purple-500/15 text-purple-400",
};

export default function AuditLogPage() {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { logs, pagination, loading } = useAuditLogs({
    page,
    limit: 25,
    action: actionFilter || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });

  const formatTimestamp = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const clearFilters = () => {
    setActionFilter("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  const hasFilters = actionFilter || dateFrom || dateTo;

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Audit Log</h1>
            <p className="text-sm text-default-400">
              {pagination.total} {pagination.total === 1 ? "registro" : "registros"} de actividad
            </p>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold transition ${
              showFilters || hasFilters
                ? "border-primary/20 bg-primary/10 text-primary"
                : "border-divider bg-content2 text-foreground hover:bg-content3"
            }`}
          >
            <Filter size={16} />
            Filtros
            {hasFilters && <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">!</span>}
          </button>
        </div>

        {/* Filters */}
        {(showFilters || hasFilters) && (
          <div className="rounded-2xl border border-divider bg-content1 p-4">
            <div className="flex flex-wrap items-end gap-4">
              <div className="min-w-[180px]">
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-default-500">
                  Acción
                </label>
                <select
                  value={actionFilter}
                  onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
                  className="w-full rounded-xl border border-divider bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
                >
                  <option value="">Todas</option>
                  <option value="tenant.created">Creado</option>
                  <option value="tenant.updated">Actualizado</option>
                  <option value="tenant.suspended">Suspendido</option>
                  <option value="tenant.activated">Activado</option>
                  <option value="tenant.plan_changed">Plan Cambiado</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-default-500">
                  Desde
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                  className="rounded-xl border border-divider bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-default-500">
                  Hasta
                </label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                  className="rounded-xl border border-divider bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
                />
              </div>
              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1.5 rounded-xl border border-divider bg-content2 px-4 py-2.5 text-sm font-semibold text-default-400 transition hover:text-foreground"
                >
                  <X size={14} />
                  Limpiar
                </button>
              )}
            </div>
          </div>
        )}

        {/* List */}
        <div className="rounded-2xl border border-divider bg-content1">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 size={32} className="animate-spin text-primary" />
            </div>
          ) : logs.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center gap-3">
              <ClipboardList size={48} className="text-default-300" />
              <p className="text-lg font-semibold text-default-400">Sin registros</p>
              <p className="text-sm text-default-500">
                {hasFilters ? "No hay registros con estos filtros" : "No hay actividad registrada aún"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-divider">
              {logs.map((log) => {
                const isExpanded = expandedId === log._id;
                const actionColor = ACTION_COLORS[log.action] || "bg-default-200/50 text-default-500";
                const actionLabel = ACTION_LABELS[log.action] || log.action;

                return (
                  <div key={log._id}>
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : log._id)}
                      className="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-content2/50"
                    >
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${actionColor}`}>
                        <ClipboardList size={14} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${actionColor}`}>
                            {actionLabel}
                          </span>
                          {log.tenant && (
                            <span className="text-sm font-semibold text-foreground truncate">
                              {log.tenant.name}
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-default-400">
                          por {log.admin?.fullName || "?"} · {formatTimestamp(log.timestamp)}
                        </p>
                      </div>
                      <ChevronDown
                        size={16}
                        className={`shrink-0 text-default-500 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                      />
                    </button>

                    {isExpanded && (
                      <div className="border-t border-divider bg-content2/30 px-5 py-4">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-default-500">Admin</p>
                            <p className="mt-1 text-sm text-foreground">{log.admin?.fullName || "—"}</p>
                            <p className="text-xs text-default-400">{log.admin?.email || "—"}</p>
                          </div>
                          {log.tenant && (
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-widest text-default-500">Tenant</p>
                              <p className="mt-1 text-sm text-foreground">{log.tenant.name}</p>
                              <p className="text-xs text-default-400">Plan: {log.tenant.plan}</p>
                            </div>
                          )}
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-default-500">IP</p>
                            <p className="mt-1 text-sm font-mono text-foreground">{log.ip || "—"}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-default-500">Timestamp</p>
                            <p className="mt-1 text-sm text-foreground">{formatTimestamp(log.timestamp)}</p>
                          </div>
                        </div>
                        {log.details && Object.keys(log.details).length > 0 && (
                          <div className="mt-3">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-default-500">Detalles</p>
                            <pre className="mt-1 overflow-x-auto rounded-lg bg-background p-3 text-xs text-default-300 font-mono">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-default-400">
              Página {pagination.page} de {pagination.pages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg border border-divider bg-content2 px-3 py-1.5 text-xs font-semibold text-default-400 transition hover:bg-content3 hover:text-foreground disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                disabled={page === pagination.pages}
                className="rounded-lg border border-divider bg-content2 px-3 py-1.5 text-xs font-semibold text-default-400 transition hover:bg-content3 hover:text-foreground disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>
    </SuperAdminLayout>
  );
}
