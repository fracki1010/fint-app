import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// jsdom polyfills
Element.prototype.scrollTo = vi.fn();
window.scrollTo = vi.fn();

vi.mock("@features/auth/hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));
vi.mock("@features/auth/hooks/usePermissions", () => ({
  usePermissions: vi.fn(),
}));
vi.mock("@shared/hooks/usePlanFeatures", () => ({
  usePlanFeatures: vi.fn(),
}));
vi.mock("@shared/stores/themeStore", () => ({
  useThemeStore: vi.fn(),
}));
vi.mock("@features/notifications/hooks/useNotifications", () => ({
  useNotifications: vi.fn(),
}));

import { useAuth } from "@features/auth/hooks/useAuth";
import { usePermissions } from "@features/auth/hooks/usePermissions";
import { usePlanFeatures } from "@shared/hooks/usePlanFeatures";
import { useThemeStore } from "@shared/stores/themeStore";
import { useNotifications } from "@features/notifications/hooks/useNotifications";

import MobileLayout from "./MobileLayout";

function setupMocks(enabledFeatures: string[], canViewFinancial = true) {
  (useAuth as any).mockReturnValue({
    user: {
      fullName: "Test User",
      isSuperAdmin: false,
      tenant: { enabledFeatures },
    },
    logout: vi.fn(),
  });
  (usePermissions as any).mockReturnValue({
    can: { viewFinancial: canViewFinancial, manageTeam: false },
    roleLabel: "Admin",
  });
  (usePlanFeatures as any).mockReturnValue({
    hasFeature: (f: string) => enabledFeatures.includes(f),
  });
  (useThemeStore as any).mockReturnValue({
    theme: "light",
    toggleTheme: vi.fn(),
  });
  (useNotifications as any).mockReturnValue({
    notifications: [],
    unreadCount: 0,
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
  });
}

describe("MobileLayout — plan gating", () => {
  it("shows Compras in the base plan, without any complement", () => {
    setupMocks([]);

    render(
      <MemoryRouter>
        <MobileLayout />
      </MemoryRouter>,
    );

    expect(screen.getAllByText("Compras").length).toBeGreaterThanOrEqual(1);
  });

  it("shows Centro Financiero only when the plan includes financial_center", () => {
    setupMocks(["financial_center", "team_management"]);

    render(
      <MemoryRouter>
        <MobileLayout />
      </MemoryRouter>,
    );

    expect(screen.getAllByText("Centro Financiero").length).toBeGreaterThanOrEqual(1);
  });

  it("hides Centro Financiero when the plan does not include financial_center", () => {
    setupMocks([]);

    render(
      <MemoryRouter>
        <MobileLayout />
      </MemoryRouter>,
    );

    expect(screen.queryAllByText("Centro Financiero")).toHaveLength(0);
  });
});
