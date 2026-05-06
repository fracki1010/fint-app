export type UserRole = "admin" | "ventas" | "deposito" | "contabilidad" | "lectura";

export interface TenantInfo {
  _id: string;
  name: string;
  plan: "essential" | "business" | "enterprise";
  status: string;
  limits: {
    maxUsers: number;
    maxProducts: number;
    maxOrdersPerMonth: number;
  };
  enabledFeatures: string[];
  usage: {
    currentUsers: number;
    currentProducts: number;
    ordersThisMonth: number;
  };
  trialEndsAt?: string;
}

export interface AuthUser {
  _id: string;
  fullName: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  isSuperAdmin?: boolean;
  tenant?: TenantInfo;
}

export interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}
