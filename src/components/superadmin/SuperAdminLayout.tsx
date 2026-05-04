import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  ClipboardList,
  Shield,
  ArrowLeft,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

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
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const isActive = (path: string) => {
    if (path === "/superadmin") {
      return location.pathname === "/superadmin";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-white/10 bg-[#1a2332]">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400">
            <Shield size={20} />
          </div>
          <div>
            <p className="text-sm font-bold text-white">SuperAdmin</p>
            <p className="text-[11px] text-blue-400">Management Portal</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const active = isActive(item.path);
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all ${
                  active
                    ? "bg-blue-500/15 text-blue-400 border border-blue-500/20"
                    : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
                }`}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Back to App */}
        <div className="border-t border-white/10 px-3 py-4">
          <button
            onClick={() => navigate("/")}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-400 transition-all hover:bg-white/5 hover:text-gray-200"
          >
            <ArrowLeft size={18} />
            Volver a la App
          </button>
          <button
            onClick={() => logout()}
            className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-400 transition-all hover:bg-red-500/10 hover:text-red-400"
          >
            <LogOut size={18} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 pl-64">
        {/* Top Bar */}
        <div className="sticky top-0 z-30 border-b border-white/10 bg-background/80 backdrop-blur-xl px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-blue-500/15 px-3 py-1 text-xs font-bold text-blue-400">
                SUPERADMIN MODE
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-semibold text-white">{user?.fullName || "Admin"}</p>
                <p className="text-[11px] text-gray-400">{user?.email}</p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500/20 text-xs font-bold text-blue-400">
                {user?.fullName?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "SA"}
              </div>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
