import { useState, useCallback, useRef, useEffect } from "react";
import { BrowserMultiFormatReader, IScannerControls } from "@zxing/browser";
import { Result } from "@zxing/library";

type ScannerState = "idle" | "scanning" | "paused" | "error";

interface UseBarcodeScannerOptions {
  onScan: (code: string) => void;
  onError?: (error: Error) => void;
  isMobile: boolean;
}

const SCAN_COOLDOWN = 1200;
const MIN_CODE_LENGTH = 2;
const USB_INPUT_DEBOUNCE = 150;

export function useBarcodeScanner({
  onScan,
  onError,
  isMobile,
}: UseBarcodeScannerOptions) {
  const [state, setState] = useState<ScannerState>("idle");
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<IScannerControls | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const lastScanRef = useRef<number>(0);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    if (!isMobile || !videoRef.current) return;
    try {
      setState("scanning");
      setError(null);
      const reader = new BrowserMultiFormatReader();
      scannerRef.current = await reader.decodeFromVideoDevice(
        undefined,
        videoRef.current,
        (result: Result | undefined, err: Error | undefined) => {
          if (result) {
            triggerScan(result.getText());
            setState("paused");
            setTimeout(() => setState("scanning"), SCAN_COOLDOWN);
          }
          if (err && err.name !== "NotFoundException") {
            console.warn("Scanner error:", err.message);
          }
        },
      );
    } catch (err) {
      setState("error");
      setError("No se pudo acceder a la cámara");
      onError?.(err as Error);
    }
  }, [isMobile, triggerScan, onError]);

  const stopCameraScanner = useCallback(() => {
    if (scannerRef.current) {
      scannerRef.current.stop();
      scannerRef.current = null;
    }
    setState("idle");
  }, []);

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
    if (!isMobile && inputRef.current && state !== "error") {
      setState("scanning");
      inputRef.current.focus();
    }
  }, [isMobile, state]);

  useEffect(() => {
    return () => {
      stopCameraScanner();
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [stopCameraScanner]);

  const toggleCameraScanner = useCallback(() => {
    if (state === "scanning" || state === "paused") {
      stopCameraScanner();
    } else {
      startCameraScanner();
    }
  }, [state, startCameraScanner, stopCameraScanner]);

  return {
    state,
    error,
    videoRef,
    inputRef,
    startCameraScanner,
    stopCameraScanner,
    toggleCameraScanner,
    handleUSBInput,
  };
}
