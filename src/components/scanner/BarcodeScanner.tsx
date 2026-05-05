import { Loader2, Camera, CameraOff, X, ZoomIn } from "lucide-react";

interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (code: string) => void;
  setVideoContainer: (el: HTMLDivElement | null) => void;
  state: "idle" | "scanning" | "paused" | "error";
  error: string | null;
  onToggle: () => void;
  zoomSupported?: boolean;
  zoomRange?: { min: number; max: number; step: number } | null;
  zoomValue?: number;
  onZoomChange?: (value: number) => void;
  debugLog?: string;
}

export default function BarcodeScanner({
  isOpen,
  onClose,
  state,
  error,
  setVideoContainer,
  onToggle,
  zoomSupported = false,
  zoomRange = null,
  zoomValue = 1,
  onZoomChange,
  debugLog = "",
}: BarcodeScannerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black">
      {debugLog && (
        <div className="absolute left-2 right-2 top-14 z-[110] max-h-[30vh] overflow-auto rounded-lg bg-black/80 p-2 text-[10px] leading-tight text-green-400">
          <pre className="whitespace-pre-wrap font-mono">{debugLog}</pre>
        </div>
      )}
      <div className="flex items-center justify-between px-4 py-3">
        <button
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white"
          onClick={onClose}
        >
          <X size={20} />
        </button>
        <p className="text-sm font-semibold text-white">Escanear código</p>
        <button
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white"
          onClick={onToggle}
        >
          {state === "scanning" ? <CameraOff size={20} /> : <Camera size={20} />}
        </button>
      </div>

      <div className="relative flex flex-1 items-center justify-center px-6">
        <div className="relative aspect-square w-full max-w-sm overflow-hidden rounded-3xl bg-zinc-900">
          {state === "error" ? (
            <div className="flex h-full w-full flex-col items-center justify-center bg-zinc-900 text-center">
              <CameraOff size={40} className="mb-3 text-zinc-500" />
              <p className="text-sm font-semibold text-zinc-300">
                Cámara no disponible
              </p>
              <p className="mt-1 max-w-[200px] px-4 text-xs text-zinc-500">
                {error || "Verificá los permisos de la cámara"}
              </p>
            </div>
          ) : (
            <>
              <div
                ref={setVideoContainer}
                className="h-full w-full [&_video]:h-full [&_video]:w-full [&_video]:object-cover"
              />
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="h-3/5 w-3/5 rounded-2xl border-2 border-white/60" />
              </div>
            </>
          )}
        </div>
      </div>

      <div className="px-6 pb-10 text-center">
        {state === "scanning" && (
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center justify-center gap-2 text-white/70">
              <Loader2 className="animate-spin" size={16} />
              <p className="text-sm">Esperando código...</p>
            </div>
            {zoomSupported && zoomRange && (
              <div className="flex w-full max-w-xs flex-col items-center gap-2 rounded-2xl bg-white/10 px-4 py-2">
                <div className="flex items-center gap-2">
                  {[1, 2, 3]
                    .filter((z) => z >= zoomRange.min && z <= zoomRange.max)
                    .map((z) => (
                      <button
                        key={z}
                        onClick={() => onZoomChange?.(z)}
                        className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                          Math.abs((zoomValue ?? 1) - z) < 0.05
                            ? "bg-white text-black"
                            : "bg-white/20 text-white hover:bg-white/30"
                        }`}
                      >
                        {z}x
                      </button>
                    ))}
                </div>
                <div className="flex w-full items-center gap-2">
                  <ZoomIn size={14} className="shrink-0 text-white/50" />
                  <input
                    type="range"
                    min={zoomRange.min}
                    max={zoomRange.max}
                    step={zoomRange.step}
                    value={zoomValue}
                    onChange={(e) => onZoomChange?.(parseFloat(e.target.value))}
                    className="h-1 w-full cursor-pointer appearance-none rounded-full bg-white/15 accent-white"
                  />
                  <span className="shrink-0 text-[10px] tabular-nums text-white/60">
                    {zoomValue.toFixed(1)}x
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
        {state === "paused" && (
          <p className="text-sm text-yellow-400">Procesando...</p>
        )}
        {state === "idle" && (
          <button
            className="rounded-2xl bg-white px-6 py-3 text-sm font-bold text-black"
            onClick={onToggle}
          >
            Activar cámara
          </button>
        )}
      </div>
    </div>
  );
}
