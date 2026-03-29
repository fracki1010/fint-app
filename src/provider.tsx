import type { NavigateOptions } from "react-router-dom";

import { HeroUIProvider } from "@heroui/system";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { useHref, useNavigate } from "react-router-dom";

import { useSettings } from "@/hooks/useSettings";
import { useThemeStore } from "@/stores/themeStore";
import { AppToastProvider } from "@/components/AppToast";

declare module "@react-types/shared" {
  interface RouterConfig {
    routerOptions: NavigateOptions;
  }
}

export function Provider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const theme = useThemeStore((state) => state.theme);

  const activeTheme = settings?.theme || theme;

  return (
    <HeroUIProvider navigate={navigate} useHref={useHref}>
      <NextThemesProvider
        attribute="class"
        defaultTheme={activeTheme}
        enableSystem={false}
        forcedTheme={activeTheme}
      >
        <AppToastProvider>{children}</AppToastProvider>
      </NextThemesProvider>
    </HeroUIProvider>
  );
}
