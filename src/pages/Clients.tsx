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
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Drawer, DrawerBody, DrawerContent } from "@heroui/drawer";

import {
  useClientDetail,
  useClients,
  useInfiniteClients,
} from "@/hooks/useClients";
import { useMobileHeaderCompact } from "@/hooks/useMobileHeaderCompact";
import { useSettings } from "@/hooks/useSettings";
import { Client } from "@/types";
import { useAppToast } from "@/components/AppToast";
import { formatCompactCurrency } from "@/utils/currency";
import { getErrorMessage } from "@/utils/errors";

type ClientFormState = {
  name: string;
  email: string;
  phone: string;
  taxId: string;
  address: string;
  fiscalAddress: string;
  company: string;
  notes: string;
  debt: string;
};

const emptyForm: ClientFormState = {
  name: "",
  email: "",
  phone: "",
  taxId: "",
  address: "",
  fiscalAddress: "",
  company: "",
  notes: "",
  debt: "0",
};

function getInitials(name: string) {
  if (!name) return "??";

  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function ClientFormModal({
  mode,
  formData,
  onChange,
  onClose,
  onSubmit,
  submitting,
}: {
  mode: "create" | "edit";
  formData: ClientFormState;
  onChange: (field: keyof ClientFormState, value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
  submitting: boolean;
}) {
  return (
    <Drawer
      hideCloseButton
      isOpen
      backdrop="opaque"
      classNames={{}}
      placement="bottom"
      scrollBehavior="inside"
      size="full"
      onOpenChange={(open: boolean) => {
        if (!open) onClose();
      }}
    >
      <DrawerContent className="h-screen w-screen max-w-none rounded-none">
        <DrawerBody className="flex h-full flex-col p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="section-kicker">
                {mode === "create" ? "Alta de Cliente" : "Edicion"}
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-foreground">
                {mode === "create" ? "Nuevo cliente" : "Editar cliente"}
              </h2>
            </div>
            <button
              className="app-panel-soft flex h-10 w-10 items-center justify-center rounded-2xl text-default-500"
              onClick={onClose}
            >
              <X size={18} />
            </button>
          </div>

          <div className="mt-6 grid flex-1 gap-4 overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-4">
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-default-500">
                  Nombre
                </span>
                <input
                  className="corp-input w-full rounded-2xl px-4 py-3 text-sm"
                  value={formData.name}
                  onChange={(e) => onChange("name", e.target.value)}
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-default-500">
                  Empresa
                </span>
                <input
                  className="corp-input w-full rounded-2xl px-4 py-3 text-sm"
                  value={formData.company}
                  onChange={(e) => onChange("company", e.target.value)}
                />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-default-500">
                  Telefono
                </span>
                <input
                  className="corp-input w-full rounded-2xl px-4 py-3 text-sm"
                  value={formData.phone}
                  onChange={(e) => onChange("phone", e.target.value)}
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-default-500">
                  Documento fiscal
                </span>
                <input
                  className="corp-input w-full rounded-2xl px-4 py-3 text-sm"
                  placeholder="CUIT / NIT / RUC"
                  value={formData.taxId}
                  onChange={(e) => onChange("taxId", e.target.value)}
                />
              </label>
            </div>

            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-default-500">
                Email
              </span>
              <input
                className="corp-input w-full rounded-2xl px-4 py-3 text-sm"
                value={formData.email}
                onChange={(e) => onChange("email", e.target.value)}
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-default-500">
                Direccion comercial
              </span>
              <input
                className="corp-input w-full rounded-2xl px-4 py-3 text-sm"
                value={formData.address}
                onChange={(e) => onChange("address", e.target.value)}
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-default-500">
                Direccion fiscal
              </span>
              <input
                className="corp-input w-full rounded-2xl px-4 py-3 text-sm"
                value={formData.fiscalAddress}
                onChange={(e) => onChange("fiscalAddress", e.target.value)}
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-default-500">
                Deuda
              </span>
              <input
                className="corp-input w-full rounded-2xl px-4 py-3 text-sm"
                min="0"
                step="0.01"
                type="number"
                value={formData.debt}
                onChange={(e) => onChange("debt", e.target.value)}
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-default-500">
                Notas
              </span>
              <textarea
                className="corp-input min-h-28 w-full rounded-2xl px-4 py-3 text-sm"
                value={formData.notes}
                onChange={(e) => onChange("notes", e.target.value)}
              />
            </label>
          </div>

          <div className="mt-6 flex shrink-0 gap-3 border-t border-divider/70 pt-4">
            <button
              className="app-panel-soft flex-1 rounded-2xl px-4 py-3 text-sm font-semibold text-default-600"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              className="flex-1 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
              disabled={submitting}
              onClick={onSubmit}
            >
              <span className="flex items-center justify-center gap-2">
                {submitting && <Loader2 className="animate-spin" size={18} />}
                {mode === "create" ? "Crear cliente" : "Guardar cambios"}
              </span>
            </button>
          </div>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}

export default function ClientsPage() {
  const navigate = useNavigate();
  const { clientId } = useParams<{ clientId?: string }>();
  const isHeaderCompact = useMobileHeaderCompact();
  const { settings } = useSettings();
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const {
    clients,
    total,
    loading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteClients(20);
  const {
    createClient,
    updateClient,
    deleteClient,
    isCreating,
    isUpdating,
    isDeleting,
  } = useClients({ enabled: false });
  const { showToast } = useAppToast();
  const currency = settings?.currency || "USD";

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState<ClientFormState>(emptyForm);

  const {
    client: selectedClient,
    orders,
    metrics,
    loading: detailLoading,
    error: detailError,
  } = useClientDetail(clientId);

  const safeClients = useMemo(
    () =>
      clients.filter((client): client is Client =>
        Boolean(client && typeof client === "object" && client._id),
      ),
    [clients],
  );

  const filteredClients = useMemo(
    () =>
      safeClients.filter(
        (client) =>
          client.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          client.phone?.includes(searchQuery) ||
          client.company?.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [safeClients, searchQuery],
  );

  const companies = useMemo(() => {
    const values = new Set(
      safeClients.map((client) => client.company).filter(Boolean),
    );

    return Array.from(values);
  }, [safeClients]);

  useEffect(() => {
    const target = loadMoreRef.current;

    if (!target || !hasNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "240px 0px" },
    );

    observer.observe(target);

    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, filteredClients.length]);

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
      });
    }
  }, [isEditOpen, selectedClient]);

  const handleChange = (field: keyof ClientFormState, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

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
  });

  const handleCreate = async () => {
    if (
      !formData.name.trim() ||
      !formData.phone.trim() ||
      !formData.taxId.trim()
    ) {
      showToast({
        variant: "warning",
        message: "Completa nombre, telefono y documento fiscal.",
      });

      return;
    }

    try {
      await createClient(buildPayload());
      setIsCreateOpen(false);
      setFormData(emptyForm);
      showToast({
        variant: "success",
        message: "Cliente creado correctamente.",
      });
    } catch (error) {
      showToast({
        variant: "error",
        message: getErrorMessage(error, "No se pudo crear el cliente."),
      });
    }
  };

  const handleUpdate = async () => {
    if (!clientId) return;
    if (!formData.taxId.trim()) {
      showToast({
        variant: "warning",
        message: "El documento fiscal del cliente es obligatorio.",
      });

      return;
    }

    try {
      await updateClient({ id: clientId, clientData: buildPayload() });
      setIsEditOpen(false);
      showToast({
        variant: "success",
        message: "Cliente actualizado correctamente.",
      });
    } catch (error) {
      showToast({
        variant: "error",
        message: getErrorMessage(error, "No se pudo actualizar el cliente."),
      });
    }
  };

  const handleDelete = async () => {
    if (!clientId || !selectedClient) return;

    if (!window.confirm(`¿Desactivar a ${selectedClient.name}?`)) return;

    try {
      await deleteClient(clientId);
      navigate("/clients");
      showToast({
        variant: "success",
        message: "Cliente desactivado correctamente.",
      });
    } catch (error) {
      showToast({
        variant: "error",
        message: getErrorMessage(error, "No se pudo desactivar el cliente."),
      });
    }
  };

  if (clientId) {
    return (
      <div className="relative mx-auto flex min-h-screen max-w-md flex-col bg-background pb-24 font-sans">
        <header
          className={`app-topbar sticky top-0 z-30 border-b border-divider/60 bg-background/95 backdrop-blur-xl transition-all duration-300 ${
            isHeaderCompact ? "px-4 pb-3 pt-3" : "px-6 pb-4 pt-6"
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <button
                className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.14em] text-default-500"
                onClick={() => navigate("/clients")}
              >
                <ChevronRight className="rotate-180" size={14} />
                Volver
              </button>
              <p
                className={`section-kicker transition-all duration-200 ${
                  isHeaderCompact
                    ? "mt-1 text-[10px] opacity-80"
                    : "mt-3 opacity-100"
                }`}
              >
                Ficha de Cliente
              </p>
              <h1
                className={`font-semibold tracking-[-0.03em] text-foreground transition-all duration-300 ${
                  isHeaderCompact ? "mt-1 text-xl" : "mt-2 text-[28px]"
                }`}
              >
                {selectedClient?.name || "Cargando..."}
              </h1>
            </div>
          </div>
        </header>

        <div className="flex-1 px-6 pb-6">
          {detailLoading ? (
            <div className="py-16 text-center text-default-400">
              <Loader2 className="mx-auto mb-3 animate-spin" size={32} />
              <p className="text-sm">Cargando ficha del cliente...</p>
            </div>
          ) : detailError ? (
            <div className="py-12 text-center">
              <p className="text-sm font-semibold text-danger">
                No se pudo cargar el cliente
              </p>
              <p className="mt-2 text-xs text-default-500">{detailError}</p>
            </div>
          ) : !selectedClient || !metrics ? (
            <div className="py-12 text-center">
              <p className="text-sm font-semibold text-foreground">
                El cliente no esta disponible
              </p>
            </div>
          ) : (
            <>
              <div className="mt-1 grid grid-cols-2 gap-4">
                <div className="app-panel-soft rounded-[24px] p-4">
                  <p className="section-kicker">Compras</p>
                  <p className="mt-3 text-3xl font-semibold text-foreground">
                    {metrics.totalOrders}
                  </p>
                </div>
                <div className="app-panel-soft rounded-[24px] p-4">
                  <p className="section-kicker">Total Comprado</p>
                  <p className="mt-3 text-3xl font-semibold text-foreground">
                    {formatCompactCurrency(metrics.totalSpent, currency)}
                  </p>
                </div>
              </div>

              <div className="mt-5 app-panel-soft rounded-[24px] p-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-start gap-3">
                    <Phone className="mt-0.5 text-primary" size={16} />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-default-500">
                        Telefono
                      </p>
                      <p className="mt-1 text-sm text-foreground">
                        {selectedClient.phone}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Mail className="mt-0.5 text-primary" size={16} />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-default-500">
                        Email
                      </p>
                      <p className="mt-1 text-sm text-foreground">
                        {selectedClient.email || "No definido"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Building2 className="mt-0.5 text-primary" size={16} />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-default-500">
                        Empresa
                      </p>
                      <p className="mt-1 text-sm text-foreground">
                        {selectedClient.company || "No definida"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Building2 className="mt-0.5 text-primary" size={16} />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-default-500">
                        Documento fiscal
                      </p>
                      <p className="mt-1 text-sm text-foreground">
                        {selectedClient.taxId || "No definido"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="mt-0.5 text-primary" size={16} />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-default-500">
                        Direccion
                      </p>
                      <p className="mt-1 text-sm text-foreground">
                        {selectedClient.address || "No definida"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="mt-0.5 text-primary" size={16} />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-default-500">
                        Direccion fiscal
                      </p>
                      <p className="mt-1 text-sm text-foreground">
                        {selectedClient.fiscalAddress || "No definida"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-4">
                <div className="app-panel-soft rounded-[24px] p-4">
                  <p className="section-kicker">Pendientes</p>
                  <p className="mt-3 text-2xl font-semibold text-foreground">
                    {metrics.pendingOrders}
                  </p>
                </div>
                <div className="app-panel-soft rounded-[24px] p-4">
                  <p className="section-kicker">Entregadas</p>
                  <p className="mt-3 text-2xl font-semibold text-foreground">
                    {metrics.deliveredOrders}
                  </p>
                </div>
                <div className="app-panel-soft rounded-[24px] p-4">
                  <p className="section-kicker">Deuda</p>
                  <p className="mt-3 text-2xl font-semibold text-foreground">
                    {formatCompactCurrency(
                      Number(selectedClient.debt || 0),
                      currency,
                    )}
                  </p>
                </div>
              </div>

              <div className="mt-5 app-panel-soft rounded-[24px] p-5">
                <div className="flex items-start gap-3">
                  <NotebookText className="mt-0.5 text-primary" size={16} />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-default-500">
                      Notas
                    </p>
                    <p className="mt-1 text-sm text-foreground">
                      {selectedClient.notes || "Sin notas internas"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 app-panel-soft rounded-[24px] p-5">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">
                    Ventas relacionadas
                  </h3>
                  <span className="text-xs text-default-400">
                    {orders.length} registros
                  </span>
                </div>
                <div className="space-y-3">
                  {orders.length > 0 ? (
                    orders.map((order) => (
                      <div
                        key={order._id}
                        className="rounded-2xl bg-content2/55 px-4 py-3"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-sm font-semibold text-foreground">
                              {order.orderNumber ||
                                `Pedido #${order._id.slice(-6)}`}
                            </p>
                            <p className="mt-1 text-xs text-default-500">
                              {new Date(order.createdAt).toLocaleDateString()} ·{" "}
                              {order.items.length} item(s)
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-foreground">
                              {formatCompactCurrency(
                                order.totalAmount,
                                currency,
                              )}
                            </p>
                            <p className="mt-1 text-xs text-default-500">
                              {order.status}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-default-500">
                      Este cliente aun no tiene ventas registradas.
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  className="app-panel-soft flex flex-1 items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-default-600"
                  onClick={() => setIsEditOpen(true)}
                >
                  <Pencil size={18} />
                  Editar
                </button>
                <button
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-danger px-4 py-3 text-sm font-semibold text-danger-foreground disabled:opacity-50"
                  disabled={isDeleting}
                  onClick={handleDelete}
                >
                  {isDeleting ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <Trash2 size={18} />
                  )}
                  Desactivar
                </button>
              </div>
            </>
          )}
        </div>

        {isEditOpen && (
          <ClientFormModal
            formData={formData}
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

  return (
    <div className="flex flex-col min-h-screen bg-background pb-24 font-sans max-w-md mx-auto relative overflow-hidden">
      <header className="app-topbar px-6 pt-6 pb-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="section-kicker">Clientes</div>
            <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.03em] text-foreground">
              Directorio Comercial
            </h1>
            <p className="mt-2 text-sm text-default-500">
              Contactos, historial de ventas y seguimiento financiero.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[0_16px_34px_rgba(88,176,156,0.35)]"
              onClick={() => {
                setFormData(emptyForm);
                setIsCreateOpen(true);
              }}
            >
              <UserPlus size={20} />
            </button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="app-panel rounded-[24px] p-4">
            <p className="section-kicker">Clientes</p>
            <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-foreground">
              {total || safeClients.length}
            </p>
          </div>
          <div className="app-panel rounded-[24px] p-4">
            <p className="section-kicker">Empresas</p>
            <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-foreground">
              {companies.length}
            </p>
          </div>
        </div>

        <div className="relative mt-4">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-default-400"
            size={18}
          />
          <input
            className="corp-input w-full rounded-2xl py-3.5 pl-11 pr-4 text-sm text-foreground"
            placeholder="Buscar por nombre, telefono o empresa..."
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </header>

      <div className="flex-1 space-y-3 px-6 py-5">
        {loading ? (
          <div className="app-panel rounded-[24px] py-12 text-center">
            <Loader2
              className="mx-auto mb-3 animate-spin text-primary"
              size={32}
            />
            <p className="text-sm text-default-500">Cargando clientes...</p>
          </div>
        ) : filteredClients.length > 0 ? (
          <>
            {filteredClients.map((client) => (
              <button
                key={client._id}
                className="app-panel flex w-full items-center justify-between rounded-[26px] p-4 text-left"
                onClick={() => navigate(`/clients/${client._id}`)}
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 font-semibold text-primary">
                    {getInitials(client.name)}
                  </div>
                  <div>
                    <h3 className="text-[15px] font-semibold text-foreground">
                      {client.name || "Sin nombre"}
                    </h3>
                    {client.company && (
                      <p className="mt-1 text-[12px] text-default-500">
                        {client.company}
                      </p>
                    )}
                    <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-default-400">
                      {client.phone}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">
                      {formatCompactCurrency(
                        Number(client.debt || 0),
                        currency,
                      )}
                    </p>
                    <p className="text-[11px] text-default-400">Saldo</p>
                  </div>
                  <ChevronRight className="text-default-300" size={18} />
                </div>
              </button>
            ))}

            <div ref={loadMoreRef} className="h-8 w-full" />

            {isFetchingNextPage && (
              <div className="app-panel rounded-[24px] py-6 text-center text-default-400">
                <Loader2 className="mx-auto mb-2 animate-spin" size={24} />
                <p className="text-sm">Cargando mas clientes...</p>
              </div>
            )}

            {!hasNextPage && safeClients.length > 0 && (
              <div className="py-4 text-center text-xs text-default-400">
                Fin del directorio cargado
              </div>
            )}
          </>
        ) : (
          <div className="app-panel rounded-[24px] py-12 text-center">
            <p className="text-sm font-medium text-foreground">
              No se encontraron clientes
            </p>
          </div>
        )}
      </div>

      {isCreateOpen && (
        <ClientFormModal
          formData={formData}
          mode="create"
          submitting={isCreating}
          onChange={handleChange}
          onClose={() => setIsCreateOpen(false)}
          onSubmit={handleCreate}
        />
      )}
    </div>
  );
}
