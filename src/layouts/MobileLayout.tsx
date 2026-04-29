import { useEffect, useRef } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutGrid,
  ClipboardList,
  ReceiptText,
  Users,
  Settings,
  ChartNoAxesCombined,
  FileSpreadsheet,
  LineChart,
} from "lucide-react";

export default function MobileLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const mainRef = useRef<HTMLElement | null>(null);

  const tabs = [
    { path: "/", label: "INICIO", icon: LayoutGrid },
    { path: "/products", label: "PRODUCTOS", icon: ClipboardList },
    { path: "/sales", label: "VENTAS", icon: ReceiptText },
    { path: "/clients", label: "CLIENTES", icon: Users },
    { path: "/settings", label: "AJUSTES", icon: Settings },
  ];
  const desktopMainNav = tabs;
  const desktopFinancialNav = [
    {
      path: "/financial/dashboard",
      label: "PANEL FINANCIERO",
      icon: LayoutGrid,
    },
    {
      path: "/financial/accounting",
      label: "CONTABILIDAD",
      icon: FileSpreadsheet,
    },
    {
      path: "/financial/product-analysis",
      label: "ANALISIS PRODUCTOS",
      icon: ChartNoAxesCombined,
    },
    {
      path: "/financial/projections",
      label: "PROYECCIONES",
      icon: LineChart,
    },
  ];

  const hideBottomBar =
    ["/new-operation"].includes(location.pathname) ||
    location.pathname.startsWith("/financial");

  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, behavior: "auto" });
    }
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [location.pathname]);

  return (
    <div className="MobileAppWrapper flex h-screen w-full bg-background font-sans text-foreground lg:grid lg:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="hidden border-r border-white/10 bg-[color:color-mix(in_srgb,var(--heroui-content1)_90%,transparent)] p-5 lg:block">
        <div>
          <p className="text-sm font-semibold text-foreground">Fint Suite</p>
          <p className="text-xs text-default-500">Panel Operativo</p>
        </div>
        <div className="mt-6">
          <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-default-400">
            Operacion
          </p>
          <nav className="mt-2 space-y-2">
            {desktopMainNav.map((tab) => {
              const Icon = tab.icon;
              const isActive =
                tab.path === "/"
                  ? location.pathname === "/"
                  : location.pathname === tab.path ||
                    location.pathname.startsWith(`${tab.path}/`);

              return (
                <button
                  key={tab.path}
                  className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left text-sm font-semibold transition ${
                    isActive
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-transparent text-default-500 hover:border-white/10 hover:text-foreground"
                  }`}
                  onClick={() => navigate(tab.path)}
                  type="button"
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="mt-6">
          <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-default-400">
            Centro Financiero
          </p>
          <nav className="mt-2 space-y-2">
            {desktopFinancialNav.map((tab) => {
              const Icon = tab.icon;
              const isActive =
                location.pathname === tab.path ||
                location.pathname.startsWith(`${tab.path}/`);

              return (
                <button
                  key={tab.path}
                  className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left text-sm font-semibold transition ${
                    isActive
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-transparent text-default-500 hover:border-white/10 hover:text-foreground"
                  }`}
                  onClick={() => navigate(tab.path)}
                  type="button"
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      <main ref={mainRef} className="flex-1 overflow-y-auto pb-20 lg:pb-0">
        <Outlet />
      </main>

      {!hideBottomBar && (
        <nav className="fixed bottom-0 w-full border-t border-white/10 bg-[color:color-mix(in_srgb,var(--heroui-content1)_88%,transparent)] backdrop-blur-xl flex justify-around items-center pt-3 pb-6 px-2 z-50 shadow-[0_-18px_40px_rgba(5,18,15,0.16)] lg:hidden">
          {tabs.map((tab) => {
            const isActive =
              tab.path === "/"
                ? location.pathname === "/"
                : location.pathname === tab.path ||
                  location.pathname.startsWith(`${tab.path}/`);
            const Icon = tab.icon;

            return (
              <button
                key={tab.path}
                className={`flex flex-col items-center justify-center gap-1 w-16 rounded-2xl py-1.5 transition-all ${
                  isActive
                    ? "text-primary scale-105"
                    : "text-default-400 hover:text-default-600"
                }`}
                onClick={() => navigate(tab.path)}
              >
                <Icon
                  className={
                    isActive
                      ? "fill-primary/15 bg-primary/12 rounded-xl p-1 shadow-[0_8px_20px_rgba(88,176,156,0.18)]"
                      : ""
                  }
                  size={24}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span
                  className={`text-[10px] font-bold tracking-tight ${isActive ? "opacity-100" : "opacity-70"}`}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
}
