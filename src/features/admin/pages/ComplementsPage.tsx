import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Users,
  TrendingUp,
  BookOpen,
  Factory,
  BarChart3,
  Globe,
  FileText,
  DollarSign,
  Landmark,
  Layers,
  Sparkles,
  Zap,
  MessageCircle,
  Loader2,
} from "lucide-react";

import { useComplementCatalog } from "@features/complements/hooks/useComplementCatalog";
import { APP_BASE } from "@shared/config/complementConfig";

const fmtArs = (n: number) =>
  "$ " + n.toLocaleString("es-AR");

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
  whatsapp: "WhatsApp",
};

const COMPLEMENT_ICONS: Record<string, React.ElementType> = {
  expansion: Layers,
  team_10: Users,
  team_unlimited: Users,
  financiero: BarChart3,
  contabilidad: BookOpen,
  bom: Factory,
  produccion: Factory,
  api: Globe,
  reportes: FileText,
  listas_precios: DollarSign,
  centros_costo: TrendingUp,
  conciliacion: Landmark,
  whatsapp: MessageCircle,
};

export default function ComplementsPage() {
  const navigate = useNavigate();
  const { catalog, loading } = useComplementCatalog();

  return (
    <div className="h-full">
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-4 lg:px-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-default-200 text-default-500 transition hover:bg-default-100"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <p className="section-kicker">Tu plan</p>
            <h1 className="text-xl font-bold text-foreground">Complementos disponibles</h1>
          </div>
        </div>

        {/* Edición estándar Card */}
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary">
              <Zap size={24} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-foreground">Edición estándar</h2>
                <span className="text-lg font-bold text-primary">{fmtArs(catalog?.appBasePrice || APP_BASE.price)}/mes</span>
              </div>
              <p className="mt-1 text-sm text-default-500">
                Incluido en todos los planes. Todo lo esencial para arrancar y operar tu negocio.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {APP_BASE.features.map((f) => (
                  <span
                    key={f}
                    className="rounded-full bg-content1 px-2.5 py-1 text-[10px] font-medium text-default-500 border border-default-200"
                  >
                    {FEATURE_LABELS_ES[f] || f.replace(/_/g, " ")}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Contact CTA */}
        <div className="rounded-2xl border border-default-200 bg-content1 p-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-warning/10 text-warning">
              <Sparkles size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-foreground">¿Necesitás más funcionalidades?</h3>
              <p className="mt-1 text-sm text-default-500">
                Contactá a nuestro equipo de soporte y te ayudamos a elegir los complementos ideales para tu negocio.
              </p>
            </div>
            <button
              type="button"
              className="shrink-0 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-600"
            >
              Contactar soporte
            </button>
          </div>
        </div>

        {/* Complements Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(catalog?.complements || []).map((comp) => {
              const Icon = COMPLEMENT_ICONS[comp.id] || Zap;
              return (
                <div
                  key={comp.id}
                  className="group rounded-2xl border border-default-200 bg-content1 p-5 transition hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary/20">
                      <Icon size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-foreground">{comp.name}</h3>
                        <span className="text-sm font-bold text-primary">{fmtArs(comp.price)}/mes</span>
                      </div>
                      <p className="mt-2 text-xs text-default-500 leading-relaxed">
                        {comp.description || comp.features.join(", ")}
                      </p>
                      {comp.features.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {comp.features.map((f) => (
                            <span
                              key={f}
                              className="rounded-full bg-default-100 px-2 py-0.5 text-[9px] font-medium text-default-500"
                            >
                              {FEATURE_LABELS_ES[f] || f.replace(/_/g, " ")}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
