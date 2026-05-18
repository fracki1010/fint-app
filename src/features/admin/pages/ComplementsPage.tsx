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
} from "lucide-react";

import { COMPLEMENTS, APP_BASE } from "@shared/config/complementConfig";

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

const COMPLEMENT_DESCRIPTIONS: Record<string, string> = {
  expansion:
    "Eliminá los límites de productos y ventas mensuales. Ideal para negocios en crecimiento que necesitan escalar sin restricciones.",
  team_10:
    "Agregá hasta 10 usuarios con roles diferenciados (admin, ventas, depósito, contabilidad). Perfecto para equipos en crecimiento.",
  team_unlimited:
    "Usuarios ilimitados con roles personalizables. Para empresas grandes con equipos distribuidos.",
  financiero:
    "Dashboard visual con KPIs de tesorería, comparación de ventas vs compras y alertas de variaciones anormales.",
  contabilidad:
    "Libros IVA automáticos (ventas y compras), exportación para contador y generación de asientos contables.",
  bom:
    "Definí productos compuestos por ingredientes. Cálculo automático de costos teóricos y explosión de materiales.",
  produccion:
    "Registrá órdenes de producción, consumo automático de stock de ingredientes y trazabilidad de lotes.",
  api:
    "Acceso programático completo a tu tenant. Documentación interactiva Swagger e integración con otros sistemas.",
  reportes:
    "Reportes personalizables por fecha, producto, vendedor y estado. Exportación a Excel y PDF.",
  listas_precios:
    "Hasta 5 listas de precios diferenciadas. Asignación automática por cliente (mayoristas, minoristas, etc.).",
  centros_costo:
    "Categorizá gastos por centro de costo, analizá rentabilidad por producto y visualizá distribución de costos.",
  conciliacion:
    "Match automático entre movimientos bancarios y registros internos. Importación de extractos bancarios.",
  whatsapp:
    "Conectá un número de WhatsApp y dejá que un agente de IA atienda a tus clientes automáticamente. El agente puede consultar stock, precios, tomar pedidos y responder preguntas frecuentes 24/7 sin intervención humana.",
};

export default function ComplementsPage() {
  const navigate = useNavigate();

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

        {/* App Base Card */}
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary">
              <Zap size={24} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-foreground">App Base</h2>
                <span className="text-lg font-bold text-primary">${APP_BASE.price}/mes</span>
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
                    {f.replace(/_/g, " ")}
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Object.values(COMPLEMENTS).map((comp) => {
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
                      <span className="text-sm font-bold text-primary">${comp.price}/mes</span>
                    </div>
                    <p className="mt-2 text-xs text-default-500 leading-relaxed">
                      {COMPLEMENT_DESCRIPTIONS[comp.id] || comp.features.join(", ")}
                    </p>
                    {comp.features.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {comp.features.map((f) => (
                          <span
                            key={f}
                            className="rounded-full bg-default-100 px-2 py-0.5 text-[9px] font-medium text-default-500"
                          >
                            {f.replace(/_/g, " ")}
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
      </div>
    </div>
  );
}
