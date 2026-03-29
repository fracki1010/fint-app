import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { X } from "lucide-react";

export type ToastVariant = "success" | "error" | "info" | "warning";

type ToastPayload = {
  title?: string;
  message: string;
  variant?: ToastVariant;
  durationMs?: number;
};

type ToastItem = ToastPayload & {
  id: number;
  variant: ToastVariant;
};

interface ToastContextValue {
  showToast: (payload: ToastPayload) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const toneMap: Record<ToastVariant, string> = {
  success: "border-success/35 bg-success/10 text-success",
  error: "border-danger/35 bg-danger/10 text-danger",
  info: "border-primary/35 bg-primary/10 text-primary",
  warning: "border-warning/35 bg-warning/10 text-warning",
};

export function AppToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    ({ title, message, variant = "info", durationMs = 3600 }: ToastPayload) => {
      const id = Date.now() + Math.floor(Math.random() * 1000);

      setToasts((current) => [...current, { id, title, message, variant }]);

      window.setTimeout(() => {
        removeToast(id);
      }, durationMs);
    },
    [removeToast],
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-[120] mx-auto w-full max-w-md px-4">
        <div className="space-y-2">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`pointer-events-auto rounded-2xl border px-4 py-3 shadow-lg backdrop-blur ${toneMap[toast.variant]}`}
              role="status"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  {toast.title && (
                    <p className="text-sm font-semibold text-foreground">
                      {toast.title}
                    </p>
                  )}
                  <p className="text-sm text-foreground">{toast.message}</p>
                </div>
                <button
                  aria-label="Cerrar notificacion"
                  className="rounded-full p-1 text-default-500 transition hover:bg-content2"
                  type="button"
                  onClick={() => removeToast(toast.id)}
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  );
}

export function useAppToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useAppToast must be used within AppToastProvider");
  }

  return context;
}
