import type { NextFunction, Request, Response } from "express";

import type { AppPermission, AppRole, AuthUser } from "../types/auth";

function normalizeValues(values: Array<string | undefined> = []) {
  return new Set(
    values.filter(Boolean).map((value) => String(value).toLowerCase()),
  );
}

function userHasRole(user: AuthUser, ...roles: string[]) {
  const roleSet = normalizeValues([user.role, ...(user.roles || [])]);

  return roles.some((role) => roleSet.has(role.toLowerCase()));
}

function userHasPermission(user: AuthUser, ...permissions: string[]) {
  const permissionSet = normalizeValues(user.permissions || []);

  return permissions.some((permission) =>
    permissionSet.has(permission.toLowerCase()),
  );
}

export function authorizeAny(options: {
  roles?: AppRole[];
  permissions?: AppPermission[];
}) {
  const requiredRoles = options.roles || [];
  const requiredPermissions = options.permissions || [];

  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.authUser;

    if (!user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "User inactive" });
    }

    if (userHasRole(user, "owner", "superadmin")) {
      return next();
    }

    const roleMatch =
      requiredRoles.length > 0 && userHasRole(user, ...requiredRoles);
    const permissionMatch =
      requiredPermissions.length > 0 &&
      userHasPermission(user, ...requiredPermissions);

    if (!roleMatch && !permissionMatch) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }

    return next();
  };
}
