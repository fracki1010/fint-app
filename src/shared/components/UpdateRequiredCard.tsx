import { useRegisterSW } from "virtual:pwa-register/react";
import { RefreshCw } from "lucide-react";

const CHECK_EVERY_MS = 30 * 60 * 1000;

// Shown when a newer build is waiting. It has no dismiss action: the app keeps the
// user on the update until the new version is active.
export default function UpdateRequiredCard() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (!registration) return;
      window.setInterval(() => registration.update(), CHECK_EVERY_MS);
    },
  });

  if (!needRefresh) return null;

  return (
    <div className="fixed inset-0 z-[400] flex items-end justify-center bg-black/40 p-4 backdrop-blur-[2px] sm:items-center">
      <div
        aria-labelledby="update-required-title"
        aria-modal="true"
        className="w-full max-w-sm rounded-3xl border border-divider/20 bg-content1 p-5 shadow-2xl animate-sheet-up"
        role="alertdialog"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary">
            <RefreshCw size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground" id="update-required-title">
              Hay una versión nueva de Fint
            </p>
            <p className="text-xs text-default-500">
              Actualizá para usar los últimos cambios.
            </p>
          </div>
        </div>
        <button
          className="mt-4 w-full rounded-2xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          onClick={() => updateServiceWorker(true)}
          type="button"
        >
          Actualizar ahora
        </button>
      </div>
    </div>
  );
}
