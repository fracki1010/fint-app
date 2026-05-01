import { useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  UserPlus,
  Phone,
  ChevronRight,
  X,
  Loader2,
  Mail,
  Building2,
  MapPin,
  NotebookText,
  Trash2,
  Pencil,
  Users,
  ArrowLeft,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Drawer, DrawerBody, DrawerContent } from "@heroui/drawer";

import {
  useClientDetail,
  useClients,
  useInfiniteClients,
} from "@/hooks/useClients";
import { useIsDesktop } from "@/hooks/useIsDesktop";
import { useMobileHeaderCompact } from "@/hooks/useMobileHeaderCompact";
import { useSettings } from "@/hooks/useSettings";
import { Client } from "@/types";
import { useAppToast } from "@/components/AppToast";
import { formatCompactCurrency } from "@/utils/currency";
import { getErrorMessage } from "@/utils/errors";

type ClientFormState = {
  name: string; email: string; phone: string; taxId: string;
  address: string; fiscalAddress: string; company: string;
  notes: string; debt: string;
};

const emptyForm: ClientFormState = {
  name: "", email: "", phone: "", taxId: "",
  address: "", fiscalAddress: "", company: "", notes: "", debt: "0",
};

function getInitials(name: string) {
  if (!name) return "??";
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

// ── Client Form Modal ─────────────────────────────────────────────────

function ClientFormModal({
  mode, isDesktop, formData, onChange, onClose, onSubmit, submitting,
}: {
  mode: "create" | "edit"; isDesktop: boolean; formData: ClientFormState;
  onChange: (field: keyof ClientFormState, value: string) => void;
  onClose: () => void; onSubmit: () => void; submitting: boolean;
}) {
  const formScrollRef = useRef<HTMLDivElement | null>(null);
  const [keyboardInset, setKeyboardInset] = useState(0);

  useEffect(() => {
    if (isDesktop) return;
    const container = formScrollRef.current;
    if (!container) return;
    const handleFocusIn = (event: FocusEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      window.setTimeout(() => { target.scrollIntoView({ block: "center", behavior: "smooth" }); }, 120);
    };
    container.addEventListener("focusin", handleFocusIn);
    return () => { container.removeEventListener("focusin", handleFocusIn); };
  }, [isDesktop]);

  useEffect(() => {
    if (isDesktop || typeof window === "undefined" || !window.visualViewport) { setKeyboardInset(0); return; }
    const viewport = window.visualViewport;
    const update = () => setKeyboardInset(Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop));
    update();
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    return () => { viewport.removeEventListener("resize", update); viewport.removeEventListener("scroll", update); };
  }, [isDesktop]);

  const inputCls = "corp-input w-full rounded-2xl px-4 py-3 text-sm";

  const formLayout = (
    <div className="keyboard-safe-form flex h-full flex-col overflow-x-hidden p-6" style={{ paddingBottom: `calc(max(env(safe-area-inset-bottom), 1rem) + ${keyboardInset}px)` }}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="section-kicker">{mode === "create" ? "Alta de Cliente" : "Edición"}</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-foreground">
            {mode === "create" ? "Nuevo cliente" : "Editar cliente"}
          </h2>
        </div>
        <button className="app-panel-soft flex h-10 w-10 items-center justify-center rounded-2xl text-default-500" onClick={onClose}><X size={18} /></button>
      </div>

      <div ref={formScrollRef} className="mt-6 grid flex-1 gap-4 overflow-y-auto pr-1" style={{ paddingBottom: `calc(0.75rem + ${keyboardInset}px)` }}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block min-w-0">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-default-500">Nombre</span>
            <input className={inputCls} value={formData.name} onChange={(e) => onChange("name", e.target.value)} />
          </label>
          <label className="block min-w-0">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-default-500">Empresa</span>
            <input className={inputCls} value={formData.company} onChange={(e) => onChange("company", e.target.value)} />
          </label>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block min-w-0">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-default-500">Teléfono</span>
            <input className={inputCls} value={formData.phone} onChange={(e) => onChange("phone", e.target.value)} />
          </label>
          <label className="block min-w-0">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-default-500">Documento fiscal</span>
            <input className={inputCls} placeholder="CUIT / NIT / RUC" value={formData.taxId} onChange={(e) => onChange("taxId", e.target.value)} />
          </label>
        </div>
        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-default-500">Email</span>
          <input className={inputCls} value={formData.email} onChange={(e) => onChange("email", e.target.value)} />
        </label>
        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-default-500">Dirección comercial</span>
          <input className={inputCls} value={formData.address} onChange={(e) => onChange("address", e.target.value)} />
        </label>
        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-default-500">Dirección fiscal</span>
          <input className={inputCls} value={formData.fiscalAddress} onChange={(e) => onChange("fiscalAddress", e.target.value)} />
        </label>
        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-default-500">Deuda</span>
          <input className={inputCls} min="0" step="0.01" type="number" value={formData.debt} onChange={(e) => onChange("debt", e.target.value)} />
        </label>
        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-default-500">Notas</span>
          <textarea className={`${inputCls} min-h-28`} value={formData.notes} onChange={(e) => onChange("notes", e.target.value)} />
        </label>
      </div>

      <div className="mt-6 flex shrink-0 gap-3 border-t border-divider/70 pt-4">
        <button className="app-panel-soft flex-1 rounded-2xl px-4 py-3 text-sm font-semibold text-default-600" onClick={onClose}>Cancelar</button>
        <button className="flex-1 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50" disabled={submitting} onClick={onSubmit}>
          <span className="flex items-center justify-center gap-2">
            {submitting && <Loader2 className="animate-spin" size={18} />}
            {mode === "create" ? "Crear cliente" : "Guardar cambios"}
          </span>
        </button>
      </div>
    </div>
  );

  if (!isDesktop) {
    return (
      <div className="fixed inset-0 z-[120] bg-black/45 backdrop-blur-[1px]">
        <div className="h-[100dvh] w-screen overflow-hidden bg-background">{formLayout}</div>
      </div>
    );
  }

  return (
    <Drawer hideCloseButton isOpen backdrop="opaque" placement="right" scrollBehavior="inside" size="xl" onOpenChange={(open) => { if (!open) onClose(); }}>
      <DrawerContent className="h-screen w-full max-w-xl overflow-x-hidden rounded-none">
        <DrawerBody className="p-0">{formLayout}</DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}

// ── Client detail panel ───────────────────────────────────────────────

function ClientDetailPanel({
  clientId, currency, isDesktop, onBack,
  onEdit, onDelete, isDeleting,
}: {
  clientId: string; currency: string; isDesktop: boolean;
  onBack: () => void; onEdit: () => void;
  onDelete: () => void; isDeleting: boolean;
}) {
  const { client: selectedClient, orders, metrics, loading, error } = useClientDetail(clientId);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className={`shrink-0 border-b border-white/10 px-6 py-4 ${isDesktop ? "bg-background/60 backdrop-blur-sm" : "bg-background"}`}>
        {!isDesktop && (
          <button className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-default-500" onClick={onBack}>
            <ArrowLeft size={14} /> Volver a clientes
          </button>
        )}
        {loading && !selectedClient ? (
          <div className="flex items-center gap-2 text-default-400"><Loader2 className="animate-spin" size={16} /><span className="text-sm">Cargando...</span></div>
        ) : (
          <>
            <p className="text-[11px] font-bold uppercase tracking-widest text-default-400">Ficha de cliente</p>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-foreground">{selectedClient?.name || "Cargando..."}</h2>
            {selectedClient?.company && <p className="mt-0.5 text-sm text-default-400">{selectedClient.company}</p>}
          </>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {loading && !selectedClient ? (
          <div className="flex flex-col items-center justify-center py-20 text-default-400">
            <Loader2 className="animate-spin mb-3" size={28} />
            <p className="text-sm">Cargando ficha del cliente...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center py-20 text-center">
            <p className="text-sm font-semibold text-danger">No se pudo cargar el cliente</p>
            <p className="mt-1 text-xs text-default-500">{error}</p>
          </div>
        ) : !selectedClient || !metrics ? (
          <div className="flex flex-col items-center py-20 text-center text-default-400">
            <Users size={32} className="mb-3" />
            <p className="text-sm">El cliente no está disponible</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* KPI row */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Compras", value: metrics.totalOrders },
                { label: "Pendientes", value: metrics.pendingOrders },
                { label: "Entregadas", value: metrics.deliveredOrders },
              ].map((kpi) => (
                <div key={kpi.label} className="rounded-2xl border border-white/8 bg-content2/50 p-3 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-default-400">{kpi.label}</p>
                  <p className="mt-1.5 text-xl font-bold text-foreground">{kpi.value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/8 bg-content2/50 p-4">
                <p className="section-kicker">Total comprado</p>
                <p className="mt-2 text-xl font-bold text-foreground">{formatCompactCurrency(metrics.totalSpent, currency)}</p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-content2/50 p-4">
                <p className="section-kicker">Deuda</p>
                <p className={`mt-2 text-xl font-bold ${Number(selectedClient.debt || 0) > 0 ? "text-danger" : "text-foreground"}`}>
                  {formatCompactCurrency(Number(selectedClient.debt || 0), currency)}
                </p>
              </div>
            </div>

            {/* Contact info */}
            <div className="rounded-2xl border border-white/8 bg-content2/50 p-4">
              <p className="mb-3 text-sm font-bold text-foreground">Datos de contacto</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { icon: Phone, label: "Teléfono", value: selectedClient.phone },
                  { icon: Mail, label: "Email", value: selectedClient.email || "No definido" },
                  { icon: Building2, label: "Empresa", value: selectedClient.company || "No definida" },
                  { icon: Building2, label: "Doc. fiscal", value: selectedClient.taxId || "No definido" },
                  { icon: MapPin, label: "Dirección", value: selectedClient.address || "No definida" },
                  { icon: MapPin, label: "Dir. fiscal", value: selectedClient.fiscalAddress || "No definida" },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-start gap-2.5">
                    <Icon size={14} className="mt-0.5 shrink-0 text-primary" />
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-default-400">{label}</p>
                      <p className="mt-0.5 truncate text-sm text-foreground">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            {selectedClient.notes && (
              <div className="rounded-2xl border border-white/8 bg-content2/50 p-4">
                <div className="flex items-start gap-2.5">
                  <NotebookText size={14} className="mt-0.5 shrink-0 text-primary" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-default-400">Notas</p>
                    <p className="mt-0.5 text-sm text-foreground">{selectedClient.notes}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Orders */}
            <div className="rounded-2xl border border-white/8 bg-content2/50 p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-bold text-foreground">Ventas relacionadas</p>
                <span className="text-xs text-default-400">{orders.length} registros</span>
              </div>
              <div className="space-y-2">
                {orders.length > 0 ? orders.map((order) => (
                  <div key={order._id} className="flex items-center justify-between rounded-xl bg-content2/60 px-3 py-2.5">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{order.orderNumber || `#${order._id.slice(-6)}`}</p>
                      <p className="text-xs text-default-400">{new Date(order.createdAt).toLocaleDateString()} · {order.items.length} ítem(s)</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-foreground">{formatCompactCurrency(order.totalAmount, currency)}</p>
                      <p className="text-xs text-default-400">{order.status}</p>
                    </div>
                  </div>
                )) : (
                  <p className="text-sm text-default-500">Sin ventas registradas.</p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pb-2">
              <button className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-content2/50 py-3 text-sm font-semibold text-default-600 hover:bg-content2 transition" onClick={onEdit}>
                <Pencil size={15} /> Editar
              </button>
              <button className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-danger/10 border border-danger/20 py-3 text-sm font-semibold text-danger disabled:opacity-50 hover:bg-danger/20 transition" disabled={isDeleting} onClick={onDelete}>
                {isDeleting ? <Loader2 className="animate-spin" size={15} /> : <Trash2 size={15} />}
                Desactivar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DetailEmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 text-center text-default-400 px-8">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-content2/50 border border-white/8">
        <Users size={28} />
      </div>
      <div>
        <p className="font-semibold text-foreground">Seleccioná un cliente</p>
        <p className="mt-1 text-sm">La ficha completa aparece aquí sin perder el listado.</p>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────

export default function ClientsPage() {
  const navigate = useNavigate();
  const { clientId } = useParams<{ clientId?: string }>();
  const isDesktop = useIsDesktop();
  const isHeaderCompact = useMobileHeaderCompact();
  const { settings } = useSettings();
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const { clients, total, loading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteClients(20);
  const { createClient, updateClient, deleteClient, isCreating, isUpdating, isDeleting } = useClients({ enabled: false });
  const { client: selectedClient } = useClientDetail(clientId);
  const { showToast } = useAppToast();
  const currency = settings?.currency || "USD";

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState<ClientFormState>(emptyForm);

  const safeClients = useMemo(
    () => clients.filter((c): c is Client => Boolean(c && typeof c === "object" && c._id)),
    [clients],
  );

  const filteredClients = useMemo(
    () => safeClients.filter((c) =>
      c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone?.includes(searchQuery) ||
      c.company?.toLowerCase().includes(searchQuery.toLowerCase()),
    ),
    [safeClients, searchQuery],
  );

  const companies = useMemo(() => Array.from(new Set(safeClients.map((c) => c.company).filter(Boolean))), [safeClients]);

  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target || !hasNextPage) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0]?.isIntersecting && !isFetchingNextPage) fetchNextPage(); },
      { rootMargin: "240px 0px" },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, filteredClients.length]);

  useEffect(() => {
    if (isEditOpen && selectedClient) {
      setFormData({
        name: selectedClient.name || "", email: selectedClient.email || "",
        phone: selectedClient.phone || "", taxId: selectedClient.taxId || "",
        address: selectedClient.address || "", fiscalAddress: selectedClient.fiscalAddress || "",
        company: selectedClient.company || "", notes: selectedClient.notes || "",
        debt: selectedClient.debt?.toString() || "0",
      });
    }
  }, [isEditOpen, selectedClient]);

  const handleChange = (field: keyof ClientFormState, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const buildPayload = () => ({
    name: formData.name.trim(), email: formData.email.trim() || undefined,
    phone: formData.phone.trim(), taxId: formData.taxId.trim(),
    address: formData.address.trim() || undefined, fiscalAddress: formData.fiscalAddress.trim() || undefined,
    company: formData.company.trim() || undefined, notes: formData.notes.trim() || undefined,
    debt: Number(formData.debt || 0),
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
    if (!formData.taxId.trim()) { showToast({ variant: "warning", message: "El documento fiscal es obligatorio." }); return; }
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

  // Mobile: full-screen detail
  if (!isDesktop && clientId) {
    return (
      <div className="flex h-screen flex-col bg-background">
        <ClientDetailPanel
          clientId={clientId} currency={currency} isDesktop={false}
          isDeleting={isDeleting}
          onBack={() => navigate("/clients")}
          onDelete={handleDelete}
          onEdit={() => setIsEditOpen(true)}
        />
        {isEditOpen && (
          <ClientFormModal formData={formData} isDesktop={false} mode="edit" submitting={isUpdating}
            onChange={handleChange} onClose={() => setIsEditOpen(false)} onSubmit={handleUpdate} />
        )}
      </div>
    );
  }

  // ── List panel ──────────────────────────────────────────────────────
  const ListPanel = (
    <div className={`flex flex-col ${isDesktop ? "h-screen overflow-hidden border-r border-white/8" : "min-h-screen pb-24"}`}>
      {/* Header */}
      <div className={`shrink-0 page-header ${isHeaderCompact ? "py-3" : ""}`}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="page-title">Clientes</h1>
            {!isHeaderCompact && <p className="page-subtitle">Directorio comercial y seguimiento financiero</p>}
          </div>
          <button
            className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/25 hover:bg-primary/90 transition"
            onClick={() => { setFormData(emptyForm); setIsCreateOpen(true); }}
          >
            <UserPlus size={15} /> Nuevo
          </button>
        </div>

        {!isHeaderCompact && (
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="stat-card !p-4">
              <p className="stat-card-label">Clientes</p>
              <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">{total || safeClients.length}</p>
            </div>
            <div className="stat-card !p-4">
              <p className="stat-card-label">Empresas</p>
              <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">{companies.length}</p>
            </div>
          </div>
        )}

        <div className="mt-3 search-bar">
          <Search size={15} className="shrink-0 text-default-400" />
          <input
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-default-400 focus:outline-none"
            placeholder="Buscar por nombre, teléfono o empresa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && <button className="text-default-400 hover:text-foreground" onClick={() => setSearchQuery("")}>×</button>}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 py-4 lg:px-5">
        {loading && safeClients.length === 0 ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-default-400" size={28} /></div>
        ) : filteredClients.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-center text-default-400">
            <Users size={36} />
            <p className="text-sm">{searchQuery ? "Sin coincidencias." : "Todavía no hay clientes cargados."}</p>
          </div>
        ) : (
          <div className="space-y-2 pb-4">
            {filteredClients.map((client) => {
              const isSelected = client._id === clientId;
              return (
                <button
                  key={client._id}
                  className={`w-full rounded-2xl border px-4 py-3.5 text-left transition-all ${
                    isSelected
                      ? "border-primary/30 bg-primary/8 shadow-sm shadow-primary/10"
                      : "border-white/6 bg-content2/40 hover:border-primary/20 hover:bg-primary/5"
                  }`}
                  onClick={() => navigate(`/clients/${client._id}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${isSelected ? "bg-primary/20 text-primary" : "bg-content2 text-default-500"}`}>
                      {getInitials(client.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-semibold text-foreground">{client.name || "Sin nombre"}</p>
                        <p className={`shrink-0 text-sm font-bold ${Number(client.debt || 0) > 0 ? "text-danger" : "text-foreground"}`}>
                          {formatCompactCurrency(Number(client.debt || 0), currency)}
                        </p>
                      </div>
                      <div className="mt-0.5 flex items-center gap-2">
                        {client.company && <span className="text-[11px] text-default-400 truncate">{client.company}</span>}
                        {client.company && <span className="text-[11px] text-default-400">·</span>}
                        <span className="text-[11px] text-default-400">{client.phone}</span>
                      </div>
                    </div>
                    {isDesktop && <ChevronRight size={14} className={`shrink-0 ${isSelected ? "text-primary" : "text-default-300"}`} />}
                  </div>
                </button>
              );
            })}

            <div ref={loadMoreRef} className="h-4 w-full" />
            {isFetchingNextPage && <div className="flex justify-center py-4"><Loader2 className="animate-spin text-default-400" size={20} /></div>}
            {!hasNextPage && safeClients.length > 0 && <p className="py-3 text-center text-[11px] text-default-400">Fin del directorio</p>}
          </div>
        )}
      </div>
    </div>
  );

  // Desktop master-detail
  if (isDesktop) {
    return (
      <>
        <div className="grid h-screen grid-cols-[380px_1fr]">
          {ListPanel}
          <div className="h-screen overflow-y-auto">
            {clientId ? (
              <ClientDetailPanel
                clientId={clientId} currency={currency} isDesktop
                isDeleting={isDeleting}
                onBack={() => navigate("/clients")}
                onDelete={handleDelete}
                onEdit={() => setIsEditOpen(true)}
              />
            ) : (
              <DetailEmptyState />
            )}
          </div>
        </div>
        {isCreateOpen && (
          <ClientFormModal formData={formData} isDesktop mode="create" submitting={isCreating}
            onChange={handleChange} onClose={() => setIsCreateOpen(false)} onSubmit={handleCreate} />
        )}
        {isEditOpen && (
          <ClientFormModal formData={formData} isDesktop mode="edit" submitting={isUpdating}
            onChange={handleChange} onClose={() => setIsEditOpen(false)} onSubmit={handleUpdate} />
        )}
      </>
    );
  }

  // Mobile list
  return (
    <>
      {ListPanel}
      {isCreateOpen && (
        <ClientFormModal formData={formData} isDesktop={false} mode="create" submitting={isCreating}
          onChange={handleChange} onClose={() => setIsCreateOpen(false)} onSubmit={handleCreate} />
      )}
    </>
  );
}
