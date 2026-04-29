import { useMemo } from "react";

import { useAuth } from "@/hooks/useAuth";

type AppPermissions = {
  canManageSupplies: boolean;
  canManagePurchases: boolean;
  canManageSupplierAccount: boolean;
};

export function usePermissions(): AppPermissions {
  const { user } = useAuth();

  return useMemo(() => {
    const isActiveUser = Boolean(user?.isActive);

    if (!isActiveUser || !user) {
      return {
        canManageSupplies: false,
        canManagePurchases: false,
        canManageSupplierAccount: false,
      };
    }

    const normalizedRoles = new Set(
      [user.role, ...(user.roles || [])]
        .filter(Boolean)
        .map((value) => String(value).toLowerCase()),
    );
    const normalizedPermissions = new Set(
      (user.permissions || []).map((value) => String(value).toLowerCase()),
    );

    const hasRole = (...roles: string[]) =>
      roles.some((role) => normalizedRoles.has(role.toLowerCase()));
    const hasPermission = (...permissions: string[]) =>
      permissions.some((permission) =>
        normalizedPermissions.has(permission.toLowerCase()),
      );

    // Roles globales con acceso total.
    if (hasRole("superadmin", "owner")) {
      return {
        canManageSupplies: true,
        canManagePurchases: true,
        canManageSupplierAccount: true,
      };
    }

    // Roles operativos por dominio.
    const byRole = {
      canManageSupplies: hasRole("admin", "inventory_manager"),
      canManagePurchases: hasRole("admin", "purchasing_manager"),
      canManageSupplierAccount: hasRole("admin", "accounting_manager"),
    };

    // Permisos granulares por dominio.
    const byPermission = {
      canManageSupplies: hasPermission(
        "supplies:*",
        "supplies:manage",
        "supplies:update",
      ),
      canManagePurchases: hasPermission(
        "purchases:*",
        "purchases:manage",
        "purchases:update",
      ),
      canManageSupplierAccount: hasPermission(
        "supplier-account:*",
        "supplier-account:manage",
        "supplier-account:update",
      ),
    };

    // Compatibilidad: si backend no envía roles/permisos aún, mantener operación.
    const hasAuthorizationMetadata =
      normalizedRoles.size > 0 || normalizedPermissions.size > 0;

    if (!hasAuthorizationMetadata) {
      return {
        canManageSupplies: true,
        canManagePurchases: true,
        canManageSupplierAccount: true,
      };
    }

    return {
      canManageSupplies: byRole.canManageSupplies || byPermission.canManageSupplies,
      canManagePurchases: byRole.canManagePurchases || byPermission.canManagePurchases,
      canManageSupplierAccount:
        byRole.canManageSupplierAccount || byPermission.canManageSupplierAccount,
    };
  }, [user]);
}
