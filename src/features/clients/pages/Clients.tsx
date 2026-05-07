import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  AlertCircle,
  ArrowUpDown,
  ChevronRight,
  FileSpreadsheet,
  Filter,
  Loader2,
  Mail,
  Search,
  TrendingDown,
  TrendingUp,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import {
  useClientDetail,
  useClients,
  useInfiniteClients,
} from "@features/clients/hooks/useClients";
import { useIsDesktop } from "@shared/hooks/useIsDesktop";
import { useMobileHeaderCompact } from "@shared/hooks/useMobileHeaderCompact";
import { useSettings } from "@features/settings/hooks/useSettings";
import { Client } from "@shared/types";
import { useAppToast } from "@features/notifications/components/AppToast";
import { Badge } from "@shared/components/Badge";
import { formatCompactCurrency } from "@shared/utils/currency";
import { getErrorMessage } from "@shared/utils/errors";
import { PaginationBar } from "@shared/components/PaginationBar";
import { Button } from "../components/Button";
import { Select } from "../components/Select";

import { MetricCard } from "../components/MetricCard";
import { EmptyState } from "../components/EmptyState";
import { ClientFormModal, ClientFormState, emptyForm } from "../components/ClientFormModal";
import { ClientDetailPanel } from "../components/ClientDetailPanel";

// ── Tipos ───────────────────────────────────────────────────────────────

type SortField = "name" | "company" | "debt" | "createdAt";
type SortDirection = "asc" | "desc";
type FilterType = "all" | "withDebt" | "noDebt" | "withEmail" | "noEmail";

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

function generateClientCSV(clients: Client[], currency: string): string {
  const headers = [
    "Nombre",
    "Empresa",
    "Teléfono",
    "Email",
    "Documento Fiscal",
    "Dirección",
    "Dirección Fiscal",
    "Deuda",
    "Moneda",
    "Notas",
  ];

  const rows = clients.map((client) => [
    client.name || "",
    client.company || "",
    client.phone || "",
    client.email || "",
    client.taxId || "",
    client.address || "",
    client.fiscalAddress || "",
    client.debt?.toString() || "0",
    currency,
    client.notes || "",
  ]);

  return [headers.join(","), ...rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))].join("\n");
}

function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ── Filtros y Ordenamiento ──────────────────────────────────────────────

