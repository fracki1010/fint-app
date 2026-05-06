import axios from "axios";

export const AUTH_TOKEN_STORAGE_KEY = "fint_auth_token";
export const AUTH_USER_STORAGE_KEY = "fint_auth_user";
export const AUTH_CLEARED_EVENT = "fint:auth-cleared";

export function clearAuthStorage() {
  localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  localStorage.removeItem(AUTH_USER_STORAGE_KEY);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_CLEARED_EVENT));
  }
}

const resolveApiBaseUrl = (value?: string) => {
  const fallback = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  if (!value) return fallback;

  const cleaned = value.replace(/\/+$/, "");

  if (cleaned.endsWith("/api")) return cleaned;

  return `${cleaned}/api`;
};

const api = axios.create({
  baseURL: resolveApiBaseUrl(import.meta.env.VITE_API_URL),
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const requestUrl = String(error?.config?.url || "");
    const isAuthLoginRequest = requestUrl.includes("/auth/login");

    if (status === 401 && !isAuthLoginRequest) {
      clearAuthStorage();
      if (window.location.pathname !== "/login") {
        window.location.replace("/login");
      }
    }

    return Promise.reject(error);
  },
);

export default api;
