import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import ModeGuard from "./ModeGuard";

vi.mock("@shared/hooks/useExperienceMode", () => ({
  useExperienceMode: vi.fn(),
}));

vi.mock("@features/notifications/components/AppToast", () => ({
  useAppToast: vi.fn(() => ({ showToast: vi.fn() })),
}));

import { useExperienceMode } from "@shared/hooks/useExperienceMode";

function mockMode(mode: "simple" | "intermediate" | "full") {
  (useExperienceMode as any).mockReturnValue({
    mode,
    isSimple: mode === "simple",
    isIntermediate: mode === "intermediate",
    isFull: mode === "full",
  });
}

const MODE_RANK: Record<string, number> = {
  simple: 0,
  intermediate: 1,
  full: 2,
};

describe("ModeGuard", () => {
  it("renders children when mode meets minMode requirement", () => {
    mockMode("full");

    render(
      <MemoryRouter>
        <ModeGuard minMode="intermediate">
          <p>Protected Content</p>
        </ModeGuard>
      </MemoryRouter>,
    );

    expect(screen.getByText("Protected Content")).toBeInTheDocument();
  });

  it("renders children when mode equals minMode", () => {
    mockMode("intermediate");

    render(
      <MemoryRouter>
        <ModeGuard minMode="intermediate">
          <p>Intermediate Content</p>
        </ModeGuard>
      </MemoryRouter>,
    );

    expect(screen.getByText("Intermediate Content")).toBeInTheDocument();
  });

  it("redirects to '/' when mode is insufficient for minMode", () => {
    mockMode("simple");

    render(
      <MemoryRouter initialEntries={["/purchases"]}>
        <ModeGuard minMode="intermediate">
          <p>Purchase Page</p>
        </ModeGuard>
      </MemoryRouter>,
    );

    // Children should NOT render
    expect(screen.queryByText("Purchase Page")).not.toBeInTheDocument();
  });

  it("redirects simple user trying to access full-only route", () => {
    mockMode("simple");

    render(
      <MemoryRouter initialEntries={["/banking"]}>
        <ModeGuard minMode="full">
          <p>Banking Page</p>
        </ModeGuard>
      </MemoryRouter>,
    );

    expect(screen.queryByText("Banking Page")).not.toBeInTheDocument();
  });

  it("blocks intermediate user from full-only route", () => {
    mockMode("intermediate");

    render(
      <MemoryRouter initialEntries={["/financial/dashboard"]}>
        <ModeGuard minMode="full">
          <p>Financial Dashboard</p>
        </ModeGuard>
      </MemoryRouter>,
    );

    expect(screen.queryByText("Financial Dashboard")).not.toBeInTheDocument();
  });
});
