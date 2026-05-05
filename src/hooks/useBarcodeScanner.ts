import { useState, useCallback, useRef, useEffect } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";

type ScannerState = "idle" | "scanning" | "paused" | "error";

interface UseBarcodeScannerOptions {
  onScan: (code: string) => void;
  onError?: (error: Error) => void;
}

const SCAN_COOLDOWN = 1500;
const MIN_CODE_LENGTH = 3;
const USB_INPUT_DEBOUNCE = 150;

const FORMATS_TO_SUPPORT = [
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.CODE_93,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.ITF,
  Html5QrcodeSupportedFormats.QR_CODE,
  Html5QrcodeSupportedFormats.DATA_MATRIX,
  Html5QrcodeSupportedFormats.CODABAR,
];

export function useBarcodeScanner({
  onScan,
  onError,
}: UseBarcodeScannerOptions) {
  const [state, setState] = useState<ScannerState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [debugLog, setDebugLog] = useState<string>("");
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const videoContainerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const lastScanRef = useRef<number>(0);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerIdRef = useRef(`qr-scanner-${Date.now()}`);
  const zoomTrackRef = useRef<MediaStreamTrack | null>(null);
  const onScanRef = useRef(onScan);
  const onErrorRef = useRef(onError);
  const isStartingRef = useRef(false);

  const [zoomSupported, setZoomSupported] = useState(false);
  const [zoomRange, setZoomRange] = useState<{ min: number; max: number; step: number } | null>(null);
  const [zoomValue, setZoomValue] = useState(1);

  // Mantener refs actualizadas sin disparar re-renders
  useEffect(() => {
    onScanRef.current = onScan;
    onErrorRef.current = onError;
  });

  const appendDebug = useCallback((msg: string) => {
    setDebugLog((prev) => {
      const next = `${prev}\n${msg}`.trim();
      return next.split("\n").slice(-5).join("\n"); // ultimas 5 lineas
    });
  }, []);

  const triggerScan = useCallback(
    (code: string) => {
      const now = Date.now();
      if (now - lastScanRef.current < SCAN_COOLDOWN) return;
      if (code.length < MIN_CODE_LENGTH) return;
      lastScanRef.current = now;
      onScanRef.current(code);
    },
    [],
  );

  const startCameraScanner = useCallback(async () => {
    if (isStartingRef.current) return; // evitar doble inicio
    isStartingRef.current = true;

    try {
      setState("scanning");
      setError(null);
      appendDebug("Iniciando camara...");

      if (scannerRef.current) {
        appendDebug("Deteniendo scanner anterior");
        try {
          await scannerRef.current.stop();
          scannerRef.current.clear();
        } catch {
          // ignorar
        }
        scannerRef.current = null;
      }

      const container = videoContainerRef.current;
      if (!container) {
        throw new Error("Contenedor de video no encontrado");
      }

      container.innerHTML = "";
      const containerId = containerIdRef.current;
      const div = document.createElement("div");
      div.id = containerId;
      div.style.width = "100%";
      div.style.height = "100%";
      container.appendChild(div);
      appendDebug(`Container creado: ${containerId}`);

      const scanner = new Html5Qrcode(containerId, {
        formatsToSupport: FORMATS_TO_SUPPORT,
        verbose: false,
      });
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: 250,
        },
        (decodedText) => {
          triggerScan(decodedText);
          setState("paused");
          setTimeout(() => setState("scanning"), SCAN_COOLDOWN);
        },
        () => {},
      );

      appendDebug("Scanner iniciado OK");

      // Leer capabilities de zoom del track de video
      try {
        await new Promise((r) => setTimeout(r, 300)); // dar tiempo a que html5-qrcode cree el video
        const videoEl = document.querySelector(`#${containerId} video`) as HTMLVideoElement | null;
        appendDebug(`Video encontrado: ${!!videoEl}`);
        if (videoEl && videoEl.srcObject) {
          const track = (videoEl.srcObject as MediaStream).getVideoTracks()[0];
          if (track) {
            zoomTrackRef.current = track;
            const capabilities = track.getCapabilities() as Record<string, unknown>;
            const hasZoom = capabilities.zoom && typeof capabilities.zoom === "object";
            appendDebug(`Zoom soportado: ${hasZoom}`);
            if (hasZoom) {
              const z = capabilities.zoom as { min: number; max: number; step?: number };
              setZoomSupported(true);
              setZoomRange({
                min: z.min,
                max: z.max,
                step: z.step ?? 0.1,
              });
              const settings = track.getSettings() as Record<string, unknown>;
              const currentZoom = (settings.zoom as number) ?? z.min;
              setZoomValue(currentZoom);
              appendDebug(`Zoom: ${currentZoom.toFixed(1)}x (${z.min}-${z.max})`);
            }
          }
        }
      } catch (e) {
        appendDebug(`Zoom error: ${e instanceof Error ? e.message : String(e)}`);
      }
    } catch (err) {
      setState("error");
      const msg = err instanceof Error ? err.message : "Error al acceder a la camara";
      setError(msg);
      appendDebug(`ERROR: ${msg}`);
      onErrorRef.current?.(err instanceof Error ? err : new Error(msg));
    } finally {
      isStartingRef.current = false;
    }
  }, [triggerScan, appendDebug]);

  const applyZoom = useCallback((value: number) => {
    if (!zoomTrackRef.current) return;
    try {
      zoomTrackRef.current.applyConstraints({
        advanced: [{ zoom: value } as unknown as MediaTrackConstraintSet],
      });
      setZoomValue(value);
    } catch (err) {
      console.error("Error aplicando zoom:", err);
    }
  }, []);

  const stopCameraScanner = useCallback(async () => {
    appendDebug("Deteniendo camara...");
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch {
        // Ignorar errores al detener
      }
      scannerRef.current = null;
    }
    zoomTrackRef.current = null;
    setZoomSupported(false);
    setZoomRange(null);
    setZoomValue(1);
    setState("idle");
    isStartingRef.current = false;
  }, [appendDebug]);

  const toggleCameraScanner = useCallback(() => {
    if (state === "scanning" || state === "paused") {
      stopCameraScanner();
    } else {
      startCameraScanner();
    }
  }, [state, startCameraScanner, stopCameraScanner]);

  const handleUSBInput = useCallback(
    (value: string) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        if (value.length >= MIN_CODE_LENGTH) {
          triggerScan(value);
        }
      }, USB_INPUT_DEBOUNCE);
    },
    [triggerScan],
  );

  useEffect(() => {
    if (inputRef.current && state !== "error") {
      inputRef.current.focus();
    }
  }, [state]);

  useEffect(() => {
    return () => {
      stopCameraScanner();
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [stopCameraScanner]);

  const setVideoContainer = useCallback((el: HTMLDivElement | null) => {
    videoContainerRef.current = el;
  }, []);

  return {
    state,
    error,
    videoContainerRef,
    setVideoContainer,
    inputRef,
    startCameraScanner,
    stopCameraScanner,
    toggleCameraScanner,
    handleUSBInput,
    zoomSupported,
    zoomRange,
    zoomValue,
    applyZoom,
    debugLog,
  };
}
