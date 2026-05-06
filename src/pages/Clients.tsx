import { useEffect, useMemo, useRef, useState, useCallback } from "react";
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
  Filter,
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  BarChart3,
  FileSpreadsheet,
  Calendar,
  Clock,
  Hash,
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
import { PaginationBar } from "@/components/PaginationBar";

// ── Tipos ───────────────────────────────────────────────────────────────

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

type SortField = "name" | "company" | "debt" | "createdAt";
type SortDirection = "asc" | "desc";
type FilterType = "all" | "withDebt" | "noDebt" | "withEmail" | "noEmail";

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

// ── Componentes UI Reutilizables ────────────────────────────────────────

function Button({
  children,
  onClick,
  variant = "primary",
  size = "md",
  disabled = false,
  className = "",
  icon: Icon,
  ariaLabel,
  type = "button",
}: {
  children?: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "danger" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  className?: string;
  icon?: React.ComponentType<{ size?: number | string; className?: string }>;
  ariaLabel?: string;
  type?: "button" | "submit" | "reset";
}) {
  const baseStyles = "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]";
  
  const variantStyles = {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25",
    secondary: "bg-content2 text-foreground hover:bg-content3 border border-white/10",
    danger: "bg-danger/10 text-danger border border-danger/20 hover:bg-danger/20",
    ghost: "bg-transparent text-default-600 hover:bg-content2",
    outline: "bg-transparent border border-white/15 text-foreground hover:bg-content2 hover:border-white/25",
  };

  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs rounded-xl",
    md: "px-4 py-2.5 text-sm rounded-2xl",
    lg: "px-6 py-3 text-sm rounded-2xl",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {Icon && <Icon size={size === "sm" ? 14 : 16} />}
      {children}
    </button>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  error,
  required = false,
  disabled = false,
  className = "",
  icon: Icon,
}: {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  icon?: React.ComponentType<{ size?: number | string; className?: string }>;
}) {
  return (
    <label className={`block ${className}`}>
      {label && (
        <span className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-default-500">
          {label}
          {required && <span className="ml-1 text-danger">*</span>}
        </span>
      )}
      <div className="relative">
        {Icon && (
          <Icon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-default-400" />
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={`corp-input w-full ${Icon ? "pl-11" : "px-4"} py-3 text-sm transition-all duration-200 ${
            error ? "border-danger/50 focus:border-danger" : ""
          }`}
        />
      </div>
      {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
    </label>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
  disabled = false,
  className = "",
}: {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string; icon?: React.ComponentType<{ size?: number | string }> }[];
  disabled?: boolean;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      {label && (
        <span className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-default-500">{label}</span>
      )}
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="corp-input w-full appearance-none px-4 py-3 pr-10 text-sm bg-content1/70 cursor-pointer hover:bg-content1/90 transition-colors"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 12px center",
          }}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </label>
  );
}

function Card({
  children,
  className = "",
  hover = false,
  padding = "normal",
}: {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: "none" | "small" | "normal" | "large";
}) {
  const paddingStyles = {
    none: "",
    small: "p-3",
    normal: "p-4",
    large: "p-6",
  };

  return (
    <div
      className={`rounded-2xl border border-white/[0.08] bg-content1/60 backdrop-blur-sm ${paddingStyles[padding]} ${
        hover ? "transition-all duration-200 hover:border-primary/20 hover:bg-content1/80 hover:shadow-lg hover:shadow-primary/5 cursor-pointer" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}

function Badge({
  children,
  variant = "default",
  size = "md",
}: {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info";
  size?: "sm" | "md";
}) {
  const variantStyles = {
    default: "bg-content2 text-default-600 border-white/10",
    success: "bg-success/10 text-success border-success/20",
    warning: "bg-warning/10 text-warning border-warning/20",
    danger: "bg-danger/10 text-danger border-danger/20",
    info: "bg-primary/10 text-primary border-primary/20",
  };

  const sizeStyles = {
    sm: "px-2 py-0.5 text-[10px]",
    md: "px-2.5 py-1 text-xs",
  };

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border font-semibold ${variantStyles[variant]} ${sizeStyles[size]}`}>
      {children}
    </span>
  );
}

