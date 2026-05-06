import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, CreditCard, ArrowUpRight, ArrowDownLeft, FileText, AlertCircle, Filter, X, Search, Plus, FileDown } from "lucide-react";

import { useClientAccount, CreateClientPaymentPayload } from "@features/clients/hooks/useClientAccount";
import { useClientDetail } from "@features/clients/hooks/useClients";
import { useSettings } from "@features/settings/hooks/useSettings";
import { usePermissions } from "@features/auth/hooks/usePermissions";
import { useAppToast } from "@features/notifications/components/AppToast";
import { formatCurrency, formatCompactCurrency } from "@shared/utils/currency";
import { formatDate, formatDateTime } from "@shared/utils/date";
import { getErrorMessage } from "@shared/utils/errors";
import { ClientAccountEntry, ClientEntryType } from "@shared/types";

// Export utilities (inline to avoid import issues)
const ENTRY_TYPE_LABELS_EXPORT: Record<ClientEntryType, string> = {
  CHARGE: "Cargo",
  PAYMENT: "Cobro",
  CREDIT_NOTE: "Nota de Crédito",
  DEBIT_NOTE: "Nota de Débito",
};

// Tipos de filtros
type DateFilter = "all" | "today" | "yesterday" | "7days" | "30days" | "90days" | "custom";

interface Filters {
  dateFilter: DateFilter;
  dateFrom: string;
  dateTo: string;
  types: ClientEntryType[];
  minAmount: string;
  maxAmount: string;
  search: string;
}

const ENTRY_TYPE_COLORS: Record<ClientEntryType, string> = {
  CHARGE: "bg-danger/15 text-danger",
  PAYMENT: "bg-success/15 text-success",
  CREDIT_NOTE: "bg-primary/15 text-primary",
  DEBIT_NOTE: "bg-warning/15 text-warning",
};

function EntryTypeIcon({ type }: { type: ClientEntryType }) {
  switch (type) {
    case "PAYMENT":
      return <ArrowUpRight size={14} />;
    case "CHARGE":
      return <ArrowDownLeft size={14} />;
    case "CREDIT_NOTE":
      return <FileText size={14} />;
    case "DEBIT_NOTE":
      return <AlertCircle size={14} />;
  }
}

const ENTRY_TYPE_LABELS = {
  CHARGE: "Cargo",
  PAYMENT: "Cobro",
  CREDIT_NOTE: "Nota de Crédito",
  DEBIT_NOTE: "Nota de Débito",
};

