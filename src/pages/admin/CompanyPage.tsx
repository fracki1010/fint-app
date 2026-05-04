import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Save, Loader2, ArrowLeft, Check, Zap, Building2, Crown } from "lucide-react";

import { useSettings, Setting } from "@/hooks/useSettings";
import { useAppToast } from "@/components/AppToast";
import { getErrorMessage } from "@/utils/errors";
import { useTenantPlan, useChangePlan } from "@/hooks/useTenantPlan";

export default function CompanyPage() {
  const navigate = useNavigate();
  const { settings, loading, error, updateSettings, isUpdating } =
    useSettings();
  const { showToast } = useAppToast();
  const { plan, availablePlans, loading: planLoading } = useTenantPlan();
  const changePlanMutation = useChangePlan();
  const [formData, setFormData] = useState<Partial<Setting>>({});

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const handleInputChange = (field: keyof Setting, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      await updateSettings(formData);
      showToast({
        variant: "success",
        message: "Datos de empresa guardados.",
      });
    } catch (err) {
      showToast({
        variant: "error",
        message: getErrorMessage(err, "Error al guardar datos de empresa"),
      });
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-2xl space-y-5 px-4 py-4 lg:max-w-3xl lg:px-6">
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

        <div className="space-y-4 rounded-2xl border border-default-200 bg-content1 p-5">
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
              onChange={(e) =>
                handleInputChange("fiscalCondition", e.target.value)
              }
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
        </div>

        <div>
          <Button
            fullWidth
            className="h-12 rounded-2xl font-semibold"
            color="primary"
            isDisabled={isUpdating}
            size="lg"
            startContent={
              isUpdating ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Save size={18} />
              )
            }
            onClick={handleSave}
          >
            {isUpdating ? "Guardando..." : "Guardar datos de empresa"}
          </Button>
        </div>

        {/* Plan & Billing */}
        <div className="space-y-4 rounded-2xl border border-default-200 bg-content1 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">Plan</h2>
            {plan?.trialEndsAt && new Date(plan.trialEndsAt) > new Date() && (
              <span className="rounded-full bg-yellow-500/15 px-3 py-1 text-xs font-bold text-yellow-400">
                Trial · {(Math.ceil((new Date(plan.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} días
              </span>
            )}
          </div>

          {planLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Usage bars */}
              {plan && (
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
              )}
              <div className="grid gap-4 sm:grid-cols-3">
              {availablePlans.map((p) => {
                const isCurrent = p.isCurrent;
                const isDowngrade = !isCurrent && availablePlans.indexOf(p) < availablePlans.indexOf(availablePlans.find(x => x.isCurrent)!);
                const Icon = p.id === "enterprise" ? Crown : p.id === "business" ? Building2 : Zap;

                return (
                  <div
                    key={p.id}
                    className={`rounded-2xl border p-4 transition ${
                      isCurrent
                        ? "border-primary bg-primary/5"
                        : "border-default-200 bg-white/5 hover:border-default-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                        p.id === "enterprise" ? "bg-purple-500/15 text-purple-400" :
                        p.id === "business" ? "bg-blue-500/15 text-blue-400" :
                        "bg-gray-500/15 text-gray-400"
                      }`}>
                        <Icon size={20} />
                      </div>
                      {isCurrent && (
                        <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary">
                          Actual
                        </span>
                      )}
                    </div>

                    <p className="mt-3 text-lg font-bold text-foreground">{p.name}</p>
                    <p className="text-sm text-default-400">
                      ${p.price}<span className="text-xs">/mes</span>
                    </p>

                    <ul className="mt-3 space-y-1.5">
                      <li className="flex items-center gap-1.5 text-xs text-default-500">
                        <Check size={12} className="text-success" />
                        {p.maxUsers === Infinity ? "Usuarios ilimitados" : `Hasta ${p.maxUsers} usuarios`}
                      </li>
                      <li className="flex items-center gap-1.5 text-xs text-default-500">
                        <Check size={12} className="text-success" />
                        {p.maxProducts === Infinity ? "Productos ilimitados" : `Hasta ${p.maxProducts} productos`}
                      </li>
                    </ul>

                    {!isCurrent && (
                      <Button
                        fullWidth
                        className="mt-4 h-10 rounded-xl text-xs font-bold"
                        color={isDowngrade ? "default" : "primary"}
                        variant={isDowngrade ? "bordered" : "solid"}
                        isLoading={changePlanMutation.isPending}
                        onPress={() => {
                          if (confirm(`¿Cambiar al plan ${p.name}?`)) {
                            changePlanMutation.mutate(p.id, {
                              onSuccess: () => {
                                showToast({ variant: "success", message: `Plan actualizado a ${p.name}` });
                              },
                              onError: (err: any) => {
                                showToast({ variant: "error", message: getErrorMessage(err, "Error al cambiar plan") });
                              },
                            });
                          }
                        }}
                      >
                        Cambiar a {p.name}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function UsageBar({ label, current, max, percentage }: { label: string; current: number; max: number | "Infinity" | -1; percentage: number }) {
  const isUnlimited = max === -1 || max === "Infinity";
  const barColor = percentage >= 90 ? "#ef4444" : percentage >= 70 ? "#f59e0b" : "#3b82f6";

  return (
    <div className="rounded-xl bg-white/5 p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">{label}</span>
        <span className="text-xs font-semibold text-white">
          {current}{isUnlimited ? "" : ` / ${max}`}
        </span>
      </div>
      {!isUnlimited && (
        <div className="mt-2 h-1.5 w-full rounded-full bg-white/5">
          <div
            className="h-1.5 rounded-full transition-all"
            style={{ width: `${Math.min(100, percentage)}%`, backgroundColor: barColor }}
          />
        </div>
      )}
      {isUnlimited && (
        <p className="mt-1 text-[10px] text-gray-500">Sin límite</p>
      )}
    </div>
  );
}
