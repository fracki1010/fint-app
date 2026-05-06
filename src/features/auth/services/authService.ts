import api, {
  AUTH_CLEARED_EVENT,
  AUTH_TOKEN_STORAGE_KEY,
  AUTH_USER_STORAGE_KEY,
} from "@shared/api/axios";
import { AuthUser } from "@features/auth/types";

export async function loginUser(email: string, password: string) {
  const response = await api.post<{ token: string; user: AuthUser }>(
    "/auth/login",
    { email, password },
  );
  return response.data;
}

export async function fetchCurrentUser() {
  const response = await api.get<{ user: AuthUser }>("/auth/me");
  return response.data;
}

export function persistAuth(token: string, user: AuthUser) {
  localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
  localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  localStorage.removeItem(AUTH_USER_STORAGE_KEY);
  window.dispatchEvent(new Event(AUTH_CLEARED_EVENT));
}

export function getStoredToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
}

export function getStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(AUTH_USER_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    clearAuth();
    return null;
  }
}
