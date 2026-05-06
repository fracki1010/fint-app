import { useEffect, useRef, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useNotifications } from "@features/notifications/hooks/useNotifications";
import { useAuth } from "@features/auth/hooks/useAuth";
import { usePermissions } from "@features/auth/hooks/usePermissions";
import { usePlanFeatures } from "@shared/hooks/usePlanFeatures";
import PlanLimitBanner from "@shared/components/PlanLimitBanner";
import {
  LayoutGrid,
  ClipboardList,
  ReceiptText,
  Users,
  Settings,
  ChartNoAxesCombined,
  LineChart,
  Package,
  ArrowRightLeft,
  ShoppingCart,
  CreditCard,
  ChefHat,
  Bell,
  Truck,
  UserCog,
  LogOut,
  Building2,
  Shield,
  X,
  CheckCheck,
  Sun,
  Moon,
  MoreHorizontal,
} from "lucide-react";
import { useThemeStore } from "@shared/stores/themeStore";
import logo from "@/assets/logo-ambar-5.svg";

export default function MobileLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const mainRef = useRef<HTMLElement | null>(null);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const { user, logout } = useAuth();
  const { can, roleLabel } = usePermissions();
  const { hasFeature } = usePlanFeatures();
  const { theme, toggleTheme } = useThemeStore();
  const [showMoreSheet, setShowMoreSheet] = useState(false);
  const handleSheetNav = (path: string) => {
    navigate(path);
    setShowMoreSheet(false);
  };

  const operationNav = [
    { path: "/", label: "Inicio", icon: LayoutGrid },
    { path: "/sales", label: "Ventas", icon: ReceiptText },
    { path: "/clients", label: "Clientes", icon: Users },
    { path: "/products", label: "Productos", icon: ClipboardList },
    { path: "/supplies", label: "Insumos", icon: Package },
    { path: "/movements", label: "Movimientos", icon: ArrowRightLeft },
    { path: "/purchases", label: "Compras", icon: ShoppingCart },
    { path: "/suppliers", label: "Proveedores", icon: Truck },
    ...(hasFeature("recipes") ? [{ path: "/recipes", label: "Recetas", icon: ChefHat }] : []),
  ];

  const accountingNav = [
    ...(hasFeature("client_account") ? [{ path: "/client-account", label: "Cta. Clientes", icon: CreditCard }] : []),
    ...(hasFeature("supplier_account") ? [{ path: "/supplier-account", label: "Cta. Proveedores", icon: Building2 }] : []),
  ];

  const financialNav = [
    { path: "/financial/dashboard", label: "Panel Financiero", icon: LayoutGrid },
    { path: "/financial/accounting", label: "Contabilidad", icon: ReceiptText },
    { path: "/financial/product-analysis", label: "Análisis Productos", icon: ChartNoAxesCombined },
    { path: "/financial/projections", label: "Proyecciones", icon: LineChart },
    { path: "/financial/purchases", label: "Costos y Compras", icon: ShoppingCart },
  ];

  const adminNav = [
    { path: "/admin", label: "Panel Admin", icon: LayoutGrid },
    ...(can.manageTeam && hasFeature("team_management") ? [{ path: "/admin/team", label: "Equipo", icon: UserCog }] : []),
    { path: "/admin/company", label: "Empresa", icon: Building2 },
    { path: "/settings", label: "Ajustes", icon: Settings },
    ...(user?.isSuperAdmin ? [{ path: "/superadmin", label: "SuperAdmin", icon: Shield }] : []),
  ];

  const mobileBottomTabs = [
    { path: "/", label: "INICIO", icon: LayoutGrid },
    { path: "/products", label: "PRODUCTOS", icon: ClipboardList },
    { path: "/sales", label: "VENTAS", icon: ReceiptText },
    { path: "/clients", label: "CLIENTES", icon: Users },
    { path: null, label: "MÁS", icon: MoreHorizontal },
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

  const isActive = (path: string) =>
    path === "/"
      ? location.pathname === "/"
      : location.pathname === path || location.pathname.startsWith(`${path}/`);

  const userInitials = user?.fullName
    ? user.fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "??";

  return (
    <div className="MobileAppWrapper flex h-screen w-full bg-background font-sans text-foreground lg:grid lg:grid-cols-[256px_minmax(0,1fr)]">

      {/* ── Desktop Sidebar ─────────────────────────────────────────── */}
      <aside className="hidden h-screen overflow-hidden lg:flex lg:flex-col border-r border-white/8 bg-[color:color-mix(in_srgb,var(--heroui-content1)_92%,transparent)] backdrop-blur-xl">

        {/* Brand */}
        <div className="px-5 pt-6 pb-4 border-b border-white/8">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Logo" className="h-14 w-14 rounded-xl object-contain" />
            <div>
              <p className="text-[15px] font-bold tracking-tight text-foreground">Fint Suite</p>
              <p className="text-[11px] text-default-400">Panel Operativo</p>
            </div>
          </div>
        </div>

        {/* Nav sections */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5 scrollbar-sidebar">

          <NavSection label="Operación" items={operationNav} isActive={isActive} navigate={navigate} />
          <NavSection label="Cuentas Corrientes" items={accountingNav} isActive={isActive} navigate={navigate} />

          {can.viewFinancial && hasFeature("financial_center") && (
            <NavSection label="Centro Financiero" items={financialNav} isActive={isActive} navigate={navigate} />
          )}

          <NavSection label="Administración" items={adminNav} isActive={isActive} navigate={navigate} />
        </nav>

        {/* User footer */}
        <div className="border-t border-white/8 px-4 py-4">
          {/* Notifications + theme toggle row */}
          <div className="mb-3 flex items-center gap-2">
            <button
              className="flex flex-1 items-center gap-3 rounded-xl px-3 py-2 text-default-400 hover:bg-white/5 hover:text-foreground transition"
              type="button"
              onClick={() => setShowNotifications(true)}
            >
              <div className="relative">
                <Bell size={15} />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-danger text-[8px] font-bold text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </div>
              <span className="flex-1 text-left text-xs font-semibold">Notificaciones</span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-danger/15 px-2 py-0.5 text-[10px] font-bold text-danger">
                  {unreadCount}
                </span>
              )}
            </button>
            <button
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/8 text-default-400 hover:bg-white/5 hover:text-foreground transition"
              title={theme === "dark" ? "Cambiar a claro" : "Cambiar a oscuro"}
              type="button"
              onClick={toggleTheme}
            >
              {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
            </button>
          </div>

          {/* User info */}
          <div className="flex items-center gap-3 rounded-xl bg-white/4 border border-white/8 px-3 py-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/20 text-xs font-bold text-primary">
              {userInitials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-foreground">{user?.fullName || "Usuario"}</p>
              <p className="truncate text-[10px] text-default-400">{roleLabel}</p>
            </div>
            <button
              className="shrink-0 rounded-lg p-1.5 text-default-400 hover:bg-white/8 hover:text-danger transition"
              title="Cerrar sesión"
              type="button"
              onClick={() => logout()}
            >
              <LogOut size={13} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────────── */}
      <main ref={mainRef} className="flex-1 overflow-y-auto pb-28 lg:pb-0">
        {/* Mobile header with logo */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2 lg:hidden">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
              <img src={logo} alt="Logo" className="h-9 w-9 rounded-xl object-contain" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Fint Suite</p>
              <p className="text-[10px] text-default-400">Panel Operativo</p>
            </div>
          </div>
        </div>
        <div className="px-4 pt-2 lg:px-6 lg:pt-4">
          <PlanLimitBanner />
        </div>
        <Outlet />
      </main>

      {/* ── Notifications slide-over ─────────────────────────────────── */}
      <div
        className={`fixed inset-0 z-[60] transition-all duration-300 ${showNotifications ? "bg-black/30 backdrop-blur-[2px]" : "pointer-events-none opacity-0"}`}
        onClick={() => setShowNotifications(false)}
      />
      <div
        className={`fixed left-0 top-0 z-[70] h-screen w-full max-w-xl overflow-y-auto border-r border-white/10 bg-content1 shadow-[24px_0_60px_rgba(40,25,15,0.28)] transition-transform duration-300 ease-in-out scrollbar-sidebar ${showNotifications ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Header */}
        <div className="page-header flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="section-kicker">Sistema</p>
            <h2 className="page-title">Notificaciones</h2>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {unreadCount > 0 && (
              <button
                className="flex items-center gap-1.5 rounded-xl bg-primary/10 px-3 py-2 text-xs font-semibold text-primary transition hover:bg-primary/20"
                onClick={() => void markAllAsRead()}
              >
                <CheckCheck size={13} />
                Marcar todas
              </button>
            )}
            <button
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-default-400 transition hover:text-foreground"
              onClick={() => setShowNotifications(false)}
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="space-y-2 px-4 pb-8">
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <button
                key={notification._id}
                className={`list-row w-full ${!notification.isRead ? "border-primary/20 bg-primary/5" : ""}`}
                onClick={() => void markAsRead(notification._id)}
              >
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${!notification.isRead ? "bg-primary/12 text-primary" : "bg-content2/70 text-default-400"}`}>
                  <Bell size={15} />
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <p className="text-sm font-semibold text-foreground">{notification.title}</p>
                  <p className="mt-0.5 text-xs text-default-500 line-clamp-2">{notification.message}</p>
                  <p className="mt-1 text-[10px] text-default-400">{new Date(notification.createdAt).toLocaleString()}</p>
                </div>
                {!notification.isRead && (
                  <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
                )}
              </button>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-content2/60 text-default-400">
                <Bell size={24} />
              </div>
              <p className="mt-4 text-sm font-semibold text-foreground">Todo en orden</p>
              <p className="mt-1 text-xs text-default-400">No hay notificaciones por ahora.</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Mobile More Sheet ────────────────────────────────────────── */}
      <div
        className={`fixed inset-0 z-[60] transition-all duration-300 ${showMoreSheet ? "bg-black/30 backdrop-blur-[2px]" : "pointer-events-none opacity-0"}`}
        onClick={() => setShowMoreSheet(false)}
      />
      <div
        className={`fixed bottom-0 z-[70] w-full max-h-[85vh] overflow-y-auto rounded-t-3xl border-t border-white/10 bg-content1 transition-transform duration-300 ease-out scrollbar-sidebar ${showMoreSheet ? "translate-y-0" : "translate-y-full"}`}
        style={{ boxShadow: "0 -24px 60px rgba(40,25,15,0.28)" }}
      >
        <div className="sticky top-0 z-10 flex items-center justify-center pt-3 pb-1 bg-inherit">
          <div className="h-1 w-8 rounded-full bg-white/20" />
        </div>

        <div className="flex items-center justify-between px-5 py-2">
          <h3 className="text-base font-bold text-foreground">Menú</h3>
          <button
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-default-400 transition hover:text-foreground"
            onClick={() => setShowMoreSheet(false)}
          >
            <X size={15} />
          </button>
        </div>

        <div className="px-3 pb-8 space-y-5">
          <NavSection
            label="Operación"
            items={operationNav.filter(n => !["/", "/products", "/sales", "/clients"].includes(n.path))}
            isActive={isActive}
            navigate={handleSheetNav}
          />
          <NavSection
            label="Cuentas Corrientes"
            items={accountingNav}
            isActive={isActive}
            navigate={handleSheetNav}
          />
          {can.viewFinancial && hasFeature("financial_center") && (
            <NavSection
              label="Centro Financiero"
              items={financialNav}
              isActive={isActive}
              navigate={handleSheetNav}
            />
          )}
          <NavSection
            label="Administración"
            items={adminNav}
            isActive={isActive}
            navigate={handleSheetNav}
          />
        </div>
      </div>

      {/* ── Mobile bottom bar ────────────────────────────────────────── */}
      {!hideBottomBar && (
        <nav className="fixed bottom-0 w-full border-t border-white/10 bg-[color:color-mix(in_srgb,var(--heroui-content1)_88%,transparent)] backdrop-blur-xl flex justify-around items-center pt-3 pb-6 px-2 z-50 shadow-[0_-18px_40px_rgba(20,12,8,0.20)] lg:hidden">
          {mobileBottomTabs.map((tab) => {
            const active = tab.path ? isActive(tab.path) : showMoreSheet;
            const Icon = tab.icon;

            return (
              <button
                key={tab.path || "more"}
                className={`flex flex-col items-center justify-center gap-1 w-16 rounded-2xl py-1.5 transition-all ${
                  active ? "text-primary scale-105" : "text-default-400 hover:text-default-600"
                }`}
                onClick={() => (tab.path ? navigate(tab.path) : setShowMoreSheet(true))}
              >
                <div className="relative">
                  <Icon
                    className={active ? "fill-primary/15 bg-primary/12 rounded-xl p-1 shadow-[0_8px_20px_rgba(217,119,6,0.18)]" : ""}
                    size={24}
                    strokeWidth={active ? 2.5 : 2}
                  />
                  {tab.path === "/" && unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[9px] font-bold text-white">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] font-bold tracking-tight ${active ? "opacity-100" : "opacity-70"}`}>
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

// ── NavSection ──────────────────────────────────────────────────────────

function NavSection({
  label,
  items,
  isActive,
  navigate,
}: {
  label: string;
  items: { path: string; label: string; icon: React.ElementType }[];
  isActive: (path: string) => boolean;
  navigate: (path: string) => void;
}) {
  if (items.length === 0) return null;

  return (
    <div>
      <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-default-400">
        {label}
      </p>
      <div className="space-y-0.5">
        {items.map((item) => {
          const active = isActive(item.path);
          const Icon = item.icon;

          return (
            <button
              key={item.path}
              className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-semibold transition-all ${
                active
                  ? "bg-primary/12 text-primary border border-primary/20 shadow-sm shadow-primary/10"
                  : "text-default-500 hover:bg-white/5 hover:text-foreground border border-transparent"
              }`}
              onClick={() => navigate(item.path)}
              type="button"
            >
              <Icon
                size={15}
                strokeWidth={active ? 2.5 : 2}
                className={active ? "text-primary" : "text-default-400 group-hover:text-default-600 transition"}
              />
              <span>{item.label}</span>
              {active && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