function FiltersPanel({
  isOpen,
  onClose,
  filter,
  setFilter,
  sortField,
  setSortField,
  sortDirection,
  setSortDirection,
  companies,
  selectedCompany,
  setSelectedCompany,
}: {
  isOpen: boolean;
  onClose: () => void;
  filter: FilterType;
  setFilter: (f: FilterType) => void;
  sortField: SortField;
  setSortField: (f: SortField) => void;
  sortDirection: SortDirection;
  setSortDirection: (d: SortDirection) => void;
  companies: string[];
  selectedCompany: string;
  setSelectedCompany: (c: string) => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-2xl border border-white/10 bg-content1 p-4 shadow-2xl shadow-black/20">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground">Filtros</h3>
        <button
          onClick={onClose}
          className="rounded-lg p-1 text-default-400 hover:bg-content2 hover:text-foreground"
          aria-label="Cerrar filtros"
        >
          <X size={16} />
        </button>
      </div>

      <div className="space-y-4">
        <Select
          label="Filtrar por estado"
          value={filter}
          onChange={(v) => setFilter(v as FilterType)}
          options={[
            { value: "all", label: "Todos los clientes" },
            { value: "withDebt", label: "Con deuda" },
            { value: "noDebt", label: "Sin deuda" },
            { value: "withEmail", label: "Con email" },
            { value: "noEmail", label: "Sin email" },
          ]}
        />

        {companies.length > 0 && (
          <Select
            label="Filtrar por empresa"
            value={selectedCompany}
            onChange={setSelectedCompany}
            options={[
              { value: "", label: "Todas las empresas" },
              ...companies.map((c) => ({ value: c, label: c })),
            ]}
          />
        )}

        <div>
          <span className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-default-500">
            Ordenar por
          </span>
          <div className="flex gap-2">
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as SortField)}
              className="corp-input flex-1 px-3 py-2 text-sm"
            >
              <option value="name">Nombre</option>
              <option value="company">Empresa</option>
              <option value="debt">Deuda</option>
              <option value="createdAt">Fecha de creación</option>
            </select>
            <button
              onClick={() => setSortDirection(sortDirection === "asc" ? "desc" : "asc")}
              className="corp-input flex items-center justify-center px-3"
              aria-label={`Orden ${sortDirection === "asc" ? "descendente" : "ascendente"}`}
            >
              <ArrowUpDown
                size={16}
                className={`transition-transform ${sortDirection === "desc" ? "rotate-180" : ""}`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Componente Principal ────────────────────────────────────────────────

export default function ClientsPage() {
  const navigate = useNavigate();
  const { clientId } = useParams<{ clientId?: string }>();
  const isDesktop = useIsDesktop();
  const isHeaderCompact = useMobileHeaderCompact();
  const { settings } = useSettings();
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const filtersRef = useRef<HTMLDivElement>(null);

  const { clients, total, loading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteClients(20);
  const { createClient, updateClient, deleteClient, isCreating, isUpdating, isDeleting } = useClients({ enabled: false });
  const { client: selectedClient } = useClientDetail(clientId);
  const { showToast } = useAppToast();
  const currency = settings?.currency || "USD";

  // Paginación desktop
  const DESKTOP_PAGE_SIZE = 15;
  const [desktopPage, setDesktopPage] = useState(1);

  // Estados del formulario
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [formData, setFormData] = useState<ClientFormState>(emptyForm);

  // Estados de filtros
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [selectedCompany, setSelectedCompany] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Cerrar filtros al hacer click fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filtersRef.current && !filtersRef.current.contains(event.target as Node)) {
        setShowFilters(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const safeClients = useMemo(
    () => clients.filter((c): c is Client => Boolean(c && typeof c === "object" && c._id)),
    [clients]
  );

  // Filtrado y ordenamiento
  const filteredAndSortedClients = useMemo(() => {
    let result = [...safeClients];

    // Filtrar por búsqueda
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.name?.toLowerCase().includes(query) ||
          c.phone?.includes(query) ||
          c.company?.toLowerCase().includes(query) ||
          c.email?.toLowerCase().includes(query) ||
          c.taxId?.toLowerCase().includes(query)
      );
    }

    // Filtrar por tipo
    switch (filter) {
      case "withDebt":
        result = result.filter((c) => Number(c.debt || 0) > 0);
        break;
      case "noDebt":
        result = result.filter((c) => Number(c.debt || 0) === 0);
        break;
      case "withEmail":
        result = result.filter((c) => c.email);
        break;
      case "noEmail":
        result = result.filter((c) => !c.email);
        break;
    }

    // Filtrar por empresa
    if (selectedCompany) {
      result = result.filter((c) => c.company === selectedCompany);
    }

    // Ordenar
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "name":
          comparison = (a.name || "").localeCompare(b.name || "");
          break;
        case "company":
          comparison = (a.company || "").localeCompare(b.company || "");
          break;
        case "debt":
          comparison = Number(a.debt || 0) - Number(b.debt || 0);
          break;
        case "createdAt":
          comparison =
            new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
          break;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return result;
  }, [safeClients, searchQuery, filter, sortField, sortDirection, selectedCompany]);

  useEffect(() => {
    setDesktopPage(1);
  }, [searchQuery, filter, selectedCompany, sortField, sortDirection]);

  const desktopItems = isDesktop
    ? filteredAndSortedClients.slice((desktopPage - 1) * DESKTOP_PAGE_SIZE, desktopPage * DESKTOP_PAGE_SIZE)
    : filteredAndSortedClients;
  const desktopTotalPages = Math.ceil((total ?? filteredAndSortedClients.length) / DESKTOP_PAGE_SIZE);

  const handleDesktopNext = () => {
    const next = desktopPage + 1;
    if (next * DESKTOP_PAGE_SIZE > safeClients.length && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
    setDesktopPage(next);
  };

  const companies = useMemo(
    () => Array.from(new Set(safeClients.map((c) => c.company).filter((c): c is string => Boolean(c)))),
    [safeClients]
  );

  const totalDebt = useMemo(
    () => safeClients.reduce((sum, c) => sum + Number(c.debt || 0), 0),
    [safeClients]
  );

  const clientsWithDebt = useMemo(
    () => safeClients.filter((c) => Number(c.debt || 0) > 0).length,
    [safeClients]
  );

  // Infinite scroll para móvil
  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target || !hasNextPage || isDesktop) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isFetchingNextPage) fetchNextPage();
      },
      { rootMargin: "240px 0px" }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, filteredAndSortedClients.length, isDesktop]);

  // Cargar datos del cliente en el formulario de edición
  useEffect(() => {
    if (isEditOpen && selectedClient) {
      setFormData({
        name: selectedClient.name || "",
        email: selectedClient.email || "",
        phone: selectedClient.phone || "",
        taxId: selectedClient.taxId || "",
        address: selectedClient.address || "",
        fiscalAddress: selectedClient.fiscalAddress || "",
        company: selectedClient.company || "",
        notes: selectedClient.notes || "",
        debt: selectedClient.debt?.toString() || "0",
        priceList: selectedClient.priceList || "retail",
        creditLimit: selectedClient.creditLimit?.toString() || "0",
      });
    }
  }, [isEditOpen, selectedClient]);

  const handleChange = (field: keyof ClientFormState, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const buildPayload = () => ({
    name: formData.name.trim(),
    email: formData.email.trim() || undefined,
    phone: formData.phone.trim(),
    taxId: formData.taxId.trim(),
    address: formData.address.trim() || undefined,
    fiscalAddress: formData.fiscalAddress.trim() || undefined,
    company: formData.company.trim() || undefined,
    notes: formData.notes.trim() || undefined,
    debt: Number(formData.debt || 0),
    priceList: formData.priceList,
  });

  const handleCreate = async () => {
    if (!formData.name.trim() || !formData.phone.trim() || !formData.taxId.trim()) {
      showToast({ variant: "warning", message: "Completá nombre, teléfono y documento fiscal." });
      return;
    }
    try {
      await createClient(buildPayload());
      setIsCreateOpen(false);
      setFormData(emptyForm);
      showToast({ variant: "success", message: "Cliente creado correctamente." });
    } catch (error) {
      showToast({ variant: "error", message: getErrorMessage(error, "No se pudo crear el cliente.") });
    }
  };

  const handleUpdate = async () => {
    if (!clientId) return;
    if (!formData.taxId.trim()) {
      showToast({ variant: "warning", message: "El documento fiscal es obligatorio." });
      return;
    }
    try {
      await updateClient({ id: clientId, clientData: buildPayload() });
      setIsEditOpen(false);
      showToast({ variant: "success", message: "Cliente actualizado." });
    } catch (error) {
      showToast({ variant: "error", message: getErrorMessage(error, "No se pudo actualizar el cliente.") });
    }
  };

  const handleDelete = async () => {
    if (!clientId || !selectedClient) return;
    if (!window.confirm(`¿Desactivar a ${selectedClient.name}?`)) return;
    try {
      await deleteClient(clientId);
      navigate("/clients");
      showToast({ variant: "success", message: "Cliente desactivado." });
    } catch (error) {
      showToast({ variant: "error", message: getErrorMessage(error, "No se pudo desactivar el cliente.") });
    }
  };

  const handleExportCSV = useCallback(() => {
    const csv = generateClientCSV(filteredAndSortedClients, currency);
    const filename = `clientes_${new Date().toISOString().split("T")[0]}.csv`;
    downloadCSV(csv, filename);
    showToast({ variant: "success", message: `Exportados ${filteredAndSortedClients.length} clientes a CSV` });
  }, [filteredAndSortedClients, currency, showToast]);

  const clearFilters = () => {
    setSearchQuery("");
    setFilter("all");
    setSelectedCompany("");
    setSortField("name");
    setSortDirection("asc");
  };

  const activeFiltersCount = (filter !== "all" ? 1 : 0) + (selectedCompany ? 1 : 0);

  // Vista móvil: detalle completo
  if (!isDesktop && clientId) {
    return (
      <div className="flex h-screen flex-col bg-background">
        <ClientDetailPanel
          clientId={clientId}
          currency={currency}
          isDesktop={false}
          isDeleting={isDeleting}
          onBack={() => navigate("/clients")}
          onDelete={handleDelete}
          onEdit={() => setIsEditOpen(true)}
        />
        {isEditOpen && (
          <ClientFormModal
            formData={formData}
            isDesktop={false}
            mode="edit"
            submitting={isUpdating}
            onChange={handleChange}
            onClose={() => setIsEditOpen(false)}
            onSubmit={handleUpdate}
          />
        )}
      </div>
    );
  }

  // Panel de lista
  const ListPanel = (
    <div className={`flex flex-col ${isDesktop ? "h-full" : "min-h-screen pb-28"}`}>
      {/* Header */}
      <div className={`shrink-0 page-header ${isHeaderCompact ? "py-3" : ""}`}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="page-title">Clientes</h1>
            {!isHeaderCompact && <p className="page-subtitle">Directorio comercial y seguimiento financiero</p>}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              icon={FileSpreadsheet}
              ariaLabel="Exportar a CSV"
              className="hidden sm:flex"
            >
              Exportar
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setFormData(emptyForm);
                setIsCreateOpen(true);
              }}
              icon={UserPlus}
            >
              Nuevo
            </Button>
          </div>
        </div>

        {/* Stats */}
        {!isHeaderCompact && (
          <div className={`mt-4 grid gap-3 ${isDesktop ? "grid-cols-4" : "grid-cols-2"}`}>
            <MetricCard
              label="Total Clientes"
              value={total || safeClients.length}
              subValue={`${companies.length} empresas`}
              icon={Users}
              color="primary"
            />
            <MetricCard
              label="Con Deuda"
              value={clientsWithDebt}
              subValue={`${((clientsWithDebt / (safeClients.length || 1)) * 100).toFixed(0)}% del total`}
              trend={clientsWithDebt > 0 ? "down" : "up"}
              icon={AlertCircle}
              color={clientsWithDebt > 0 ? "warning" : "success"}
            />
            {isDesktop && (
              <>
                <MetricCard
                  label="Deuda Total"
                  value={formatCompactCurrency(totalDebt, currency)}
                  subValue={totalDebt > 0 ? "Pendiente de cobro" : "Sin deudas"}
                  trend={totalDebt > 0 ? "down" : "up"}
                  icon={totalDebt > 0 ? TrendingDown : TrendingUp}
                  color={totalDebt > 0 ? "danger" : "success"}
                />
                <MetricCard
                  label="Con Email"
                  value={safeClients.filter((c) => c.email).length}
                  subValue={`${safeClients.filter((c) => c.email).length} contactables`}
                  icon={Mail}
                  color="info"
                />
              </>
            )}
          </div>
        )}

        {/* Search and Filters */}
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <div className="search-bar flex-1">
            <Search size={16} className="shrink-0 text-default-400" />
            <input
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-default-400 focus:outline-none"
              placeholder="Buscar por nombre, teléfono, empresa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Buscar clientes"
            />
            {searchQuery && (
              <button
                className="text-default-400 transition-colors hover:text-foreground"
                onClick={() => setSearchQuery("")}
                aria-label="Limpiar búsqueda"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2" ref={filtersRef}>
            <Button
              variant={activeFiltersCount > 0 ? "primary" : "secondary"}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              icon={Filter}
              className="relative"
            >
              Filtros
              {activeFiltersCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white">
                  {activeFiltersCount}
                </span>
              )}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              disabled={!searchQuery && filter === "all" && !selectedCompany}
              ariaLabel="Limpiar filtros"
            >
              Limpiar
            </Button>

            <FiltersPanel
              isOpen={showFilters}
              onClose={() => setShowFilters(false)}
              filter={filter}
              setFilter={setFilter}
              sortField={sortField}
              setSortField={setSortField}
              sortDirection={sortDirection}
              setSortDirection={setSortDirection}
              companies={companies}
              selectedCompany={selectedCompany}
              setSelectedCompany={setSelectedCompany}
            />
          </div>
        </div>

        {/* Active Filters Tags */}
        {activeFiltersCount > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {filter !== "all" && (
              <Badge variant="info" size="sm">
                {filter === "withDebt" && "Con deuda"}
                {filter === "noDebt" && "Sin deuda"}
                {filter === "withEmail" && "Con email"}
                {filter === "noEmail" && "Sin email"}
                <button
                  onClick={() => setFilter("all")}
                  className="ml-1 hover:text-foreground"
                  aria-label="Quitar filtro"
                >
                  <X size={10} />
                </button>
              </Badge>
            )}
            {selectedCompany && (
              <Badge variant="info" size="sm">
                {selectedCompany}
                <button
                  onClick={() => setSelectedCompany("")}
                  className="ml-1 hover:text-foreground"
                  aria-label="Quitar filtro de empresa"
                >
                  <X size={10} />
                </button>
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 py-4 lg:px-5">
        {loading && safeClients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="animate-spin text-primary" size={32} />
            <p className="mt-4 text-sm text-default-500">Cargando clientes...</p>
          </div>
        ) : filteredAndSortedClients.length === 0 ? (
          <EmptyState
            icon={Users}
            title={searchQuery || filter !== "all" || selectedCompany ? "Sin coincidencias" : "Sin clientes"}
            description={
              searchQuery || filter !== "all" || selectedCompany
                ? "Prueba ajustando los filtros o la búsqueda para ver más resultados."
                : "Comienza agregando tu primer cliente al directorio."
            }
            action={
              (searchQuery || filter !== "all" || selectedCompany) ? (
                <Button variant="secondary" onClick={clearFilters}>
                  Limpiar filtros
                </Button>
              ) : (
                <Button variant="primary" onClick={() => setIsCreateOpen(true)} icon={UserPlus}>
                  Agregar cliente
                </Button>
              )
            }
          />
        ) : (
          <div className="space-y-2 pb-28">
            {(isDesktop ? desktopItems : filteredAndSortedClients).map((client) => {
              const isSelected = client._id === clientId;
              const hasDebt = Number(client.debt || 0) > 0;

              return (
                <button
                  key={client._id}
                  className={`group w-full rounded-2xl border px-4 py-3.5 text-left transition-all duration-200 ${
                    isSelected
                      ? "border-primary/30 bg-primary/5 shadow-sm shadow-primary/10"
                      : "border-white/[0.06] bg-content2/30 hover:border-primary/20 hover:bg-content2/50"
                  }`}
                  onClick={() => navigate(`/clients/${client._id}`)}
                  aria-selected={isSelected}
                  role="listitem"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold transition-colors ${
                        isSelected
                          ? "bg-primary/20 text-primary"
                          : "bg-content1 text-default-500 group-hover:bg-primary/10 group-hover:text-primary/80"
                      }`}
                    >
                      {getInitials(client.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {client.name || "Sin nombre"}
                        </p>
                        {hasDebt && (
                          <Badge variant="danger" size="sm">
                            Deuda
                          </Badge>
                        )}
                      </div>
                      <div className="mt-0.5 flex items-center gap-2">
                        {client.company && (
                          <span className="max-w-[140px] truncate text-[11px] text-default-500">
                            {client.company}
                          </span>
                        )}
                        {!isDesktop && client.company && (
                          <span className="text-[11px] text-default-400">·</span>
                        )}
                        {!isDesktop && (
                          <span className="text-[11px] text-default-400">{client.phone}</span>
                        )}
                      </div>
                    </div>
                    {isDesktop && (
                      <div className="w-32 shrink-0 text-right">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-default-400">
                          Teléfono
                        </p>
                        <p className="text-xs font-semibold text-default-500">{client.phone || "—"}</p>
                      </div>
                    )}
                    <div className="shrink-0 text-right">
                      {isDesktop && (
                        <p className="text-[10px] font-bold uppercase tracking-wide text-default-400">
                          Deuda
                        </p>
                      )}
                      <p
                        className={`text-sm font-bold ${
                          hasDebt ? "text-danger" : "text-foreground"
                        }`}
                      >
                        {formatCompactCurrency(Number(client.debt || 0), currency)}
                      </p>
                    </div>
                    {isDesktop && (
                      <ChevronRight
                        size={16}
                        className={`shrink-0 transition-colors ${
                          isSelected ? "text-primary" : "text-default-300"
                        }`}
                      />
                    )}
                  </div>
                </button>
              );
            })}

            {/* Mobile Infinite Scroll */}
            {!isDesktop && (
              <>
                <div ref={loadMoreRef} className="h-4 w-full" />
                {isFetchingNextPage && (
                  <div className="flex justify-center py-4">
                    <Loader2 className="animate-spin text-default-400" size={20} />
                  </div>
                )}
                {!hasNextPage && safeClients.length > 0 && (
                  <p className="py-3 text-center text-[11px] text-default-400">Fin del directorio</p>
                )}
              </>
            )}

            {/* Desktop Pagination */}
            {isDesktop && (
              <PaginationBar
                from={(desktopPage - 1) * DESKTOP_PAGE_SIZE + 1}
                loading={isFetchingNextPage}
                page={desktopPage}
                to={Math.min(desktopPage * DESKTOP_PAGE_SIZE, total ?? filteredAndSortedClients.length)}
                total={total ?? filteredAndSortedClients.length}
                totalPages={desktopTotalPages}
                onNext={handleDesktopNext}
                onPrev={() => setDesktopPage((p) => p - 1)}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );

  // Desktop: slide-over
  if (isDesktop) {
    return (
      <>
        <div className="h-full">
          {ListPanel}
          <div
            className={`fixed inset-0 z-40 transition-all duration-300 ${
              clientId ? "bg-black/30 backdrop-blur-sm" : "pointer-events-none opacity-0"
            }`}
            onClick={() => navigate("/clients")}
            aria-hidden={!clientId}
          />
          <div
            className={`fixed right-0 top-0 z-50 h-screen w-[min(720px,58vw)] overflow-y-auto border-l border-white/10 bg-content1 shadow-[-24px_0_60px_rgba(40,25,15,0.28)] transition-transform duration-300 ease-in-out ${
              clientId ? "translate-x-0" : "translate-x-full"
            }`}
            role="complementary"
            aria-label="Detalle del cliente"
          >
            {clientId && (
              <ClientDetailPanel
                clientId={clientId}
                currency={currency}
                isDesktop
                isDeleting={isDeleting}
                onBack={() => navigate("/clients")}
                onClose={() => navigate("/clients")}
                onDelete={handleDelete}
                onEdit={() => setIsEditOpen(true)}
              />
            )}
          </div>
        </div>
        {isCreateOpen && (
          <ClientFormModal
            formData={formData}
            isDesktop
            mode="create"
            submitting={isCreating}
            onChange={handleChange}
            onClose={() => setIsCreateOpen(false)}
            onSubmit={handleCreate}
          />
        )}
        {isEditOpen && (
          <ClientFormModal
            formData={formData}
            isDesktop
            mode="edit"
            submitting={isUpdating}
            onChange={handleChange}
            onClose={() => setIsEditOpen(false)}
            onSubmit={handleUpdate}
          />
        )}
      </>
    );
  }

  // Mobile: list
  return (
    <>
      {ListPanel}
      {isCreateOpen && (
        <ClientFormModal
          formData={formData}
          isDesktop={false}
          mode="create"
          submitting={isCreating}
          onChange={handleChange}
          onClose={() => setIsCreateOpen(false)}
          onSubmit={handleCreate}
        />
      )}
    </>
  );
}