function MetricCard({
  label,
  value,
  subValue,
  trend,
  icon: Icon,
  color = "primary",
}: {
  label: string;
  value: string | number;
  subValue?: string;
  trend?: "up" | "down" | "neutral";
  icon: React.ComponentType<{ size?: number | string; className?: string }>;
  color?: "primary" | "success" | "warning" | "danger" | "info";
}) {
  const colorStyles = {
    primary: "from-primary/20 to-primary/5 text-primary",
    success: "from-success/20 to-success/5 text-success",
    warning: "from-warning/20 to-warning/5 text-warning",
    danger: "from-danger/20 to-danger/5 text-danger",
    info: "from-primary/20 to-primary/5 text-primary",
  };

  return (
    <Card className="group relative overflow-hidden" hover>
      <div className={`absolute top-0 right-0 p-4 opacity-50 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
        <div className={`rounded-2xl bg-gradient-to-br ${colorStyles[color]} p-3`}>
          <Icon size={24} />
        </div>
      </div>
      <div className="relative">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-default-400">{label}</p>
        <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">{value}</p>
        {subValue && (
          <div className="mt-1 flex items-center gap-1.5">
            {trend && (
              <>
                {trend === "up" && <TrendingUp size={12} className="text-success" />}
                {trend === "down" && <TrendingDown size={12} className="text-danger" />}
                {trend === "neutral" && <div className="h-3 w-3 rounded-full bg-default-400" />}
              </>
            )}
            <p className="text-xs text-default-500">{subValue}</p>
          </div>
        )}
      </div>
    </Card>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ComponentType<{ size?: number | string; className?: string }>;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 rounded-3xl bg-content2/50 p-6">
        <Icon size={48} className="text-default-400" />
      </div>
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-default-500">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

// ── Client Form Modal Mejorado ──────────────────────────────────────────

function ClientFormModal({
  mode,
  isDesktop,
  formData,
  onChange,
  onClose,
  onSubmit,
  submitting,
}: {
  mode: "create" | "edit";
  isDesktop: boolean;
  formData: ClientFormState;
  onChange: (field: keyof ClientFormState, value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
  submitting: boolean;
}) {
  const formScrollRef = useRef<HTMLDivElement | null>(null);
  const [keyboardInset, setKeyboardInset] = useState(0);
  const [errors, setErrors] = useState<Partial<Record<keyof ClientFormState, string>>>({});

  useEffect(() => {
    if (isDesktop) return;
    const container = formScrollRef.current;
    if (!container) return;
    const handleFocusIn = (event: FocusEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      window.setTimeout(() => {
        target.scrollIntoView({ block: "center", behavior: "smooth" });
      }, 120);
    };
    container.addEventListener("focusin", handleFocusIn);
    return () => container.removeEventListener("focusin", handleFocusIn);
  }, [isDesktop]);

  useEffect(() => {
    if (isDesktop || typeof window === "undefined" || !window.visualViewport) {
      setKeyboardInset(0);
      return;
    }
    const viewport = window.visualViewport;
    const update = () =>
      setKeyboardInset(Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop));
    update();
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    return () => {
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
    };
  }, [isDesktop]);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof ClientFormState, string>> = {};
    if (!formData.name.trim()) newErrors.name = "El nombre es obligatorio";
    if (!formData.phone.trim()) newErrors.phone = "El teléfono es obligatorio";
    if (!formData.taxId.trim()) newErrors.taxId = "El documento fiscal es obligatorio";
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email inválido";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      onSubmit();
    }
  };

  const formLayout = (
    <div
      className="flex h-full flex-col overflow-x-hidden p-6"
      style={{ paddingBottom: `calc(max(env(safe-area-inset-bottom), 1rem) + ${keyboardInset}px)` }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="client-form-title"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="section-kicker">{mode === "create" ? "Alta de Cliente" : "Edición"}</p>
          <h2 id="client-form-title" className="mt-2 text-2xl font-bold tracking-tight text-foreground">
            {mode === "create" ? "Nuevo cliente" : "Editar cliente"}
          </h2>
        </div>
        <button
          className="app-panel-soft flex h-10 w-10 items-center justify-center rounded-2xl text-default-500 transition-colors hover:text-foreground"
          onClick={onClose}
          aria-label="Cerrar formulario"
        >
          <X size={18} />
        </button>
      </div>

      <div
        ref={formScrollRef}
        className="mt-6 grid flex-1 gap-5 overflow-y-auto pr-1"
        style={{ paddingBottom: `calc(0.75rem + ${keyboardInset}px)` }}
      >
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Input
            label="Nombre"
            value={formData.name}
            onChange={(v) => onChange("name", v)}
            placeholder="Nombre completo"
            required
            error={errors.name}
            icon={Users}
          />
          <Input
            label="Empresa"
            value={formData.company}
            onChange={(v) => onChange("company", v)}
            placeholder="Nombre de la empresa"
            icon={Building2}
          />
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Input
            label="Teléfono"
            value={formData.phone}
            onChange={(v) => onChange("phone", v)}
            placeholder="+54 11 1234 5678"
            type="tel"
            required
            error={errors.phone}
            icon={Phone}
          />
          <Input
            label="Documento fiscal"
            value={formData.taxId}
            onChange={(v) => onChange("taxId", v)}
            placeholder="CUIT / NIT / RUC"
            required
            error={errors.taxId}
            icon={Hash}
          />
        </div>

        <Input
          label="Email"
          value={formData.email}
          onChange={(v) => onChange("email", v)}
          placeholder="cliente@empresa.com"
          type="email"
          error={errors.email}
          icon={Mail}
        />

        <Input
          label="Dirección comercial"
          value={formData.address}
          onChange={(v) => onChange("address", v)}
          placeholder="Calle, número, ciudad"
          icon={MapPin}
        />

        <Input
          label="Dirección fiscal"
          value={formData.fiscalAddress}
          onChange={(v) => onChange("fiscalAddress", v)}
          placeholder="Dirección fiscal completa"
          icon={MapPin}
        />

        <Input
          label="Deuda inicial"
          value={formData.debt}
          onChange={(v) => onChange("debt", v)}
          type="number"
        />

        <label className="block">
          <span className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-default-500">
            Notas
          </span>
          <textarea
            className="corp-input min-h-28 w-full resize-none px-4 py-3 text-sm"
            value={formData.notes}
            onChange={(e) => onChange("notes", e.target.value)}
            placeholder="Información adicional sobre el cliente..."
          />
        </label>
      </div>

      <div className="mt-6 flex shrink-0 gap-3 border-t border-divider/70 pt-4">
        <Button variant="secondary" className="flex-1" onClick={onClose}>
          Cancelar
        </Button>
        <Button
          variant="primary"
          className="flex-1"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting && <Loader2 className="animate-spin" size={18} />}
          {mode === "create" ? "Crear cliente" : "Guardar cambios"}
        </Button>
      </div>
    </div>
  );

  if (!isDesktop) {
    return (
      <div
        className="fixed inset-0 z-[120] bg-black/50 backdrop-blur-sm"
        role="presentation"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div className="h-[100dvh] w-screen overflow-hidden bg-background">{formLayout}</div>
      </div>
    );
  }

  return (
    <Drawer
      hideCloseButton
      isOpen
      backdrop="opaque"
      placement="right"
      scrollBehavior="inside"
      size="xl"
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DrawerContent className="h-[100dvh] w-full max-w-xl overflow-x-hidden rounded-none bg-content1">
        <DrawerBody className="p-0">{formLayout}</DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}

// ── Panel de Detalle del Cliente Mejorado ───────────────────────────────

function ClientDetailPanel({
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
    <div className="flex h-full flex-col">
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
                {orders.length} registros
              </Badge>
            </div>
            <div className="space-y-2">
              {orders.length > 0 ? (
                orders.map((order) => (
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
            className={`fixed right-0 top-0 z-50 h-screen w-[min(720px,58vw)] overflow-y-auto border-l border-white/10 shadow-[-24px_0_60px_rgba(40,25,15,0.28)] transition-transform duration-300 ease-in-out ${
              clientId ? "translate-x-0" : "translate-x-full"
            }`}
            style={{ background: "color-mix(in srgb, var(--heroui-content1) 98%, transparent)" }}
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
