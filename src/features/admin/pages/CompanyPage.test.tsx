// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
  useSearchParams: () => [new URLSearchParams(), vi.fn()],
}));

vi.mock("@features/settings/hooks/useSettings", () => ({
  useSettings: vi.fn(),
}));

vi.mock("@features/notifications/components/AppToast", () => ({
  useAppToast: () => ({ showToast: vi.fn() }),
}));

vi.mock("@features/superadmin/hooks/useTenantPlan", () => ({
  useTenantPlan: vi.fn(),
  useActivateComplements: vi.fn(),
}));

vi.mock("@features/sales/hooks/useCreatePaymentPreference", () => ({
  useCreatePaymentPreference: vi.fn(),
}));

import { useSettings } from "@features/settings/hooks/useSettings";
import { useTenantPlan, useActivateComplements } from "@features/superadmin/hooks/useTenantPlan";
import { useCreatePaymentPreference } from "@features/sales/hooks/useCreatePaymentPreference";

import CompanyPage from "./CompanyPage";

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("CompanyPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    (useSettings as any).mockReturnValue({
      settings: { storeName: "Test Store", taxId: "", fiscalCondition: "", address: "", phone: "", email: "" },
      loading: false,
      error: null,
      updateSettings: vi.fn(),
      isUpdating: false,
    });

    (useTenantPlan as any).mockReturnValue({
      plan: {
        current: "app_base",
        complements: [],
        limits: { maxUsers: 1, maxProducts: 200, maxOrdersPerMonth: 500 },
        usage: { currentUsers: 1, currentProducts: 50, ordersThisMonth: 20 },
        usagePercentages: { users: 100, products: 25, orders: 4 },
        billing: { email: "test@example.com", paymentStatus: "paid" },
        trialEndsAt: null,
      },
      availableComplements: [
        { id: "expansion", name: "Expansión de Límites", price: 100, features: ["unlimited_products"] },
        { id: "team_10", name: "Team 10", price: 100, features: ["team_management"] },
      ],
      loading: false,
      error: null,
    });

    (useActivateComplements as any).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });

    (useCreatePaymentPreference as any).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });
  });

  it("renders App Base card and complement marketplace", () => {
    render(<CompanyPage />, { wrapper: createWrapper() });

    expect(screen.getAllByText("App Base").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Complementos")).toBeTruthy();
    expect(screen.getByText("Expansión de Límites")).toBeTruthy();
    expect(screen.getByText("Team 10")).toBeTruthy();
  });

  it("renders usage bars for users, products, and orders", () => {
    render(<CompanyPage />, { wrapper: createWrapper() });

    expect(screen.getByText("Usuarios")).toBeTruthy();
    expect(screen.getByText("Productos")).toBeTruthy();
    expect(screen.getByText("Ventas (mes)")).toBeTruthy();
  });

  it("toggles a complement on click", () => {
    render(<CompanyPage />, { wrapper: createWrapper() });

    const toggle = screen.getByText("Expansión de Límites").closest("button");
    expect(toggle).toBeTruthy();

    fireEvent.click(toggle!);

    // After toggle, the "Activar gratis" / "Continuar al pago" button should appear
    expect(screen.getByText(/Continuar al pago|Activar gratis/)).toBeTruthy();
  });

  it("renders billing section when billing data exists", () => {
    render(<CompanyPage />, { wrapper: createWrapper() });

    expect(screen.getByText(/Facturación/i)).toBeTruthy();
    expect(screen.getByText(/test@example.com/)).toBeTruthy();
  });

  it("shows trial banner when tenant is in trial", () => {
    (useTenantPlan as any).mockReturnValue({
      plan: {
        current: "app_base",
        complements: [],
        limits: { maxUsers: 1, maxProducts: 200, maxOrdersPerMonth: 500 },
        usage: { currentUsers: 1, currentProducts: 0, ordersThisMonth: 0 },
        usagePercentages: { users: 100, products: 0, orders: 0 },
        billing: { email: "", paymentStatus: "pending" },
        trialEndsAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
      availableComplements: [
        { id: "expansion", name: "Expansión de Límites", price: 100, features: ["unlimited_products"] },
      ],
      loading: false,
      error: null,
    });

    render(<CompanyPage />, { wrapper: createWrapper() });

    expect(screen.getByText(/Trial/)).toBeTruthy();
  });

  it("shows plan loading state", () => {
    (useTenantPlan as any).mockReturnValue({
      plan: null,
      availableComplements: [],
      loading: true,
      error: null,
    });

    render(<CompanyPage />, { wrapper: createWrapper() });

    // Loader should be present in plan section
    const loaders = document.querySelectorAll("svg");
    expect(loaders.length).toBeGreaterThan(0);
  });
});
