import { useNavigate } from "react-router-dom";
import { Lock, ArrowLeft, Zap, Crown, Building2, Check } from "lucide-react";
import { usePlanFeatures, Feature } from "@/hooks/usePlanFeatures";

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

const FEATURE_PLANS: Record<Feature, { plan: string; icon: React.ElementType }> = {
  financial_center: { plan: "Business", icon: Building2 },
  recipes: { plan: "Business", icon: Building2 },
  advanced_reports: { plan: "Enterprise", icon: Crown },
  api_access: { plan: "Enterprise", icon: Crown },
  supplier_account: { plan: "Business", icon: Building2 },
  client_account: { plan: "Business", icon: Building2 },
  team_management: { plan: "Business", icon: Building2 },
  unlimited_products: { plan: "Business", icon: Building2 },
  unlimited_orders: { plan: "Business", icon: Building2 },
};

interface UpgradeRequiredProps {
  feature: Feature;
}

export default function UpgradeRequired({ feature }: UpgradeRequiredProps) {
  const navigate = useNavigate();
  const { plan: currentPlan } = usePlanFeatures();
  const info = FEATURE_PLANS[feature];
  const FeatureIcon = info?.icon || Zap;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="mx-auto w-full max-w-md text-center">
        {/* Icon */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-default-100">
          <Lock size={36} className="text-default-400" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-foreground">
          Función no disponible
        </h1>
        <p className="mt-2 text-sm text-default-500">
          {FEATURE_LABELS[feature] || feature} no está incluida en tu plan actual.
        </p>

        {/* Current plan */}
        <div className="mt-6 rounded-2xl border border-default-200 bg-default-50/50 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-default-400">
            Tu plan actual
          </p>
          <p className="mt-1 text-lg font-bold capitalize text-foreground">
            {currentPlan || "Essential"}
          </p>
        </div>

        {/* Upgrade to */}
        <div className="mt-4 rounded-2xl border border-primary/20 bg-primary/5 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-primary/70">
            Disponible en
          </p>
          <div className="mt-2 flex items-center justify-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/15">
              <FeatureIcon size={16} className="text-primary" />
            </div>
            <p className="text-lg font-bold text-primary">
              Plan {info?.plan || "Business"}
            </p>
          </div>
        </div>

        {/* Benefits */}
        <div className="mt-6 space-y-2 text-left">
          <p className="px-1 text-xs font-bold uppercase tracking-wider text-default-400">
            Qué incluye
          </p>
          <div className="space-y-2">
            {[
              FEATURE_LABELS[feature],
              "Soporte prioritario",
              "Actualizaciones automáticas",
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 rounded-xl bg-default-50/50 px-3 py-2">
                <Check size={14} className="shrink-0 text-success" />
                <span className="text-sm text-default-600">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-col gap-3">
          <button
            onClick={() => navigate("/admin/company")}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary font-bold text-white transition hover:bg-primary/90"
          >
            <Zap size={18} />
            Ver planes y precios
          </button>
          <button
            onClick={() => navigate(-1)}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-default-200 font-semibold text-default-500 transition hover:bg-default-50"
          >
            <ArrowLeft size={16} />
            Volver
          </button>
        </div>
      </div>
    </div>
  );
}
