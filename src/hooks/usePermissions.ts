import { useAuth, UserRole } from "@/hooks/useAuth";

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
    // Full control
    manageTeam: isAdmin,
    manageSettings: isAdmin,
    manageWhatsapp: isAdmin,

    // Financial center
    viewFinancial: isAdmin || role === "contabilidad",

    // Writes per area
    writeSupplies: isAdmin || role === "deposito",
    writePurchases: isAdmin || role === "deposito",
    writeRecipes: isAdmin || role === "deposito",
    writeSales: isAdmin || role === "ventas",
    writeClients: isAdmin || role === "ventas",
    writeProducts: isAdmin || role === "deposito" || role === "ventas",
    writeSuppliers: isAdmin,

    // Everyone can read everything
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
