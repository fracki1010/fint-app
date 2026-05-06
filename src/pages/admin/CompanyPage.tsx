import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import { Save, Loader2, ArrowLeft, Check, Zap, Building2, Crown, CreditCard, Calendar } from "lucide-react";

import { useSettings, Setting } from "@/hooks/useSettings";
import { useAppToast } from "@/components/AppToast";
import { getErrorMessage } from "@/utils/errors";
import { useTenantPlan, useChangePlan, AvailablePlan } from "@/hooks/useTenantPlan";
import { Feature } from "@/hooks/usePlanFeatures";
import { useCreatePaymentPreference } from "@/hooks/useCreatePaymentPreference";
import { useMercadoPago } from "@/hooks/useMercadoPago";

const FEATURE_LABELS: Record<Feature, string> = {
  financial_center: "Centro Financiero",
  recipes: "Recetas / Producción",
  advanced_reports: "Reportes Avanzados",
  api_access: "Acceso a API",
  supplier_account: "Cta. Corriente Proveedores",
  client_account: "Cta. Corriente Clientes",
  team_management: "Gestión de Equipo",
  unlimited_products: "Productos Ilimitados",
  unlimited_orders: "Ventas Ilimitadas",
};

function ChangePlanModal({
  isOpen,
  plan,
  onClose,
  onConfirm,
  isLoading,
  isPayment,
}: {
  isOpen: boolean;
  plan: AvailablePlan | null;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  isPayment?: boolean;
}) {
  if (!plan) return null;
  const Icon = plan.id === "enterprise" ? Crown : plan.id === "business" ? Building2 : Zap;

  return (
    <Modal isOpen={isOpen} placement="center" onOpenChange={(open) => { if (!open) onClose(); }}>
      <ModalContent className="bg-content1">
        <ModalHeader className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
            plan.id === "enterprise" ? "bg-purple-500/15 text-purple-400" :
            plan.id === "business" ? "bg-blue-500/15 text-blue-400" :
            "bg-default-200/60 text-default-500"
          }`}>
            <Icon size={20} />
          </div>
          <div>
            <p className="text-sm text-default-400">{isPayment ? "Actualizar plan" : "Cambiar plan"}</p>
            <p className="text-lg font-bold text-foreground">{plan.name}</p>
          </div>
        </ModalHeader>
        <ModalBody>
          <div className="rounded-2xl bg-default-100/50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-default-500">Precio</span>
              <span className="text-sm font-bold text-foreground">${plan.price}/mes</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-default-500">Usuarios</span>
              <span className="text-sm font-semibold text-foreground">
                {plan.maxUsers === Infinity ? "Ilimitados" : `Hasta ${plan.maxUsers}`}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-default-500">Productos</span>
              <span className="text-sm font-semibold text-foreground">
                {plan.maxProducts === Infinity ? "Ilimitados" : `Hasta ${plan.maxProducts}`}
              </span>
            </div>
          </div>
          <p className="text-xs text-default-500 leading-relaxed">
            {isPayment
              ? "Serás redirigido a MercadoPago para completar el pago de forma segura. El cambio se aplicará una vez confirmado el pago."
              : "El cambio de plan es inmediato. Recibirás un correo con la confirmación y el nuevo resumen de facturación."}
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
            {isPayment ? "Pagar con MercadoPago" : "Confirmar cambio"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

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

function PlanCard({
  plan,
  isCurrent,
  onSelect,
  isChanging,
}: {
  plan: AvailablePlan;
  isCurrent: boolean;
  onSelect: () => void;
  isChanging: boolean;
}) {
  const isDowngrade = !isCurrent;
  const Icon = plan.id === "enterprise" ? Crown : plan.id === "business" ? Building2 : Zap;

  return (
    <div
      className={`rounded-2xl border p-4 transition ${
        isCurrent
          ? "border-primary bg-primary/5"
          : "border-default-200 bg-default-50/40 hover:border-default-300"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
          plan.id === "enterprise" ? "bg-purple-500/15 text-purple-400" :
          plan.id === "business" ? "bg-blue-500/15 text-blue-400" :
          "bg-default-200/60 text-default-500"
        }`}>
          <Icon size={20} />
        </div>
        {isCurrent && (
          <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary">
            Actual
          </span>
        )}
      </div>

      <p className="mt-3 text-lg font-bold text-foreground">{plan.name}</p>
      <p className="text-sm text-default-400">
        ${plan.price}<span className="text-xs">/mes</span>
      </p>

      <ul className="mt-3 space-y-1.5">
        <li className="flex items-center gap-1.5 text-xs text-default-500">
          <Check size={12} className="text-success shrink-0" />
          {plan.maxUsers === -1 || plan.maxUsers === Infinity ? "Usuarios ilimitados" : `Hasta ${plan.maxUsers} usuarios`}
        </li>
        <li className="flex items-center gap-1.5 text-xs text-default-500">
          <Check size={12} className="text-success shrink-0" />
          {plan.maxProducts === -1 || plan.maxProducts === Infinity ? "Productos ilimitados" : `Hasta ${plan.maxProducts} productos`}
        </li>
        <li className="flex items-center gap-1.5 text-xs text-default-500">
          <Check size={12} className="text-success shrink-0" />
          {plan.maxOrdersPerMonth === -1 || plan.maxOrdersPerMonth === Infinity ? "Ventas ilimitadas" : `Hasta ${plan.maxOrdersPerMonth} ventas/mes`}
        </li>
      </ul>

      {(plan.features?.length ?? 0) > 0 && (
        <div className="mt-3 space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-default-400">Incluye</p>
          {plan.features.map((feat) => (
            <div key={feat} className="flex items-start gap-1.5 text-xs text-default-500">
              <span className="shrink-0 mt-0.5 text-success">
                <Check size={11} />
              </span>
              <span className="truncate">{FEATURE_LABELS[feat as Feature] || feat || "—"}</span>
            </div>
          ))}
        </div>
      )}

      {!isCurrent && (
        <Button
          fullWidth
          className="mt-4 h-10 rounded-xl text-xs font-bold"
          color={isDowngrade ? "default" : "primary"}
          variant={isDowngrade ? "bordered" : "solid"}
          isLoading={isChanging}
          onPress={onSelect}
        >
          {isDowngrade ? "Cambiar" : "Actualizar"}
        </Button>
      )}
    </div>
  );
}

export default function CompanyPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { settings, loading: settingsLoading, error, updateSettings, isUpdating } = useSettings();
  const { showToast } = useAppToast();
  const { plan, availablePlans, loading: planLoading, error: planError } = useTenantPlan();
  const changePlanMutation = useChangePlan();
  const createPreference = useCreatePaymentPreference();
  const { openCheckout } = useMercadoPago();
  const [formData, setFormData] = useState<Partial<Setting>>({});
  const [selectedPlan, setSelectedPlan] = useState<AvailablePlan | null>(null);

  useEffect(() => {
    if (settings) setFormData(settings);
  }, [settings]);

  // Mostrar toast según estado de pago en URL
  useEffect(() => {
    const payment = searchParams.get("payment");
    if (payment === "success") {
      showToast({ variant: "success", message: "¡Pago exitoso! Tu plan se actualizará en breve." });
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

  const trialEndsAt = plan?.trialEndsAt;
  const isTrial = trialEndsAt && new Date(trialEndsAt) > new Date();
  const trialDaysLeft = isTrial ? Math.ceil((new Date(trialEndsAt!).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;

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
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                  plan.current === "enterprise" ? "bg-purple-500/15 text-purple-400" :
                  plan.current === "business" ? "bg-blue-500/15 text-blue-400" :
                  "bg-default-200/60 text-default-500"
                }`}>
                  {plan.current}
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
              {plan && (
                <>
                  <div className="grid gap-3 sm:grid-cols-3 mb-4">
                    <UsageBar
                      label="Usuarios"
                      current={plan.usage.currentUsers}
                      max={(() => {
                        const p = availablePlans.find(x => x.id === plan.current);
                        return p ? (p.maxUsers === Infinity ? -1 : p.maxUsers) : -1;
                      })()}
                      percentage={plan.usagePercentages.users}
                    />
                    <UsageBar
                      label="Productos"
                      current={plan.usage.currentProducts}
                      max={(() => {
                        const p = availablePlans.find(x => x.id === plan.current);
                        return p ? (p.maxProducts === Infinity ? -1 : p.maxProducts) : -1;
                      })()}
                      percentage={plan.usagePercentages.products}
                    />
                    <UsageBar
                      label="Ventas (mes)"
                      current={plan.usage.ordersThisMonth}
                      max={(() => {
                        const p = availablePlans.find(x => x.id === plan.current);
                        return p ? (p.maxOrdersPerMonth === Infinity ? -1 : p.maxOrdersPerMonth) : -1;
                      })()}
                      percentage={plan.usagePercentages.orders}
                    />
                  </div>

                  {/* Plan cards */}
                  <div className="grid gap-4 sm:grid-cols-3">
                    {availablePlans.map((p) => (
                      <PlanCard
                        key={p.id}
                        isCurrent={p.isCurrent}
                        isChanging={changePlanMutation.isPending}
                        plan={p}
                        onSelect={() => setSelectedPlan(p)}
                      />
                    ))}
                  </div>

                  {isTrial && (
                    <div className="rounded-xl border border-warning/20 bg-warning/5 px-4 py-3">
                      <p className="text-xs text-warning font-medium">
                        Durante tu período de prueba podés cambiar de plan gratis cuantas veces quieras.
                        Una vez que finalice el trial, los cambios de plan requerirán pago.
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
            </>
          )}
        </div>
      </div>

      {/* Change plan confirmation modal */}
      <ChangePlanModal
        isOpen={!!selectedPlan}
        isLoading={changePlanMutation.isPending || createPreference.isPending}
        isPayment={selectedPlan ? !selectedPlan.isCurrent && (!isTrial || selectedPlan.id === "enterprise") : false}
        plan={selectedPlan}
        onClose={() => setSelectedPlan(null)}
        onConfirm={() => {
          if (!selectedPlan) return;

          const targetHasTrial = selectedPlan.id !== "enterprise";
          const requiresPayment = !isTrial || !targetHasTrial;

          // Cambio gratuito: solo si tenés trial activo Y el plan destino tiene trial (Essential/Business)
          if (!requiresPayment) {
            changePlanMutation.mutate(selectedPlan.id, {
              onSuccess: () => {
                showToast({ variant: "success", message: `Plan actualizado a ${selectedPlan.name}` });
                setSelectedPlan(null);
              },
              onError: (err: any) => {
                showToast({ variant: "error", message: getErrorMessage(err, "Error al cambiar plan") });
              },
            });
            return;
          }

          // Pago requerido: fuera de trial, o cambio a Enterprise (que nunca tiene trial)
          if (!selectedPlan.isCurrent) {
            createPreference.mutate(selectedPlan.id, {
              onSuccess: (data) => {
                if (data.initPoint) {
                  // Abrir Checkout Pro
                  openCheckout(data.preferenceId);
                }
                setSelectedPlan(null);
              },
              onError: (err: any) => {
                showToast({ variant: "error", message: getErrorMessage(err, "Error al iniciar el pago") });
              },
            });
            return;
          }

          // Mismo plan, no hacer nada
          setSelectedPlan(null);
        }}
      />
    </div>
  );
}
