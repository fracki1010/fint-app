import { useState, useEffect, useMemo } from "react";
import {
  Loader2,
  Check,
  X,
  ShoppingBag,
  Zap,
} from "lucide-react";
import { useComplementCatalog } from "@features/complements/hooks/useComplementCatalog";
import { useSuperAdminPricing } from "@features/superadmin/hooks/useSuperAdmin";

interface ComplementSelectorModalProps {
  open: boolean;
  onClose: () => void;
  selected: string[];
  onSave: (complements: string[]) => void;
}

const COMPLEMENT_ICONS: Record<string, string> = {
  expansion: "🚀",
  team_10: "👥",
  team_unlimited: "♾️",
  financiero: "📊",
  contabilidad: "📒",
  bom: "🧱",
  produccion: "🏭",
  api: "🔌",
  reportes: "📈",
  listas_precios: "🏷️",
  centros_costo: "🎯",
  conciliacion: "🏦",
  whatsapp: "💬",
};

export default function ComplementSelectorModal({
  open,
  selected,
  onSave,
  onClose,
}: ComplementSelectorModalProps) {
  const { catalog, loading } = useComplementCatalog();
  const { pricing, loading: pricingLoading } = useSuperAdminPricing();
  const [localSelected, setLocalSelected] = useState<string[]>(selected);

  // Sync when modal opens
  useEffect(() => {
    if (open) setLocalSelected(selected);
  }, [open, selected]);

  const toggle = (id: string) => {
    setLocalSelected((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  };

  const total = useMemo(() => {
    const appBase = pricing?.appBasePrice || 8000;
    const complementsTotal = localSelected.reduce((sum, id) => {
      const item = catalog?.complements.find((c) => c.id === id);
      return sum + (item?.price || 0);
    }, 0);
    return appBase + complementsTotal;
  }, [localSelected, catalog, pricing]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-4 z-50 m-auto flex max-h-[90vh] max-w-2xl flex-col overflow-hidden rounded-3xl border border-divider bg-content1 shadow-2xl lg:inset-x-auto lg:inset-y-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-divider px-6 py-4">
          <div className="flex items-center gap-3">
            <ShoppingBag size={20} className="text-primary" />
            <div>
              <h2 className="text-base font-bold text-foreground">Complementos</h2>
              <p className="text-xs text-default-500">
                Activá los complementos que este cliente necesita
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-default-400 hover:bg-content2 hover:text-foreground transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading || pricingLoading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 size={24} className="animate-spin text-primary" />
            </div>
          ) : catalog?.complements.length === 0 ? (
            <p className="text-center text-sm text-default-500 py-8">
              No hay complementos disponibles
            </p>
          ) : (
            catalog?.complements.map((item) => {
              const isActive = localSelected.includes(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggle(item.id)}
                  className={`group relative flex w-full items-start gap-4 rounded-2xl border-2 p-5 text-left transition-all ${
                    isActive
                      ? "border-primary bg-primary/5"
                      : "border-divider hover:border-primary/30 hover:bg-content2/50"
                  }`}
                >
                  {/* Check icon */}
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg transition-all ${
                      isActive
                        ? "bg-primary text-white"
                        : "bg-content2 text-default-400"
                    }`}
                  >
                    {isActive ? (
                      <Check size={20} />
                    ) : (
                      <span>{COMPLEMENT_ICONS[item.id] || "🔧"}</span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3">
                      <h3
                        className={`text-sm font-bold ${
                          isActive ? "text-primary" : "text-foreground"
                        }`}
                      >
                        {item.name}
                      </h3>
                      <span className="shrink-0 text-sm font-bold text-primary">
                        $ {item.price.toLocaleString("es-AR")}/mes
                      </span>
                    </div>
                    {item.description && (
                      <p
                        className={`mt-1 text-xs leading-relaxed ${
                          isActive ? "text-primary/70" : "text-default-500"
                        }`}
                      >
                        {item.description}
                      </p>
                    )}
                    {item.features.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {item.features.map((f) => (
                          <span
                            key={f}
                            className={`rounded-full px-2 py-0.5 text-[9px] font-medium ${
                              isActive
                                ? "bg-primary/10 text-primary"
                                : "bg-content2 text-default-500"
                            }`}
                          >
                            {f.replace(/_/g, " ")}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer with total */}
        <div className="border-t border-divider px-6 py-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap size={16} className="text-primary" />
              <span className="text-xs text-default-500">
                {localSelected.length} complemento{localSelected.length !== 1 ? "s" : ""} activo{localSelected.length !== 1 ? "s" : ""}
              </span>
            </div>
            <p className="text-lg font-bold text-foreground">
              $ {total.toLocaleString("es-AR")}
              <span className="text-xs font-normal text-default-500">/mes</span>
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 rounded-xl border border-divider bg-content2 px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-content3"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                onSave(localSelected);
                onClose();
              }}
              className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
            >
              Guardar complementos
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
