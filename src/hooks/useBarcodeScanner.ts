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
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const videoContainerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const lastScanRef = useRef<number>(0);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerIdRef = useRef(`qr-scanner-${Date.now()}`);
  const zoomTrackRef = useRef<MediaStreamTrack | null>(null);

  const [zoomSupported, setZoomSupported] = useState(false);
  const [zoomRange, setZoomRange] = useState<{ min: number; max: number; step: number } | null>(null);
  const [zoomValue, setZoomValue] = useState(1);

  const triggerScan = useCallback(
    (code: string) => {
      const now = Date.now();
      if (now - lastScanRef.current < SCAN_COOLDOWN) return;
      if (code.length < MIN_CODE_LENGTH) return;
      lastScanRef.current = now;
      onScan(code);
    },
    [onScan],
  );

  const startCameraScanner = useCallback(async () => {
    try {
      setState("scanning");
      setError(null);

      if (scannerRef.current) {
        await scannerRef.current.stop();
        scannerRef.current.clear();
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

      // Leer capabilities de zoom del track de video
      try {
        const videoEl = document.querySelector(`#${containerId} video`) as HTMLVideoElement | null;
        if (videoEl && videoEl.srcObject) {
          const track = (videoEl.srcObject as MediaStream).getVideoTracks()[0];
          if (track) {
            zoomTrackRef.current = track;
            const capabilities = track.getCapabilities() as Record<string, unknown>;
            if (capabilities.zoom && typeof capabilities.zoom === "object") {
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
            }
          }
        }
      } catch {
        // Ignorar si no se puede leer zoom
      }
    } catch (err) {
      setState("error");
      const msg =
        err instanceof Error ? err.message : "Error al acceder a la cámara";
      setError(msg);
      onError?.(err instanceof Error ? err : new Error(msg));
    }
  }, [triggerScan, onError]);

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
  }, []);

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
  };
}
