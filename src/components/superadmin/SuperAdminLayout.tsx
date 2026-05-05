import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  ClipboardList,
  Shield,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useThemeStore } from "@/stores/themeStore";

interface SuperAdminLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { path: "/superadmin", label: "Dashboard", icon: LayoutDashboard },
  { path: "/superadmin/tenants", label: "Tenants", icon: Building2 },
  { path: "/superadmin/audit", label: "Audit Log", icon: ClipboardList },
];

export default function SuperAdminLayout({ children }: SuperAdminLayoutProps) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useThemeStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const isActive = (path: string) => {
    if (path === "/superadmin") {
      return location.pathname === "/superadmin";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Backdrop for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-divider bg-content1 transition-transform duration-200 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-divider px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary">
              <Shield size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">SuperAdmin</p>
              <p className="text-[11px] text-primary">Management Portal</p>
            </div>
          </div>
          <button
            className="flex h-8 w-8 items-center justify-center rounded-lg text-default-400 hover:bg-content2 hover:text-foreground lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navItems.map((item) => {
            const active = isActive(item.path);
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all ${
                  active
                    ? "bg-primary/15 text-primary border border-primary/20"
                    : "text-default-400 hover:bg-content2 hover:text-foreground"
                }`}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-divider px-3 py-4 space-y-1">
          <button
            onClick={() => toggleTheme()}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-default-400 transition-all hover:bg-content2 hover:text-foreground"
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            {theme === "dark" ? "Modo claro" : "Modo oscuro"}
          </button>
          <button
            onClick={() => logout()}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-default-400 transition-all hover:bg-danger/10 hover:text-danger"
          >
            <LogOut size={18} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="min-h-screen flex-1 lg:pl-64">
        {/* Top Bar */}
        <div className="sticky top-0 z-20 border-b border-divider bg-background/80 backdrop-blur-xl px-4 py-3 lg:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                className="flex h-9 w-9 items-center justify-center rounded-xl text-default-400 hover:bg-content2 hover:text-foreground lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu size={20} />
              </button>
              <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-bold text-primary">
                SUPERADMIN MODE
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold text-foreground">{user?.fullName || "Admin"}</p>
                <p className="text-[11px] text-default-400">{user?.email}</p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                {user?.fullName?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "SA"}
              </div>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="p-4 lg:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
