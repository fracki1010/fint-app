import { useEffect, useRef, useCallback } from "react";

interface MercadoPagoCheckout {
  open: () => void;
}

interface MercadoPagoInstance {
  checkout: (options: {
    preference: { id: string };
    autoOpen?: boolean;
  }) => MercadoPagoCheckout;
}

declare global {
  interface Window {
    MercadoPago?: new (publicKey: string, options?: { locale: string }) => MercadoPagoInstance;
  }
}

const SDK_URL = "https://sdk.mercadopago.com/js/v2";

export function useMercadoPago() {
  const mpRef = useRef<MercadoPagoInstance | null>(null);

  useEffect(() => {
    if (window.MercadoPago) return;

    const script = document.createElement("script");
    script.src = SDK_URL;
    script.async = true;
    document.body.appendChild(script);

    return () => {
      if (script.parentNode) script.parentNode.removeChild(script);
    };
  }, []);

  const openCheckout = useCallback((preferenceId: string) => {
    if (!window.MercadoPago) {
      console.error("MercadoPago SDK not loaded");
      return;
    }

    // Usamos una public key dummy o de test; en producción debe venir de env
    const publicKey = import.meta.env.VITE_MERCADO_PAGO_PUBLIC_KEY || "TEST-00000000-0000-0000-0000-000000000000";

    const mp = new window.MercadoPago(publicKey, { locale: "es-AR" });
    mpRef.current = mp;

    mp.checkout({
      preference: { id: preferenceId },
      autoOpen: true,
    });
  }, []);

  return { openCheckout };
}
