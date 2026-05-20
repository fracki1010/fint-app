import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  Loader2,
  DollarSign,
  RotateCcw,
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

  const [appBasePrice, setAppBasePrice] = useState<number>(pricing?.appBasePrice || 8000);
  const [complementPrices, setComplementPrices] = useState<Record<string, number>>({});

  // Initialize from pricing data
  useState(() => {
    if (pricing?.effectivePrices) {
      const { appBase, ...comps } = pricing.effectivePrices;
      setAppBasePrice(appBase || 8000);
      setComplementPrices(comps);
    }
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const response = await api.put("/superadmin/pricing", {
        appBasePrice,
        complementPricing: complementPrices,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["superadmin", "pricing"] });
      showToast({ variant: "success", message: "Precios actualizados correctamente" });
    },
    onError: (error: any) => {
      showToast({
        variant: "error",
        message: error.response?.data?.message || "Error al actualizar precios",
      });
    },
  });

  const handlePriceChange = (id: string, value: string) => {
    const num = parseInt(value.replace(/\D/g, ""), 10) || 0;
    setComplementPrices((prev) => ({ ...prev, [id]: num }));
  };

  const handleReset = () => {
    if (pricing?.effectivePrices) {
      const { appBase, ...comps } = pricing.effectivePrices;
      setAppBasePrice(appBase || 8000);
      setComplementPrices(comps);
    }
  };

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
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/superadmin")}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-divider bg-content1 text-default-400 transition hover:text-foreground"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Precios de Complementos</h1>
            <p className="text-sm text-default-400">
              Editá los precios mensuales que ven los clientes
            </p>
          </div>
        </div>

        {/* App Base Price */}
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <DollarSign size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Edición estándar</h2>
              <p className="text-sm text-default-500">Precio base mensual</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-primary">$</span>
            <input
              type="text"
              value={appBasePrice.toLocaleString("es-AR")}
              onChange={(e) => {
                const num = parseInt(e.target.value.replace(/\D/g, ""), 10) || 0;
                setAppBasePrice(num);
              }}
              className="w-40 rounded-xl border border-divider bg-content1 px-4 py-2.5 text-2xl font-bold text-foreground focus:border-primary focus:outline-none"
            />
            <span className="text-sm text-default-500">/mes</span>
          </div>
        </div>

        {/* Complements Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(COMPLEMENTS).map(([id, comp]) => (
            <div key={id} className="rounded-2xl border border-divider bg-content1 p-5">
              <div className="mb-3">
                <h3 className="text-sm font-bold text-foreground">
                  {FEATURE_LABELS_ES[id] || comp.name}
                </h3>
                <p className="text-xs text-default-500 mt-0.5">
                  {comp.features.map((f) => f.replace(/_/g, " ")).join(", ")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-primary">$</span>
                <input
                  type="text"
                  value={(complementPrices[id] ?? comp.price).toLocaleString("es-AR")}
                  onChange={(e) => handlePriceChange(id, e.target.value)}
                  className="w-full rounded-xl border border-divider bg-background px-3 py-2 text-sm font-semibold text-foreground focus:border-primary focus:outline-none"
                />
                <span className="text-xs text-default-500">/mes</span>
              </div>
            </div>
          ))}
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
