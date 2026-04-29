export type AppRole =
  | "owner"
  | "superadmin"
  | "admin"
  | "inventory_manager"
  | "purchasing_manager"
  | "accounting_manager";

export type AppPermission =
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

export type AuthUser = {
  _id: string;
  fullName: string;
  email: string;
  isActive: boolean;
  role?: string;
  roles?: string[];
  permissions?: string[];
};
