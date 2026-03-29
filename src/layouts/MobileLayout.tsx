import { useEffect, useRef } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutGrid,
  ClipboardList,
  ReceiptText,
  Users,
  Settings,
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

  const hideBottomBar = ["/new-operation"].includes(location.pathname);

  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, behavior: "auto" });
    }
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [location.pathname]);

  return (
    <div className="flex flex-col h-screen w-full bg-background text-foreground font-sans MobileAppWrapper">
      <main ref={mainRef} className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>

      {!hideBottomBar && (
        <nav className="fixed bottom-0 w-full border-t border-white/10 bg-[color:color-mix(in_srgb,var(--heroui-content1)_88%,transparent)] backdrop-blur-xl flex justify-around items-center pt-3 pb-6 px-2 z-50 shadow-[0_-18px_40px_rgba(5,18,15,0.16)]">
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
