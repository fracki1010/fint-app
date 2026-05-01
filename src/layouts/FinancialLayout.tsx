import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  ChartNoAxesCombined,
  Cog,
  FileSpreadsheet,
  LayoutGrid,
  LineChart,
  Settings as SettingsIcon,
  ShoppingCart,
} from "lucide-react";

const financialNav = [
  {
    path: "/financial/dashboard",
    label: "Panel",
    mobileLabel: "PANEL",
    icon: LayoutGrid,
  },
  {
    path: "/financial/accounting",
    label: "Contabilidad",
    mobileLabel: "CONTA",
    icon: FileSpreadsheet,
  },
  {
    path: "/financial/product-analysis",
    label: "Analisis",
    mobileLabel: "ANALISIS",
    icon: ChartNoAxesCombined,
  },
  {
    path: "/financial/projections",
    label: "Proyecciones",
    mobileLabel: "PROYEC",
    icon: LineChart,
  },
  {
    path: "/financial/purchases",
    label: "Compras",
    mobileLabel: "COMPRAS",
    icon: ShoppingCart,
  },
  {
    path: "/settings",
    label: "Ajustes",
    mobileLabel: "AJUSTES",
    icon: SettingsIcon,
  },
];

export default function FinancialLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="h-full overflow-x-hidden overflow-y-auto bg-background text-foreground">
        <header className="financial-header lg:hidden">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-primary">
                Centro Financiero
              </p>
            </div>
            <div className="flex items-center gap-3 text-default-500">
              <button
                aria-label="notificaciones"
                className="financial-icon-btn"
                type="button"
              >
                <Bell className="financial-icon" />
              </button>
              <button
                aria-label="ajustes"
                className="financial-icon-btn"
                type="button"
              >
                <Cog className="financial-icon" />
              </button>
            </div>
          </div>
        </header>

        <main className="p-4 pb-28 md:p-6 md:pb-28 lg:p-8 lg:pb-8">
          <Outlet />
        </main>

        <nav className="fixed bottom-0 w-full border-t border-white/10 bg-[color:color-mix(in_srgb,var(--heroui-content1)_88%,transparent)] backdrop-blur-xl flex justify-around items-center pt-3 pb-6 px-2 z-50 shadow-[0_-18px_40px_rgba(5,18,15,0.16)] lg:hidden">
          {financialNav.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);

            return (
              <button
                key={item.path}
                className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-2xl py-1.5 transition-all ${
                  isActive
                    ? "text-primary scale-105"
                    : "text-default-400 hover:text-default-600"
                }`}
                onClick={() => navigate(item.path)}
                type="button"
              >
                <Icon
                  className={
                    isActive
                      ? "fill-primary/15 bg-primary/12 rounded-xl p-1 shadow-[0_8px_20px_rgba(88,176,156,0.18)]"
                      : ""
                  }
                  size={24}
                  strokeWidth={2.15}
                />
                <span
                  className={`max-w-full truncate px-1 text-[9px] font-bold tracking-tight ${isActive ? "opacity-100" : "opacity-70"}`}
                >
                  {item.mobileLabel}
                </span>
              </button>
            );
          })}
        </nav>
    </div>
  );
}
