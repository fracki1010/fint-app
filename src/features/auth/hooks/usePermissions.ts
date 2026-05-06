import { useAuth } from "@features/auth/hooks/useAuth";
import { UserRole } from "@features/auth/types";

const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administrador",
  ventas: "Ventas",
  deposito: "Depósito",
  contabilidad: "Contabilidad",
  lectura: "Solo lectura",
};

export function usePermissions() {
  const { user } = useAuth();

  const role: UserRole = user?.role ?? "lectura";
  const isAdmin = role === "admin" || user?.isSuperAdmin === true;
  const isSuperAdmin = user?.isSuperAdmin === true;

  const can = {
    manageTeam: isAdmin,
    manageSettings: isAdmin,
    manageWhatsapp: isAdmin,
    manageAccounting: isAdmin || role === "contabilidad",
    manageClients: isAdmin || role === "ventas" || role === "contabilidad",
    viewFinancial: isAdmin || role === "contabilidad",
    writeSupplies: isAdmin || role === "deposito",
    writePurchases: isAdmin || role === "deposito",
    writeRecipes: isAdmin || role === "deposito",
    writeSales: isAdmin || role === "ventas",
    writeClients: isAdmin || role === "ventas",
    writeProducts: isAdmin || role === "deposito" || role === "ventas",
    writeSuppliers: isAdmin,
    read: true,
  };

  return {
    role,
    roleLabel: ROLE_LABELS[role] ?? role,
    isAdmin,
    isSuperAdmin,
    can,
  };
}
