import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import api, {
  AUTH_CLEARED_EVENT,
  AUTH_TOKEN_STORAGE_KEY,
  AUTH_USER_STORAGE_KEY,
  clearAuthStorage,
} from "@/api/axios";

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

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
      const storedUser = localStorage.getItem(AUTH_USER_STORAGE_KEY);

      if (!storedToken) {
        setLoading(false);

        return;
      }

      setToken(storedToken);

      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser) as AuthUser);
        } catch {
          clearAuthStorage();
          setToken(null);
          setUser(null);
          setLoading(false);

          return;
        }
      }

      try {
        const response = await api.get<{ user: AuthUser }>("/auth/me");

        if (response.data?.user) {
          localStorage.setItem(
            AUTH_USER_STORAGE_KEY,
            JSON.stringify(response.data.user),
          );
          setUser(response.data.user);
        }
      } catch {
        clearAuthStorage();
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    void initializeAuth();
  }, []);

  useEffect(() => {
    const syncAuthState = () => {
      const storedToken = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
      const storedUser = localStorage.getItem(AUTH_USER_STORAGE_KEY);

      setToken(storedToken);
      if (!storedUser) {
        setUser(null);

        return;
      }

      try {
        setUser(JSON.parse(storedUser) as AuthUser);
      } catch {
        setUser(null);
      }
    };

    window.addEventListener(AUTH_CLEARED_EVENT, syncAuthState);
    window.addEventListener("storage", syncAuthState);

    return () => {
      window.removeEventListener(AUTH_CLEARED_EVENT, syncAuthState);
      window.removeEventListener("storage", syncAuthState);
    };
  }, []);

  const persistAuth = useCallback((nextToken: string, nextUser: AuthUser) => {
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, nextToken);
    localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(nextUser));
    setToken(nextToken);
    setUser(nextUser);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await api.post<{
        token: string;
        user: AuthUser;
      }>("/auth/login", { email, password });

      persistAuth(response.data.token, response.data.user);
    },
    [persistAuth],
  );

  const logout = useCallback(() => {
    clearAuthStorage();
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: Boolean(token && user),
      login,
      logout,
    }),
    [loading, login, logout, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
