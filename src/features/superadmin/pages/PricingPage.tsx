import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  Loader2,
  DollarSign,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  FileText,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@shared/api/axios";
import { useAppToast } from "@features/notifications/components/AppToast";
import { useSuperAdminPricing } from "@features/superadmin/hooks/useSuperAdmin";
import { COMPLEMENTS } from "@shared/config/complementConfig";
import SuperAdminLayout from "@features/superadmin/components/SuperAdminLayout";

const FEATURE_LABELS_ES: Record<string, string> = {
  expansion: "Expansión de Límites",
  team_10: "Team 10",
  team_unlimited: "Team ∞",
  financiero: "Panel Financiero",
  contabilidad: "Contabilidad",
  bom: "Lista de Materiales",
  produccion: "Módulo de Producción",
  api: "API Access",
  reportes: "Reportes Avanzados",
  listas_precios: "Múltiples Listas de Precios",
  centros_costo: "Centros de Costo",
  conciliacion: "Conciliación Bancaria",
  whatsapp: "Asistente por WhatsApp",
};

export default function PricingPage() {
  const navigate = useNavigate();
  const { showToast } = useAppToast();
  const queryClient = useQueryClient();
  const { pricing, loading } = useSuperAdminPricing();

  const [appBasePrice, setAppBasePrice] = useState(8000);
  const [complementPrices, setComplementPrices] = useState<Record<string, number>>({});
  const [descriptions, setDescriptions] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  // Initialize from pricing data
  useEffect(() => {
    if (pricing) {
      setAppBasePrice(pricing.appBasePrice || 8000);
      const { appBase, ...comps } = pricing.effectivePrices;
      setComplementPrices(comps);
      setDescriptions(pricing.descriptions || {});
    }
  }, [pricing]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      const response = await api.put("/superadmin/pricing", {
        appBasePrice,
        complementPricing: complementPrices,
        complementDescriptions: descriptions,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["superadmin", "pricing"] });
      showToast({ variant: "success", message: "Precios y descripciones guardados" });
    },
    onError: (error: any) => {
      showToast({
        variant: "error",
        message: error.response?.data?.message || "Error al guardar",
      });
    },
  });

  const handleReset = () => {
    if (pricing) {
      setAppBasePrice(pricing.appBasePrice || 8000);
      const { appBase, ...comps } = pricing.effectivePrices;
      setComplementPrices(comps);
      setDescriptions(pricing.descriptions || {});
    }
  };

  const toggleExpanded = (id: string) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  if (loading) {
    return (
      <SuperAdminLayout>
        <div className="flex h-96 items-center justify-center">
          <Loader2 size={32} className="animate-spin text-primary" />
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout>
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/superadmin")}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-divider bg-content1 text-default-400 transition hover:text-foreground"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Configuración de Complementos</h1>
            <p className="text-sm text-default-400">
              Editá precios y descripciones de cada complemento
            </p>
          </div>
        </div>

        {/* App Base Price */}
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary">
              <DollarSign size={22} />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-foreground">Edición estándar</h2>
              <p className="text-sm text-default-500">Precio base mensual incluido en todos los planes</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-primary">$</span>
              <input
                type="text"
                value={appBasePrice.toLocaleString("es-AR")}
                onChange={(e) => {
                  const num = parseInt(e.target.value.replace(/\D/g, ""), 10) || 0;
                  setAppBasePrice(num);
                }}
                className="w-32 rounded-xl border border-divider bg-content1 px-3 py-2 text-xl font-bold text-foreground text-center focus:border-primary focus:outline-none"
              />
              <span className="text-sm text-default-500">/mes</span>
            </div>
          </div>
        </div>

        {/* Complements Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="section-kicker">Complementos ({Object.keys(COMPLEMENTS).length})</h2>
          </div>

          {Object.entries(COMPLEMENTS).map(([id, comp]) => {
            const isOpen = expanded[id];
            return (
              <div
                key={id}
                className="rounded-2xl border border-divider bg-content1 overflow-hidden transition-all"
              >
                {/* Summary row */}
                <button
                  type="button"
                  onClick={() => toggleExpanded(id)}
                  className="flex w-full items-center gap-4 p-5 text-left hover:bg-content2/30 transition"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <FileText size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-foreground">
                      {FEATURE_LABELS_ES[id] || comp.name}
                    </h3>
                    {descriptions[id] && (
                      <p className="mt-0.5 text-xs text-default-500 line-clamp-1">
                        {descriptions[id]}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-default-500">$</span>
                      <input
                        type="text"
                        value={(complementPrices[id] ?? comp.price).toLocaleString("es-AR")}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          const num = parseInt(e.target.value.replace(/\D/g, ""), 10) || 0;
                          setComplementPrices((prev) => ({ ...prev, [id]: num }));
                        }}
                        className="w-24 rounded-lg border border-divider bg-background px-2.5 py-1.5 text-sm font-semibold text-foreground text-center focus:border-primary focus:outline-none"
                      />
                      <span className="text-xs text-default-500">/mes</span>
                    </div>
                    {isOpen ? (
                      <ChevronUp size={18} className="text-default-400" />
                    ) : (
                      <ChevronDown size={18} className="text-default-400" />
                    )}
                  </div>
                </button>

                {/* Expanded: description editor */}
                {isOpen && (
                  <div className="border-t border-divider/20 px-5 py-4 space-y-3 bg-content2/20">
                    <label className="text-xs font-bold uppercase tracking-widest text-default-500">
                      Descripción (visible para el cliente)
                    </label>
                    <textarea
                      rows={4}
                      value={descriptions[id] || ""}
                      onChange={(e) =>
                        setDescriptions((prev) => ({ ...prev, [id]: e.target.value }))
                      }
                      className="w-full rounded-xl border border-divider bg-background px-4 py-3 text-sm text-foreground placeholder:text-default-400 focus:border-primary focus:outline-none resize-y"
                      placeholder="Escribí una descripción que ayude al cliente a entender este complemento..."
                    />
                    <p className="text-[10px] text-default-400">
                      {descriptions[id]?.length || 0} caracteres
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 rounded-xl border border-divider bg-content2 px-5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-content3"
          >
            <RotateCcw size={16} />
            Restablecer
          </button>
          <button
            onClick={() => updateMutation.mutate()}
            disabled={updateMutation.isPending}
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
          >
            {updateMutation.isPending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            Guardar cambios
          </button>
        </div>
      </div>
    </SuperAdminLayout>
  );
}
