import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Building2,
  Settings,
  ArrowRight,
  FileText,
  Shield,
  HardDrive,
} from "lucide-react";

import { usePermissions } from "@/hooks/usePermissions";
import { useTeam } from "@/hooks/useTeam";

interface AdminCard {
  label: string;
  description: string;
  icon: React.ElementType;
  path?: string;
  show: boolean;
  summary: string;
  comingSoon?: boolean;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { can } = usePermissions();
  const { members, loading } = useTeam({ enabled: can.manageTeam });

  const activeCount = useMemo(
    () => members.filter((m) => m.isActive).length,
    [members],
  );

  const cards: AdminCard[] = [
    {
      path: "/admin/team",
      label: "Equipo",
      description: "Gestioná los usuarios del sistema",
      icon: Users,
      show: can.manageTeam,
      summary: loading ? "..." : `${activeCount} miembro${activeCount !== 1 ? "s" : ""} activo${activeCount !== 1 ? "s" : ""}`,
    },
    {
      path: "/admin/company",
      label: "Empresa",
      description: "Datos fiscales y de contacto del negocio",
      icon: Building2,
      show: true,
      summary: "Configuración fiscal y contacto",
    },
    {
      path: "/settings",
      label: "Ajustes generales",
      description: "Ventas, inventario, apariencia e integraciones",
      icon: Settings,
      show: true,
      summary: "Reglas del negocio",
    },
    {
      label: "Actividad",
      description: "Registro de acciones del sistema",
      icon: FileText,
      show: can.manageTeam,
      summary: "Próximamente",
      comingSoon: true,
    },
    {
      label: "Permisos",
      description: "Roles y accesos del sistema",
      icon: Shield,
      show: can.manageTeam,
      summary: "Próximamente",
      comingSoon: true,
    },
    {
      label: "Backups",
      description: "Copias de seguridad",
      icon: HardDrive,
      show: can.manageTeam,
      summary: "Próximamente",
      comingSoon: true,
    },
  ];

  return (
    <div className="h-full">
      <div className="mx-auto max-w-2xl space-y-5 px-4 py-4 lg:max-w-3xl lg:px-6">
        <header>
          <p className="section-kicker">Panel de control</p>
          <h1 className="text-xl font-bold text-foreground">
            Administración
          </h1>
          <p className="mt-1 text-xs text-default-400">
            Gestioná tu equipo, empresa y configuración del sistema
          </p>
        </header>

        <div className="grid gap-2">
          {cards
            .filter((c) => c.show)
            .map((card) => (
              <button
                key={card.label}
                type="button"
                disabled={card.comingSoon}
                className={`w-full rounded-2xl border border-default-200 bg-content1 p-4 text-left transition ${
                  card.comingSoon
                    ? "cursor-default opacity-60"
                    : "hover:border-primary/30 hover:bg-content2"
                }`}
                onClick={() => card.path && navigate(card.path)}
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                    <card.icon size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-foreground">
                        {card.label}
                      </p>
                      {card.comingSoon && (
                        <span className="rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-bold text-warning">
                          Próximamente
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-default-500">
                      {card.description}
                    </p>
                    <p className="mt-1 text-[11px] text-default-400">
                      {card.summary}
                    </p>
                  </div>
                  {!card.comingSoon && (
                    <ArrowRight
                      size={16}
                      className="mt-1 shrink-0 text-default-300"
                    />
                  )}
                </div>
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}
