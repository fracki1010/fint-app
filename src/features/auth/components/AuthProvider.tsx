import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AUTH_CLEARED_EVENT,
  AUTH_TOKEN_STORAGE_KEY,
} from "@shared/api/axios";
import {
  AuthUser,
  AuthContextValue,
} from "@features/auth/types";
import {
  loginUser,
  fetchCurrentUser,
  persistAuth,
  clearAuth,
  getStoredToken,
  getStoredUser,
} from "@features/auth/services/authService";

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = getStoredToken();
      const storedUser = getStoredUser();

      if (!storedToken) {
        setLoading(false);
        return;
      }

      setToken(storedToken);

      if (storedUser) {
        setUser(storedUser);
      }

      try {
        const data = await fetchCurrentUser();
        if (data?.user) {
          persistAuthToken(data.user);
        }
      } catch {
        clearAuth();
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
      const storedUser = getStoredUser();

      setToken(storedToken);
      setUser(storedUser);
    };

    window.addEventListener(AUTH_CLEARED_EVENT, syncAuthState);
    window.addEventListener("storage", syncAuthState);

    return () => {
      window.removeEventListener(AUTH_CLEARED_EVENT, syncAuthState);
      window.removeEventListener("storage", syncAuthState);
    };
  }, []);

  const persistAuthToken = useCallback((nextUser: AuthUser) => {
    const nextToken = getStoredToken();
    if (nextToken) {
      persistAuth(nextToken, nextUser);
      setUser(nextUser);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await loginUser(email, password);
    persistAuth(data.token, data.user);
    setToken(data.token);
    setUser(data.user);
  }, []);

  const logout = useCallback(() => {
    clearAuth();
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
