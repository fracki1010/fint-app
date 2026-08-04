import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import { ExperienceModeBanner } from "./ExperienceModeBanner";

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

describe("ExperienceModeBanner", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("shows banner for intermediate mode when not dismissed", () => {
    mockMode("intermediate");

    render(<ExperienceModeBanner />);

    expect(screen.getByText(/Tu experiencia se amplió/)).toBeInTheDocument();
    expect(screen.getByText(/Compras, Proveedores/)).toBeInTheDocument();
  });

  it("shows banner for full mode when not dismissed", () => {
    mockMode("full");

    render(<ExperienceModeBanner />);

    expect(screen.getByText(/Tu experiencia se amplió/)).toBeInTheDocument();
  });

  it("does not show banner for simple mode", () => {
    mockMode("simple");

    const { container } = render(<ExperienceModeBanner />);

    expect(container.firstChild).toBeNull();
  });

  it("hides banner after dismiss and persists in localStorage", () => {
    mockMode("intermediate");

    const { container, rerender } = render(<ExperienceModeBanner />);

    // Banner should be visible initially
    expect(screen.getByText(/Tu experiencia se amplió/)).toBeInTheDocument();

    // Dismiss
    const dismissButton = screen.getByText("Entendido");
    fireEvent.click(dismissButton);

    // localStorage should have the key
    expect(localStorage.getItem("fint_mode_banner_dismissed_intermediate")).toBe("true");

    // Rerender — banner should now be hidden
    const { container: container2 } = render(<ExperienceModeBanner />);
    expect(container2.firstChild).toBeNull();
  });

  it("shows banner again when mode changes (different localStorage key)", () => {
    // First dismiss intermediate
    localStorage.setItem("fint_mode_banner_dismissed_intermediate", "true");
    mockMode("full");

    render(<ExperienceModeBanner />);

    // Full mode banner should show (different key)
    expect(screen.getByText(/Tu experiencia se amplió/)).toBeInTheDocument();
  });
});
