import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import { Save, Loader2, ArrowLeft, Zap, CreditCard, Calendar, ToggleLeft, ToggleRight } from "lucide-react";

import { useSettings, Setting } from "@features/settings/hooks/useSettings";
import { useAppToast } from "@features/notifications/components/AppToast";
import { getErrorMessage } from "@shared/utils/errors";
import { useTenantPlan, useActivateComplements } from "@features/superadmin/hooks/useTenantPlan";
import { useCreatePaymentPreference } from "@features/sales/hooks/useCreatePaymentPreference";
import { COMPLEMENTS, computeTotalPrice, APP_BASE } from "@shared/config/complementConfig";

function UsageBar({ label, current, max, percentage }: { label: string; current: number; max: number | -1; percentage: number }) {
  const isUnlimited = max === -1 || max === Infinity || max === 0;
  const safePercentage = Number.isFinite(percentage) ? percentage : 0;
  const barColor = safePercentage >= 90 ? "var(--heroui-danger)" : safePercentage >= 70 ? "var(--heroui-warning)" : "var(--heroui-primary)";

  return (
    <div className="rounded-xl bg-default-100/50 p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-default-500">{label}</span>
        <span className="text-xs font-semibold text-foreground">
          {current}{isUnlimited ? "" : ` / ${max}`}
        </span>
      </div>
      {!isUnlimited ? (
        <div className="mt-2 h-1.5 w-full rounded-full bg-default-200">
          <div
            className="h-1.5 rounded-full transition-all"
            style={{ width: `${Math.min(100, safePercentage)}%`, backgroundColor: barColor }}
          />
        </div>
      ) : (
        <p className="mt-1 text-[10px] text-default-400">Sin límite</p>
      )}
    </div>
  );
}

