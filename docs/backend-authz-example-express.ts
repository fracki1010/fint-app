/**
 * Ejemplo de autenticación + autorización por roles/permisos (Express + JWT)
 *
 * Este archivo es de referencia para implementar en el backend.
 */

import type { NextFunction, Request, Response } from "express";
import express from "express";
import jwt from "jsonwebtoken";

const app = express();
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || "change-me";

type AppRole =
  | "owner"
  | "superadmin"
  | "admin"
  | "inventory_manager"
  | "purchasing_manager"
  | "accounting_manager";

type AppPermission =
  | "supplies:*"
  | "supplies:manage"
  | "supplies:update"
  | "supplies:read"
  | "purchases:*"
  | "purchases:manage"
  | "purchases:update"
  | "purchases:read"
  | "supplier-account:*"
  | "supplier-account:manage"
  | "supplier-account:update"
  | "supplier-account:read";

type TokenUser = {
  _id: string;
  fullName: string;
  email: string;
  isActive: boolean;
  role?: string;
  roles?: string[];
  permissions?: string[];
};

type AuthRequest = Request & {
  authUser?: TokenUser;
};

function normalizeValues(values: Array<string | undefined> = []) {
  return new Set(
    values.filter(Boolean).map((value) => String(value).toLowerCase()),
  );
}

function userHasRole(user: TokenUser, ...roles: string[]) {
  const roleSet = normalizeValues([user.role, ...(user.roles || [])]);

  return roles.some((role) => roleSet.has(role.toLowerCase()));
}

function userHasPermission(user: TokenUser, ...permissions: string[]) {
  const permissionSet = normalizeValues(user.permissions || []);

  return permissions.some((permission) =>
    permissionSet.has(permission.toLowerCase()),
  );
}

function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing bearer token" });
  }

  const token = header.slice("Bearer ".length).trim();

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { user?: TokenUser };

    if (!decoded?.user) {
      return res.status(401).json({ message: "Invalid token payload" });
    }

    req.authUser = decoded.user;

    return next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

/**
 * Autoriza por cualquiera de los roles/permisos recibidos.
 *
 * Reglas:
 * 1) Usuario inactivo => 403
 * 2) owner/superadmin => acceso total
 * 3) Si coincide algún permiso o rol requerido => acceso
 */
function authorizeAny(options: {
  roles?: AppRole[];
  permissions?: AppPermission[];
}) {
  const requiredRoles = options.roles || [];
  const requiredPermissions = options.permissions || [];

  return (req: AuthRequest, res: Response, next: NextFunction) => {
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

// ---------------------------
// Ejemplo de contratos auth
// ---------------------------
app.post("/auth/login", (_req: Request, res: Response) => {
  const user: TokenUser = {
    _id: "u_123",
    fullName: "Ana Perez",
    email: "ana@empresa.com",
    isActive: true,
    roles: ["purchasing_manager"],
    permissions: ["purchases:manage", "supplies:read"],
  };

  const token = jwt.sign({ user }, JWT_SECRET, { expiresIn: "8h" });

  return res.json({ token, user });
});

app.get("/auth/me", authenticate, (req: AuthRequest, res: Response) => {
  return res.json({ user: req.authUser });
});

// ---------------------------
// SUPPLIES
// ---------------------------
app.get(
  "/supplies",
  authenticate,
  authorizeAny({
    roles: ["admin", "inventory_manager"],
    permissions: ["supplies:*", "supplies:read", "supplies:manage"],
  }),
  (_req, res) => res.json([]),
);

app.post(
  "/supplies",
  authenticate,
  authorizeAny({
    roles: ["admin", "inventory_manager"],
    permissions: ["supplies:*", "supplies:manage", "supplies:update"],
  }),
  (_req, res) => res.status(201).json({ ok: true }),
);

app.post(
  "/supplies/:id/movements",
  authenticate,
  authorizeAny({
    roles: ["admin", "inventory_manager"],
    permissions: ["supplies:*", "supplies:manage", "supplies:update"],
  }),
  (_req, res) => res.status(201).json({ ok: true }),
);

// ---------------------------
// PURCHASES
// ---------------------------
app.get(
  "/purchases",
  authenticate,
  authorizeAny({
    roles: ["admin", "purchasing_manager"],
    permissions: ["purchases:*", "purchases:read", "purchases:manage"],
  }),
  (_req, res) => res.json([]),
);

app.post(
  "/purchases",
  authenticate,
  authorizeAny({
    roles: ["admin", "purchasing_manager"],
    permissions: ["purchases:*", "purchases:manage", "purchases:update"],
  }),
  (_req, res) => res.status(201).json({ ok: true }),
);

app.post(
  "/purchases/:id/confirm",
  authenticate,
  authorizeAny({
    roles: ["admin", "purchasing_manager"],
    permissions: ["purchases:*", "purchases:manage", "purchases:update"],
  }),
  (_req, res) => res.json({ ok: true }),
);

app.post(
  "/purchases/:id/receive",
  authenticate,
  authorizeAny({
    roles: ["admin", "purchasing_manager"],
    permissions: ["purchases:*", "purchases:manage", "purchases:update"],
  }),
  (_req, res) => res.json({ ok: true }),
);

app.post(
  "/purchases/:id/cancel",
  authenticate,
  authorizeAny({
    roles: ["admin", "purchasing_manager"],
    permissions: ["purchases:*", "purchases:manage", "purchases:update"],
  }),
  (_req, res) => res.json({ ok: true }),
);

// ---------------------------
// SUPPLIER ACCOUNT
// ---------------------------
app.get(
  "/suppliers/:id/account",
  authenticate,
  authorizeAny({
    roles: ["admin", "accounting_manager"],
    permissions: [
      "supplier-account:*",
      "supplier-account:read",
      "supplier-account:manage",
    ],
  }),
  (_req, res) => res.json({ entries: [], balance: 0 }),
);

app.post(
  "/suppliers/:id/account/payment",
  authenticate,
  authorizeAny({
    roles: ["admin", "accounting_manager"],
    permissions: [
      "supplier-account:*",
      "supplier-account:manage",
      "supplier-account:update",
    ],
  }),
  (_req, res) => res.status(201).json({ ok: true }),
);

app.post(
  "/suppliers/:id/account/entry",
  authenticate,
  authorizeAny({
    roles: ["admin", "accounting_manager"],
    permissions: [
      "supplier-account:*",
      "supplier-account:manage",
      "supplier-account:update",
    ],
  }),
  (_req, res) => res.status(201).json({ ok: true }),
);

app.get(
  "/suppliers/:id/account/statement",
  authenticate,
  authorizeAny({
    roles: ["admin", "accounting_manager"],
    permissions: [
      "supplier-account:*",
      "supplier-account:read",
      "supplier-account:manage",
    ],
  }),
  (_req, res) => res.json({ entries: [], balance: 0 }),
);

export { app, authenticate, authorizeAny };
