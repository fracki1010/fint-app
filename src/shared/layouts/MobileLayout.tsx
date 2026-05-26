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
  Landmark,
  Shield,
  DollarSign,
  Wallet,
  X,
  CheckCheck,
  Sun,
  Moon,
  Lock,
} from "lucide-react";
import { useThemeStore } from "@shared/stores/themeStore";
import logo from "@/assets/logo-ambar-7.svg";

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
  const [showDrawer, setShowDrawer] = useState(false);
  const handleDrawerNav = (path: string) => {
    navigate(path);
    setShowDrawer(false);
  };

  const operationNav = [
    { path: "/", label: "Inicio", icon: LayoutGrid },
  ];

  // ── Accordion groups for mobile drawer ──
  const comprasNav = [
    { path: "/purchases", label: "Órdenes de Compra", icon: ShoppingCart },
    { path: "/suppliers", label: "Proveedores", icon: Truck },
    ...(hasFeature("supplier_account") ? [{ path: "/supplier-account", label: "Cta. Proveedores", icon: Building2 }] : []),
    ...(hasFeature("supplier_account") ? [{ path: "/supplier-payments", label: "Órdenes de Pago", icon: DollarSign }] : []),
  ];

  const ventasNav = [
    { path: "/sales", label: "General", icon: ReceiptText },
    { path: "/clients", label: "Clientes", icon: Users },
    ...(hasFeature("client_account") ? [{ path: "/client-account", label: "Cta. Clientes", icon: CreditCard }] : []),
  ];

  const stockNav = [
    { path: "/products", label: "Artículos", icon: ClipboardList },
    { path: "/inventory", label: "Inventario", icon: Package },
    { path: "/movements", label: "Movimientos", icon: ArrowRightLeft },
    ...(hasFeature("bill_of_materials") ? [{ path: "/recipes", label: "Lista de Materiales", icon: ChefHat }] : []),
  ];

  const tesoreriaNav = [
    ...(hasFeature("financial_center") ? [{ path: "/financial/treasury", label: "Tesorería", icon: DollarSign }] : []),
    ...(hasFeature("financial_center") ? [{ path: "/banking", label: "Cuentas", icon: Landmark }] : []),
    ...(hasFeature("financial_center") ? [{ path: "/financial/cash-movements", label: "Mov. de Caja", icon: Wallet }] : []),
    ...(hasFeature("financial_center") ? [{ path: "/cash-closing", label: "Cierre de Caja", icon: Lock }] : []),
  ];

  const fullFinancialNav = [
    { path: "/financial/dashboard", label: "Panel Financiero", icon: LayoutGrid },
    { path: "/financial/accounting", label: "Contabilidad", icon: ReceiptText },
    { path: "/financial/product-analysis", label: "Análisis Productos", icon: ChartNoAxesCombined },
    { path: "/financial/cost-centers", label: "Centros de Costo", icon: Building2 },
    { path: "/financial/purchases", label: "Costos y Compras", icon: ShoppingCart },
  ];

  const adminNav = [
    ...(can.manageTeam && hasFeature("team_management") ? [{ path: "/admin/team", label: "Equipo", icon: UserCog }] : []),
    { path: "/admin/company", label: "Empresa", icon: Building2 },
    { path: "/settings", label: "Ajustes", icon: Settings },
    ...(user?.isSuperAdmin ? [{ path: "/superadmin", label: "SuperAdmin", icon: Shield }] : []),
  ];

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
          <div className="flex items-center">
            <div className="h-[84px] w-[84px] overflow-hidden rounded-xl">
              <img src={logo} alt="Logo" className="h-[110px] w-[110px] -m-[13px] object-cover" />
            </div>
            <div className="-ml-3">
              <p className="text-[15px] font-bold leading-none tracking-tight text-foreground">Fint Suite</p>
              <p className="text-[11px] leading-none text-default-400">Panel Operativo</p>
            </div>
          </div>
        </div>

        {/* Nav sections */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-sidebar">

          <NavSection label="Operación" items={operationNav} isActive={isActive} navigate={navigate} />
          <NavSection label="Compras" items={comprasNav} isActive={isActive} navigate={navigate} accordion defaultOpen={false} icon={ShoppingCart} />
          <NavSection label="Ventas" items={ventasNav} isActive={isActive} navigate={navigate} accordion defaultOpen={false} icon={ReceiptText} />
          <NavSection label="Stock" items={stockNav} isActive={isActive} navigate={navigate} accordion defaultOpen={false} icon={Package} />
          {tesoreriaNav.length > 0 && (
            <NavSection label="Tesorería" items={tesoreriaNav} isActive={isActive} navigate={navigate} accordion defaultOpen={false} icon={DollarSign} />
          )}
          {can.viewFinancial && hasFeature("financial_center") && hasFeature("team_management") && (
            <NavSection label="Centro Financiero" items={fullFinancialNav} isActive={isActive} navigate={navigate} accordion defaultOpen={false} />
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
      <main ref={mainRef} className="flex-1 overflow-y-auto pb-20 lg:pb-0">
        {/* Mobile top bar — solo el logo centrado */}
        <div className="sticky top-0 z-30 flex items-center justify-center border-b border-divider/10 bg-background/80 backdrop-blur-xl px-4 py-2.5 lg:hidden">
          <div className="flex h-8 w-8 overflow-hidden rounded-lg">
            <img src={logo} alt="Fint" className="h-[42px] w-[42px] -m-[5px] object-cover" />
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

      {/* ── Mobile Drawer (hamburger menu) ──────────────────────────── */}
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[60] transition-all duration-300 lg:hidden ${showDrawer ? "bg-black/40 backdrop-blur-sm" : "pointer-events-none opacity-0"}`}
        onClick={() => setShowDrawer(false)}
      />

      {/* Drawer panel — offset: ocupa ~80%, deja ver contenido atrás */}
      <div
        className={`fixed left-0 top-0 z-[70] h-screen w-[80vw] max-w-sm border-r border-white/8 bg-[color:color-mix(in_srgb,var(--heroui-content1)_96%,transparent)] backdrop-blur-2xl shadow-[24px_0_60px_rgba(0,0,0,0.35)] transition-transform duration-300 ease-out lg:hidden ${
          showDrawer ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Drawer header with logo */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-white/8">
          <div className="flex items-center gap-3">
            <div className="h-[42px] w-[42px] overflow-hidden rounded-xl">
              <img src={logo} alt="Logo" className="h-[56px] w-[56px] -m-[7px] object-cover" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Fint Suite</p>
              <p className="text-[10px] text-default-400">Panel Operativo</p>
            </div>
          </div>
          <button
            className="flex h-7 w-7 items-center justify-center rounded-lg text-default-400 hover:bg-white/5 hover:text-foreground transition"
            onClick={() => setShowDrawer(false)}
          >
            <X size={15} />
          </button>
        </div>

        {/* Nav sections */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5 scrollbar-sidebar" style={{ height: "calc(100vh - 72px)" }}>
          <NavSection label="Inicio" items={operationNav} isActive={isActive} navigate={handleDrawerNav} />
          <NavSection label="Compras" items={comprasNav} isActive={isActive} navigate={handleDrawerNav} accordion defaultOpen={false} icon={ShoppingCart} />
          <NavSection label="Ventas" items={ventasNav} isActive={isActive} navigate={handleDrawerNav} accordion defaultOpen={false} icon={ReceiptText} />
          <NavSection label="Stock" items={stockNav} isActive={isActive} navigate={handleDrawerNav} accordion defaultOpen={false} icon={Package} />
          {tesoreriaNav.length > 0 && (
            <NavSection label="Tesorería" items={tesoreriaNav} isActive={isActive} navigate={handleDrawerNav} accordion defaultOpen={false} icon={DollarSign} />
          )}
          {can.viewFinancial && hasFeature("financial_center") && hasFeature("team_management") && (
            <NavSection label="Centro Financiero" items={fullFinancialNav} isActive={isActive} navigate={handleDrawerNav} accordion defaultOpen={false} />
          )}
          <NavSection label="Administración" items={adminNav} isActive={isActive} navigate={handleDrawerNav} />
        </nav>
      </div>


    </div>
  );
}

// ── NavSection ──────────────────────────────────────────────────────────

function NavSection({
  label,
  items,
  isActive,
  navigate,
  accordion = false,
  defaultOpen = false,
  icon: SectionIcon,
}: {
  label: string;
  items: { path: string; label: string; icon: React.ElementType }[];
  isActive: (path: string) => boolean;
  navigate: (path: string) => void;
  accordion?: boolean;
  defaultOpen?: boolean;
  icon?: React.ElementType;
}) {
  const [open, setOpen] = useState(accordion ? defaultOpen : true);
  if (items.length === 0) return null;

  const hasActive = items.some((item) => isActive(item.path));

  if (!accordion) {
    return (
      <div>
        <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-default-400">
          {label}
        </p>
        <div className="space-y-0">
          {items.map((item) => (
            <NavItem key={item.path} item={item} isActive={isActive} navigate={navigate} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Accordion header — with fixed icon (no chevron) */}
      <button
        className={`group flex w-full items-center gap-3 rounded-lg px-3 py-[6px] text-left text-[13px] font-semibold transition-all ${
          hasActive || open
            ? "bg-primary/10 text-primary"
            : "text-default-500 hover:bg-white/5 hover:text-foreground"
        }`}
        onClick={() => setOpen(!open)}
        type="button"
      >
        {SectionIcon && (
          <SectionIcon
            size={15}
            strokeWidth={hasActive || open ? 2.5 : 2}
            className={`shrink-0 ${hasActive || open ? "text-primary" : "text-default-400"}`}
          />
        )}
        <span className="flex-1">{label}</span>
        {!open && items.length > 0 && (
          <span className="rounded-full bg-content2/80 px-2 py-0.5 text-[10px] font-bold text-default-500">
            {items.length}
          </span>
        )}
      </button>

      {/* Sub-items */}
      {open && (
        <div className="ml-2 space-y-0 border-l-2 border-primary/20 pl-3">
          {items.map((item) => {
            const active = isActive(item.path);
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                className={`group flex w-full items-center gap-3 px-3 py-[6px] text-left text-[13px] font-semibold transition-all ${
                  active
                    ? "text-primary border-l-2 border-primary -ml-[14px] pl-3"
                    : "text-default-500 hover:text-foreground"
                }`}
                onClick={() => navigate(item.path)}
                type="button"
              >
                <Icon
                  size={15}
                  strokeWidth={active ? 2.5 : 2}
                  className={`shrink-0 ${active ? "text-primary" : "text-default-400 group-hover:text-default-600 transition"}`}
                />
                <span>{item.label}</span>
                {active && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function NavItem({
  item,
  isActive,
  navigate,
}: {
  item: { path: string; label: string; icon: React.ElementType };
  isActive: (path: string) => boolean;
  navigate: (path: string) => void;
}) {
  const active = isActive(item.path);
  const Icon = item.icon;

  return (
    <button
      className={`group flex w-full items-center gap-3 px-3 py-[6px] text-left text-[13px] font-semibold transition-all ${
        active
          ? "text-primary"
          : "text-default-500 hover:text-foreground"
      }`}
      onClick={() => navigate(item.path)}
      type="button"
    >
      <Icon
        size={15}
        strokeWidth={active ? 2.5 : 2}
        className={`shrink-0 ${active ? "text-primary" : "text-default-400 group-hover:text-default-600 transition"}`}
      />
      <span>{item.label}</span>
      {active && (
        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
      )}
    </button>
  );
}
