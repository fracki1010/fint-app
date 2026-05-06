import { Button } from "@heroui/button";
import type { Setting } from "@features/settings/hooks/useSettings";
import { useThemeStore } from "@shared/stores/themeStore";

interface AppearanceSectionProps {
  formData: Partial<Setting>;
  handleInputChange: (field: keyof Setting, value: unknown) => void;
}

export default function AppearanceSection({
  formData,
  handleInputChange,
}: AppearanceSectionProps) {
  const setTheme = useThemeStore((s) => s.setTheme);
  const currentTheme = (formData.theme as "light" | "dark") || "dark";

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-default-200/70 bg-content1/60 p-4">
        <p className="text-sm font-semibold text-foreground">
          Tema de la app
        </p>
        <p className="mt-1 text-xs text-default-500">
          Elige como quieres ver toda la interfaz.
        </p>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button
            className="justify-start"
            color="primary"
            variant={currentTheme === "light" ? "solid" : "flat"}
            onClick={() => {
              handleInputChange("theme", "light");
              setTheme("light");
            }}
          >
            Claro
          </Button>
          <Button
            className="justify-start"
            color="primary"
            variant={currentTheme === "dark" ? "solid" : "flat"}
            onClick={() => {
              handleInputChange("theme", "dark");
              setTheme("dark");
            }}
          >
            Oscuro
          </Button>
        </div>
      </div>
    </div>
  );
}
