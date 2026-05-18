import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Save, Loader2, ArrowLeft, Zap, CreditCard, Calendar, ArrowRight, Sparkles } from "lucide-react";

import { useSettings, Setting } from "@features/settings/hooks/useSettings";
import { useAppToast } from "@features/notifications/components/AppToast";
import { getErrorMessage } from "@shared/utils/errors";
import { useTenantPlan } from "@features/superadmin/hooks/useTenantPlan";
import { APP_BASE } from "@shared/config/complementConfig";

const FEATURE_LABELS_ES: Record<string, string> = {
  client_account: "Cuenta corriente clientes",
  supplier_account: "Cuenta corriente proveedores",
  quotes: "Presupuestos",
  banking: "Bancos",
  financial_center: "Financiero",
  unlimited_products: "Productos ilimitados",
  unlimited_orders: "Ventas ilimitadas",
  team_management: "Gestión de equipo",
  advanced_reports: "Reportes avanzados",
  api_access: "API REST",
  bill_of_materials: "Lista de materiales",
  recipes: "Producción",
  multi_location: "Listas de precios",
  bank_reconciliation: "Conciliación bancaria",
  whatsapp: "Asistente por WhatsApp",
};

function UsageBar({ label, current, max }: { label: string; current: number; max: number | -1 }) {
  const isUnlimited = max === -1 || max === Infinity || max === 0;
  // Calcular siempre desde current/max para que coincida con los números mostrados
  const safePercentage = !isUnlimited && typeof current === "number" && typeof max === "number" && max > 0
    ? Math.min(100, Math.round((current / max) * 100))
    : 0;
  const barColor = safePercentage >= 90 ? "#ef4444" : safePercentage >= 70 ? "#f59e0b" : "#3b82f6";

  return (
    <div className="rounded-xl bg-default-100/50 p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-default-500">{label}</span>
        <span className="text-xs font-semibold text-foreground">
          {current}{isUnlimited ? "" : ` / ${max}`}
        </span>
      </div>
      {!isUnlimited ? (
        <div className="mt-2 h-3 w-full rounded-full bg-default-300/50 overflow-hidden">
          <div
            className="h-3 rounded-full transition-all shadow-sm"
            style={{ width: `${Math.min(100, safePercentage)}%`, backgroundColor: barColor }}
          />
        </div>
      ) : (
        <p className="mt-1 text-[10px] text-default-400">Sin límite</p>
      )}
    </div>
  );
}



export default function CompanyPage() {
  const navigate = useNavigate();
  const { settings, loading: settingsLoading, error, updateSettings, isUpdating } = useSettings();
  const { showToast } = useAppToast();
  const { plan, loading: planLoading, error: planError } = useTenantPlan();
  const [formData, setFormData] = useState<Partial<Setting>>({});

  useEffect(() => {
    if (settings) setFormData(settings);
  }, [settings]);

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
                  Edición estándar
                </span>
              )}
            </div>

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
                />
                <UsageBar
                  label="Productos"
                  current={plan.usage.currentProducts}
                  max={plan.limits.maxProducts}
                />
                <UsageBar
                  label="Ventas (mes)"
                  current={plan.usage.ordersThisMonth}
                  max={plan.limits.maxOrdersPerMonth}
                />
              </div>

              {/* Edición estándar Card */}
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                      <Zap size={20} />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-foreground">Edición estándar</p>
                      <p className="text-sm text-default-400">Tu plan actual</p>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-primary">${APP_BASE.price}/mes</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {APP_BASE.features.map((f) => (
                    <span key={f} className="rounded-full bg-content1 px-2.5 py-1 text-[10px] font-medium text-default-500 border border-default-200">
                      {FEATURE_LABELS_ES[f] || f.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              </div>

              {/* Complements Info */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-default-500">Complementos</h3>
                </div>

                {plan.complements && plan.complements.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {plan.complements.map((compId: string) => (
                      <span key={compId} className="rounded-full bg-primary/15 px-2.5 py-1 text-[10px] font-bold text-primary border border-primary/20">
                        {compId}
                      </span>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => navigate("/complements")}
                  className="flex w-full items-center justify-between rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-left transition hover:bg-primary/10"
                >
                  <span className="flex items-center gap-2 text-sm font-semibold text-primary">
                    <Sparkles size={16} />
                    Ver complementos disponibles
                  </span>
                  <ArrowRight size={16} className="text-primary" />
                </button>

                <div className="rounded-xl border border-default-200 bg-default-50/50 px-4 py-3">
                  <p className="text-xs text-default-500 leading-relaxed">
                    Para activar complementos contactá a nuestro equipo de soporte. Te ayudaremos a elegir los que mejor se adapten a tu negocio.
                  </p>
                </div>
              </div>

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
                          plan.billing.paymentStatus === "pending" ? "text-warning" :
                          "text-default-400"
                        }`}>
                          {plan.billing.paymentStatus === "paid" ? "Al día" :
                           plan.billing.paymentStatus === "past_due" ? "Vencido" :
                           plan.billing.paymentStatus === "pending" ? "Pendiente" :
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

    </div>
  );
}
