// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock("@shared/hooks/usePlanFeatures", () => ({
  usePlanFeatures: vi.fn(),
}));

import { usePlanFeatures } from "@shared/hooks/usePlanFeatures";
import UpgradeRequired from "./UpgradeRequired";

describe("UpgradeRequired", () => {
  it("shows complement CTA for feature that needs a complement", () => {
    (usePlanFeatures as any).mockReturnValue({
      plan: "app_base",
      features: ["client_account", "supplier_account", "quotes", "banking"],
    });

    render(<UpgradeRequired feature="team_management" />);

    expect(screen.getByText("Función no disponible")).toBeTruthy();
    expect(screen.getByText("Gestión de Equipo no está incluida en tu plan actual.")).toBeTruthy();
    expect(screen.getByText("Team 10")).toBeTruthy();
    expect(screen.getByText(/Activar Team 10/)).toBeTruthy();
  });

  it("shows App Base CTA for feature included in App Base", () => {
    (usePlanFeatures as any).mockReturnValue({
      plan: "app_base",
      features: ["client_account", "supplier_account", "quotes", "banking"],
    });

    render(<UpgradeRequired feature="quotes" />);

    expect(screen.getByText("Disponible en App Base")).toBeTruthy();
    expect(screen.getByText("App Base")).toBeTruthy();
    expect(screen.getByText(/Ver complementos/)).toBeTruthy();
  });

  it("renders benefits list", () => {
    (usePlanFeatures as any).mockReturnValue({
      plan: "app_base",
      features: [],
    });

    render(<UpgradeRequired feature="api_access" />);

    expect(screen.getByText("Acceso a API")).toBeTruthy();
    expect(screen.getByText("Soporte prioritario")).toBeTruthy();
    expect(screen.getByText("Actualizaciones automáticas")).toBeTruthy();
  });

  it("navigates to company page on CTA click", () => {
    mockNavigate.mockClear();

    (usePlanFeatures as any).mockReturnValue({
      plan: "app_base",
      features: [],
    });

    render(<UpgradeRequired feature="recipes" />);

    const ctaButton = screen.getByText(/Activar Módulo de Producción/);
    fireEvent.click(ctaButton);

    expect(mockNavigate).toHaveBeenCalledWith("/admin/company");
  });
});
