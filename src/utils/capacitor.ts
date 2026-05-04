import { StatusBar, Style } from "@capacitor/status-bar";
import { SplashScreen } from "@capacitor/splash-screen";
import { App } from "@capacitor/app";

function isNative() {
  return !!(window as any).Capacitor?.isNativePlatform?.();
}

export async function initCapacitor() {
  if (!isNative()) return;

  try {
    // Status bar: dark content on light background (ajustar según tema)
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: "#0C0908" });

    // Hide splash screen after init
    await SplashScreen.hide();

    // Deep linking: manejar URLs abiertas desde fuera de la app
    App.addListener("appUrlOpen", (event) => {
      console.log("[Capacitor] Deep link opened:", event.url);
      // El router de la app manejará la navegación si la URL coincide con la base
      const url = new URL(event.url);
      if (url.pathname && url.pathname !== "/") {
        window.history.pushState({}, "", url.pathname + url.search);
      }
    });

    // Manejar botón de back en Android
    App.addListener("backButton", ({ canGoBack }) => {
      if (!canGoBack) {
        App.exitApp();
      } else {
        window.history.back();
      }
    });

    console.log("[Capacitor] Native plugins initialized");
  } catch (error) {
    console.error("[Capacitor] Error initializing plugins:", error);
  }
}