function ComplementToggle({
  id: _id,
  name,
  price,
  features,
  active,
  onToggle,
}: {
  id: string;
  name: string;
  price: number;
  features: string[];
  active: boolean;
  onToggle: () => void;
}) {
  const Icon = active ? ToggleRight : ToggleLeft;
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
        active
          ? "border-primary bg-primary/5"
          : "border-default-200 bg-default-50/40 hover:border-default-300"
      }`}
    >
      <div className={`shrink-0 ${active ? "text-primary" : "text-default-400"}`}>
        <Icon size={24} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-foreground">{name}</p>
          <p className="text-sm font-bold text-primary">${price}/mes</p>
        </div>
        {features.length > 0 && (
          <p className="mt-0.5 text-[10px] text-default-400 truncate">
            {features.map((f) => f.replace(/_/g, " ")).join(" · ")}
          </p>
        )}
      </div>
      {active && (
        <span className="shrink-0 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary">
          Activo
        </span>
      )}
    </button>
  );
}

function PaymentConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  selectedComplements,
  totalPrice,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  selectedComplements: string[];
  totalPrice: number;
}) {
  return (
    <Modal isOpen={isOpen} placement="center" onOpenChange={(open) => { if (!open) onClose(); }}>
      <ModalContent className="bg-content1">
        <ModalHeader className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Zap size={20} />
          </div>
          <div>
            <p className="text-sm text-default-400">Confirmar complementos</p>
            <p className="text-lg font-bold text-foreground">Activar selección</p>
          </div>
        </ModalHeader>
        <ModalBody>
          <div className="rounded-2xl bg-default-100/50 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-default-500">App Base</span>
              <span className="text-sm font-bold text-foreground">${APP_BASE.price}/mes</span>
            </div>
            {selectedComplements.map((compId) => {
              const comp = COMPLEMENTS[compId];
              if (!comp) return null;
              return (
                <div key={compId} className="flex items-center justify-between">
                  <span className="text-sm text-default-500">{comp.name}</span>
                  <span className="text-sm font-bold text-foreground">${comp.price}/mes</span>
                </div>
              );
            })}
            <div className="mt-2 border-t border-default-200 pt-2 flex items-center justify-between">
              <span className="text-sm font-bold text-foreground">Total mensual</span>
              <span className="text-lg font-bold text-primary">${totalPrice}/mes</span>
            </div>
          </div>
          <p className="text-xs text-default-500 leading-relaxed">
            Serás redirigido a MercadoPago para completar el pago de forma segura. Los complementos se activarán una vez confirmado el pago.
          </p>
        </ModalBody>
        <ModalFooter>
          <Button variant="bordered" onPress={onClose}>
            Cancelar
          </Button>
          <Button
            color="primary"
            isLoading={isLoading}
            onPress={onConfirm}
          >
            Pagar con MercadoPago
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default function CompanyPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { settings, loading: settingsLoading, error, updateSettings, isUpdating } = useSettings();
  const { showToast } = useAppToast();
  const { plan, availableComplements, loading: planLoading, error: planError } = useTenantPlan();
  const activateComplementsMutation = useActivateComplements();
  const createPreference = useCreatePaymentPreference();
  const [formData, setFormData] = useState<Partial<Setting>>({});
  const [selectedComplements, setSelectedComplements] = useState<string[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    if (settings) setFormData(settings);
  }, [settings]);

  useEffect(() => {
    if (plan?.complements) {
      setSelectedComplements(plan.complements);
    }
  }, [plan?.complements]);

  // Mostrar toast según estado de pago en URL
  useEffect(() => {
    const payment = searchParams.get("payment");
    if (payment === "success") {
      showToast({ variant: "success", message: "¡Pago exitoso! Tus complementos se activarán en breve." });
    } else if (payment === "pending") {
      showToast({ variant: "info", message: "Pago pendiente. Te notificaremos cuando se confirme." });
    } else if (payment === "failure") {
      showToast({ variant: "error", message: "El pago no pudo completarse. Intentá de nuevo." });
    }
    if (payment) {
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, showToast, setSearchParams]);

  const handleInputChange = (field: keyof Setting, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      await updateSettings(formData);
      showToast({ variant: "success", message: "Datos de empresa guardados." });
    } catch (err) {
      showToast({ variant: "error", message: getErrorMessage(err, "Error al guardar datos de empresa") });
    }
  };

  const toggleComplement = (id: string) => {
    setSelectedComplements((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const currentTotal = computeTotalPrice(plan?.complements || []);
  const selectedTotal = computeTotalPrice(selectedComplements);
  const hasChanges = JSON.stringify((plan?.complements || []).sort()) !== JSON.stringify(selectedComplements.sort());

  const trialEndsAt = plan?.trialEndsAt;
  const isTrial = trialEndsAt && new Date(trialEndsAt) > new Date();
  const trialDaysLeft = isTrial ? Math.ceil((new Date(trialEndsAt!).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;

  const handleConfirmChanges = () => {
    if (!hasChanges) {
      showToast({ variant: "info", message: "No hay cambios para aplicar." });
      return;
    }

    // Durante trial, activación gratuita
    if (isTrial) {
      activateComplementsMutation.mutate(selectedComplements, {
        onSuccess: () => {
          showToast({ variant: "success", message: "Complementos activados correctamente" });
        },
        onError: (err: any) => {
          showToast({ variant: "error", message: getErrorMessage(err, "Error al activar complementos") });
        },
      });
      return;
    }

    // Fuera de trial, requiere pago
    setShowPaymentModal(true);
  };

  const handlePayment = () => {
    createPreference.mutate(selectedComplements, {
      onSuccess: (data) => {
        if (data.initPoint) {
          window.open(data.initPoint, "_blank", "noopener,noreferrer");
        }
        setShowPaymentModal(false);
      },
      onError: (err: any) => {
        showToast({ variant: "error", message: getErrorMessage(err, "Error al iniciar el pago") });
        setShowPaymentModal(false);
      },
    });
  };

  return (
    <div className="h-full">
      <div className="mx-auto max-w-2xl space-y-5 px-4 py-4 lg:max-w-3xl lg:px-6">
        {/* Back + Header */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-default-200 text-default-500 transition hover:bg-default-100"
            onClick={() => navigate("/admin")}
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <p className="section-kicker">Administración</p>
            <h1 className="text-xl font-bold text-foreground">Empresa</h1>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-danger/20 bg-danger/10 p-4">
            <p className="text-sm text-danger">{error}</p>
          </div>
        )}

        {/* Company info form */}
        <div className="space-y-4 rounded-2xl border border-default-200 bg-content1 p-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-default-500">Datos de la empresa</h2>

          {settingsLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <Input
                label="Nombre de la empresa"
                value={formData.storeName || ""}
                variant="bordered"
                onChange={(e) => handleInputChange("storeName", e.target.value)}
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  isRequired
                  label="CUIT / NIT / RUC"
                  value={formData.taxId || ""}
                  variant="bordered"
                  onChange={(e) => handleInputChange("taxId", e.target.value)}
                />
                <Input
                  isRequired
                  label="Condición fiscal"
                  value={formData.fiscalCondition || ""}
                  variant="bordered"
                  onChange={(e) => handleInputChange("fiscalCondition", e.target.value)}
                />
              </div>

              <Input
                label="Dirección"
                value={formData.address || ""}
                variant="bordered"
                onChange={(e) => handleInputChange("address", e.target.value)}
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="Teléfono"
                  value={formData.phone || ""}
                  variant="bordered"
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                />
                <Input
                  label="Email"
                  type="email"
                  value={formData.email || ""}
                  variant="bordered"
                  onChange={(e) => handleInputChange("email", e.target.value)}
                />
              </div>

              <Button
                fullWidth
                className="h-12 rounded-2xl font-semibold"
                color="primary"
                isDisabled={isUpdating}
                size="lg"
                startContent={isUpdating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save size={18} />}
                onClick={handleSave}
              >
                {isUpdating ? "Guardando..." : "Guardar datos de empresa"}
              </Button>
            </>
          )}
        </div>

        {/* Plan & Billing section */}
        <div className="space-y-4 rounded-2xl border border-default-200 bg-content1 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-foreground">Plan</h2>
              {plan && (
                <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                  App Base
                </span>
              )}
            </div>
            {isTrial && (
              <div className="flex flex-col items-end gap-0.5">
                <span className="rounded-full bg-warning/15 px-3 py-1 text-xs font-bold text-warning">
                  Trial · {trialDaysLeft} {trialDaysLeft === 1 ? "día" : "días"}
                </span>
                <span className="text-[10px] text-default-400">
                  Vence el {new Date(trialEndsAt!).toLocaleDateString("es-AR")}
                </span>
              </div>
            )}
          </div>

          {planLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : planError ? (
            <div className="rounded-2xl border border-danger/20 bg-danger/10 p-4 text-center">
              <p className="text-sm text-danger">{planError}</p>
              <p className="mt-1 text-xs text-default-500">
                No se pudieron cargar los datos del plan. Intentá recargar la página.
              </p>
            </div>
          ) : !plan ? (
            <div className="rounded-2xl border border-default-200 bg-default-50/50 p-4 text-center">
              <p className="text-sm text-default-500">No hay información de plan disponible.</p>
            </div>
          ) : (
            <>
              {/* Usage bars */}
              <div className="grid gap-3 sm:grid-cols-3 mb-4">
                <UsageBar
                  label="Usuarios"
                  current={plan.usage.currentUsers}
                  max={plan.limits.maxUsers}
                  percentage={plan.usagePercentages.users}
                />
                <UsageBar
                  label="Productos"
                  current={plan.usage.currentProducts}
                  max={plan.limits.maxProducts}
                  percentage={plan.usagePercentages.products}
                />
                <UsageBar
                  label="Ventas (mes)"
                  current={plan.usage.ordersThisMonth}
                  max={plan.limits.maxOrdersPerMonth}
                  percentage={plan.usagePercentages.orders}
                />
              </div>

              {/* App Base Card */}
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                      <Zap size={20} />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-foreground">App Base</p>
                      <p className="text-sm text-default-400">Tu plan actual</p>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-primary">${APP_BASE.price}/mes</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {APP_BASE.features.map((f) => (
                    <span key={f} className="rounded-full bg-content1 px-2.5 py-1 text-[10px] font-medium text-default-500 border border-default-200">
                      {f.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              </div>

              {/* Complements Marketplace */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-default-500">Complementos</h3>
                  <span className="text-xs text-default-400">
                    Total actual: <span className="font-bold text-foreground">${currentTotal}/mes</span>
                  </span>
                </div>

                <div className="space-y-2">
                  {availableComplements.length > 0 ? (
                    availableComplements.map((comp) => (
                      <ComplementToggle
                        key={comp.id}
                        id={comp.id}
                        name={comp.name}
                        price={comp.price}
                        features={comp.features}
                        active={selectedComplements.includes(comp.id)}
                        onToggle={() => toggleComplement(comp.id)}
                      />
                    ))
                  ) : (
                    Object.values(COMPLEMENTS).map((comp) => (
                      <ComplementToggle
                        key={comp.id}
                        id={comp.id}
                        name={comp.name}
                        price={comp.price}
                        features={comp.features}
                        active={selectedComplements.includes(comp.id)}
                        onToggle={() => toggleComplement(comp.id)}
                      />
                    ))
                  )}
                </div>

                {hasChanges && (
                  <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-primary font-medium">
                          {isTrial ? "Cambios pendientes" : "Requiere pago"}
                        </p>
                        <p className="text-xs text-default-500">
                          Nuevo total: <span className="font-bold text-foreground">${selectedTotal}/mes</span>
                        </p>
                      </div>
                      <Button
                        color="primary"
                        size="sm"
                        isLoading={activateComplementsMutation.isPending}
                        onPress={handleConfirmChanges}
                      >
                        {isTrial ? "Activar gratis" : "Continuar al pago"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {isTrial && (
                <div className="rounded-xl border border-warning/20 bg-warning/5 px-4 py-3">
                  <p className="text-xs text-warning font-medium">
                    Durante tu período de prueba podés activar complementos gratis.
                    Una vez que finalice el trial, los cambios requerirán pago.
                  </p>
                </div>
              )}

              {/* Billing info */}
              {plan.billing && (
                <div className="mt-4 rounded-2xl bg-default-100/50 p-4 space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-default-500 flex items-center gap-1.5">
                    <CreditCard size={13} />
                    Facturación
                  </h3>
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                    {plan.billing.email && (
                      <span className="text-default-500">
                        Email: <span className="text-foreground font-medium">{plan.billing.email}</span>
                      </span>
                    )}
                    {plan.billing.paymentStatus && (
                      <span className="flex items-center gap-1.5 text-default-500">
                        <Calendar size={13} />
                        Estado:{" "}
                        <span className={`font-medium ${
                          plan.billing.paymentStatus === "paid" ? "text-success" :
                          plan.billing.paymentStatus === "past_due" ? "text-danger" :
                          "text-default-400"
                        }`}>
                          {plan.billing.paymentStatus === "paid" ? "Al día" :
                           plan.billing.paymentStatus === "past_due" ? "Vencido" :
                           plan.billing.paymentStatus}
                        </span>
                      </span>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Payment confirmation modal */}
      <PaymentConfirmModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onConfirm={handlePayment}
        isLoading={createPreference.isPending}
        selectedComplements={selectedComplements}
        totalPrice={selectedTotal}
      />
    </div>
  );
}
