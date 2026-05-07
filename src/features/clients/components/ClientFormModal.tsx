import { useEffect, useRef, useState } from "react";
import { Building2, CreditCard, Hash, Loader2, Mail, MapPin, Phone, Users, X } from "lucide-react";
import { Drawer, DrawerBody, DrawerContent } from "@heroui/drawer";
import { PriceTier } from "@shared/types";
import { Button } from "./Button";
import { Input } from "./Input";
import { ClientPriceListSelector } from "./ClientPriceListSelector";

// ── Types & Constants ────────────────────────────────────────────────────

export type ClientFormState = {
  name: string;
  email: string;
  phone: string;
  taxId: string;
  address: string;
  fiscalAddress: string;
  company: string;
  notes: string;
  debt: string;
  creditLimit: string;
  priceList: PriceTier;
};

export const emptyForm: ClientFormState = {
  name: "",
  email: "",
  phone: "",
  taxId: "",
  address: "",
  fiscalAddress: "",
  company: "",
  notes: "",
  debt: "0",
  creditLimit: "0",
  priceList: "retail",
};

// ── Component ────────────────────────────────────────────────────────────

export function ClientFormModal({
  mode,
  isDesktop,
  formData,
  onChange,
  onClose,
  onSubmit,
  submitting,
  tierConfig,
}: {
  mode: "create" | "edit";
  isDesktop: boolean;
  formData: ClientFormState;
  onChange: (field: keyof ClientFormState, value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
  submitting: boolean;
  tierConfig?: Record<PriceTier, { name: string; enabled: boolean }>;
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

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Input
            label="Deuda inicial"
            value={formData.debt}
            onChange={(v) => onChange("debt", v)}
            type="number"
          />
          <Input
            label="Límite de crédito"
            value={formData.creditLimit}
            onChange={(v) => onChange("creditLimit", v)}
            placeholder="0 = Sin límite"
            type="number"
            icon={CreditCard}
          />
        </div>

        <ClientPriceListSelector
          value={formData.priceList}
          tierConfig={tierConfig}
          onChange={(tier) => onChange("priceList", tier)}
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
