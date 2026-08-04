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
vi.mock("@shared/hooks/useExperienceMode", () => ({
  useExperienceMode: vi.fn(),
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
import { useExperienceMode } from "@shared/hooks/useExperienceMode";
import { useThemeStore } from "@shared/stores/themeStore";
import { useNotifications } from "@features/notifications/hooks/useNotifications";

import MobileLayout from "./MobileLayout";

function setupMocks(mode: "simple" | "intermediate" | "full") {
  (useAuth as any).mockReturnValue({
    user: {
      fullName: "Test User",
      isSuperAdmin: false,
      tenant: {
        experienceMode: mode,
        enabledFeatures: ["client_account", "financial_center"],
      },
    },
    logout: vi.fn(),
  });
  (usePermissions as any).mockReturnValue({
    can: { viewFinancial: true, manageTeam: false },
    roleLabel: "Admin",
  });
  (usePlanFeatures as any).mockReturnValue({
    hasFeature: (f: string) => true,
  });
  (useExperienceMode as any).mockReturnValue({
    mode,
    isSimple: mode === "simple",
    isIntermediate: mode === "intermediate",
    isFull: mode === "full",
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

describe("MobileLayout — mode gating", () => {
  it("shows Compras section for intermediate mode", () => {
    setupMocks("intermediate");

    render(
      <MemoryRouter>
        <MobileLayout />
      </MemoryRouter>,
    );

    const instances = screen.getAllByText("Compras");
    expect(instances.length).toBeGreaterThanOrEqual(1);
  });

  it("hides Compras section for simple mode", () => {
    setupMocks("simple");

    render(
      <MemoryRouter>
        <MobileLayout />
      </MemoryRouter>,
    );

    expect(screen.queryAllByText("Compras")).toHaveLength(0);
  });

  it("shows Centro Financiero section for full mode", () => {
    setupMocks("full");

    render(
      <MemoryRouter>
        <MobileLayout />
      </MemoryRouter>,
    );

    const instances = screen.getAllByText("Centro Financiero");
    expect(instances.length).toBeGreaterThanOrEqual(1);
  });

  it("hides Centro Financiero section for intermediate mode", () => {
    setupMocks("intermediate");

    render(
      <MemoryRouter>
        <MobileLayout />
      </MemoryRouter>,
    );

    expect(screen.queryAllByText("Centro Financiero")).toHaveLength(0);
  });
});
