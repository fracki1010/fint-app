import { useState } from "react";
import { X } from "lucide-react";
import { useExperienceMode } from "@shared/hooks/useExperienceMode";

export function ExperienceModeBanner() {
  const { mode, isSimple } = useExperienceMode();
  const [dismissed, setDismissed] = useState(() => {
    return localStorage.getItem(`fint_mode_banner_dismissed_${mode}`) === "true";
  });

  // Don't show for simple mode or already dismissed
  if (isSimple || dismissed) return null;

  const messages: Record<string, string> = {
    intermediate:
      "Tu experiencia se amplió — ahora tenés acceso a Compras, Proveedores y más",
    full:
      "Tu experiencia se amplió — ahora tenés acceso a todas las funcionalidades del sistema",
  };

  const handleDismiss = () => {
    localStorage.setItem(`fint_mode_banner_dismissed_${mode}`, "true");
    setDismissed(true);
  };

  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 mb-4">
      <p className="text-sm font-medium text-primary">{messages[mode] || "Tu experiencia se amplió"}</p>
      <button
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-primary/60 hover:bg-primary/10 hover:text-primary transition"
        onClick={handleDismiss}
        aria-label="Cerrar"
      >
        <X size={15} />
      </button>
      <button
        className="ml-2 shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/10 transition"
        onClick={handleDismiss}
      >
        Entendido
      </button>
    </div>
  );
}