export default function ClientAccountDetailPage() {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { showToast } = useAppToast();
  const { can } = usePermissions();
  const currency = settings?.currency || "USD";

  const { client } = useClientDetail(clientId);
  const { entries, balance, loading, createPayment, isCreatingPayment } = useClientAccount(clientId);
  
  const [selectedEntry, setSelectedEntry] = useState<ClientAccountEntry | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    dateFilter: "all",
    dateFrom: "",
    dateTo: "",
    types: [],
    minAmount: "",
    maxAmount: "",
    search: "",
  });

  const canCreatePayment = can.manageAccounting || can.manageClients;

  // Calcular fechas para filtros rápidos
  const getDateRange = (filter: DateFilter): { from: string; to: string } => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    switch (filter) {
      case "today":
        return { 
          from: today.toISOString().split('T')[0], 
          to: today.toISOString().split('T')[0] 
        };
      case "yesterday": {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        return { 
          from: yesterday.toISOString().split('T')[0], 
          to: yesterday.toISOString().split('T')[0] 
        };
      }
      case "7days": {
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        return { 
          from: sevenDaysAgo.toISOString().split('T')[0], 
          to: today.toISOString().split('T')[0] 
        };
      }
      case "30days": {
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return { 
          from: thirtyDaysAgo.toISOString().split('T')[0], 
          to: today.toISOString().split('T')[0] 
        };
      }
      case "90days": {
        const ninetyDaysAgo = new Date(today);
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        return { 
          from: ninetyDaysAgo.toISOString().split('T')[0], 
          to: today.toISOString().split('T')[0] 
        };
      }
      case "custom":
        return { from: filters.dateFrom, to: filters.dateTo };
      default:
        return { from: "", to: "" };
    }
  };

  // Filtrar entries
  const filteredEntries = useMemo(() => {
    let result = [...entries];

    // Filtro de fecha
    if (filters.dateFilter !== "all") {
      const { from, to } = getDateRange(filters.dateFilter);
      if (from) result = result.filter(e => e.date >= from);
      if (to) result = result.filter(e => e.date <= to);
    }

    // Filtro de tipo
    if (filters.types.length > 0) {
      result = result.filter(e => filters.types.includes(e.type));
    }

    // Filtro de monto mínimo
    if (filters.minAmount) {
      result = result.filter(e => e.amount >= parseFloat(filters.minAmount));
    }

    // Filtro de monto máximo
    if (filters.maxAmount) {
      result = result.filter(e => e.amount <= parseFloat(filters.maxAmount));
    }

    // Filtro de búsqueda (referencia o notas)
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(e => 
        e.reference?.toLowerCase().includes(searchLower) ||
        e.notes?.toLowerCase().includes(searchLower) ||
        e.paymentMethod?.toLowerCase().includes(searchLower)
      );
    }

    // Ordenar por fecha descendente
    result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return result;
  }, [entries, filters]);

  // Calcular totales de entries filtrados
  const filteredTotals = useMemo(() => {
    let charges = 0;
    let payments = 0;
    filteredEntries.forEach(e => {
      if (e.sign > 0) charges += e.amount;
      else payments += e.amount;
    });
    return { charges, payments, count: filteredEntries.length };
  }, [filteredEntries]);

  const quickDateFilters = [
    { key: "all", label: "Todos" },
    { key: "today", label: "Hoy" },
    { key: "yesterday", label: "Ayer" },
    { key: "7days", label: "7 días" },
    { key: "30days", label: "30 días" },
    { key: "90days", label: "90 días" },
  ] as const;

  const toggleType = (type: ClientEntryType) => {
    setFilters(prev => ({
      ...prev,
      types: prev.types.includes(type)
        ? prev.types.filter(t => t !== type)
        : [...prev.types, type]
    }));
  };

  const clearFilters = () => {
    setFilters({
      dateFilter: "all",
      dateFrom: "",
      dateTo: "",
      types: [],
      minAmount: "",
      maxAmount: "",
      search: "",
    });
  };

  const hasActiveFilters = filters.dateFilter !== "all" || 
    filters.types.length > 0 || 
    filters.minAmount || 
    filters.maxAmount || 
    filters.search;

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ["Fecha", "Tipo", "Monto", "Signo", "Metodo", "Referencia", "Notas"];
    const rows = filteredEntries.map(entry => [
      entry.date,
      ENTRY_TYPE_LABELS_EXPORT[entry.type],
      entry.amount.toString(),
      entry.sign > 0 ? "+" : "-",
      entry.paymentMethod || "",
      entry.reference || "",
      entry.notes || "",
    ]);
    
    const csvContent = [headers.join(","), ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `cuenta_corriente_${client?.name?.replace(/[^a-zA-Z0-9]/g, "_") || "cliente"}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast({ variant: "success", message: "CSV descargado" });
  };

  // Export to PDF (simplified version using print)
  const handleExportPDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      showToast({ variant: "error", message: "No se pudo abrir ventana de impresión" });
      return;
    }
    
    const html = `
      <html>
        <head>
          <title>Cuenta Corriente - ${client?.name || "Cliente"}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #333; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f4f4f4; }
            .saldo { font-size: 24px; font-weight: bold; margin: 10px 0; }
          </style>
        </head>
        <body>
          <h1>Cuenta Corriente</h1>
          <h2>${client?.name || "Cliente"}</h2>
          <p class="saldo">Saldo: ${formatCurrency(Math.abs(balance), currency)} ${balance > 0 ? "(Debe)" : "(A favor)"}</p>
          <p>Total movimientos: ${filteredEntries.length}</p>
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Monto</th>
                <th>Método</th>
                <th>Referencia</th>
              </tr>
            </thead>
            <tbody>
              ${filteredEntries.map(e => `
                <tr>
                  <td>${e.date}</td>
                  <td>${ENTRY_TYPE_LABELS_EXPORT[e.type]}</td>
                  <td>${e.sign > 0 ? "+" : "-"}${e.amount}</td>
                  <td>${e.paymentMethod || "-"}</td>
                  <td>${e.reference || "-"}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </body>
      </html>
    `;
    
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
    showToast({ variant: "success", message: "PDF generado" });
  };

  if (!clientId) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-default-400">Cliente no especificado</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 border-b border-white/10 bg-background/80 backdrop-blur-xl px-4 py-4 lg:px-6">
        <div className="flex items-center gap-3">
          <button
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-content2 text-default-400 transition hover:text-foreground"
            onClick={() => navigate("/client-account")}
          >
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-default-400">Cuenta Corriente</p>
            <h1 className="truncate text-lg font-bold text-foreground">
              {client?.name || "Cargando..."}
            </h1>
          </div>
          {/* Export Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-content2 px-3 py-2 text-xs font-semibold text-default-500 transition hover:text-foreground"
            >
              <FileDown size={14} />
              <span className="hidden sm:inline">CSV</span>
            </button>
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-content2 px-3 py-2 text-xs font-semibold text-default-500 transition hover:text-foreground"
            >
              <FileDown size={14} />
              <span className="hidden sm:inline">PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-4 lg:px-6 lg:py-6">
        <div className="mx-auto max-w-4xl">
          {/* Balance Card */}
          <div className={`rounded-2xl border p-4 mb-4 ${balance > 0 ? "border-danger/20 bg-danger/10" : "border-success/20 bg-success/10"}`}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-default-500">Saldo Total</p>
            <p className={`mt-1 text-2xl font-bold ${balance > 0 ? "text-danger" : "text-success"}`}>
              {formatCurrency(Math.abs(balance), currency)}
            </p>
          </div>

          {/* Filtros Rápidos de Fecha */}
          <div className="mb-4">
            <div className="flex flex-wrap gap-1.5">
              {quickDateFilters.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFilters(prev => ({ ...prev, dateFilter: key }))}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    filters.dateFilter === key
                      ? "bg-primary text-primary-foreground"
                      : "bg-content2 text-default-500 hover:text-foreground"
                  }`}
                >
                  {label}
                </button>
              ))}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  showFilters || hasActiveFilters
                    ? "bg-primary/10 text-primary"
                    : "bg-content2 text-default-500 hover:text-foreground"
                }`}
              >
                <Filter size={12} />
                {hasActiveFilters ? "Filtros activos" : "Más filtros"}
              </button>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold bg-danger/10 text-danger transition hover:bg-danger/20"
                >
                  <X size={12} />
                  Limpiar
                </button>
              )}
            </div>
          </div>

          {/* Filtros Manuales Expandibles */}
          {showFilters && (
            <div className="mb-4 rounded-2xl border border-white/10 bg-content2 p-4 space-y-4">
              {/* Filtro por tipo */}
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-default-500">
                  Tipo de movimiento
                </p>
                <div className="flex flex-wrap gap-2">
                  {(["CHARGE", "PAYMENT", "CREDIT_NOTE", "DEBIT_NOTE"] as ClientEntryType[]).map((type) => (
                    <button
                      key={type}
                      onClick={() => toggleType(type)}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                        filters.types.includes(type)
                          ? ENTRY_TYPE_COLORS[type]
                          : "bg-content1 text-default-500 hover:text-foreground"
                      }`}
                    >
                      {ENTRY_TYPE_LABELS[type]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filtro de monto */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-default-500">
                    Monto mínimo
                  </label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={filters.minAmount}
                    onChange={(e) => setFilters(prev => ({ ...prev, minAmount: e.target.value }))}
                    className="w-full rounded-xl border border-white/10 bg-content1 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
                <div>
                  <label className="mb-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-default-500">
                    Monto máximo
                  </label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={filters.maxAmount}
                    onChange={(e) => setFilters(prev => ({ ...prev, maxAmount: e.target.value }))}
                    className="w-full rounded-xl border border-white/10 bg-content1 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>

              {/* Filtro de búsqueda */}
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-default-500">
                  <Search size={12} />
                  Buscar
                </label>
                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-content1 px-3 py-2">
                  <input
                    type="text"
                    placeholder="Referencia, notas o método de pago..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="flex-1 bg-transparent text-sm text-foreground placeholder:text-default-400 focus:outline-none"
                  />
                  {filters.search && (
                    <button
                      onClick={() => setFilters(prev => ({ ...prev, search: "" }))}
                      className="text-default-400 hover:text-foreground"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Totales Filtrados */}
          <div className="mb-4 grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-white/10 bg-content2 p-3 text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest text-default-500">Mostrando</p>
              <p className="mt-1 text-lg font-bold text-foreground">{filteredTotals.count}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-content2 p-3 text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest text-danger">Cargos</p>
              <p className="mt-1 text-sm font-bold text-danger">{formatCompactCurrency(filteredTotals.charges, currency)}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-content2 p-3 text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest text-success">Cobros</p>
              <p className="mt-1 text-sm font-bold text-success">{formatCompactCurrency(filteredTotals.payments, currency)}</p>
            </div>
          </div>

          {/* Entries List */}
          <div className="space-y-2 pb-28">
            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="animate-spin text-default-400" size={28} />
              </div>
            ) : filteredEntries.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-16 text-center text-default-400">
                <CreditCard size={40} />
                <p className="font-semibold">Sin movimientos</p>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-primary hover:underline"
                  >
                    Limpiar filtros
                  </button>
                )}
              </div>
            ) : (
              filteredEntries.map((entry) => {
                const signed = entry.amount * entry.sign;
                return (
                  <button
                    key={entry._id}
                    className="flex w-full items-start gap-3 rounded-xl border border-white/6 bg-content2 px-4 py-3 text-left transition hover:border-primary/20 hover:bg-primary/5"
                    onClick={() => setSelectedEntry(entry)}
                  >
                    <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${ENTRY_TYPE_COLORS[entry.type]}`}>
                      <EntryTypeIcon type={entry.type} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${ENTRY_TYPE_COLORS[entry.type]}`}>
                          {ENTRY_TYPE_LABELS[entry.type]}
                        </span>
                        <span className={`text-sm font-bold ${signed > 0 ? "text-danger" : "text-success"}`}>
                          {signed > 0 ? "+" : ""}
                          {formatCompactCurrency(signed, currency)}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-default-400">
                        <span>{formatDate(entry.date)}</span>
                        {entry.order && (
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                            Venta
                          </span>
                        )}
                        {entry.paymentMethod && (
                          <>
                            <span>·</span>
                            <span>{entry.paymentMethod}</span>
                          </>
                        )}
                        {entry.reference && (
                          <>
                            <span>·</span>
                            <span className="truncate max-w-[120px]">{entry.reference}</span>
                          </>
                        )}
                      </div>
                      {entry.notes && (
                        <p className="mt-1 text-[11px] text-default-400 line-clamp-1">{entry.notes}</p>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Floating Action Button - Register Payment */}
      {canCreatePayment && (
        <button
          onClick={() => setShowPaymentModal(true)}
          className="fixed bottom-[100px] right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-success text-white shadow-lg shadow-success/35 transition hover:scale-105 active:scale-95"
        >
          <Plus size={28} strokeWidth={2.5} />
        </button>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal
          currency={currency}
          onClose={() => setShowPaymentModal(false)}
          onSubmit={async (data) => {
            try {
              const payload: CreateClientPaymentPayload = {
                date: data.date,
                amount: parseFloat(data.amount),
                paymentMethod: data.paymentMethod || undefined,
                reference: data.reference || undefined,
                notes: data.notes || undefined,
              };
              await createPayment(payload);
              showToast({ variant: "success", message: "Cobro registrado correctamente" });
              setShowPaymentModal(false);
            } catch (err) {
              showToast({ variant: "error", message: getErrorMessage(err, "Error al registrar cobro") });
            }
          }}
          submitting={isCreatingPayment}
        />
      )}

      {/* Entry Detail Modal */}
      {selectedEntry && (
        <EntryDetailModal
          entry={selectedEntry}
          clientName={client?.name || "Cliente"}
          currency={currency}
          onClose={() => setSelectedEntry(null)}
        />
      )}
    </div>
  );
}

// ── Entry Detail Modal Component ──────────────────────────────────────

const ENTRY_TYPE_DETAIL_COLORS: Record<ClientEntryType, { bg: string; text: string; border: string }> = {
  CHARGE: { bg: "bg-danger/10", text: "text-danger", border: "border-danger/20" },
  PAYMENT: { bg: "bg-success/10", text: "text-success", border: "border-success/20" },
  CREDIT_NOTE: { bg: "bg-primary/10", text: "text-primary", border: "border-primary/20" },
  DEBIT_NOTE: { bg: "bg-warning/10", text: "text-warning", border: "border-warning/20" },
};

function EntryDetailModal({
  entry,
  clientName,
  currency,
  onClose,
}: {
  entry: ClientAccountEntry;
  clientName: string;
  currency: string;
  onClose: () => void;
}) {
  const colors = ENTRY_TYPE_DETAIL_COLORS[entry.type];
  const signedAmount = entry.amount * entry.sign;
  const isSystemEntry = !!entry.order;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      
      <div className="relative z-10 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 bg-content1 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-content1 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${colors.bg} ${colors.text}`}>
              <EntryTypeIcon type={entry.type} />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{ENTRY_TYPE_LABELS[entry.type]}</p>
              <p className="text-xs text-default-400">{clientName}</p>
            </div>
          </div>
          <button
            className="rounded-full p-2 text-default-400 transition hover:bg-content2 hover:text-foreground"
            onClick={onClose}
          >
            <ArrowLeft size={20} className="rotate-180" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5">
          {/* Amount Card */}
          <div className={`rounded-2xl border ${colors.border} ${colors.bg} p-5`}>
            <p className="text-xs font-semibold uppercase tracking-widest text-default-500">Monto</p>
            <p className={`mt-2 text-3xl font-bold ${colors.text}`}>
              {signedAmount > 0 ? "+" : ""}
              {formatCurrency(signedAmount, currency)}
            </p>
            <p className="mt-1 text-xs text-default-400">
              {entry.sign > 0 ? "Aumenta la deuda" : "Reduce la deuda"}
            </p>
          </div>

          {/* Details */}
          <div className="grid gap-3">
            <div className="flex items-center justify-between rounded-xl bg-content2 px-4 py-3">
              <span className="text-sm text-default-500">Fecha</span>
              <span className="text-sm font-semibold text-foreground">{formatDateTime(entry.date)}</span>
            </div>
            
            <div className="flex items-center justify-between rounded-xl bg-content2 px-4 py-3">
              <span className="text-sm text-default-500">Registrado</span>
              <span className="text-sm text-foreground">{formatDateTime(entry.createdAt)}</span>
            </div>

            {entry.paymentMethod && (
              <div className="flex items-center justify-between rounded-xl bg-content2 px-4 py-3">
                <span className="text-sm text-default-500">Método de pago</span>
                <span className="text-sm font-semibold text-foreground">{entry.paymentMethod}</span>
              </div>
            )}

            {entry.reference && (
              <div className="flex items-center justify-between rounded-xl bg-content2 px-4 py-3">
                <span className="text-sm text-default-500">Referencia</span>
                <span className="text-sm font-mono text-foreground">{entry.reference}</span>
              </div>
            )}

            {entry.order && (
              <div className="rounded-xl bg-primary/5 border border-primary/20 px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-primary">Venta asociada</span>
                  <button
                    className="text-xs font-semibold text-primary hover:underline"
                    onClick={() => {
                      const orderId = typeof entry.order === 'object' && entry.order !== null 
                        ? (entry.order as { _id: string })._id 
                        : entry.order;
                      window.open(`/sales/${orderId}`, "_blank");
                    }}
                  >
                    Ver venta →
                  </button>
                </div>
                <p className="mt-1 text-xs text-default-400">
                  Este movimiento fue generado automáticamente desde una venta
                </p>
              </div>
            )}
          </div>

          {/* Notes */}
          {entry.notes && (
            <div className="rounded-xl bg-content2 px-4 py-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-default-500">Notas</p>
              <p className="text-sm text-foreground whitespace-pre-wrap">{entry.notes}</p>
            </div>
          )}

          {/* Entry Type Badge */}
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${colors.bg} ${colors.text}`}>
              {isSystemEntry ? "Generado automáticamente" : "Entrada manual"}
            </span>
          </div>
        </div>

        {/* Close Button */}
        <div className="sticky bottom-0 border-t border-white/10 bg-content1 p-4">
          <button
            className="w-full rounded-xl bg-content2 py-3 text-sm font-semibold text-foreground transition hover:bg-content2/80"
            onClick={onClose}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Payment Modal Component ───────────────────────────────────────────

interface PaymentFormData {
  date: string;
  amount: string;
  paymentMethod: string;
  reference: string;
  notes: string;
}

function PaymentModal({
  currency,
  onClose,
  onSubmit,
  submitting,
}: {
  currency: string;
  onClose: () => void;
  onSubmit: (data: PaymentFormData) => void;
  submitting: boolean;
}) {
  const [form, setForm] = useState<PaymentFormData>({
    date: new Date().toISOString().split('T')[0],
    amount: "",
    paymentMethod: "",
    reference: "",
    notes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 bg-content1 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/15 text-success">
              <ArrowUpRight size={20} />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Registrar Cobro</p>
              <p className="text-xs text-default-400">Nuevo pago del cliente</p>
            </div>
          </div>
          <button className="rounded-full p-2 text-default-400 transition hover:bg-content2" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form className="p-5 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-default-500">
              Fecha
            </label>
            <input
              required
              type="date"
              value={form.date}
              onChange={(e) => setForm(f => ({ ...f, date: e.target.value }))}
              className="w-full rounded-xl border border-white/10 bg-content2 px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-default-500">
              Monto ({currency})
            </label>
            <input
              required
              type="number"
              min="0.01"
              step="0.01"
              placeholder="0.00"
              value={form.amount}
              onChange={(e) => setForm(f => ({ ...f, amount: e.target.value }))}
              className="w-full rounded-xl border border-white/10 bg-content2 px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-default-500">
              Método de Cobro
            </label>
            <input
              type="text"
              placeholder="Transferencia, efectivo..."
              value={form.paymentMethod}
              onChange={(e) => setForm(f => ({ ...f, paymentMethod: e.target.value }))}
              className="w-full rounded-xl border border-white/10 bg-content2 px-3 py-2.5 text-sm text-foreground placeholder:text-default-400 focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-default-500">
              Referencia
            </label>
            <input
              type="text"
              placeholder="N° comprobante..."
              value={form.reference}
              onChange={(e) => setForm(f => ({ ...f, reference: e.target.value }))}
              className="w-full rounded-xl border border-white/10 bg-content2 px-3 py-2.5 text-sm text-foreground placeholder:text-default-400 focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-default-500">
              Notas
            </label>
            <textarea
              rows={3}
              placeholder="Observaciones..."
              value={form.notes}
              onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
              className="w-full resize-none rounded-xl border border-white/10 bg-content2 px-3 py-2.5 text-sm text-foreground placeholder:text-default-400 focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl bg-content2 py-3 text-sm font-semibold text-foreground transition hover:bg-content2/80"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting || !form.amount}
              className="flex-1 rounded-xl bg-success py-3 text-sm font-semibold text-white transition hover:bg-success/90 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="mx-auto animate-spin" size={18} /> : "Confirmar Cobro"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
