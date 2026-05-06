import { useEffect } from "react";
import type { NavigateOptions } from "react-router-dom";

import { HeroUIProvider } from "@heroui/system";
import { useHref, useNavigate } from "react-router-dom";

import { useThemeStore } from "@shared/stores/themeStore";
import { AppToastProvider } from "@features/notifications/components/AppToast";

declare module "@react-types/shared" {
  interface RouterConfig {
    routerOptions: NavigateOptions;
  }
}

export function Provider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const theme = useThemeStore((state) => state.theme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    root.style.colorScheme = theme;
  }, [theme]);

  return (
    <HeroUIProvider navigate={navigate} useHref={useHref}>
      <AppToastProvider>{children}</AppToastProvider>
    </HeroUIProvider>
  );
}
